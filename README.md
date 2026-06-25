# Echo — Plataforma Self-Hosted de Automatización Conversacional con IA

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
[Celery Worker] ──► [pgvector / RAG]               [Next.js Dashboard]
        │               │                                 ▲
        │               ▼                                 │
        │        [Gemini Embedding]                       │
        │               │                                 │
        ▼               ▼                                 │
[Gemini 2.5 Flash]  [PostgreSQL]                   [WebSocket + Polling]
        │                                                 ▲
        ▼                                                 │
[HTTPX Sender] ──► WhatsApp/Telegram ─────────────────────┘
```

1. **Webhook público** — FastAPI recibe el mensaje entrante vía ngrok
2. **Tarea asíncrona** — Celery encola `process_message`. Si la API de IA falla, reintenta hasta 3 veces con backoff
3. **Búsqueda vectorial** — `query_brain` consulta pgvector con `cosine_distance` (embeddings Gemini 3072d)
4. **RAG con Gemini** — `agent.py` combina contexto del Brain con el mensaje y genera respuesta
5. **Despacho** — `telegram_client.py` / `whatsapp_client.py` envían la respuesta al cliente
6. **Dashboard en vivo** — Polling cada 4s actualiza mensajes en el Intelligence Dashboard

---

## ✨ Características Principales

| Característica | Descripción |
|---|---|
| **Intelligence Dashboard** | KPIs en tiempo real, Pipeline Funnel, Heatmap 7×24, Sentiment Chart, Channels Donut, Activity Feed, Health Panel, Revenue Chart |
| **Dashboard oscuro profesional** | Diseño dark theme con tokens CSS (#060C1A), sidebar 3 secciones, gradientes ámbar, animaciones |
| **Catálogo + Deploy Wizard** | 5 templates pre-entrenados (Ventas, Soporte, Onboarding, Cobranza, Assistant). Despliega en 3 pasos |
| **Live Chat Hub** | Chat en vivo con burbujas asimétricas, Pause AI/Resume AI, indicador de escritura |
| **CRM Leads** | Tabla con score bars, emojis de sentimiento, badges de estado, Add Lead, chat inline |
| **Echo Brain (RAG)** | Upload de PDFs/TXT, chunking, embeddings Gemini, búsqueda vectorial pgvector |
| **Human-in-the-Loop** | Campo `bot_active` en Lead. Botón "Pause AI"/"Resume AI" para tomar control manual |
| **Multi-tenant** | Workspaces independientes con sus propios tokens, leads y configuraciones |
| **HubSpot Sync** | Sincronización bidireccional de contactos con resolución de conflictos por timestamp |
| **Stripe Billing** | Planes Free ($0) / Pro ($29) / Enterprise ($99) con checkout y portal |
| **Análisis de Sentimiento** | Gemini clasifica cada mensaje (positivo/neutro/negativo) con score -1.0 a 1.0 |
| **Métricas Backend** | API `/api/v1/metrics/overview`, `/activity`, `/health` para datos en tiempo real |
| **Tests E2E** | 8 tests Playwright automatizados: auth, brain, leads, conversations, smoke (deploy + webhook) |
| **CSP + Seguridad** | Content Security Policy, X-Frame-Options, HSTS, JWT auth |

---

## 🚀 Guía de Inicio Rápido

### Requisitos

- Docker Desktop
- Node.js 20+
- ngrok (para webhooks públicos)

### Un solo comando

```powershell
# Windows
.\dev.ps1
```

Este script:
1. Copia `.env.example` → `.env` si no existe
2. Levanta PostgreSQL, Redis, Backend y Celery con Docker Compose
3. Ejecuta migraciones de Alembic
4. Pobla datos de prueba (demo user, templates, leads)
5. Compila y lanza el frontend en `http://localhost:3000`

### Demo login

```
Email:  demo@eco.ai
Pass:   demo1234
```

### Apagar todo

```powershell
.\stop.ps1
```

Detiene frontend + contenedores Docker. Los datos se conservan.

