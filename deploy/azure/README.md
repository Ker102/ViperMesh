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

### Compute
Use Azure Container Apps GPU first.

Why:
- closest fit to the current serverless GPU pattern
- much lower ops burden than AKS
- supports `minReplicas=1` for warm workers when cold starts hurt

## Initial Azure Service Layout

1. `hunyuan-api`
- serves Hunyuan Shape + Hunyuan Paint
- matches the existing `HUNYUAN_API_URL` client contract

2. `hunyuan-part-api`
- serves Hunyuan Part over a normal HTTP API

## GitHub Actions Model

Recommended flow:
1. push to GitHub
2. run checks
3. build Azure-ready image
4. push to ACR
5. update Azure Container App revision

An example workflow lives at:
- `deploy/azure/github-actions/azure-neural-container-apps.yml.example`

That file is intentionally not active yet because the Azure-ready Dockerfiles do not exist yet.

## Repo Secrets And Variables

See:
- `deploy/azure/github-actions/vars-and-secrets.example.md`

## Operational Recommendation

For Hunyuan Paint, start with:
- `minReplicas=1`
- low `maxReplicas` during validation

This is the Azure equivalent of avoiding queue-only cold starts while the model is still being stabilized.
