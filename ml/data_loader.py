"""Data-loading helpers for the sample-first MetroPick AI pipeline."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from ml import config


@dataclass(frozen=True)
class SampleRawData:
    stores: pd.DataFrame
    bus: pd.DataFrame
    subway: pd.DataFrame
    stations: pd.DataFrame


def _require_file(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(f"Required sample data file is missing: {path}")


def load_csv(path: str | Path) -> pd.DataFrame:
    file_path = Path(path)
    _require_file(file_path)
    return pd.read_csv(file_path)


def load_sample_raw_data() -> SampleRawData:
    """Load bundled CSV fixtures without calling external public-data APIs."""

    return SampleRawData(
        stores=load_csv(config.STORE_SAMPLE_PATH),
        bus=load_csv(config.BUS_SAMPLE_PATH),
        subway=load_csv(config.SUBWAY_SAMPLE_PATH),
        stations=load_csv(config.STATION_AREAS_PATH),
    )


def load_processed_station_area_features() -> pd.DataFrame:
    return load_csv(config.STATION_AREA_FEATURES_PATH)
