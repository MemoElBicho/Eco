import uuid
from unittest.mock import patch

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.operator_channel import OperatorChannel
from app.models.operator_instance import OperatorInstance
from app.models.operator_template import OperatorTemplate
from app.models.workspace import Workspace


@pytest_asyncio.fixture
async def telegram_instance(
    db_session: AsyncSession,
    test_workspace: Workspace,
) -> OperatorInstance:
    result = await db_session.execute(
        select(OperatorTemplate).where(OperatorTemplate.slug == "eco-ventas")
    )
    template = result.scalars().first()
    if not template:
        template = OperatorTemplate(
            slug="eco-ventas",
            name="Eco Ventas",
            category="ventas",
            system_prompt_template="Eres {bot_name} de {company_name}.",
            default_tools=["brain", "crm"],
            default_channels=["whatsapp", "telegram"],
        )
        db_session.add(template)
        await db_session.flush()

    token = uuid.uuid4()
    inst = OperatorInstance(
        id=uuid.uuid4(),
        organization_id=test_workspace.id,
        template_id=template.id,
        name="Test Telegram Instance",
        webhook_token=token,
        model="gemini-2.5-flash",
        status="active",
    )
    db_session.add(inst)
    await db_session.flush()

    ch = OperatorChannel(
        operator_instance_id=inst.id,
        channel="telegram",
        external_id="test_bot_token",
        is_active=True,
    )
    db_session.add(ch)
    await db_session.flush()

    return inst


async def test_webhook_routing_success(
    async_client: AsyncClient,
    telegram_instance: OperatorInstance,
):
    token = str(telegram_instance.webhook_token)
    payload = {
        "message": {
            "chat": {"id": 123456789},
            "text": "Hola desde Telegram",
            "message_id": 999,
        }
    }
    with patch(
        "app.tasks.ai_tasks.process_message.delay"
    ) as mock_delay:
        resp = await async_client.post(
            f"/api/v1/webhooks/telegram/{token}", json=payload
        )
    assert resp.status_code == 200
    mock_delay.assert_called_once_with(
        str(telegram_instance.id),
        "telegram",
        "123456789",
        "Hola desde Telegram",
        "999",
    )


async def test_webhook_routing_invalid_token(async_client: AsyncClient):
    fake_token = "550e8400-e29b-41d4-a716-446655440000"
    payload = {"message": {"chat": {"id": 1}, "text": "x", "message_id": 1}}
    resp = await async_client.post(
        f"/api/v1/webhooks/telegram/{fake_token}", json=payload
    )
    assert resp.status_code == 404


async def test_webhook_routing_malformed_uuid(async_client: AsyncClient):
    payload = {"message": {"chat": {"id": 1}, "text": "x", "message_id": 1}}
    resp = await async_client.post(
        "/api/v1/webhooks/telegram/not-a-valid-uuid", json=payload
    )
    assert resp.status_code == 404
