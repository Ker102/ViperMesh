# Azure GPU Deployment Notes

This folder holds the Azure deployment plan and CI/CD scaffolding for moving the unstable RunPod neural model path onto Azure.

## Current Decision

Use:
- Azure Container Apps with serverless GPUs
- Azure Container Registry
- GitHub Actions

Do not start with AKS for the first migration.

## Important Constraint

The current Dockerfiles under `deploy/runpod/**` are RunPod worker images.

They are not direct Azure Container Apps targets because their Python entrypoint ends in:
- `runpod.serverless.start(...)`

That means the Azure path needs separate HTTP-serving images.

## Recommended Azure Services

### Registry
Use Azure Container Registry.

Why:
- native Azure pull path
- easier Container Apps integration
- better fit for private GPU images than Docker Hub

Current ViperMesh Azure state:
- registry: `vipershreg`
- `publicNetworkAccess` is enabled
- `anonymousPullEnabled` is currently `false`

Important:
- public network access does not make the registry anonymously pullable
- if you keep the current registry settings, Container Apps still need registry auth

### Compute
Use Azure Container Apps GPU first.

Why:
- closest fit to the current serverless GPU pattern
- much lower ops burden than AKS
- supports `minReplicas=1` for warm workers when cold starts hurt

## Initial Azure Service Layout

1. `hunyuan-shape-api`
- serves Hunyuan Shape on the lighter GPU lane
- target runtime var: `HUNYUAN_SHAPE_API_URL`
- repo status: implemented Docker/service scaffold

2. `hunyuan-paint-api`
- serves Hunyuan Paint on the heavy GPU lane
- target runtime var: `HUNYUAN_PAINT_API_URL`
- repo status: implemented Docker/service scaffold

3. `hunyuan-part-api`
- serves Hunyuan Part over a normal HTTP API
- target runtime var: `HUNYUAN_PART_URL`
- repo status: planned, not implemented yet

The app now supports:
- `HUNYUAN_SHAPE_API_URL` with fallback to `HUNYUAN_API_URL`
- `HUNYUAN_PAINT_API_URL` with fallback to `HUNYUAN_API_URL`

So Azure can split shape and paint cleanly without breaking the current local/shared endpoint setup.

## GitHub Actions Model

Recommended flow:
1. push to GitHub
2. run checks
3. build Azure-ready image
4. push to ACR
5. update Azure Container App revision

Workflow files:
- `deploy/azure/github-actions/azure-neural-container-apps.yml.example`
- `.github/workflows/deploy-azure-neural-gpu.yml`

The active workflow now covers:
- build + push for Shape and Paint
- optional manual deploy to existing Container Apps

Part is still pending and intentionally excluded from the active workflow.

## Service Authentication

Shape and Paint now support optional backend-only bearer authentication.

Recommended setup:
- ViperMesh backend env vars:
  - `HUNYUAN_SHAPE_API_TOKEN`
  - `HUNYUAN_PAINT_API_TOKEN`
- Azure Container App secret/env:
  - `API_BEARER_TOKEN`

Current behavior:
- the ViperMesh backend sends `Authorization: Bearer ...` when the corresponding
  `HUNYUAN_*_API_TOKEN` env var is set
- the Azure Shape/Paint services enforce the token only when `API_BEARER_TOKEN`
  is configured
- `/health` remains open for readiness checks

The helper script `deploy/azure/create-container-apps.ps1` can inject the token
into each Container App as a secret-backed environment variable.

## Repo Secrets And Variables

See:
- `deploy/azure/github-actions/vars-and-secrets.example.md`
- `deploy/azure/setup-checklist.md`
- `deploy/azure/gpu-and-quota-reference.md`

Current helper script:
- `deploy/azure/create-container-apps.ps1`

## Operational Recommendation

For Hunyuan Paint, start with:
- `minReplicas=1`
- low `maxReplicas` during validation

This is the Azure equivalent of avoiding queue-only cold starts while the model is still being stabilized.
