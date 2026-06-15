import uuid

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.operator_channel import OperatorChannel

BASE = "https://api.telegram.org"


async def send_telegram_message(
    chat_id: str,
    text: str,
    operator_instance_id: str,
    db: AsyncSession,
) -> bool:
    iid = uuid.UUID(operator_instance_id)
    result = await db.execute(
        select(OperatorChannel).where(
            OperatorChannel.operator_instance_id == iid,
            OperatorChannel.channel == "telegram",
            OperatorChannel.is_active == True,
        )
    )
    channel = result.scalars().first()
    if not channel or not channel.external_id:
        return False

    token = channel.external_id
    if token.startswith("your_"):
        print(f"[MOCK Telegram] → {chat_id}: {text[:80]}...")
        return True

    url = f"{BASE}/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload)
        return resp.status_code < 300
