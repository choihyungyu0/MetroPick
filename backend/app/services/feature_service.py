"""Feature and summary services backed by sample or local public CSV data."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from ml import config
from ml.data_loader import load_sample_raw_data
from ml.feature_engineering import build_station_area_features
from ml.public_store_ingestion import (
    filter_gwangju_stores,
    filter_valid_coordinates,
    load_public_store_csv,
    normalize_public_store_columns,
)
from ml.station_area_store_summary import build_station_area_store_summary


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


def _find_first_public_store_csv() -> Path | None:
    if not config.PUBLIC_STORE_RAW_DIR.exists():
        return None

    csv_files = sorted(config.PUBLIC_STORE_RAW_DIR.glob("*.csv"))
    return csv_files[0] if csv_files else None


def _summary_source_mode(summary: pd.DataFrame, default: str = "sample_fixture") -> str:
    if "source_mode" not in summary.columns or summary["source_mode"].dropna().empty:
        return default

    source_mode = str(summary["source_mode"].dropna().iloc[0])
    if source_mode in {"public_store_csv", "sample_fixture"}:
        return source_mode
    return default


def _build_store_summary_from_source() -> tuple[pd.DataFrame, str]:
    raw_data = load_sample_raw_data()
    public_csv_path = _find_first_public_store_csv()

    if public_csv_path is None:
        stores_df = raw_data.stores
        source_mode = "sample_fixture"
    else:
        raw_public_stores = load_public_store_csv(public_csv_path)
        normalized_stores = normalize_public_store_columns(raw_public_stores)
        stores_df = filter_valid_coordinates(filter_gwangju_stores(normalized_stores))
        source_mode = "public_store_csv"

    summary = build_station_area_store_summary(
        stores_df,
        raw_data.stations,
        radius_m=config.DEFAULT_RADIUS_M,
    )
    summary["source_mode"] = source_mode
    return summary, source_mode


def _load_or_build_store_summary() -> tuple[pd.DataFrame, str]:
    if config.PUBLIC_STORE_SUMMARY_PATH.exists():
        summary = pd.read_csv(config.PUBLIC_STORE_SUMMARY_PATH)
        return summary, _summary_source_mode(summary, default="public_store_csv")

    return _build_store_summary_from_source()


def _rows_for_radius(
    summary: pd.DataFrame,
    radius_m: int = config.DEFAULT_RADIUS_M,
) -> pd.DataFrame:
    if summary.empty or "radius_m" not in summary.columns:
        return summary

    radius_rows = summary[pd.to_numeric(summary["radius_m"], errors="coerce") == radius_m]
    if radius_rows.empty:
        return summary
    return radius_rows


def _data_source_message(source_mode: str) -> str:
    if source_mode == "public_store_csv":
        return (
            "\uc18c\uc0c1\uacf5\uc778\uc2dc\uc7a5\uc9c4\ud765\uacf5\ub2e8 "
            "\uc0c1\uac00(\uc0c1\uad8c)\uc815\ubcf4 \ub85c\uceec CSV "
            "\uae30\ubc18 \uc694\uc57d\uc785\ub2c8\ub2e4."
        )
    return (
        "\uc0d8\ud50c fixture \uae30\ubc18 \uc0c1\uad8c "
        "\uc694\uc57d\uc785\ub2c8\ub2e4. \uc2e4\uc81c CSV\uac00 "
        "\uc5c6\uc73c\uba74 fallback\uc744 \uc0ac\uc6a9\ud569\ub2c8\ub2e4."
    )


def _recommendation_label(score: float) -> str:
    if score >= 75:
        return "\uc6b0\uc120 \uac80\ud1a0"
    if score >= 55:
        return "\ucd94\uac00 \uac80\ud1a0"
    return "\ubcf4\uc218\uc801 \uac80\ud1a0"


def _commercial_summary_from_store_summary(
    summary: pd.DataFrame,
    source_mode: str,
) -> dict[str, object]:
    radius_rows = _rows_for_radius(summary)
    if radius_rows.empty:
        return {
            "station_count": 0,
            "average_startup_suitability_score": 0.0,
            "average_floating_demand_index": 0.0,
            "average_competition_index": 0.0,
            "top_station": None,
            "data_status": source_mode,
            "message": _data_source_message(source_mode),
        }

    top_row = radius_rows.sort_values("total_store_count", ascending=False).iloc[0]
    features = _load_or_build_features()
    startup_score_by_station: dict[str, float] = {}
    if not features.empty and {"station_id", "startup_suitability_score"}.issubset(features.columns):
        startup_score_by_station = {
            str(row["station_id"]): float(row["startup_suitability_score"])
            for _, row in features.iterrows()
        }

    average_startup_score = (
        round(float(features["startup_suitability_score"].mean()), 2)
        if not features.empty and "startup_suitability_score" in features.columns
        else round(float(radius_rows["business_diversity_index"].mean()), 2)
    )
    average_floating_demand = (
        round(float(features["floating_demand_index"].mean()), 2)
        if not features.empty and "floating_demand_index" in features.columns
        else 0.0
    )
    top_station_id = str(top_row["station_id"])
    top_startup_score = startup_score_by_station.get(
        top_station_id,
        float(top_row["business_diversity_index"]),
    )

    return {
        "station_count": int(radius_rows["station_id"].nunique()),
        "average_startup_suitability_score": average_startup_score,
        "average_business_diversity_index": round(
            float(radius_rows["business_diversity_index"].mean()),
            2,
        ),
        "average_floating_demand_index": average_floating_demand,
        "average_competition_index": round(float(radius_rows["competition_index"].mean()), 2),
        "top_station": {
            "station_id": top_station_id,
            "station_name": str(top_row["station_name"]),
            "startup_suitability_score": round(top_startup_score, 2),
            "total_store_count": int(top_row["total_store_count"]),
            "business_diversity_index": round(float(top_row["business_diversity_index"]), 2),
        },
        "data_status": source_mode,
        "message": _data_source_message(source_mode),
    }


def get_commercial_analysis_summary() -> dict[str, object]:
    if config.PUBLIC_STORE_SUMMARY_PATH.exists() or _find_first_public_store_csv() is not None:
        summary, source_mode = _load_or_build_store_summary()
        return _commercial_summary_from_store_summary(summary, source_mode)

    features = _load_or_build_features()
    if features.empty:
        return {
            "station_count": 0,
            "average_startup_suitability_score": 0.0,
            "average_floating_demand_index": 0.0,
            "average_competition_index": 0.0,
            "top_station": None,
            "data_status": "sample_fixture",
            "message": (
                "\uc0d8\ud50c \ub370\uc774\ud130\uc5d0\uc11c "
                "\uc0dd\uc131\ub41c \uc0c1\uad8c \uc694\uc57d\uc774 "
                "\uc5c6\uc2b5\ub2c8\ub2e4."
            ),
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
        "message": _data_source_message("sample_fixture"),
    }


def get_store_summary(radius_m: int = config.DEFAULT_RADIUS_M) -> dict[str, object]:
    summary, source_mode = _load_or_build_store_summary()
    radius_rows = _rows_for_radius(summary, radius_m=radius_m)
    if radius_rows.empty:
        return {
            "data_status": source_mode,
            "radius_m": radius_m,
            "station_count": 0,
            "top_stations": [],
            "rows": [],
            "message": _data_source_message(source_mode),
        }

    cleaned_rows = radius_rows.drop(columns=["source_mode"], errors="ignore").copy()
    top_rows = cleaned_rows.sort_values("total_store_count", ascending=False).head(5)
    return {
        "data_status": source_mode,
        "radius_m": radius_m,
        "station_count": int(cleaned_rows["station_id"].nunique()),
        "top_stations": top_rows[
            [
                "station_id",
                "station_name",
                "total_store_count",
                "competition_index",
                "business_diversity_index",
            ]
        ].to_dict(orient="records"),
        "rows": cleaned_rows.to_dict(orient="records"),
        "message": _data_source_message(source_mode),
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
