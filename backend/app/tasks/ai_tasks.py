from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.lead import Lead
from app.models.message import Message
from app.models.workspace import Workspace
from app.services.agent import generate_response
from app.services.brain import query_brain
from app.services.telegram_client import send_message as telegram_send
from app.services.whatsapp_client import send_message as whatsapp_send
from app.tasks.celery_app import celery_app
from openai import OpenAIError
from app.core.websocket import manager

SENDERS = {"telegram": telegram_send, "whatsapp": whatsapp_send}


async def _resolve_or_create(session, channel: str, user_id: str, workspace_id: str | None = None) -> tuple[str, str]:
    result = await session.execute(select(Lead).where(Lead.channel == channel, Lead.channel_user_id == user_id))
    lead = result.scalars().first()
    if lead:
        return str(lead.id), str(lead.workspace_id)

    ws = None
    if workspace_id and workspace_id != "workspace_id_placeholder":
        result = await session.execute(select(Workspace).where(Workspace.id == workspace_id))
        ws = result.scalars().first()
    if not ws:
        result = await session.execute(select(Workspace).order_by(Workspace.created_at).limit(1))
        ws = result.scalars().first()
    if not ws:
        ws = Workspace(name="Default Workspace")
        session.add(ws)
        await session.flush()

    lead = Lead(name=user_id, channel=channel, channel_user_id=user_id, workspace_id=ws.id)
    session.add(lead)
    await session.flush()
    lead_id, workspace_id = str(lead.id), str(ws.id)
    await session.commit()
    return lead_id, workspace_id


@celery_app.task(bind=True, autoretry_for=(OpenAIError,), retry_backoff=True, max_retries=3)
def process_message(self, workspace_id: str, channel: str, from_user: str, content: str, channel_message_id: str):
    import asyncio
    asyncio.run(_async_process_message(workspace_id, channel, from_user, content, channel_message_id))


async def _async_process_message(workspace_id: str, channel: str, from_user: str, content: str, channel_message_id: str):
    engine = create_async_engine(settings.database_url, echo=settings.debug)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as session:
        try:
            lead_id, ws_id = await _resolve_or_create(session, channel, from_user, workspace_id)

            msg_in = Message(workspace_id=ws_id, channel=channel, channel_message_id=channel_message_id, from_user=from_user, content=content, direction="in", lead_id=lead_id)
            session.add(msg_in)
            await session.flush()

            await manager.broadcast(ws_id, {
                "type": "new_message",
                "lead_id": lead_id,
                "message": {
                    "id": str(msg_in.id), "channel": channel, "from_user": from_user,
                    "content": content, "direction": "in", "created_at": msg_in.created_at.isoformat(),
                },
            })

            result = await session.execute(select(Lead).where(Lead.id == lead_id))
            lead = result.scalars().first()
            if lead and not lead.bot_active:
                await session.commit()
                return

            ctx = await query_brain(content, ws_id, session)
            response = await generate_response(content, ctx, session, ws_id)
            msg_out = Message(workspace_id=ws_id, channel=channel, from_user="eco_bot", content=response, direction="out", lead_id=lead_id)
            session.add(msg_out)
            await session.commit()

            await manager.broadcast(ws_id, {
                "type": "new_message",
                "lead_id": lead_id,
                "message": {
                    "id": str(msg_out.id), "channel": channel, "from_user": "eco_bot",
                    "content": response, "direction": "out", "created_at": msg_out.created_at.isoformat(),
                },
            })

            sender = SENDERS.get(channel)
            if sender:
                await sender(session, ws_id, from_user, response)

        finally:
            await engine.dispose()
