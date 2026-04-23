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
$trackingTag = "{0}-track-{1}" -f $Tag, ([guid]::NewGuid().ToString("N").Substring(0, 12))
$runLookupDeadline = (Get-Date).AddMinutes(5)
$statusDeadline = (Get-Date).AddSeconds($TimeoutSeconds + 600)

Write-Host "Queueing ACR build for $ImageName`:$Tag (tracking tag: $trackingTag)"

$null = az acr build `
    -r $RegistryName `
    -f $Dockerfile `
    -t "$ImageName`:$Tag" `
    -t "$ImageName`:$trackingTag" `
    --timeout $TimeoutSeconds `
    --no-logs `
    --no-wait `
    -o json `
    $Context

if ($LASTEXITCODE -ne 0) {
    throw "Failed to queue ACR build for $ImageName`:$Tag."
}

$runId = $null
do {
    $runId = az acr task list-runs `
        -r $RegistryName `
        --image "$ImageName`:$trackingTag" `
        --top 1 `
        --query "[0].runId" `
        -o tsv

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to look up the queued ACR build run for tracking tag $trackingTag."
    }

    if ($runId) { break }
    Start-Sleep -Seconds 5
} while ((Get-Date) -lt $runLookupDeadline)

if (-not $runId) {
    throw "Could not determine the ACR run id for the queued build tagged as $ImageName`:$trackingTag."
}

Write-Host "Queued ACR build run: $runId"

do {
    $status = az acr task list-runs `
        -r $RegistryName `
        --image "$ImageName`:$trackingTag" `
        --top 1 `
        --query "[0].status" `
        -o tsv

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to query ACR build status for run $runId."
    }

    Write-Host "$(Get-Date -Format s) $runId $status"

    if ($status -eq "Succeeded") {
        break
    }

    if ($status -and $status -notin @("Queued", "Running", "Started")) {
        throw "ACR build $runId failed with status: $status"
    }

    Start-Sleep -Seconds 15
} while ((Get-Date) -lt $statusDeadline)

if ((Get-Date) -ge $statusDeadline) {
    throw "ACR build $runId did not finish before the polling deadline."
}

Write-Host "ACR build succeeded: $ImageName`:$Tag"
