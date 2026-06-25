#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

Write-Host "============================================"
Write-Host "   ECO - Plataforma SaaS Multi-tenant"
Write-Host "   Iniciando todos los servicios..."
Write-Host "============================================"
Write-Host ""

# -- 1. .env check --
if (-not (Test-Path ".env")) {
    Write-Host "[!] .env no encontrado. Copiando desde .env.example..."
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] .env creado. Editalo con tus API keys antes de continuar."
    Write-Host ""
}

# -- 2. Docker Compose --
Write-Host "[1/5] Levantando contenedores Docker..."
docker compose up -d
Write-Host "[OK] PostgreSQL + Redis + Backend + Celery + Mock iniciados."

# -- 3. Esperar PostgreSQL --
Write-Host "[2/5] Esperando a que PostgreSQL este saludable..."
do {
    Start-Sleep -Seconds 2
    $ready = docker compose exec -T postgres pg_isready -U eco -d eco_db 2>&1 | Out-String
} while ($LASTEXITCODE -ne 0)
Write-Host "[OK] PostgreSQL listo."

# -- 4. Migraciones --
Write-Host "[3/5] Ejecutando migraciones de Alembic..."
docker compose run --rm -e PYTHONPATH=/app backend alembic upgrade head
Write-Host "[OK] Migraciones aplicadas."

# -- 5. Seed data --
Write-Host "[4/5] Poblando datos de prueba..."
docker compose run --rm -e PYTHONPATH=/app backend python seed_operators.py
docker compose run --rm -e PYTHONPATH=/app backend python seed_data.py
Write-Host "[OK] Datos de prueba listos."

# -- 6. Frontend --
Write-Host "[5/5] Iniciando frontend (build + start)..."
Push-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "      Instalando dependencias npm..."
    npm install
}

Write-Host "      Limpiando build anterior (.next)..."
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue ".next"

Write-Host "      Compilando (next build)..."
npm run build

Write-Host "      Iniciando (next start)..."
Start-Process "cmd" -ArgumentList "/c","npx","next","start" -NoNewWindow
Pop-Location

Write-Host ""
Write-Host "============================================"
Write-Host "   ECO esta listo."
Write-Host ""
Write-Host "   Backend:   http://localhost:8000"
Write-Host "   Frontend:  http://localhost:3000"
Write-Host "   API Docs:  http://localhost:8000/docs"
Write-Host ""
Write-Host "   Login:     demo@eco.ai / demo1234"
Write-Host "   E2E tests: cd frontend && npx playwright test --project=chromium"
Write-Host "============================================"
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el frontend."
Write-Host "Para detener Docker: docker compose down"
Write-Host ""
Write-Host "Logs del backend: docker compose logs -f backend"
Write-Host ""
