from io import BytesIO

import httpx
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.brain_document import BrainDocument

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
TOP_K = 3
VECTOR_DIM = 3072
EMBED_MODEL = "gemini-embedding-001"
GEMINI_EMBED_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{EMBED_MODEL}:embedContent"


def _should_mock() -> bool:
    key = settings.openai_api_key
    return not key or key.startswith("sk-your_")


async def _embed(text: str) -> list[float]:
    if _should_mock():
        return [0.0] * VECTOR_DIM
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GEMINI_EMBED_URL,
            params={"key": settings.openai_api_key},
            json={"model": f"models/{EMBED_MODEL}", "content": {"parts": [{"text": text}]}},
        )
        resp.raise_for_status()
        return resp.json()["embedding"]["values"]


async def ingest(file_bytes: bytes, filename: str, workspace_id: str, db: AsyncSession):
    if filename.endswith(".pdf"):
        reader = PdfReader(BytesIO(file_bytes))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    else:
        text = file_bytes.decode("utf-8")

    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    chunks = splitter.split_text(text)

    for idx, chunk in enumerate(chunks):
        vec = await _embed(chunk)
        doc = BrainDocument(
            workspace_id=workspace_id,
            filename=filename,
            chunk_index=idx,
            content=chunk,
            embedding=vec,
        )
        db.add(doc)

    await db.commit()


async def query_brain(query: str, workspace_id: str, db: AsyncSession, top_k: int = TOP_K):
    vec = await _embed(query)

    result = await db.execute(
        select(BrainDocument.content)
        .where(BrainDocument.workspace_id == workspace_id)
        .order_by(BrainDocument.embedding.cosine_distance(vec))
        .limit(top_k)
    )
    return [row for (row,) in result.fetchall()]
