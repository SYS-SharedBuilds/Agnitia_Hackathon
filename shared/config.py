from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DEMO_MODE: bool = True
    AUTH_DISABLED: bool = True
    API_KEY: str = "switchon-secret-dev-key"

    # Services
    ORDER_API_URL: str = "http://localhost:8000"
    TEMPORAL_HOST: str = "localhost:7233"
    TEMPORAL_NAMESPACE: str = "default"
    TASK_QUEUE: str = "switchon-activation-queue"
    REDIS_URL: str = "redis://localhost:6379/0"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/switchon"

    # Mock Services
    OMS_MOCK_URL: str = "http://localhost:8101"
    INVENTORY_MOCK_URL: str = "http://localhost:8102"
    NETWORK_MOCK_URL: str = "http://localhost:8103"
    BILLING_MOCK_URL: str = "http://localhost:8104"
    NOTIFICATION_MOCK_URL: str = "http://localhost:8105"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
