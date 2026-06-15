import json

from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.operator_instance import OperatorInstance
from app.models.operator_template import OperatorTemplate
from app.models.operator_tool import OperatorTool
from app.models.workspace_config import WorkspaceConfig
from app.services.toolbox import BaseTool, ToolRegistry

SYSTEM_PROMPT = """Eres Eco, un asistente de ventas omnicanal de ECOPARTS S.A.
Usa ÚNICAMENTE el contexto del catálogo proporcionado para responder al cliente.
Si la información no está en el catálogo, indica amablemente que consultarás con un asesor humano.
Responde en español, de forma profesional, concisa y cálida."""


def _should_mock(api_key: str | None):
    return (
        not api_key
        or api_key.startswith("your_")
        or api_key.startswith("sk-your_")
    )


def _build_client(api_key: str | None):
    kwargs: dict = {}
    if api_key and not _should_mock(api_key):
        kwargs["api_key"] = api_key
    else:
        kwargs["api_key"] = settings.openai_api_key or "mock"
    if settings.openai_base_url:
        kwargs["base_url"] = settings.openai_base_url
    client = OpenAI(**kwargs)
    if _should_mock(api_key) and _should_mock(settings.openai_api_key):
        class _Completions:
            @staticmethod
            def create(*a, **kw):
                user_msg = (
                    kw.get("messages", [{}])[-1].get("content", "")
                )
                ctx = kw.get("messages", [{}])[0].get("content", "")
                return type("R", (), {
                    "choices": [type("C", (), {
                        "message": type("M", (), {
                            "content": (
                                f"[MOCK] Eco responde: '{user_msg}' "
                                f"— contexto encontrado: {ctx[:80]}..."
                            ),
                            "tool_calls": None,
                        })()
                    })()]
                })()
        class _Chat:
            completions = _Completions
        client.chat = _Chat()
    return client


async def generate_response(
    content: str,
    context: str | None,
    session: AsyncSession,
    instance: OperatorInstance = None,
    template: OperatorTemplate = None,
    enabled_tools: list[OperatorTool] = None,
) -> str:
    if instance and template:
        config = instance.config or {}
        try:
            system_prompt = template.system_prompt_template.format(**config)
        except KeyError:
            system_prompt = template.system_prompt_template
    else:
        system_prompt = SYSTEM_PROMPT

    if context:
        system_prompt = f"{system_prompt}\n\nCATÁLOGO:\n{context}"

    if instance:
        cfg_result = await session.execute(
            select(WorkspaceConfig).where(
                WorkspaceConfig.workspace_id == instance.organization_id
            )
        )
        cfg = cfg_result.scalars().first()
        api_key = cfg.openai_api_key if cfg and cfg.openai_api_key else None
    else:
        api_key = settings.openai_api_key

    client = _build_client(api_key)
    model = (instance.model if instance else None) or settings.openai_model

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": content},
    ]

    tools_payload: list[dict] = []
    tool_map: dict[str, BaseTool] = {}
    if enabled_tools:
        for t in enabled_tools:
            cls = ToolRegistry.get(t.tool_type)
            if not cls:
                continue
            obj = cls()
            fd = obj.get_function_definition()
            tools_payload.append({"type": "function", "function": fd})
            tool_map[fd["name"]] = obj

    kwargs: dict = {"model": model, "messages": messages, "temperature": 0.3}
    if tools_payload:
        kwargs["tools"] = tools_payload
    resp = client.chat.completions.create(**kwargs)
    msg = resp.choices[0].message

    while tool_calls := getattr(msg, "tool_calls", None):
        messages.append({
            "role": "assistant",
            "content": msg.content or "",
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in tool_calls
            ],
        })

        for tc in tool_calls:
            tool = tool_map.get(tc.function.name)
            if tool:
                try:
                    args = json.loads(tc.function.arguments)
                except (json.JSONDecodeError, TypeError):
                    args = {}
                result_text = await tool.execute(args, instance, session)
            else:
                result_text = (
                    f"Herramienta '{tc.function.name}' no encontrada."
                )
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result_text,
            })

        resp = client.chat.completions.create(
            model=model, messages=messages, temperature=0.3
        )
        msg = resp.choices[0].message

    return msg.content
