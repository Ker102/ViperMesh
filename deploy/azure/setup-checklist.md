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
7. Generate strong bearer tokens for backend-only service access.
   - one token for Shape
   - one token for Paint

## Container Apps To Create

Create these apps first:

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
- avoid `minReplicas=0` during interactive testing; the large GPU image can
  return transient `503 error activating deployment` responses while cold-starting
- after stability:
  - `maxReplicas=2`

Later:

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
- `AZURE_CONTAINER_APP_ENVIRONMENT`
- `AZURE_T4_WORKLOAD_PROFILE`
- `AZURE_A100_WORKLOAD_PROFILE`

Add later when the Part HTTP service exists:
- `AZURE_CONTAINER_APP_HUNYUAN_PART`

## Runtime App Config

Preferred runtime env vars:
- `HUNYUAN_SHAPE_API_URL`
- `HUNYUAN_PAINT_API_URL`
- `HUNYUAN_PART_URL`
- `HUNYUAN_SHAPE_API_TOKEN`
- `HUNYUAN_PAINT_API_TOKEN`

Use HTTPS Container App URLs for Azure, for example:
- `HUNYUAN_SHAPE_API_URL=https://vipermesh-shape-api.<suffix>.azurecontainerapps.io`
- `HUNYUAN_PAINT_API_URL=https://vipermesh-paint-api.<suffix>.azurecontainerapps.io`

The bearer tokens are application-level secrets enforced by the Shape/Paint
containers. They are not Azure identity credentials and should be stored as:
- ViperMesh backend runtime secrets for outbound calls
- Container App secrets referenced by `API_BEARER_TOKEN`

Backward-compatible fallback:
- `HUNYUAN_API_URL`

The app now supports the dedicated shape/paint URLs first and falls back to the
legacy shared Hunyuan URL only if the dedicated vars are unset.

## Current Azure Values

Current known ViperMesh Azure resources:
- resource group: `gpumodels`
- container apps environment: `managedEnvironment-gpumodels-970d`
- container registry: `vipershreg`
- T4 workload profile: `T4profile`
- A100 workload profile: `a100profile`

Current registry note:
- `vipershreg` has `anonymousPullEnabled=false`
- unless you explicitly change that, Container Apps still need registry auth

Suggested initial app names:
- `vipermesh-shape-api`
- `vipermesh-paint-api`

## Deployment Order

1. Stabilize ACR and Azure login from GitHub Actions.
2. Use the active GitHub Actions workflow to build and push `hunyuan-shape-api`.
3. Use the active GitHub Actions workflow to build and push `hunyuan-paint-api`.
4. Create the Container Apps with `deploy/azure/create-container-apps.ps1` or equivalent Azure CLI commands.
   - pass `-ShapeApiToken` and `-PaintApiToken`, or set the matching environment variables before running the script
   - keep the helper-managed health probes; the Shape container needs an extended startup window
   - do not rely on Azure's tiny default container size; the helper now sets explicit CPU/memory for Shape/Paint
5. Deploy `hunyuan-paint-api` first and verify one successful request.
6. Deploy `hunyuan-shape-api`.
7. Switch ViperMesh env vars from RunPod to Azure for Shape/Paint.
8. Add `hunyuan-part-api` later when that service is implemented.

## Local Validation Before Azure Rollout

Before pushing image changes to ACR, run the local smoke path for the service you
changed:

```powershell
.\deploy\azure\smoke-test-local.ps1 -Service paint -Build
.\deploy\azure\smoke-test-local.ps1 -Service shape -Build
```

Use the optional path arguments when you want a real local request instead of
only a boot/health smoke test:

```powershell
.\deploy\azure\smoke-test-local.ps1 -Service shape -Build -ShapeImagePath C:\path\to\reference.png
.\deploy\azure\smoke-test-local.ps1 -Service paint -Build -PaintMeshPath C:\path\to\mesh.glb -PaintImagePath C:\path\to\style.png
```

This catches container-specific issues earlier, such as:
- import/runtime compatibility problems
- missing checkpoint files
- wrong working-directory assumptions
- broken `/health` or request contracts

## Do Not Do Yet

- Do not point Azure directly at `deploy/runpod/**`.
- Do not start with AKS unless Container Apps proves insufficient.
- Do not keep shape and paint combined on one service unless you accept paying
  A100 prices for shape traffic too.
