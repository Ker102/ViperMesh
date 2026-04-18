param(
    [ValidateSet("paint", "shape", "all")]
    [string]$Service = "paint",
    [switch]$Build,
    [switch]$KeepRunning,
    [string]$PaintMeshPath,
    [string]$PaintImagePath,
    [string]$ShapeImagePath,
    [string]$ComposeFile = "deploy/azure/docker-compose.local.yml",
    [string]$ProjectName = "vipermesh-azure-local"
)

$ErrorActionPreference = "Stop"

function Get-ComposeArgs {
    @("-f", $ComposeFile, "--project-name", $ProjectName)
}

function Wait-HttpHealthy {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 600
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                return
            }
        } catch {}

        Start-Sleep -Seconds 5
    } while ((Get-Date) -lt $deadline)

    throw "Timed out waiting for $Url"
}

function To-Base64String {
    param([string]$Path)

    [Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $Path)))
}

function Invoke-JsonPost {
    param(
        [string]$Url,
        [hashtable]$Headers,
        [object]$Body,
        [string]$OutFile
    )

    $jsonBody = $Body | ConvertTo-Json -Depth 20 -Compress
    Invoke-WebRequest `
        -Uri $Url `
        -Method Post `
        -Headers $Headers `
        -ContentType "application/json" `
        -Body $jsonBody `
        -OutFile $OutFile `
        -TimeoutSec 1800 | Out-Null
}

$composeArgs = Get-ComposeArgs
$services = switch ($Service) {
    "paint" { @("hunyuan-paint-api") }
    "shape" { @("hunyuan-shape-api") }
    default { @("hunyuan-shape-api", "hunyuan-paint-api") }
}

if (-not $env:LOCAL_SHAPE_API_TOKEN) {
    $env:LOCAL_SHAPE_API_TOKEN = "local-shape-token"
}

if (-not $env:LOCAL_PAINT_API_TOKEN) {
    $env:LOCAL_PAINT_API_TOKEN = "local-paint-token"
}

docker compose @composeArgs config | Out-Null

$upArgs = @("compose") + $composeArgs + @("up", "-d")
if ($Build) {
    $upArgs += "--build"
}
$upArgs += $services
docker @upArgs

try {
    if ($Service -in @("shape", "all")) {
        Wait-HttpHealthy -Url "http://127.0.0.1:18080/health"
        Write-Host "Shape health endpoint is ready."

        if ($ShapeImagePath) {
            $shapeOut = Join-Path $env:TEMP "shape-smoke-$(Get-Date -Format 'yyyyMMddHHmmss').glb"
            $shapeBody = @{
                image = "data:image/png;base64,$(To-Base64String $ShapeImagePath)"
                output_format = "glb"
            }
            Invoke-JsonPost `
                -Url "http://127.0.0.1:18080/generate" `
                -Headers @{ Authorization = "Bearer $($env:LOCAL_SHAPE_API_TOKEN)" } `
                -Body $shapeBody `
                -OutFile $shapeOut
            Write-Host "Shape smoke request succeeded: $shapeOut"
        } else {
            Write-Host "Shape full request skipped. Provide -ShapeImagePath to run one."
        }
    }

    if ($Service -in @("paint", "all")) {
        Wait-HttpHealthy -Url "http://127.0.0.1:18081/health"
        Write-Host "Paint health endpoint is ready."

        docker compose @composeArgs exec -T hunyuan-paint-api python -c "from pathlib import Path; p = Path('/app/hunyuan3d/hy3dpaint/ckpt/RealESRGAN_x4plus.pth'); assert p.exists(), p; print(p)"

        if ($PaintMeshPath) {
            $paintOut = Join-Path $env:TEMP "paint-smoke-$(Get-Date -Format 'yyyyMMddHHmmss').glb"
            $paintBody = @{
                mesh = "data:model/gltf-binary;base64,$(To-Base64String $PaintMeshPath)"
                output_format = "glb"
            }

            if ($PaintImagePath) {
                $paintBody.image = "data:image/png;base64,$(To-Base64String $PaintImagePath)"
            }

            Invoke-JsonPost `
                -Url "http://127.0.0.1:18081/texturize" `
                -Headers @{ Authorization = "Bearer $($env:LOCAL_PAINT_API_TOKEN)" } `
                -Body $paintBody `
                -OutFile $paintOut
            Write-Host "Paint smoke request succeeded: $paintOut"
        } else {
            Write-Host "Paint full request skipped. Provide -PaintMeshPath to run one."
        }
    }
} finally {
    if (-not $KeepRunning) {
        docker compose @composeArgs down
    }
}
