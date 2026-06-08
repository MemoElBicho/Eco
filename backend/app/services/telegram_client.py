import httpx
from sqlalchemy import select

from app.config import settings
from app.models.workspace_config import WorkspaceConfig

BASE = "https://api.telegram.org"


async def send_message(session, workspace_id: str, chat_id: str, text: str):
    result = await session.execute(
        select(WorkspaceConfig).where(WorkspaceConfig.workspace_id == workspace_id)
    )
    cfg = result.scalars().first()
    token = cfg.telegram_bot_token if cfg and cfg.telegram_bot_token else settings.telegram_bot_token

    if not token or token.startswith("your_"):
        print(f"[MOCK Telegram] → {chat_id}: {text[:80]}...")
        return {"ok": True, "result": {"message_id": "mock_tg_1"}}

    url = f"{BASE}/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload)
        return resp.json()
