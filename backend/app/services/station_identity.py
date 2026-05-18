"""Shared station identity helpers for backend CSV-backed endpoints."""

from __future__ import annotations

from pathlib import Path
import re

import pandas as pd

from ml import config

INTERNAL_LINE2_STATION_PATTERN = re.compile(r"^2호선_(\d+)$")
STATION_PARENTHESES_PATTERN = re.compile(r"\s*\([^)]*\)")


def clean_station_text(value: object) -> str:
    if value is None or pd.isna(value):
        return ""
    return str(value).strip()


def normalize_station_key(value: object) -> str:
    cleaned = STATION_PARENTHESES_PATTERN.sub("", clean_station_text(value))
    return cleaned.replace(" ", "")


def _clean_station_number(value: object) -> str:
    station_number = clean_station_text(value)
    if station_number.endswith(".0"):
        return station_number[:-2]
    return station_number


def _safe_float(value: object) -> float | None:
    try:
        if value is None or pd.isna(value):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def load_line2_station_display_names(path: Path | None = None) -> dict[str, str]:
    coordinates_path = path or config.LINE2_STATION_COORDINATES_PATH
    if not coordinates_path.exists():
        return {}

    try:
        coordinates = pd.read_csv(coordinates_path)
    except (OSError, pd.errors.ParserError, UnicodeDecodeError):
        return {}

    if coordinates.empty or not {"역번호", "행정동"}.issubset(coordinates.columns):
        return {}

    display_names: dict[str, str] = {}
    for _, row in coordinates.iterrows():
        station_number = _clean_station_number(row.get("역번호"))
        district = clean_station_text(row.get("행정동"))
        if not station_number or not district:
            continue

        display_name = f"{district} 예정역"
        display_names[station_number] = display_name
        display_names[f"2호선_{station_number}"] = display_name

    return display_names


def load_line2_station_coordinate_records(path: Path | None = None) -> list[dict[str, object]]:
    coordinates_path = path or config.LINE2_STATION_COORDINATES_PATH
    if not coordinates_path.exists():
        return []

    try:
        coordinates = pd.read_csv(coordinates_path)
    except (OSError, pd.errors.ParserError, UnicodeDecodeError):
        return []

    required_columns = {"역번호", "위도", "경도", "행정동"}
    if coordinates.empty or not required_columns.issubset(coordinates.columns):
        return []

    records: list[dict[str, object]] = []
    for order, (_, row) in enumerate(coordinates.iterrows(), start=1):
        station_number = _clean_station_number(row.get("역번호"))
        lat = _safe_float(row.get("위도"))
        lng = _safe_float(row.get("경도"))
        district = clean_station_text(row.get("행정동"))
        if (
            not station_number
            or lat is None
            or lng is None
            or not 33.0 <= lat <= 38.5
            or not 124.0 <= lng <= 132.0
        ):
            continue

        records.append(
            {
                "station_number": station_number,
                "station_id": f"2호선_{station_number}",
                "station_name": f"2호선_{station_number}",
                "display_station_name": f"{district} 예정역",
                "line": "2호선",
                "lat": lat,
                "lng": lng,
                "district": district,
                "route_order": order,
            },
        )

    return records


def display_station_name_for(
    station_name: str,
    station_id: str = "",
    district: str = "",
    line2_display_names: dict[str, str] | None = None,
) -> str | None:
    display_names = line2_display_names
    if display_names is None:
        display_names = load_line2_station_display_names()

    for candidate in [station_name, station_id]:
        cleaned_candidate = clean_station_text(candidate)
        if not cleaned_candidate:
            continue

        if cleaned_candidate in display_names:
            return display_names[cleaned_candidate]

        match = INTERNAL_LINE2_STATION_PATTERN.match(cleaned_candidate)
        if match is not None and match.group(1) in display_names:
            return display_names[match.group(1)]

    if INTERNAL_LINE2_STATION_PATTERN.match(clean_station_text(station_name)) is not None and district:
        return f"{district} 예정역"

    return None


def line2_display_name_to_internal_name(
    line2_display_names: dict[str, str],
) -> dict[str, str]:
    aliases: dict[str, str] = {}
    for key, display_name in line2_display_names.items():
        match = INTERNAL_LINE2_STATION_PATTERN.match(key)
        if match is None:
            continue
        aliases[normalize_station_key(display_name)] = key
    return aliases


def line2_identifier_to_internal_name(
    value: object,
    line2_display_names: dict[str, str],
) -> str | None:
    cleaned = clean_station_text(value)
    if not cleaned:
        return None

    if INTERNAL_LINE2_STATION_PATTERN.match(cleaned) is not None:
        return cleaned

    if cleaned in line2_display_names and cleaned.isdigit():
        return f"2호선_{cleaned}"

    return None
