@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================
echo    ECO - Plataforma SaaS Multi-tenant
echo    Iniciando todos los servicios...
echo ============================================
echo.

:: ── 1. .env check ────────────────────────────
if not exist ".env" (
    echo [!] .env no encontrado. Copiando desde .env.example...
    copy .env.example .env >nul
    echo [✓] .env creado. Editalo con tus API keys antes de continuar.
    echo.
)

:: ── 2. Docker Compose ─────────────────────────
echo [1/5] Levantando contenedores Docker...
docker compose up -d 2>nul
if %errorlevel% neq 0 (
    echo [✗] Error al levantar Docker. Asegurate de que Docker Desktop este corriendo.
    pause
    exit /b 1
)
echo [✓] PostgreSQL + Redis + Backend + Celery iniciados.

:: ── 3. Esperar a que PostgreSQL este listo ─────
echo [2/5] Esperando a que PostgreSQL este saludable...
:wait_db
docker compose exec -T postgres pg_isready -U eco -d eco_db >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_db
)
echo [✓] PostgreSQL listo.

:: ── 4. Migraciones ────────────────────────────
echo [3/5] Ejecutando migraciones de Alembic...
docker compose run --rm -e PYTHONPATH=/app backend alembic upgrade head
if %errorlevel% equ 0 (
    echo [✓] Migraciones aplicadas.
) else (
    echo [✗] Error en migraciones. Revisa el output arriba.
    pause
    exit /b 1
)

:: ── 5. Seed data ──────────────────────────────
echo [4/5] Poblando datos de prueba...
docker compose run --rm -e PYTHONPATH=/app backend python seed_data.py 2>&1 | findstr /c:"Done" /c:"Using workspace"
echo [✓] Datos de prueba listos.

:: ── 5.5. Operator seed ─────────────────────────
echo [4.5/5] Poblando templates de operadores...
docker compose run --rm -e PYTHONPATH=/app backend python seed_operators.py
echo [✓] Templates de operadores listos.

:: ── 6. Frontend ───────────────────────────────
echo [5/5] Iniciando frontend...
if not exist "frontend\node_modules" (
    echo     Instalando dependencias npm...
    cd frontend
    call npm install >nul 2>&1
    cd ..
)
start "Eco Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================
echo    ECO esta listo.
echo.
echo    Backend:   http://localhost:8000
echo    Frontend:  http://localhost:3000
echo    API Docs:  http://localhost:8000/docs
echo.
echo    Registrate en /register y empeza a usar Eco.
echo ============================================
echo.
pause