### Reset completo (apaga y vuelve a levantar todo)

```powershell
.\reset.ps1
```

### Exponer webhooks (ngrok)

```powershell
ngrok http 8000
```

Luego configura el webhook de Telegram:

```powershell
$u = (Invoke-RestMethod http://127.0.0.1:4040/api/tunnels).tunnels[0].public_url
$token = "TU_BOT_TOKEN"
Invoke-RestMethod "https://api.telegram.org/bot$token/setWebhook?url=$u/api/v1/webhooks/telegram"
```

---

## 📁 Estructura del Proyecto

```
Eco/
├── backend/
│   ├── app/
│   │   ├── api/v1/           # Routers FastAPI (auth, brain, leads, conversations, settings, billing, webhooks, metrics)
│   │   ├── core/              # WebSocket ConnectionManager
│   │   ├── models/            # SQLAlchemy (User, Workspace, Lead, Message, BrainDocument, etc.)
│   │   ├── schemas/           # Pydantic (request/response)
│   │   ├── services/          # agent.py, brain.py, sentiment.py, telegram_client.py, whatsapp_client.py
│   │   └── tasks/             # celery_app.py, ai_tasks.py, hubspot_tasks.py
│   ├── alembic/               # Migraciones
│   ├── tests/                 # pytest
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/(dashboard)/   # Rutas: page.tsx, leads, conversations, brain, catalog, operators, settings, pricing
│   │   ├── components/
│   │   │   ├── dashboard/     # 11 componentes: kpi-card, pipeline-funnel, heatmap, activity-feed, etc.
│   │   │   └── conversations/ # chat-list, chat-window, message-bubble
│   │   ├── hooks/             # useMetrics, useConversations, useLeads, useBrain, useWebSocket, useAuth
│   │   └── lib/               # api.ts (fetch wrapper), types
│   ├── e2e/                   # Playwright E2E (auth, leads, brain, conversations, smoke)
│   └── package.json
├── docs/                       # echo-architecture-flow.html, echo-investor-deck.html
├── .github/workflows/          # GitHub Actions CI
├── docker-compose.yml
├── .env.example
├── dev.ps1                     # Inicio rápido Windows
├── stop.ps1                    # Apagar todo
├── reset.ps1                   # Reset completo
├── Eco2.html                   # Investor Pitch & Memoria Estratégica
├── ECO_FLOW.html               # Diagrama interactivo de flujo completo
├── ECHO_USER_GUIDE.html        # Guía completa de usuario
├── INVESTORS.md                # Documento para inversores
└── README.md
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
| **Frontend** | Next.js 16 (App Router), Tailwind CSS v4, Chart.js, @base-ui/react |
| **Dashboard** | 11 componentes (KPIs, Pipeline, Heatmap, Sentiment, Activity Feed, Health, Revenue) |
| **Tiempo real** | FastAPI WebSockets + Polling (4s) |
| **Tests** | pytest + pytest-asyncio, Playwright E2E (8 tests, 8/8 pass) |
| **CI/CD** | GitHub Actions (postgres + redis services) |
| **Infraestructura** | Docker Compose, ngrok |
| **Auth** | JWT + bcrypt |

---

## 🧪 Tests

```bash
# Backend
cd backend && pytest -v

# E2E (requiere backend en :8000)
cd frontend && npx playwright test --project=chromium
# Resultado esperado: 8 passed
```

---

## 📄 Documentos Relacionados

- **`Eco2.html`** — Investor Pitch & Memoria Estratégica (v0.2.0)
- **`INVESTORS.md`** — Pitch para inversores: qué es, modelo de negocio, roadmap, competencia
- **`ECO_FLOW.html`** — Diagrama interactivo React Flow del flujo completo
- **`ECHO_USER_GUIDE.html`** — Guía completa paso a paso para nuevos usuarios
- **`docs/echo-architecture-flow.html`** — Diagrama de arquitectura técnica
- **`docs/echo-investor-deck.html`** — Deck de inversión

---

## 📝 Licencia

MIT
