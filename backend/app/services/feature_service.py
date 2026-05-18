"""Feature and summary services backed by sample or local public CSV data."""

from __future__ import annotations

import re
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

    csv_files = sorted(
        path
        for path in config.PUBLIC_STORE_RAW_DIR.glob("*.csv")
        if path.name != config.PUBLIC_STORE_TEMPLATE_FILENAME
    )
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
    if source_mode == "recommendation_csv":
        return "로컬 추천 Top 5 CSV 기반 결과입니다."
    return (
        "\uc0d8\ud50c fixture \uae30\ubc18 \uc0c1\uad8c "
        "\uc694\uc57d\uc785\ub2c8\ub2e4. \uc2e4\uc81c CSV\uac00 "
        "\uc5c6\uc73c\uba74 fallback\uc744 \uc0ac\uc6a9\ud569\ub2c8\ub2e4."
    )


def _recommendation_data_source_message(source_mode: str) -> str:
    if source_mode == "recommendation_csv":
        return _data_source_message(source_mode)
    return "현재 추천은 샘플 데이터와 규칙 기반 점수로 제공됩니다."


def _recommendation_label(score: float) -> str:
    if score >= 75:
        return "\uc6b0\uc120 \uac80\ud1a0"
    if score >= 55:
        return "\ucd94\uac00 \uac80\ud1a0"
    return "\ubcf4\uc218\uc801 \uac80\ud1a0"


RECOMMENDATION_REQUIRED_COLUMNS = {
    "rank",
    "station_name",
    "district",
    "recommended_business_type",
    "startup_suitability_score",
    "growth_score",
    "risk_level",
    "main_reason",
    "risk_reason",
    "strategy_comment",
}
INTERNAL_LINE2_STATION_PATTERN = re.compile(r"^2호선_(\d+)$")


def _is_missing(value: object) -> bool:
    if value is None:
        return True

    try:
        return bool(pd.isna(value))
    except (TypeError, ValueError):
        return False


def _clean_string(value: object) -> str:
    if _is_missing(value):
        return ""
    return str(value).strip()


def _safe_float(value: object) -> float | None:
    if _is_missing(value):
        return None

    try:
        return float(str(value).replace(",", ""))
    except ValueError:
        return None


def _safe_int(value: object) -> int | None:
    number = _safe_float(value)
    if number is None:
        return None
    return int(number)


def _round_score(value: float) -> float:
    return round(max(0.0, min(100.0, value)), 2)


def _feature_lookups(
    features: pd.DataFrame,
) -> tuple[dict[str, pd.Series], dict[str, pd.Series]]:
    by_station_id: dict[str, pd.Series] = {}
    by_station_name: dict[str, pd.Series] = {}

    if features.empty:
        return by_station_id, by_station_name

    for _, row in features.iterrows():
        station_id = _clean_string(row.get("station_id"))
        station_name = _clean_string(row.get("station_name"))
        if station_id:
            by_station_id[station_id] = row
        if station_name:
            by_station_name[station_name] = row

    return by_station_id, by_station_name


def _feature_float(feature: pd.Series | None, column: str) -> float | None:
    if feature is None or column not in feature:
        return None
    return _safe_float(feature[column])


def _feature_string(feature: pd.Series | None, column: str) -> str:
    if feature is None or column not in feature:
        return ""
    return _clean_string(feature[column])


def _load_line2_station_display_names() -> dict[str, str]:
    if not config.LINE2_STATION_COORDINATES_PATH.exists():
        return {}

    try:
        coordinates = pd.read_csv(config.LINE2_STATION_COORDINATES_PATH)
    except (OSError, pd.errors.ParserError, UnicodeDecodeError):
        return {}

    if coordinates.empty or not {"역번호", "행정동"}.issubset(coordinates.columns):
        return {}

    display_names: dict[str, str] = {}
    for _, row in coordinates.iterrows():
        station_number = _clean_string(row.get("역번호"))
        district = _clean_string(row.get("행정동"))
        if not station_number or not district:
            continue

        display_name = f"{district} 예정역"
        display_names[station_number] = display_name
        display_names[f"2호선_{station_number}"] = display_name

    return display_names


def _display_station_name(
    station_name: str,
    station_id: str,
    district: str,
    line2_display_names: dict[str, str],
) -> str | None:
    for candidate in [station_name, station_id]:
        if candidate in line2_display_names:
            return line2_display_names[candidate]

        match = INTERNAL_LINE2_STATION_PATTERN.match(candidate)
        if match is not None and match.group(1) in line2_display_names:
            return line2_display_names[match.group(1)]

    if INTERNAL_LINE2_STATION_PATTERN.match(station_name) is not None and district:
        return f"{district} 예정역"

    return None


def _competition_index_from_risk(risk_level: str) -> float:
    if "높" in risk_level:
        return 82.5
    if "낮" in risk_level:
        return 17.5
    return 50.0


