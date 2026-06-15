from pydantic import model_validator
from pydantic_settings import BaseSettings

WEAK_SECRETS = {
    "change_me_to_a_random_secret",
    "change_me",
    "changeme",
    "changethis",
    "devsecret",
    "secret",
    "default",
    "mysecret",
    "test",
    "password",
}


class Settings(BaseSettings):
    environment: str = "development"
    debug: bool = True
    port: int = 8000
    secret_key: str = "change_me_to_a_random_secret"
    log_level: str = "DEBUG"
    cors_origins: list[str] = ["*"]

    database_url: str = "postgresql+asyncpg://eco:eco_secret@postgres:5432/eco_db"
    db_password: str = "eco_secret"

    redis_url: str = "redis://redis:6379/0"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    openai_base_url: str = ""

    telegram_bot_token: str = ""

    whatsapp_phone_number_id: str = ""
    whatsapp_access_token: str = ""
    whatsapp_verify_token: str = ""
    whatsapp_api_version: str = "v21.0"
    whatsapp_base_url: str = "https://graph.facebook.com"

    mock_whatsapp_url: str = "http://mock-whatsapp:4010"

    frontend_url: str = "http://localhost:3000"

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""
    stripe_enterprise_price_id: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @model_validator(mode="after")
    def validate_production(self):
        if self.database_url.startswith("postgresql://"):
            self.database_url = self.database_url.replace(
                "postgresql://", "postgresql+asyncpg://", 1
            )

        if self.environment != "production":
            return self

        if self.debug:
            raise ValueError(
                "DEBUG debe ser False en entorno de produccion."
            )

        if self.secret_key.lower() in WEAK_SECRETS:
            raise ValueError(
                f"SECRET_KEY insegura en produccion. "
                f"No puede usar un valor por defecto como '{self.secret_key}'. "
                "Genere una clave aleatoria con: openssl rand -hex 32"
            )

        if "*" in self.cors_origins:
            raise ValueError(
                "CORS_ORIGINS no puede contener '*' (comodin) en produccion. "
                "Debe especificar una lista de dominios explicitos, ej: "
                "['https://miapp.com', 'https://admin.miapp.com']"
            )

        if self.log_level.upper() == "DEBUG":
            self.log_level = "INFO"

        return self


settings = Settings()
