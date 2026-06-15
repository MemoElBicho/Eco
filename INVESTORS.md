# Eco — Investor Pitch

> **Un asistente de IA que vive en tu WhatsApp y Telegram, conoce tus documentos internos, y organiza tus clientes automáticamente. Corre en tu propio servidor, tus datos no salen de tu control.**

---

## 1. ¿Qué es Eco?

Eco es una plataforma **self-hosted** de automatización conversacional con IA para PYMES. Conecta WhatsApp y Telegram a un agente de inteligencia artificial que:

- **Responde automáticamente** usando el conocimiento real del negocio (PDFs, políticas, catálogos)
- **Organiza leads** en un CRM integrado, con calificación automática por sentimiento
- **Permite intervención humana** en tiempo real desde un dashboard unificado
- **Sincroniza bidireccionalmente** con HubSpot (CRM externo)
- **Corre en el servidor del cliente** — datos 100% privados, sin suscripciones SaaS obligatorias

---

## 2. ¿Para quién es?

| Vertical | Problema que resuelve | Caso real |
|---|---|---|
| **Inmobiliarias** | Responder consultas de propiedades 24/7 | Bot que responde precio, ubicación, metros desde PDF del catálogo y deja el lead calificado en CRM |
| **Clínicas/Consultorios** | Agendar citas, FAQs, derivar urgencias | Paciente escribe por WhatsApp, el bot confirma disponibilidad y deriva casos urgentes al doctor |
| **E-commerce chico** | Soporte post-venta automatizado | "¿Dónde está mi pedido?" → bot consulta orden y responde sin intervención humana |
| **Hoteles/Agencias** | Información de servicios, tours, reservas | Catálogo PDF → bot responde disponibilidad, precios, políticas de cancelación |
| **Bufetes/Consultorías** | Responder con base en documentos legales/técnicos | Cliente pregunta sobre un servicio, el bot responde usando los PDFs del despacho |
| **Colegios/Academias** | Inscripciones, calendarios, captación | Padres preguntan requisitos por WhatsApp, el bot responde y captura sus datos |

---

## 3. ¿Cómo funciona? (Demo en 60 segundos)

```mermaid
sequenceDiagram
    participant C as 🧑 Cliente
    participant WA as WhatsApp/Telegram
    participant API as FastAPI Webhook
    participant Q as Celery + Redis
    participant RAG as pgvector RAG
    participant AI as Gemini 2.5 Flash
    participant DB as PostgreSQL (Lead)
    participant WS as WebSocket
    participant D as 📊 Dashboard

    C->>WA: "¿Tienen habitación doble?"
    WA->>API: POST /webhooks/whatsapp
    API->>Q: process_message.delay()
    Q->>DB: Buscar/Crear Lead
    Q->>RAG: Buscar docs relevantes
    RAG-->>Q: Top-3 chunks (similitud coseno)
    Q->>AI: Prompt: contexto + mensaje
    AI-->>Q: "Sí, $1,200 MXN con desayuno"
    Q->>DB: Guardar mensaje (out)
    Q-->>WA: Enviar respuesta
    WA-->>C: Respuesta del bot
    Q->>WS: Broadcast msg (in + out)
    WS-->>D: Chat en vivo actualizado
```

**El cliente nunca sabe si habla con IA o con un humano.** Y el negocio mantiene el control total.

---

## 4. Stack Técnico

| Capa | Tecnología | ¿Por qué? |
|---|---|---|
| **Backend** | FastAPI + Python 3.11 | Async nativo, alta concurrencia, tipado fuerte |
| **Base de datos** | PostgreSQL 16 + pgvector | Búsqueda vectorial sobre documentos del negocio |
| **Cola de tareas** | Celery + Redis | Procesamiento asíncrono con reintentos ante fallos |
| **IA** | Gemini 2.5 Flash + gemini-embedding-001 | RAG pipeline: embeddings 3072d + generación contextual |
| **Mensajería** | Telegram Bot API, Meta WhatsApp Cloud API v21.0 | Canales directos donde ya están los clientes |
| **Frontend** | Next.js 16 + Tailwind CSS v4 + shadcn/ui | App Router, server components, WebSocket en tiempo real |
| **Tiempo real** | FastAPI WebSockets | Mensajes entrantes/salientes al dashboard sin recargar |
| **CRM Externo** | HubSpot API v3 | Sincronización bidireccional de contactos |
| **Pagos** | Stripe Checkout + Billing Portal | Monetización multi-plan (free, pro, enterprise) |
| **CI/CD** | GitHub Actions | Tests de backend (pytest) + E2E (Playwright) |
| **Infraestructura** | Docker Compose, ngrok | Deploy local en 1 comando, túnel público para webhooks |

