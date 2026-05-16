"""Saved location persistence endpoints backed by Supabase."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from backend.app.dependencies.auth import AuthUser, get_optional_current_user, resolve_user_id
from backend.app.schemas import SavedLocationCreate, SavedLocationUpdate
from backend.app.services.supabase_service import get_supabase_client

router = APIRouter(prefix="/api/saved-locations", tags=["saved-locations"])


def _supabase_error(error: Exception) -> HTTPException:
    return HTTPException(
        status_code=502,
        detail={
            "data_status": "supabase_error",
            "message": "Supabase saved_locations query failed.",
            "error_type": error.__class__.__name__,
        },
    )


def _missing_supabase_error() -> HTTPException:
    return HTTPException(
        status_code=503,
        detail={
            "data_status": "supabase_missing",
            "message": "Supabase environment variables are not configured.",
        },
    )


def _empty_response_error() -> HTTPException:
    return HTTPException(
        status_code=502,
        detail={
            "data_status": "supabase_error",
            "message": "Supabase saved_locations query failed.",
            "error_type": "EmptyResponse",
        },
    )


def _saved_location_rows(data: object | None) -> list[dict[str, object]]:
    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]
    return []


def _first_saved_location(data: object | None) -> dict[str, object] | None:
    rows = _saved_location_rows(data)
    return rows[0] if rows else None


@router.get("")
def list_saved_locations(
    user_id: str | None = None,
    auth_user: AuthUser | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        return {
            "data_status": "supabase_missing",
            "locations": [],
        }

    try:
        query = client.table("saved_locations").select("*")
        resolved_user_id = resolve_user_id(auth_user, user_id)
        if resolved_user_id:
            query = query.eq("user_id", resolved_user_id)
        response = query.order("created_at", desc=True).limit(50).execute()
    except Exception as error:
        raise _supabase_error(error) from error

    return {
        "data_status": "supabase_connected",
        "locations": _saved_location_rows(getattr(response, "data", None)),
    }


@router.post("")
def create_saved_location(
    payload: SavedLocationCreate,
    auth_user: AuthUser | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    location_payload = payload.model_dump()
    location_payload["user_id"] = resolve_user_id(auth_user, payload.user_id)
    try:
        response = client.table("saved_locations").insert(location_payload).execute()
    except Exception as error:
        raise _supabase_error(error) from error

    location = _first_saved_location(getattr(response, "data", None))
    if location is None:
        raise _empty_response_error()

    return {
        "data_status": "supabase_connected",
        "location": location,
    }


@router.get("/{location_id}")
def get_saved_location(location_id: str) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    try:
        response = (
            client.table("saved_locations")
            .select("*")
            .eq("id", location_id)
            .limit(1)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    location = _first_saved_location(getattr(response, "data", None))
    if location is None:
        raise HTTPException(status_code=404, detail="Saved location not found.")

    return {
        "data_status": "supabase_connected",
        "location": location,
    }


@router.patch("/{location_id}")
def update_saved_location(
    location_id: str,
    payload: SavedLocationUpdate,
) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    update_payload = payload.model_dump(exclude_unset=True)
    if not update_payload:
        raise HTTPException(status_code=400, detail="No saved location fields to update.")

    try:
        response = (
            client.table("saved_locations")
            .update(update_payload)
            .eq("id", location_id)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    location = _first_saved_location(getattr(response, "data", None))
    if location is None:
        raise HTTPException(status_code=404, detail="Saved location not found.")

    return {
        "data_status": "supabase_connected",
        "location": location,
    }


@router.delete("/{location_id}")
def delete_saved_location(location_id: str) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    try:
        lookup_response = (
            client.table("saved_locations")
            .select("id")
            .eq("id", location_id)
            .limit(1)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    if _first_saved_location(getattr(lookup_response, "data", None)) is None:
        raise HTTPException(status_code=404, detail="Saved location not found.")

    try:
        client.table("saved_locations").delete().eq("id", location_id).execute()
    except Exception as error:
        raise _supabase_error(error) from error

    return {
        "data_status": "supabase_connected",
        "deleted": True,
        "id": location_id,
    }
