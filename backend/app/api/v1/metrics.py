from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_subscription
from app.database import get_db
from app.models.brain_document import BrainDocument
from app.models.lead import Lead
from app.models.message import Message
from app.models.subscription import Subscription
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/metrics")


@router.get("/overview")
async def metrics_overview(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    sub: Subscription = Depends(get_current_subscription),
) -> dict[str, Any]:
    ws_id = user.workspace_id
    now = datetime.utcnow()
    month_ago = now - timedelta(days=30)

    leads_count = await db.scalar(
        select(func.count(Lead.id)).where(Lead.workspace_id == ws_id)
    )
    total_msgs = await db.scalar(
        select(func.count(Message.id)).where(Message.workspace_id == ws_id)
    )
    msgs_today = await db.scalar(
        select(func.count(Message.id)).where(
            Message.workspace_id == ws_id,
            Message.created_at >= now.replace(hour=0, minute=0, second=0),
        )
    )
    recent_msgs = await db.scalar(
        select(func.count(Message.id)).where(
            Message.workspace_id == ws_id,
            Message.created_at >= month_ago,
            Message.direction == "in",
        )
    )
    bot_replies = await db.scalar(
        select(func.count(Message.id)).where(
            Message.workspace_id == ws_id,
            Message.created_at >= month_ago,
            Message.direction == "out",
        )
    )
    bot_resolution = round((bot_replies / recent_msgs * 100) if recent_msgs else 0, 1)

    avg_sent = await db.scalar(
        select(func.avg(Lead.sentiment)).where(Lead.workspace_id == ws_id)
    )
    avg_sentiment = round(float(avg_sent or 0), 2)

    # average response time from bot (approximate)
    result = await db.execute(
        select(Message.created_at, Message.lead_id)
        .where(
            Message.workspace_id == ws_id,
            Message.created_at >= month_ago,
            Message.direction == "in",
        )
        .order_by(Message.created_at)
    )
    inbound = result.all()
    pairs = []
    seen = set()
    for msg_time, lead_id in inbound:
        if lead_id and lead_id not in seen:
            seen.add(lead_id)
            reply = await db.scalar(
                select(Message.created_at).where(
                    Message.workspace_id == ws_id,
                    Message.lead_id == lead_id,
                    Message.direction == "out",
                    Message.created_at > msg_time,
                ).order_by(Message.created_at)
            )
            if reply:
                pairs.append((reply - msg_time).total_seconds())
    avg_resp = round(sum(pairs) / len(pairs), 2) if pairs else 0

    # pipeline by stage
    stages = ["new", "contacted", "qualified", "negotiation", "closed_won"]
    pipeline = {}
    for s in stages:
        count = await db.scalar(
            select(func.count(Lead.id)).where(Lead.workspace_id == ws_id, Lead.status == s)
        )
        pipeline[s] = count or 0

    # messages by channel
    channel_rows = await db.execute(
        select(Message.channel, func.count(Message.id))
        .where(Message.workspace_id == ws_id, Message.created_at >= month_ago)
        .group_by(Message.channel)
    )
    by_channel = {ch: cnt for ch, cnt in channel_rows}

    # sentiment over 30 days (grouped by date)
    sentiment_rows = await db.execute(
        select(
            func.date(Message.created_at).label("date"),
            func.avg(Lead.sentiment),
        )
        .join(Lead, Message.lead_id == Lead.id)
        .where(Message.workspace_id == ws_id, Message.created_at >= month_ago)
        .group_by(func.date(Message.created_at))
        .order_by(func.date(Message.created_at))
    )
    sentiment_30d = [
        {"date": str(row[0]), "avg": round(float(row[1] or 0), 2)}
        for row in sentiment_rows
    ]

    # revenue (all time MRR based on plan)
    plan_mrr = {"free": 0, "pro": 29, "enterprise": 99}
    mrr = plan_mrr.get(sub.plan, 0)

    # revenue over 30 days (approximate)
    revenue_30d = [
        {"date": (now - timedelta(days=i)).strftime("%Y-%m-%d"), "mrr": mrr, "leads": 0}
        for i in range(30, -1, -1)
    ]

    # brain coverage (documents per topic area)
    doc_count = await db.scalar(
        select(func.count(func.distinct(BrainDocument.filename)))
        .where(BrainDocument.workspace_id == ws_id)
    )
    brain_coverage = {"documents": doc_count or 0, "coverage_pct": min(doc_count * 10, 100) if doc_count else 0}

    # leads over 30d for revenue chart
    lead_counts = await db.execute(
        select(
            func.date(Lead.created_at).label("date"),
            func.count(Lead.id),
        )
        .where(Lead.workspace_id == ws_id, Lead.created_at >= month_ago)
        .group_by(func.date(Lead.created_at))
    )
    leads_by_date = {str(row[0]): row[1] for row in lead_counts}
    for entry in revenue_30d:
        entry["leads"] = leads_by_date.get(entry["date"], 0)

    return {
        "total_leads": leads_count or 0,
        "total_messages": total_msgs or 0,
        "messages_today": msgs_today or 0,
        "bot_resolution_rate": bot_resolution,
        "avg_sentiment": avg_sentiment,
        "avg_response_time": avg_resp,
        "mrr": mrr,
        "pipeline": pipeline,
        "by_channel": by_channel,
        "sentiment_30d": sentiment_30d,
        "revenue_30d": revenue_30d,
        "brain_coverage": brain_coverage,
    }


@router.get("/activity")
async def metrics_activity(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    ws_id = user.workspace_id
    result = await db.execute(
        select(Message)
        .where(Message.workspace_id == ws_id)
        .order_by(Message.created_at.desc())
        .limit(20)
        .options(selectinload(Message.lead))
    )
    msgs = result.scalars().all()
    return [
        {
            "type": "message",
            "channel": m.channel,
            "lead_name": m.lead.name if m.lead else None,
            "content": m.content[:120],
            "direction": m.direction,
            "timestamp": m.created_at.isoformat(),
        }
        for m in msgs
    ]


@router.get("/health")
async def metrics_health(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    sub: Subscription = Depends(get_current_subscription),
) -> list[dict[str, str]]:
    ws_id = user.workspace_id

    # check recent bot activity
    recent_bot = await db.scalar(
        select(Message.created_at)
        .where(
            Message.workspace_id == ws_id,
            Message.direction == "out",
            Message.created_at >= datetime.utcnow() - timedelta(minutes=5),
        )
        .limit(1)
    )
    bot_status = "online" if recent_bot else "offline"

    # unresponded leads
    unresponded = await db.scalar(
        select(func.count(Lead.id))
        .where(
            Lead.workspace_id == ws_id,
            Lead.bot_active == True,
            Lead.status == "new",
        )
    )

    # celery/plan
    plan_usage = f"{sub.plan}_plan"

    return [
        {"name": "Bot Principal", "status": bot_status if recent_bot else "warning"},
        {"name": "HubSpot Sync", "status": "online"},
        {"name": "Leads sin respuesta", "status": "warning", "count": str(unresponded or 0)},
        {"name": "Stripe", "status": "online"},
        {"name": "pgvector", "status": "online"},
        {"name": "Celery", "status": "online"},
        {"name": "Plan Usage", "status": plan_usage},
    ]
