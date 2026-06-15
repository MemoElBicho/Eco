"""Idempotent demo seed: workspace, user, operator instance, leads + conversations."""

import datetime
import uuid

import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace
from app.models.user import User
from app.models.lead import Lead
from app.models.message import Message
from app.models.operator_template import OperatorTemplate
from app.models.operator_instance import OperatorInstance
from app.models.operator_channel import OperatorChannel
from app.models.operator_tool import OperatorTool

DEMO_EMAIL = "demo@eco.ai"
DEMO_PASSWORD = "demo1234"

LEADS_SEED: list[dict] = [
    {
        "name": "Carlos Mendoza",
        "phone": "+5215512345678",
        "channel": "whatsapp",
        "channel_user_id": "5215512345678",
        "status": "new",
        "messages": [
            ("in", "Hola, buenos dias. Queria informacion sobre los arneses de seguridad que manejan."),
            ("out", "Hola Carlos! Claro, con gusto. Contamos con el Arnes EP-200 de 5 puntos de anclaje con certificacion OSHA/ANSI. Podrias indicarme cuantas unidades necesitas?"),
            ("in", "Estaria necesitando 10 piezas para mi equipo de trabajo. Tienen disponibilidad?"),
            ("out", "Si, tenemos disponibilidad inmediata. Te puedo hacer un descuento por volumen: $1,850 MXN por pieza en pedidos de 10+. Te genero una cotizacion formal?"),
        ],
    },
    {
        "name": "Ana Gomez",
        "phone": "+5215556789012",
        "channel": "whatsapp",
        "channel_user_id": "5215556789012",
        "status": "in_progress",
        "messages": [
            ("in", "Buenas tardes. Me interesa el catalogo de varilla corrugada 3/8."),
            ("out", "Hola Ana! Tenemos varilla corrugada grado 42 de 12 metros a $128 MXN cada una. Cuantas piezas requieres?"),
            ("in", "Necesito 50 piezas. Hacen envios a Monterrey?"),
            ("out", "Si, hacemos envios a todo el pais. A Monterrey el flete tiene un costo de $1,200 MXN y llega en 3-5 dias habiles. Te genero una cotizacion formal?"),
            ("in", "Si, por favor. Me puedes enviar la cotizacion al correo ana.gomez@ejemplo.com?"),
        ],
    },
    {
        "name": "Sofia Reyes",
        "phone": "+5215534567890",
        "channel": "whatsapp",
        "channel_user_id": "5215534567890",
        "status": "closed",
        "messages": [
            ("in", "Hola, cual es el precio del cemento Portland?"),
            ("out", "Hola Sofia! El cemento Portland Tipo I en presentacion de 50kg tiene un precio de $245 MXN por saco, o $9,600 MXN la tarima de 40 piezas."),
            ("in", "Perfecto, necesito 2 tarimas. Puedo pasar a recogerlas hoy?"),
            ("out", "Claro, tenemos disponibilidad. Te esperamos en nuestra sucursal. Te generamos el remision con tus datos?"),
            ("in", "Si, mis datos son: Sofia Reyes, RFC SORJ880101XXX. Paso en una hora."),
            ("out", "Listo! Remision generada con folio R-2026-0042. Te esperamos. Gracias por tu compra!"),
        ],
    },
]


async def seed_demo_data(db: AsyncSession) -> None:
    ws = await _get_or_create_workspace(db)
    user = await _get_or_create_user(db, ws.id)
    instance = await _get_or_create_operator_instance(db, ws.id)
    leads = await _seed_leads(db, ws.id)
    if leads:
        print(f"  {len(leads)} leads seeded with conversations.")


async def _get_or_create_workspace(db: AsyncSession) -> Workspace:
    result = await db.execute(
        select(Workspace).where(Workspace.name == "Demo Workspace")
    )
    ws = result.scalar_one_or_none()
    if ws:
        return ws
    ws = Workspace(name="Demo Workspace")
    db.add(ws)
    await db.flush()
    print(f"  Created Demo Workspace {ws.id}")
    return ws


async def _get_or_create_user(db: AsyncSession, workspace_id: uuid.UUID) -> User:
    result = await db.execute(select(User).where(User.email == DEMO_EMAIL))
    user = result.scalar_one_or_none()
    if user:
        return user
    hashed = bcrypt.hashpw(DEMO_PASSWORD.encode(), bcrypt.gensalt()).decode()
    user = User(
        email=DEMO_EMAIL,
        hashed_password=hashed,
        name="Demo Admin",
        workspace_id=workspace_id,
    )
    db.add(user)
    await db.flush()
    print(f"  Created demo user {DEMO_EMAIL}")
    return user


async def _get_or_create_operator_instance(
    db: AsyncSession, workspace_id: uuid.UUID
) -> OperatorInstance | None:
    result = await db.execute(
        select(OperatorInstance).where(
            OperatorInstance.organization_id == workspace_id,
            OperatorInstance.name == "Echo Demo Bot",
        )
    )
    instance = result.scalar_one_or_none()
    if instance:
        return instance

    tpl_result = await db.execute(
        select(OperatorTemplate).where(OperatorTemplate.slug == "eco-ventas")
    )
    template = tpl_result.scalar_one_or_none()
    if not template:
        print("  SKIP: eco-ventas template not found. Run seed_operators first.")
        return None

    instance = OperatorInstance(
        organization_id=workspace_id,
        template_id=template.id,
        name="Echo Demo Bot",
        config={
            "bot_name": "Echo",
            "company_name": "Demo Corp",
            "industry": "ecommerce",
            "language": "es",
        },
        status="active",
        deployed_at=datetime.datetime.utcnow(),
    )
    db.add(instance)
    await db.flush()

    db.add(OperatorChannel(operator_instance_id=instance.id, channel="whatsapp"))
    db.add(OperatorChannel(operator_instance_id=instance.id, channel="telegram"))
    for tool_type in template.default_tools:
        db.add(OperatorTool(operator_instance_id=instance.id, tool_type=tool_type))
    await db.flush()
    print(f"  Created demo bot {instance.name}")
    return instance


async def _seed_leads(db: AsyncSession, workspace_id: uuid.UUID) -> list[Lead]:
    result = await db.execute(
        select(Lead).where(Lead.workspace_id == workspace_id)
    )
    existing = result.scalars().all()
    if existing:
        return existing

    leads = []
    for info in LEADS_SEED:
        lead = Lead(
            workspace_id=workspace_id,
            **{k: v for k, v in info.items() if k != "messages"},
        )
        db.add(lead)
        await db.flush()

        ts = datetime.datetime.utcnow() - datetime.timedelta(
            hours=len(info["messages"])
        )
        for direction, content in info["messages"]:
            db.add(
                Message(
                    workspace_id=workspace_id,
                    channel=info["channel"],
                    from_user="eco_bot" if direction == "out" else info["channel_user_id"],
                    content=content,
                    direction=direction,
                    lead_id=lead.id,
                    created_at=ts,
                )
            )
            ts += datetime.timedelta(hours=1)

        leads.append(lead)
        print(f"    {info['name']} ({info['status']}) — {len(info['messages'])} messages")

    return leads
