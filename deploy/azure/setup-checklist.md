# Azure Neural Setup Checklist

Use this checklist when setting up Azure for the ViperMesh neural services.

## Recommended Target

- Compute: Azure Container Apps with serverless GPUs
- Registry: Azure Container Registry
- CI/CD: GitHub Actions with Azure OIDC
- Region: `Sweden Central`

Why `Sweden Central`:
- Container Apps serverless GPU docs currently list both `T4` and `A100` there
- `West Europe` is currently `T4` only for serverless GPUs

## Quota First

Before creating the apps, request quota in the target region.

For Container Apps serverless GPUs:
- `Managed Environment Consumption T4 Gpus`: request `4`
- `Managed Environment Consumption NCA100 Gpus`: request `2`

For AKS fallback:
- `Standard NCASv3_T4 Family vCPUs`: request at least `16`
- `Standard NCADS_A100_v4 Family vCPUs`: request at least `48`
- total regional standard vCPU quota: request at least `64`

The AKS numbers above assume:
- `4 x Standard_NC4as_T4_v3` nodes for the lighter GPU lane
- `2 x Standard_NC24ads_A100_v4` nodes for the heavy GPU lane

## Azure Resource Setup

1. Create a resource group in `Sweden Central`.
2. Create an Azure Container Registry.
   - SKU: `Premium`
3. Create one Azure Container Apps environment in the same region.
4. Create a user-assigned managed identity for the Container Apps, or use system-assigned identities per app.
5. Grant the Container Apps identity pull access to ACR.
   - role: `AcrPull`
6. Decide whether model weights will be:
   - baked into the image, or
   - mounted from Azure storage/cache

## Container Apps To Create

Create three apps, not one combined app:

1. `hunyuan-shape-api`
- GPU lane: `T4`
- runtime env target: `HUNYUAN_SHAPE_API_URL`
- start with:
  - `minReplicas=1`
  - `maxReplicas=3`

2. `hunyuan-paint-api`
- GPU lane: `A100`
- runtime env target: `HUNYUAN_PAINT_API_URL`
- start with:
  - `minReplicas=1`
  - `maxReplicas=1`
- after stability:
  - `maxReplicas=2`

3. `hunyuan-part-api`
- GPU lane: `T4`
- runtime env target: `HUNYUAN_PART_URL`
- start with:
  - `minReplicas=0`
  - `maxReplicas=2`

## GitHub Setup

Set these GitHub secrets:
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Set these GitHub variables:
- `AZURE_RESOURCE_GROUP`
- `AZURE_ACR_NAME`
- `AZURE_CONTAINER_APP_HUNYUAN_SHAPE`
- `AZURE_CONTAINER_APP_HUNYUAN_PAINT`
- `AZURE_CONTAINER_APP_HUNYUAN_PART`

## Runtime App Config

Preferred runtime env vars:
- `HUNYUAN_SHAPE_API_URL`
- `HUNYUAN_PAINT_API_URL`
- `HUNYUAN_PART_URL`

Backward-compatible fallback:
- `HUNYUAN_API_URL`

The app now supports the dedicated shape/paint URLs first and falls back to the
legacy shared Hunyuan URL only if the dedicated vars are unset.

## Deployment Order

1. Stabilize ACR and Azure login from GitHub Actions.
2. Build the future Azure HTTP image for `hunyuan-shape-api`.
3. Build the future Azure HTTP image for `hunyuan-paint-api`.
4. Deploy `hunyuan-paint-api` first and verify one successful request.
5. Deploy `hunyuan-shape-api`.
6. Deploy `hunyuan-part-api`.
7. Switch ViperMesh env vars from RunPod to Azure.

## Do Not Do Yet

- Do not point Azure directly at `deploy/runpod/**`.
- Do not start with AKS unless Container Apps proves insufficient.
- Do not keep shape and paint combined on one service unless you accept paying
  A100 prices for shape traffic too.
