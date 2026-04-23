# Azure GPU Migration Plan

Date: 2026-04-08
Status: draft
Scope: replace the unstable RunPod paint/part deployment path with Azure-hosted GPU containers, while preserving the current ViperMesh neural tool architecture

## Why This Exists

The current RunPod deployment path is unstable for Hunyuan Paint:
- rollouts stall with only a subset of workers on the latest config
- jobs remain in queue for minutes without ever starting
- the app-side handling is now clearer, but the core problem is provider stability and worker lifecycle

Azure is the next fallback target because it gives ViperMesh a more controlled GPU deployment surface while still avoiding full AKS operational overhead.

## Chosen Direction

Initial target:
- Azure Container Apps with serverless GPUs
- Azure Container Registry for private image storage
- GitHub Actions for CI/CD

Do not start with AKS.

Why:
- Container Apps is much closer to the current RunPod serverless model
- easier rollout and identity integration than raw Kubernetes
- supports custom containers plus controlled warm instances via `minReplicas`
- lower operational burden while the product is still validating its neural workflows

## Important Constraint

The current images under `deploy/runpod/**` are not drop-in Azure images.

They are RunPod worker containers whose entrypoint is:
- `runpod.serverless.start(...)`

That means:
- they do not expose the stable HTTP surface Azure Container Apps should serve
- they are tied to RunPod's worker protocol and blob-upload path

So the Azure migration is not:
- "push the current RunPod images to ACR and deploy them"

It is:
- "build Azure-ready HTTP service images that reuse the same model logic"

## Recommended Service Split

Phase 1 targets:

1. `hunyuan-shape-api`
- Azure HTTP service for Hunyuan Shape
- expected routes:
  - `GET /health`
  - `POST /generate`

2. `hunyuan-paint-api`
- Azure HTTP service for Hunyuan Paint
- expected routes:
  - `GET /health`
  - `POST /texturize`

3. `hunyuan-part-api`
- separate Azure HTTP service for Hunyuan Part
- expected routes:
  - `GET /health`
  - `POST /segment`

Deferred:
- UniRig
- MoMask
- MeshAnything V2

Those should stay out of the first Azure migration slice until the paint path is stable.

## Deployment Topology

GitHub -> GitHub Actions -> Azure Container Registry -> Azure Container Apps

High-level flow:
1. Push code to GitHub
2. GitHub Actions runs checks
3. GitHub Actions builds Azure-ready model images
4. GitHub Actions pushes images to ACR
5. GitHub Actions updates the target Container App revision
6. Container Apps pull from ACR using managed identity

## One-Time Azure Resources

Required:
- Azure resource group
- Azure Container Registry
- Azure Container Apps environment in a GPU-enabled region
- one Container App for `hunyuan-shape-api`
- one Container App for `hunyuan-paint-api`
- later, one Container App for `hunyuan-part-api`

Recommended:
- ACR Premium
- managed identity for the Container Apps
- `minReplicas=1` for the paint service while stabilizing cold starts
- `minReplicas=1` for the shape service if you want fast interactive geometry runs, otherwise `0`
- `minReplicas=0 or 1` for part, depending on latency tolerance

## GitHub Configuration

Recommended auth path:
- GitHub OIDC to Azure, not long-lived registry credentials

Expected repo secrets:
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Expected repo variables:
- `AZURE_RESOURCE_GROUP`
- `AZURE_ACR_NAME`
- `AZURE_CONTAINER_APP_HUNYUAN_SHAPE`
- `AZURE_CONTAINER_APP_HUNYUAN_PAINT`
- later, `AZURE_CONTAINER_APP_HUNYUAN_PART`

## Runtime App Configuration

Once Azure services exist, the ViperMesh app should eventually point to:
- `HUNYUAN_SHAPE_API_URL=https://<hunyuan-shape-api-url>`
- `HUNYUAN_PAINT_API_URL=https://<hunyuan-paint-api-url>`
- later, `HUNYUAN_PART_URL=https://<hunyuan-part-api-url>`

That runtime switch is intentionally separate from the current infrastructure scaffolding.

## Migration Phases

### Phase 1
- document Azure target architecture
- scaffold GitHub Actions workflow template
- define required secrets/variables
- keep runtime unchanged

### Phase 2
- add Azure-ready HTTP entrypoints and Dockerfiles
- keep them separate from the current RunPod worker images
- validate local Docker boot for both services

### Phase 3
- push Azure-ready images to ACR from GitHub Actions
- update existing Container Apps from GitHub
- confirm `/health` and one real paint job succeed

### Phase 4
- switch ViperMesh environment config from RunPod to Azure for paint
- keep RunPod available as fallback only if needed

### Phase 5
- migrate part to Azure
- only then decide whether the remaining neural models belong on Azure too

## Success Criteria

This migration is successful when:
- Hunyuan Shape and Hunyuan Paint are served from Azure with stable HTTP endpoints
- paint jobs start reliably without multi-minute queue stalls
- GitHub push can publish a new image and roll a new revision without manual image pushes
- ViperMesh runtime can target Azure through env config instead of RunPod

## Non-Goals For This Slice

- full AKS migration
- private VNet-only networking
- saved user asset library
- moving every neural model off RunPod at once
