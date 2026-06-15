import uuid
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import app.services.tools  # noqa: F401 - register tools in ToolRegistry

from app.models.brain_document import BrainDocument
from app.models.operator_channel import OperatorChannel
from app.models.operator_instance import OperatorInstance
from app.models.operator_template import OperatorTemplate
from app.models.operator_tool import OperatorTool
from app.models.workspace import Workspace
from app.services.agent import generate_response
from app.services.operator_engine import (
    get_instance,
    resolve_channel,
    resolve_instance_from_token,
)
from app.services.toolbox import ToolRegistry
from app.services.tools.brain_tool import BrainTool
from app.services.tools.crm_tool import CrmTool
from app.services.tools.escalate_tool import EscalateTool
from app.services.tools.webhook_out_tool import WebhookOutTool
from sqlalchemy.orm import joinedload, selectinload


# ────────────────── fixtures ──────────────────

@pytest_asyncio.fixture
async def op_template(db_session: AsyncSession) -> OperatorTemplate:
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
        system_prompt_template="Eres {bot_name} de {company_name}.",
        default_tools=["brain", "crm"],
        default_channels=["whatsapp", "telegram"],
    )
    db_session.add(t)
    await db_session.flush()
    return t


@pytest_asyncio.fixture
async def op_instance(
    db_session: AsyncSession,
    test_workspace: Workspace,
    op_template: OperatorTemplate,
) -> OperatorInstance:
    inst = OperatorInstance(
        id=uuid.uuid4(),
        organization_id=test_workspace.id,
        template_id=op_template.id,
        name="Test Op Instance",
        config={"bot_name": "TestBot", "company_name": "TestCo"},
        system_prompt="Eres TestBot de TestCo.",
        webhook_token=uuid.uuid4(),
        model="gemini-2.5-flash",
        status="active",
    )
    db_session.add(inst)
    await db_session.flush()

    ch_telegram = OperatorChannel(
        operator_instance_id=inst.id,
        channel="telegram",
        external_id="bot123",
        is_active=True,
    )
    db_session.add(ch_telegram)

    tool_brain = OperatorTool(
        operator_instance_id=inst.id,
        tool_type="brain",
        is_enabled=True,
    )
    db_session.add(tool_brain)

    tool_crm = OperatorTool(
        operator_instance_id=inst.id,
        tool_type="crm",
        is_enabled=True,
    )
    db_session.add(tool_crm)

    tool_esc = OperatorTool(
        operator_instance_id=inst.id,
        tool_type="escalate",
        is_enabled=True,
    )
    db_session.add(tool_esc)

    await db_session.flush()

    result = await db_session.execute(
        select(OperatorInstance)
        .options(
            joinedload(OperatorInstance.template),
            selectinload(OperatorInstance.tools),
            selectinload(OperatorInstance.channels),
        )
        .where(OperatorInstance.id == inst.id)
    )
    return result.scalars().first()


# ────────────────── toolbox tests ──────────────────

def test_brain_tool_function_definition():
    tool = BrainTool()
    fd = tool.get_function_definition()
    assert fd["name"] == "search_knowledge"
    assert fd["description"]
    assert fd["parameters"]["type"] == "object"
    assert "query" in fd["parameters"]["properties"]
    assert "query" in fd["parameters"]["required"]
    assert tool.tool_type == "brain"


def test_crm_tool_function_definition():
    tool = CrmTool()
    fd = tool.get_function_definition()
    assert fd["name"] == "update_lead_status"
    assert "status" in fd["parameters"]["properties"]
    assert "status" in fd["parameters"]["required"]
    valid_statuses = fd["parameters"]["properties"]["status"]["enum"]
    assert "new" in valid_statuses
    assert "closed_won" in valid_statuses
    assert tool.tool_type == "crm"


def test_escalate_tool_function_definition():
    tool = EscalateTool()
    fd = tool.get_function_definition()
    assert fd["name"] == "escalate_to_human"
    assert "reason" in fd["parameters"]["properties"]
    assert "reason" in fd["parameters"]["required"]
    assert tool.tool_type == "escalate"


def test_webhook_out_tool_function_definition():
    tool = WebhookOutTool()
    fd = tool.get_function_definition()
    assert fd["name"] == "call_external_api"
    assert "endpoint" in fd["parameters"]["properties"]
    assert "method" in fd["parameters"]["properties"]
    assert "endpoint" in fd["parameters"]["required"]
    assert tool.tool_type == "webhook_out"


def test_tool_registry_all_registered():
    tools = ToolRegistry.all()
    assert "brain" in tools
    assert "crm" in tools
    assert "escalate" in tools
    assert "webhook_out" in tools
    assert ToolRegistry.get("brain") is BrainTool
    assert ToolRegistry.get("crm") is CrmTool
    assert ToolRegistry.get("nonexistent") is None