```mermaid
flowchart TB
    subgraph Canales["📱 Canales de Entrada"]
        WA[WhatsApp Cloud API]
        TG[Telegram Bot API]
    end

    subgraph Backend["⚙️ Backend — FastAPI"]
        WH[Webhooks]
        WS[WebSocket Manager]
        Auth[JWT Auth + RBAC]
    end

    subgraph Workers["🔄 Procesamiento — Celery + Redis"]
        CW[Celery Worker]
        RAG[RAG Pipeline]
    end

    subgraph AI["🤖 Inteligencia Artificial"]
        GE[Gemini Embeddings]
        GF[Gemini 2.5 Flash]
    end

    subgraph DB["🗄️ Datos"]
        PG[(PostgreSQL + pgvector)]
    end

    subgraph Frontend["🖥️ Dashboard — Next.js"]
        Leads[CRM Leads]
        Chat[Live Chat Hub]
        Brain[Eco Brain]
        Settings[Settings]
    end

    subgraph Ext["🔌 Integraciones"]
        HS[HubSpot CRM]
        ST[Stripe Pagos]
    end

    WA & TG --> WH
    WH --> CW
    CW --> RAG
    RAG --> GE
    RAG --> PG
    CW --> GF
    GF --> CW
    CW --> WA & TG
    CW --> WS
    WS --> Chat
    Auth --> Leads & Brain & Settings
    Leads & Chat & Brain --> PG
    CW --> HS
    Frontend --> ST
```

---

## 5. Filosofía: Harness Engineering

> *"No reinventamos la rueda. Ensamblamos las mejores piezas y las hacemos funcionar juntas."*

Eco no compite construyendo modelos de IA propios ni reinventando infraestructura. Competimos en **integración y experiencia**:

| Principio | Aplicación en Eco |
|---|---|
| **Stand on giants** | Gemini para IA, pgvector para búsqueda, Celery para tareas — tecnología probada en producción |
| **Glue, not rebuild** | FastAPI actúa como orquestador entre WhatsApp, Telegram, IA, DB y frontend |
| **Data sovereignty** | Self-hosted: el cliente es dueño de sus datos, sus conversaciones, sus documentos |
| **Progressive complexity** | Funciona en 1 comando (`dev.bat`). La complejidad (multi-tenant, multi-canal, RAG) está abstraída |
| **Human-in-the-loop** | La IA no reemplaza al humano — lo asiste. Un clic y el humano toma el control |

---

## 6. Modelo de Negocio

| Plan | Precio | Incluye |
|---|---|---|
| **Free** | $0/mes | 50 mensajes/mes, 1 documento, 3 leads |
| **Pro** | $49/mes | Mensajes ilimitados, 50 documentos, leads ilimitados, HubSpot sync |
| **Enterprise** | $199/mes | Multi-workspace, white-label, soporte prioritario, integraciones personalizadas |

**Ventaja competitiva en pricing:** Al ser self-hosted, no hay costo de infraestructura para Eco. El cliente paga su propio VPS ($6/mes) + su API key de Gemini (pay-per-use).

---

## 7. Competencia y Posicionamiento

| | **Eco** | **Sintra.ai** | **ManyChat** | **Chatbase** |
|---|---|---|---|---|
| Self-hosted | ✅ | ❌ | ❌ | ❌ |
| WhatsApp + Telegram | ✅ | ❌ | ✅ | ❌ |
| CRM integrado | ✅ | ❌ | ❌ | ❌ |
| RAG con docs propios | ✅ | Limitado | ❌ | ✅ |
| Multi-tenant | ✅ | ✅ | ❌ | ❌ |
| White-label | ✅ | ❌ | ❌ | ❌ |
| Precio entry | $0 | $59/mes | $15/mes | $19/mes |

**Diferenciador clave:** Eco es el único que ofrece self-hosted + IA con RAG + CRM + multi-canal en un solo producto. El cliente controla sus datos y paga solo por lo que usa.

---

## 8. Roadmap

| Fase | Estado | Hito |
|---|---|---|
| **Fase 1-5** | ✅ Completado | Backend, Telegram, WhatsApp, Dashboard, Stripe |
| **Fase 6** | ✅ Completado | RAG con pgvector + Gemini, Brain upload de documentos |
| **Fase 7** | ✅ Completado | Stripe suscripciones, facturación, webhooks de pago |
| **Fase 8** | ✅ Completado | HubSpot CRM bidireccional, sincronización de contactos |
| **Fase 9** | ✅ Completado | Tests automatizados (pytest + Playwright), CI/CD |
| **Fase 10** | 🔜 Próximo | One-click deploy, white-label, analytics dashboard |
| **Fase 11** | 📋 Planeado | Voice calls, Instagram DM, acciones reales (agendar, pagar) |
| **Fase 12** | 📋 Planeado | Multi-agente (ventas/soporte/cobranza), no-code flow builder |

