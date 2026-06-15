from typing import Optional

import httpx

HUBSPOT_BASE = "https://api.hubapi.com"
SEARCH_URL = f"{HUBSPOT_BASE}/crm/v3/objects/contacts/search"
CONTACTS_URL = f"{HUBSPOT_BASE}/crm/v3/objects/contacts"


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


async def search_by_email(email: str, access_token: str) -> Optional[str]:
    payload = {
        "filterGroups": [{
            "filters": [{"propertyName": "email", "operator": "EQ", "value": email}]
        }],
        "properties": ["email"],
        "limit": 1,
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(SEARCH_URL, headers=_headers(access_token), json=payload, timeout=15)
            resp.raise_for_status()
            results = resp.json().get("results", [])
            return results[0]["id"] if results else None
    except Exception:
        return None


async def create_or_update_contact(
    lead_data: dict, access_token: str, hs_contact_id: Optional[str] = None
) -> Optional[str]:
    properties = {
        "firstname": lead_data.get("name", "").split(" ")[0] if lead_data.get("name") else "",
        "lastname": " ".join(lead_data.get("name", "").split(" ")[1:]) if lead_data.get("name") else "",
        "phone": lead_data.get("phone", ""),
        "email": lead_data.get("email", ""),
    }
    body = {"properties": properties}

    try:
        async with httpx.AsyncClient() as client:
            if hs_contact_id:
                resp = await client.patch(
                    f"{CONTACTS_URL}/{hs_contact_id}", headers=_headers(access_token), json=body, timeout=15
                )
                resp.raise_for_status()
                return resp.json()["id"]

            existing_id = await search_by_email(lead_data.get("email", ""), access_token)
            if existing_id:
                resp = await client.patch(
                    f"{CONTACTS_URL}/{existing_id}", headers=_headers(access_token), json=body, timeout=15
                )
                resp.raise_for_status()
                return resp.json()["id"]

            resp = await client.post(CONTACTS_URL, headers=_headers(access_token), json=body, timeout=15)
            resp.raise_for_status()
            return resp.json()["id"]
    except Exception:
        return None
