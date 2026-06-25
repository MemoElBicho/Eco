#!/usr/bin/env pwsh
$ErrorActionPreference = "Continue"

Write-Host "============================================"
Write-Host "    Deteniendo ECO..."
Write-Host "============================================"

Write-Host "[1/3] Cerrando frontend..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "      Frontend detenido."

Write-Host "[2/3] Cerrando ngrok..."
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "      ngrok detenido."

Write-Host "[3/3] Deteniendo contenedores Docker..."
docker compose down

Write-Host ""
Write-Host "Datos intactos (volumen: pgdata)."
Write-Host "Para volver a iniciar: .\dev.ps1"
Write-Host "============================================"
