import pandas as pd

from ml.public_store_ingestion import (
    NORMALIZED_STORE_COLUMNS,
    filter_gwangju_stores,
    filter_valid_coordinates,
    normalize_public_store_columns,
)


def test_korean_public_store_columns_are_normalized() -> None:
    source = pd.DataFrame(
        [
            {
                "\uc0c1\uac00\uc5c5\uc18c\ubc88\ud638": "S001",
                "\uc0c1\ud638\uba85": "\ubb34\ub4f1 \ucee4\ud53c",
                "\uc0c1\uad8c\uc5c5\uc885\ub300\ubd84\ub958\uba85": "\uc74c\uc2dd",
                "\uc0c1\uad8c\uc5c5\uc885\uc911\ubd84\ub958\uba85": "\uce74\ud398",
                "\uc2dc\ub3c4\uba85": "\uad11\uc8fc\uad11\uc5ed\uc2dc",
                "\uc2dc\uad70\uad6c\uba85": "\uc11c\uad6c",
                "\ubc95\uc815\ub3d9\uba85": "\uce58\ud3c9\ub3d9",
                "\uc9c0\ubc88\uc8fc\uc18c": "\uad11\uc8fc \uc11c\uad6c \uce58\ud3c9\ub3d9 1",
                "\uacbd\ub3c4": "126.8515",
                "\uc704\ub3c4": "35.1601",
            }
        ]
    )

    normalized = normalize_public_store_columns(source)

    assert list(normalized.columns) == NORMALIZED_STORE_COLUMNS
    assert normalized.loc[0, "store_id"] == "S001"
    assert normalized.loc[0, "store_name"] == "\ubb34\ub4f1 \ucee4\ud53c"
    assert normalized.loc[0, "road_address"] == "\uad11\uc8fc \uc11c\uad6c \uce58\ud3c9\ub3d9 1"
    assert normalized.loc[0, "business_small"] == ""
    assert normalized.loc[0, "longitude"] == 126.8515


def test_gwangju_filter_and_invalid_coordinates_are_applied() -> None:
    stores = pd.DataFrame(
        [
            {
                "store_id": "GJ-1",
                "province": "\uad11\uc8fc\uad11\uc5ed\uc2dc",
                "longitude": 126.8515,
                "latitude": 35.1601,
            },
            {
                "store_id": "SEOUL-1",
                "province": "\uc11c\uc6b8\ud2b9\ubcc4\uc2dc",
                "longitude": 126.9780,
                "latitude": 37.5665,
            },
            {
                "store_id": "GJ-BAD",
                "province": "\uad11\uc8fc\uad11\uc5ed\uc2dc",
                "longitude": 999.0,
                "latitude": 35.1601,
            },
        ]
    )

    gwangju_stores = filter_gwangju_stores(stores)
    valid_stores = filter_valid_coordinates(gwangju_stores)

    assert gwangju_stores["store_id"].tolist() == ["GJ-1", "GJ-BAD"]
    assert valid_stores["store_id"].tolist() == ["GJ-1"]
