from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.lead import Lead
from app.models.workspace_config import WorkspaceConfig

router = APIRouter(prefix="/webhooks/hubspot")
HUBSPOT_BASE = "https://api.hubapi.com"
TRACKED_TYPES = {"contact.creation", "contact.propertyChange"}
FIELD_MAP = {"firstname": "firstname", "lastname": "lastname", "email": "email", "phone": "phone"}


@router.post("")
async def hubspot_webhook(request: Request):
    db: AsyncSession = await anext(get_db())
    try:
        events: list[dict] = await request.json()
        for event in events:
            sub_type = event.get("subscriptionType", "")
            if sub_type not in TRACKED_TYPES:
                continue

            hs_contact_id = str(event.get("objectId", ""))
            occurred_at_ms = event.get("occurredAt", 0)
            if not hs_contact_id or not occurred_at_ms:
                continue

            result = await db.execute(
                select(Lead).where(Lead.hs_contact_id == hs_contact_id)
            )
            lead: Lead | None = result.scalars().first()
            if not lead:
                continue

            cfg_result = await db.execute(
                select(WorkspaceConfig).where(WorkspaceConfig.workspace_id == lead.workspace_id)
            )
            config = cfg_result.scalars().first()
            if not config or not config.hubspot_access_token:
                continue

            ts = datetime.fromtimestamp(occurred_at_ms / 1000.0, tz=timezone.utc)
            if lead.hs_last_sync and ts <= lead.hs_last_sync:
                continue

            contact = await _fetch_hubspot_contact(hs_contact_id, config.hubspot_access_token)
            if not contact:
                continue

            props = contact.get("properties", {})
            first = props.get("firstname", "")
            last = props.get("lastname", "")
            lead.name = f"{first} {last}".strip() or lead.name
            lead.phone = props.get("phone") or lead.phone
            lead.email = props.get("email") or lead.email
            lead.hs_last_sync = ts
            await db.commit()
    finally:
        await db.close()
    return {"status": "success"}


async def _fetch_hubspot_contact(contact_id: str, token: str) -> dict | None:
    url = f"{HUBSPOT_BASE}/crm/v3/objects/contacts/{contact_id}?properties=firstname,lastname,email,phone"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=15)
            resp.raise_for_status()
            return resp.json()
    except Exception:
        return None
