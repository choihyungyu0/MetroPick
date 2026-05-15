"""Database health endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from backend.app.services.supabase_service import get_supabase_client

router = APIRouter(prefix="/api/db", tags=["database"])


@router.get("/health")
def db_health() -> dict[str, bool | str]:
    client = get_supabase_client()
    if client is None:
        return {
            "connected": False,
            "status": "missing_env",
            "message": "Supabase environment variables are not configured.",
        }

    return {
        "connected": True,
        "status": "client_ready",
        "message": "Supabase client is configured.",
    }
