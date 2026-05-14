"""Commercial-analysis endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from backend.app.services.feature_service import get_commercial_analysis_summary

router = APIRouter(prefix="/api/commercial-analysis", tags=["commercial-analysis"])


@router.get("/summary")
def commercial_analysis_summary() -> dict[str, object]:
    return get_commercial_analysis_summary()
