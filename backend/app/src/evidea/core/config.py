from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _repo_env_file() -> Path | None:
    parents = Path(__file__).resolve().parents
    return parents[5] / ".env" if len(parents) > 5 else None


_REPO_ENV_FILE = _repo_env_file()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_REPO_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: Literal["development", "test", "production"] = "development"

    database_app_url: str = Field(alias="DATABASE_APP_URL")
    db_connect_timeout_seconds: int = Field(default=5, ge=2)

    jwt_secret: SecretStr = Field(alias="JWT_SECRET", min_length=32)
    jwt_ttl_hours: int = Field(default=8, ge=1, le=24)
    session_cookie_name: str = "evidea_session"
    cookie_secure: bool = True

    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:8080"]

    frontend_url: str = "http://localhost:5173"
    invitation_ttl_hours: int = Field(default=72, ge=1)
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_username: str | None = None
    smtp_password: SecretStr | None = None
    smtp_starttls: bool = False
    mail_from: str = "EVIDEA <no-reply@evidea.local>"

    storage_dir: Path = Path("storage")
    max_upload_bytes: int = 2 * 1024 * 1024

    login_max_attempts: int = 5
    login_window_seconds: int = 60

    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    log_json: bool = True

    @field_validator("database_app_url")
    @classmethod
    def _use_psycopg_driver(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return "postgresql+psycopg://" + value.removeprefix("postgresql://")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
