import base64
import binascii
import os
import secrets
import sys
import tempfile
import threading
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field


REPO_DIR = Path(os.environ.get("HUNYUAN_REPO_DIR", "/app/hunyuan3d"))
PAINT_DIR = REPO_DIR / "hy3dpaint"
TEMP_ROOT = Path(os.environ.get("PAINT_WORK_DIR", tempfile.mkdtemp(prefix="azure_paint_")))
API_BEARER_TOKEN = os.environ.get("API_BEARER_TOKEN", "").strip()

if str(REPO_DIR) not in sys.path:
    sys.path.insert(0, str(REPO_DIR))
if str(PAINT_DIR) not in sys.path:
    sys.path.insert(0, str(PAINT_DIR))

try:
    from torchvision_fix import apply_fix as apply_torchvision_fix  # noqa: E402
except ImportError:
    apply_torchvision_fix = None

if apply_torchvision_fix is not None:
    apply_torchvision_fix()

from convert_utils import create_glb_with_pbr_materials  # noqa: E402
from textureGenPipeline import Hunyuan3DPaintConfig, Hunyuan3DPaintPipeline  # noqa: E402


class PaintRequest(BaseModel):
    mesh: str = Field(..., description="Base64 encoded input mesh (GLB or OBJ)")
    image: Optional[str] = Field(
        default=None,
        description="Optional style/reference image as a data URL or base64 string",
    )
    output_format: str = Field(default="glb", pattern="^(glb|obj)$")


MODEL = None
MODEL_LOCK = threading.Lock()


def require_auth(authorization: str | None) -> None:
    if not API_BEARER_TOKEN:
        return

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    provided_token = authorization.removeprefix("Bearer ").strip()
    if not secrets.compare_digest(provided_token, API_BEARER_TOKEN):
        raise HTTPException(status_code=401, detail="Invalid bearer token")


def _decode_base64_payload(value: str) -> bytes:
    payload = value.split(",", 1)[1] if value.startswith("data:") and "," in value else value
    try:
        return base64.b64decode(payload)
    except (ValueError, binascii.Error) as exc:
        raise HTTPException(status_code=422, detail=f"Invalid base64 payload: {exc}") from exc


def _write_temp_file(prefix: str, suffix: str, content: bytes) -> Path:
    TEMP_ROOT.mkdir(parents=True, exist_ok=True)
    path = TEMP_ROOT / f"{prefix}_{uuid.uuid4().hex[:10]}{suffix}"
    path.write_bytes(content)
    return path


def load_model():
    global MODEL
    if MODEL is not None:
        return MODEL

    with MODEL_LOCK:
        if MODEL is not None:
            return MODEL

        max_num_view = int(os.environ.get("PAINT_MAX_NUM_VIEW", "6"))
        resolution = int(os.environ.get("PAINT_RESOLUTION", "512"))
        config = Hunyuan3DPaintConfig(max_num_view=max_num_view, resolution=resolution)
        MODEL = Hunyuan3DPaintPipeline(config)
        return MODEL


def _resolve_output_path(result, output_path: Path) -> Path:
    if output_path.exists():
        return output_path

    if isinstance(result, (str, Path)):
        candidate = Path(result)
        if candidate.exists():
            return candidate

    if isinstance(result, dict):
        for key in ("output_path", "mesh_path", "result_path"):
            value = result.get(key)
            if value:
                candidate = Path(value)
                if candidate.exists():
                    return candidate

    if hasattr(result, "export"):
        result.export(str(output_path))
        if output_path.exists():
            return output_path

    raise HTTPException(status_code=500, detail="Paint pipeline completed without producing an output file.")


def _run_paint_pipeline(mesh_path: Path, image_path: Optional[Path], output_path: Path):
    model = load_model()
    kwargs = {}
    if image_path is not None:
        kwargs["image_path"] = str(image_path)

    try:
        return model(mesh_path=str(mesh_path), output_mesh_path=str(output_path), save_glb=False, **kwargs)
    except TypeError:
        try:
            return model(str(mesh_path), output_mesh_path=str(output_path), save_glb=False, **kwargs)
        except TypeError:
            return model(str(mesh_path), **kwargs)


def _convert_obj_output_to_glb(obj_path: Path, output_path: Path) -> Path:
    textures = {
        "albedo": str(obj_path.with_suffix(".jpg")),
        "metallic": str(obj_path.with_name(f"{obj_path.stem}_metallic.jpg")),
        "roughness": str(obj_path.with_name(f"{obj_path.stem}_roughness.jpg")),
    }

    normal_path = obj_path.with_name(f"{obj_path.stem}_normal.jpg")
    if normal_path.exists():
        textures["normal"] = str(normal_path)

    create_glb_with_pbr_materials(str(obj_path), textures, str(output_path))
    if not output_path.exists():
        raise HTTPException(status_code=500, detail="Paint pipeline did not produce a GLB output.")
    return output_path


app = FastAPI(
    title="Hunyuan Paint API",
    description="Azure-friendly mesh-to-texture wrapper for Hunyuan3D Paint 2.1",
    version="0.1.0",
)


@app.get("/health")
async def health():
    return JSONResponse(
        {
            "status": "healthy",
            "model_loaded": MODEL is not None,
            "repo_dir": str(REPO_DIR),
            "token_configured": bool(API_BEARER_TOKEN),
        },
        status_code=200,
    )


@app.post("/texturize")
async def texturize(request: PaintRequest, authorization: str | None = Header(default=None)):
    require_auth(authorization)

    mesh_bytes = _decode_base64_payload(request.mesh)
    image_bytes = _decode_base64_payload(request.image) if request.image else None

    mesh_suffix = ".obj" if request.mesh.startswith("data:model/obj") else ".glb"
    mesh_path = _write_temp_file("mesh", mesh_suffix, mesh_bytes)
    image_path = _write_temp_file("image", ".png", image_bytes) if image_bytes else None
    output_obj_path = TEMP_ROOT / f"paint_{uuid.uuid4().hex[:10]}.obj"
    output_glb_path = TEMP_ROOT / f"paint_{uuid.uuid4().hex[:10]}.glb"

    try:
        result = _run_paint_pipeline(mesh_path, image_path, output_obj_path)
        final_output = _resolve_output_path(result, output_obj_path)
        if request.output_format == "glb":
            final_output = _convert_obj_output_to_glb(final_output, output_glb_path)
        return FileResponse(
            str(final_output),
            media_type="model/gltf-binary" if request.output_format == "glb" else "application/octet-stream",
            filename=final_output.name,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Hunyuan Paint failed: {exc}") from exc
