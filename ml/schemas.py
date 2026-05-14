"""Typed records for sample public-data inputs and derived feature rows."""

from __future__ import annotations

from pydantic import BaseModel, Field


class StoreRecord(BaseModel):
    store_id: str
    store_name: str
    business_large: str
    business_medium: str
    business_small: str
    province: str
    district: str
    dong: str
    road_address: str
    longitude: float
    latitude: float


class BusRidershipRecord(BaseModel):
    date: str
    stop_name: str
    route_name: str
    longitude: float
    latitude: float
    time_band: str
    boarding_count: int = Field(ge=0)
    alighting_count: int = Field(ge=0)


class SubwayRidershipRecord(BaseModel):
    date: str
    station_name: str
    line: str
    time_band: str
    boarding_count: int = Field(ge=0)
    alighting_count: int = Field(ge=0)


class StationAreaRecord(BaseModel):
    station_id: str
    station_name: str
    line: str
    phase: str
    district: str
    longitude: float
    latitude: float
    opening_scenario: str


class StationAreaFeatureRecord(BaseModel):
    station_id: str
    station_name: str
    radius_m: int
    total_store_count: int
    same_business_count_by_type: int
    cafe_count: int
    restaurant_count: int
    convenience_count: int
    pharmacy_count: int
    beauty_count: int
    academy_count: int
    retail_count: int
    business_type_count: int
    business_diversity_index: float
    bus_boarding_count: int
    bus_alighting_count: int
    bus_total_count: int
    nearby_bus_stop_count: int
    subway_pattern_score: float
    competition_index: float
    floating_demand_index: float
    sales_potential_index: float
    closure_risk_index: float
    startup_suitability_score: float
