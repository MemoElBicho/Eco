import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, UploadFile
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.v1.auth import get_current_user
from app.models.brain_document import BrainDocument
from app.models.user import User

router = APIRouter(prefix="/brain")


class DocOut(BaseModel):
    filename: str
    chunk_count: int
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


@router.get("/documents", response_model=list[DocOut])
async def list_docs(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BrainDocument.filename, func.count().label("cnt"), func.max(BrainDocument.created_at))
        .where(BrainDocument.workspace_id == user.workspace_id)
        .group_by(BrainDocument.filename)
        .order_by(func.max(BrainDocument.created_at).desc())
    )
    return [DocOut(filename=row[0], chunk_count=row[1], created_at=row[2]) for row in result.all()]


@router.post("/upload")
async def upload_doc(file: UploadFile, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    chunk_size = 1000
    chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

    for idx, chunk in enumerate(chunks):
        doc = BrainDocument(
            workspace_id=user.workspace_id,
            filename=file.filename or "document",
            chunk_index=idx,
            content=chunk,
        )
        db.add(doc)

    await db.commit()
    return {"status": "ok", "filename": file.filename, "chunks": len(chunks)}
