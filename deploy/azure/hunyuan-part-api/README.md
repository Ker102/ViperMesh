# Hunyuan Part API (Azure Target)

This folder is reserved for the Azure-ready HTTP image that will serve:
- `POST /segment`
- `GET /health`

It should replace the current RunPod worker assumption for:
- `HUNYUAN_PART_URL`

Current status:
- planned only
- no Azure HTTP service or Dockerfile has been implemented in this folder yet

Do not point Azure Container Apps at `deploy/runpod/hunyuan-part` directly.
That image is a RunPod worker, not an HTTP container app.
