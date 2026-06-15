import uuid

from fastapi import APIRouter, Depends, WebSocket
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.v1.auth import get_current_user
from app.models.message import Message
from app.models.lead import Lead
from app.models.user import User
from app.schemas.conversation import ConversationOut, MessageOut
from app.schemas.lead import ManualSendIn
from app.core.websocket import manager
from app.services.limits import check_free_plan_limits

router = APIRouter(prefix="/conversations")


@router.get("/", response_model=list[ConversationOut])
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub = (
        select(
            Message.lead_id,
            func.max(Message.created_at).label("last_ts"),
            func.count(Message.id).label("cnt"),
        )
        .where(Message.workspace_id == user.workspace_id, Message.lead_id.isnot(None))
        .group_by(Message.lead_id)
        .subquery()
    )
    result = await db.execute(
        select(Lead, sub.c.last_ts, sub.c.cnt)
        .outerjoin(sub, Lead.id == sub.c.lead_id)
        .where(Lead.workspace_id == user.workspace_id)
        .order_by(sub.c.last_ts.desc().nulls_last())
    )
    return [
        ConversationOut(
            lead_id=str(row.Lead.id),
            lead_name=row.Lead.name,
            channel=row.Lead.channel,
            bot_active=row.Lead.bot_active,
            sentiment=row.Lead.sentiment or 0.0,
            sentiment_label=row.Lead.sentiment_label or "neutral",
            last_message_at=row.last_ts,
            message_count=row.cnt or 0,
            last_message=None,
        )
        for row in result.all()
    ]


@router.get("/{lead_id}/messages", response_model=list[MessageOut])
async def get_messages(
    lead_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Message)
        .where(Message.lead_id == lead_id, Message.workspace_id == user.workspace_id)
        .order_by(Message.created_at.asc())
    )
    msgs = result.scalars().all()
    return [
        MessageOut(
            id=str(m.id), channel=m.channel, from_user=m.from_user,
            content=m.content, direction=m.direction, created_at=m.created_at,
        )
        for m in msgs
    ]


@router.patch("/{lead_id}/toggle-bot")
async def toggle_bot(
    lead_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Lead).where(Lead.id == lead_id, Lead.workspace_id == user.workspace_id)
    )
    lead = result.scalars().first()
    lead.bot_active = not lead.bot_active
    await db.commit()
    return {"bot_active": lead.bot_active}


@router.post("/{lead_id}/send-manual")
async def send_manual(
    lead_id: uuid.UUID,
    body: ManualSendIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Lead).where(Lead.id == lead_id, Lead.workspace_id == user.workspace_id)
    )
    lead = result.scalars().first()

    await check_free_plan_limits(db, user.workspace_id, "messages")

    msg = Message(
        workspace_id=user.workspace_id,
        channel=lead.channel,
        from_user="agent",
        content=body.content,
        direction="out",
        lead_id=lead.id,
    )
    db.add(msg)

    lead.bot_active = False
    await db.commit()

    if lead.channel == "whatsapp":
        from app.services.whatsapp_client import send_whatsapp_message as wa_send
        await wa_send(
            lead.channel_user_id,
            body.content,
            str(lead.operator_instance_id or user.workspace_id),
            db,
        )
    elif lead.channel == "telegram":
        from app.services.telegram_client import send_telegram_message as tg_send
        await tg_send(
            lead.channel_user_id,
            body.content,
            str(lead.operator_instance_id or user.workspace_id),
            db,
        )

    await manager.broadcast(str(user.workspace_id), {
        "type": "new_message",
        "lead_id": str(lead_id),
        "message": {
            "id": str(msg.id), "channel": lead.channel, "from_user": "agent",
            "content": body.content, "direction": "out", "created_at": msg.created_at.isoformat(),
        },
    })

    return {"status": "sent", "bot_active": False}


@router.websocket("/ws/{workspace_id}")
async def websocket_endpoint(ws: WebSocket, workspace_id: str):
    await manager.connect(workspace_id, ws)
    try:
        while True:
            await ws.receive_text()
    except Exception:
        pass
    finally:
        manager.disconnect(workspace_id, ws)
