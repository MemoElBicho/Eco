from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.database import get_db
from app.models.subscription import Subscription
from app.models.user import User


async def get_current_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription).where(Subscription.workspace_id == user.workspace_id)
    )
    sub = result.scalars().first()
    if not sub:
        return Subscription(workspace_id=user.workspace_id, plan="free", status="active")
    return sub


async def require_pro_plan(sub: Subscription = Depends(get_current_subscription)):
    if sub.plan == "free" or sub.status != "active":
        raise HTTPException(
            status_code=403,
            detail="Se requiere un plan Pro o Enterprise para acceder a este recurso.",
        )
    return sub
