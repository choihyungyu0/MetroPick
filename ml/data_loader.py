"""Data-loading helpers for the sample-first MetroPick AI pipeline."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import warnings

import pandas as pd

from ml import config
from ml.scoring import (
    calculate_closure_risk_index,
    calculate_sales_potential_index,
    calculate_startup_suitability_score,
    normalize_minmax,
)

CSV_READ_ENCODINGS = ("utf-8-sig", "cp949")
STATION_AREA_SCHEMA_NORMALIZATION_ATTR = "station_area_schema_normalization"
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
STATION_AREA_RULE_TARGET_SUPPORT_COLUMNS = (
    "business_diversity_index",
    "sales_potential_index",
    "closure_risk_index",
    "accessibility_score",
)
STATION_AREA_NUMERIC_COLUMNS = tuple(
    column
    for column in (*STATION_AREA_REQUIRED_COLUMNS, *STATION_AREA_RULE_TARGET_SUPPORT_COLUMNS)
    if column not in {"station_id", "station_name"}
)
STATION_AREA_COLUMN_ALIASES = {
    "station_id": ("station id", "station_code", "station code", "station_no"),
    "station_name": ("station name", "station_nm", "station", "name"),
    "radius_m": ("radius", "radius_meter", "radius meters", "buffer_m", "반경", "분석반경"),
    "startup_suitability_score": (
        "startup_score",
        "suitability_score",
        "startup suitability score",
        "score",
        "창업적합도",
        "창업적합도점수",
    ),
    "total_store_count": (
        "store_count",
        "stores_count",
        "total stores",
        "store_total",
        "총점포수",
        "점포수",
    ),
    "competition_index": (
        "competition_score",
        "competition",
        "competition idx",
        "경쟁지수",
        "경쟁도",
    ),
    "floating_demand_index": (
        "floating_demand_score",
        "floating_population_index",
        "demand_index",
        "유동수요지수",
        "잠재유동수요지수",
    ),
    "nearby_bus_stop_count": (
        "bus_stop_count",
        "nearby_bus_stops",
        "nearby_bus_stop_total",
        "정류장수",
        "버스정류장수",
    ),
    "bus_boarding_count": (
        "boarding_count",
        "bus_boarding",
        "bus_boardings",
        "승차수",
        "버스승차수",
    ),
    "bus_alighting_count": (
        "alighting_count",
        "bus_alighting",
        "bus_alightings",
        "하차수",
        "버스하차수",
    ),
    "bus_total_count": (
        "bus_total",
        "bus_ridership_count",
        "bus_usage_count",
        "총승하차수",
        "버스총승하차수",
    ),
}
STATION_AREA_TOTAL_STORE_PROXY_COLUMNS = (
    "business_count",
    "business total",
    "사업체수",
)
STATION_AREA_FLOATING_DEMAND_PROXY_COLUMNS = (
    "administrative_floating_population",
    "floating_population",
    "floating population",
    "floating_population_count",
    "생활인구",
    "유동인구",
    "행정동유동인구",
)


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
    last_error: UnicodeDecodeError | None = None
    for encoding in CSV_READ_ENCODINGS:
        try:
            frame = pd.read_csv(file_path, encoding=encoding)
        except UnicodeDecodeError as exc:
            last_error = exc
            continue

        frame.attrs["csv_encoding"] = encoding
        return frame

    if last_error is not None:
        raise last_error
    raise UnicodeError(f"Unable to read CSV with supported encodings: {file_path}")


def _column_key(column: str) -> str:
    return "".join(character for character in column.lower() if character.isalnum())


def _find_column_by_alias(features: pd.DataFrame, aliases: tuple[str, ...]) -> str | None:
    source_columns_by_key = {
        _column_key(str(column)): str(column) for column in features.columns
    }
    for alias in aliases:
        source_column = source_columns_by_key.get(_column_key(alias))
        if source_column is not None:
            return source_column
    return None


def _to_numeric(series: pd.Series) -> pd.Series:
    if series.dtype == "object":
        return pd.to_numeric(series.astype(str).str.replace(",", "", regex=False), errors="coerce")
    return pd.to_numeric(series, errors="coerce")


def _normalization_details(features: pd.DataFrame) -> dict[str, object]:
    return {
        "encoding": features.attrs.get("csv_encoding"),
        "mapped_columns": {},
        "derived_columns": {},
        "defaulted_columns": {},
    }


def _record_detail(
    details: dict[str, object],
    section: str,
    column: str,
    note: str,
) -> None:
    section_details = details[section]
    if isinstance(section_details, dict):
        section_details[column] = note


def _default_column(
    features: pd.DataFrame,
    details: dict[str, object],
    column: str,
    value: float | int,
    note: str,
) -> None:
    if column not in features.columns:
        features[column] = value
        _record_detail(details, "defaulted_columns", column, note)


def _derive_total_store_count(
    features: pd.DataFrame,
    details: dict[str, object],
) -> None:
    if "total_store_count" in features.columns:
        return

    source_column = _find_column_by_alias(features, STATION_AREA_TOTAL_STORE_PROXY_COLUMNS)
    if source_column is None:
        return

    features["total_store_count"] = _to_numeric(features[source_column]).fillna(0).round().astype(int)
    _record_detail(
        details,
        "derived_columns",
        "total_store_count",
        f"Derived from v2 commercial-density proxy column '{source_column}'.",
    )


def _derive_floating_demand_index(
    features: pd.DataFrame,
    details: dict[str, object],
) -> None:
    if "floating_demand_index" in features.columns:
        return

    source_column = _find_column_by_alias(features, STATION_AREA_FLOATING_DEMAND_PROXY_COLUMNS)
    if source_column is None:
        return

    source_values = _to_numeric(features[source_column]).fillna(0.0)
    features["floating_demand_index"] = normalize_minmax(source_values).round(2)
    _record_detail(
        details,
        "derived_columns",
        "floating_demand_index",
        f"Min-max normalized v2 floating-demand proxy column '{source_column}'.",
    )


def _derive_competition_index(
    features: pd.DataFrame,
    details: dict[str, object],
) -> None:
    if "competition_index" in features.columns or "total_store_count" not in features.columns:
        return

    features["competition_index"] = normalize_minmax(features["total_store_count"]).round(2)
    _record_detail(
        details,
        "derived_columns",
        "competition_index",
        "Derived from total_store_count as a deterministic store-density proxy.",
    )


def _derive_rule_based_startup_target(
    features: pd.DataFrame,
    details: dict[str, object],
) -> None:
    if "startup_suitability_score" in features.columns:
        return

    required_proxy_columns = ("floating_demand_index", "competition_index")
    if any(column not in features.columns for column in required_proxy_columns):
        return

    if "business_diversity_index" not in features.columns:
        features["business_diversity_index"] = 50.0
        _record_detail(
            details,
            "defaulted_columns",
            "business_diversity_index",
            "Neutral support value used only for the documented MVP rule-based target.",
        )

    if "sales_potential_index" not in features.columns:
        features["sales_potential_index"] = calculate_sales_potential_index(
            features["floating_demand_index"],
            features["business_diversity_index"],
            features["competition_index"],
        ).round(2)
        _record_detail(
            details,
            "derived_columns",
            "sales_potential_index",
            "Derived with ml.scoring.calculate_sales_potential_index for the MVP target.",
        )

    if "closure_risk_index" not in features.columns:
        features["closure_risk_index"] = calculate_closure_risk_index(
            features["competition_index"],
            features["floating_demand_index"],
            features["business_diversity_index"],
        ).round(2)
        _record_detail(
            details,
            "derived_columns",
            "closure_risk_index",
            "Derived with ml.scoring.calculate_closure_risk_index for the MVP target.",
        )

    bus_total = (
        features["bus_total_count"]
        if "bus_total_count" in features.columns
        else pd.Series(0.0, index=features.index)
    )
    bus_stops = (
        features["nearby_bus_stop_count"]
        if "nearby_bus_stop_count" in features.columns
        else pd.Series(0.0, index=features.index)
    )
    if "accessibility_score" not in features.columns:
        if _to_numeric(bus_total).fillna(0.0).gt(0).any():
            accessibility_score = (
                (0.70 * normalize_minmax(bus_total)) + (0.30 * normalize_minmax(bus_stops))
            )
        else:
            accessibility_score = normalize_minmax(bus_stops)
        features["accessibility_score"] = accessibility_score.round(2)
        _record_detail(
            details,
            "derived_columns",
            "accessibility_score",
            "Derived from available bus totals and nearby stop counts for the MVP target.",
        )

    features["startup_suitability_score"] = calculate_startup_suitability_score(
        features["floating_demand_index"],
        features["sales_potential_index"],
        features["accessibility_score"],
        features["business_diversity_index"],
        features["competition_index"],
        features["closure_risk_index"],
    ).round(2)
    _record_detail(
        details,
        "derived_columns",
        "startup_suitability_score",
        (
            "Derived from documented deterministic MVP scoring proxies; "
            "not a real outcome label or model-accuracy claim."
        ),
    )


def _warn_if_proxy_columns_were_used(details: dict[str, object]) -> None:
    derived_columns = details.get("derived_columns", {})
    defaulted_columns = details.get("defaulted_columns", {})
    if not derived_columns and not defaulted_columns:
        return

    warnings.warn(
        (
            "Station-area feature schema used derived/default columns. "
            f"derived={derived_columns}; defaulted={defaulted_columns}"
        ),
        UserWarning,
        stacklevel=2,
    )


def normalize_station_area_feature_columns(features: pd.DataFrame) -> pd.DataFrame:
    normalized = features.copy()
    details = _normalization_details(features)
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
        mapped_columns = details["mapped_columns"]
        if isinstance(mapped_columns, dict):
            mapped_columns.update(rename_map)

    _default_column(
        normalized,
        details,
        "radius_m",
        config.DEFAULT_RADIUS_M,
        f"Defaulted to configured radius {config.DEFAULT_RADIUS_M}m.",
    )
    _default_column(
        normalized,
        details,
        "bus_boarding_count",
        0,
        "Defaulted to 0 because v2 did not include bus boarding counts.",
    )
    _default_column(
        normalized,
        details,
        "bus_alighting_count",
        0,
        "Defaulted to 0 because v2 did not include bus alighting counts.",
    )
    _default_column(
        normalized,
        details,
        "nearby_bus_stop_count",
        0,
        "Defaulted to 0 because v2 did not include nearby bus stop counts.",
    )

    for column in STATION_AREA_NUMERIC_COLUMNS:
        if column in normalized.columns:
            normalized[column] = _to_numeric(normalized[column])

    if "bus_total_count" not in normalized.columns:
        normalized["bus_total_count"] = (
            normalized["bus_boarding_count"].fillna(0) + normalized["bus_alighting_count"].fillna(0)
        )
        _record_detail(
            details,
            "derived_columns",
            "bus_total_count",
            "Derived as bus_boarding_count + bus_alighting_count.",
        )

    _derive_total_store_count(normalized, details)
    _derive_floating_demand_index(normalized, details)
    _derive_competition_index(normalized, details)
    _derive_rule_based_startup_target(normalized, details)

    for column in STATION_AREA_NUMERIC_COLUMNS:
        if column in normalized.columns:
            normalized[column] = _to_numeric(normalized[column])

    normalized.attrs[STATION_AREA_SCHEMA_NORMALIZATION_ATTR] = details
    _warn_if_proxy_columns_were_used(details)
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
        if column in features.columns and features[column].isna().any()
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
