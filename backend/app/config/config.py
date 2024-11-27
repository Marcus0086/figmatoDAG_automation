from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    env: str = "development"
    openai_api_key: str = ""
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = ""
    aws_s3_bucket: str = ""
    model_config = SettingsConfigDict(env_file="../.env", extra="allow")


@lru_cache()
def get_settings():
    settings = Settings()
    return settings
