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

## Local Smoke Test Path

Use the local Compose harness before pushing Azure image changes when you need to
validate:
- container boot
- `/health` responses
- paint checkpoint/layout assumptions
- optional end-to-end local Shape/Paint requests

Files:
- `deploy/azure/docker-compose.local.yml`
- `deploy/azure/smoke-test-local.ps1`

Recommended quick checks:

```powershell
.\deploy\azure\smoke-test-local.ps1 -Service paint -Build
.\deploy\azure\smoke-test-local.ps1 -Service shape -Build
```

Those commands:
- build the requested Azure-targeted image locally
- start the service with Docker Compose
- wait for `/health`
- for Paint, verify both:
  - `RealESRGAN_x4plus.pth`
  - `hy3dpaint/cfgs/hunyuan-paint-pbr.yaml`
  exist at the runtime paths the wrapper depends on

Optional full-request smoke tests:

```powershell
.\deploy\azure\smoke-test-local.ps1 -Service shape -Build -ShapeImagePath C:\path\to\reference.png
.\deploy\azure\smoke-test-local.ps1 -Service paint -Build -PaintMeshPath C:\path\to\mesh.glb -PaintImagePath C:\path\to\style.png
```

By default the script tears the stack down after the smoke check. Use
`-KeepRunning` if you want the local containers to stay up for manual inspection.

## Service Authentication

Shape and Paint now support optional backend-only bearer authentication.

Recommended setup:
- ViperMesh backend env vars:
  - `HUNYUAN_SHAPE_API_TOKEN`
  - `HUNYUAN_PAINT_API_TOKEN`
- Azure Container App secret/env:
  - `API_BEARER_TOKEN`

Use the Azure Container App HTTPS FQDNs in the backend runtime:
- `HUNYUAN_SHAPE_API_URL=https://<shape-app>.<region>.azurecontainerapps.io`
- `HUNYUAN_PAINT_API_URL=https://<paint-app>.<region>.azurecontainerapps.io`

Important:
- local development defaults may still use `http://localhost:8080`
- Azure production calls should use the external HTTPS endpoint URLs
- the bearer token is application-level auth enforced by the container service itself
- it is separate from Azure RBAC, managed identity, and ACR pull auth

Current behavior:
- the ViperMesh backend sends `Authorization: Bearer ...` when the corresponding
  `HUNYUAN_*_API_TOKEN` env var is set
- the Azure Shape/Paint services enforce the token only when `API_BEARER_TOKEN`
  is configured
- `/health` remains open for readiness checks

The helper script `deploy/azure/create-container-apps.ps1` can inject the token
into each Container App as a secret-backed environment variable.
It also applies explicit HTTP health probes so the Shape/Paint services get a
long enough startup window for heavy model initialization on Azure.
It also sets explicit CPU and memory values for the GPU services so Azure
doesn't fall back to the generic `0.5 CPU / 1Gi` default.

If you prefer the Azure portal instead of CLI, configure `API_BEARER_TOKEN`
under the Container App's secrets and reference it from the container
environment variables. The CLI helper already does this automatically.

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
