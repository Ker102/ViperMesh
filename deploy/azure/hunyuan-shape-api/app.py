import os
import secrets

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse, Response


INTERNAL_API_PORT = int(os.environ.get("SHAPE_INTERNAL_PORT", "8081"))
INTERNAL_API_BASE_URL = os.environ.get(
    "SHAPE_INTERNAL_API_URL",
    f"http://127.0.0.1:{INTERNAL_API_PORT}",
)
API_BEARER_TOKEN = os.environ.get("API_BEARER_TOKEN", "").strip()


app = FastAPI(
    title="Hunyuan Shape API",
    description="Azure-friendly bearer-auth proxy for Hunyuan3D Shape 2.1",
    version="0.1.0",
)


def require_auth(authorization: str | None) -> None:
    if not API_BEARER_TOKEN:
        return

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    provided_token = authorization.removeprefix("Bearer ").strip()
    if not secrets.compare_digest(provided_token, API_BEARER_TOKEN):
        raise HTTPException(status_code=401, detail="Invalid bearer token")


@app.get("/health")
async def health():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{INTERNAL_API_BASE_URL}/health")
        return JSONResponse(
            {
                "status": "healthy" if response.is_success else "degraded",
                "upstream_status": response.status_code,
                "token_configured": bool(API_BEARER_TOKEN),
            },
            status_code=200 if response.is_success else 503,
        )
    except Exception as exc:
        return JSONResponse(
            {
                "status": "unhealthy",
                "token_configured": bool(API_BEARER_TOKEN),
                "error": str(exc),
            },
            status_code=503,
        )


@app.post("/generate")
async def generate(request: Request, authorization: str | None = Header(default=None)):
    require_auth(authorization)

    async with httpx.AsyncClient(timeout=None) as client:
        response = await client.post(
            f"{INTERNAL_API_BASE_URL}/generate",
            content=await request.body(),
            headers={"Content-Type": request.headers.get("content-type", "application/json")},
        )

    return Response(
        content=response.content,
        status_code=response.status_code,
        media_type=response.headers.get("content-type"),
    )
