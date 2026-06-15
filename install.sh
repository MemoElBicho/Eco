#!/usr/bin/env bash
set -euo pipefail

RED="\033[0;31m"; GREEN="\033[0;32m"; CYAN="\033[0;36m"; NC="\033[0m"
log()  { echo -e "${GREEN}[INSTALL]${NC} $1"; }
warn() { echo -e "${CYAN}[WARN]${NC}   $1"; }
err()  { echo -e "${RED}[ERROR]${NC}  $1"; exit 1; }

log "Eco Platform — instalador automatizado"

# ── 1. Sistema ─────────────────────────────────────────────
log "Actualizando paquetes del sistema..."
sudo apt update -qq && sudo apt upgrade -y -qq
log "Sistema actualizado."

# ── 2. Dependencias ───────────────────────────────────────
for bin in docker git curl; do
  if ! command -v "$bin" &>/dev/null; then
    log "Instalando $bin..."
    case "$bin" in
      docker)
        curl -fsSL https://get.docker.com | sudo sh
        sudo usermod -aG docker "$USER"
        ;;
      git)   sudo apt install -y -qq git ;;
      curl)  sudo apt install -y -qq curl ;;
    esac
  fi
done

if ! command -v docker &>/dev/null; then err "Docker no se pudo instalar."; fi
if ! docker compose version &>/dev/null; then
  warn "docker compose plugin no detectado, instalando..."
  sudo apt install -y -qq docker-compose-plugin
fi
log "Dependencias listas."

# ── 3. Repositorio ─────────────────────────────────────────
REPO_DIR="${REPO_DIR:-$HOME/eco-platform}"
REPO_URL="${REPO_URL:-https://github.com/anomalyco/Eco.git}"

if [ -d "$REPO_DIR/.git" ]; then
  log "Repositorio existente en $REPO_DIR — actualizando..."
  git -C "$REPO_DIR" pull --ff-only
else
  log "Clonando repositorio en $REPO_DIR..."
  git clone "$REPO_URL" "$REPO_DIR"
fi
cd "$REPO_DIR"

# ── 4. Variables de entorno ────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  warn "Archivo .env creado desde .env.example."
  warn "Edítalo ahora con tus claves antes de continuar."
  warn "Pausa de 15 s — Ctrl+C para editar, o espera para seguir."
  sleep 15
  warn "Continuando... (edita .env después si no lo hiciste)"
fi

# ── 5. Servicios ───────────────────────────────────────────
log "Construyendo y levantando contenedores..."
docker compose up -d --build

log "Esperando a que postgres esté healthy..."
until docker compose exec -T postgres pg_isready -U eco -d eco_db &>/dev/null; do
  sleep 2
done

# ── 6. Migraciones ─────────────────────────────────────────
log "Ejecutando migraciones de Alembic..."
docker compose run --rm backend alembic upgrade head

# ── 7. Resumen ─────────────────────────────────────────────
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "TU_IP")
echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}  Eco Platform instalado correctamente${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "  API:       http://${PUBLIC_IP}:8000"
echo -e "  Health:    http://${PUBLIC_IP}:8000/health"
echo -e "  Frontend:  http://${PUBLIC_IP}:3000 (si se despliega)"
echo ""
echo -e "  Logs:      docker compose logs -f backend"
echo -e "  Apagar:    docker compose down"
echo ""
echo -e "  Edita .env si no configuraste las claves aún."
echo -e "  ${CYAN}cat .env${NC}"
