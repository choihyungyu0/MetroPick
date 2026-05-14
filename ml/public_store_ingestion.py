"""Ingestion helpers for public commercial-store CSV files.

The first supported source is the local CSV export for the public small-business
commercial-store dataset. No external APIs or keys are used here.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

NORMALIZED_STORE_COLUMNS = [
    "store_id",
    "store_name",
    "business_large",
    "business_medium",
    "business_small",
    "province",
    "district",
    "dong",
    "road_address",
    "longitude",
    "latitude",
]

KOREAN_TO_ENGLISH_COLUMNS = {
    "\uc0c1\uac00\uc5c5\uc18c\ubc88\ud638": "store_id",
    "\uc0c1\ud638\uba85": "store_name",
    "\uc0c1\uad8c\uc5c5\uc885\ub300\ubd84\ub958\uba85": "business_large",
    "\uc0c1\uad8c\uc5c5\uc885\uc911\ubd84\ub958\uba85": "business_medium",
    "\uc0c1\uad8c\uc5c5\uc885\uc18c\ubd84\ub958\uba85": "business_small",
    "\uc0c1\uad8c\uc5c5\uc885\ucf54\ub4dc": "business_code",
    "\uc2dc\ub3c4\uba85": "province",
    "\uc2dc\uad70\uad6c\uba85": "district",
    "\ubc95\uc815\ub3d9\uba85": "dong",
    "\uc9c0\ubc88\uc8fc\uc18c": "lot_address",
    "\ub3c4\ub85c\uba85\uc8fc\uc18c": "road_address",
    "\uacbd\ub3c4": "longitude",
    "\uc704\ub3c4": "latitude",
}


def load_public_store_csv(path: str | Path) -> pd.DataFrame:
    """Load a public store CSV with common Korean CSV encodings."""

    csv_path = Path(path)
    for encoding in ("utf-8-sig", "utf-8", "cp949", "euc-kr"):
        try:
            return pd.read_csv(csv_path, encoding=encoding, low_memory=False)
        except UnicodeDecodeError:
            continue

    return pd.read_csv(csv_path, low_memory=False)


def _first_existing_series(
    df: pd.DataFrame,
    candidate_columns: tuple[str, ...],
    default: str = "",
) -> pd.Series:
    for column in candidate_columns:
        if column in df.columns:
            return df[column]
    return pd.Series(default, index=df.index)


def normalize_public_store_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Return public store rows with the project's normalized English columns."""

    normalized = pd.DataFrame(index=df.index)
    renamed = df.rename(columns=KOREAN_TO_ENGLISH_COLUMNS)

    for column in NORMALIZED_STORE_COLUMNS:
        if column == "road_address":
            normalized[column] = _first_existing_series(
                renamed,
                ("road_address", "lot_address"),
            )
            continue

        normalized[column] = _first_existing_series(renamed, (column,))

    normalized["longitude"] = pd.to_numeric(normalized["longitude"], errors="coerce")
    normalized["latitude"] = pd.to_numeric(normalized["latitude"], errors="coerce")

    text_columns = [
        column
        for column in NORMALIZED_STORE_COLUMNS
        if column not in {"longitude", "latitude"}
    ]
    for column in text_columns:
        normalized[column] = normalized[column].fillna("").astype(str).str.strip()

    return normalized[NORMALIZED_STORE_COLUMNS]


def filter_gwangju_stores(df: pd.DataFrame) -> pd.DataFrame:
    """Keep only rows that can be identified as Gwangju Metropolitan City."""

    if "province" not in df.columns:
        return df.iloc[0:0].copy()

    province = df["province"].fillna("").astype(str)
    return df[province.str.contains("\uad11\uc8fc", na=False)].copy()


def filter_valid_coordinates(df: pd.DataFrame) -> pd.DataFrame:
    """Remove rows without usable Korean longitude/latitude values."""

    if "longitude" not in df.columns or "latitude" not in df.columns:
        return df.iloc[0:0].copy()

    filtered = df.copy()
    filtered["longitude"] = pd.to_numeric(filtered["longitude"], errors="coerce")
    filtered["latitude"] = pd.to_numeric(filtered["latitude"], errors="coerce")

    valid_coordinates = (
        filtered["longitude"].between(120.0, 135.0)
        & filtered["latitude"].between(30.0, 40.0)
    )
    return filtered[valid_coordinates].copy()
