import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import get_db
from app.api.v1.auth import get_current_user
from app.models.operator_channel import OperatorChannel
from app.models.operator_instance import OperatorInstance
from app.models.operator_template import OperatorTemplate
from app.models.operator_tool import OperatorTool
from app.models.user import User
from app.schemas.operator import (
    ChannelOut,
    CreateOperator,
    OperatorInstanceOut,
    ToolOut,
    UpdateOperator,
)

router = APIRouter(prefix="/operators")


def _instance_to_out(inst: OperatorInstance) -> OperatorInstanceOut:
    return OperatorInstanceOut(
        id=inst.id,
        organization_id=inst.organization_id,
        template_id=inst.template_id,
        name=inst.name,
        config=inst.config,
        system_prompt=inst.system_prompt,
        webhook_token=inst.webhook_token,
        model=inst.model or "gemini-2.5-flash",
        status=inst.status or "active",
        created_at=inst.created_at,
        deployed_at=inst.deployed_at,
        updated_at=inst.updated_at,
        tools=[
            ToolOut(
                id=t.id,
                tool_type=t.tool_type,
                config=t.config,
                is_enabled=t.is_enabled,
            )
            for t in (inst.tools or [])
        ],
        channels=[
            ChannelOut(
                id=c.id,
                channel=c.channel,
                external_id=c.external_id,
                is_active=c.is_active,
            )
            for c in (inst.channels or [])
        ],
    )


@router.get("/", response_model=list[OperatorInstanceOut])
async def list_instances(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OperatorInstance)
        .options(
            selectinload(OperatorInstance.tools),
            selectinload(OperatorInstance.channels),
        )
        .where(OperatorInstance.organization_id == user.workspace_id)
        .order_by(OperatorInstance.created_at.desc())
    )
    return [_instance_to_out(i) for i in result.scalars().all()]


@router.post("/", response_model=OperatorInstanceOut, status_code=201)
async def create_instance(
    body: CreateOperator,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    template_result = await db.execute(
        select(OperatorTemplate).where(OperatorTemplate.slug == body.template_slug)
    )
    template = template_result.scalars().first()
    if not template:
        raise HTTPException(status_code=404, detail="Template no encontrado")

    try:
        system_prompt = template.system_prompt_template.format(**body.config)
    except KeyError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Falta el campo requerido en config: {e}",
        )

    instance = OperatorInstance(
        organization_id=user.workspace_id,
        template_id=template.id,
        name=body.name,
        config=body.config,
        system_prompt=system_prompt,
        webhook_token=uuid.uuid4(),
        model="gemini-2.5-flash",
        status="active",
    )
    db.add(instance)
    await db.flush()

    for tool_type in (template.default_tools or []):
        tool = OperatorTool(
            operator_instance_id=instance.id,
            tool_type=tool_type,
            is_enabled=True,
        )
        db.add(tool)

    for ch in (body.channels or []):
        channel = OperatorChannel(
            operator_instance_id=instance.id,
            channel=ch.channel,
            external_id=ch.external_id,
            is_active=True,
        )
        db.add(channel)

    await db.commit()

    result = await db.execute(
        select(OperatorInstance)
        .options(
            selectinload(OperatorInstance.tools),
            selectinload(OperatorInstance.channels),
        )
        .where(OperatorInstance.id == instance.id)
    )
    return _instance_to_out(result.scalars().first())


@router.get("/{instance_id}", response_model=OperatorInstanceOut)
async def get_instance(
    instance_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OperatorInstance)
        .options(
            joinedload(OperatorInstance.template),
            selectinload(OperatorInstance.tools),
            selectinload(OperatorInstance.channels),
        )
        .where(
            OperatorInstance.id == instance_id,
            OperatorInstance.organization_id == user.workspace_id,
        )
    )
    instance = result.scalars().first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instancia no encontrada")
    return instance


@router.put("/{instance_id}", response_model=OperatorInstanceOut)
async def update_instance(
    instance_id: uuid.UUID,
    body: UpdateOperator,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OperatorInstance).where(
            OperatorInstance.id == instance_id,
            OperatorInstance.organization_id == user.workspace_id,
        )
    )
    instance = result.scalars().first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instancia no encontrada")

    if body.name is not None:
        instance.name = body.name
    if body.config is not None:
        instance.config = body.config
        template_result = await db.execute(
            select(OperatorTemplate).where(OperatorTemplate.id == instance.template_id)
        )
        template = template_result.scalars().first()
        if template:
            try:
                instance.system_prompt = template.system_prompt_template.format(
                    **body.config
                )
            except KeyError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Falta el campo requerido en config: {e}",
                )

    await db.commit()

    result = await db.execute(
        select(OperatorInstance)
        .options(
            selectinload(OperatorInstance.tools),
            selectinload(OperatorInstance.channels),
        )
        .where(OperatorInstance.id == instance.id)
    )
    return _instance_to_out(result.scalars().first())


@router.delete("/{instance_id}")
async def soft_delete_instance(
    instance_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OperatorInstance).where(
            OperatorInstance.id == instance_id,
            OperatorInstance.organization_id == user.workspace_id,
        )
    )
    instance = result.scalars().first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instancia no encontrada")

    instance.status = "deleted"
    await db.commit()

    return {"status": "deleted"}


@router.post("/{instance_id}/deploy", response_model=OperatorInstanceOut)
async def deploy_instance(
    instance_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OperatorInstance).where(
            OperatorInstance.id == instance_id,
            OperatorInstance.organization_id == user.workspace_id,
        )
    )
    instance = result.scalars().first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instancia no encontrada")

    instance.status = "active"
    instance.deployed_at = datetime.utcnow()
    await db.commit()

    result = await db.execute(
        select(OperatorInstance)
        .options(
            selectinload(OperatorInstance.tools),
            selectinload(OperatorInstance.channels),
        )
        .where(OperatorInstance.id == instance.id)
    )
    return _instance_to_out(result.scalars().first())
