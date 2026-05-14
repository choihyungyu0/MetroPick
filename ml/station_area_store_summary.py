"""Station-area commercial store summaries from normalized store data."""

from __future__ import annotations

import re

import numpy as np
import pandas as pd

from ml.geo_utils import assign_rows_to_station_areas
from ml.scoring import normalize_minmax

STORE_SUMMARY_COLUMNS = [
    "station_id",
    "station_name",
    "radius_m",
    "total_store_count",
    "cafe_count",
    "restaurant_count",
    "convenience_count",
    "pharmacy_count",
    "beauty_count",
    "academy_count",
    "retail_count",
    "business_type_count",
    "competition_index",
    "business_diversity_index",
]

CATEGORY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "cafe_count": (
        "\uce74\ud398",
        "\ucee4\ud53c",
        "\ub514\uc800\ud2b8",
        "\ubca0\uc774\ucee4\ub9ac",
    ),
    "restaurant_count": (
        "\ud55c\uc2dd",
        "\uc911\uc2dd",
        "\uc77c\uc2dd",
        "\uc591\uc2dd",
        "\uc74c\uc2dd",
        "\ubd84\uc2dd",
    ),
    "convenience_count": ("\ud3b8\uc758\uc810",),
    "pharmacy_count": ("\uc57d\uad6d",),
    "beauty_count": ("\ubbf8\uc6a9", "\ud5e4\uc5b4", "\ud53c\ubd80"),
    "academy_count": ("\ud559\uc6d0", "\uad50\uc721"),
    "retail_count": (
        "\uc18c\ub9e4",
        "\ub9c8\ud2b8",
        "\uc7a1\ud654",
        "\uc758\ub958",
        "\uc804\uc790",
    ),
}


def _keyword_mask(stores_df: pd.DataFrame, keywords: tuple[str, ...]) -> pd.Series:
    if stores_df.empty:
        return pd.Series(False, index=stores_df.index)

    search_columns = ["business_large", "business_medium", "business_small", "store_name"]
    existing_columns = [column for column in search_columns if column in stores_df.columns]
    if not existing_columns:
        return pd.Series(False, index=stores_df.index)

    combined = stores_df[existing_columns].fillna("").astype(str).agg(" ".join, axis=1)
    pattern = "|".join(re.escape(keyword) for keyword in keywords)
    return combined.str.contains(pattern, regex=True, na=False)


def _category_counts(stores_df: pd.DataFrame) -> dict[str, int]:
    masks = {
        column_name: _keyword_mask(stores_df, keywords)
        for column_name, keywords in CATEGORY_KEYWORDS.items()
    }
    masks["restaurant_count"] = masks["restaurant_count"] & ~masks["cafe_count"]
    masks["retail_count"] = (
        masks["retail_count"]
        & ~masks["convenience_count"]
        & ~masks["pharmacy_count"]
    )

    return {column_name: int(mask.sum()) for column_name, mask in masks.items()}


def _business_diversity_index(stores_df: pd.DataFrame) -> float:
    if stores_df.empty or "business_medium" not in stores_df.columns:
        return 0.0

    counts = stores_df["business_medium"].fillna("unknown").astype(str).value_counts()
    if len(counts) <= 1:
        return 0.0

    probabilities = counts / counts.sum()
    entropy = float(-(probabilities * np.log(probabilities)).sum())
    return round((entropy / np.log(len(counts))) * 100.0, 2)


def build_station_area_store_summary(
    stores_df: pd.DataFrame,
    stations_df: pd.DataFrame,
    radius_m: int = 500,
) -> pd.DataFrame:
    """Build deterministic store-density summaries for each station area."""

    assignments = assign_rows_to_station_areas(stores_df, stations_df, radius_m=radius_m)
    rows: list[dict[str, object]] = []

    for _, station in stations_df.iterrows():
        station_id = str(station.get("station_id", ""))
        station_name = str(station.get("station_name", ""))
        station_stores = (
            assignments[assignments["station_id"] == station_id]
            if not assignments.empty
            else pd.DataFrame(columns=stores_df.columns)
        )
        category_counts = _category_counts(station_stores)
        business_type_count = (
            int(station_stores["business_medium"].fillna("unknown").astype(str).nunique())
            if not station_stores.empty and "business_medium" in station_stores.columns
            else 0
        )

        rows.append(
            {
                "station_id": station_id,
                "station_name": station_name,
                "radius_m": int(radius_m),
                "total_store_count": int(len(station_stores)),
                **category_counts,
                "business_type_count": business_type_count,
                "business_diversity_index": _business_diversity_index(station_stores),
            }
        )

    summary = pd.DataFrame(rows)
    if summary.empty:
        return pd.DataFrame(columns=STORE_SUMMARY_COLUMNS)

    if int(summary["total_store_count"].sum()) == 0:
        summary["competition_index"] = 0.0
    else:
        summary["competition_index"] = (
            (0.75 * normalize_minmax(summary["total_store_count"]))
            + (0.25 * normalize_minmax(summary["business_type_count"]))
        ).round(2)

    return summary[STORE_SUMMARY_COLUMNS]
