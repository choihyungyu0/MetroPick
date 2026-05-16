"""Prediction result persistence endpoints backed by Supabase."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from backend.app.dependencies.auth import AuthUser, get_optional_current_user, resolve_user_id
from backend.app.schemas import PredictionResultCreate, PredictionResultUpdate
from backend.app.services.supabase_service import get_supabase_client

router = APIRouter(prefix="/api/prediction-results", tags=["prediction-results"])


def _supabase_error(error: Exception) -> HTTPException:
    return HTTPException(
        status_code=502,
        detail={
            "data_status": "supabase_error",
            "message": "Supabase prediction_results query failed.",
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
            "message": "Supabase prediction_results query failed.",
            "error_type": "EmptyResponse",
        },
    )


def _prediction_result_rows(data: object | None) -> list[dict[str, object]]:
    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]
    return []


def _first_prediction_result(data: object | None) -> dict[str, object] | None:
    rows = _prediction_result_rows(data)
    return rows[0] if rows else None


@router.get("")
def list_prediction_results(
    user_id: str | None = None,
    auth_user: AuthUser | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        return {
            "data_status": "supabase_missing",
            "results": [],
        }

    try:
        query = client.table("prediction_results").select("*")
        resolved_user_id = resolve_user_id(auth_user, user_id)
        if resolved_user_id:
            query = query.eq("user_id", resolved_user_id)
        response = query.order("created_at", desc=True).limit(50).execute()
    except Exception as error:
        raise _supabase_error(error) from error

    return {
        "data_status": "supabase_connected",
        "results": _prediction_result_rows(getattr(response, "data", None)),
    }


@router.post("")
def create_prediction_result(
    payload: PredictionResultCreate,
    auth_user: AuthUser | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    result_payload = payload.model_dump()
    result_payload["user_id"] = resolve_user_id(auth_user, payload.user_id)
    try:
        response = client.table("prediction_results").insert(result_payload).execute()
    except Exception as error:
        raise _supabase_error(error) from error

    result = _first_prediction_result(getattr(response, "data", None))
    if result is None:
        raise _empty_response_error()

    return {
        "data_status": "supabase_connected",
        "result": result,
    }


@router.get("/{result_id}")
def get_prediction_result(result_id: str) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    try:
        response = (
            client.table("prediction_results")
            .select("*")
            .eq("id", result_id)
            .limit(1)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    result = _first_prediction_result(getattr(response, "data", None))
    if result is None:
        raise HTTPException(status_code=404, detail="Prediction result not found.")

    return {
        "data_status": "supabase_connected",
        "result": result,
    }


@router.patch("/{result_id}")
def update_prediction_result(
    result_id: str,
    payload: PredictionResultUpdate,
) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    update_payload = payload.model_dump(exclude_unset=True)
    if not update_payload:
        raise HTTPException(status_code=400, detail="No prediction result fields to update.")

    try:
        response = (
            client.table("prediction_results")
            .update(update_payload)
            .eq("id", result_id)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    result = _first_prediction_result(getattr(response, "data", None))
    if result is None:
        raise HTTPException(status_code=404, detail="Prediction result not found.")

    return {
        "data_status": "supabase_connected",
        "result": result,
    }


@router.delete("/{result_id}")
def delete_prediction_result(result_id: str) -> dict[str, object]:
    client = get_supabase_client()
    if client is None:
        raise _missing_supabase_error()

    try:
        lookup_response = (
            client.table("prediction_results")
            .select("id")
            .eq("id", result_id)
            .limit(1)
            .execute()
        )
    except Exception as error:
        raise _supabase_error(error) from error

    if _first_prediction_result(getattr(lookup_response, "data", None)) is None:
        raise HTTPException(status_code=404, detail="Prediction result not found.")

    try:
        client.table("prediction_results").delete().eq("id", result_id).execute()
    except Exception as error:
        raise _supabase_error(error) from error

    return {
        "data_status": "supabase_connected",
        "deleted": True,
        "id": result_id,
    }
