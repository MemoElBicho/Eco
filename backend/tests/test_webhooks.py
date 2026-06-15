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
async def seed_operator_for_webhooks(
    db_session: AsyncSession,
    test_workspace: Workspace,
) -> OperatorInstance:
    result = await db_session.execute(
        select(OperatorTemplate).where(
            OperatorTemplate.slug == "eco-ventas"
        )
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
        name="Webhook Test Instance",
        webhook_token=token,
        model="gemini-2.5-flash",
        status="active",
    )
    db_session.add(inst)
    await db_session.flush()

    for ch_name in ("telegram", "whatsapp"):
        ch = OperatorChannel(
            operator_instance_id=inst.id,
            channel=ch_name,
            external_id="test_token",
            is_active=True,
        )
        db_session.add(ch)
    await db_session.flush()
    return inst


async def test_whatsapp_webhook_flow(
    async_client: AsyncClient,
    seed_operator_for_webhooks: OperatorInstance,
):
    instance_id = str(seed_operator_for_webhooks.id)
    payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "messages": [{
                        "from": "521234567890",
                        "id": "wamid.abc123",
                        "text": {"body": "Hola desde WhatsApp"},
                    }]
                }
            }]
        }]
    }
    with patch("app.tasks.ai_tasks.process_message.delay") as mock_delay:
        resp = await async_client.post(
            "/api/v1/webhooks/whatsapp", json=payload
        )
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
    mock_delay.assert_called_once_with(
        instance_id, "whatsapp", "521234567890",
        "Hola desde WhatsApp", "wamid.abc123",
    )


async def test_telegram_webhook_flow(
    async_client: AsyncClient,
    seed_operator_for_webhooks: OperatorInstance,
):
    instance_id = str(seed_operator_for_webhooks.id)
    payload = {
        "message": {
            "chat": {"id": 123456789},
            "text": "Hola desde Telegram",
            "message_id": 999,
        }
    }
    with patch("app.tasks.ai_tasks.process_message.delay") as mock_delay:
        resp = await async_client.post(
            "/api/v1/webhooks/telegram", json=payload
        )
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
    mock_delay.assert_called_once_with(
        instance_id, "telegram", "123456789",
        "Hola desde Telegram", "999",
    )
