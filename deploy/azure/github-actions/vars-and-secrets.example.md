# Azure GitHub Configuration

The active workflow supports either:
- `AZURE_CREDENTIALS` as a service-principal JSON secret
- or Azure OIDC with `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID`

## Required GitHub Secrets

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

## Required GitHub Variables

- `AZURE_RESOURCE_GROUP`
- `AZURE_ACR_NAME`
- `AZURE_CONTAINER_APP_HUNYUAN_SHAPE`
- `AZURE_CONTAINER_APP_HUNYUAN_PAINT`
- `AZURE_CONTAINER_APP_ENVIRONMENT`
- `AZURE_T4_WORKLOAD_PROFILE`
- `AZURE_A100_WORKLOAD_PROFILE`

Later, when the Part Azure HTTP service exists:
- `AZURE_CONTAINER_APP_HUNYUAN_PART`

## Notes

- `AZURE_ACR_NAME` should be the registry name only, not the full `.azurecr.io` hostname
- the Container App variables should be the exact Azure Container App resource names
- the active workflow can build and push without the Container Apps existing yet
- if deploy is requested, the workflow assumes the target Container Apps already exist

## Future Runtime Variables

These are not wired by this document, but they are the likely app-side runtime switches once Azure services exist:

- `HUNYUAN_SHAPE_API_URL`
- `HUNYUAN_PAINT_API_URL`

Legacy fallback still supported by the app:

- `HUNYUAN_API_URL`

Later:
- `HUNYUAN_PART_URL`

## Current ViperMesh Azure Values

For the current Azure setup, these are the expected values:

- `AZURE_RESOURCE_GROUP=gpumodels`
- `AZURE_ACR_NAME=vipershreg`
- `AZURE_CONTAINER_APP_ENVIRONMENT=managedEnvironment-gpumodels-970d`
- `AZURE_T4_WORKLOAD_PROFILE=T4profile`
- `AZURE_A100_WORKLOAD_PROFILE=a100profile`

Suggested app names:
- `AZURE_CONTAINER_APP_HUNYUAN_SHAPE=vipermesh-shape-api`
- `AZURE_CONTAINER_APP_HUNYUAN_PAINT=vipermesh-paint-api`
