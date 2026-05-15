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


def test_vercel_preview_origin_is_allowed_for_api_preflight() -> None:
    preview_origin = "https://metro-pick-f1z1bh5zq-choihyungyu0s-projects.vercel.app"

    response = TestClient(app).options(
        "/api/commercial-analysis/summary",
        headers={
            "Origin": preview_origin,
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == preview_origin
