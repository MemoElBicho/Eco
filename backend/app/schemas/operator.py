from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class OperatorTemplateOut(BaseModel):
    id: UUID
    slug: str
    name: str
    description: str | None = None
    category: str
    default_tools: list
    default_channels: list
    config_schema: dict | None = None
    icon_url: str | None = None
    version: str = "1.0.0"

    model_config = {"from_attributes": True}


class ChannelConfig(BaseModel):
    channel: str
    external_id: str | None = None


class CreateOperator(BaseModel):
    template_slug: str
    name: str
    config: dict
    channels: list[ChannelConfig]


class UpdateOperator(BaseModel):
    name: str | None = None
    config: dict | None = None


class ToolOut(BaseModel):
    id: UUID
    tool_type: str
    config: dict | None = None
    is_enabled: bool = True

    model_config = {"from_attributes": True}


class ChannelOut(BaseModel):
    id: UUID
    channel: str
    external_id: str | None = None
    is_active: bool = True

    model_config = {"from_attributes": True}


class OperatorInstanceOut(BaseModel):
    id: UUID
    organization_id: UUID
    template_id: UUID
    name: str
    config: dict | None = None
    system_prompt: str | None = None
    webhook_token: UUID
    model: str = "gemini-2.5-flash"
    status: str = "active"
    created_at: datetime | None = None
    deployed_at: datetime | None = None
    updated_at: datetime | None = None
    tools: list[ToolOut] = []
    channels: list[ChannelOut] = []

    model_config = {"from_attributes": True}
