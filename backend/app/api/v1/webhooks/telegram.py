import json

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.operator_instance import OperatorInstance
from app.services.operator_engine import resolve_instance_from_token
from app.tasks.ai_tasks import process_message

router = APIRouter(prefix="/webhooks/telegram")


@router.post("/{webhook_token}")
async def telegram_webhook_dynamic(
    webhook_token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    instance, channel = await resolve_instance_from_token(
        webhook_token, "telegram", db
    )
    body = await request.json()
    message = body.get("message", {})
    chat = message.get("chat", {})
    text = message.get("text", "")
    chat_id = chat.get("id")
    message_id = message.get("message_id")
    if chat_id and text:
        process_message.delay(
            str(instance.id),
            "telegram",
            str(chat_id),
            text,
            str(message_id),
        )
    return {"ok": True}


@router.post("")
async def telegram_webhook_legacy(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    body = await request.json()
    message = body.get("message", {})
    chat = message.get("chat", {})
    text = message.get("text", "")
    chat_id = chat.get("id")
    message_id = message.get("message_id")
    if chat_id and text:
        result = await db.execute(
            select(OperatorInstance.id)
            .where(OperatorInstance.status == "active")
            .limit(1)
        )
        row = result.first()
        if row:
            process_message.delay(
                str(row[0]),
                "telegram",
                str(chat_id),
                text,
                str(message_id),
            )
    return {"ok": True}
