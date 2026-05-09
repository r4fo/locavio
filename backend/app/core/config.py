from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings

_env_file = Path(__file__).parents[2] / "...env"


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    GOOGLE_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:5173"

    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GOOGLE_MAPS_API_KEY: str = ""
    OPENCAGE_API_KEY: str = ""
    DEFAULT_LANGUAGE: str = "en"
    ALLOWED_LANGUAGES: list[str] = ["en", "fr", "es", "ar", "tr"]

    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None

    model_config = {"env_file": _env_file, "env_file_encoding": "utf-8"}

    @field_validator("SECRET_KEY", mode="before")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        weak = {"secret", "password", "changeme", "mysecretkey", "test"}
        if len(v) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        if v.lower() in weak:
            raise ValueError("SECRET_KEY is too weak — use a random generated value")
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_database_url(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        if "supabase.co" in v and "ssl=" not in v:
            connector = "&" if "?" in v else "?"
            v = f"{v}{connector}ssl=require"
        return v


settings = Settings()
