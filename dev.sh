#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "   ECO - Plataforma SaaS Multi-tenant"
echo "   Iniciando todos los servicios..."
echo "============================================"
echo ""

# ── 1. .env check ──────────────────────────────
if [ ! -f ".env" ]; then
    echo "[!] .env no encontrado. Copiando desde .env.example..."
    cp .env.example .env
    echo "[✓] .env creado. Editalo con tus API keys antes de continuar."
    echo ""
fi

# ── 2. Docker Compose ───────────────────────────
echo "[1/5] Levantando contenedores Docker..."
docker compose up -d
echo "[✓] PostgreSQL + Redis + Backend + Celery iniciados."

# ── 3. Esperar PostgreSQL ──────────────────────
echo "[2/5] Esperando a que PostgreSQL esté saludable..."
until docker compose exec -T postgres pg_isready -U eco -d eco_db > /dev/null 2>&1; do
    sleep 2
done
echo "[✓] PostgreSQL listo."

# ── 4. Migraciones ─────────────────────────────
echo "[3/5] Ejecutando migraciones de Alembic..."
docker compose run --rm -e PYTHONPATH=/app backend alembic upgrade head
echo "[✓] Migraciones aplicadas."

# ── 5. Seed data ───────────────────────────────
echo "[4/5] Poblando datos de prueba..."
docker compose run --rm -e PYTHONPATH=/app backend python seed_data.py
echo "[✓] Datos de prueba listos."

# ── 6. Frontend ────────────────────────────────
echo "[5/5] Iniciando frontend..."
if [ ! -d "frontend/node_modules" ]; then
    echo "      Instalando dependencias npm..."
    cd frontend && npm install && cd ..
fi
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================"
echo "   ECO está listo."
echo ""
echo "   Backend:   http://localhost:8000"
echo "   Frontend:  http://localhost:3000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "   Registrate en /register y empezá a usar Eco."
echo "============================================"
echo ""

wait $FRONTEND_PID
