"""Profile persistence endpoints backed by Supabase."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.schemas import ProfileCreate
from backend.app.services.supabase_service import get_supabase_client

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


def _response_data(response: object) -> object:
    return getattr(response, "data", None)


def _profile_rows(data: object) -> list[dict[str, object]]:
    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]
    return []


def _first_profile(data: object) -> dict[str, object] | None:
    rows = _profile_rows(data)
    return rows[0] if rows else None


@router.get("")
def list_profiles() -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        return {
            "data_status": "supabase_missing",
            "profiles": [],
        }

    response = client.table("profiles").select("*").limit(20).execute()
    return {
        "data_status": "supabase_ready",
        "profiles": _profile_rows(_response_data(response)),
    }


@router.post("")
def create_profile(payload: ProfileCreate) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        return {
            "data_status": "supabase_missing",
            "profile": None,
        }

    profile_payload = payload.model_dump()
    response = (
        client.table("profiles")
        .upsert(profile_payload, on_conflict="email")
        .execute()
    )
    profile = _first_profile(_response_data(response))
    if profile is None:
        raise HTTPException(status_code=502, detail="Supabase did not return a profile.")

    return {
        "data_status": "supabase_ready",
        "profile": profile,
    }


@router.get("/{email}")
def get_profile(email: str) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        return {
            "data_status": "supabase_missing",
            "profile": None,
        }

    response = (
        client.table("profiles")
        .select("*")
        .eq("email", email)
        .limit(1)
        .execute()
    )
    profile = _first_profile(_response_data(response))
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found.")

    return {
        "data_status": "supabase_ready",
        "profile": profile,
    }
