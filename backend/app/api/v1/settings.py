from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.workspace_config import WorkspaceConfig
from app.schemas.workspace_config import WorkspaceConfigUpdate, WorkspaceConfigResponse

router = APIRouter(prefix="/settings")


@router.get("/", response_model=WorkspaceConfigResponse)
async def get_settings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WorkspaceConfig).where(WorkspaceConfig.workspace_id == user.workspace_id)
    )
    cfg = result.scalars().first()
    if not cfg:
        cfg = WorkspaceConfig(workspace_id=user.workspace_id)
        db.add(cfg)
        await db.commit()
        await db.refresh(cfg)
    return cfg


@router.put("/", response_model=WorkspaceConfigResponse)
async def update_settings(
    body: WorkspaceConfigUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WorkspaceConfig).where(WorkspaceConfig.workspace_id == user.workspace_id)
    )
    cfg = result.scalars().first()
    if not cfg:
        cfg = WorkspaceConfig(workspace_id=user.workspace_id)
        db.add(cfg)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(cfg, field, value)

    await db.commit()
    await db.refresh(cfg)
    return cfg
