#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "    Reiniciando ECO..."
echo "============================================"
echo ""

echo "[1/2] Deteniendo todo..."
pkill -f "next start" 2>/dev/null || echo "     (frontend no estaba corriendo)"
docker compose down

echo ""
echo "[2/2] Levantando de nuevo..."
echo ""
bash dev.sh
