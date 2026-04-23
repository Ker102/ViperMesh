import base64
import binascii
import io
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
from PIL import Image
from starlette.background import BackgroundTask


REPO_DIR = Path(os.environ.get("HUNYUAN_REPO_DIR", "/app/hunyuan3d"))
HY3DSHAPE_DIR = REPO_DIR / "hy3dshape"
_shape_work_dir = os.environ.get("SHAPE_WORK_DIR")
TEMP_ROOT = Path(_shape_work_dir) if _shape_work_dir else Path(tempfile.mkdtemp(prefix="azure_shape_"))
MODEL_PATH = os.environ.get("MODEL_PATH", "tencent/Hunyuan3D-2.1")
API_BEARER_TOKEN = os.environ.get("API_BEARER_TOKEN", "").strip()
ENABLE_FLASHVDM = os.environ.get("ENABLE_FLASHVDM", "0") == "1"
ENABLE_COMPILE = os.environ.get("ENABLE_COMPILE", "0") == "1"
FLASHVDM_MC_ALGO = os.environ.get("FLASHVDM_MC_ALGO", "mc")

if not API_BEARER_TOKEN:
    raise RuntimeError("API_BEARER_TOKEN must be configured for the Hunyuan Shape API.")

if str(HY3DSHAPE_DIR) not in sys.path:
    sys.path.insert(0, str(HY3DSHAPE_DIR))

from hy3dshape.pipelines import Hunyuan3DDiTFlowMatchingPipeline  # noqa: E402
from hy3dshape.rembg import BackgroundRemover  # noqa: E402


class ShapeRequest(BaseModel):
    image: Optional[str] = Field(
        default=None,
        description="Input image as a data URL or base64 string.",
    )
    text: Optional[str] = Field(
        default=None,
        description="Optional prompt. The self-hosted shape service currently requires an image.",
    )
    output_format: str = Field(default="glb", pattern="^(glb)$")


MODEL = None
BACKGROUND_REMOVER = None
MODEL_LOCK = threading.Lock()
INFERENCE_LOCK = threading.Lock()


def require_auth(authorization: str | None) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    provided_token = authorization.removeprefix("Bearer ").strip()
    if not secrets.compare_digest(provided_token, API_BEARER_TOKEN):
        raise HTTPException(status_code=401, detail="Invalid bearer token")


def _decode_base64_payload(value: str) -> bytes:
    payload = value.split(",", 1)[1] if value.startswith("data:") and "," in value else value
    try:
        return base64.b64decode(payload, validate=True)
    except (ValueError, binascii.Error) as exc:
        raise HTTPException(status_code=422, detail=f"Invalid base64 payload: {exc}") from exc


def _load_model():
    global MODEL, BACKGROUND_REMOVER
    if MODEL is not None and BACKGROUND_REMOVER is not None:
        return MODEL, BACKGROUND_REMOVER

    with MODEL_LOCK:
        if MODEL is None:
            MODEL = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(MODEL_PATH)
            if ENABLE_FLASHVDM:
                MODEL.enable_flashvdm(mc_algo=FLASHVDM_MC_ALGO)
            if ENABLE_COMPILE:
                MODEL.compile()

        if BACKGROUND_REMOVER is None:
            BACKGROUND_REMOVER = BackgroundRemover()

    return MODEL, BACKGROUND_REMOVER


def _prepare_image(image_value: str) -> Image.Image:
    image_bytes = _decode_base64_payload(image_value)
    try:
        source = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Invalid image payload: {exc}") from exc

    had_alpha = "A" in source.getbands()
    source = source.convert("RGBA")
    _, background_remover = _load_model()
    if not had_alpha:
        return background_remover(source)
    return source


def _export_mesh(mesh, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(output_path)
    if not output_path.exists():
        raise HTTPException(status_code=500, detail="Shape pipeline completed without producing an output file.")
    return output_path


def _cleanup_temp_file(candidate: Path) -> None:
    try:
        candidate.unlink(missing_ok=True)
    except OSError:
        pass


app = FastAPI(
    title="Hunyuan Shape API",
    description="Azure-friendly image-to-shape wrapper for Hunyuan3D Shape 2.1",
    version="0.2.0",
)


@app.get("/health")
async def health():
    return JSONResponse(
        {
            "status": "healthy",
            "model_loaded": MODEL is not None,
            "token_configured": bool(API_BEARER_TOKEN),
            "model_path": MODEL_PATH,
        },
        status_code=200,
    )


@app.post("/generate")
def generate(request: ShapeRequest, authorization: str | None = Header(default=None)):
    require_auth(authorization)

    if not request.image:
        raise HTTPException(
            status_code=400,
            detail="The self-hosted Hunyuan Shape service currently requires a reference image.",
        )

    image = _prepare_image(request.image)
    output_path = TEMP_ROOT / f"shape_{uuid.uuid4().hex[:10]}.{request.output_format}"

    try:
        shape_pipeline, _ = _load_model()
        with INFERENCE_LOCK:
            mesh = shape_pipeline(image=image)[0]
        final_output = _export_mesh(mesh, output_path)
        return FileResponse(
            str(final_output),
            media_type="model/gltf-binary",
            filename=final_output.name,
            background=BackgroundTask(_cleanup_temp_file, final_output),
        )
    except HTTPException:
        _cleanup_temp_file(output_path)
        raise
    except Exception as exc:
        _cleanup_temp_file(output_path)
        raise HTTPException(status_code=500, detail=f"Hunyuan Shape failed: {exc}") from exc
