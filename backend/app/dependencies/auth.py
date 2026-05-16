"""Optional Supabase Auth verification helpers."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, Request

from backend.app.services.supabase_service import get_supabase_client


@dataclass(frozen=True)
class AuthUser:
    id: str
    email: str | None = None


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    scheme, separator, token = authorization.strip().partition(" ")
    if scheme.lower() != "bearer":
        return None
    if not separator or not token.strip():
        raise HTTPException(status_code=401, detail="Invalid authentication token.")

    return token.strip()


def _read_field(value: Any, field: str) -> object | None:
    if isinstance(value, dict):
        return value.get(field)
    return getattr(value, field, None)


def _extract_user_from_response(response: object) -> AuthUser:
    user = _read_field(response, "user")
    if user is None:
        data = _read_field(response, "data")
        user = _read_field(data, "user") if data is not None else None

    user_id = _read_field(user, "id")
    if not isinstance(user_id, str) or not user_id:
        raise ValueError("Supabase Auth response did not include a user id.")

    email = _read_field(user, "email")
    return AuthUser(id=user_id, email=email if isinstance(email, str) else None)


def get_optional_current_user(request: Request) -> AuthUser | None:
    token = _extract_bearer_token(request.headers.get("Authorization"))
    if token is None:
        return None

    client = get_supabase_client()
    if client is None:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")

    try:
        response = client.auth.get_user(token)
        return _extract_user_from_response(response)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        ) from error


def resolve_user_id(
    auth_user: AuthUser | None,
    requested_user_id: str | None,
) -> str | None:
    if auth_user is not None:
        return auth_user.id
    return requested_user_id
