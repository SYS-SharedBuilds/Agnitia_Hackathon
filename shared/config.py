from pydantic import model_validator
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
    NEON_CONNECTION_STRING: str | None = None

    # Mock Services
    OMS_MOCK_URL: str = "http://localhost:8101"
    INVENTORY_MOCK_URL: str = "http://localhost:8102"
    NETWORK_MOCK_URL: str = "http://localhost:8103"
    BILLING_MOCK_URL: str = "http://localhost:8104"
    NOTIFICATION_MOCK_URL: str = "http://localhost:8105"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode="after")
    def resolve_database_url(self) -> "Settings":
        if self.NEON_CONNECTION_STRING and (
            not self.DATABASE_URL or "localhost" in self.DATABASE_URL
        ):
            raw = self.NEON_CONNECTION_STRING.split("?")[0]
            if raw.startswith("postgres://"):
                raw = "postgresql+asyncpg://" + raw[len("postgres://") :]
            elif raw.startswith("postgresql://"):
                raw = "postgresql+asyncpg://" + raw[len("postgresql://") :]
            self.DATABASE_URL = f"{raw}?ssl=require"
        return self


settings = Settings()

