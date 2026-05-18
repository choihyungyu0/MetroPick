"""Feature and summary services backed by sample or local public CSV data."""

from __future__ import annotations

import math
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
GWANGJU_CENTER = {"lat": 35.1595, "lng": 126.8526}
LINE1_ROUTE_ORDER = {
    "평동": 1,
    "도산": 2,
    "광주송정": 3,
    "송정공원": 4,
    "공항": 5,
    "김대중컨벤션센터": 6,
    "상무": 7,
    "운천": 8,
    "쌍촌": 9,
    "화정": 10,
    "농성": 11,
    "돌고개": 12,
    "양동시장": 13,
    "금남로5가": 14,
    "금남로4가": 15,
    "문화전당": 16,
    "남광주": 17,
    "학동증심사입구": 18,
    "소태": 19,
    "녹동": 20,
}
BUSINESS_TYPE_OPTIONS = (
    {
        "key": "restaurant",
        "label": "음식점",
        "count_column": "restaurant_count",
        "color": "#ef4444",
        "aliases": ("restaurant", "음식점", "음식", "식당", "외식"),
    },
    {
        "key": "cafe",
        "label": "카페/디저트",
        "count_column": "cafe_count",
        "color": "#2563eb",
        "aliases": ("cafe", "카페", "카페/디저트", "디저트"),
    },
    {
        "key": "retail",
        "label": "소매",
        "count_column": "retail_count",
        "color": "#8b5cf6",
        "aliases": ("retail", "소매", "판매"),
    },
    {
        "key": "beauty",
        "label": "미용",
        "count_column": "beauty_count",
        "color": "#f97316",
        "aliases": ("beauty", "미용", "뷰티"),
    },
    {
        "key": "academy",
        "label": "학원",
        "count_column": "academy_count",
        "color": "#fbbf24",
        "aliases": ("academy", "학원", "교육"),
    },
    {
        "key": "convenience",
        "label": "편의점",
        "count_column": "convenience_count",
        "color": "#14b8a6",
        "aliases": ("convenience", "편의점"),
    },
    {
        "key": "pharmacy",
        "label": "약국",
        "count_column": "pharmacy_count",
        "color": "#22c55e",
        "aliases": ("pharmacy", "약국"),
    },
    {
        "key": "etc",
        "label": "기타",
        "count_column": "",
        "color": "#94a3b8",
        "aliases": ("etc", "기타"),
    },
)
BUSINESS_TYPE_BY_KEY = {str(item["key"]): item for item in BUSINESS_TYPE_OPTIONS}


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


def _public_map_csv_files_exist() -> bool:
    return all(
        path.exists()
        for path in [
            config.PUBLIC_STORE_SUMMARY_PATH,
            config.PUBLIC_STORE_CLEAN_PATH,
            config.LINE2_STATION_COORDINATES_PATH,
            config.BUS_STOP_COORDINATES_PATH,
        ]
    )


