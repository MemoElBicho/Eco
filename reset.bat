@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo    Reiniciando ECO...
echo ============================================
echo.

echo [1/2] Deteniendo todo...
taskkill /fi "WINDOWTITLE eq Eco Frontend" /t /f >nul 2>&1
docker compose down >nul 2>&1
echo [OK] Todo detenido.

echo.
echo [2/2] Levantando de nuevo...
echo.
call dev.bat
