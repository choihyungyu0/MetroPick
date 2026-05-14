"""Build station-area store summaries from public store CSV or sample fixtures."""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml import config
from ml.data_loader import load_sample_raw_data
from ml.public_store_ingestion import (
    filter_gwangju_stores,
    filter_valid_coordinates,
    load_public_store_csv,
    normalize_public_store_columns,
)
from ml.station_area_store_summary import build_station_area_store_summary


def _find_first_public_store_csv() -> Path | None:
    if not config.PUBLIC_STORE_RAW_DIR.exists():
        return None

    csv_files = sorted(config.PUBLIC_STORE_RAW_DIR.glob("*.csv"))
    return csv_files[0] if csv_files else None


def _load_public_or_sample_stores() -> tuple[pd.DataFrame, pd.DataFrame, str]:
    public_csv_path = _find_first_public_store_csv()
    raw_data = load_sample_raw_data()

    if public_csv_path is None:
        return raw_data.stores, raw_data.stations, "sample_fixture"

    raw_public_stores = load_public_store_csv(public_csv_path)
    normalized_stores = normalize_public_store_columns(raw_public_stores)
    gwangju_stores = filter_gwangju_stores(normalized_stores)
    valid_stores = filter_valid_coordinates(gwangju_stores)
    return valid_stores, raw_data.stations, "public_store_csv"


def build_public_store_summary() -> tuple[pd.DataFrame, str]:
    stores_df, stations_df, source_mode = _load_public_or_sample_stores()
    summaries = [
        build_station_area_store_summary(stores_df, stations_df, radius_m=radius_m)
        for radius_m in (300, 500, 1000)
    ]
    summary = pd.concat(summaries, ignore_index=True)
    summary["source_mode"] = source_mode

    config.PUBLIC_STORE_PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    summary.to_csv(config.PUBLIC_STORE_SUMMARY_PATH, index=False)
    return summary, source_mode


def main() -> None:
    summary, source_mode = build_public_store_summary()
    print(f"source_mode = {source_mode}")
    print(f"rows = {len(summary)}")
    print(f"output_path = {config.PUBLIC_STORE_SUMMARY_PATH}")


if __name__ == "__main__":
    main()
