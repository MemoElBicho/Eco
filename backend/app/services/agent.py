from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.workspace_config import WorkspaceConfig

SYSTEM_PROMPT = """Eres Eco, un asistente de ventas omnicanal de ECOPARTS S.A.
Usa ÚNICAMENTE el contexto del catálogo proporcionado para responder al cliente.
Si la información no está en el catálogo, indica amablemente que consultarás con un asesor humano.
Responde en español, de forma profesional, concisa y cálida."""


def _should_mock(api_key: str | None):
    return not api_key or api_key.startswith("your_") or api_key.startswith("sk-your_")


def _build_client(api_key: str | None):
    kwargs = {}
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
                user_msg = kw.get("messages", [{}])[-1].get("content", "")
                ctx = kw.get("messages", [{}])[0].get("content", "")
                return type("R", (), {
                    "choices": [type("C", (), {
                        "message": type("M", (), {
                            "content": f"[MOCK] Eco responde: '{user_msg}' — contexto encontrado: {ctx[:80]}..."
                        })()
                    })()]
                })()
        class _Chat:
            completions = _Completions
        client.chat = _Chat()
    return client


async def generate_response(
    user_query: str,
    context_chunks: list[str],
    db: AsyncSession,
    workspace_id: str,
) -> str:
    result = await db.execute(
        select(WorkspaceConfig).where(WorkspaceConfig.workspace_id == workspace_id)
    )
    cfg = result.scalars().first()
    api_key = cfg.openai_api_key if cfg and cfg.openai_api_key else None

    client = _build_client(api_key)
    context = "\n---\n".join(context_chunks) if context_chunks else "Catálogo no disponible"
    messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\n\nCATÁLOGO:\n{context}"},
        {"role": "user", "content": user_query},
    ]
    resp = client.chat.completions.create(
        model=settings.openai_model, messages=messages, temperature=0.3
    )
    return resp.choices[0].message.content
