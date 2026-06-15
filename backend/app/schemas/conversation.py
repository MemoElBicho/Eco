from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MessageOut(BaseModel):
    id: UUID
    channel: str
    from_user: str
    content: str
    direction: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    lead_id: UUID
    lead_name: str | None
    channel: str
    bot_active: bool = True
    sentiment: float = 0.0
    sentiment_label: str = "neutral"
    last_message: str | None
    last_message_at: datetime | None
    message_count: int


class BrainDocumentOut(BaseModel):
    filename: str
    chunk_count: int
    created_at: datetime | None = None


class BrainQueryIn(BaseModel):
    query: str


class BrainQueryOut(BaseModel):
    response: str
    sources: list[str]
