from unittest.mock import AsyncMock, patch
from httpx import AsyncClient
from app.models.workspace import Workspace


async def test_toggle_bot_status(async_client: AsyncClient, auth_headers: dict, seed_workspace):
    resp = await async_client.get("/api/v1/leads/", headers=auth_headers)
    lead_id = resp.json()[0]["id"]

    resp = await async_client.patch(f"/api/v1/conversations/{lead_id}/toggle-bot", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "bot_active" in data


async def test_send_manual_message(async_client: AsyncClient, auth_headers: dict, seed_workspace: Workspace):
    resp = await async_client.get("/api/v1/leads/", headers=auth_headers)
    leads = resp.json()
    lead_id = next(l["id"] for l in leads if l["channel"] == "whatsapp")

    with patch(
        "app.services.whatsapp_client.send_whatsapp_message",
        new=AsyncMock(return_value=None),
    ):
        with patch("app.core.websocket.manager.broadcast", new=AsyncMock(return_value=None)):
            resp = await async_client.post(
                f"/api/v1/conversations/{lead_id}/send-manual",
                json={"content": "Hello from test"},
                headers=auth_headers,
            )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "sent"
    assert data["bot_active"] is False
