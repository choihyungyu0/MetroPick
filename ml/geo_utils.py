"""Lightweight geospatial utilities that do not require geopandas."""

from __future__ import annotations

from math import asin, cos, isfinite, radians, sin, sqrt

import pandas as pd

EARTH_RADIUS_M = 6_371_000


def _safe_float(value: object) -> float | None:
    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return None
    if not isfinite(numeric_value):
        return None
    return numeric_value


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return the great-circle distance between two WGS84 points in meters."""

    safe_lat1 = _safe_float(lat1)
    safe_lon1 = _safe_float(lon1)
    safe_lat2 = _safe_float(lat2)
    safe_lon2 = _safe_float(lon2)
    if None in (safe_lat1, safe_lon1, safe_lat2, safe_lon2):
        return float("inf")

    phi1 = radians(safe_lat1)
    phi2 = radians(safe_lat2)
    delta_phi = radians(safe_lat2 - safe_lat1)
    delta_lambda = radians(safe_lon2 - safe_lon1)

    a = sin(delta_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(delta_lambda / 2) ** 2
    c = 2 * asin(sqrt(a))
    return EARTH_RADIUS_M * c


def is_within_radius(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
    radius_m: float,
) -> bool:
    return haversine_distance_m(lat1, lon1, lat2, lon2) <= radius_m


def assign_rows_to_station_areas(
    rows_df: pd.DataFrame,
    stations_df: pd.DataFrame,
    radius_m: float = 500,
    lat_col: str = "latitude",
    lon_col: str = "longitude",
    station_lat_col: str = "latitude",
    station_lon_col: str = "longitude",
) -> pd.DataFrame:
    """Assign rows to every station area within the requested radius."""

    assignment_rows: list[dict[str, object]] = []
    if rows_df.empty or stations_df.empty:
        return pd.DataFrame(
            columns=[
                *rows_df.columns,
                "source_index",
                "station_id",
                "station_name",
                "station_distance_m",
            ]
        )

    for station in stations_df.to_dict(orient="records"):
        station_latitude = station.get(station_lat_col)
        station_longitude = station.get(station_lon_col)
        station_id = str(station.get("station_id", ""))
        station_name = str(station.get("station_name", ""))

        for source_index, row in rows_df.iterrows():
            distance_m = haversine_distance_m(
                row.get(lat_col),
                row.get(lon_col),
                station_latitude,
                station_longitude,
            )
            if distance_m <= radius_m:
                assigned_row = row.to_dict()
                assigned_row["source_index"] = str(source_index)
                assigned_row["station_id"] = station_id
                assigned_row["station_name"] = station_name
                assigned_row["station_distance_m"] = round(distance_m, 2)
                assignment_rows.append(assigned_row)

    return pd.DataFrame(assignment_rows)
