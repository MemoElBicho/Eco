import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.config import settings
from app.models.subscription import Subscription

router = APIRouter(prefix="/webhooks/stripe")


@router.post("")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type == "checkout.session.completed":
        workspace_id = (
            obj.get("client_reference_id")
            or obj["metadata"].get("workspace_id")
        )
        customer_id = obj["customer"]
        subscription_id = obj["subscription"]

        result = await db.execute(
            select(Subscription).where(
                Subscription.workspace_id == workspace_id
            )
        )
        sub = result.scalars().first()

        if sub:
            sub.stripe_customer_id = customer_id
            sub.stripe_subscription_id = subscription_id
            sub.status = "active"
            sub.plan = "pro"
        else:
            sub = Subscription(
                workspace_id=workspace_id,
                stripe_customer_id=customer_id,
                stripe_subscription_id=subscription_id,
                status="active",
                plan="pro",
            )
            db.add(sub)
        await db.commit()

    elif event_type == "invoice.paid":
        subscription_id = obj["subscription"]
        customer_id = obj["customer"]

        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == subscription_id
            )
        )
        sub = result.scalars().first()
        if not sub:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_customer_id == customer_id
                )
            )
            sub = result.scalars().first()

        if sub:
            sub.status = "active"
            await db.commit()

    elif event_type == "customer.subscription.deleted":
        subscription_id = obj["id"]

        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == subscription_id
            )
        )
        sub = result.scalars().first()
        if sub:
            sub.status = "canceled"
            sub.plan = "free"
            await db.commit()

    return {"status": "success"}
