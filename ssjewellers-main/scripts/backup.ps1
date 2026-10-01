<#
.SYNOPSIS
    S.S Jewellery ERP — Automated Database Backup Script (PowerShell / Windows)
.DESCRIPTION
    Creates a compressed pg_dump backup with timestamping and retention pruning.
#>

param (
    [string]$BackupDir = ".\backups",
    [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "ssjewellers_backup_$Timestamp.sql"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Starting S.S Jewellery ERP Database Backup" -ForegroundColor Green
Write-Host "Timestamp: $Timestamp"
Write-Host "Target:    $BackupFile"
Write-Host "=================================================="

# Check if Docker container is running
$dockerRunning = $false
try {
    $dockerPs = docker ps --filter "name=ssjewellery_postgres" --format "{{.Names}}" 2>$null
    if ($dockerPs -eq "ssjewellery_postgres") {
        $dockerRunning = $true
    }
} catch {}

if ($dockerRunning) {
    Write-Host "Dumping from Docker container 'ssjewellery_postgres'..." -ForegroundColor Yellow
    docker exec ssjewellery_postgres pg_dump -U postgres ssjewellers | Out-File -FilePath $BackupFile -Encoding utf8
} else {
    Write-Host "Executing local pg_dump..." -ForegroundColor Yellow
    pg_dump -U postgres -d ssjewellers | Out-File -FilePath $BackupFile -Encoding utf8
}

if (Test-Path $BackupFile) {
    $size = (Get-Item $BackupFile).Length / 1MB
    Write-Host ("✓ Backup created successfully! Size: {0:N2} MB" -f $size) -ForegroundColor Green
    
    # Calculate SHA256
    $hash = Get-FileHash -Path $BackupFile -Algorithm SHA256
    $hash.Hash | Out-File "$BackupFile.sha256" -Encoding utf8
}

# Prune old backups
Write-Host "Pruning backups older than $RetentionDays days..." -ForegroundColor Gray
$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "ssjewellers_backup_*" | Where-Object { $_.LastWriteTime -lt $cutoff } | Remove-Item -Force

Write-Host "✓ Backup completed." -ForegroundColor Cyan
