import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.v1.auth import get_current_user
from app.models.lead import Lead
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadOut, LeadUpdate

router = APIRouter(prefix="/leads")


def _to_out(l: Lead) -> LeadOut:
    return LeadOut(
        id=str(l.id), workspace_id=str(l.workspace_id),
        name=l.name, phone=l.phone, email=l.email,
        channel=l.channel, channel_user_id=l.channel_user_id,
        status=l.status, notes=l.notes,
        created_at=l.created_at, updated_at=l.updated_at,
    )


@router.get("/", response_model=list[LeadOut])
async def list_leads(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Lead).where(Lead.workspace_id == user.workspace_id).order_by(Lead.updated_at.desc())
        )
        return [_to_out(l) for l in result.scalars().all()]
    except Exception as e:
        print(f"Error in GET /leads: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=LeadOut, status_code=201)
async def create_lead(
    body: LeadCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        lead = Lead(workspace_id=user.workspace_id, **body.model_dump())
        db.add(lead)
        await db.commit()
        await db.refresh(lead)
        return _to_out(lead)
    except Exception as e:
        print(f"Error in POST /leads: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(
    lead_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Lead).where(Lead.id == lead_id, Lead.workspace_id == user.workspace_id)
        )
        lead = result.scalar_one_or_none()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        return _to_out(lead)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in GET /leads/{lead_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{lead_id}", response_model=LeadOut)
async def update_lead(
    lead_id: uuid.UUID,
    body: LeadUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Lead).where(Lead.id == lead_id, Lead.workspace_id == user.workspace_id)
        )
        lead = result.scalar_one_or_none()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(lead, field, value)
        lead.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(lead)
        return _to_out(lead)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in PUT /leads/{lead_id}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Lead).where(Lead.id == lead_id, Lead.workspace_id == user.workspace_id)
        )
        lead = result.scalar_one_or_none()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        await db.delete(lead)
        await db.commit()
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in DELETE /leads/{lead_id}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
