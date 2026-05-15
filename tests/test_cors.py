from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app


def test_vercel_origin_is_allowed_for_api_preflight() -> None:
    response = TestClient(app).options(
        "/api/recommendations?limit=5",
        headers={
            "Origin": "https://metro-pick.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://metro-pick.vercel.app"
