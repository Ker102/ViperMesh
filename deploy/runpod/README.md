# RunPod Serverless Deployment Guide

Deploy Hunyuan3D Paint (PBR texturing) and Hunyuan3D Part (mesh segmentation)
as RunPod Serverless endpoints for ViperMesh's neural 3D pipeline.

## Architecture

```
ViperMesh App → runpod-client.ts → RunPod API v2 → Docker Worker → GPU
                                                         ↓
                                                   Model Output (GLB)
                                                         ↓
                                                  RunPod Blob Storage → presigned URL
```

## Prerequisites

- [RunPod account](https://www.runpod.io/) with credits
- GitHub account connected to RunPod

---

## Deploy via GitHub (Recommended)

RunPod can build and deploy Docker images directly from your GitHub repo — no
local Docker or Docker Hub needed.

### Step 1: Connect GitHub to RunPod

1. Go to [console.runpod.io/serverless](https://www.runpod.io/console/serverless)
2. Click **"New Endpoint"**
3. Under **Import GitHub Repository**, click **"Connect GitHub"**
4. Authorize RunPod to access your ViperMesh repo

### Step 2: Deploy Hunyuan Paint Endpoint

1. After connecting, select your **ViperMesh** repo
2. Set the **Dockerfile path** to: `deploy/runpod/hunyuan-paint/Dockerfile`
3. Configure the endpoint:

| Setting | Value |
|---------|-------|
| **Name** | `vipermesh-hunyuan-paint` |
| **GPU Type** | A5000 (24GB) or A6000 (48GB) |
| **Min Workers** | `0` (scale to zero) |
| **Max Workers** | `1` (increase for prod) |
| **Idle Timeout** | `60` seconds |
| **FlashBoot** | ✅ Enabled |
| **Container Disk** | `20 GB` |
| **Volume** | `30 GB` (model cache) |
| **Volume Mount** | `/models` |

4. Click **Deploy** — RunPod builds the Docker image from your repo

### Step 3: Deploy Hunyuan Part Endpoint

Repeat Step 2 with:

| Setting | Value |
|---------|-------|
| **Name** | `vipermesh-hunyuan-part` |
| **Dockerfile path** | `deploy/runpod/hunyuan-part/Dockerfile` |
| **GPU Type** | A4000 (16GB) or A5000 (24GB) |
| **Min Workers** | `0` |
| **Max Workers** | `1` |
| **Idle Timeout** | `60` seconds |
| **FlashBoot** | ✅ Enabled |
| **Container Disk** | `15 GB` |
| **Volume** | `20 GB` |
| **Volume Mount** | `/models` |

### Step 4: Copy Endpoint IDs

After each deploy, grab the **Endpoint ID** from the endpoint URL:
`https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/...`

---

## Configure ViperMesh

Add the endpoint IDs and API key to your `.env`:

```env
# RunPod Serverless
RUNPOD_API_KEY="rpa_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"   # from runpod.io/settings
RUNPOD_ENDPOINT_HUNYUAN_PAINT="abc123def456"               # Endpoint ID from above
RUNPOD_ENDPOINT_HUNYUAN_PART="xyz789ghi012"                # Endpoint ID from above
```

---

## Verify

### Health check

```bash
# Paint
curl -s https://api.runpod.ai/v2/YOUR_PAINT_ENDPOINT_ID/health \
  -H "Authorization: Bearer YOUR_RUNPOD_API_KEY" | jq .

# Part
curl -s https://api.runpod.ai/v2/YOUR_PART_ENDPOINT_ID/health \
  -H "Authorization: Bearer YOUR_RUNPOD_API_KEY" | jq .
```

### Test generation

```bash
curl -X POST https://api.runpod.ai/v2/YOUR_PAINT_ENDPOINT_ID/run \
  -H "Authorization: Bearer YOUR_RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "mesh_url": "https://example.com/your-mesh.glb",
      "prompt": "realistic wood texture with grain detail",
      "texture_resolution": "2K",
      "output_format": "glb"
    }
  }'

# Poll: GET /status/JOB_ID
```

---

## Alternative: Manual Docker Build

If you prefer building locally instead of GitHub deploys:

```bash
cd deploy/runpod/hunyuan-paint
docker build -t YOUR_USER/hunyuan-paint-worker .
docker push YOUR_USER/hunyuan-paint-worker:latest

cd ../hunyuan-part
docker build -t YOUR_USER/hunyuan-part-worker .
docker push YOUR_USER/hunyuan-part-worker:latest
```

Then use **"Import from Docker Registry"** in RunPod instead of GitHub.

---

## Cost Estimates

| Model | GPU | Cost/sec | Typical Job | Est. Cost |
|-------|-----|----------|-------------|-----------|
| Paint | A5000 | ~$0.0002/s | 30-180s | $0.006 – $0.036 |
| Part | A4000 | ~$0.0001/s | 15-60s | $0.002 – $0.006 |

With min workers = 0, you pay **$0 when idle**.

---

## Troubleshooting

### Cold start too slow
- Enable **FlashBoot** (caches Docker layers)
- Set min workers to `1` if latency matters

### Model weight download fails
- Add `ENV HF_TOKEN=your-token` to the Dockerfile if the HF repo requires auth

### Out of VRAM
- Paint: ~21GB → A5000 (24GB) minimum, never T4
- Part: ~10GB → A4000 (16GB) minimum

### Job times out
- Default: 300s (5 min), configurable in `runpod-client.ts`
- For 4K textures: increase to 600s
