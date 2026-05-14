"""Prediction endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from backend.app.schemas import StartupSuitabilityInput, StartupSuitabilityResponse
from backend.app.services.prediction_service import get_startup_suitability_prediction

router = APIRouter(prefix="/api/prediction", tags=["prediction"])


@router.post("/startup-suitability", response_model=StartupSuitabilityResponse)
def predict_startup_suitability_endpoint(payload: StartupSuitabilityInput) -> dict[str, object]:
    return get_startup_suitability_prediction(payload.to_feature_dict())
