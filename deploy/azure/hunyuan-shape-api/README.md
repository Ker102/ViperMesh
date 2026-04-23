# Hunyuan Shape API (Azure Target)

This folder is reserved for the Azure-ready HTTP image that will serve:
- `POST /generate`
- `GET /health`

It should become the dedicated shape endpoint for:
- `HUNYUAN_SHAPE_API_URL`

App fallback support:
- if `HUNYUAN_SHAPE_API_URL` is unset, the app still falls back to `HUNYUAN_API_URL`

Current implementation:
- `Dockerfile` runs Tencent's official `api_server.py` from `Hunyuan3D-2.1`
- `start.sh` binds it to `0.0.0.0:${PORT:-8080}` so it fits Azure Container Apps

Do not point Azure Container Apps at the existing RunPod worker images.
They are serverless worker containers, not normal HTTP services.
