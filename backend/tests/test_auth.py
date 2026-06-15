from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User


async def test_register(async_client: AsyncClient, db_session: AsyncSession):
    payload = {"email": "newuser@test.com", "password": "securepwd1", "name": "New User"}
    resp = await async_client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data.get("token_type") == "bearer"

    result = await db_session.execute(select(User).where(User.email == "newuser@test.com"))
    user = result.scalar_one_or_none()
    assert user is not None
    assert user.name == "New User"
    assert user.email == "newuser@test.com"


async def test_login(async_client: AsyncClient, test_user: User):
    resp = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "test@eco.local", "password": "test123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data.get("token_type") == "bearer"


async def test_me(async_client: AsyncClient, auth_headers: dict):
    resp = await async_client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "test@eco.local"
    assert data["name"] == "Test User"


async def test_invalid_token(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/auth/me", headers={"Authorization": "Bearer badtoken"})
    assert resp.status_code == 401
