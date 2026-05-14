"""Feature engineering for MetroPick station-area analysis."""

from __future__ import annotations

import re

import numpy as np
import pandas as pd

from ml.geo_utils import assign_rows_to_station_areas
from ml.scoring import (
    calculate_closure_risk_index,
    calculate_competition_index,
    calculate_floating_demand_index,
    calculate_sales_potential_index,
    calculate_startup_suitability_score,
    normalize_minmax,
)

OUTPUT_COLUMNS = [
    "station_id",
    "station_name",
    "radius_m",
    "total_store_count",
    "same_business_count_by_type",
    "cafe_count",
    "restaurant_count",
    "convenience_count",
    "pharmacy_count",
    "beauty_count",
    "academy_count",
    "retail_count",
    "business_type_count",
    "business_diversity_index",
    "bus_boarding_count",
    "bus_alighting_count",
    "bus_total_count",
    "nearby_bus_stop_count",
    "subway_pattern_score",
    "competition_index",
    "floating_demand_index",
    "sales_potential_index",
    "closure_risk_index",
    "startup_suitability_score",
]

CATEGORY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "cafe_count": ("카페", "커피", "디저트", "베이커리"),
    "restaurant_count": ("음식", "한식", "분식", "중식", "일식", "국밥", "백반", "초밥", "면요리"),
    "convenience_count": ("편의점",),
    "pharmacy_count": ("약국",),
    "beauty_count": ("미용", "뷰티", "헤어", "피부관리"),
    "academy_count": ("학원", "교육", "입시", "보습", "IT학원"),
    "retail_count": ("소매", "마트", "생활용품", "문구", "의류", "전자", "식품", "잡화", "서점"),
}


def _keyword_count(stores_df: pd.DataFrame, keywords: tuple[str, ...]) -> int:
    if stores_df.empty:
        return 0

    search_columns = ["business_large", "business_medium", "business_small", "store_name"]
    existing_columns = [column for column in search_columns if column in stores_df.columns]
    combined = stores_df[existing_columns].fillna("").astype(str).agg(" ".join, axis=1)
    pattern = "|".join(re.escape(keyword) for keyword in keywords)
    return int(combined.str.contains(pattern, regex=True).sum())


def _business_diversity_index(stores_df: pd.DataFrame) -> float:
    if stores_df.empty or "business_medium" not in stores_df.columns:
        return 0.0

    counts = stores_df["business_medium"].fillna("unknown").astype(str).value_counts()
    if len(counts) <= 1:
        return 0.0

    probabilities = counts / counts.sum()
    entropy = float(-(probabilities * np.log(probabilities)).sum())
    return round((entropy / np.log(len(counts))) * 100.0, 2)


def _same_business_count_by_type(stores_df: pd.DataFrame) -> int:
    if stores_df.empty or "business_medium" not in stores_df.columns:
        return 0
    return int(stores_df["business_medium"].fillna("unknown").astype(str).value_counts().max())


def _subway_pattern_scores(subway_df: pd.DataFrame, stations_df: pd.DataFrame) -> dict[str, float]:
    if subway_df.empty:
        return {str(row["station_id"]): 45.0 for _, row in stations_df.iterrows()}

    subway_totals = subway_df.copy()
    subway_totals["total_count"] = (
        pd.to_numeric(subway_totals["boarding_count"], errors="coerce").fillna(0)
        + pd.to_numeric(subway_totals["alighting_count"], errors="coerce").fillna(0)
    )
    grouped_totals = subway_totals.groupby("station_name")["total_count"].sum()
    normalized = normalize_minmax(grouped_totals)
    fallback_score = float(normalized.median()) if not normalized.empty else 45.0

    scores: dict[str, float] = {}
    for _, station in stations_df.iterrows():
        station_id = str(station["station_id"])
        station_name = str(station["station_name"])
        if station_name in normalized.index:
            scores[station_id] = round(float(normalized.loc[station_name]), 2)
        else:
            scenario = str(station.get("opening_scenario", ""))
            phase_adjustment = 0.90 if "phase_1" in scenario else 0.80
            scores[station_id] = round(max(35.0, min(65.0, fallback_score * phase_adjustment)), 2)
    return scores


