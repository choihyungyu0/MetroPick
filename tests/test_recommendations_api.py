from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.main import app
from ml import config


def _write_features_csv(path: Path) -> None:
    path.write_text(
        "\n".join(
            [
                (
                    "station_id,station_name,startup_suitability_score,"
                    "floating_demand_index,competition_index,business_diversity_index"
                ),
                "GJ-T001,서구테스트역,91.5,81.25,21.25,64.75",
            ]
        ),
        encoding="utf-8",
    )


def _write_recommendation_csv(path: Path, rows: list[str]) -> None:
    path.write_text(
        "\n".join(
            [
                (
                    "rank,station_name,district,recommended_business_type,"
                    "startup_suitability_score,growth_score,risk_level,"
                    "main_reason,risk_reason,strategy_comment"
                ),
                *rows,
            ]
        ),
        encoding="utf-8",
    )


def test_recommendations_use_csv_when_available(monkeypatch, tmp_path) -> None:
    recommendations_path = tmp_path / "recommendation_top5.csv"
    features_path = tmp_path / "station_area_features.csv"
    _write_features_csv(features_path)
    _write_recommendation_csv(
        recommendations_path,
        [
            (
                "1,서구테스트역,서구,카페/디저트,88.5,77.25,낮음,"
                "상권 다양성 지수 0.82로 성장 여지가 있습니다.,"
                "경쟁 위험이 낮습니다.,테이크아웃 중심 운영이 적합합니다."
            ),
        ],
    )
    monkeypatch.setattr(config, "RECOMMENDATION_TOP5_PATH", recommendations_path)
    monkeypatch.setattr(config, "STATION_AREA_FEATURES_PATH", features_path)

    response = TestClient(app).get("/api/recommendations?limit=5")

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "recommendation_csv"
    assert body["message"] == "로컬 추천 Top 5 CSV 기반 결과입니다."
    assert body["items"][0] == {
        "rank": 1,
        "station_id": "GJ-T001",
        "station_name": "서구테스트역",
        "district": "서구",
        "recommended_business_type": "카페/디저트",
        "startup_suitability_score": 88.5,
        "growth_score": 77.25,
        "risk_level": "낮음",
        "main_reason": "상권 다양성 지수 0.82로 성장 여지가 있습니다.",
        "risk_reason": "경쟁 위험이 낮습니다.",
        "strategy_comment": "테이크아웃 중심 운영이 적합합니다.",
        "recommendation_label": "우선 검토",
        "floating_demand_index": 77.25,
        "competition_index": 21.25,
        "business_diversity_index": 64.75,
        "data_status": "recommendation_csv",
    }


def test_recommendations_fall_back_when_csv_is_missing(monkeypatch, tmp_path) -> None:
    features_path = tmp_path / "station_area_features.csv"
    _write_features_csv(features_path)
    monkeypatch.setattr(config, "RECOMMENDATION_TOP5_PATH", tmp_path / "missing.csv")
    monkeypatch.setattr(config, "STATION_AREA_FEATURES_PATH", features_path)

    response = TestClient(app).get("/api/recommendations?limit=5")

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "sample_fixture"
    assert body["items"][0]["data_status"] == "sample_fixture"
    assert body["items"][0]["station_name"] == "서구테스트역"


def test_recommendations_csv_limit_parameter(monkeypatch, tmp_path) -> None:
    recommendations_path = tmp_path / "recommendation_top5.csv"
    features_path = tmp_path / "station_area_features.csv"
    _write_features_csv(features_path)
    _write_recommendation_csv(
        recommendations_path,
        [
            (
                "1,첫번째역,동구,음식점,72.1,67.5,보통,"
                "상권 다양성 지수 0.76로 성장 여지가 있습니다.,"
                "경쟁은 보통입니다.,점심 수요 중심 전략이 적합합니다."
            ),
            (
                "2,두번째역,남구,카페/디저트,68.2,61.4,낮음,"
                "상권 다양성 지수 0.81로 성장 여지가 있습니다.,"
                "경쟁 위험이 낮습니다.,소형 매장 전략이 적합합니다."
            ),
            (
                "3,세번째역,북구,소매,63.3,58.2,높음,"
                "상권 다양성 지수 0.70로 성장 여지가 있습니다.,"
                "경쟁 위험이 높습니다.,차별화 전략이 필요합니다."
            ),
        ],
    )
    monkeypatch.setattr(config, "RECOMMENDATION_TOP5_PATH", recommendations_path)
    monkeypatch.setattr(config, "STATION_AREA_FEATURES_PATH", features_path)

    response = TestClient(app).get("/api/recommendations?limit=2")

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "recommendation_csv"
    assert [item["station_name"] for item in body["items"]] == ["첫번째역", "두번째역"]
