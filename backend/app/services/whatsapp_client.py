import httpx
from sqlalchemy import select

from app.config import settings
from app.models.workspace_config import WorkspaceConfig


async def send_message(session, workspace_id: str, to: str, text: str):
    result = await session.execute(
        select(WorkspaceConfig).where(WorkspaceConfig.workspace_id == workspace_id)
    )
    cfg = result.scalars().first()

    token = cfg.whatsapp_access_token if cfg and cfg.whatsapp_access_token else settings.whatsapp_access_token
    phone_id = cfg.whatsapp_phone_number_id if cfg and cfg.whatsapp_phone_number_id else settings.whatsapp_phone_number_id

    if not token or token.startswith("your_"):
        base = settings.mock_whatsapp_url
        headers = {}
    else:
        base = f"{settings.whatsapp_base_url}/{settings.whatsapp_api_version}/{phone_id}"
        headers = {"Authorization": f"Bearer {token}"}

    payload = {"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"body": text}}

    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{base}/messages", json=payload, headers=headers)
        data = resp.json() if resp.status_code < 300 else resp.text
        print(f"[WhatsApp] sent to {to}: {resp.status_code}")
        return data
