from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.prediction_service import build_prediction_comment
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


def _prediction_comment_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "station_name": "테스트역",
        "display_station_name": "테스트역",
        "business_type": "커피전문점",
        "startup_suitability_score": 72.0,
        "predicted_growth_rate": 42.0,
        "predicted_sales_change_rate": 36.0,
        "floating_demand_index": 66.0,
        "competition_index": 44.0,
        "business_diversity_index": 72.0,
        "feature_payload": {
            "same_business_count_by_type": 3.0,
            "total_store_count": 20.0,
            "nearby_bus_stop_count": 4.0,
            "bus_total_count": 1800.0,
        },
    }
    payload.update(overrides)
    return payload


def test_prediction_simulate_returns_ml_model_status() -> None:
    body = _simulate("시청역", "커피전문점")

    assert body["data_status"] == "ml_model"
    assert body["station_id"] == "GJ-S001"
    assert body["station_name"] == "시청역"
    assert body["display_station_name"] == "시청역"
    assert body["business_type"] == "커피전문점"
    assert 0 <= body["startup_suitability_score"] <= 100
    assert 0 <= body["predicted_growth_rate"] <= 100
    series = body["monthly_sales_series"]
    assert series
    assert series[0] == {
        "label": "-12개월",
        "before_opening_value": series[0]["before_opening_value"],
        "after_opening_value": None,
    }
    assert series[2]["label"] == "개통 시점"
    assert series[2]["before_opening_value"] == series[2]["after_opening_value"]
    assert series[-1]["label"] == "+24개월"
    assert series[-1]["before_opening_value"] is None
    assert body["risk_factors"]
    assert body["strategy_comment"]
    assert body["ai_summary_comment"]
    assert "공공데이터 기반 시나리오" in body["ai_summary_comment"]
    assert "참고용 예측 결과" in body["ai_summary_comment"]
    assert body["evidence_cards"]
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
            body["ai_summary_comment"],
            body["strategy_comment"],
            tuple(body["risk_factors"]),
            tuple(
                (
                    item["title"],
                    item["value"],
                    item["comment"],
                )
                for item in body["evidence_cards"]
            ),
            tuple(
                (
                    item["label"],
                    item["before_opening_value"],
                    item["after_opening_value"],
                )
                for item in body["monthly_sales_series"]
            ),
        )
        for body in [first, second, third]
    }
    assert len(signatures) == 3
    assert first["monthly_sales_series"] != second["monthly_sales_series"]
    assert second["monthly_sales_series"] != third["monthly_sales_series"]
    assert first["ai_summary_comment"] != second["ai_summary_comment"]
    assert second["strategy_comment"] != third["strategy_comment"]


def test_prediction_comment_warns_when_competition_is_high() -> None:
    comments = build_prediction_comment(
        _prediction_comment_payload(
            predicted_growth_rate=48.0,
            competition_index=76.0,
        ),
    )

    combined = " ".join(
        [
            *comments["risk_factors"],
            comments["strategy_comment"],
            comments["ai_summary_comment"],
        ],
    )
    assert "경쟁 주의" in combined


def test_prediction_comment_high_demand_has_positive_demand_comment() -> None:
    comments = build_prediction_comment(
        _prediction_comment_payload(
            floating_demand_index=84.0,
            competition_index=38.0,
        ),
    )

    combined = " ".join(
        [
            *comments["risk_factors"],
            comments["strategy_comment"],
            comments["ai_summary_comment"],
            *[card["comment"] for card in comments["evidence_cards"]],
        ],
    )
    assert "잠재 유동수요가 높" in combined


def test_prediction_comment_fallback_still_works() -> None:
    comments = build_prediction_comment({})

    assert comments["risk_factors"]
    assert comments["strategy_comment"]
    assert comments["ai_summary_comment"]
    assert comments["evidence_cards"]
    assert "선택 역세권" in comments["ai_summary_comment"]


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
