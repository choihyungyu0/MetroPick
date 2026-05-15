"""Application settings loaded from server-side environment variables."""

from __future__ import annotations

from dataclasses import dataclass
from os import getenv

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    supabase_url: str | None
    supabase_service_role_key: str | None


def get_settings() -> Settings:
    return Settings(
        supabase_url=getenv("SUPABASE_URL"),
        supabase_service_role_key=getenv("SUPABASE_SERVICE_ROLE_KEY"),
    )
