"""Supabase client setup for backend-only database access."""

from __future__ import annotations

from supabase import Client, create_client

from backend.app.settings import get_settings


def get_supabase_client() -> Client | None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None

    return create_client(settings.supabase_url, settings.supabase_service_role_key)
