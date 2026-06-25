# Echo — Plataforma Self-Hosted de Automatización Conversacional con IA

Asistente de IA que vive en tu WhatsApp y Telegram, conoce tus documentos internos, organiza tus clientes automáticamente y sincroniza con HubSpot. Corre en tu propio servidor.

---

## 🚀 Inicio Rápido

### Requisitos

| Componente | Mínimo | Recomendado |
|---|---|---|
| Docker Desktop | 4.x+ | Latest |
| Node.js | 20 LTS | 22 LTS |
| RAM | 4 GB | 8 GB |
| Disco | 2 GB libre | 5 GB libre |

### 1. Clonar

Clona el repositorio y entra al directorio:

```bash
cd Eco
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y configura:

```bash
cp .env.example .env   # Linux / Mac
copy .env.example .env  # Windows CMD
```

Edita `.env` con tus API keys (mínimo `SECRET_KEY`). El resto se configura desde el dashboard en `/settings`.

### 3. Levantar

| Sistema | Comando |
|---|---|
| **Windows PowerShell** | `.\dev.ps1` |
| **Windows CMD** | `dev.bat` |
| **Linux / Mac** | `bash dev.sh` |

Esto ejecuta automáticamente: Docker Compose → PostgreSQL health check → Alembic migrations → Seed data → Frontend build + start.

### 4. Acceder

| Recurso | URL |
|---|---|
| Dashboard | `http://localhost:3000` |
| API Backend | `http://localhost:8000` |
| API Docs (Swagger) | `http://localhost:8000/docs` |

**Demo login:** `demo@eco.ai` / `demo1234`

---

## 🛠️ Gestión del Sistema

| Acción | Windows PowerShell | Windows CMD | Linux / Mac |
|---|---|---|---|
| **Iniciar** | `.\dev.ps1` | `dev.bat` | `bash dev.sh` |
| **Detener** | `.\stop.ps1` | `stop.bat` | `bash stop.sh` |
| **Reiniciar** | `.\reset.ps1` | `reset.bat` | `bash reset.sh` |

- **Detener** conserva todos los datos (volumen PostgreSQL intacto)
- **Reiniciar** apaga todo y lo vuelve a levantar automáticamente sin pérdida de datos

---

## 🌐 Exponer Webhooks (ngrok)

Para recibir mensajes reales de Telegram/WhatsApp necesitás un túnel público:

```bash
ngrok http 8000
```

Luego registrá el webhook en Telegram:

```powershell
$u = (Invoke-RestMethod http://127.0.0.1:4040/api/tunnels).tunnels[0].public_url
$token = "TU_BOT_TOKEN"
Invoke-RestMethod "https://api.telegram.org/bot$token/setWebhook?url=$u/api/v1/webhooks/telegram"
```

---

## ✨ Características Principales

