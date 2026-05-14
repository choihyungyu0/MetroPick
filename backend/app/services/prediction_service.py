"""Prediction service wrapper for the MVP ML scaffold."""

from __future__ import annotations

from ml.predict import predict_startup_suitability


def get_startup_suitability_prediction(input_features: dict[str, object]) -> dict[str, object]:
    return predict_startup_suitability(input_features)
