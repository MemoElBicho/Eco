#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "    Deteniendo ECO..."
echo "============================================"

echo "[1/2] Cerrando frontend..."
pkill -f "next dev" 2>/dev/null || echo "     (no estaba corriendo)"

echo "[2/2] Deteniendo contenedores Docker..."
docker compose down

echo ""
echo "Datos intactos. Para volver a iniciar corre dev.sh"
echo "============================================"
