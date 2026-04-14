param(
    [string]$ResourceGroup = "gpumodels",
    [string]$EnvironmentName = "managedEnvironment-gpumodels-970d",
    [string]$RegistryName = "vipershreg",
    [string]$ShapeAppName = "vipermesh-shape-api",
    [string]$PaintAppName = "vipermesh-paint-api",
    [string]$ShapeWorkloadProfile = "T4profile",
    [string]$PaintWorkloadProfile = "a100profile",
    [string]$ImageTag = "latest",
    [int]$ShapeMinReplicas = 0,
    [int]$ShapeMaxReplicas = 3,
    [int]$PaintMinReplicas = 0,
    [int]$PaintMaxReplicas = 1,
    [switch]$UseAnonymousRegistryPull
)

$ErrorActionPreference = "Stop"

function Test-ContainerAppExists {
    param([string]$Name)
    az containerapp show --name $Name --resource-group $ResourceGroup --only-show-errors 1>$null 2>$null
    return $LASTEXITCODE -eq 0
}

function Ensure-SystemIdentityAndRegistry {
    param(
        [string]$AppName,
        [string]$RegistryServer,
        [string]$RegistryId
    )

    az containerapp identity assign --name $AppName --resource-group $ResourceGroup --system-assigned --only-show-errors 1>$null
    az containerapp registry set --name $AppName --resource-group $ResourceGroup --server $RegistryServer --identity system --only-show-errors 1>$null

    $principalId = az containerapp show --name $AppName --resource-group $ResourceGroup --query identity.principalId -o tsv
    if ($principalId) {
        az role assignment create `
            --assignee-object-id $principalId `
            --assignee-principal-type ServicePrincipal `
            --scope $RegistryId `
            --role AcrPull `
            --only-show-errors 1>$null 2>$null
    }
}

function Ensure-ContainerApp {
    param(
        [string]$AppName,
        [string]$Image,
        [string]$WorkloadProfile,
        [int]$MinReplicas,
        [int]$MaxReplicas,
        [string[]]$EnvVars
    )

    if (Test-ContainerAppExists -Name $AppName) {
        Write-Host "Updating Container App $AppName..."
        $args = @(
            "containerapp", "update",
            "--name", $AppName,
            "--resource-group", $ResourceGroup,
            "--image", $Image,
            "--workload-profile-name", $WorkloadProfile,
            "--min-replicas", "$MinReplicas",
            "--max-replicas", "$MaxReplicas",
            "--set-env-vars"
        ) + $EnvVars

        az @args --only-show-errors
        az containerapp ingress enable `
            --name $AppName `
            --resource-group $ResourceGroup `
            --type external `
            --target-port 8080 `
            --transport auto `
            --only-show-errors 1>$null
    } else {
        Write-Host "Creating Container App $AppName..."
        $args = @(
            "containerapp", "create",
            "--name", $AppName,
            "--resource-group", $ResourceGroup,
            "--environment", $EnvironmentName,
            "--image", $Image,
            "--ingress", "external",
            "--target-port", "8080",
            "--transport", "auto",
            "--min-replicas", "$MinReplicas",
            "--max-replicas", "$MaxReplicas",
            "--workload-profile-name", $WorkloadProfile,
            "--env-vars"
        ) + $EnvVars

        if (-not $UseAnonymousRegistryPull.IsPresent) {
            $args += @("--system-assigned", "--registry-server", $script:RegistryServer, "--registry-identity", "system")
        }

        az @args --only-show-errors
    }

    if (-not $UseAnonymousRegistryPull.IsPresent) {
        Ensure-SystemIdentityAndRegistry -AppName $AppName -RegistryServer $script:RegistryServer -RegistryId $script:RegistryId
    }
}

$registry = az acr show --name $RegistryName --resource-group $ResourceGroup -o json | ConvertFrom-Json
if (-not $registry) {
    throw "Azure Container Registry '$RegistryName' was not found in resource group '$ResourceGroup'."
}

$script:RegistryServer = $registry.loginServer
$script:RegistryId = $registry.id

$shapeImage = "$($script:RegistryServer)/vipermesh/hunyuan-shape-api:$ImageTag"
$paintImage = "$($script:RegistryServer)/vipermesh/hunyuan-paint-api:$ImageTag"

Ensure-ContainerApp `
    -AppName $ShapeAppName `
    -Image $shapeImage `
    -WorkloadProfile $ShapeWorkloadProfile `
    -MinReplicas $ShapeMinReplicas `
    -MaxReplicas $ShapeMaxReplicas `
    -EnvVars @(
        "PORT=8080",
        "LOW_VRAM_MODE=1",
        "ENABLE_FLASHVDM=0",
        "ENABLE_COMPILE=0"
    )

Ensure-ContainerApp `
    -AppName $PaintAppName `
    -Image $paintImage `
    -WorkloadProfile $PaintWorkloadProfile `
    -MinReplicas $PaintMinReplicas `
    -MaxReplicas $PaintMaxReplicas `
    -EnvVars @(
        "PORT=8080",
        "PAINT_MAX_NUM_VIEW=6",
        "PAINT_RESOLUTION=512"
    )

Write-Host "Shape and Paint Container Apps are configured."
