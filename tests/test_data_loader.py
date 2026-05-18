from __future__ import annotations

import pytest

from ml import config
from ml.data_loader import (
    STATION_AREA_SCHEMA_NORMALIZATION_ATTR,
    load_processed_station_area_features,
)


def test_load_processed_station_area_features_normalizes_v2_aliases(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path,
) -> None:
    features_path = tmp_path / "station_area_features.csv"
    features_path.write_text(
        "\n".join(
            [
                (
                    "station id,station name,radius,score,store_count,"
                    "competition_score,demand_index,bus_stop_count,"
                    "bus_boarding,bus_alighting,bus_total"
                ),
                "GJ-S001,Sample Station,500,75.5,12,32.1,68.2,4,100,120,220",
            ],
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(config, "STATION_AREA_FEATURES_PATH", features_path)

    features = load_processed_station_area_features(validate_required_columns=True)

    assert features.loc[0, "station_id"] == "GJ-S001"
    assert features.loc[0, "startup_suitability_score"] == 75.5
    assert features.loc[0, "nearby_bus_stop_count"] == 4
    assert features.loc[0, "bus_total_count"] == 220


def test_load_processed_station_area_features_normalizes_korean_v2_aliases(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path,
) -> None:
    features_path = tmp_path / "station_area_features.csv"
    features_path.write_text(
        "\n".join(
            [
                (
                    "station_id,station_name,분석반경,창업적합도점수,총점포수,"
                    "경쟁도,잠재유동수요지수,정류장수,승차수,하차수,총승하차수"
                ),
                "GJ-S001,상무역,500,81.2,18,44.1,72.3,6,130,140,270",
            ],
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(config, "STATION_AREA_FEATURES_PATH", features_path)

    features = load_processed_station_area_features(validate_required_columns=True)

    assert features.loc[0, "radius_m"] == 500
    assert features.loc[0, "startup_suitability_score"] == 81.2
    assert features.loc[0, "total_store_count"] == 18
    assert features.loc[0, "competition_index"] == 44.1
    assert features.loc[0, "floating_demand_index"] == 72.3
    assert features.loc[0, "nearby_bus_stop_count"] == 6
    assert features.loc[0, "bus_total_count"] == 270


def test_load_processed_station_area_features_derives_safe_v2_defaults(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path,
) -> None:
    features_path = tmp_path / "station_area_features.csv"
    features_path.write_text(
        "\n".join(
            [
                (
                    "station_id,station_name,business_count,"
                    "nearby_bus_stop_count,administrative_floating_population"
                ),
                "L1_001,Station A,10,2,1000",
                "L1_002,Station B,30,8,3000",
            ],
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(config, "STATION_AREA_FEATURES_PATH", features_path)

    with pytest.warns(UserWarning, match="derived/default columns"):
        features = load_processed_station_area_features(validate_required_columns=True)

    assert features.loc[0, "radius_m"] == config.DEFAULT_RADIUS_M
    assert features.loc[0, "bus_boarding_count"] == 0
    assert features.loc[0, "bus_alighting_count"] == 0
    assert features.loc[0, "bus_total_count"] == 0
    assert features.loc[1, "total_store_count"] == 30
    assert features["floating_demand_index"].between(0, 100).all()
    assert features["competition_index"].between(0, 100).all()
    assert features["startup_suitability_score"].between(0, 100).all()

    details = features.attrs[STATION_AREA_SCHEMA_NORMALIZATION_ATTR]
    assert details["derived_columns"]["total_store_count"].startswith("Derived from")
    assert "startup_suitability_score" in details["derived_columns"]
    assert details["defaulted_columns"]["radius_m"].startswith("Defaulted")


def test_load_processed_station_area_features_reads_cp949_fallback(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path,
) -> None:
    features_path = tmp_path / "station_area_features.csv"
    features_path.write_text(
        "\n".join(
            [
                (
                    "station_id,station_name,반경,창업적합도,점포수,"
                    "경쟁지수,유동수요지수,버스정류장수,버스승차수,버스하차수,버스총승하차수"
                ),
                "GJ-S001,상무역,500,70.5,9,21.0,60.0,3,10,20,30",
            ],
        ),
        encoding="cp949",
    )
    monkeypatch.setattr(config, "STATION_AREA_FEATURES_PATH", features_path)

    features = load_processed_station_area_features(validate_required_columns=True)

    assert features.loc[0, "startup_suitability_score"] == 70.5
    assert features.attrs[STATION_AREA_SCHEMA_NORMALIZATION_ATTR]["encoding"] == "cp949"


def test_load_processed_station_area_features_reports_missing_required_columns(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path,
) -> None:
    features_path = tmp_path / "station_area_features.csv"
    features_path.write_text("station_id,station_name\nGJ-S001,Sample Station", encoding="utf-8")
    monkeypatch.setattr(config, "STATION_AREA_FEATURES_PATH", features_path)

    with pytest.raises(ValueError, match="missing required columns"):
        load_processed_station_area_features(validate_required_columns=True)