async def test_brain_tool_execute_finds_results(
    db_session: AsyncSession,
    op_instance: OperatorInstance,
):
    doc = BrainDocument(
        workspace_id=op_instance.organization_id,
        operator_instance_id=op_instance.id,
        filename="test.txt",
        chunk_index=0,
        content="El producto cuesta $500 MXN con envío gratis.",
        embedding=[0.0] * 3072,
    )
    db_session.add(doc)
    await db_session.flush()

    tool = BrainTool()
    result = await tool.execute(
        {"query": "precio del producto"},
        op_instance,
        db_session,
    )
    assert isinstance(result, str)
    assert len(result) > 0


async def test_brain_tool_execute_no_results(
    db_session: AsyncSession,
    op_instance: OperatorInstance,
):
    tool = BrainTool()
    result = await tool.execute(
        {"query": "xyz_nonexistent_abc_123"},
        op_instance,
        db_session,
    )
    assert isinstance(result, str)
    assert "no se encontr" in result.lower()


# ────────────────── operator engine tests ──────────────────

async def test_resolve_channel_valid_token(
    db_session: AsyncSession,
    op_instance: OperatorInstance,
):
    ch = await resolve_channel(
        str(op_instance.webhook_token), "telegram", db_session
    )
    assert ch is not None
    assert ch.channel == "telegram"
    assert ch.operator_instance_id == op_instance.id


async def test_resolve_channel_invalid_token(db_session: AsyncSession):
    from fastapi import HTTPException

    fake_token = str(uuid.uuid4())
    with pytest.raises(HTTPException) as exc:
        await resolve_channel(fake_token, "telegram", db_session)
    assert exc.value.status_code == 404


async def test_resolve_channel_malformed_uuid(db_session: AsyncSession):
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        await resolve_channel("not-a-uuid", "telegram", db_session)
    assert exc.value.status_code == 404


async def test_get_instance_active(
    db_session: AsyncSession,
    op_instance: OperatorInstance,
):
    inst = await get_instance(op_instance.id, db_session)
    assert inst.id == op_instance.id
    assert inst.template is not None
    assert inst.tools is not None
    assert inst.channels is not None


async def test_get_instance_inactive_or_missing(db_session: AsyncSession):
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        await get_instance(uuid.uuid4(), db_session)
    assert exc.value.status_code == 404


async def test_resolve_instance_from_token(
    db_session: AsyncSession,
    op_instance: OperatorInstance,
):
    instance, channel = await resolve_instance_from_token(
        str(op_instance.webhook_token), "telegram", db_session
    )
    assert instance.id == op_instance.id
    assert channel.channel == "telegram"


# ────────────────── agent + LLM mock tests ──────────────────

def _make_mock_message(content: str, tool_calls=None):
    msg = MagicMock()
    msg.content = content
    msg.tool_calls = tool_calls
    return msg


def _make_mock_tool_call(idx: int, name: str, args: str):
    tc = MagicMock()
    tc.id = f"call_{idx}"
    tc.function = MagicMock()
    tc.function.name = name
    tc.function.arguments = args
    return tc


@patch("app.services.agent.OpenAI")
async def test_generate_response_with_tool_calls(
    mock_openai_cls,
    db_session: AsyncSession,
    op_instance: OperatorInstance,
):
    mock_client = MagicMock()
    mock_openai_cls.return_value = mock_client

    tool_call = _make_mock_tool_call(
        0, "escalate_to_human", '{"reason": "cliente insatisfecho"}'
    )
    msg_with_tool = _make_mock_message(
        None, tool_calls=[tool_call]
    )
    msg_final = _make_mock_message(
        "He escalado tu caso a un agente humano."
    )

    mock_client.chat.completions.create.side_effect = [
        MagicMock(choices=[MagicMock(message=msg_with_tool)]),
        MagicMock(choices=[MagicMock(message=msg_final)]),
    ]

    result = await generate_response(
        content="Quiero hablar con una persona",
        context=None,
        session=db_session,
        instance=op_instance,
        template=op_instance.template,
        enabled_tools=op_instance.tools,
    )
    assert "He escalado" in result
    assert mock_client.chat.completions.create.call_count == 2


@patch("app.services.agent.OpenAI")
async def test_generate_response_plain_text(
    mock_openai_cls,
    db_session: AsyncSession,
    op_instance: OperatorInstance,
):
    mock_client = MagicMock()
    mock_openai_cls.return_value = mock_client

    msg = _make_mock_message("Hola, ¿en qué puedo ayudarte?")
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=msg)]
    )

    result = await generate_response(
        content="Hola",
        context=None,
        session=db_session,
        instance=op_instance,
        template=op_instance.template,
        enabled_tools=None,
    )
    assert "Hola" in result
    mock_client.chat.completions.create.assert_called_once()


@patch("app.services.agent.OpenAI")
async def test_generate_response_legacy_fallback(
    mock_openai_cls,
    db_session: AsyncSession,
):
    mock_client = MagicMock()
    mock_openai_cls.return_value = mock_client
    msg = _make_mock_message("[MOCK] respuesta de prueba")
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=msg)]
    )

    result = await generate_response(
        content="Hola",
        context=None,
        session=db_session,
        instance=None,
        template=None,
        enabled_tools=None,
    )
    assert len(result) > 0
