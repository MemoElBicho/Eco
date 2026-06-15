from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.lead import Lead
from app.models.workspace_config import WorkspaceConfig
from app.services.hubspot_client import create_or_update_contact
from app.tasks.celery_app import celery_app


@celery_app.task
def sync_lead_to_hubspot_task(lead_id: str, workspace_id: str):
    import asyncio
    asyncio.run(_async_sync_lead_to_hubspot(lead_id, workspace_id))


async def _async_sync_lead_to_hubspot(lead_id: str, workspace_id: str):
    engine = create_async_engine(settings.database_url, echo=settings.debug)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as session:
        try:
            result = await session.execute(
                select(Lead).where(Lead.id == lead_id)
            )
            lead = result.scalars().first()
            if not lead:
                return

            cfg_result = await session.execute(
                select(WorkspaceConfig).where(WorkspaceConfig.workspace_id == workspace_id)
            )
            config = cfg_result.scalars().first()
            if not config or not config.hubspot_access_token:
                return

            contact_data = {
                "name": lead.name,
                "phone": lead.phone,
                "email": lead.email,
            }
            hs_id = await create_or_update_contact(
                contact_data, config.hubspot_access_token, lead.hs_contact_id
            )
            if hs_id:
                lead.hs_contact_id = hs_id
                lead.hs_last_sync = datetime.utcnow()
                await session.commit()
        finally:
            await engine.dispose()
