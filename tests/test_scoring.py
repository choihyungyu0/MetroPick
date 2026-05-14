import pandas as pd

from ml.scoring import (
    calculate_closure_risk_index,
    calculate_competition_index,
    calculate_floating_demand_index,
    calculate_sales_potential_index,
    calculate_startup_suitability_score,
    normalize_minmax,
)


def test_normalize_minmax_returns_expected_range() -> None:
    values = normalize_minmax(pd.Series([10, 20, 30]))

    assert values.min() == 0
    assert values.max() == 100


def test_normalize_minmax_constant_series_returns_midpoint() -> None:
    values = normalize_minmax(pd.Series([5, 5, 5]))

    assert values.tolist() == [50.0, 50.0, 50.0]


def test_scoring_outputs_are_clamped_to_zero_to_one_hundred() -> None:
    competition = calculate_competition_index(
        pd.Series([2, 10, 25]),
        pd.Series([1, 5, 8]),
        pd.Series([1, 3, 12]),
    )
    floating = calculate_floating_demand_index(
        pd.Series([100, 800, 1500]),
        pd.Series([1, 4, 8]),
        pd.Series([30, 60, 90]),
    )
    sales = calculate_sales_potential_index(floating, pd.Series([30, 70, 95]), competition)
    closure = calculate_closure_risk_index(competition, floating, pd.Series([30, 70, 95]))
    suitability = calculate_startup_suitability_score(
        floating,
        sales,
        pd.Series([40, 60, 90]),
        pd.Series([30, 70, 95]),
        competition,
        closure,
    )

    for output in [competition, floating, sales, closure, suitability]:
        assert output.between(0, 100).all()
