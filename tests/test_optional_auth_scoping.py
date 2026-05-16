from __future__ import annotations

from dataclasses import dataclass
from importlib import import_module
from typing import Any

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


AUTH_USER_ID = "verified-user-id"
CLIENT_USER_ID = "client-supplied-user-id"
OTHER_USER_ID = "other-user-id"


@dataclass(frozen=True)
class ResourceCase:
    base_row: dict[str, object]
    create_payload: dict[str, object]
    endpoint: str
    item_key: str
    list_key: str
    router_module: str
    table_name: str


RESOURCE_CASES = [
    ResourceCase(
        base_row={
            "id": "report-id",
            "user_id": None,
            "report_type": "commercial_analysis",
            "title": "충장로 카페 상권 리포트",
            "station_area": "충장로역",
            "business_type": "카페",
            "payload": {},
            "created_at": "2026-05-15T00:00:00+00:00",
        },
        create_payload={
            "report_type": "commercial_analysis",
            "title": "충장로 카페 상권 리포트",
            "user_id": CLIENT_USER_ID,
        },
        endpoint="/api/saved-reports",
        item_key="report",
        list_key="reports",
        router_module="backend.app.routers.saved_reports",
        table_name="saved_reports",
    ),
    ResourceCase(
        base_row={
            "id": "location-id",
            "user_id": None,
            "station_name": "금남로4가역",
            "district": "동구",
            "business_type": "카페",
            "score": 91.5,
            "payload": {},
            "created_at": "2026-05-15T00:00:00+00:00",
        },
        create_payload={
            "station_name": "금남로4가역",
            "user_id": CLIENT_USER_ID,
        },
        endpoint="/api/saved-locations",
        item_key="location",
        list_key="locations",
        router_module="backend.app.routers.saved_locations",
        table_name="saved_locations",
    ),
    ResourceCase(
        base_row={
            "id": "prediction-result-id",
            "user_id": None,
            "station_area": "상무역(2호선)",
            "business_type": "커피전문점",
            "predicted_score": 83.4,
            "result_payload": {},
            "created_at": "2026-05-15T00:00:00+00:00",
        },
        create_payload={
            "station_area": "상무역(2호선)",
            "user_id": CLIENT_USER_ID,
        },
        endpoint="/api/prediction-results",
        item_key="result",
        list_key="results",
        router_module="backend.app.routers.prediction_results",
        table_name="prediction_results",
    ),
    ResourceCase(
        base_row={
            "id": "notification-setting-id",
            "user_id": None,
            "channels": ["email"],
            "frequency": "daily",
            "quiet_hours": {},
            "enabled_notifications": ["report"],
            "created_at": "2026-05-15T00:00:00+00:00",
        },
        create_payload={
            "channels": ["email"],
            "user_id": CLIENT_USER_ID,
        },
        endpoint="/api/notification-settings",
        item_key="setting",
        list_key="settings",
        router_module="backend.app.routers.notification_settings",
        table_name="notification_settings",
    ),
    ResourceCase(
        base_row={
            "id": "onboarding-setting-id",
            "user_id": None,
            "region": "광주광역시",
            "selected_stations": ["충장로역"],
            "selected_business_types": ["카페"],
            "radius": "500m",
            "notification_settings": {},
            "created_at": "2026-05-15T00:00:00+00:00",
        },
        create_payload={
            "region": "광주광역시",
            "user_id": CLIENT_USER_ID,
        },
        endpoint="/api/onboarding-settings",
        item_key="setting",
        list_key="settings",
        router_module="backend.app.routers.onboarding_settings",
        table_name="onboarding_settings",
    ),
]


class FakeResponse:
    def __init__(self, data: list[dict[str, object]]) -> None:
        self.data = data


