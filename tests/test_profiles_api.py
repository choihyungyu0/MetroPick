from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app


PROFILE = {
    "id": "11111111-1111-1111-1111-111111111111",
    "email": "test@example.com",
    "name": "\ud64d\uae38\ub3d9",
    "role": "\uc0c1\uad8c \ubd84\uc11d \uc804\ubb38\uac00",
    "plan": "free",
    "created_at": "2026-05-15T00:00:00+00:00",
}


class FakeResponse:
    def __init__(self, data: list[dict[str, object]]) -> None:
        self.data = data


class FakeProfilesTable:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows
        self.next_rows = rows

    def select(self, columns: str) -> "FakeProfilesTable":
        assert columns == "*"
        self.next_rows = self.rows
        return self

    def limit(self, count: int) -> "FakeProfilesTable":
        self.next_rows = self.next_rows[:count]
        return self

    def upsert(self, payload: dict[str, object], on_conflict: str) -> "FakeProfilesTable":
        assert on_conflict == "email"
        self.next_rows = [{**PROFILE, **payload}]
        return self

    def eq(self, column: str, value: str) -> "FakeProfilesTable":
        assert column == "email"
        self.next_rows = [row for row in self.rows if row.get(column) == value]
        return self

    def execute(self) -> FakeResponse:
        return FakeResponse(self.next_rows)


class FakeSupabaseClient:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows

    def table(self, name: str) -> FakeProfilesTable:
        assert name == "profiles"
        return FakeProfilesTable(self.rows)


class FailingSupabaseClient:
    def table(self, name: str) -> FakeProfilesTable:
        assert name == "profiles"
        raise RuntimeError("boom")


def test_profiles_list_reports_missing_supabase(monkeypatch) -> None:
    monkeypatch.setattr("backend.app.routers.profiles.get_supabase_client", lambda: None)

    response = TestClient(app).get("/api/profiles")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_missing",
        "profiles": [],
    }


def test_profiles_create_returns_profile(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.profiles.get_supabase_client",
        lambda: FakeSupabaseClient([]),
    )

    response = TestClient(app).post(
        "/api/profiles",
        json={
            "email": "test@example.com",
            "name": "\ud64d\uae38\ub3d9",
            "role": "\uc0c1\uad8c \ubd84\uc11d \uc804\ubb38\uac00",
            "plan": "free",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "supabase_connected"
    assert body["profile"]["email"] == "test@example.com"
    assert body["profile"]["name"] == "\ud64d\uae38\ub3d9"
    assert body["profile"]["role"] == "\uc0c1\uad8c \ubd84\uc11d \uc804\ubb38\uac00"
    assert body["profile"]["plan"] == "free"
    assert "id" in body["profile"]
    assert "created_at" in body["profile"]


def test_profiles_list_returns_profiles(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.profiles.get_supabase_client",
        lambda: FakeSupabaseClient([PROFILE]),
    )

    response = TestClient(app).get("/api/profiles")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_connected",
        "profiles": [PROFILE],
    }


def test_profiles_lookup_not_found(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.profiles.get_supabase_client",
        lambda: FakeSupabaseClient([]),
    )

    response = TestClient(app).get("/api/profiles/missing@example.com")

    assert response.status_code == 404
    assert response.json() == {"detail": "Profile not found."}


def test_profiles_supabase_exception_returns_safe_error(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.profiles.get_supabase_client",
        lambda: FailingSupabaseClient(),
    )

    response = TestClient(app).get("/api/profiles")

    assert response.status_code == 502
    assert response.json() == {
        "detail": {
            "data_status": "supabase_error",
            "message": "Supabase profiles query failed.",
            "error_type": "RuntimeError",
        },
    }
