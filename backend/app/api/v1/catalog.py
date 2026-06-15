from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.operator_template import OperatorTemplate
from app.schemas.operator import OperatorTemplateOut

router = APIRouter(prefix="/catalog")


@router.get("/", response_model=list[OperatorTemplateOut])
async def list_templates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(OperatorTemplate).where(OperatorTemplate.is_active == True)
    )
    return result.scalars().all()


@router.get("/{slug}", response_model=OperatorTemplateOut)
async def get_template(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(OperatorTemplate).where(
            OperatorTemplate.slug == slug,
            OperatorTemplate.is_active == True,
        )
    )
    t = result.scalars().first()
    if not t:
        raise HTTPException(status_code=404, detail="Template no encontrado")
    return t
