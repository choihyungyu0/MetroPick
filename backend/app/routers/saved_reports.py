"""Saved report persistence endpoints backed by Supabase."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.schemas import SavedReportCreate, SavedReportUpdate
from backend.app.services.supabase_service import get_supabase_client

router = APIRouter(prefix="/api/saved-reports", tags=["saved-reports"])


def _supabase_error(error: Exception) -> HTTPException:
    return HTTPException(
        status_code=502,
        detail={
            "data_status": "supabase_error",
            "message": "Supabase saved_reports query failed.",
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
            "message": "Supabase saved_reports query failed.",
            "error_type": "EmptyResponse",
        },
    )


def _saved_report_rows(data: object | None) -> list[dict[str, object]]:
    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]
    return []


def _first_saved_report(data: object | None) -> dict[str, object] | None:
    rows = _saved_report_rows(data)
    return rows[0] if rows else None


@router.get("")
def list_saved_reports() -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        return {
            "data_status": "supabase_missing",
            "reports": [],
        }

    try:
        response = (
            client.table("saved_reports")
            .select("*")
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    return {
        "data_status": "supabase_connected",
        "reports": _saved_report_rows(getattr(response, "data", None)),
    }


@router.post("")
def create_saved_report(payload: SavedReportCreate) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    report_payload = payload.model_dump()
    try:
        response = client.table("saved_reports").insert(report_payload).execute()
    except Exception as error:
        raise _supabase_error(error) from error

    report = _first_saved_report(getattr(response, "data", None))
    if report is None:
        raise _empty_response_error()

    return {
        "data_status": "supabase_connected",
        "report": report,
    }


@router.get("/{report_id}")
def get_saved_report(report_id: str) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    try:
        response = (
            client.table("saved_reports")
            .select("*")
            .eq("id", report_id)
            .limit(1)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    report = _first_saved_report(getattr(response, "data", None))
    if report is None:
        raise HTTPException(status_code=404, detail="Saved report not found.")

    return {
        "data_status": "supabase_connected",
        "report": report,
    }


@router.patch("/{report_id}")
def update_saved_report(
    report_id: str,
    payload: SavedReportUpdate,
) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    update_payload = payload.model_dump(exclude_unset=True)
    if not update_payload:
        raise HTTPException(status_code=400, detail="No saved report fields to update.")

    try:
        response = (
            client.table("saved_reports")
            .update(update_payload)
            .eq("id", report_id)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    report = _first_saved_report(getattr(response, "data", None))
    if report is None:
        raise HTTPException(status_code=404, detail="Saved report not found.")

    return {
        "data_status": "supabase_connected",
        "report": report,
    }


@router.delete("/{report_id}")
def delete_saved_report(report_id: str) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    try:
        lookup_response = (
            client.table("saved_reports")
            .select("id")
            .eq("id", report_id)
            .limit(1)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    if _first_saved_report(getattr(lookup_response, "data", None)) is None:
        raise HTTPException(status_code=404, detail="Saved report not found.")

    try:
        client.table("saved_reports").delete().eq("id", report_id).execute()
    except Exception as error:
        raise _supabase_error(error) from error

    return {
        "data_status": "supabase_connected",
        "deleted": True,
        "id": report_id,
    }
