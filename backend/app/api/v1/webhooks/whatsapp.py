import json as _json

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.config import settings
from app.models.operator_instance import OperatorInstance
from app.services.operator_engine import resolve_instance_from_token
from app.tasks.ai_tasks import process_message

router = APIRouter(prefix="/webhooks/whatsapp")


def _resolve_verify_token(channel) -> str:
    if not channel or not channel.external_id:
        return ""
    try:
        cfg = _json.loads(channel.external_id)
        return cfg.get("verify_token", "")
    except (_json.JSONDecodeError, TypeError):
        return ""


@router.get("/{webhook_token}")
async def whatsapp_verify_dynamic(
    webhook_token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    query = request.query_params
    mode = query.get("hub.mode")
    verify_token = query.get("hub.verify_token")
    challenge = query.get("hub.challenge")
    try:
        instance, channel = await resolve_instance_from_token(
            webhook_token, "whatsapp", db
        )
    except Exception:
        channel = None
    expected = (
        _resolve_verify_token(channel)
        or settings.whatsapp_verify_token
    )
    if mode == "subscribe" and verify_token == expected:
        return int(challenge)
    return {"error": "Verification failed"}


@router.post("/{webhook_token}")
async def whatsapp_webhook_dynamic(
    webhook_token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    instance, channel = await resolve_instance_from_token(
        webhook_token, "whatsapp", db
    )
    try:
        body = await request.json()
    except _json.JSONDecodeError:
        return {"status": "error", "message": "Invalid JSON"}
    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for msg in value.get("messages", []):
                from_number = msg.get("from")
                text = ""
                if "text" in msg:
                    text = msg["text"].get("body", "")
                msg_id = msg.get("id")
                if from_number and text:
                    try:
                        process_message.delay(
                            str(instance.id),
                            "whatsapp",
                            from_number,
                            text,
                            msg_id,
                        )
                    except Exception:
                        pass
    return {"status": "success"}


@router.get("")
async def verify_webhook(request: Request):
    query = request.query_params
    mode = query.get("hub.mode")
    token = query.get("hub.verify_token")
    challenge = query.get("hub.challenge")
    if mode == "subscribe" and token == settings.whatsapp_verify_token:
        return int(challenge)
    return {"error": "Verification failed"}


@router.post("")
async def whatsapp_webhook_legacy(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        body = await request.json()
    except _json.JSONDecodeError:
        return {"status": "error", "message": "Invalid JSON"}
    result = await db.execute(
        select(OperatorInstance.id)
        .where(OperatorInstance.status == "active")
        .limit(1)
    )
    row = result.first()
    instance_id = str(row[0]) if row else None
    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for msg in value.get("messages", []):
                from_number = msg.get("from")
                text = ""
                if "text" in msg:
                    text = msg["text"].get("body", "")
                msg_id = msg.get("id")
                if from_number and text and instance_id:
                    try:
                        process_message.delay(
                            instance_id,
                            "whatsapp",
                            from_number,
                            text,
                            msg_id,
                        )
                    except Exception:
                        pass
    return {"status": "ok"}
