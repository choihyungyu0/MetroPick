from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app
from ml import config


def test_map_data_returns_public_store_csv_when_files_exist() -> None:
    response = TestClient(app).get("/api/commercial-analysis/map-data")

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "public_store_csv"
    assert body["filters"]["radius_m"] == 500
    assert body["route_lines"][0]["line"] == "1호선"
    assert body["route_lines"][1]["line"] == "2호선"
    assert body["station_markers"]
    assert body["density_points"]


def test_map_data_radius_changes_filter_and_selected_circle_radius() -> None:
    response = TestClient(app).get(
        "/api/commercial-analysis/map-data?station_ids=L1_상무&radius_m=300",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "public_store_csv"
    assert body["filters"]["radius_m"] == 300
    assert body["selected_station_circles"][0]["radius_m"] == 300


def test_map_data_business_type_filters_density_points() -> None:
    response = TestClient(app).get(
        "/api/commercial-analysis/map-data?business_type=restaurant",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "public_store_csv"
    assert body["filters"]["business_type_key"] == "restaurant"
    assert body["density_points"]
    assert {point["business_type_key"] for point in body["density_points"]} == {
        "restaurant",
    }


def test_map_data_business_type_keeps_area_distribution_top_five() -> None:
    response = TestClient(app).get(
        "/api/commercial-analysis/map-data?station_ids=L1_상무&business_type=카페/디저트",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["filters"]["business_type_key"] == "cafe"
    assert {point["business_type_key"] for point in body["density_points"]} == {"cafe"}
    assert 1 < len(body["business_distribution"]) <= 5
    assert {item["key"] for item in body["business_distribution"]} != {"cafe"}
    assert all(item["key"] != "etc" for item in body["business_distribution"])
    assert body["summary_cards"][1]["change"] == "카페/디저트"


def test_map_data_ignores_unmatched_station_filter_instead_of_emptying_table() -> None:
    response = TestClient(app).get(
        (
            "/api/commercial-analysis/map-data?"
            "line=광주 2호선 (예정)&"
            "station_ids=양산역,운천역,상무역,금호역,월드컵경기장역&"
            "business_type=카페/디저트"
        ),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "public_store_csv"
    assert body["filters"]["business_type_key"] == "cafe"
    assert body["station_markers"]
    assert body["comparison_rows"]
    assert body["selected_station_circles"] == []
    assert body["summary_cards"][0]["value"] != "0개"


def test_map_data_missing_csv_returns_sample_fixture_fallback(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr(config, "PUBLIC_STORE_SUMMARY_PATH", tmp_path / "missing_summary.csv")
    monkeypatch.setattr(config, "PUBLIC_STORE_CLEAN_PATH", tmp_path / "missing_stores.csv")
    monkeypatch.setattr(
        config,
        "LINE2_STATION_COORDINATES_PATH",
        tmp_path / "missing_line2.csv",
    )
    monkeypatch.setattr(
        config,
        "BUS_STOP_COORDINATES_PATH",
        tmp_path / "missing_bus_stops.csv",
    )

    response = TestClient(app).get("/api/commercial-analysis/map-data?radius_m=300")

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "sample_fixture"
    assert body["filters"]["radius_m"] == 300
    assert body["station_markers"]