| Categoría | Característica |
|---|---|
| **Intelligence Dashboard** | 6 KPIs en tiempo real, Pipeline Funnel, Heatmap 7×24h, Sentiment Chart 30d, Channels Donut, Activity Feed, Health Panel (7 servicios), Lead Scoring, Brain Coverage, Revenue Chart |
| **UI Profesional** | Dashboard oscuro (#060C1A), sidebar 3 secciones, gradientes ámbar, animaciones pulse/fadeUp |
| **Catálogo + Deploy Wizard** | 5 templates pre-entrenados (Ventas, Soporte, Onboarding, Cobranza, Assistant). Deploy en 3 pasos |
| **Live Chat Hub** | Burbujas asimétricas, gradiente ámbar para enviados, indicador de escritura animado, Pause AI/Resume AI |
| **CRM Leads** | Score bars, emojis de sentimiento, badges de estado, Add Lead con gradiente, chat inline |
| **Echo Brain (RAG)** | Upload PDF/TXT, chunking automático, embeddings Gemini 3072d, pgvector búsqueda por similitud coseno |
| **Human-in-the-Loop** | `bot_active` por lead. Un clic en "Pause AI" y el humano toma el control |
| **Multi-tenant** | Workspaces independientes con tokens, leads y configuraciones propias |
| **HubSpot Sync** | Sincronización bidireccional con resolución de conflictos por timestamp |
| **Stripe Billing** | Free ($0) / Pro ($29/mes) / Enterprise ($99/mes) con checkout y billing portal |
| **Sentiment Analysis** | Gemini clasifica cada mensaje (positivo/neutro/negativo) con score -1.0 a 1.0 |
| **Backend Metrics API** | `/api/v1/metrics/overview`, `/activity`, `/health` para dashboards y monitoreo |
| **CSP + Seguridad** | Content Security Policy, X-Frame-Options, HSTS, Referrer-Policy, JWT + bcrypt |
| **Tests Automatizados** | 8 tests Playwright E2E (8/8 pass) + pytest backend |

---

## 🔧 Stack Técnico

| Capa | Tecnología |
|---|---|
| Backend | FastAPI (Python 3.11), SQLAlchemy 2.0 async, Pydantic v2 |
| Base de datos | PostgreSQL 16 + pgvector |
| Cola de tareas | Celery + Redis |
| IA / Embeddings | Gemini 2.5 Flash, gemini-embedding-001 (3072d) |
| Mensajería | Telegram Bot API, Meta WhatsApp Cloud API v21.0 |
| CRM Externo | HubSpot API v3 |
| Pagos | Stripe Checkout + Billing Portal + Webhooks |
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, Chart.js, @base-ui/react |
| Dashboard | 11 componentes (KPI, Pipeline, Heatmap, Sentiment, Activity, Health, Revenue, Brain, Channels, Lead Scoring, Response Time) |
| Tiempo real | FastAPI WebSockets + Polling (4s) |
| Tests | pytest-asyncio + Playwright E2E (8 tests) |
| CI/CD | GitHub Actions |
| Infraestructura | Docker Compose, ngrok |

---

## 🏗️ Arquitectura

```
[WhatsApp / Telegram] → [ngrok] → [FastAPI Webhook] → [Celery Worker]
                                                              │
                                              ┌───────────────┼───────────────┐
                                              ▼               ▼               ▼
                                        [pgvector/RAG]  [Gemini 2.5]   [HTTPX Sender]
                                              │               │               │
                                              ▼               ▼               ▼
                                        [Brain Docs]   [Respuesta IA]  [WhatsApp/Telegram]
                                                                              │
                                                                              ▼
                                                                      [Next.js Dashboard]
                                                                              ▲
                                                                      [Polling 4s]
```

1. Webhook público recibe mensaje vía ngrok
2. Celery encola `process_message` con reintentos automáticos (hasta 3)
3. Búsqueda vectorial en pgvector con `cosine_distance`
4. RAG: contexto del Brain + mensaje → Gemini 2.5 Flash → respuesta
5. Despacho por `telegram_client.py` / `whatsapp_client.py`
6. Dashboard se actualiza cada 4s vía polling

---

## 📁 Estructura del Proyecto

```
Eco/
├── backend/
│   ├── app/
│   │   ├── api/v1/           # Routers (auth, brain, leads, conversations, settings, billing, webhooks, metrics)
│   │   ├── core/              # WebSocket ConnectionManager
│   │   ├── models/            # SQLAlchemy (User, Workspace, Lead, Message, BrainDocument, OperatorInstance)
│   │   ├── schemas/           # Pydantic
│   │   ├── services/          # agent.py, brain.py, sentiment.py, telegram_client.py, whatsapp_client.py
│   │   └── tasks/             # celery_app.py, ai_tasks.py, hubspot_tasks.py
│   ├── alembic/               # Migraciones
│   ├── tests/                 # pytest
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/(dashboard)/   # page.tsx, leads, conversations, brain, catalog, operators, settings, pricing
│   │   ├── components/
│   │   │   ├── dashboard/     # 11 componentes de dashboard
│   │   │   └── conversations/ # chat-list, chat-window, message-bubble
│   │   ├── hooks/             # useMetrics, useConversations, useLeads, useBrain, useWebSocket, useAuth
│   │   └── lib/               # api.ts
│   ├── e2e/                   # Playwright E2E
│   └── package.json
├── docs/                      # Diagramas de arquitectura e investor deck
├── docker-compose.yml
├── .env.example
├── dev.ps1 / dev.sh / dev.bat      # Inicio rápido
├── stop.ps1 / stop.sh / stop.bat   # Apagar
├── reset.ps1 / reset.sh / reset.bat # Reiniciar
├── Eco2.html                        # Investor Pitch
├── ECO_FLOW.html                    # Diagrama interactivo
├── ECHO_USER_GUIDE.html             # Guía de usuario
├── INVESTORS.md                     # Pitch para inversores
└── README.md
```

---

## 🧪 Tests

```bash
# Backend
cd backend && pytest -v

# E2E (requiere backend corriendo en :8000)
cd frontend && npx playwright test --project=chromium
# Expected: 8 passed
```

---

## 📄 Documentación

| Documento | Descripción |
|---|---|
| **Echo2.html** | Investor Pitch & Memoria Estratégica |
| **INVESTORS.md** | Modelo de negocio, competencia, roadmap |
| **ECO_FLOW.html** | Diagrama interactivo React Flow del flujo completo |
| **ECHO_USER_GUIDE.html** | Guía paso a paso para nuevos usuarios |
| **docs/echo-architecture-flow.html** | Diagrama de arquitectura técnica |
| **docs/echo-investor-deck.html** | Deck de inversión visual |

---

## 📝 Licencia

MIT
