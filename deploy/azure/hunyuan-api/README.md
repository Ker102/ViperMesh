# Hunyuan API (Legacy Combined Azure Target)

This folder documents the earlier combined-service idea where one Azure service
would expose both:
- `POST /generate`
- `POST /texturize`
- `GET /health`

This is no longer the recommended Azure layout because:
- Hunyuan Shape belongs on the lighter GPU lane
- Hunyuan Paint belongs on the heavier GPU lane

Recommended replacement:
- `deploy/azure/hunyuan-shape-api`
- `deploy/azure/hunyuan-paint-api`

Keep this folder only as a compatibility note while the app still supports the
shared fallback env var:
- `HUNYUAN_API_URL`

Do not point Azure Container Apps at `deploy/runpod/hunyuan-paint` directly.
That image is a RunPod worker, not an HTTP container app.
