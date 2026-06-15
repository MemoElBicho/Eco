from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SubscriptionOut(BaseModel):
    id: UUID | None = None
    workspace_id: UUID | None = None
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    plan: str
    status: str
    current_period_end: datetime | None = None

    model_config = {"from_attributes": True}


class CheckoutSessionOut(BaseModel):
    url: str


class PortalSessionOut(BaseModel):
    url: str
