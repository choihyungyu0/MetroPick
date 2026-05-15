from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app


REPORT_ID = "22222222-2222-2222-2222-222222222222"
REPORT = {
    "id": REPORT_ID,
    "user_id": None,
    "report_type": "commercial_analysis",
    "title": "충장로 카페 상권 리포트",
    "station_area": "충장로역",
    "business_type": "카페",
    "payload": {"score": 82, "note": "mock report payload"},
    "created_at": "2026-05-15T00:00:00+00:00",
}


class FakeResponse:
    def __init__(self, data: list[dict[str, object]]) -> None:
        self.data = data


class FakeSavedReportsTable:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows
        self.next_rows = rows
        self.update_payload: dict[str, object] | None = None
        self.delete_requested = False

    def select(self, columns: str) -> "FakeSavedReportsTable":
        assert columns in {"*", "id"}
        self.next_rows = self.rows
        return self

    def order(self, column: str, desc: bool = False) -> "FakeSavedReportsTable":
        assert column == "created_at"
        self.next_rows = sorted(
            self.next_rows,
            key=lambda row: str(row.get(column, "")),
            reverse=desc,
        )
        return self

    def limit(self, count: int) -> "FakeSavedReportsTable":
        self.next_rows = self.next_rows[:count]
        return self

    def insert(self, payload: dict[str, object]) -> "FakeSavedReportsTable":
        self.next_rows = [{**REPORT, **payload}]
        return self

    def update(self, payload: dict[str, object]) -> "FakeSavedReportsTable":
        self.update_payload = payload
        return self

    def delete(self) -> "FakeSavedReportsTable":
        self.delete_requested = True
        return self

    def eq(self, column: str, value: str) -> "FakeSavedReportsTable":
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

    def table(self, name: str) -> FakeSavedReportsTable:
        assert name == "saved_reports"
        return FakeSavedReportsTable(self.rows)


class FailingSupabaseClient:
    def table(self, name: str) -> FakeSavedReportsTable:
        assert name == "saved_reports"
        raise RuntimeError("boom")


def test_saved_reports_list_returns_missing_supabase_fallback(monkeypatch) -> None:
    monkeypatch.setattr("backend.app.routers.saved_reports.get_supabase_client", lambda: None)

    response = TestClient(app).get("/api/saved-reports")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_missing",
        "reports": [],
    }


def test_saved_reports_list_returns_reports(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.saved_reports.get_supabase_client",
        lambda: FakeSupabaseClient([REPORT]),
    )

    response = TestClient(app).get("/api/saved-reports")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_connected",
        "reports": [REPORT],
    }


def test_saved_reports_create_returns_report(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.saved_reports.get_supabase_client",
        lambda: FakeSupabaseClient([]),
    )

    response = TestClient(app).post(
        "/api/saved-reports",
        json={
            "report_type": "commercial_analysis",
            "title": "충장로 카페 상권 리포트",
            "station_area": "충장로역",
            "business_type": "카페",
            "payload": {"score": 82},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "supabase_connected"
    assert body["report"]["id"] == REPORT_ID
    assert body["report"]["report_type"] == "commercial_analysis"
    assert body["report"]["title"] == "충장로 카페 상권 리포트"
    assert body["report"]["payload"] == {"score": 82}


def test_saved_reports_get_not_found(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.saved_reports.get_supabase_client",
        lambda: FakeSupabaseClient([]),
    )

    response = TestClient(app).get(f"/api/saved-reports/{REPORT_ID}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Saved report not found."}


def test_saved_reports_patch_returns_updated_report(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.saved_reports.get_supabase_client",
        lambda: FakeSupabaseClient([REPORT]),
    )

    response = TestClient(app).patch(
        f"/api/saved-reports/{REPORT_ID}",
        json={
            "title": "수정된 상권 리포트",
            "payload": {"score": 90, "status": "updated"},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "supabase_connected"
    assert body["report"]["id"] == REPORT_ID
    assert body["report"]["title"] == "수정된 상권 리포트"
    assert body["report"]["payload"] == {"score": 90, "status": "updated"}


def test_saved_reports_delete_returns_deleted(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.saved_reports.get_supabase_client",
        lambda: FakeSupabaseClient([REPORT]),
    )

    response = TestClient(app).delete(f"/api/saved-reports/{REPORT_ID}")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_connected",
        "deleted": True,
        "id": REPORT_ID,
    }


def test_saved_reports_supabase_exception_returns_safe_error(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.saved_reports.get_supabase_client",
        lambda: FailingSupabaseClient(),
    )

    response = TestClient(app).get("/api/saved-reports")

    assert response.status_code == 502
    assert response.json() == {
        "detail": {
            "data_status": "supabase_error",
            "message": "Supabase saved_reports query failed.",
            "error_type": "RuntimeError",
        },
    }
