from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.operator_template import OperatorTemplate

TEMPLATES: list[dict] = [
    {
        "slug": "eco-ventas",
        "name": "Eco Ventas",
        "description": (
            "Operador de ventas omnicanal con RAG de catalogo, gestion de leads "
            "en CRM y links de pago."
        ),
        "category": "ventas",
        "system_prompt_template": (
            "Eres {bot_name}, asistente de ventas experto de {company_name}. "
            "Atiendes consultas por canales digitales sobre la industria de "
            "{industry} en idioma {language}. Usas la base de conocimiento para "
            "responder con informacion precisa y persuasiva. Cuando el cliente "
            "quiera cotizar o comprar, usas las herramientas para gestionar el "
            "proceso. Si no puedes resolver una duda, escalas a un humano."
        ),
        "default_tools": ["brain", "crm", "webhook_out"],
        "default_channels": ["whatsapp", "telegram"],
        "config_schema": {
            "type": "object",
            "properties": {
                "bot_name": {"type": "string", "default": "Eco"},
                "company_name": {"type": "string"},
                "industry": {
                    "type": "string",
                    "enum": [
                        "inmobiliaria",
                        "salud",
                        "ecommerce",
                        "educacion",
                        "restaurantes",
                        "automotriz",
                        "otro",
                    ],
                },
                "language": {"type": "string", "default": "es"},
            },
            "required": ["company_name", "industry"],
        },
    },
    {
        "slug": "eco-soporte",
        "name": "Eco Soporte",
        "description": (
            "Operador de atencion al cliente y soporte tecnico especializado "
            "con escalamiento inteligente."
        ),
        "category": "soporte",
        "system_prompt_template": (
            "Eres {bot_name}, el operador de soporte tecnico de {company_name}. "
            "Tu objetivo es resolver incidencias de manera eficiente en idioma "
            "{language}. Tienes acceso a los manuales en la base de conocimiento. "
            "Manten siempre un tono profesional, empatico y resolutivo. Si el "
            "problema requiere atencion especializada, usa la herramienta de "
            "escalamiento."
        ),
        "default_tools": ["brain", "escalate"],
        "default_channels": ["whatsapp"],
        "config_schema": {
            "type": "object",
            "properties": {
                "bot_name": {"type": "string", "default": "Eco"},
                "company_name": {"type": "string"},
                "language": {"type": "string", "default": "es"},
            },
            "required": ["company_name"],
        },
    },
    {
        "slug": "eco-onboarding",
        "name": "Eco Onboarding",
        "description": (
            "Operador dedicado a guiar a nuevos clientes en su proceso de "
            "registro y configuracion inicial."
        ),
        "category": "onboarding",
        "system_prompt_template": (
            "Eres {bot_name}, especialista de onboarding de {company_name}. "
            "Tu mision es guiar al usuario paso a paso en su proceso de inicio. "
            "Se muy claro, paciente y estructurado."
        ),
        "default_tools": ["crm", "webhook_out"],
        "default_channels": ["whatsapp", "telegram"],
        "config_schema": {
            "type": "object",
            "properties": {
                "bot_name": {"type": "string", "default": "Eco"},
                "company_name": {"type": "string"},
            },
            "required": ["company_name"],
        },
    },
    {
        "slug": "eco-cobranza",
        "name": "Eco Cobranza",
        "description": (
            "Operador de recordatorios de pago, conciliacion de facturas y "
            "envio de alertas de vencimiento."
        ),
        "category": "cobranza",
        "system_prompt_template": (
            "Eres {bot_name}, asistente financiero de {company_name}. Te "
            "encargas de notificar saldos pendientes y ofrecer alternativas de "
            "pago de forma muy cortes, formal y profesional."
        ),
        "default_tools": ["crm", "webhook_out"],
        "default_channels": ["whatsapp"],
        "config_schema": {
            "type": "object",
            "properties": {
                "bot_name": {"type": "string", "default": "Eco"},
                "company_name": {"type": "string"},
            },
            "required": ["company_name"],
        },
    },
    {
        "slug": "eco-assistant",
        "name": "Eco Assistant",
        "description": (
            "Asistente de IA multi-proposito con capacidad de RAG y CRM. "
            "Ideal para demostraciones y pruebas rapidas."
        ),
        "category": "demo",
        "system_prompt_template": (
            "Eres {bot_name}, el asistente inteligente de {company_name}. "
            "Respondes en idioma {language} con un tono profesional y amable. "
            "Ayudas con consultas generales, informacion de productos, y "
            "gestion de leads en el CRM. Si no sabes algo, lo indicas con "
            "honestidad y ofreces escalar a un humano."
        ),
        "default_tools": ["brain", "crm"],
        "default_channels": ["whatsapp"],
        "config_schema": {
            "type": "object",
            "properties": {
                "bot_name": {"type": "string", "default": "Eco"},
                "company_name": {"type": "string"},
                "language": {"type": "string", "default": "es"},
            },
            "required": ["company_name"],
        },
    },
]


async def seed_operator_templates(db: AsyncSession) -> None:
    stmt = pg_insert(OperatorTemplate).values(TEMPLATES)
    stmt = stmt.on_conflict_do_nothing(index_elements=["slug"])
    await db.execute(stmt)
    await db.flush()
