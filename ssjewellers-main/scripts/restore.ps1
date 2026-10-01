<#
.SYNOPSIS
    S.S Jewellery ERP — Database Restore Script (PowerShell / Windows)
#>

param (
    [Parameter(Mandatory = $true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file '$BackupFile' not found!"
    exit 1
}

Write-Host "==================================================" -ForegroundColor Red
Write-Host "⚠️  WARNING: Restoring database will overwrite current data!" -ForegroundColor Yellow
Write-Host "Target: $BackupFile"
Write-Host "=================================================="

$confirm = Read-Host "Type 'yes' to proceed with restore"
if ($confirm -ne "yes") {
    Write-Host "Restore cancelled." -ForegroundColor Gray
    exit 0
}

# Check if Docker is running
$dockerRunning = $false
try {
    $dockerPs = docker ps --filter "name=ssjewellery_postgres" --format "{{.Names}}" 2>$null
    if ($dockerPs -eq "ssjewellery_postgres") {
        $dockerRunning = $true
    }
} catch {}

if ($dockerRunning) {
    Write-Host "Restoring into Docker container 'ssjewellery_postgres'..." -ForegroundColor Cyan
    Get-Content $BackupFile | docker exec -i ssjewellery_postgres psql -U postgres -d ssjewellers
} else {
    Write-Host "Restoring into local Postgres..." -ForegroundColor Cyan
    Get-Content $BackupFile | psql -U postgres -d ssjewellers
}

Write-Host "✓ Database restored successfully!" -ForegroundColor Green
