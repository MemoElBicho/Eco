import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.operator_channel import OperatorChannel
    from app.models.operator_tool import OperatorTool
    from app.models.operator_template import OperatorTemplate
    from app.models.workspace import Workspace


class OperatorInstance(Base):
    __tablename__ = "operator_instances"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("operator_templates.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    config: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    webhook_token: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), unique=True, index=True, default=uuid.uuid4
    )
    model: Mapped[str] = mapped_column(String(100), default="gemini-2.5-flash")
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    deployed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    organization: Mapped["Workspace"] = relationship(
        back_populates="instances"
    )
    template: Mapped["OperatorTemplate"] = relationship(
        back_populates="instances"
    )
    tools: Mapped[list["OperatorTool"]] = relationship(
        back_populates="instance", cascade="all, delete-orphan"
    )
    channels: Mapped[list["OperatorChannel"]] = relationship(
        back_populates="instance", cascade="all, delete-orphan"
    )
