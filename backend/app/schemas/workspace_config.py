from uuid import UUID

from pydantic import BaseModel


class WorkspaceConfigUpdate(BaseModel):
    whatsapp_phone_number_id: str | None = None
    whatsapp_access_token: str | None = None
    whatsapp_verify_token: str | None = None
    telegram_bot_token: str | None = None
    openai_api_key: str | None = None
    hubspot_access_token: str | None = None
    hubspot_portal_id: str | None = None


class WorkspaceConfigResponse(WorkspaceConfigUpdate):
    id: UUID
    workspace_id: UUID

    model_config = {"from_attributes": True}
