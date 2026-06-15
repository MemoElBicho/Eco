import asyncio
from contextlib import asynccontextmanager
from logging import getLogger

from alembic.config import Config
from alembic import command
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import router
from app.config import settings
import app.services.tools  # noqa: F401 - register tool classes in ToolRegistry

logger = getLogger(__name__)


def _run_migrations() -> None:
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", settings.database_url)
    command.upgrade(cfg, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await asyncio.to_thread(_run_migrations)
        logger.info("Database migrations applied successfully")
    except Exception as exc:
        logger.warning("Migration fallback failed (tables may already exist): %s", exc)
    yield


app = FastAPI(title="Eco API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception(request: Request, exc: Exception):
    print(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={"Access-Control-Allow-Origin": "*"},
    )


app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok"}