def _split_csv_param(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _parse_radius_m(radius_m: int | float | str | None) -> int:
    parsed = _safe_int(radius_m)
    if parsed is None:
        return config.DEFAULT_RADIUS_M
    return max(100, min(parsed, 3000))


def _normal_label(value: object) -> str:
    return re.sub(r"[\s_/()·.-]+", "", _clean_string(value).lower())


def _station_match_key(value: object) -> str:
    normalized = _normal_label(value)
    return normalized.replace("예정역", "").replace("역", "").replace("예정", "")


def _map_display_station_name(station_name: str, line: str, dong: str = "") -> str:
    if line == "2호선":
        station_number = station_name.replace("2호선_", "").strip()
        if dong:
            return f"{dong} 예정역({station_number})"
        return f"{station_number} 예정역"

    if station_name.endswith("역"):
        return station_name
    return f"{station_name}역"


def _line_filter_value(line: str | None) -> str | None:
    cleaned_line = _clean_string(line)
    if not cleaned_line or cleaned_line == "전체":
        return None
    if "2" in cleaned_line:
        return "2호선"
    if "1" in cleaned_line:
        return "1호선"
    return cleaned_line


def _region_is_all(region: str | None) -> bool:
    cleaned_region = _clean_string(region)
    return cleaned_region in {"", "전체", "광주광역시"}


def _clean_dong_name(value: object) -> str:
    text = _clean_string(value)
    if not text:
        return ""
    return text.split()[-1]


def _mode_string(values: pd.Series) -> str:
    cleaned = values.dropna().map(_clean_string)
    cleaned = cleaned[cleaned != ""]
    if cleaned.empty:
        return ""
    return str(cleaned.mode().iloc[0])


def _coordinates_are_valid(frame: pd.DataFrame, lat_column: str, lng_column: str) -> pd.DataFrame:
    if lat_column not in frame.columns or lng_column not in frame.columns:
        return pd.DataFrame()

    coordinates = frame.copy()
    coordinates[lat_column] = pd.to_numeric(coordinates[lat_column], errors="coerce")
    coordinates[lng_column] = pd.to_numeric(coordinates[lng_column], errors="coerce")
    return coordinates[
        coordinates[lat_column].between(33.0, 38.5)
        & coordinates[lng_column].between(124.0, 132.0)
    ].copy()


def _business_label_for_key(key: str) -> str:
    option = BUSINESS_TYPE_BY_KEY.get(key)
    if option is None:
        return "기타"
    return str(option["label"])


def _business_color_for_key(key: str) -> str:
    option = BUSINESS_TYPE_BY_KEY.get(key)
    if option is None:
        return "#94a3b8"
    return str(option["color"])


def _business_count_column(key: str) -> str:
    option = BUSINESS_TYPE_BY_KEY.get(key)
    if option is None:
        return ""
    return str(option["count_column"])


def _business_key_from_query(business_type: str | None) -> str | None:
    normalized = _normal_label(business_type)
    if normalized in {"", "all", "전체", "업종전체"}:
        return None

    for option in BUSINESS_TYPE_OPTIONS:
        candidates = [str(option["key"]), str(option["label"])]
        candidates.extend(str(alias) for alias in option["aliases"])
        if normalized in {_normal_label(candidate) for candidate in candidates}:
            return str(option["key"])
    return None


def _business_key_from_store_row(row: pd.Series) -> str:
    mapped = _clean_string(row.get("mapped_business_type"))
    if mapped:
        return mapped if mapped in BUSINESS_TYPE_BY_KEY else "etc"

    joined_text = " ".join(
        _clean_string(row.get(column))
        for column in ["business_large", "business_medium", "business_small"]
    )
    if "카페" in joined_text or "커피" in joined_text or "디저트" in joined_text:
        return "cafe"
    if "음식" in joined_text or "식당" in joined_text or "한식" in joined_text:
        return "restaurant"
    if "편의점" in joined_text:
        return "convenience"
    if "약국" in joined_text:
        return "pharmacy"
    if "미용" in joined_text or "뷰티" in joined_text:
        return "beauty"
    if "학원" in joined_text or "교육" in joined_text:
        return "academy"
    if "소매" in joined_text:
        return "retail"
    return "etc"


def _prepare_store_business_keys(stores: pd.DataFrame) -> pd.DataFrame:
    prepared = stores.copy()
    if prepared.empty:
        prepared["mapped_business_type"] = []
        return prepared

    prepared["mapped_business_type"] = prepared.apply(_business_key_from_store_row, axis=1)
    return prepared


def _score_percent(value: object) -> float:
    number = _safe_float(value)
    if number is None:
        return 0.0
    if number <= 1:
        number *= 100
    return round(max(0.0, min(100.0, number)), 2)


def _startup_score_from_summary(row: pd.Series) -> float:
    diversity_score = _score_percent(row.get("business_diversity_index"))
    competition_score = _score_percent(row.get("competition_index"))
    return round((diversity_score * 0.65) + ((100 - competition_score) * 0.35), 2)


def _line2_coordinate_lookup(
    line2_coordinates: pd.DataFrame,
    stores: pd.DataFrame,
) -> dict[str, dict[str, object]]:
    required_columns = {"역번호", "위도", "경도", "행정동"}
    if not required_columns.issubset(line2_coordinates.columns):
        return {}

    valid_coordinates = _coordinates_are_valid(line2_coordinates, "위도", "경도")
    district_by_dong: dict[str, str] = {}
    if {"dong", "district"}.issubset(stores.columns):
        for dong, rows in stores.groupby("dong"):
            cleaned_dong = _clean_string(dong)
            district = _mode_string(rows["district"])
            if cleaned_dong and district:
                district_by_dong[cleaned_dong] = district

    lookup: dict[str, dict[str, object]] = {}
    for order, (_, row) in enumerate(valid_coordinates.iterrows(), start=1):
        station_number = _clean_string(row.get("역번호"))
        if not station_number:
            continue
        if station_number.endswith(".0"):
            station_number = station_number[:-2]

        dong = _clean_string(row.get("행정동"))
        station_id = f"L2_{station_number}"
        station_name = f"2호선_{station_number}"
        coordinate = {
            "lat": float(row["위도"]),
            "lng": float(row["경도"]),
            "district": district_by_dong.get(dong, ""),
            "dong": dong,
            "station_name": _map_display_station_name(station_name, "2호선", dong),
            "route_order": order,
        }
        lookup[station_id] = coordinate
        lookup[station_name] = coordinate

    return lookup


def _load_sample_station_coordinates() -> pd.DataFrame:
    if not config.STATION_AREAS_PATH.exists():
        return pd.DataFrame()
    try:
        return pd.read_csv(config.STATION_AREAS_PATH)
    except (OSError, pd.errors.ParserError, UnicodeDecodeError):
        return pd.DataFrame()


def _sample_line1_coordinate_lookup(sample_stations: pd.DataFrame) -> dict[str, dict[str, object]]:
    required_columns = {"station_name", "line", "latitude", "longitude"}
    if sample_stations.empty or not required_columns.issubset(sample_stations.columns):
        return {}

    valid_stations = _coordinates_are_valid(sample_stations, "latitude", "longitude")
    lookup: dict[str, dict[str, object]] = {}
    for _, row in valid_stations.iterrows():
        if _clean_string(row.get("line")) != "1호선":
            continue

        station_name = _clean_string(row.get("station_name"))
        key = _station_match_key(station_name)
        if not key:
            continue
        lookup[key] = {
            "lat": float(row["latitude"]),
            "lng": float(row["longitude"]),
            "district": _clean_string(row.get("district")),
            "dong": "",
            "station_name": _map_display_station_name(station_name, "1호선"),
            "route_order": LINE1_ROUTE_ORDER.get(key, 999),
        }
    return lookup


def _line1_coordinate_lookup(
    bus_stops: pd.DataFrame,
    sample_stations: pd.DataFrame,
    line1_summary_rows: pd.DataFrame,
) -> dict[str, dict[str, object]]:
    sample_lookup = _sample_line1_coordinate_lookup(sample_stations)
    if bus_stops.empty or "정류소명" not in bus_stops.columns:
        bus_coordinates = pd.DataFrame()
    else:
        bus_coordinates = _coordinates_are_valid(bus_stops, "위도", "경도")

    lookup: dict[str, dict[str, object]] = {}
    for _, row in line1_summary_rows.iterrows():
        station_id = _clean_string(row.get("station_id"))
        raw_station_name = _clean_string(row.get("station_name"))
        station_key = _station_match_key(raw_station_name)
        if not station_id or not station_key:
            continue

        if station_key in sample_lookup:
            lookup[station_id] = sample_lookup[station_key]
            continue

        matches = bus_coordinates[
            bus_coordinates["정류소명"].map(
                lambda value: station_key in _station_match_key(value),
            )
        ]
        if matches.empty:
            continue

        dong = _clean_dong_name(_mode_string(matches["행정동명"])) if "행정동명" in matches else ""
        lookup[station_id] = {
            "lat": float(matches["위도"].median()),
            "lng": float(matches["경도"].median()),
            "district": _mode_string(matches["자치구"]) if "자치구" in matches else "",
            "dong": dong,
            "station_name": _map_display_station_name(raw_station_name, "1호선"),
            "route_order": LINE1_ROUTE_ORDER.get(station_key, 999),
        }

    return lookup


def _coordinate_lookup(
    summary_rows: pd.DataFrame,
    line2_coordinates: pd.DataFrame,
    bus_stops: pd.DataFrame,
    stores: pd.DataFrame,
) -> dict[str, dict[str, object]]:
    line1_rows = summary_rows[summary_rows["line"] == "1호선"] if "line" in summary_rows else pd.DataFrame()
    lookup = _line2_coordinate_lookup(line2_coordinates, stores)
    lookup.update(
        _line1_coordinate_lookup(
            bus_stops=bus_stops,
            sample_stations=_load_sample_station_coordinates(),
            line1_summary_rows=line1_rows,
        ),
    )
    return lookup


def _station_is_selected(
    marker: dict[str, object],
    raw_station_name: str,
    selected_tokens: list[str],
) -> bool:
    if not selected_tokens:
        return False

    token_ids = {_clean_string(token).lower() for token in selected_tokens}
    token_names = {_station_match_key(token) for token in selected_tokens}
    marker_names = {
        _station_match_key(marker.get("station_name")),
        _station_match_key(raw_station_name),
    }
    station_id = _clean_string(marker.get("station_id")).lower()
    return station_id in token_ids or bool(marker_names & token_names)


def _station_business_counts(row: pd.Series) -> dict[str, int]:
    counts: dict[str, int] = {}
    for option in BUSINESS_TYPE_OPTIONS:
        key = str(option["key"])
        column = str(option["count_column"])
        counts[key] = (_safe_int(row.get(column)) or 0) if column else 0
    return counts


def _build_station_markers(
    summary_rows: pd.DataFrame,
    coordinates: dict[str, dict[str, object]],
    selected_tokens: list[str],
) -> list[dict[str, object]]:
    markers: list[dict[str, object]] = []
    for _, row in summary_rows.iterrows():
        station_id = _clean_string(row.get("station_id"))
        raw_station_name = _clean_string(row.get("station_name"))
        line = _clean_string(row.get("line"))
        coordinate = coordinates.get(station_id) or coordinates.get(raw_station_name)
        if not station_id or not raw_station_name or coordinate is None:
            continue

        station_name = _clean_string(coordinate.get("station_name")) or _map_display_station_name(
            raw_station_name,
            line,
            _clean_string(coordinate.get("dong")),
        )
        competition_score = _score_percent(row.get("competition_index"))
        diversity_score = _score_percent(row.get("business_diversity_index"))
        total_store_count = _safe_int(row.get("total_store_count")) or 0
        marker: dict[str, object] = {
            "station_id": station_id,
            "station_name": station_name,
            "raw_station_name": raw_station_name,
            "line": line,
            "district": _clean_string(coordinate.get("district")),
            "dong": _clean_string(coordinate.get("dong")),
            "lat": float(coordinate["lat"]),
            "lng": float(coordinate["lng"]),
            "route_order": int(coordinate.get("route_order", 999)),
            "score": {
                "total_store_count": total_store_count,
                "competition_index": competition_score,
                "business_diversity_index": diversity_score,
                "startup_suitability_score": _startup_score_from_summary(row),
            },
            "business_counts": _station_business_counts(row),
        }
        marker["selected"] = _station_is_selected(marker, raw_station_name, selected_tokens)
        markers.append(marker)

    return markers


def _station_matches_region(marker: dict[str, object], region: str | None) -> bool:
    if _region_is_all(region):
        return True

    region_text = _clean_string(region)
    return region_text in {
        _clean_string(marker.get("district")),
        _clean_string(marker.get("dong")),
    }


def _filter_station_markers(
    markers: list[dict[str, object]],
    line: str | None,
    region: str | None,
    selected_tokens: list[str],
) -> list[dict[str, object]]:
    line_filter = _line_filter_value(line)
    filtered = [
        marker
        for marker in markers
        if (line_filter is None or marker["line"] == line_filter)
        and _station_matches_region(marker, region)
    ]
    if selected_tokens:
        return [marker for marker in filtered if marker.get("selected") is True]
    return filtered


def _route_lines(markers: list[dict[str, object]]) -> list[dict[str, object]]:
    route_lines: list[dict[str, object]] = []
    for line, color in [("1호선", "#2563eb"), ("2호선", "#ef4444")]:
        line_markers = sorted(
            [marker for marker in markers if marker["line"] == line],
            key=lambda marker: (int(marker.get("route_order", 999)), str(marker["station_id"])),
        )
        route_lines.append(
            {
                "line": line,
                "color": color,
                "points": [
                    {"lat": float(marker["lat"]), "lng": float(marker["lng"])}
                    for marker in line_markers
                ],
            },
        )
    return route_lines


def _stores_near_selected_markers(
    stores: pd.DataFrame,
    selected_markers: list[dict[str, object]],
    radius_m: int,
) -> pd.DataFrame:
    if stores.empty or not selected_markers:
        return stores

    mask = pd.Series([False] * len(stores), index=stores.index)
    latitudes = pd.to_numeric(stores["latitude"], errors="coerce")
    longitudes = pd.to_numeric(stores["longitude"], errors="coerce")
    for marker in selected_markers:
        lat = float(marker["lat"])
        lng = float(marker["lng"])
        lat_delta = radius_m / 111_000
        lng_delta = radius_m / (111_000 * max(math.cos(math.radians(lat)), 0.2))
        mask = mask | (
            latitudes.between(lat - lat_delta, lat + lat_delta)
            & longitudes.between(lng - lng_delta, lng + lng_delta)
        )
    return stores[mask].copy()


def _filter_stores(
    stores: pd.DataFrame,
    business_key: str | None,
    region: str | None,
    selected_markers: list[dict[str, object]],
    radius_m: int,
) -> pd.DataFrame:
    filtered = _prepare_store_business_keys(_coordinates_are_valid(stores, "latitude", "longitude"))
    if filtered.empty:
        return filtered

    if business_key is not None:
        filtered = filtered[filtered["mapped_business_type"] == business_key].copy()

    if not _region_is_all(region) and {"district", "dong"}.issubset(filtered.columns):
        region_text = _clean_string(region)
        filtered = filtered[
            (filtered["district"].map(_clean_string) == region_text)
            | (filtered["dong"].map(_clean_string) == region_text)
        ].copy()

    return _stores_near_selected_markers(filtered, selected_markers, radius_m)


def _density_points(stores: pd.DataFrame, limit: int = 700) -> list[dict[str, object]]:
    if stores.empty:
        return []

    sample = stores.sort_values("store_id") if "store_id" in stores.columns else stores
    if len(sample) > limit:
        step = max(1, len(sample) // limit)
        sample = sample.iloc[::step].head(limit)

    points: list[dict[str, object]] = []
    for index, row in sample.iterrows():
        business_key = _business_key_from_store_row(row)
        points.append(
            {
                "id": _clean_string(row.get("store_id")) or f"store-{index}",
                "lat": float(row["latitude"]),
                "lng": float(row["longitude"]),
                "business_type": _business_label_for_key(business_key),
                "business_type_key": business_key,
                "store_name": _clean_string(row.get("store_name")),
                "weight": 1.0,
            },
        )
    return points


def _bus_stop_markers(
    bus_stops: pd.DataFrame,
    region: str | None,
    selected_markers: list[dict[str, object]],
    radius_m: int,
    limit: int = 250,
) -> list[dict[str, object]]:
    if bus_stops.empty:
        return []

    stops = _coordinates_are_valid(bus_stops, "위도", "경도")
    if stops.empty:
        return []

    if not _region_is_all(region) and "자치구" in stops.columns:
        region_text = _clean_string(region)
        stops = stops[stops["자치구"].map(_clean_string) == region_text].copy()

    if selected_markers:
        comparable = stops.rename(columns={"위도": "latitude", "경도": "longitude"})
        stops = _stores_near_selected_markers(comparable, selected_markers, radius_m)

    stops = stops.head(limit)
    return [
        {
            "id": _clean_string(row.get("ID")) or f"bus-{index}",
            "name": _clean_string(row.get("정류소명")),
            "lat": float(row["latitude"] if "latitude" in row else row["위도"]),
            "lng": float(row["longitude"] if "longitude" in row else row["경도"]),
        }
        for index, row in stops.iterrows()
    ]


def _layers_from_param(layers: str | None) -> list[str]:
    requested_layers = _split_csv_param(layers)
    if requested_layers:
        return requested_layers
    return ["line_1", "line_2", "stations", "density"]


def _selected_station_circles(
    markers: list[dict[str, object]],
    radius_m: int,
) -> list[dict[str, object]]:
    return [
        {
            "station_id": marker["station_id"],
            "station_name": marker["station_name"],
            "lat": marker["lat"],
            "lng": marker["lng"],
            "radius_m": radius_m,
        }
        for marker in markers
    ]


def _map_view(markers: list[dict[str, object]], has_selected_stations: bool) -> dict[str, object]:
    if not markers:
        return {"center": GWANGJU_CENTER, "zoom": 12}

    lat = sum(float(marker["lat"]) for marker in markers) / len(markers)
    lng = sum(float(marker["lng"]) for marker in markers) / len(markers)
    return {
        "center": {"lat": round(lat, 6), "lng": round(lng, 6)},
        "zoom": 14 if has_selected_stations else 12,
    }


def _business_distribution(stores: pd.DataFrame) -> list[dict[str, object]]:
    if stores.empty:
        return []

    counts = stores["mapped_business_type"].value_counts().to_dict()
    total_count = int(sum(int(count) for count in counts.values()))
    if total_count == 0:
        return []

    distribution: list[dict[str, object]] = []
    for option in BUSINESS_TYPE_OPTIONS:
        key = str(option["key"])
        count = int(counts.get(key, 0))
        if count == 0:
            continue
        distribution.append(
            {
                "name": _business_label_for_key(key),
                "key": key,
                "count": count,
                "percent": round((count / total_count) * 100, 1),
                "color": _business_color_for_key(key),
            },
        )

    return sorted(distribution, key=lambda item: int(item["count"]), reverse=True)[:6]


def _summary_cards(
    markers: list[dict[str, object]],
    stores: pd.DataFrame,
    business_label: str,
    radius_m: int,
    data_status: str,
) -> list[dict[str, str]]:
    station_count = len(markers)
    store_count = len(stores)
    average_competition = (
        sum(float(marker["score"]["competition_index"]) for marker in markers) / station_count
        if station_count
        else 0.0
    )
    average_diversity = (
        sum(float(marker["score"]["business_diversity_index"]) for marker in markers) / station_count
        if station_count
        else 0.0
    )

    source_label = "공공 CSV" if data_status == "public_store_csv" else "샘플"
    return [
        {
            "title": "분석 역세권",
            "value": f"{station_count:,}개",
            "change": f"반경 {radius_m}m",
            "desc": source_label,
        },
        {
            "title": "필터 점포 수",
            "value": f"{store_count:,}개",
            "change": business_label,
            "desc": "지도 표시 기준",
        },
        {
            "title": "평균 경쟁 지수",
            "value": f"{average_competition:.1f}점",
            "change": "CSV 요약",
            "desc": "높을수록 경쟁 집중",
        },
        {
            "title": "평균 업종 다양성",
            "value": f"{average_diversity:.1f}점",
            "change": "CSV 요약",
            "desc": "점포 분포 기준",
        },
    ]


def _density_tone(competition_score: float) -> str:
    if competition_score >= 45:
        return "danger"
    if competition_score >= 32:
        return "warning"
    return "normal"


def _density_label(competition_score: float) -> str:
    if competition_score >= 45:
        return "매우 높음"
    if competition_score >= 32:
        return "높음"
    if competition_score > 0:
        return "보통"
    return "낮음"


def _top_business_labels(counts: dict[str, int], business_key: str | None) -> list[str]:
    if business_key is not None:
        return [_business_label_for_key(business_key)]

    ranked = sorted(counts.items(), key=lambda item: item[1], reverse=True)
    labels = [_business_label_for_key(key) for key, count in ranked if count > 0 and key != "etc"]
    return labels[:2] if labels else ["데이터 부족"]


def _comparison_rows(
    markers: list[dict[str, object]],
    business_key: str | None,
) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for marker in sorted(
        markers,
        key=lambda item: int(item["score"]["total_store_count"]),
        reverse=True,
    )[:8]:
        counts = marker["business_counts"]
        store_count = (
            int(counts.get(business_key, 0))
            if business_key is not None
            else int(marker["score"]["total_store_count"])
        )
        competition_score = float(marker["score"]["competition_index"])
        rows.append(
            {
                "station_id": marker["station_id"],
                "station": marker["station_name"],
                "storeCount": store_count,
                "densityLevel": _density_label(competition_score),
                "densityTone": _density_tone(competition_score),
                "averageFloatingPopulation": "공공 CSV 미제공",
                "averageMonthlySales": "공공 CSV 미제공",
                "competitionLevel": f"{_density_label(competition_score)} {competition_score:.1f}/100",
                "promisingBusinessTypes": _top_business_labels(counts, business_key),
            },
        )
    return rows


def _insight_summaries(
    markers: list[dict[str, object]],
    distribution: list[dict[str, object]],
    business_label: str,
    radius_m: int,
    data_status: str,
) -> list[str]:
    if not markers:
        return ["선택 조건에 맞는 역세권 데이터가 없습니다."]

    top_marker = max(markers, key=lambda marker: int(marker["score"]["total_store_count"]))
    insights = [
        f"{top_marker['station_name']} 반경 {radius_m}m의 공공 점포 수가 선택 조건에서 가장 많습니다.",
    ]
    if distribution:
        top_business = distribution[0]
        insights.append(
            f"{business_label} 필터 기준 업종 분포 1순위는 {top_business['name']}({top_business['percent']}%)입니다.",
        )
    if data_status == "public_store_csv":
        insights.append("공공 상가 CSV와 역 좌표 CSV를 연결해 지도 레이어를 갱신했습니다.")
    else:
        insights.append("실데이터 CSV가 없어서 기존 샘플 fixture 기반 지도를 표시합니다.")
    return insights


def _filters_payload(
    region: str | None,
    line: str | None,
    station_ids: str | None,
    radius_m: int,
    business_type: str | None,
    layers: str | None,
) -> dict[str, object]:
    business_key = _business_key_from_query(business_type)
    return {
        "region": _clean_string(region) or "광주광역시",
        "line": _clean_string(line) or "전체",
        "station_ids": _split_csv_param(station_ids),
        "radius_m": radius_m,
        "business_type": _business_label_for_key(business_key) if business_key else "",
        "business_type_key": business_key or "",
        "layers": _layers_from_param(layers),
    }


def _sample_map_data(
    region: str | None,
    line: str | None,
    station_ids: str | None,
    radius_m: int,
    business_type: str | None,
    layers: str | None,
) -> dict[str, object]:
    raw_data = load_sample_raw_data()
    features = _load_or_build_features()
    selected_tokens = _split_csv_param(station_ids)
    business_key = _business_key_from_query(business_type)
    layers_list = _layers_from_param(layers)

    feature_by_station_id, _ = _feature_lookups(features)
    station_rows = _coordinates_are_valid(raw_data.stations, "latitude", "longitude")
    markers: list[dict[str, object]] = []
    for index, row in station_rows.iterrows():
        station_id = _clean_string(row.get("station_id")) or f"sample-{index}"
        station_name = _map_display_station_name(
            _clean_string(row.get("station_name")),
            _clean_string(row.get("line")),
        )
        feature = feature_by_station_id.get(station_id)
        total_store_count = _safe_int(_feature_float(feature, "total_store_count")) or 0
        competition_score = _score_percent(_feature_float(feature, "competition_index"))
        diversity_score = _score_percent(_feature_float(feature, "business_diversity_index"))
        marker: dict[str, object] = {
            "station_id": station_id,
            "station_name": station_name,
            "raw_station_name": _clean_string(row.get("station_name")),
            "line": _clean_string(row.get("line")),
            "district": _clean_string(row.get("district")),
            "dong": "",
            "lat": float(row["latitude"]),
            "lng": float(row["longitude"]),
            "route_order": index + 1,
            "score": {
                "total_store_count": total_store_count,
                "competition_index": competition_score,
                "business_diversity_index": diversity_score,
                "startup_suitability_score": _score_percent(
                    _feature_float(feature, "startup_suitability_score"),
                ),
            },
            "business_counts": {str(option["key"]): 0 for option in BUSINESS_TYPE_OPTIONS},
        }
        marker["selected"] = _station_is_selected(marker, str(row.get("station_name")), selected_tokens)
        markers.append(marker)

    filtered_markers = _filter_station_markers(markers, line, region, selected_tokens)
    stores = _filter_stores(
        raw_data.stores,
        business_key=business_key,
        region=region,
        selected_markers=filtered_markers if selected_tokens else [],
        radius_m=radius_m,
    )
    business_label = _business_label_for_key(business_key) if business_key else "전체 업종"
    distribution = _business_distribution(stores)
    return {
        "data_status": "sample_fixture",
        "filters": _filters_payload(region, line, station_ids, radius_m, business_type, layers),
        "map": _map_view(filtered_markers or markers, bool(selected_tokens)),
        "route_lines": _route_lines(markers),
        "station_markers": filtered_markers,
        "density_points": _density_points(stores),
        "selected_station_circles": _selected_station_circles(filtered_markers, radius_m)
        if selected_tokens
        else [],
        "bus_stop_markers": [],
        "summary_cards": _summary_cards(
            filtered_markers,
            stores,
            business_label,
            radius_m,
            "sample_fixture",
        ),
        "business_distribution": distribution,
        "comparison_rows": _comparison_rows(filtered_markers, business_key),
        "insight_summaries": _insight_summaries(
            filtered_markers,
            distribution,
            business_label,
            radius_m,
            "sample_fixture",
        ),
        "message": _data_source_message("sample_fixture"),
        "available_layers": layers_list,
    }


def get_commercial_analysis_map_data(
    region: str | None = None,
    line: str | None = None,
    station_ids: str | None = None,
    radius_m: int = config.DEFAULT_RADIUS_M,
    business_type: str | None = None,
    layers: str | None = None,
) -> dict[str, object]:
    safe_radius_m = _parse_radius_m(radius_m)
    if not _public_map_csv_files_exist():
        return _sample_map_data(
            region=region,
            line=line,
            station_ids=station_ids,
            radius_m=safe_radius_m,
            business_type=business_type,
            layers=layers,
        )

    try:
        summary = pd.read_csv(config.PUBLIC_STORE_SUMMARY_PATH)
        stores = pd.read_csv(config.PUBLIC_STORE_CLEAN_PATH)
        line2_coordinates = pd.read_csv(config.LINE2_STATION_COORDINATES_PATH)
        bus_stops = pd.read_csv(config.BUS_STOP_COORDINATES_PATH)
    except (OSError, pd.errors.ParserError, UnicodeDecodeError):
        return _sample_map_data(
            region=region,
            line=line,
            station_ids=station_ids,
            radius_m=safe_radius_m,
            business_type=business_type,
            layers=layers,
        )

    selected_tokens = _split_csv_param(station_ids)
    business_key = _business_key_from_query(business_type)
    layers_list = _layers_from_param(layers)
    radius_rows = _rows_for_radius(summary, radius_m=safe_radius_m)
    coordinates = _coordinate_lookup(radius_rows, line2_coordinates, bus_stops, stores)
    all_markers = _build_station_markers(radius_rows, coordinates, selected_tokens)
    filtered_markers = _filter_station_markers(all_markers, line, region, selected_tokens)
    stores_for_map = _filter_stores(
        stores,
        business_key=business_key,
        region=region,
        selected_markers=filtered_markers if selected_tokens else [],
        radius_m=safe_radius_m,
    )
    business_label = _business_label_for_key(business_key) if business_key else "전체 업종"
    distribution = _business_distribution(stores_for_map)
    selected_circles = (
        _selected_station_circles(filtered_markers, safe_radius_m)
        if selected_tokens
        else []
    )

    return {
        "data_status": "public_store_csv",
        "filters": _filters_payload(
            region,
            line,
            station_ids,
            safe_radius_m,
            business_type,
            layers,
        ),
        "map": _map_view(filtered_markers or all_markers, bool(selected_tokens)),
        "route_lines": _route_lines(all_markers),
        "station_markers": filtered_markers,
        "density_points": _density_points(stores_for_map),
        "selected_station_circles": selected_circles,
        "bus_stop_markers": _bus_stop_markers(
            bus_stops,
            region=region,
            selected_markers=filtered_markers if selected_tokens else [],
            radius_m=safe_radius_m,
        )
        if "bus_stops" in layers_list
        else [],
        "summary_cards": _summary_cards(
            filtered_markers,
            stores_for_map,
            business_label,
            safe_radius_m,
            "public_store_csv",
        ),
        "business_distribution": distribution,
        "comparison_rows": _comparison_rows(filtered_markers, business_key),
        "insight_summaries": _insight_summaries(
            filtered_markers,
            distribution,
            business_label,
            safe_radius_m,
            "public_store_csv",
        ),
        "message": _data_source_message("public_store_csv"),
        "available_layers": layers_list,
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
