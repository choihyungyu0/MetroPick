from __future__ import annotations

import pytest

from ml import config
from ml.data_loader import load_processed_station_area_features


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


def test_load_processed_station_area_features_reports_missing_required_columns(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path,
) -> None:
    features_path = tmp_path / "station_area_features.csv"
    features_path.write_text("station_id,station_name\nGJ-S001,Sample Station", encoding="utf-8")
    monkeypatch.setattr(config, "STATION_AREA_FEATURES_PATH", features_path)

    with pytest.raises(ValueError, match="missing required columns"):
        load_processed_station_area_features(validate_required_columns=True)