def _business_diversity_from_reason(main_reason: str) -> float | None:
    match = re.search(r"상권 다양성 지수\s*([0-9]+(?:\.[0-9]+)?)", main_reason)
    if match is None:
        return None

    value = _safe_float(match.group(1))
    if value is None:
        return None
    if value <= 1:
        value *= 100
    return _round_score(value)


def _recommendation_from_csv_row(
    row: pd.Series,
    fallback_rank: int,
    feature_by_station_id: dict[str, pd.Series],
    feature_by_station_name: dict[str, pd.Series],
    line2_display_names: dict[str, str],
) -> dict[str, object] | None:
    station_name = _clean_string(row.get("station_name"))
    score = _safe_float(row.get("startup_suitability_score"))
    if not station_name or score is None:
        return None

    rank = _safe_int(row.get("rank")) or fallback_rank
    station_id = _clean_string(row.get("station_id"))
    feature = None
    if station_id:
        feature = feature_by_station_id.get(station_id)
    if feature is None:
        feature = feature_by_station_name.get(station_name)

    if not station_id:
        station_id = _feature_string(feature, "station_id") or station_name

    growth_score = _safe_float(row.get("growth_score"))
    risk_level = _clean_string(row.get("risk_level"))
    main_reason = _clean_string(row.get("main_reason"))
    competition_index = _feature_float(feature, "competition_index")
    if competition_index is None:
        competition_index = _competition_index_from_risk(risk_level)

    business_diversity_index = _feature_float(feature, "business_diversity_index")
    if business_diversity_index is None:
        business_diversity_index = _business_diversity_from_reason(main_reason)
    if business_diversity_index is None:
        business_diversity_index = 50.0

    floating_demand_index = growth_score
    if floating_demand_index is None:
        floating_demand_index = _feature_float(feature, "floating_demand_index")
    if floating_demand_index is None:
        floating_demand_index = 50.0
    rounded_score = _round_score(score)
    district = _clean_string(row.get("district"))

    recommendation: dict[str, object] = {
        "rank": rank,
        "station_id": station_id,
        "station_name": station_name,
        "district": district,
        "recommended_business_type": _clean_string(row.get("recommended_business_type")),
        "startup_suitability_score": rounded_score,
        "growth_score": _round_score(growth_score if growth_score is not None else floating_demand_index),
        "risk_level": risk_level,
        "main_reason": main_reason,
        "risk_reason": _clean_string(row.get("risk_reason")),
        "strategy_comment": _clean_string(row.get("strategy_comment")),
        "recommendation_label": _recommendation_label(rounded_score),
        "floating_demand_index": _round_score(floating_demand_index),
        "competition_index": _round_score(competition_index),
        "business_diversity_index": _round_score(business_diversity_index),
        "data_status": "recommendation_csv",
    }
    display_station_name = _display_station_name(
        station_name=station_name,
        station_id=station_id,
        district=district,
        line2_display_names=line2_display_names,
    )
    if display_station_name is not None and display_station_name != station_name:
        recommendation["display_station_name"] = display_station_name

    return recommendation


def _load_csv_recommendations() -> list[dict[str, object]]:
    if not config.RECOMMENDATION_TOP5_PATH.exists():
        return []

    try:
        recommendations_csv = pd.read_csv(config.RECOMMENDATION_TOP5_PATH)
    except (OSError, pd.errors.ParserError, UnicodeDecodeError):
        return []

    if recommendations_csv.empty or not RECOMMENDATION_REQUIRED_COLUMNS.issubset(
        recommendations_csv.columns,
    ):
        return []

    features = _load_or_build_features()
    feature_by_station_id, feature_by_station_name = _feature_lookups(features)
    line2_display_names = _load_line2_station_display_names()
    recommendations: list[dict[str, object]] = []

    for index, row in recommendations_csv.iterrows():
        recommendation = _recommendation_from_csv_row(
            row,
            fallback_rank=index + 1,
            feature_by_station_id=feature_by_station_id,
            feature_by_station_name=feature_by_station_name,
            line2_display_names=line2_display_names,
        )
        if recommendation is not None:
            recommendations.append(recommendation)

    return sorted(recommendations, key=lambda item: int(item["rank"]))


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


def _sample_station_recommendations(limit: int = 5) -> list[dict[str, object]]:
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


def get_station_recommendations_payload(limit: int = 5) -> dict[str, object]:
    csv_recommendations = _load_csv_recommendations()
    if csv_recommendations:
        return {
            "items": csv_recommendations[:limit],
            "data_status": "recommendation_csv",
            "message": _recommendation_data_source_message("recommendation_csv"),
        }

    return {
        "items": _sample_station_recommendations(limit=limit),
        "data_status": "sample_fixture",
        "message": _recommendation_data_source_message("sample_fixture"),
    }


def get_station_recommendations(limit: int = 5) -> list[dict[str, object]]:
    payload = get_station_recommendations_payload(limit=limit)
    items = payload["items"]
    if isinstance(items, list):
        return items
    return []
