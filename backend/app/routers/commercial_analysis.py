"""Commercial-analysis endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from backend.app.services.feature_service import (
    get_commercial_analysis_summary,
    get_commercial_analysis_map_data,
    get_store_summary,
)

router = APIRouter(prefix="/api/commercial-analysis", tags=["commercial-analysis"])


@router.get("/summary")
def commercial_analysis_summary() -> dict[str, object]:
    return get_commercial_analysis_summary()


@router.get("/store-summary")
def commercial_analysis_store_summary(radius_m: int = 500) -> dict[str, object]:
    return get_store_summary(radius_m=radius_m)


@router.get("/map-data")
def commercial_analysis_map_data(
    region: str | None = None,
    line: str | None = None,
    station_ids: str | None = None,
    radius_m: int = 500,
    business_type: str | None = None,
    layers: str | None = None,
) -> dict[str, object]:
    return get_commercial_analysis_map_data(
        region=region,
        line=line,
        station_ids=station_ids,
        radius_m=radius_m,
        business_type=business_type,
        layers=layers,
    )
