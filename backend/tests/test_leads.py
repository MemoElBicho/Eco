from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.workspace import Workspace
from app.api.v1.auth import create_token, hash_password


async def test_get_leads(async_client: AsyncClient, auth_headers: dict, seed_workspace):
    resp = await async_client.get("/api/v1/leads/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["workspace_id"] == str(seed_workspace.id)


async def test_create_lead(async_client: AsyncClient, auth_headers: dict):
    payload = {"name": "Test Lead", "phone": "+525555555555", "email": "lead@test.com", "channel": "whatsapp", "channel_user_id": "99999"}
    resp = await async_client.post("/api/v1/leads/", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Lead"
    assert data["channel"] == "whatsapp"


async def test_workspace_isolation(async_client: AsyncClient, auth_headers: dict, seed_workspace, db_session: AsyncSession):
    resp = await async_client.get("/api/v1/leads/", headers=auth_headers)
    lead_id = resp.json()[0]["id"]

    ws2 = Workspace(name="Other Workspace")
    db_session.add(ws2)
    await db_session.flush()
    user2 = User(email="other@eco.local", hashed_password=hash_password("pwd"), name="Other", workspace_id=ws2.id)
    db_session.add(user2)
    await db_session.flush()
    token2 = create_token(str(user2.id))
    headers2 = {"Authorization": f"Bearer {token2}"}

    resp = await async_client.get(f"/api/v1/leads/{lead_id}", headers=headers2)
    assert resp.status_code == 404
