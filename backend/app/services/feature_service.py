"""Feature and summary services backed by sample CSV fixtures."""

from __future__ import annotations

import pandas as pd

from ml import config
from ml.data_loader import load_sample_raw_data
from ml.feature_engineering import build_station_area_features


def _load_or_build_features() -> pd.DataFrame:
    if config.STATION_AREA_FEATURES_PATH.exists():
        return pd.read_csv(config.STATION_AREA_FEATURES_PATH)

    raw_data = load_sample_raw_data()
    return build_station_area_features(
        raw_data.stores,
        raw_data.bus,
        raw_data.subway,
        raw_data.stations,
        radius_m=config.DEFAULT_RADIUS_M,
    )


def _recommendation_label(score: float) -> str:
    if score >= 75:
        return "우선 검토"
    if score >= 55:
        return "추가 검토"
    return "보수적 검토"


def get_commercial_analysis_summary() -> dict[str, object]:
    features = _load_or_build_features()
    if features.empty:
        return {
            "station_count": 0,
            "average_startup_suitability_score": 0.0,
            "top_station": None,
            "message": "샘플 데이터에서 생성된 상권 요약이 없습니다.",
        }

    top_row = features.sort_values("startup_suitability_score", ascending=False).iloc[0]
    return {
        "station_count": int(len(features)),
        "average_startup_suitability_score": round(float(features["startup_suitability_score"].mean()), 2),
        "average_floating_demand_index": round(float(features["floating_demand_index"].mean()), 2),
        "average_competition_index": round(float(features["competition_index"].mean()), 2),
        "top_station": {
            "station_id": str(top_row["station_id"]),
            "station_name": str(top_row["station_name"]),
            "startup_suitability_score": round(float(top_row["startup_suitability_score"]), 2),
        },
        "data_status": "sample_fixture",
        "message": "현재 요약은 샘플 CSV와 규칙 기반 점수로 생성되었습니다.",
    }


def get_station_recommendations(limit: int = 5) -> list[dict[str, object]]:
    features = _load_or_build_features()
    if features.empty:
        return []

    recommendations: list[dict[str, object]] = []
    for _, row in features.sort_values("startup_suitability_score", ascending=False).head(limit).iterrows():
        score = round(float(row["startup_suitability_score"]), 2)
        recommendations.append(
            {
                "station_id": str(row["station_id"]),
                "station_name": str(row["station_name"]),
                "recommendation_label": _recommendation_label(score),
                "startup_suitability_score": score,
                "floating_demand_index": round(float(row["floating_demand_index"]), 2),
                "competition_index": round(float(row["competition_index"]), 2),
                "business_diversity_index": round(float(row["business_diversity_index"]), 2),
                "data_status": "sample_fixture",
            }
        )
    return recommendations
