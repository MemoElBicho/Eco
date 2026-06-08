from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "development"
    debug: bool = True
    port: int = 8000
    secret_key: str = "change_me_to_a_random_secret"

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

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
