"""FastAPI app for MetroPick AI sample-data services."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers import (
    commercial_analysis,
    db_health,
    prediction,
    profiles,
    recommendation,
    saved_reports,
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://metro-pick.vercel.app",
]

app = FastAPI(
    title="MetroPick AI Backend",
    version="0.1.0",
    description="Sample-data backend for MetroPick AI ML scaffolding.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(commercial_analysis.router)
app.include_router(db_health.router)
app.include_router(prediction.router)
app.include_router(profiles.router)
app.include_router(recommendation.router)
app.include_router(saved_reports.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "data_status": "sample_fixture"}
