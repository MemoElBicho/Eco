#!/usr/bin/env pwsh
$ErrorActionPreference = "Continue"

Write-Host "============================================"
Write-Host "    Deteniendo ECO..."
Write-Host "============================================"

Write-Host "[1/2] Cerrando frontend..."
$nextProc = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next start*" }
if ($nextProc) {
    $nextProc | Stop-Process -Force
    Write-Host "      Frontend detenido."
} else {
    Write-Host "      (no estaba corriendo)"
}

Write-Host "[2/2] Deteniendo contenedores Docker..."
docker compose down

Write-Host ""
Write-Host "Datos intactos (volumen: pgdata)."
Write-Host "Para volver a iniciar: .\dev.ps1"
Write-Host "============================================"
