# Hunyuan API (Azure Target)

This folder is reserved for the Azure-ready HTTP image that will serve:
- `POST /generate`
- `POST /texturize`
- `GET /health`

It should replace the current RunPod worker assumption for the shared:
- `HUNYUAN_API_URL`

Do not point Azure Container Apps at `deploy/runpod/hunyuan-paint` directly.
That image is a RunPod worker, not an HTTP container app.
