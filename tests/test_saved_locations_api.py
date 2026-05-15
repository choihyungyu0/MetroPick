from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app


LOCATION_ID = "33333333-3333-3333-3333-333333333333"
LOCATION = {
    "id": LOCATION_ID,
    "user_id": None,
    "station_name": "금남로4가역",
    "district": "동구",
    "business_type": "카페",
    "score": 91.5,
    "payload": {"rank": 1, "note": "mock location payload"},
    "created_at": "2026-05-15T00:00:00+00:00",
}


class FakeResponse:
    def __init__(self, data: list[dict[str, object]]) -> None:
        self.data = data


class FakeSavedLocationsTable:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows
        self.next_rows = rows
        self.update_payload: dict[str, object] | None = None

    def select(self, columns: str) -> "FakeSavedLocationsTable":
        assert columns in {"*", "id"}
        self.next_rows = self.rows
        return self

    def order(self, column: str, desc: bool = False) -> "FakeSavedLocationsTable":
        assert column == "created_at"
        self.next_rows = sorted(
            self.next_rows,
            key=lambda row: str(row.get(column, "")),
            reverse=desc,
        )
        return self

    def limit(self, count: int) -> "FakeSavedLocationsTable":
        self.next_rows = self.next_rows[:count]
        return self

    def insert(self, payload: dict[str, object]) -> "FakeSavedLocationsTable":
        self.next_rows = [{**LOCATION, **payload}]
        return self

    def update(self, payload: dict[str, object]) -> "FakeSavedLocationsTable":
        self.update_payload = payload
        return self

    def delete(self) -> "FakeSavedLocationsTable":
        return self

    def eq(self, column: str, value: str) -> "FakeSavedLocationsTable":
        assert column == "id"
        matched_rows = [row for row in self.rows if row.get(column) == value]
        if self.update_payload is not None:
            self.next_rows = [{**row, **self.update_payload} for row in matched_rows]
        else:
            self.next_rows = matched_rows
        return self

    def execute(self) -> FakeResponse:
        return FakeResponse(self.next_rows)


class FakeSupabaseClient:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows

    def table(self, name: str) -> FakeSavedLocationsTable:
        assert name == "saved_locations"
        return FakeSavedLocationsTable(self.rows)


class FailingSupabaseClient:
    def table(self, name: str) -> FakeSavedLocationsTable:
        assert name == "saved_locations"
        raise RuntimeError("boom")


def test_saved_locations_list_returns_missing_supabase_fallback(monkeypatch) -> None:
    monkeypatch.setattr("backend.app.routers.saved_locations.get_supabase_client", lambda: None)

    response = TestClient(app).get("/api/saved-locations")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_missing",
        "locations": [],
    }


def test_saved_locations_list_returns_locations(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.saved_locations.get_supabase_client",
        lambda: FakeSupabaseClient([LOCATION]),
    )

    response = TestClient(app).get("/api/saved-locations")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_connected",
        "locations": [LOCATION],
    }


def test_saved_locations_create_returns_location(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.saved_locations.get_supabase_client",
        lambda: FakeSupabaseClient([]),
    )

    response = TestClient(app).post(
        "/api/saved-locations",
        json={
            "station_name": "금남로4가역",
            "district": "동구",
            "business_type": "카페",
            "score": 91.5,
            "payload": {"rank": 1},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "supabase_connected"
    assert body["location"]["id"] == LOCATION_ID
    assert body["location"]["station_name"] == "금남로4가역"
    assert body["location"]["business_type"] == "카페"
    assert body["location"]["score"] == 91.5
    assert body["location"]["payload"] == {"rank": 1}


def test_saved_locations_get_not_found(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.saved_locations.get_supabase_client",
        lambda: FakeSupabaseClient([]),
    )

    response = TestClient(app).get(f"/api/saved-locations/{LOCATION_ID}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Saved location not found."}


def test_saved_locations_patch_returns_updated_location(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.saved_locations.get_supabase_client",
        lambda: FakeSupabaseClient([LOCATION]),
    )

    response = TestClient(app).patch(
        f"/api/saved-locations/{LOCATION_ID}",
        json={
            "station_name": "수완역",
            "score": 88.0,
            "payload": {"rank": 2, "status": "updated"},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "supabase_connected"
    assert body["location"]["id"] == LOCATION_ID
    assert body["location"]["station_name"] == "수완역"
    assert body["location"]["score"] == 88.0
    assert body["location"]["payload"] == {"rank": 2, "status": "updated"}


def test_saved_locations_delete_returns_deleted(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.saved_locations.get_supabase_client",
        lambda: FakeSupabaseClient([LOCATION]),
    )

    response = TestClient(app).delete(f"/api/saved-locations/{LOCATION_ID}")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_connected",
        "deleted": True,
        "id": LOCATION_ID,
    }


def test_saved_locations_supabase_exception_returns_safe_error(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.saved_locations.get_supabase_client",
        lambda: FailingSupabaseClient(),
    )

    response = TestClient(app).get("/api/saved-locations")

    assert response.status_code == 502
    assert response.json() == {
        "detail": {
            "data_status": "supabase_error",
            "message": "Supabase saved_locations query failed.",
            "error_type": "RuntimeError",
        },
    }
