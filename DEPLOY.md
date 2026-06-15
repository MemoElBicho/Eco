# Eco Platform — Guía rápida de despliegue

## Requisitos

- VPS Ubuntu 22.04+ (2 vCPU, 4 GB RAM mínimo)
- Dominio o IP pública
- Claves de API de Gemini (Google AI)

## Instalación (3 pasos)

```bash
# 1. Haz ejecutable y lanza el instalador
chmod +x install.sh
./install.sh

# 2. Durante la pausa de 15s (o después), edita .env con tus claves
nano .env

# 3. Reprovisa migraciones si cambiaste el .env
docker compose run --rm backend alembic upgrade head
```

## Variables de entorno críticas

| Variable | Descripción | Obligatoria |
|---|---|---|
| `SECRET_KEY` | Clave JWT aleatoria para tokens de sesión | **Sí** |
| `OPENAI_API_KEY` | API key de Gemini (Google AI Studio) | **Sí** |
| `STRIPE_SECRET_KEY` | Secret key de Stripe para pagos | No (MVP) |
| `STRIPE_WEBHOOK_SECRET` | Firma de webhooks de Stripe | No (MVP) |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram (@BotFather) | No |
| `WHATSAPP_ACCESS_TOKEN` | Token de acceso de Meta Cloud API | No |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de WhatsApp Business | No |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificación del webhook | No |
| `FRONTEND_URL` | URL pública del frontend | No |

## Servicios

| Servicio | Puerto | Acceso |
|---|---|---|
| API (FastAPI) | 8000 | `http://<IP>:8000/health` |
| PostgreSQL | 5432 | interno |
| Redis | 6379 | interno |
| Celery Worker | — | interno |

## Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f backend

# Reiniciar un servicio
docker compose restart backend

# Entrar al shell del backend
docker compose exec backend bash

# Verificar migraciones
docker compose run --rm backend alembic current

# Apagar todo (sin borrar datos)
docker compose down

# Apagar y borrar volúmenes (⚠️ pierdes datos)
docker compose down -v
```

## Acceso inicial

1. Ve a `http://<IP>:8000/docs` para la doc interactiva de la API
2. Registra un usuario: `POST /api/v1/auth/register`
3. Crea una instancia desde el catálogo: `POST /api/v1/operators/`
4. Configura los canales desde la instancia creada
5. Apunta los webhooks de Telegram/WhatsApp a:
   - Telegram: `https://<IP>/api/v1/webhooks/telegram/<webhook_token>`
   - WhatsApp: `https://<IP>/api/v1/webhooks/whatsapp/<webhook_token>`
