# Eco — Plataforma Self-Hosted de Automatización Conversacional con IA

Asistente de IA que vive en tu WhatsApp y Telegram, conoce tus documentos internos, organiza tus clientes automáticamente y sincroniza con HubSpot. Corre en tu propio servidor.

---

## 🏗️ Arquitectura del Sistema

```
[WhatsApp / Telegram]
        │
        ▼
[ngrok / Túnel Público]
        │
        ▼
[FastAPI Webhook] ───────────────────────────────────────┐
        │                                                 │
        ▼                                                 ▼
[Celery Worker] ──► [pgvector / RAG]               [WebSocket Manager]
        │               │                                 │
        │               ▼                                 │
        │        [Gemini Embedding]                       │
        │               │                                 │
        ▼               ▼                                 ▼
[Gemini 2.5 Flash]  [WorkspaceConfig DB]          [Next.js Dashboard]
        │                                                 ▲
        ▼                                                 │
[HTTPX Sender] ──► WhatsApp/Telegram ─────────────────────┘
        │
        ├──► [HubSpot CRM] (sync bidireccional de contactos)
        └──► [Stripe] (checkout, billing portal, webhooks)
```

1. **Webhook público** — FastAPI recibe el mensaje entrante vía ngrok
2. **Tarea asíncrona** — Celery encola `process_message`. Si la API de IA falla, reintenta hasta 3 veces con backoff exponencial
3. **Búsqueda vectorial** — `query_brain` consulta pgvector con `cosine_distance` usando embeddings Gemini (3072d)
4. **RAG con Gemini** — `agent.py` combina contexto del Brain con el mensaje y genera respuesta con Gemini 2.5 Flash
5. **Despacho dinámico** — `telegram_client.py` / `whatsapp_client.py` leen tokens desde `WorkspaceConfig` por workspace
6. **Tiempo real** — `WebSocket Manager` transmite cada mensaje al dashboard Next.js sin recargar
7. **Live Chat Hub** — El humano pausa el bot, envía respuestas manuales y reactiva la IA
8. **HubSpot Sync** — Sincronización bidireccional de contactos (Eco → HubSpot y HubSpot → Eco vía webhooks)
9. **Stripe Billing** — Planes Free/Pro/Enterprise con checkout, portal de facturación y webhooks de pago

---

## ✨ Características Principales

| Característica | Descripción |
|---|---|
| **Multi-tenant dinámico** | Cada workspace tiene sus propios tokens (Telegram, WhatsApp, OpenAI) almacenados en `WorkspaceConfig` de la DB. Configurables desde el dashboard. |
| **Human-in-the-Loop** | Campo `bot_active` en `Lead`. Cuando un humano toma control (`PATCH /toggle-bot`), Celery hace early return y no invoca a la IA. El agente envía mensajes manualmente vía `POST /send-manual` con desactivación automática del bot. |
| **WebSockets bidireccionales** | `ConnectionManager` en FastAPI agrupa conexiones por `workspace_id`. Cada mensaje nuevo (`in` u `out`) se transmite instantáneamente al frontend. |
| **Resiliencia ante fallos** | Celery `autoretry_for=(OpenAIError,)` con `retry_backoff=True` y `max_retries=3`. Si Gemini devuelve 503, el worker reintenta sin crashear. |
| **pgvector + RAG** | Documentos PDF/TXT se chunked, se generan embeddings con Gemini, se almacenan en PostgreSQL y se recuperan por similitud coseno. |
| **Dashboard shadcn/ui** | Next.js 16 + Tailwind CSS + shadcn/ui. Sidebar con Leads (CRUD + HubSpot badge), Brain (upload + lista), Live Chat Hub (split layout + WebSocket), Settings (API keys + HubSpot + Facturación). |
| **CRM + HubSpot Sync** | Leads con `hs_contact_id` y `hs_last_sync`. Webhook inbound de HubSpot con resolución de conflictos por timestamp. Celery task outbound para crear/actualizar contactos. |
| **Suscripciones Stripe** | Planes Free/Pro/Enterprise. Checkout, Billing Portal y webhook `checkout.session.completed`. Límites Free Plan (50 msgs/mes). |
| **Análisis de Sentimiento** | Gemini clasifica cada mensaje (positivo/neutro/negativo) con score -1.0 a 1.0. Visible en dashboard. |
| **Tests + CI/CD** | pytest con fixtures async, db_session con rollback por test. Playwright E2E (auth, leads, brain, conversations, webhooks). GitHub Actions con PostgreSQL + Redis. |

---

## 🚀 Guía de Inicio Rápido

### Requisitos

- Docker Desktop
- Node.js 20+

### Opción A: Un solo comando (recomendado para demo)

```bash
# Windows
dev.bat

# Linux / Mac
chmod +x dev.sh && ./dev.sh
```

Este script se encarga de **todo**:
1. Copia `.env.example` → `.env` si no existe
2. Levanta PostgreSQL, Redis, Backend y Celery con Docker Compose
3. Espera a que PostgreSQL esté saludable
4. Ejecuta migraciones de Alembic (`alembic upgrade head`)
5. Pobla datos de prueba (`seed_data.py`)
6. Instala dependencias npm si es necesario
7. Inicia el frontend en `http://localhost:3000`

Al terminar, abre el navegador, regístrate en `/register` y explora el dashboard.

### Apagar todo

```bash
# Windows
stop.bat

# Linux / Mac
chmod +x stop.sh && ./stop.sh
```