def build_station_area_features(
    stores_df: pd.DataFrame,
    bus_df: pd.DataFrame,
    subway_df: pd.DataFrame,
    stations_df: pd.DataFrame,
    radius_m: int = 500,
) -> pd.DataFrame:
    """Build station-area features from sample fixtures and deterministic scores."""

    store_assignments = assign_rows_to_station_areas(stores_df, stations_df, radius_m=radius_m)
    bus_assignments = assign_rows_to_station_areas(bus_df, stations_df, radius_m=radius_m)
    subway_scores = _subway_pattern_scores(subway_df, stations_df)

    feature_rows: list[dict[str, object]] = []
    for _, station in stations_df.iterrows():
        station_id = str(station["station_id"])
        station_name = str(station["station_name"])
        station_stores = (
            store_assignments[store_assignments["station_id"] == station_id]
            if not store_assignments.empty
            else pd.DataFrame(columns=stores_df.columns)
        )
        station_bus = (
            bus_assignments[bus_assignments["station_id"] == station_id]
            if not bus_assignments.empty
            else pd.DataFrame(columns=bus_df.columns)
        )

        category_counts = {
            column_name: _keyword_count(station_stores, keywords)
            for column_name, keywords in CATEGORY_KEYWORDS.items()
        }
        business_type_count = (
            int(station_stores["business_medium"].fillna("unknown").astype(str).nunique())
            if not station_stores.empty and "business_medium" in station_stores.columns
            else 0
        )
        bus_boarding_count = (
            int(pd.to_numeric(station_bus["boarding_count"], errors="coerce").fillna(0).sum())
            if not station_bus.empty and "boarding_count" in station_bus.columns
            else 0
        )
        bus_alighting_count = (
            int(pd.to_numeric(station_bus["alighting_count"], errors="coerce").fillna(0).sum())
            if not station_bus.empty and "alighting_count" in station_bus.columns
            else 0
        )
        nearby_bus_stop_count = (
            int(station_bus["stop_name"].fillna("unknown").astype(str).nunique())
            if not station_bus.empty and "stop_name" in station_bus.columns
            else 0
        )

        feature_rows.append(
            {
                "station_id": station_id,
                "station_name": station_name,
                "radius_m": int(radius_m),
                "total_store_count": int(len(station_stores)),
                "same_business_count_by_type": _same_business_count_by_type(station_stores),
                **category_counts,
                "business_type_count": business_type_count,
                "business_diversity_index": _business_diversity_index(station_stores),
                "bus_boarding_count": bus_boarding_count,
                "bus_alighting_count": bus_alighting_count,
                "bus_total_count": bus_boarding_count + bus_alighting_count,
                "nearby_bus_stop_count": nearby_bus_stop_count,
                "subway_pattern_score": subway_scores.get(station_id, 45.0),
            }
        )

    features = pd.DataFrame(feature_rows)
    if features.empty:
        return pd.DataFrame(columns=OUTPUT_COLUMNS)

    features["competition_index"] = calculate_competition_index(
        features["total_store_count"],
        features["business_type_count"],
        features["same_business_count_by_type"],
    ).round(2)
    features["floating_demand_index"] = calculate_floating_demand_index(
        features["bus_total_count"],
        features["nearby_bus_stop_count"],
        features["subway_pattern_score"],
    ).round(2)
    features["sales_potential_index"] = calculate_sales_potential_index(
        features["floating_demand_index"],
        features["business_diversity_index"],
        features["competition_index"],
    ).round(2)
    features["closure_risk_index"] = calculate_closure_risk_index(
        features["competition_index"],
        features["floating_demand_index"],
        features["business_diversity_index"],
    ).round(2)
    accessibility_score = (
        (0.55 * normalize_minmax(features["bus_total_count"]))
        + (0.25 * normalize_minmax(features["nearby_bus_stop_count"]))
        + (0.20 * normalize_minmax(features["subway_pattern_score"]))
    ).round(2)
    features["startup_suitability_score"] = calculate_startup_suitability_score(
        features["floating_demand_index"],
        features["sales_potential_index"],
        accessibility_score,
        features["business_diversity_index"],
        features["competition_index"],
        features["closure_risk_index"],
    ).round(2)

    return features[OUTPUT_COLUMNS]
