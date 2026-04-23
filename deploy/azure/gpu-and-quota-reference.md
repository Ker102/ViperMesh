# Azure GPU And Quota Reference

This file maps the current ViperMesh neural workload to Azure GPU lanes and
records the exact quota labels to request.

## Container Apps GPU Types

Current relevant serverless GPU types on Azure Container Apps:
- `NVIDIA T4`
- `NVIDIA A100`

Recommended ViperMesh mapping:
- `T4` lane:
  - Hunyuan Shape 2.1
  - Hunyuan Part
- `A100` lane:
  - Hunyuan Paint 2.1
  - TRELLIS 2 if you later self-host it

Current local provider metadata:
- `hunyuan-shape`: `10 GB`
- `hunyuan-paint`: `21 GB`
- `trellis`: `24 GB`
- `unirig`: `16 GB`
- `momask`: `8 GB`
- `meshanything-v2`: `12 GB`

Notes:
- `TRELLIS` is currently served via fal in the product, but if you self-host it later, its current registry metadata puts it on the heavier lane.
- `Hunyuan Part` does not currently declare `vramGb` in `lib/neural/registry.ts`, so keeping it on the lighter lane remains an operational assumption to validate with the real Azure image.

## Container Apps Quota Labels

Request these quota entries in the target region:
- `Managed Environment Consumption T4 Gpus`
- `Managed Environment Consumption NCA100 Gpus`

Recommended starting request:
- `Managed Environment Consumption T4 Gpus = 4`
- `Managed Environment Consumption NCA100 Gpus = 2`

This gives enough headroom for:
- one warm T4 shape worker
- one warm A100 paint worker
- burst room for retries and concurrent interactive jobs

## AKS Fallback GPU VM Sizes

If you move to AKS instead of Container Apps, prefer small one-GPU nodes first.

T4 node:
- `Standard_NC4as_T4_v3`
- GPU: `1 x NVIDIA T4`

A100 node:
- `Standard_NC24ads_A100_v4`
- GPU: `1 x NVIDIA A100 80GB`

Why these sizes:
- they map cleanly to one GPU per node
- they keep scheduling and quota math simple
- they scale better for mixed concurrency than jumping straight to 4-GPU nodes

## AKS Quota Labels

AKS GPU capacity uses Azure compute VM-family vCPU quotas, not AKS-specific GPU quotas.

Request these quota entries:
- `Standard NCASv3_T4 Family vCPUs`
- `Standard NCADS_A100_v4 Family vCPUs`

Recommended starting request:
- `Standard NCASv3_T4 Family vCPUs = 16`
- `Standard NCADS_A100_v4 Family vCPUs = 48`
- total regional standard vCPUs = `64`

That covers:
- `4 x Standard_NC4as_T4_v3`
- `2 x Standard_NC24ads_A100_v4`

## Recommended Choice

Use Azure Container Apps first.

Use AKS only if you later need:
- more custom queueing or routing
- many long-lived GPU services
- stronger control over warm pools and scheduling
- cluster-level observability and node management

## Source Notes

These labels and sizes are grounded in:
- Azure Container Apps serverless GPU docs
- Azure Container Apps quotas docs
- Azure VM family quota docs
- Azure VM size docs for `NCasT4 v3` and `NC_A100_v4`
- Azure error and quota wording surfaced in official Microsoft Q&A for the A100 and T4 families

Useful links:
- https://learn.microsoft.com/en-us/azure/container-apps/gpu-serverless-overview
- https://learn.microsoft.com/en-us/azure/container-apps/quotas
- https://learn.microsoft.com/en-us/azure/quotas/per-vm-quota-requests
- https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nca100v4-series
- https://learn.microsoft.com/en-us/answers/questions/2133321/i-need-to-create-nc24ads-a100-series-gpu-but-when
- https://learn.microsoft.com/ko-kr/answers/questions/5836575/gpu-gpt5
