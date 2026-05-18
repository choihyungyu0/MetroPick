from __future__ import annotations

from pathlib import Path

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


def _write_prediction_features_csv(path: Path) -> None:
    path.write_text(
        "\n".join(
            [
                (
                    "station_id,station_name,radius_m,total_store_count,"
                    "same_business_count_by_type,cafe_count,restaurant_count,"
                    "convenience_count,pharmacy_count,beauty_count,academy_count,"
                    "retail_count,business_type_count,business_diversity_index,"
                    "bus_boarding_count,bus_alighting_count,bus_total_count,"
                    "nearby_bus_stop_count,subway_pattern_score,competition_index,"
                    "floating_demand_index,sales_potential_index,closure_risk_index,"
                    "startup_suitability_score"
                ),
                (
                    "GJ-S001,시청역,500,6,1,1,2,1,1,1,0,2,6,100.0,"
                    "661,677,1338,3,41.92,82.5,53.56,60.28,56.99,34.0"
                ),
            ]
        ),
        encoding="utf-8",
    )


def _write_prediction_recommendations_csv(path: Path) -> None:
    path.write_text(
        "\n".join(
            [
                (
                    "rank,station_name,district,recommended_business_type,"
                    "startup_suitability_score,growth_score,risk_level,"
                    "main_reason,risk_reason,strategy_comment"
                ),
                (
                    "1,2호선_215,서남동,음식점,72.78,79.15,보통,"
                    "상권 다양성 지수 0.76로 성장 여지가 있습니다.,"
                    "상권 규모가 있는 편입니다.,점심 수요 중심 전략이 적합합니다."
                ),
            ]
        ),
        encoding="utf-8",
    )


def _write_line2_coordinates_csv(path: Path) -> None:
    path.write_text(
        "\n".join(
            [
                "역번호,위도,경도,행정동",
                "215,35.144429,126.926185,서남동",
            ]
        ),
        encoding="utf-8",
    )


def test_prediction_simulate_returns_ml_model_status() -> None:
    body = _simulate("시청역", "커피전문점")

    assert body["data_status"] == "ml_model"
    assert body["station_id"] == "GJ-S001"
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


def test_prediction_simulate_accepts_line2_internal_and_display_names(
    monkeypatch,
    tmp_path,
) -> None:
    features_path = tmp_path / "station_area_features.csv"
    recommendations_path = tmp_path / "recommendation_top5.csv"
    coordinates_path = tmp_path / "line2_coordinates.csv"
    _write_prediction_features_csv(features_path)
    _write_prediction_recommendations_csv(recommendations_path)
    _write_line2_coordinates_csv(coordinates_path)
    monkeypatch.setattr(config, "STATION_AREA_FEATURES_PATH", features_path)
    monkeypatch.setattr(config, "RECOMMENDATION_TOP5_PATH", recommendations_path)
    monkeypatch.setattr(config, "LINE2_STATION_COORDINATES_PATH", coordinates_path)

    cases = [
        {"station_id": "2호선_215"},
        {"station_name": "2호선_215"},
        {"station_name": "서남동 예정역"},
        {"display_station_name": "서남동 예정역"},
    ]

    for station_payload in cases:
        response = TestClient(app).post(
            "/api/prediction/simulate",
            json={
                **station_payload,
                "business_type": "커피전문점",
                "scenario": "광주 2호선 2단계 개통 - 2026년 예정",
                "radius_m": 500,
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["station_id"] == "2호선_215"
        assert body["station_name"] == "2호선_215"
        assert body["display_station_name"] == "서남동 예정역"
        assert body["data_status"] == "ml_model"
        assert 0 <= body["startup_suitability_score"] <= 100


def test_prediction_simulate_invalid_station_returns_404() -> None:
    response = TestClient(app).post(
        "/api/prediction/simulate",
        json={"station_name": "없는역", "business_type": "커피전문점"},
    )

    assert response.status_code == 404
    detail = response.json()["detail"]
    assert "Station not found" in detail
    assert "Available candidates include" in detail


def test_prediction_simulate_missing_model_returns_model_missing(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr(
        config,
        "STARTUP_SUITABILITY_MODEL_PATH",
        tmp_path / "missing_model.joblib",
    )

    body = _simulate("시청역", "커피전문점")

    assert body["data_status"] == "model_missing"
    assert 0 <= body["startup_suitability_score"] <= 100