class FakeTable:
    def __init__(self, base_row: dict[str, object], rows: list[dict[str, object]]) -> None:
        self.base_row = base_row
        self.next_rows = rows
        self.rows = rows

    def select(self, columns: str) -> "FakeTable":
        assert columns == "*"
        self.next_rows = self.rows
        return self

    def insert(self, payload: dict[str, object]) -> "FakeTable":
        self.next_rows = [{**self.base_row, **payload}]
        return self

    def eq(self, column: str, value: str) -> "FakeTable":
        assert column == "user_id"
        self.next_rows = [row for row in self.rows if row.get(column) == value]
        return self

    def order(self, column: str, desc: bool = False) -> "FakeTable":
        assert column == "created_at"
        self.next_rows = sorted(
            self.next_rows,
            key=lambda row: str(row.get(column, "")),
            reverse=desc,
        )
        return self

    def limit(self, count: int) -> "FakeTable":
        self.next_rows = self.next_rows[:count]
        return self

    def execute(self) -> FakeResponse:
        return FakeResponse(self.next_rows)


class FakeDataClient:
    def __init__(self, case: ResourceCase, rows: list[dict[str, object]]) -> None:
        self.case = case
        self.rows = rows

    def table(self, name: str) -> FakeTable:
        assert name == self.case.table_name
        return FakeTable(self.case.base_row, self.rows)


class FakeAuth:
    def __init__(self, *, fail: bool = False) -> None:
        self.fail = fail

    def get_user(self, token: str) -> object:
        if self.fail:
            raise RuntimeError("private server auth verification failed")
        assert token == "valid-token"
        return {
            "user": {
                "id": AUTH_USER_ID,
                "email": "founder@metropick.ai",
            },
        }


class FakeAuthClient:
    def __init__(self, *, fail: bool = False) -> None:
        self.auth = FakeAuth(fail=fail)


def patch_clients(
    monkeypatch: pytest.MonkeyPatch,
    case: ResourceCase,
    rows: list[dict[str, object]],
    *,
    auth_fails: bool = False,
) -> None:
    router_module = import_module(case.router_module)
    monkeypatch.setattr(
        router_module,
        "get_supabase_client",
        lambda: FakeDataClient(case, rows),
    )
    monkeypatch.setattr(
        "backend.app.dependencies.auth.get_supabase_client",
        lambda: FakeAuthClient(fail=auth_fails),
    )


@pytest.mark.parametrize("case", RESOURCE_CASES)
def test_valid_auth_user_overrides_client_user_id_on_create(
    monkeypatch: pytest.MonkeyPatch,
    case: ResourceCase,
) -> None:
    patch_clients(monkeypatch, case, [])

    response = TestClient(app).post(
        case.endpoint,
        headers={"Authorization": "Bearer valid-token"},
        json=case.create_payload,
    )

    assert response.status_code == 200
    item = response.json()[case.item_key]
    assert item["user_id"] == AUTH_USER_ID


@pytest.mark.parametrize("case", RESOURCE_CASES)
def test_valid_auth_user_overrides_query_user_id_on_list(
    monkeypatch: pytest.MonkeyPatch,
    case: ResourceCase,
) -> None:
    auth_row = {**case.base_row, "user_id": AUTH_USER_ID}
    client_row = {**case.base_row, "id": "client-row", "user_id": CLIENT_USER_ID}
    other_row = {**case.base_row, "id": "other-row", "user_id": OTHER_USER_ID}
    patch_clients(monkeypatch, case, [client_row, auth_row, other_row])

    response = TestClient(app).get(
        f"{case.endpoint}?user_id={CLIENT_USER_ID}",
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    assert response.json()[case.list_key] == [auth_row]


def test_missing_authorization_keeps_client_user_id_for_mvp(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    case = RESOURCE_CASES[0]
    patch_clients(monkeypatch, case, [])

    response = TestClient(app).post(case.endpoint, json=case.create_payload)

    assert response.status_code == 200
    assert response.json()[case.item_key]["user_id"] == CLIENT_USER_ID


def test_invalid_auth_token_returns_safe_401(monkeypatch: pytest.MonkeyPatch) -> None:
    case = RESOURCE_CASES[0]
    patch_clients(monkeypatch, case, [], auth_fails=True)

    response = TestClient(app).post(
        case.endpoint,
        headers={"Authorization": "Bearer invalid-token-value"},
        json=case.create_payload,
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid authentication token."}
    assert "invalid-token-value" not in response.text
    assert "private server auth" not in response.text
