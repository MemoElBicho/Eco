#!/usr/bin/env pwsh
$ErrorActionPreference = "Continue"

Write-Host "============================================"
Write-Host "    RESET COMPLETO de ECO"
Write-Host "    Esto borrara TODOS los datos"
Write-Host "============================================"
Write-Host ""
$confirm = Read-Host "Estas seguro? (escribe SI para continuar)"

if ($confirm -ne "SI") {
    Write-Host "Cancelado."
    exit 0
}

Write-Host ""
Write-Host "[1/4] Cerrando frontend..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "[2/4] Cerrando ngrok..."
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "[3/4] Deteniendo contendores y borrando volumenes..."
docker compose down -v

Write-Host "[4/4] Limpiando frontend (.next)..."
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "frontend\.next"

Write-Host ""
Write-Host "============================================"
Write-Host "   Reset completo. Todo limpio."
Write-Host "   Para empezar de cero: .\dev.ps1"
Write-Host "============================================"
