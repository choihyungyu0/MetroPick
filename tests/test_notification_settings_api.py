from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app


SETTING_ID = "55555555-5555-5555-5555-555555555555"
NOTIFICATION_SETTING = {
    "id": SETTING_ID,
    "user_id": None,
    "channels": ["push", "email"],
    "frequency": "daily",
    "quiet_hours": {"start": "22:00", "end": "08:00"},
    "enabled_notifications": ["prediction_updates", "saved_location_alerts"],
    "created_at": "2026-05-15T00:00:00+00:00",
}


class FakeResponse:
    def __init__(self, data: list[dict[str, object]]) -> None:
        self.data = data


class FakeNotificationSettingsTable:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows
        self.next_rows = rows
        self.update_payload: dict[str, object] | None = None

    def select(self, columns: str) -> "FakeNotificationSettingsTable":
        assert columns in {"*", "id"}
        self.next_rows = self.rows
        return self

    def order(self, column: str, desc: bool = False) -> "FakeNotificationSettingsTable":
        assert column == "created_at"
        self.next_rows = sorted(
            self.next_rows,
            key=lambda row: str(row.get(column, "")),
            reverse=desc,
        )
        return self

    def limit(self, count: int) -> "FakeNotificationSettingsTable":
        self.next_rows = self.next_rows[:count]
        return self

    def insert(self, payload: dict[str, object]) -> "FakeNotificationSettingsTable":
        self.next_rows = [{**NOTIFICATION_SETTING, **payload}]
        return self

    def update(self, payload: dict[str, object]) -> "FakeNotificationSettingsTable":
        self.update_payload = payload
        return self

    def delete(self) -> "FakeNotificationSettingsTable":
        return self

    def eq(self, column: str, value: str) -> "FakeNotificationSettingsTable":
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

    def table(self, name: str) -> FakeNotificationSettingsTable:
        assert name == "notification_settings"
        return FakeNotificationSettingsTable(self.rows)


class FailingSupabaseClient:
    def table(self, name: str) -> FakeNotificationSettingsTable:
        assert name == "notification_settings"
        raise RuntimeError("boom")


def test_notification_settings_list_returns_missing_supabase_fallback(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.notification_settings.get_supabase_client",
        lambda: None,
    )

    response = TestClient(app).get("/api/notification-settings")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_missing",
        "settings": [],
    }


def test_notification_settings_list_returns_settings(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.notification_settings.get_supabase_client",
        lambda: FakeSupabaseClient([NOTIFICATION_SETTING]),
    )

    response = TestClient(app).get("/api/notification-settings")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_connected",
        "settings": [NOTIFICATION_SETTING],
    }


def test_notification_settings_list_filters_by_user_id(monkeypatch) -> None:
    other_setting = {**NOTIFICATION_SETTING, "id": "other-setting", "user_id": "other-user"}
    user_setting = {**NOTIFICATION_SETTING, "user_id": "auth-user-id"}
    monkeypatch.setattr(
        "backend.app.routers.notification_settings.get_supabase_client",
        lambda: FakeSupabaseClient([other_setting, user_setting]),
    )

    response = TestClient(app).get("/api/notification-settings?user_id=auth-user-id")

    assert response.status_code == 200
    assert response.json()["settings"] == [user_setting]


def test_notification_settings_create_returns_setting(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.notification_settings.get_supabase_client",
        lambda: FakeSupabaseClient([]),
    )

    response = TestClient(app).post(
        "/api/notification-settings",
        json={
            "channels": ["push"],
            "frequency": "realtime",
            "quiet_hours": {"start": "23:00", "end": "07:00"},
            "enabled_notifications": ["prediction_updates"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "supabase_connected"
    assert body["setting"]["id"] == SETTING_ID
    assert body["setting"]["channels"] == ["push"]
    assert body["setting"]["frequency"] == "realtime"
    assert body["setting"]["quiet_hours"] == {"start": "23:00", "end": "07:00"}
    assert body["setting"]["enabled_notifications"] == ["prediction_updates"]


def test_notification_settings_get_not_found(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.notification_settings.get_supabase_client",
        lambda: FakeSupabaseClient([]),
    )

    response = TestClient(app).get(f"/api/notification-settings/{SETTING_ID}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Notification settings not found."}


def test_notification_settings_patch_returns_updated_setting(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.notification_settings.get_supabase_client",
        lambda: FakeSupabaseClient([NOTIFICATION_SETTING]),
    )

    response = TestClient(app).patch(
        f"/api/notification-settings/{SETTING_ID}",
        json={
            "channels": ["email"],
            "frequency": "weekly",
            "enabled_notifications": ["saved_location_alerts"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "supabase_connected"
    assert body["setting"]["id"] == SETTING_ID
    assert body["setting"]["channels"] == ["email"]
    assert body["setting"]["frequency"] == "weekly"
    assert body["setting"]["enabled_notifications"] == ["saved_location_alerts"]


def test_notification_settings_delete_returns_deleted(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.notification_settings.get_supabase_client",
        lambda: FakeSupabaseClient([NOTIFICATION_SETTING]),
    )

    response = TestClient(app).delete(f"/api/notification-settings/{SETTING_ID}")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_connected",
        "deleted": True,
        "id": SETTING_ID,
    }


def test_notification_settings_supabase_exception_returns_safe_error(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.notification_settings.get_supabase_client",
        lambda: FailingSupabaseClient(),
    )

    response = TestClient(app).get("/api/notification-settings")

    assert response.status_code == 502
    assert response.json() == {
        "detail": {
            "data_status": "supabase_error",
            "message": "Supabase notification_settings query failed.",
            "error_type": "RuntimeError",
        },
    }
