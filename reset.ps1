#!/usr/bin/env pwsh
$ErrorActionPreference = "Continue"

Write-Host "============================================"
Write-Host "    Reiniciando ECO..."
Write-Host "============================================"
Write-Host ""

Write-Host "[1/2] Deteniendo todo..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force
docker compose down

Write-Host ""
Write-Host "[2/2] Levantando de nuevo..."
Write-Host ""
& "$PSScriptRoot\dev.ps1"
