param(
    [string]$ResourceGroup = "gpumodels",
    [string]$EnvironmentName = "managedEnvironment-gpumodels-970d",
    [string]$RegistryName = "vipershreg",
    [string]$ShapeAppName = "vipermesh-shape-api",
    [string]$PaintAppName = "vipermesh-paint-api",
    [string]$ShapeWorkloadProfile = "T4profile",
    [string]$PaintWorkloadProfile = "a100profile",
    [string]$ImageTag = "latest",
    [string]$ShapeApiToken = $env:HUNYUAN_SHAPE_API_TOKEN,
    [string]$PaintApiToken = $env:HUNYUAN_PAINT_API_TOKEN,
    [string]$ShapeCpu = "2.0",
    [string]$ShapeMemory = "4Gi",
    [string]$PaintCpu = "4.0",
    [string]$PaintMemory = "24Gi",
    [int]$ShapeMinReplicas = 0,
    [int]$ShapeMaxReplicas = 3,
    [int]$PaintMinReplicas = 1,
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

function Set-ContainerAppProbes {
    param(
        [string]$AppName,
        [object[]]$Probes
    )

    if (-not $Probes -or $Probes.Count -eq 0) {
        return
    }

    $tmpYaml = Join-Path $env:TEMP "$AppName-containerapp.yaml"
    $tmpJson = Join-Path $env:TEMP "$AppName-probes.json"

    try {
        az containerapp show --name $AppName --resource-group $ResourceGroup -o yaml | Set-Content -Path $tmpYaml
        $Probes | ConvertTo-Json -Depth 10 | Set-Content -Path $tmpJson

        $pythonPatch = @"
import json
import pathlib
import yaml

yaml_path = pathlib.Path(r'''$tmpYaml''')
json_path = pathlib.Path(r'''$tmpJson''')

data = yaml.safe_load(yaml_path.read_text())
data['properties']['template']['containers'][0]['probes'] = json.loads(json_path.read_text())
yaml_path.write_text(yaml.safe_dump(data, sort_keys=False))
"@

        python -c $pythonPatch
        az containerapp update --name $AppName --resource-group $ResourceGroup --yaml $tmpYaml --only-show-errors 1>$null
    } finally {
        Remove-Item $tmpYaml -Force -ErrorAction SilentlyContinue
        Remove-Item $tmpJson -Force -ErrorAction SilentlyContinue
    }
}

function Ensure-ContainerApp {
    param(
        [string]$AppName,
        [string]$Image,
        [string]$WorkloadProfile,
        [string]$ApiToken,
        [string]$Cpu,
        [string]$Memory,
        [int]$MinReplicas,
        [int]$MaxReplicas,
        [string[]]$EnvVars
    )

    $effectiveEnvVars = @($EnvVars)
    if ($ApiToken) {
        $effectiveEnvVars += "API_BEARER_TOKEN=secretref:apitoken"
    }

    $isNewApp = -not (Test-ContainerAppExists -Name $AppName)

    if (-not $isNewApp) {
        Write-Host "Updating Container App $AppName..."
        if ($ApiToken) {
            az containerapp secret set `
                --name $AppName `
                --resource-group $ResourceGroup `
                --secrets "apitoken=$ApiToken" `
                --only-show-errors 1>$null
        }

        $args = @(
            "containerapp", "update",
            "--name", $AppName,
            "--resource-group", $ResourceGroup,
            "--image", $Image,
            "--workload-profile-name", $WorkloadProfile,
            "--cpu", $Cpu,
            "--memory", $Memory,
            "--min-replicas", "$MinReplicas",
            "--max-replicas", "$MaxReplicas",
            "--set-env-vars"
        ) + $effectiveEnvVars

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
            "--cpu", $Cpu,
            "--memory", $Memory,
            "--min-replicas", "$MinReplicas",
            "--max-replicas", "$MaxReplicas",
            "--workload-profile-name", $WorkloadProfile
        )

        if ($ApiToken) {
            $args += @("--secrets", "apitoken=$ApiToken")
        }

        $args += @("--env-vars")
        $args += $effectiveEnvVars

        if (-not $UseAnonymousRegistryPull.IsPresent) {
            $args += @("--system-assigned", "--registry-server", $script:RegistryServer, "--registry-identity", "system")
        }

        az @args --only-show-errors
    }

    if (-not $UseAnonymousRegistryPull.IsPresent) {
        Ensure-SystemIdentityAndRegistry -AppName $AppName -RegistryServer $script:RegistryServer -RegistryId $script:RegistryId

        if ($isNewApp) {
            Start-Sleep -Seconds 10
            az containerapp update `
                --name $AppName `
                --resource-group $ResourceGroup `
                --image $Image `
                --only-show-errors 1>$null
        }
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

$shapeProbes = @(
    @{
        type = "Startup"
        httpGet = @{
            path = "/health"
            port = 8080
        }
        initialDelaySeconds = 60
        periodSeconds = 10
        failureThreshold = 30
    },
    @{
        type = "Readiness"
        httpGet = @{
            path = "/health"
            port = 8080
        }
        initialDelaySeconds = 60
        periodSeconds = 15
        failureThreshold = 8
    },
    @{
        type = "Liveness"
        httpGet = @{
            path = "/health"
            port = 8080
        }
        initialDelaySeconds = 60
        periodSeconds = 30
        failureThreshold = 3
    }
)

$paintProbes = @(
    @{
        type = "Startup"
        httpGet = @{
            path = "/health"
            port = 8080
        }
        initialDelaySeconds = 30
        periodSeconds = 10
        failureThreshold = 24
    },
    @{
        type = "Readiness"
        httpGet = @{
            path = "/health"
            port = 8080
        }
        initialDelaySeconds = 30
        periodSeconds = 15
        failureThreshold = 6
    },
    @{
        type = "Liveness"
        httpGet = @{
            path = "/health"
            port = 8080
        }
        initialDelaySeconds = 60
        periodSeconds = 30
        failureThreshold = 3
    }
)

Ensure-ContainerApp `
    -AppName $ShapeAppName `
    -Image $shapeImage `
    -WorkloadProfile $ShapeWorkloadProfile `
    -ApiToken $ShapeApiToken `
    -Cpu $ShapeCpu `
    -Memory $ShapeMemory `
    -MinReplicas $ShapeMinReplicas `
    -MaxReplicas $ShapeMaxReplicas `
    -EnvVars @(
        "PORT=8080",
        "LOW_VRAM_MODE=1",
        "ENABLE_FLASHVDM=0",
        "ENABLE_COMPILE=0"
    )
Set-ContainerAppProbes -AppName $ShapeAppName -Probes $shapeProbes

Ensure-ContainerApp `
    -AppName $PaintAppName `
    -Image $paintImage `
    -WorkloadProfile $PaintWorkloadProfile `
    -ApiToken $PaintApiToken `
    -Cpu $PaintCpu `
    -Memory $PaintMemory `
    -MinReplicas $PaintMinReplicas `
    -MaxReplicas $PaintMaxReplicas `
    -EnvVars @(
        "PORT=8080",
        "PAINT_MAX_NUM_VIEW=4",
        "PAINT_RESOLUTION=512"
    )
Set-ContainerAppProbes -AppName $PaintAppName -Probes $paintProbes

Write-Host "Shape and Paint Container Apps are configured."
