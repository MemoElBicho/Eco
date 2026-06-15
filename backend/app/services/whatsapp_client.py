import json
import uuid

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.operator_channel import OperatorChannel


async def send_whatsapp_message(
    to_phone: str,
    text: str,
    operator_instance_id: str,
    db: AsyncSession,
) -> bool:
    iid = uuid.UUID(operator_instance_id)
    result = await db.execute(
        select(OperatorChannel).where(
            OperatorChannel.operator_instance_id == iid,
            OperatorChannel.channel == "whatsapp",
            OperatorChannel.is_active == True,
        )
    )
    channel = result.scalars().first()
    if not channel or not channel.external_id:
        return False

    try:
        creds = json.loads(channel.external_id)
        access_token = creds.get("access_token", "")
        phone_number_id = creds.get("phone_number_id", "")
    except (json.JSONDecodeError, TypeError):
        return False

    if not access_token or access_token.startswith("your_"):
        print(f"[MOCK WhatsApp] → {to_phone}: {text[:80]}...")
        return True

    headers = {"Authorization": f"Bearer {access_token}"}
    base_url = f"https://graph.facebook.com/v17.0/{phone_number_id}"
    payload = {
        "messaging_product": "whatsapp",
        "to": to_phone,
        "type": "text",
        "text": {"body": text},
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base_url}/messages", json=payload, headers=headers
        )
        return resp.status_code < 300
