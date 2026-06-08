import uuid

from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class WorkspaceConfig(Base):
    __tablename__ = "workspace_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), unique=True, index=True, nullable=False)

    whatsapp_phone_number_id = Column(String(255), nullable=True)
    whatsapp_access_token = Column(String(512), nullable=True)
    whatsapp_verify_token = Column(String(255), nullable=True)
    telegram_bot_token = Column(String(255), nullable=True)
    openai_api_key = Column(String(512), nullable=True)

    workspace = relationship("Workspace")
