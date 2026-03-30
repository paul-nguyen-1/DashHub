from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    port: int = 8000
    allowed_origins: list[str] = ["http://localhost:3000"]
    max_upload_size_mb: int = 50

settings = Settings()
