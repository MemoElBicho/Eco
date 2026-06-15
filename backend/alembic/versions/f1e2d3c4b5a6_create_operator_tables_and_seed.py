"""create_operator_tables_and_seed

Revision ID: f1e2d3c4b5a6
Revises: a1b2c3d4e5f6
Create Date: 2026-06-13 00:00:00.000000
"""
import json
import uuid as _uuid
from datetime import datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1e2d3c4b5a6'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_TEMPLATES: list[dict] = [
    {
        "slug": "eco-ventas",
        "name": "Eco Ventas",
        "description": (
            "Operador de ventas omnicanal con RAG de catálogo, "
            "gestión de leads en CRM y links de pago."
        ),
        "category": "ventas",
        "system_prompt_template": (
            "Eres {bot_name}, asistente de ventas experto de {company_name}. "
            "Atiendes consultas por canales digitales sobre la industria de "
            "{industry} en idioma {language}. Usas la base de conocimiento para "
            "responder con información precisa y persuasiva. Cuando el cliente "
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
            "Operador de atención al cliente y soporte técnico "
            "especializado con escalamiento inteligente."
        ),
        "category": "soporte",
        "system_prompt_template": (
            "Eres {bot_name}, el operador de soporte técnico de "
            "{company_name}. Tu objetivo es resolver incidencias de manera "
            "eficiente en idioma {language}. Tienes acceso a los manuales en la "
            "base de conocimiento. Mantén siempre un tono profesional, empático y "
            "resolutivo. Si el problema requiere atención especializada, usa la "
            "herramienta de escalamiento."
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
            "Operador dedicado a guiar a nuevos clientes en su "
            "proceso de registro y configuración inicial."
        ),
        "category": "onboarding",
        "system_prompt_template": (
            "Eres {bot_name}, especialista de onboarding de "
            "{company_name}. Tu misión es guiar al usuario paso a paso en su "
            "proceso de inicio. Sé muy claro, paciente y estructurado."
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
            "Operador de recordatorios de pago, conciliación de "
            "facturas y envío de alertas de vencimiento."
        ),
        "category": "cobranza",
        "system_prompt_template": (
            "Eres {bot_name}, asistente financiero de {company_name}. "
            "Te encargas de notificar saldos pendientes y ofrecer alternativas "
            "de pago de forma muy cortés, formal y profesional."
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
]


def upgrade() -> None:
    # ──────────── DDL: operator_templates ────────────
    op.create_table(
        'operator_templates',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('system_prompt_template', sa.Text(), nullable=False),
        sa.Column('default_tools', sa.JSON(), nullable=False),
        sa.Column('default_channels', sa.JSON(), nullable=False),
        sa.Column('config_schema', sa.JSON(), nullable=True),
        sa.Column('icon_url', sa.String(length=500), nullable=True),
        sa.Column('version', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug'),
    )
    op.create_index(
        op.f('ix_operator_templates_slug'),
        'operator_templates',
        ['slug'],
        unique=True,
    )

    # ──────────── DDL: operator_instances ────────────
    op.create_table(
        'operator_instances',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('template_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.Column('system_prompt', sa.Text(), nullable=True),
        sa.Column('webhook_token', sa.UUID(), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('deployed_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['workspaces.id']),
        sa.ForeignKeyConstraint(['template_id'], ['operator_templates.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('webhook_token'),
    )
    op.create_index(
        op.f('ix_operator_instances_webhook_token'),
        'operator_instances',
        ['webhook_token'],
        unique=True,
    )

    # ──────────── DDL: operator_tools ────────────
    op.create_table(
        'operator_tools',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('operator_instance_id', sa.UUID(), nullable=False),
        sa.Column('tool_type', sa.String(length=50), nullable=False),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ['operator_instance_id'], ['operator_instances.id']
        ),
        sa.PrimaryKeyConstraint('id'),
    )

    # ──────────── DDL: operator_channels ────────────
    op.create_table(
        'operator_channels',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('operator_instance_id', sa.UUID(), nullable=False),
        sa.Column('channel', sa.String(length=50), nullable=False),
        sa.Column('external_id', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ['operator_instance_id'], ['operator_instances.id']
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'operator_instance_id', 'channel', name='uq_instance_channel'
        ),
    )

    # ──────── DDL: FK column on existing tables ────────
    op.add_column(
        'leads',
        sa.Column('operator_instance_id', sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        'fk_leads_operator_instance',
        'leads',
        'operator_instances',
        ['operator_instance_id'],
        ['id'],
    )
    op.add_column(
        'messages',
        sa.Column('operator_instance_id', sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        'fk_messages_operator_instance',
        'messages',
        'operator_instances',
        ['operator_instance_id'],
        ['id'],
    )
    op.add_column(
        'brain_documents',
        sa.Column('operator_instance_id', sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        'fk_brain_documents_operator_instance',
        'brain_documents',
        'operator_instances',
        ['operator_instance_id'],
        ['id'],
    )

    # ──────── DML: seed catalog templates ────────
    conn = op.get_bind()
    now = datetime.utcnow()
    for t in _TEMPLATES:
        conn.execute(
            sa.text(
                "INSERT INTO operator_templates ("
                "  id, slug, name, description, category, "
                "  system_prompt_template, default_tools, default_channels, "
                "  config_schema, version, is_active, created_at, updated_at"
                ") VALUES ("
                "  :id, :slug, :name, :description, :category, "
                "  :system_prompt_template, :default_tools, :default_channels, "
                "  :config_schema, :version, :is_active, :created_at, :updated_at"
                ") ON CONFLICT (slug) DO NOTHING"
            ),
            {
                "id": _uuid.uuid4(),
                "slug": t["slug"],
                "name": t["name"],
                "description": t["description"],
                "category": t["category"],
                "system_prompt_template": t["system_prompt_template"],
                "default_tools": json.dumps(t["default_tools"]),
                "default_channels": json.dumps(t["default_channels"]),
                "config_schema": json.dumps(t["config_schema"]),
                "version": "1.0.0",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
        )

    # ──── DML: backfill instances for existing workspaces ────
    eco_ventas_row = conn.execute(
        sa.text("SELECT id FROM operator_templates WHERE slug = 'eco-ventas'")
    ).fetchone()
    if eco_ventas_row is None:
        return
    eco_ventas_id = eco_ventas_row[0]

    workspaces = conn.execute(
        sa.text("SELECT id, name FROM workspaces")
    ).fetchall()

    for ws_id, ws_name in workspaces:
        instance_id = _uuid.uuid4()
        token = _uuid.uuid4()
        conn.execute(
            sa.text(
                "INSERT INTO operator_instances ("
                "  id, organization_id, template_id, name, webhook_token,"
                "  model, status, created_at, updated_at"
                ") VALUES ("
                "  :id, :organization_id, :template_id, :name, :webhook_token,"
                "  :model, :status, :created_at, :updated_at"
                ")"
            ),
            {
                "id": instance_id,
                "organization_id": ws_id,
                "template_id": eco_ventas_id,
                "name": ws_name,
                "webhook_token": token,
                "model": "gemini-2.5-flash",
                "status": "active",
                "created_at": now,
                "updated_at": now,
            },
        )
        conn.execute(
            sa.text(
                "UPDATE leads SET operator_instance_id = :iid "
                "WHERE workspace_id = :wid"
            ),
            {"iid": instance_id, "wid": ws_id},
        )
        conn.execute(
            sa.text(
                "UPDATE messages SET operator_instance_id = :iid "
                "WHERE workspace_id = :wid"
            ),
            {"iid": instance_id, "wid": ws_id},
        )
        conn.execute(
            sa.text(
                "UPDATE brain_documents SET operator_instance_id = :iid "
                "WHERE workspace_id = :wid"
            ),
            {"iid": instance_id, "wid": ws_id},
        )


def downgrade() -> None:
    # Remove FK column from existing tables
    op.drop_constraint(
        'fk_brain_documents_operator_instance',
        'brain_documents',
        type_='foreignkey',
    )
    op.drop_column('brain_documents', 'operator_instance_id')
    op.drop_constraint(
        'fk_messages_operator_instance',
        'messages',
        type_='foreignkey',
    )
    op.drop_column('messages', 'operator_instance_id')
    op.drop_constraint(
        'fk_leads_operator_instance',
        'leads',
        type_='foreignkey',
    )
    op.drop_column('leads', 'operator_instance_id')

    # Drop child tables first (FK to operator_instances)
    op.drop_table('operator_channels')
    op.drop_table('operator_tools')

    # Drop operator_instances (FK to operator_templates + workspaces)
    op.drop_index(
        op.f('ix_operator_instances_webhook_token'),
        table_name='operator_instances',
    )
    op.drop_table('operator_instances')

    # Drop parent table
    op.drop_index(
        op.f('ix_operator_templates_slug'),
        table_name='operator_templates',
    )
    op.drop_table('operator_templates')
