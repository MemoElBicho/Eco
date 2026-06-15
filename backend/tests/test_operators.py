import uuid

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.operator_instance import OperatorInstance
from app.models.operator_template import OperatorTemplate
from app.models.operator_tool import OperatorTool


@pytest_asyncio.fixture
async def eco_ventas_template(db_session: AsyncSession) -> OperatorTemplate:
    result = await db_session.execute(
        select(OperatorTemplate).where(OperatorTemplate.slug == "eco-ventas")
    )
    t = result.scalars().first()
    if t:
        return t
    t = OperatorTemplate(
        slug="eco-ventas",
        name="Eco Ventas",
        category="ventas",
        system_prompt_template=(
            "Eres {bot_name} de {company_name}. "
            "Industria: {industry}. Idioma: {language}."
        ),
        default_tools=["brain", "crm", "webhook_out"],
        default_channels=["whatsapp", "telegram"],
    )
    db_session.add(t)
    await db_session.flush()
    return t


async def test_create_operator_instance(
    async_client: AsyncClient,
    auth_headers: dict,
    eco_ventas_template: OperatorTemplate,
    db_session: AsyncSession,
):
    payload = {
        "template_slug": "eco-ventas",
        "name": "Ventas Demo",
        "config": {
            "bot_name": "Eco",
            "company_name": "Demo SA",
            "industry": "ecommerce",
            "language": "es",
        },
        "channels": [
            {
                "channel": "whatsapp",
                "external_id": '{"access_token":"tok","phone_number_id":"123"}',
            },
            {"channel": "telegram", "external_id": "test_bot_token"},
        ],
    }
    resp = await async_client.post(
        "/api/v1/operators/", json=payload, headers=auth_headers
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Ventas Demo"
    assert data["webhook_token"] is not None
    uuid.UUID(data["webhook_token"])
    assert len(data["tools"]) == 3
    assert len(data["channels"]) == 2

    result = await db_session.execute(
        select(OperatorInstance).where(OperatorInstance.id == data["id"])
    )
    instance = result.scalars().first()
    assert instance is not None
    assert instance.status == "active"
    assert instance.system_prompt is not None

    tools_result = await db_session.execute(
        select(OperatorTool).where(
            OperatorTool.operator_instance_id == instance.id
        )
    )
    tool_types = {row.tool_type for row in tools_result.scalars().all()}
    assert tool_types == {"brain", "crm", "webhook_out"}


async def test_get_operators_list(
    async_client: AsyncClient,
    auth_headers: dict,
    eco_ventas_template: OperatorTemplate,
):
    payload = {
        "template_slug": "eco-ventas",
        "name": "Ventas Listing",
        "config": {
            "bot_name": "Eco",
            "company_name": "Co",
            "industry": "salud",
            "language": "es",
        },
        "channels": [],
    }
    resp = await async_client.post(
        "/api/v1/operators/", json=payload, headers=auth_headers
    )
    assert resp.status_code == 201

    resp = await async_client.get(
        "/api/v1/operators/", headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert any(o["name"] == "Ventas Listing" for o in data)


async def test_soft_delete_operator(
    async_client: AsyncClient,
    auth_headers: dict,
    eco_ventas_template: OperatorTemplate,
    db_session: AsyncSession,
):
    payload = {
        "template_slug": "eco-ventas",
        "name": "To Delete",
        "config": {
            "bot_name": "Eco",
            "company_name": "X",
            "industry": "otro",
            "language": "es",
        },
        "channels": [],
    }
    resp = await async_client.post(
        "/api/v1/operators/", json=payload, headers=auth_headers
    )
    assert resp.status_code == 201
    instance_id = resp.json()["id"]

    resp = await async_client.delete(
        f"/api/v1/operators/{instance_id}", headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json() == {"status": "deleted"}

    result = await db_session.execute(
        select(OperatorInstance).where(OperatorInstance.id == instance_id)
    )
    instance = result.scalars().first()
    assert instance is not None
    assert instance.status == "deleted"
