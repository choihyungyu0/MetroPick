import pandas as pd

from ml.geo_utils import assign_rows_to_station_areas, haversine_distance_m, is_within_radius


def test_haversine_distance_for_same_point_is_zero() -> None:
    distance = haversine_distance_m(35.1601, 126.8515, 35.1601, 126.8515)

    assert distance == 0


def test_is_within_radius_for_nearby_point() -> None:
    assert is_within_radius(35.1601, 126.8515, 35.1605, 126.8518, 80)
    assert not is_within_radius(35.1601, 126.8515, 35.1700, 126.8515, 80)


def test_assign_rows_to_station_areas_filters_by_radius() -> None:
    rows = pd.DataFrame(
        [
            {"row_id": "near", "latitude": 35.1602, "longitude": 126.8516},
            {"row_id": "far", "latitude": 35.1900, "longitude": 126.9000},
        ]
    )
    stations = pd.DataFrame(
        [
            {
                "station_id": "GJ-S001",
                "station_name": "시청역",
                "latitude": 35.1601,
                "longitude": 126.8515,
            }
        ]
    )

    assigned = assign_rows_to_station_areas(rows, stations, radius_m=500)

    assert assigned["row_id"].tolist() == ["near"]
    assert assigned["station_id"].tolist() == ["GJ-S001"]
