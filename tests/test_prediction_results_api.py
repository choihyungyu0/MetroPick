from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app


RESULT_ID = "44444444-4444-4444-4444-444444444444"
PREDICTION_RESULT = {
    "id": RESULT_ID,
    "user_id": None,
    "station_area": "상무역(2호선)",
    "business_type": "커피전문점",
    "predicted_score": 83.4,
    "result_payload": {
        "risk_level": "낮음",
        "recommendation_label": "창업 적합도 높음",
    },
    "created_at": "2026-05-15T00:00:00+00:00",
}


class FakeResponse:
    def __init__(self, data: list[dict[str, object]]) -> None:
        self.data = data


class FakePredictionResultsTable:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows
        self.next_rows = rows
        self.update_payload: dict[str, object] | None = None

    def select(self, columns: str) -> "FakePredictionResultsTable":
        assert columns in {"*", "id"}
        self.next_rows = self.rows
        return self

    def order(self, column: str, desc: bool = False) -> "FakePredictionResultsTable":
        assert column == "created_at"
        self.next_rows = sorted(
            self.next_rows,
            key=lambda row: str(row.get(column, "")),
            reverse=desc,
        )
        return self

    def limit(self, count: int) -> "FakePredictionResultsTable":
        self.next_rows = self.next_rows[:count]
        return self

    def insert(self, payload: dict[str, object]) -> "FakePredictionResultsTable":
        self.next_rows = [{**PREDICTION_RESULT, **payload}]
        return self

    def update(self, payload: dict[str, object]) -> "FakePredictionResultsTable":
        self.update_payload = payload
        return self

    def delete(self) -> "FakePredictionResultsTable":
        return self

    def eq(self, column: str, value: str) -> "FakePredictionResultsTable":
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

    def table(self, name: str) -> FakePredictionResultsTable:
        assert name == "prediction_results"
        return FakePredictionResultsTable(self.rows)


class FailingSupabaseClient:
    def table(self, name: str) -> FakePredictionResultsTable:
        assert name == "prediction_results"
        raise RuntimeError("boom")


def test_prediction_results_list_returns_missing_supabase_fallback(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.prediction_results.get_supabase_client",
        lambda: None,
    )

    response = TestClient(app).get("/api/prediction-results")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_missing",
        "results": [],
    }


def test_prediction_results_list_returns_results(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.prediction_results.get_supabase_client",
        lambda: FakeSupabaseClient([PREDICTION_RESULT]),
    )

    response = TestClient(app).get("/api/prediction-results")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_connected",
        "results": [PREDICTION_RESULT],
    }


def test_prediction_results_list_filters_by_user_id(monkeypatch) -> None:
    other_result = {**PREDICTION_RESULT, "id": "other-result", "user_id": "other-user"}
    user_result = {**PREDICTION_RESULT, "user_id": "auth-user-id"}
    monkeypatch.setattr(
        "backend.app.routers.prediction_results.get_supabase_client",
        lambda: FakeSupabaseClient([other_result, user_result]),
    )

    response = TestClient(app).get("/api/prediction-results?user_id=auth-user-id")

    assert response.status_code == 200
    assert response.json()["results"] == [user_result]


def test_prediction_results_create_returns_result(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.prediction_results.get_supabase_client",
        lambda: FakeSupabaseClient([]),
    )

    response = TestClient(app).post(
        "/api/prediction-results",
        json={
            "station_area": "상무역(2호선)",
            "business_type": "커피전문점",
            "predicted_score": 83.4,
            "result_payload": {"risk_level": "낮음"},
            "user_id": "auth-user-id",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "supabase_connected"
    assert body["result"]["id"] == RESULT_ID
    assert body["result"]["station_area"] == "상무역(2호선)"
    assert body["result"]["business_type"] == "커피전문점"
    assert body["result"]["predicted_score"] == 83.4
    assert body["result"]["result_payload"] == {"risk_level": "낮음"}
    assert body["result"]["user_id"] == "auth-user-id"


def test_prediction_results_get_not_found(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.prediction_results.get_supabase_client",
        lambda: FakeSupabaseClient([]),
    )

    response = TestClient(app).get(f"/api/prediction-results/{RESULT_ID}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Prediction result not found."}


def test_prediction_results_patch_returns_updated_result(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.prediction_results.get_supabase_client",
        lambda: FakeSupabaseClient([PREDICTION_RESULT]),
    )

    response = TestClient(app).patch(
        f"/api/prediction-results/{RESULT_ID}",
        json={
            "predicted_score": 88.2,
            "result_payload": {"risk_level": "보통", "status": "updated"},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data_status"] == "supabase_connected"
    assert body["result"]["id"] == RESULT_ID
    assert body["result"]["predicted_score"] == 88.2
    assert body["result"]["result_payload"] == {
        "risk_level": "보통",
        "status": "updated",
    }


def test_prediction_results_delete_returns_deleted(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.prediction_results.get_supabase_client",
        lambda: FakeSupabaseClient([PREDICTION_RESULT]),
    )

    response = TestClient(app).delete(f"/api/prediction-results/{RESULT_ID}")

    assert response.status_code == 200
    assert response.json() == {
        "data_status": "supabase_connected",
        "deleted": True,
        "id": RESULT_ID,
    }


def test_prediction_results_supabase_exception_returns_safe_error(monkeypatch) -> None:
    monkeypatch.setattr(
        "backend.app.routers.prediction_results.get_supabase_client",
        lambda: FailingSupabaseClient(),
    )

    response = TestClient(app).get("/api/prediction-results")

    assert response.status_code == 502
    assert response.json() == {
        "detail": {
            "data_status": "supabase_error",
            "message": "Supabase prediction_results query failed.",
            "error_type": "RuntimeError",
        },
    }
