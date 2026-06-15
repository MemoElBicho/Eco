import json
from unittest.mock import MagicMock, patch
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.subscription import Subscription
from app.models.workspace import Workspace


async def test_create_checkout_session(async_client: AsyncClient, auth_headers: dict, db_session: AsyncSession):
    mock_session = MagicMock()
    mock_session.url = "https://checkout.stripe.com/test_session"

    with patch("stripe.Customer.create", return_value=MagicMock(id="cus_test123")):
        with patch("stripe.checkout.Session.create", return_value=mock_session):
            resp = await async_client.post("/api/v1/billing/checkout", headers=auth_headers)

    assert resp.status_code == 200
    assert resp.json()["url"] == "https://checkout.stripe.com/test_session"

    result = await db_session.execute(select(Subscription))
    sub = result.scalars().first()
    assert sub is not None
    assert sub.stripe_customer_id == "cus_test123"


async def test_stripe_webhook_signing(async_client: AsyncClient, db_session: AsyncSession, test_workspace: Workspace):
    mock_event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": None,
                "customer": "cus_webhook",
                "subscription": "sub_webhook",
                "metadata": {"workspace_id": str(test_workspace.id)},
            }
        },
    }

    with patch("stripe.Webhook.construct_event", return_value=mock_event):
        resp = await async_client.post(
            "/api/v1/webhooks/stripe",
            content=json.dumps(mock_event),
            headers={"Stripe-Signature": "t=123,v1=sig"},
        )

    assert resp.status_code == 200

    result = await db_session.execute(
        select(Subscription).where(Subscription.workspace_id == test_workspace.id)
    )
    sub = result.scalar_one_or_none()
    assert sub is not None
    assert sub.plan == "pro"
    assert sub.status == "active"
    assert sub.stripe_customer_id == "cus_webhook"
    assert sub.stripe_subscription_id == "sub_webhook"
