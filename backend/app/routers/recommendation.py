"""Recommendation endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Query

from backend.app.services.feature_service import get_station_recommendations

router = APIRouter(prefix="/api", tags=["recommendation"])


@router.get("/recommendations")
def recommendations(limit: int = Query(default=5, ge=1, le=20)) -> dict[str, object]:
    return {
        "items": get_station_recommendations(limit=limit),
        "data_status": "sample_fixture",
        "message": "현재 추천은 샘플 데이터와 규칙 기반 점수로 제공됩니다.",
    }
