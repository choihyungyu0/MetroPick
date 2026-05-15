from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app


def test_db_health_reports_missing_env(monkeypatch) -> None:
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)

    response = TestClient(app).get("/api/db/health")

    assert response.status_code == 200
    assert response.json() == {
        "connected": False,
        "status": "missing_env",
        "message": "Supabase environment variables are not configured.",
    }


def test_db_health_reports_client_ready(monkeypatch) -> None:
    class FakeClient:
        pass

    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
    monkeypatch.setattr(
        "backend.app.services.supabase_service.create_client",
        lambda url, key: FakeClient(),
    )

    response = TestClient(app).get("/api/db/health")

    assert response.status_code == 200
    assert response.json() == {
        "connected": True,
        "status": "client_ready",
        "message": "Supabase client is configured.",
    }
