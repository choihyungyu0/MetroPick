"""Deterministic baseline scoring for station-area startup suitability."""

from __future__ import annotations

from collections.abc import Sequence

import numpy as np
import pandas as pd

NumericInput = float | int | Sequence[float] | np.ndarray | pd.Series


def _as_series(values: NumericInput) -> pd.Series:
    if isinstance(values, pd.Series):
        return pd.to_numeric(values, errors="coerce").fillna(0.0).astype(float)
    if isinstance(values, np.ndarray):
        return pd.Series(values, dtype="float64").fillna(0.0)
    if isinstance(values, Sequence) and not isinstance(values, str):
        return pd.Series(list(values), dtype="float64").fillna(0.0)
    return pd.Series([values], dtype="float64").fillna(0.0)


def _clamp_0_100(values: pd.Series) -> pd.Series:
    return values.clip(lower=0.0, upper=100.0)


def normalize_minmax(series: NumericInput) -> pd.Series:
    values = _as_series(series)
    if values.empty:
        return values

    min_value = values.min()
    max_value = values.max()
    if np.isclose(max_value, min_value):
        return pd.Series(50.0, index=values.index)
    return ((values - min_value) / (max_value - min_value) * 100.0).clip(0.0, 100.0)


def calculate_competition_index(
    total_store_count: NumericInput,
    business_type_count: NumericInput,
    same_business_count_by_type: NumericInput,
) -> pd.Series:
    total_score = normalize_minmax(total_store_count)
    breadth_score = normalize_minmax(business_type_count)
    same_type_score = normalize_minmax(same_business_count_by_type)
    return _clamp_0_100((0.55 * total_score) + (0.10 * breadth_score) + (0.35 * same_type_score))


def calculate_floating_demand_index(
    bus_total_count: NumericInput,
    nearby_bus_stop_count: NumericInput,
    subway_pattern_score: NumericInput,
) -> pd.Series:
    bus_score = normalize_minmax(bus_total_count)
    stop_score = normalize_minmax(nearby_bus_stop_count)
    subway_score = normalize_minmax(subway_pattern_score)
    return _clamp_0_100((0.65 * bus_score) + (0.20 * stop_score) + (0.15 * subway_score))


def calculate_sales_potential_index(
    floating_demand_index: NumericInput,
    business_diversity_index: NumericInput,
    competition_index: NumericInput,
) -> pd.Series:
    floating = _as_series(floating_demand_index)
    diversity = _as_series(business_diversity_index)
    competition = _as_series(competition_index)
    return _clamp_0_100((0.50 * floating) + (0.30 * diversity) + (0.20 * (100.0 - competition)))


def calculate_closure_risk_index(
    competition_index: NumericInput,
    floating_demand_index: NumericInput,
    business_diversity_index: NumericInput,
) -> pd.Series:
    competition = _as_series(competition_index)
    floating = _as_series(floating_demand_index)
    diversity = _as_series(business_diversity_index)
    return _clamp_0_100((0.55 * competition) + (0.25 * (100.0 - floating)) + (0.20 * (100.0 - diversity)))


def calculate_startup_suitability_score(
    floating_demand_index: NumericInput,
    sales_potential_index: NumericInput,
    accessibility_score: NumericInput,
    business_diversity_index: NumericInput,
    competition_index: NumericInput,
    closure_risk_index: NumericInput,
) -> pd.Series:
    floating = _as_series(floating_demand_index)
    sales = _as_series(sales_potential_index)
    accessibility = _as_series(accessibility_score)
    diversity = _as_series(business_diversity_index)
    competition = _as_series(competition_index)
    closure_risk = _as_series(closure_risk_index)

    score = (
        (0.30 * floating)
        + (0.25 * sales)
        + (0.15 * accessibility)
        + (0.10 * diversity)
        - (0.15 * competition)
        - (0.05 * closure_risk)
    )
    return _clamp_0_100(score)
