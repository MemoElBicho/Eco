from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.brain_document import BrainDocument
from app.models.lead import Lead
from app.models.message import Message
from app.models.subscription import Subscription

FREE_LIMITS = {"brain_docs": 1, "leads": 5, "messages": 50}

FREE_LIMIT_MESSAGES = {
    "brain_docs": "Límite del plan gratuito alcanzado: máximo 1 documento en el Brain.",
    "leads": "Límite del plan gratuito alcanzado: máximo 5 leads.",
    "messages": "Límite del plan gratuito alcanzado: máximo 50 mensajes este mes.",
}


async def check_free_plan_limits(db: AsyncSession, workspace_id, resource: str):
    result = await db.execute(
        select(Subscription.plan, Subscription.status).where(
            Subscription.workspace_id == workspace_id
        )
    )
    row = result.first()
    if row and row.plan != "free" and row.status == "active":
        return

    limit = FREE_LIMITS[resource]

    if resource == "brain_docs":
        result = await db.execute(
            select(func.count(func.distinct(BrainDocument.filename))).where(
                BrainDocument.workspace_id == workspace_id
            )
        )
    elif resource == "leads":
        result = await db.execute(
            select(func.count(Lead.id)).where(Lead.workspace_id == workspace_id)
        )
    elif resource == "messages":
        first_of_month = datetime.utcnow().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        result = await db.execute(
            select(func.count(Message.id)).where(
                Message.workspace_id == workspace_id,
                Message.created_at >= first_of_month,
            )
        )
    else:
        return

    count = result.scalar()
    if count >= limit:
        raise HTTPException(status_code=403, detail=FREE_LIMIT_MESSAGES[resource])
