"""Seed data for development. Usage: docker compose run --rm backend python -m seed_data"""
import asyncio
import datetime

from sqlalchemy import select

from app.database import async_session
from app.models.workspace import Workspace
from app.models.user import User
from app.models.lead import Lead
from app.models.message import Message


SEED = [
    {
        "name": "Carlos Mendoza", "phone": "+5215512345678", "channel": "whatsapp",
        "channel_user_id": "5215512345678", "status": "new",
        "messages": [
            ("in", "Hola, buenos días. Quería información sobre los arneses de seguridad que manejan."),
            ("out", "¡Hola Carlos! Claro, con gusto. Contamos con el Arnés EP-200 de 5 puntos de anclaje con certificación OSHA/ANSI. ¿Podrías indicarme cuántas unidades necesitas?"),
            ("in", "Estaría necesitando 10 piezas para mi equipo de trabajo. ¿Tienen disponibilidad?"),
        ],
    },
    {
        "name": "Ana Gómez", "phone": "+5215556789012", "channel": "whatsapp",
        "channel_user_id": "5215556789012", "status": "in_progress",
        "messages": [
            ("in", "Buenas tardes. Me interesa el catálogo de varilla corrugada 3/8."),
            ("out", "¡Hola Ana! Tenemos varilla corrugada grado 42 de 12 metros a $128 MXN cada una. ¿Cuántas piezas requieres?"),
            ("in", "Necesito 50 piezas. ¿Hacen envíos a Monterrey?"),
            ("out", "Sí, hacemos envíos a todo el país. A Monterrey el flete tiene un costo de $1,200 MXN y llega en 3-5 días hábiles. ¿Te genero una cotización formal?"),
            ("in", "Sí, por favor. ¿Me puedes enviar la cotización al correo ana.gomez@ejemplo.com?"),
        ],
    },
    {
        "name": "Sofía Reyes", "phone": "+5215534567890", "channel": "whatsapp",
        "channel_user_id": "5215534567890", "status": "closed",
        "messages": [
            ("in", "Hola, ¿cuál es el precio del cemento Portland?"),
            ("out", "¡Hola Sofía! El cemento Portland Tipo I en presentación de 50kg tiene un precio de $245 MXN por saco, o $9,600 MXN la tarima de 40 piezas."),
            ("in", "Perfecto, necesito 2 tarimas. ¿Puedo pasar a recogerlas hoy?"),
            ("out", "Claro, tenemos disponibilidad. Te esperamos en nuestra sucursal. ¿Te generamos el remisión con tus datos?"),
            ("in", "Sí, mis datos son: Sofía Reyes, RFC SORJ880101XXX. Paso en una hora."),
            ("out", "¡Listo! Remisión generada con folio R-2026-0042. Te esperamos. ¡Gracias por tu compra!"),
        ],
    },
]


async def seed():
    async with async_session() as db:
        result = await db.execute(select(Workspace).join(User, User.workspace_id == Workspace.id).limit(1))
        ws = result.scalar_one_or_none()
        if not ws:
            result = await db.execute(select(Workspace).limit(1))
            ws = result.scalar_one_or_none()
            if not ws:
                ws = Workspace(name="Demo Workspace")
                db.add(ws)
                await db.flush()
        print(f"Using workspace {ws.id}")

        for lead_info in SEED:
            lead = Lead(workspace_id=ws.id, **{k: v for k, v in lead_info.items() if k != "messages"})
            db.add(lead)
            await db.flush()

            ts = datetime.datetime.utcnow() - datetime.timedelta(hours=len(lead_info["messages"]))
            for direction, content in lead_info["messages"]:
                msg = Message(
                    workspace_id=ws.id,
                    channel=lead_info["channel"],
                    from_user="eco_bot" if direction == "out" else lead_info["channel_user_id"],
                    content=content,
                    direction=direction,
                    lead_id=lead.id,
                    created_at=ts,
                )
                db.add(msg)
                ts += datetime.timedelta(hours=1)

            print(f"  {lead_info['name']} ({lead_info['status']}) — {len(lead_info['messages'])} messages")

        await db.commit()
        print("\nDone. 3 leads with conversations created.")


if __name__ == "__main__":
    asyncio.run(seed())
