from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app


SETTING_ID = "66666666-6666-6666-6666-666666666666"
ONBOARDING_SETTING = {
    "id": SETTING_ID,
    "user_id": None,
    "region": "광주",
    "selected_stations": ["상무역", "금남로4가역"],
    "selected_business_types": ["카페", "음식점"],
    "radius": "500m",
    "notification_settings": {"prediction_updates": True},
    "created_at": "2026-05-15T00:00:00+00:00",
}


class FakeResponse:
    def __init__(self, data: list[dict[str, object]]) -> None:
        self.data = data


class FakeOnboardingSettingsTable:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows
        self.next_rows = rows
        self.update_payload: dict[str, object] | None = None

    def select(self, columns: str) -> "FakeOnboardingSettingsTable":
        assert columns in {"*", "id"}
        self.next_rows = self.rows
        return self

    def order(self, column: str, desc: bool = False) -> "FakeOnboardingSettingsTable":
        assert column == "created_at"
        self.next_rows = sorted(
            self.next_rows,
            key=lambda row: str(row.get(column, "")),
            reverse=desc,
        )
        return self

    def limit(self, count: int) -> "FakeOnboardingSettingsTable":
        self.next_rows = self.next_rows[:count]
        return self

    def insert(self, payload: dict[str, object]) -> "FakeOnboardingSettingsTable":
        self.next_rows = [{**ONBOARDING_SETTING, **payload}]
        return self

    def update(self, payload: dict[str, object]) -> "FakeOnboardingSettingsTable":
        self.update_payload = payload
        return self

    def delete(self) -> "FakeOnboardingSettingsTable":
        return self

    def eq(self, column: str, value: str) -> "FakeOnboardingSettingsTable":
        assert column in {"id", "user_id"}
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

    def table(self, name: str) -> FakeOnboardingSettingsTable:
        assert name == "onboarding_settings"
        return FakeOnboardingSettingsTable(self.rows)


class FailingSupabaseClient:
    def table(self, name: str) -> FakeOnboardingSettingsTable:
        assert name == "onboarding_settings"
        raise RuntimeError("boom")


def test_onboarding_settings_list_returns_missing_supabase_fallback(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.onboarding_settings.get_supabase_client",
        lambda: None,
    )

    response = TestClient(app).get("/api/onboarding-settings")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_missing",
        "settings": [],
    }


def test_onboarding_settings_list_returns_settings(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.onboarding_settings.get_supabase_client",
        lambda: FakeSupabaseClient([ONBOARDING_SETTING]),
    )

    response = TestClient(app).get("/api/onboarding-settings")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_connected",
        "settings": [ONBOARDING_SETTING],
    }


def test_onboarding_settings_list_filters_by_user_id(monkeypatch) -> None:
    other_setting = {**ONBOARDING_SETTING, "id": "other-setting", "user_id": "other-user"}
    user_setting = {**ONBOARDING_SETTING, "user_id": "auth-user-id"}
    monkeypatch.setattr(
        "backend.app.routers.onboarding_settings.get_supabase_client",
        lambda: FakeSupabaseClient([other_setting, user_setting]),
    )

    response = TestClient(app).get("/api/onboarding-settings?user_id=auth-user-id")

    assert response.status_code == 200
    assert response.json()["settings"] == [user_setting]


def test_onboarding_settings_create_returns_setting(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.onboarding_settings.get_supabase_client",
        lambda: FakeSupabaseClient([]),
    )

    response = TestClient(app).post(
        "/api/onboarding-settings",
        json={
            "region": "광주",
            "selected_stations": ["상무역"],
            "selected_business_types": ["카페"],
            "radius": "1km",
            "notification_settings": {"prediction_updates": True},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "supabase_connected"
    assert body["setting"]["id"] == SETTING_ID
    assert body["setting"]["region"] == "광주"
    assert body["setting"]["selected_stations"] == ["상무역"]
    assert body["setting"]["selected_business_types"] == ["카페"]
    assert body["setting"]["radius"] == "1km"
    assert body["setting"]["notification_settings"] == {"prediction_updates": True}


def test_onboarding_settings_get_not_found(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.onboarding_settings.get_supabase_client",
        lambda: FakeSupabaseClient([]),
    )

    response = TestClient(app).get(f"/api/onboarding-settings/{SETTING_ID}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Onboarding settings not found."}


def test_onboarding_settings_patch_returns_updated_setting(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.onboarding_settings.get_supabase_client",
        lambda: FakeSupabaseClient([ONBOARDING_SETTING]),
    )

    response = TestClient(app).patch(
        f"/api/onboarding-settings/{SETTING_ID}",
        json={
            "region": "서울",
            "selected_stations": ["강남역"],
            "selected_business_types": ["편의점"],
            "radius": "750m",
            "notification_settings": {"prediction_updates": False},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "supabase_connected"
    assert body["setting"]["id"] == SETTING_ID
    assert body["setting"]["region"] == "서울"
    assert body["setting"]["selected_stations"] == ["강남역"]
    assert body["setting"]["selected_business_types"] == ["편의점"]
    assert body["setting"]["radius"] == "750m"
    assert body["setting"]["notification_settings"] == {"prediction_updates": False}


def test_onboarding_settings_delete_returns_deleted(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.onboarding_settings.get_supabase_client",
        lambda: FakeSupabaseClient([ONBOARDING_SETTING]),
    )

    response = TestClient(app).delete(f"/api/onboarding-settings/{SETTING_ID}")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_connected",
        "deleted": True,
        "id": SETTING_ID,
    }


def test_onboarding_settings_supabase_exception_returns_safe_error(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.onboarding_settings.get_supabase_client",
        lambda: FailingSupabaseClient(),
    )

    response = TestClient(app).get("/api/onboarding-settings")

    assert response.status_code == 502
    assert response.json() == {
        "detail": {
            "data_status": "supabase_error",
            "message": "Supabase onboarding_settings query failed.",
            "error_type": "RuntimeError",
        },
    }
