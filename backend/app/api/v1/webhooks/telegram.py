from fastapi import APIRouter, Request
from app.config import settings
from app.tasks.ai_tasks import process_message

router = APIRouter(prefix="/webhooks/telegram")


@router.post("")
async def telegram_webhook(request: Request):
    body = await request.json()
    message = body.get("message", {})
    chat = message.get("chat", {})
    text = message.get("text", "")
    chat_id = chat.get("id")
    message_id = message.get("message_id")
    if chat_id and text:
        process_message.delay("workspace_id_placeholder", "telegram", str(chat_id), text, str(message_id))
    return {"ok": True}
