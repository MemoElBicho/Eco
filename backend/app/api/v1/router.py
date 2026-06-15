from fastapi import APIRouter

from app.api.v1.auth import login, me, register
from app.api.v1.brain import router as brain_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.leads import router as leads_router
from app.api.v1.billing import router as billing_router
from app.api.v1.settings import router as settings_router
from app.api.v1.webhooks.telegram import router as telegram_router
from app.api.v1.webhooks.stripe import router as stripe_router
from app.api.v1.webhooks.whatsapp import router as whatsapp_router
from app.api.v1.catalog import router as catalog_router
from app.api.v1.operators import router as operators_router
from app.api.v1.webhooks.hubspot import router as hubspot_router

router = APIRouter(prefix="/api/v1")

router.add_api_route("/auth/register", register, methods=["POST"])
router.add_api_route("/auth/login", login, methods=["POST"])
router.add_api_route("/auth/me", me, methods=["GET"])

router.include_router(telegram_router)
router.include_router(whatsapp_router)
router.include_router(stripe_router)
router.include_router(hubspot_router)
router.include_router(brain_router)
router.include_router(leads_router)
router.include_router(conversations_router)
router.include_router(settings_router)
router.include_router(billing_router)
router.include_router(catalog_router)
router.include_router(operators_router)
