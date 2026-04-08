# Hunyuan Paint API (Azure Target)

This folder is reserved for the Azure-ready HTTP image that will serve:
- `POST /texturize`
- `GET /health`

It should become the dedicated paint endpoint for:
- `HUNYUAN_PAINT_API_URL`

App fallback support:
- if `HUNYUAN_PAINT_API_URL` is unset, the app still falls back to `HUNYUAN_API_URL`

Do not point Azure Container Apps at the existing RunPod worker images.
They are serverless worker containers, not normal HTTP services.
