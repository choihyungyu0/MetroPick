from ml.data_loader import load_sample_raw_data
from ml.feature_engineering import OUTPUT_COLUMNS, build_station_area_features


def test_build_station_area_features_outputs_expected_columns() -> None:
    raw_data = load_sample_raw_data()

    features = build_station_area_features(
        raw_data.stores,
        raw_data.bus,
        raw_data.subway,
        raw_data.stations,
        radius_m=500,
    )

    assert list(features.columns) == OUTPUT_COLUMNS
    assert len(features) == len(raw_data.stations)
    assert features["startup_suitability_score"].between(0, 100).all()
    assert features["total_store_count"].sum() >= 50
