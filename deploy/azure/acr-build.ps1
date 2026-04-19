param(
    [Parameter(Mandatory = $true)]
    [string]$RegistryName,
    [Parameter(Mandatory = $true)]
    [string]$Dockerfile,
    [Parameter(Mandatory = $true)]
    [string]$ImageName,
    [Parameter(Mandatory = $true)]
    [string]$Tag,
    [string]$Context = ".",
    [int]$TimeoutSeconds = 7200
)

$ErrorActionPreference = "Stop"
$env:PYTHONIOENCODING = "utf-8"

$beforeRuns = @(az acr task list-runs -r $RegistryName --query "[].runId" -o tsv 2>$null)

az acr build `
    -r $RegistryName `
    -f $Dockerfile `
    -t "$ImageName`:$Tag" `
    --timeout $TimeoutSeconds `
    --no-logs `
    $Context | Out-Null

$deadline = (Get-Date).AddMinutes(10)
$runId = $null

do {
    $currentRuns = @(az acr task list-runs -r $RegistryName --query "[].runId" -o tsv)
    $runId = $currentRuns | Where-Object { $_ -and $_ -notin $beforeRuns } | Select-Object -First 1
    if ($runId) { break }
    Start-Sleep -Seconds 5
} while ((Get-Date) -lt $deadline)

if (-not $runId) {
    throw "Could not determine the ACR run id for the queued build."
}

Write-Host "Queued ACR build run: $runId"

do {
    $status = az acr task list-runs -r $RegistryName --query "[?runId=='$runId'].status | [0]" -o tsv
    Write-Host "$(Get-Date -Format s) $runId $status"
    if ($status -and $status -notin @("Queued", "Running", "Started")) {
        if ($status -ne "Succeeded") {
            throw "ACR build $runId failed with status: $status"
        }
        break
    }
    Start-Sleep -Seconds 15
} while ($true)

Write-Host "ACR build succeeded: $ImageName`:$Tag"
