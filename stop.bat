@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo    Deteniendo ECO...
echo ============================================

echo [1/2] Cerrando frontend...
taskkill /fi "WINDOWTITLE eq Eco Frontend" /t /f >nul 2>&1
echo [OK] Frontend detenido.

echo [2/2] Deteniendo contenedores Docker...
docker compose down
echo [OK] Contenedores detenidos.

echo.
echo Datos intactos. Para volver a iniciar corre dev.bat
echo ============================================
pause
