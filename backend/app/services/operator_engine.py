import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.operator_channel import OperatorChannel
from app.models.operator_instance import OperatorInstance


async def resolve_channel(
    webhook_token: str, channel: str, db: AsyncSession
) -> OperatorChannel:
    try:
        token = uuid.UUID(webhook_token)
    except ValueError:
        raise HTTPException(status_code=404, detail="Token inválido")

    stmt = (
        select(OperatorChannel)
        .join(OperatorInstance)
        .where(
            OperatorChannel.channel == channel,
            OperatorChannel.is_active == True,
            OperatorInstance.webhook_token == token,
        )
    )
    result = await db.execute(stmt)
    ch = result.scalars().first()
    if ch is None:
        raise HTTPException(
            status_code=404,
            detail="Canal no encontrado para el token provisto",
        )
    return ch


async def get_instance(
    instance_id: uuid.UUID, db: AsyncSession
) -> OperatorInstance:
    stmt = (
        select(OperatorInstance)
        .options(
            joinedload(OperatorInstance.template),
            selectinload(OperatorInstance.tools),
            selectinload(OperatorInstance.channels),
        )
        .where(
            OperatorInstance.id == instance_id,
            OperatorInstance.status == "active",
        )
    )
    result = await db.execute(stmt)
    instance = result.scalars().first()
    if instance is None:
        raise HTTPException(
            status_code=404,
            detail="Instancia del operador no encontrada o inactiva",
        )
    return instance


async def resolve_instance_from_token(
    webhook_token: str, channel: str, db: AsyncSession
) -> tuple[OperatorInstance, OperatorChannel]:
    ch = await resolve_channel(
        webhook_token=webhook_token, channel=channel, db=db
    )
    instance = await get_instance(instance_id=ch.operator_instance_id, db=db)
    return instance, ch
