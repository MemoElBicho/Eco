import stripe
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.v1.auth import get_current_user
from app.config import settings
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.subscription import CheckoutSessionOut, PortalSessionOut, SubscriptionOut

router = APIRouter(prefix="/billing")

FREE_PLAN = SubscriptionOut(
    id=None,  # type: ignore
    workspace_id=None,  # type: ignore
    plan="free",
    status="active",
    stripe_customer_id=None,
    stripe_subscription_id=None,
    current_period_end=None,
)


@router.get("/", response_model=SubscriptionOut)
async def get_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription).where(Subscription.workspace_id == user.workspace_id)
    )
    sub = result.scalars().first()
    if not sub:
        return FREE_PLAN.model_copy(update={"workspace_id": user.workspace_id})
    return sub


@router.post("/checkout", response_model=CheckoutSessionOut)
async def create_checkout(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stripe.api_key = settings.stripe_secret_key

    result = await db.execute(
        select(Subscription).where(Subscription.workspace_id == user.workspace_id)
    )
    sub = result.scalars().first()

    if not sub:
        customer = stripe.Customer.create(
            email=user.email,
            metadata={"workspace_id": str(user.workspace_id)},
        )
        sub = Subscription(
            workspace_id=user.workspace_id,
            stripe_customer_id=customer.id,
            plan="free",
            status="active",
        )
        db.add(sub)
        await db.commit()
        await db.refresh(sub)
    elif not sub.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            metadata={"workspace_id": str(user.workspace_id)},
        )
        sub.stripe_customer_id = customer.id
        await db.commit()
        await db.refresh(sub)

    session = stripe.checkout.Session.create(
        customer=sub.stripe_customer_id,
        line_items=[{"price": settings.stripe_pro_price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.frontend_url}/dashboard/settings?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.frontend_url}/dashboard/settings",
        metadata={"workspace_id": str(user.workspace_id)},
    )

    return CheckoutSessionOut(url=session.url if session.url else "")


@router.post("/portal", response_model=PortalSessionOut)
async def create_portal(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stripe.api_key = settings.stripe_secret_key

    result = await db.execute(
        select(Subscription).where(Subscription.workspace_id == user.workspace_id)
    )
    sub = result.scalars().first()

    if not sub or not sub.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No Stripe customer found")

    session = stripe.billing_portal.Session.create(
        customer=sub.stripe_customer_id,
        return_url=f"{settings.frontend_url}/dashboard/settings",
    )

    return PortalSessionOut(url=session.url)
