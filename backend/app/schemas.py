"""API schemas for the sample-data MetroPick AI backend."""

from __future__ import annotations

from pydantic import BaseModel, Field


class StartupSuitabilityInput(BaseModel):
    radius_m: float = Field(default=500.0, ge=0)
    total_store_count: float = Field(default=0.0, ge=0)
    same_business_count_by_type: float = Field(default=0.0, ge=0)
    cafe_count: float = Field(default=0.0, ge=0)
    restaurant_count: float = Field(default=0.0, ge=0)
    convenience_count: float = Field(default=0.0, ge=0)
    pharmacy_count: float = Field(default=0.0, ge=0)
    beauty_count: float = Field(default=0.0, ge=0)
    academy_count: float = Field(default=0.0, ge=0)
    retail_count: float = Field(default=0.0, ge=0)
    business_type_count: float = Field(default=0.0, ge=0)
    business_diversity_index: float = Field(default=50.0, ge=0, le=100)
    bus_boarding_count: float = Field(default=0.0, ge=0)
    bus_alighting_count: float = Field(default=0.0, ge=0)
    bus_total_count: float = Field(default=0.0, ge=0)
    nearby_bus_stop_count: float = Field(default=0.0, ge=0)
    subway_pattern_score: float = Field(default=50.0, ge=0, le=100)
    competition_index: float = Field(default=50.0, ge=0, le=100)
    floating_demand_index: float = Field(default=50.0, ge=0, le=100)
    sales_potential_index: float = Field(default=50.0, ge=0, le=100)
    closure_risk_index: float = Field(default=50.0, ge=0, le=100)
    accessibility_score: float = Field(default=50.0, ge=0, le=100)

    class Config:
        extra = "ignore"

    def to_feature_dict(self) -> dict[str, object]:
        if hasattr(self, "model_dump"):
            return self.model_dump()
        return self.dict()


class StartupSuitabilityResponse(BaseModel):
    predicted_score: float
    risk_level: str
    recommendation_label: str
    top_reasons: list[str]


class ProfileCreate(BaseModel):
    email: str = Field(min_length=1)
    name: str = Field(min_length=1)
    role: str = Field(min_length=1)
    plan: str = Field(default="free", min_length=1)


class ProfileResponse(ProfileCreate):
    id: str
    created_at: str


class SavedReportCreate(BaseModel):
    report_type: str
    title: str
    station_area: str | None = None
    business_type: str | None = None
    payload: dict[str, object] = Field(default_factory=dict)


class SavedReportUpdate(BaseModel):
    title: str | None = None
    station_area: str | None = None
    business_type: str | None = None
    payload: dict[str, object] | None = None


class SavedReportResponse(BaseModel):
    id: str
    user_id: str | None = None
    report_type: str
    title: str
    station_area: str | None = None
    business_type: str | None = None
    payload: dict[str, object] = Field(default_factory=dict)
    created_at: str


class SavedReportListResponse(BaseModel):
    data_status: str
    reports: list[SavedReportResponse]