---

## 9. Cómo llevar Eco al siguiente nivel

| Mejora | Impacto | Descripción |
|---|---|---|
| **One-click deploy** | 🚀 Adopción | `curl \| bash` y en 60 segundos Eco corre en un VPS de $6/mes con SSL y dominio. Sin Docker, sin manuales. |
| **Templates por industria** | 🎯 Conversión | Inmobiliario, salud, e-commerce, educación — el cliente elige su vertical y Eco precarga PDFs, respuestas y flujos. Onboarding de 15 min → 5 min. |
| **Multi-agente** | 🧠 Diferenciación | Agentes IA separados por área (ventas, soporte, cobranza) con personalidad y conocimiento distintos. Enrutados por intención del mensaje. |
| **White-label total** | 🏷️ Empresas | Logo, colores, nombre del bot, dominio propio del cliente. Eco invisible. Ideal para agencias que revenden a sus clientes. |
| **Voice + más canales** | 📞 Alcance | Llamadas telefónicas (TTS/STV), Instagram DM, Facebook Messenger, email. Donde está el cliente, ahí está Eco. |
| **Acciones reales** | ⚡ Valor | El bot ejecuta: crea cotizaciones, manda link de pago, agenda en Google Calendar, consulta stock del ERP. |
| **Analytics dashboard** | 📊 Retención | Qué preguntan, tasa de resolución bot vs humano, en qué etapa se caen los leads, ROI por canal. Datos que el negocio necesita. |
| **Multi-idioma nativo** | 🌍 Mercado | Detección automática de idioma, respuesta en el mismo idioma. Expande el TAM a LATAM, Europa, Asia. |

**Arquitectura Multi-Agente (Fase 12):**

```mermaid
flowchart LR
    C[🧑 Cliente] --> WA[WhatsApp/Telegram]
    WA --> R{🧠 Router de Intención}
    R -->|"comprar, precio, cotizar"| V[🤝 Agente Ventas]
    R -->|"ayuda, error, garantía"| S[🎧 Agente Soporte]
    R -->|"pago, factura, deuda"| CO[💰 Agente Cobranza]
    V --> KB_V[(PDFs de Productos)]
    S --> KB_S[(Manuales y Políticas)]
    CO --> KB_C[(Políticas de Pago)]
    V --> CRM[(CRM + HubSpot)]
    S --> CRM
    CO --> CRM
```

---

## 10. ¿Qué hace a Eco defendible?

1. **Efecto compounding del conocimiento:** Cada documento que el cliente sube hace al bot más inteligente para SU negocio — migrar a otra plataforma significa re-entrenar desde cero.
2. **Integración vertical:** El cliente no necesita 4 herramientas (bot + CRM + knowledge base + dashboard). Eco es las 4 en una.
3. **Costo de cambio bajo para adoptar, alto para abandonar:** Entrar es gratis. Salir implica perder todo el conocimiento acumulado, los leads organizados y la integración con HubSpot.
4. **Datos como foso:** Mientras más conversaciones procesa Eco, mejor entendemos los patrones de cada industria para ofrecer templates pre-entrenados.

---

## 11. Métricas Clave (Proyectadas)

| Métrica | Año 1 | Año 2 |
|---|---|---|
| Clientes activos | 50 | 300 |
| MRR | $2,450 | $14,700 |
| Churn mensual | <5% | <3% |
| CAC (costo adquisición) | $40 | $25 |
| LTV | $588 | $980 |
| Tiempo de onboarding | 15 min | 5 min (con templates) |

---

## 12. Equipo y Filosofía

Eco se construye bajo **Harness Engineering**: no competimos en investigación de IA fundamental. Nuestra ventaja es saber integrar lo mejor que ya existe (Gemini, pgvector, FastAPI, Celery) en un producto que una PYME puede instalar, entender y usar en una tarde.

**Principios del equipo:**
- **Ship fast, iterate faster** — funcional sobre perfecto
- **El código es un liability, no un asset** — menos líneas, menos bugs
- **Self-hosted no significa complicado** — `dev.bat` y listo
- **El usuario es dueño de sus datos** — sin excepciones

---

## 13. La Oportunidad

Hay **330 millones de PYMES** en el mundo. La mayoría usa WhatsApp para comunicarse con clientes. Casi ninguna tiene un bot con IA que conozca su negocio. Las que lo intentan usan SaaS que se llevan sus datos y cobran por mensaje.

**Eco les da el control. Por el precio de un VPS.**

---

*Eco v0.1.0 — Junio 2026*
