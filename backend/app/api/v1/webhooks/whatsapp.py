import json

from fastapi import APIRouter, Request
from app.config import settings
from app.tasks.ai_tasks import process_message

router = APIRouter(prefix="/webhooks/whatsapp")


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
async def whatsapp_webhook(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
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
                    process_message.delay("workspace_id_placeholder", "whatsapp", from_number, text, msg_id)
    return {"status": "ok"}
