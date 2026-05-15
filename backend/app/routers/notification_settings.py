"""Notification settings persistence endpoints backed by Supabase."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.schemas import NotificationSettingsCreate, NotificationSettingsUpdate
from backend.app.services.supabase_service import get_supabase_client

router = APIRouter(prefix="/api/notification-settings", tags=["notification-settings"])


def _supabase_error(error: Exception) -> HTTPException:
    return HTTPException(
        status_code=502,
        detail={
            "data_status": "supabase_error",
            "message": "Supabase notification_settings query failed.",
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
            "message": "Supabase notification_settings query failed.",
            "error_type": "EmptyResponse",
        },
    )


def _notification_settings_rows(data: object | None) -> list[dict[str, object]]:
    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]
    return []


def _first_notification_settings(data: object | None) -> dict[str, object] | None:
    rows = _notification_settings_rows(data)
    return rows[0] if rows else None


@router.get("")
def list_notification_settings() -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        return {
            "data_status": "supabase_missing",
            "settings": [],
        }

    try:
        response = (
            client.table("notification_settings")
            .select("*")
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    return {
        "data_status": "supabase_connected",
        "settings": _notification_settings_rows(getattr(response, "data", None)),
    }


@router.post("")
def create_notification_settings(
    payload: NotificationSettingsCreate,
) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    settings_payload = payload.model_dump()
    try:
        response = client.table("notification_settings").insert(settings_payload).execute()
    except Exception as error:
        raise _supabase_error(error) from error

    setting = _first_notification_settings(getattr(response, "data", None))
    if setting is None:
        raise _empty_response_error()

    return {
        "data_status": "supabase_connected",
        "setting": setting,
    }


@router.get("/{setting_id}")
def get_notification_settings(setting_id: str) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    try:
        response = (
            client.table("notification_settings")
            .select("*")
            .eq("id", setting_id)
            .limit(1)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    setting = _first_notification_settings(getattr(response, "data", None))
    if setting is None:
        raise HTTPException(status_code=404, detail="Notification settings not found.")

    return {
        "data_status": "supabase_connected",
        "setting": setting,
    }


@router.patch("/{setting_id}")
def update_notification_settings(
    setting_id: str,
    payload: NotificationSettingsUpdate,
) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    update_payload = payload.model_dump(exclude_unset=True)
    if not update_payload:
        raise HTTPException(
            status_code=400,
            detail="No notification settings fields to update.",
        )

    try:
        response = (
            client.table("notification_settings")
            .update(update_payload)
            .eq("id", setting_id)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    setting = _first_notification_settings(getattr(response, "data", None))
    if setting is None:
        raise HTTPException(status_code=404, detail="Notification settings not found.")

    return {
        "data_status": "supabase_connected",
        "setting": setting,
    }


@router.delete("/{setting_id}")
def delete_notification_settings(setting_id: str) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    try:
        lookup_response = (
            client.table("notification_settings")
            .select("id")
            .eq("id", setting_id)
            .limit(1)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    if _first_notification_settings(getattr(lookup_response, "data", None)) is None:
        raise HTTPException(status_code=404, detail="Notification settings not found.")

    try:
        client.table("notification_settings").delete().eq("id", setting_id).execute()
    except Exception as error:
        raise _supabase_error(error) from error

    return {
        "data_status": "supabase_connected",
        "deleted": True,
        "id": setting_id,
    }
