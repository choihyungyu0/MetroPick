from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app
from ml import config


def _simulate(station_name: str, business_type: str) -> dict[str, object]:
    response = TestClient(app).post(
        "/api/prediction/simulate",
        json={
            "station_name": station_name,
            "business_type": business_type,
            "scenario": "광주 2호선 2단계 개통 - 2026년 예정",
            "radius_m": 500,
        },
    )

    assert response.status_code == 200
    return response.json()


def test_prediction_simulate_returns_ml_model_status() -> None:
    body = _simulate("시청역", "커피전문점")

    assert body["data_status"] == "ml_model"
    assert body["station_name"] == "시청역"
    assert body["display_station_name"] == "시청역"
    assert body["business_type"] == "커피전문점"
    assert 0 <= body["startup_suitability_score"] <= 100
    assert 0 <= body["predicted_growth_rate"] <= 100
    assert body["risk_factors"]
    assert body["strategy_comment"]
    assert body["confidence_metrics"]


def test_prediction_simulate_changes_for_station_and_business_inputs() -> None:
    first = _simulate("시청역", "커피전문점")
    second = _simulate("백운광장역", "음식점")
    third = _simulate("첨단역", "편의점")

    assert third["station_name"] == "첨단지구역"
    signatures = {
        (
            body["station_name"],
            body["business_type"],
            body["startup_suitability_score"],
            body["predicted_growth_rate"],
            body["competition_index"],
        )
        for body in [first, second, third]
    }
    assert len(signatures) == 3


def test_prediction_simulate_invalid_station_returns_404() -> None:
    response = TestClient(app).post(
        "/api/prediction/simulate",
        json={"station_name": "없는역", "business_type": "커피전문점"},
    )

    assert response.status_code == 404
    assert "Station not found" in response.json()["detail"]


def test_prediction_simulate_missing_model_returns_model_missing(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr(
        config,
        "STARTUP_SUITABILITY_MODEL_PATH",
        tmp_path / "missing_model.joblib",
    )

    body = _simulate("시청역", "커피전문점")

    assert body["data_status"] == "model_missing"
    assert 0 <= body["startup_suitability_score"] <= 100
