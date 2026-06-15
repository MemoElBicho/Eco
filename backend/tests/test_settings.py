from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.workspace_config import WorkspaceConfig


async def test_get_or_create_empty_config(async_client: AsyncClient, auth_headers: dict):
    resp = await async_client.get("/api/v1/settings/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] is not None
    assert data["workspace_id"] is not None


async def test_update_config_partial(async_client: AsyncClient, auth_headers: dict, db_session: AsyncSession):
    resp = await async_client.put(
        "/api/v1/settings/",
        json={"hubspot_access_token": "hs_test_token", "hubspot_portal_id": "12345"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["hubspot_access_token"] == "hs_test_token"
    assert data["hubspot_portal_id"] == "12345"

    result = await db_session.execute(
        select(WorkspaceConfig).where(WorkspaceConfig.workspace_id == data["workspace_id"])
    )
    cfg = result.scalar_one_or_none()
    assert cfg is not None
    assert cfg.hubspot_access_token == "hs_test_token"
