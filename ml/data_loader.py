"""Data-loading helpers for the sample-first MetroPick AI pipeline."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from ml import config

STATION_AREA_REQUIRED_COLUMNS = (
    "station_id",
    "station_name",
    "radius_m",
    "startup_suitability_score",
    "total_store_count",
    "competition_index",
    "floating_demand_index",
    "nearby_bus_stop_count",
    "bus_boarding_count",
    "bus_alighting_count",
    "bus_total_count",
)
STATION_AREA_NUMERIC_COLUMNS = tuple(
    column
    for column in STATION_AREA_REQUIRED_COLUMNS
    if column not in {"station_id", "station_name"}
)
STATION_AREA_COLUMN_ALIASES = {
    "station_id": ("station id", "station_code", "station code", "station_no"),
    "station_name": ("station name", "station_nm", "station", "name"),
    "radius_m": ("radius", "radius_meter", "radius meters", "buffer_m"),
    "startup_suitability_score": (
        "startup_score",
        "suitability_score",
        "startup suitability score",
        "score",
    ),
    "total_store_count": ("store_count", "stores_count", "total stores", "store_total"),
    "competition_index": ("competition_score", "competition", "competition idx"),
    "floating_demand_index": (
        "floating_demand_score",
        "floating_population_index",
        "demand_index",
    ),
    "nearby_bus_stop_count": (
        "bus_stop_count",
        "nearby_bus_stops",
        "nearby_bus_stop_total",
    ),
    "bus_boarding_count": ("boarding_count", "bus_boarding", "bus_boardings"),
    "bus_alighting_count": ("alighting_count", "bus_alighting", "bus_alightings"),
    "bus_total_count": ("bus_total", "bus_ridership_count", "bus_usage_count"),
}


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


def _column_key(column: str) -> str:
    return "".join(character for character in column.lower() if character.isalnum())


def normalize_station_area_feature_columns(features: pd.DataFrame) -> pd.DataFrame:
    normalized = features.copy()
    source_columns_by_key = {
        _column_key(str(column)): str(column) for column in normalized.columns
    }
    rename_map: dict[str, str] = {}

    for canonical_column, aliases in STATION_AREA_COLUMN_ALIASES.items():
        if canonical_column in normalized.columns:
            continue

        for alias in (canonical_column, *aliases):
            source_column = source_columns_by_key.get(_column_key(alias))
            if source_column is not None and source_column not in rename_map:
                rename_map[source_column] = canonical_column
                break

    if rename_map:
        normalized = normalized.rename(columns=rename_map)

    for column in STATION_AREA_NUMERIC_COLUMNS:
        if column in normalized.columns:
            normalized[column] = pd.to_numeric(normalized[column], errors="coerce")

    return normalized


def validate_station_area_feature_columns(features: pd.DataFrame) -> None:
    missing_columns = [
        column
        for column in STATION_AREA_REQUIRED_COLUMNS
        if column not in features.columns
    ]
    if missing_columns:
        formatted_columns = ", ".join(missing_columns)
        raise ValueError(f"Station-area feature CSV is missing required columns: {formatted_columns}")

    invalid_numeric_columns = [
        column
        for column in STATION_AREA_NUMERIC_COLUMNS
        if features[column].isna().any()
    ]
    if invalid_numeric_columns:
        formatted_columns = ", ".join(invalid_numeric_columns)
        raise ValueError(f"Station-area feature CSV has invalid numeric values: {formatted_columns}")


def load_sample_raw_data() -> SampleRawData:
    """Load bundled CSV fixtures without calling external public-data APIs."""

    return SampleRawData(
        stores=load_csv(config.STORE_SAMPLE_PATH),
        bus=load_csv(config.BUS_SAMPLE_PATH),
        subway=load_csv(config.SUBWAY_SAMPLE_PATH),
        stations=load_csv(config.STATION_AREAS_PATH),
    )


def load_processed_station_area_features(
    validate_required_columns: bool = False,
) -> pd.DataFrame:
    features = normalize_station_area_feature_columns(
        load_csv(config.STATION_AREA_FEATURES_PATH),
    )
    if validate_required_columns:
        validate_station_area_feature_columns(features)
    return features