Los datos en PostgreSQL y Redis se conservan. Para volver a iniciar, ejecutá `dev.bat` o `dev.sh` de nuevo.

### Opción B: Paso a paso

```bash
git clone <repo-url> Eco
cd Eco
cp .env.example .env       # Linux/Mac
# copy .env.example .env   # Windows

# Editar .env con tus API keys
# (mínimo: SECRET_KEY, OPENAI_API_KEY)
# El resto de tokens se configuran por workspace desde el dashboard (/settings)

docker compose up -d
docker compose run --rm -e PYTHONPATH=/app backend alembic upgrade head
docker compose run --rm -e PYTHONPATH=/app backend python seed_data.py

cd frontend
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### exponer webhooks (ngrok)

Si necesitás recibir mensajes reales de Telegram/WhatsApp:

```bash
ngrok http 8000
```

| Canal | Registro de Webhook |
|---|---|
| Telegram | `POST https://api.telegram.org/bot{TOKEN}/setWebhook?url={NGROK_URL}/api/v1/webhooks/telegram` |
| WhatsApp | Configurar en Meta Developer Dashboard con `{NGROK_URL}/api/v1/webhooks/whatsapp` |

> Los tokens de WhatsApp y Telegram pueden configurarse por workspace desde el dashboard (`/settings`). Los valores en `.env` actúan como fallback si un workspace no tiene configuración propia.

### Primeros pasos en el dashboard

1. **Registrate** en `/register` con email y contraseña
2. **Cargá tu catálogo** en `/brain` (PDF o TXT con productos, precios, políticas)
3. **Configurá tus tokens** en `/settings` (Telegram, WhatsApp, Gemini)
4. **Monitoreá leads** en `/leads` y **chateá en vivo** en `/conversations`
5. Cuando un cliente escriba por Telegram o WhatsApp, vas a ver la conversación en tiempo real

---

## 📁 Estructura del Proyecto

```
Eco/
├── backend/
│   ├── app/
│   │   ├── api/v1/           # Routers FastAPI (auth, brain, leads, conversations, settings, billing, webhooks/)
│   │   │   └── webhooks/      # telegram, whatsapp, stripe, hubspot
│   │   ├── core/              # WebSocket ConnectionManager
│   │   ├── models/            # SQLAlchemy (User, Workspace, Lead, Message, BrainDocument, WorkspaceConfig)
│   │   ├── schemas/           # Pydantic (request/response)
│   │   ├── services/          # agent.py, brain.py, sentiment.py, hubspot_client.py, telegram_client.py, whatsapp_client.py, limits.py
│   │   ├── tasks/             # celery_app.py, ai_tasks.py, hubspot_tasks.py
│   │   ├── config.py          # pydantic-settings
│   │   └── database.py        # SQLAlchemy async engine
│   ├── alembic/               # Migraciones
│   ├── tests/                  # pytest (auth, leads, brain, conversations, settings, sentiment, billing, webhooks)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/(dashboard)/   # Rutas: brain, leads, conversations, settings
│   │   ├── components/        # shadcn/ui + componentes de negocio (chat-list, chat-window, message-bubble)
│   │   ├── hooks/             # useLeads, useBrain, useConversations, useWebSocket, useAuth
│   │   └── lib/               # api.ts (fetch wrapper), types
│   ├── e2e/                   # Playwright E2E (auth, leads, brain, conversations)
│   ├── playwright.config.ts
│   └── package.json
├── .github/workflows/          # GitHub Actions CI (test.yml)
├── docker-compose.yml
├── .env.example
├── dev.bat                     # Inicio rápido Windows
├── dev.sh                      # Inicio rápido Linux/Mac
├── stop.bat                    # Apagar todo Windows
├── stop.sh                     # Apagar todo Linux/Mac
├── ECO_FLOW.html               # Diagrama interactivo de flujo completo
└── INVESTORS.md                # Documento para inversores
```

---

## 🔧 Stack Técnico

| Capa | Tecnología |
|---|---|
| **Backend** | FastAPI (Python 3.11), SQLAlchemy 2.0 async, Pydantic v2 |
| **Base de datos** | PostgreSQL 16 + pgvector |
| **Cola de tareas** | Celery con Redis broker |
| **IA / Embeddings** | Gemini 2.5 Flash (chat), gemini-embedding-001 (3072d) |
| **Mensajería** | Telegram Bot API, Meta WhatsApp Cloud API v21.0 |
| **CRM Externo** | HubSpot API v3 (sync bidireccional) |
| **Pagos** | Stripe Checkout + Billing Portal + Webhooks |
| **Frontend** | Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui |
| **Tiempo real** | FastAPI WebSockets |
| **Tests** | pytest + pytest-asyncio, Playwright E2E |
| **CI/CD** | GitHub Actions (postgres + redis services) |
| **Infraestructura** | Docker Compose, ngrok |
| **Auth** | JWT + bcrypt |

---

## 🧪 Tests

```bash
# Backend (requiere PostgreSQL + Redis)
cd backend
pytest -v

# E2E (requiere backend corriendo en :8000)
cd frontend
npx playwright test
```

---

## 📄 Documentos Relacionados

- **`INVESTORS.md`** — Pitch para inversores: qué es Eco, modelo de negocio, roadmap, competencia
- **`ECO_FLOW.html`** — Diagrama interactivo React Flow con el flujo completo de uso paso a paso

---

## 📝 Licencia

MIT
