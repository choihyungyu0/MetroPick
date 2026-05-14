"""Shared paths and constants for the MetroPick AI ML scaffold."""

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODEL_DIR = DATA_DIR / "models"

STORE_SAMPLE_PATH = RAW_DATA_DIR / "stores" / "sample_gwangju_store_data.csv"
BUS_SAMPLE_PATH = RAW_DATA_DIR / "transit" / "sample_bus_ridership.csv"
SUBWAY_SAMPLE_PATH = RAW_DATA_DIR / "subway" / "sample_subway_ridership.csv"
STATION_AREAS_PATH = RAW_DATA_DIR / "station_areas" / "gwangju_station_areas.csv"
PUBLIC_STORE_RAW_DIR = RAW_DATA_DIR / "public_store_data"
PUBLIC_STORE_PROCESSED_DIR = PROCESSED_DATA_DIR / "public_store_data"
PUBLIC_STORE_SUMMARY_PATH = PUBLIC_STORE_PROCESSED_DIR / "station_area_store_summary.csv"

STATION_AREA_FEATURES_PATH = PROCESSED_DATA_DIR / "station_area_features.csv"
STARTUP_SUITABILITY_MODEL_PATH = MODEL_DIR / "startup_suitability_model.joblib"
STARTUP_SUITABILITY_FEATURES_PATH = MODEL_DIR / "startup_suitability_features.json"

DEFAULT_RADIUS_M = 500
MODEL_VERSION = "mvp-rule-target-v0"
