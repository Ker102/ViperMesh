# Azure GitHub Configuration

Use GitHub OIDC for Azure login.

## Required GitHub Secrets

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

## Required GitHub Variables

- `AZURE_RESOURCE_GROUP`
- `AZURE_ACR_NAME`
- `AZURE_CONTAINER_APP_HUNYUAN_API`
- `AZURE_CONTAINER_APP_HUNYUAN_PART`

## Notes

- `AZURE_ACR_NAME` should be the registry name only, not the full `.azurecr.io` hostname
- the Container App variables should be the exact Azure Container App resource names
- the example workflow assumes the Container Apps already exist and are already configured to pull from ACR

## Future Runtime Variables

These are not wired by this document, but they are the likely app-side runtime switches once Azure services exist:

- `HUNYUAN_API_URL`
- `HUNYUAN_PART_URL`
