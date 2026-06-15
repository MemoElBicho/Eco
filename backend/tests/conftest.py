from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

import app.models  # noqa: F401 - register all models for metadata

from app.api.deps import get_db
from app.api.v1.auth import create_token, hash_password
from app.config import settings
from app.database import Base
from app.main import app
from app.models.lead import Lead
from app.models.user import User
from app.models.workspace import Workspace

TEST_DB_URL = settings.database_url.replace("/eco_db", "/eco_test")

_test_engine = create_async_engine(
    TEST_DB_URL, echo=False, poolclass=NullPool, pool_pre_ping=True,
)
_TestSession = async_sessionmaker(
    _test_engine, class_=AsyncSession, expire_on_commit=False,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _init_test_db():
    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _test_engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with _test_engine.connect() as conn:
        await conn.begin()
        async with _TestSession(
            bind=conn, join_transaction_mode="create_savepoint",
        ) as session:
            yield session
            await session.rollback()
        await conn.rollback()


@pytest_asyncio.fixture(autouse=True)
async def _override_get_db(db_session: AsyncSession):
    async def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    yield
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def test_workspace(db_session: AsyncSession) -> Workspace:
    ws = Workspace(name="Test Workspace")
    db_session.add(ws)
    await db_session.flush()
    return ws


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession, test_workspace: Workspace) -> User:
    user = User(
        email="test@eco.local",
        hashed_password=hash_password("test123"),
        name="Test User",
        workspace_id=test_workspace.id,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
def auth_headers(test_user: User) -> dict:
    token = create_token(str(test_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def seed_workspace(db_session: AsyncSession, test_workspace: Workspace) -> Workspace:
    leads = [
        Lead(
            workspace_id=test_workspace.id,
            name="Alice Eco", phone="+521111111111", email="alice@test.com",
            channel="whatsapp", channel_user_id="111111", status="new",
        ),
        Lead(
            workspace_id=test_workspace.id,
            name="Bob Test", phone="+522222222222", email="bob@test.com",
            channel="telegram", channel_user_id="222222", status="contacted",
        ),
    ]
    for lead in leads:
        db_session.add(lead)
    await db_session.flush()
    return test_workspace


@pytest.fixture(autouse=True)
def mock_process_message(mocker):
    return mocker.patch("app.tasks.ai_tasks.process_message.delay", return_value=None)


@pytest.fixture(autouse=True)
def mock_hubspot_sync(mocker):
    return mocker.patch("app.tasks.hubspot_tasks.sync_lead_to_hubspot_task.delay", return_value=None)
