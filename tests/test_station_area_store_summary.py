import pandas as pd

from ml.station_area_store_summary import (
    STORE_SUMMARY_COLUMNS,
    build_station_area_store_summary,
)


def _stations() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "station_id": "GJ-S001",
                "station_name": "\uc2dc\uccad\uc5ed",
                "longitude": 126.8515,
                "latitude": 35.1601,
            },
            {
                "station_id": "GJ-S002",
                "station_name": "\ub0a8\uad11\uc8fc\uc5ed",
                "longitude": 126.9210,
                "latitude": 35.1400,
            },
        ]
    )


def test_station_area_store_summary_counts_categories() -> None:
    stores = pd.DataFrame(
        [
            {
                "store_id": "CAFE-1",
                "store_name": "\ucee4\ud53c\ubc14",
                "business_large": "\uc74c\uc2dd",
                "business_medium": "\uce74\ud398",
                "business_small": "\ucee4\ud53c",
                "longitude": 126.8515,
                "latitude": 35.1601,
            },
            {
                "store_id": "FOOD-1",
                "store_name": "\ud55c\uc2dd\ub2f9",
                "business_large": "\uc74c\uc2dd",
                "business_medium": "\ud55c\uc2dd",
                "business_small": "\ubc31\ubc18",
                "longitude": 126.8517,
                "latitude": 35.1602,
            },
            {
                "store_id": "SHOP-1",
                "store_name": "\ud3b8\uc758\uc810",
                "business_large": "\uc18c\ub9e4",
                "business_medium": "\ud3b8\uc758\uc810",
                "business_small": "",
                "longitude": 126.8514,
                "latitude": 35.1600,
            },
            {
                "store_id": "PHARMACY-1",
                "store_name": "\uc57d\uad6d",
                "business_large": "\uc758\ub8cc",
                "business_medium": "\uc57d\uad6d",
                "business_small": "",
                "longitude": 126.8516,
                "latitude": 35.1600,
            },
            {
                "store_id": "BEAUTY-1",
                "store_name": "\ud5e4\uc5b4\uc0f5",
                "business_large": "\uc11c\ube44\uc2a4",
                "business_medium": "\ubbf8\uc6a9",
                "business_small": "",
                "longitude": 126.8516,
                "latitude": 35.1602,
            },
            {
                "store_id": "ACADEMY-1",
                "store_name": "\ud559\uc6d0",
                "business_large": "\uad50\uc721",
                "business_medium": "\ud559\uc6d0",
                "business_small": "",
                "longitude": 126.8515,
                "latitude": 35.1603,
            },
            {
                "store_id": "RETAIL-1",
                "store_name": "\uc758\ub958 \uc18c\ub9e4\uc810",
                "business_large": "\uc18c\ub9e4",
                "business_medium": "\uc758\ub958",
                "business_small": "",
                "longitude": 126.8515,
                "latitude": 35.1604,
            },
        ]
    )

    summary = build_station_area_store_summary(stores, _stations(), radius_m=500)
    first_station = summary[summary["station_id"] == "GJ-S001"].iloc[0]

    assert list(summary.columns) == STORE_SUMMARY_COLUMNS
    assert first_station["total_store_count"] == 7
    assert first_station["cafe_count"] == 1
    assert first_station["restaurant_count"] == 1
    assert first_station["convenience_count"] == 1
    assert first_station["pharmacy_count"] == 1
    assert first_station["beauty_count"] == 1
    assert first_station["academy_count"] == 1
    assert first_station["retail_count"] == 1
    assert first_station["business_type_count"] == 7
    assert 0 <= first_station["competition_index"] <= 100
    assert 0 <= first_station["business_diversity_index"] <= 100


def test_empty_store_summary_does_not_crash() -> None:
    stores = pd.DataFrame(columns=["store_id", "longitude", "latitude", "business_medium"])

    summary = build_station_area_store_summary(stores, _stations(), radius_m=500)

    assert list(summary.columns) == STORE_SUMMARY_COLUMNS
    assert summary["total_store_count"].tolist() == [0, 0]
    assert summary["competition_index"].tolist() == [0.0, 0.0]
