import uuid
from datetime import datetime as dt

from openai import OpenAIError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import joinedload, selectinload

from app.config import settings
from app.core.websocket import manager
from app.models.lead import Lead
from app.models.message import Message
from app.models.operator_instance import OperatorInstance
from app.models.subscription import Subscription
from app.models.workspace import Workspace
from app.models.workspace_config import WorkspaceConfig
from app.services.agent import generate_response
from app.services.brain import query_brain
from app.services.sentiment import analyze_sentiment
from app.services.telegram_client import send_telegram_message
from app.services.whatsapp_client import send_whatsapp_message
from app.tasks.celery_app import celery_app

SENDERS = {
    "telegram": send_telegram_message,
    "whatsapp": send_whatsapp_message,
}


async def _resolve_or_create(
    session,
    channel: str,
    user_id: str,
    workspace_id: str | None = None,
    instance_id: str | None = None,
) -> tuple[str, str]:
    result = await session.execute(
        select(Lead).where(
            Lead.channel == channel, Lead.channel_user_id == user_id
        )
    )
    lead = result.scalars().first()
    if lead:
        return str(lead.id), str(lead.workspace_id)

    ws = None
    if workspace_id and workspace_id != "workspace_id_placeholder":
        result = await session.execute(
            select(Workspace).where(Workspace.id == workspace_id)
        )
        ws = result.scalars().first()
    if not ws:
        result = await session.execute(
            select(Workspace).order_by(Workspace.created_at).limit(1)
        )
        ws = result.scalars().first()
    if not ws:
        ws = Workspace(name="Default Workspace")
        session.add(ws)
        await session.flush()

    lead = Lead(
        name=user_id,
        channel=channel,
        channel_user_id=user_id,
        workspace_id=ws.id,
        operator_instance_id=instance_id,
    )
    session.add(lead)
    await session.flush()
    lead_id, ws_id = str(lead.id), str(ws.id)
    await session.commit()
    return lead_id, ws_id


@celery_app.task(
    bind=True,
    autoretry_for=(OpenAIError,),
    retry_backoff=True,
    max_retries=3,
)
def process_message(
    self,
    instance_id: str,
    channel: str,
    from_user: str,
    content: str,
    channel_message_id: str,
):
    import asyncio

    asyncio.run(
        _async_process_message(
            instance_id, channel, from_user, content, channel_message_id
        )
    )


async def _async_process_message(
    instance_id: str,
    channel: str,
    from_user: str,
    content: str,
    channel_message_id: str,
):
    engine = create_async_engine(settings.database_url, echo=settings.debug)
    Session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with Session() as session:
        try:
            iid = uuid.UUID(instance_id)
            result = await session.execute(
                select(OperatorInstance)
                .options(
                    joinedload(OperatorInstance.template),
                    selectinload(OperatorInstance.tools),
                    selectinload(OperatorInstance.channels),
                )
                .where(
                    OperatorInstance.id == iid,
                    OperatorInstance.status == "active",
                )
            )
            instance = result.scalars().first()
            if not instance:
                return

            ws_id_str = str(instance.organization_id)

            lead_id, lead_ws_id = await _resolve_or_create(
                session,
                channel,
                from_user,
                workspace_id=ws_id_str,
                instance_id=instance_id,
            )

            msg_in = Message(
                workspace_id=lead_ws_id,
                channel=channel,
                channel_message_id=channel_message_id,
                from_user=from_user,
                content=content,
                direction="in",
                lead_id=lead_id,
                operator_instance_id=instance.id,
            )
            session.add(msg_in)
            await session.flush()

            await manager.broadcast(lead_ws_id, {
                "type": "new_message",
                "lead_id": lead_id,
                "message": {
                    "id": str(msg_in.id),
                    "channel": channel,
                    "from_user": from_user,
                    "content": content,
                    "direction": "in",
                    "created_at": msg_in.created_at.isoformat(),
                },
            })

            lead_result = await session.execute(
                select(Lead).where(Lead.id == lead_id)
            )
            lead = lead_result.scalars().first()

            if lead:
                cfg = await session.execute(
                    select(WorkspaceConfig).where(
                        WorkspaceConfig.workspace_id == lead_ws_id
                    )
                )
                config = cfg.scalars().first()
                api_key = config.openai_api_key if config else None
                label, score = await analyze_sentiment(
                    content, api_key or ""
                )
                lead.sentiment = (lead.sentiment or 0.0) * 0.7 + score * 0.3
                if lead.sentiment > 0.2:
                    lead.sentiment_label = "positive"
                elif lead.sentiment < -0.2:
                    lead.sentiment_label = "negative"
                else:
                    lead.sentiment_label = "neutral"
                await session.flush()
                await manager.broadcast(lead_ws_id, {
                    "type": "sentiment_update",
                    "lead_id": str(lead.id),
                    "sentiment": lead.sentiment,
                    "sentiment_label": lead.sentiment_label,
                })

            if lead and not lead.bot_active:
                await session.commit()
                return

            sub_result = await session.execute(
                select(Subscription.plan, Subscription.status).where(
                    Subscription.workspace_id == lead_ws_id
                )
            )
            sub_row = sub_result.first()
            is_free = (
                not sub_row
                or sub_row.plan == "free"
                or sub_row.status != "active"
            )

            if is_free:
                first_of_month = dt.utcnow().replace(
                    day=1, hour=0, minute=0, second=0, microsecond=0
                )
                msg_count = await session.scalar(
                    select(func.count(Message.id)).where(
                        Message.workspace_id == lead_ws_id,
                        Message.created_at >= first_of_month,
                    )
                )
                if msg_count >= 50:
                    await session.commit()
                    return

            ctx = await query_brain(
                content,
                str(instance.id),
                session,
                fallback_workspace_id=lead_ws_id,
            )
            enabled_tools = [t for t in instance.tools if t.is_enabled]
            response = await generate_response(
                content,
                "\n---\n".join(ctx) if ctx else None,
                session,
                instance=instance,
                template=instance.template,
                enabled_tools=enabled_tools,
            )
            msg_out = Message(
                workspace_id=lead_ws_id,
                channel=channel,
                from_user="eco_bot",
                content=response,
                direction="out",
                lead_id=lead_id,
                operator_instance_id=instance.id,
            )
            session.add(msg_out)
            await session.commit()

            await manager.broadcast(lead_ws_id, {
                "type": "new_message",
                "lead_id": lead_id,
                "message": {
                    "id": str(msg_out.id),
                    "channel": channel,
                    "from_user": "eco_bot",
                    "content": response,
                    "direction": "out",
                    "created_at": msg_out.created_at.isoformat(),
                },
            })

            sender = SENDERS.get(channel)
            if sender:
                await sender(
                    from_user,
                    response,
                    str(instance.id),
                    session,
                )

        finally:
            await engine.dispose()
