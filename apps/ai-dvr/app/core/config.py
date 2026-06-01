from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = Field(default="ai-dvr")
    environment: str = Field(default="development")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="AI_DVR_",
        extra="ignore",
    )


settings = Settings()
