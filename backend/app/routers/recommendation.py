"""Recommendation endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Query

from backend.app.services.feature_service import get_station_recommendations_payload

router = APIRouter(prefix="/api", tags=["recommendation"])


@router.get("/recommendations")
def recommendations(limit: int = Query(default=5, ge=1, le=20)) -> dict[str, object]:
    return get_station_recommendations_payload(limit=limit)
