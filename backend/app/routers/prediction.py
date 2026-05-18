"""Prediction endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.schemas import (
    PredictionSimulationInput,
    StartupSuitabilityInput,
    StartupSuitabilityResponse,
)
from backend.app.services.prediction_service import (
    PredictionStationNotFoundError,
    get_startup_suitability_prediction,
    simulate_prediction,
)

router = APIRouter(prefix="/api/prediction", tags=["prediction"])


@router.post("/startup-suitability", response_model=StartupSuitabilityResponse)
def predict_startup_suitability_endpoint(payload: StartupSuitabilityInput) -> dict[str, object]:
    return get_startup_suitability_prediction(payload.to_feature_dict())


@router.post("/simulate")
def simulate_prediction_endpoint(payload: PredictionSimulationInput) -> dict[str, object]:
    try:
        return simulate_prediction(
            station_id=payload.station_id,
            station_name=payload.station_name,
            display_station_name=payload.display_station_name,
            business_type=payload.business_type,
            scenario=payload.scenario,
            radius_m=payload.radius_m,
        )
    except PredictionStationNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
