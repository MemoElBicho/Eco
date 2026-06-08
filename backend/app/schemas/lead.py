from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class LeadCreate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    channel: str
    channel_user_id: str
    status: str = "new"
    notes: str | None = None


class LeadUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    status: str | None = None
    notes: str | None = None


class LeadOut(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str | None
    phone: str | None
    email: str | None
    channel: str
    channel_user_id: str
    status: str
    bot_active: bool = True
    notes: str | None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}

class ManualSendIn(BaseModel):
    content: str
