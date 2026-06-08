from fastapi import APIRouter

from app.api.v1.auth import login, me, register
from app.api.v1.brain import router as brain_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.leads import router as leads_router
from app.api.v1.settings import router as settings_router
from app.api.v1.webhooks.telegram import router as telegram_router
from app.api.v1.webhooks.whatsapp import router as whatsapp_router

router = APIRouter(prefix="/api/v1")

router.add_api_route("/auth/register", register, methods=["POST"])
router.add_api_route("/auth/login", login, methods=["POST"])
router.add_api_route("/auth/me", me, methods=["GET"])

router.include_router(telegram_router)
router.include_router(whatsapp_router)
router.include_router(brain_router)
router.include_router(leads_router)
router.include_router(conversations_router)
router.include_router(settings_router)
