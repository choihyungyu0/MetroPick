"""Train MVP baseline models for station-area startup suitability.

The current target is the deterministic rule-based startup_suitability_score.
Replace this target with real outcomes, such as sales growth or closure rates,
before using the model for production decisions.
"""

from __future__ import annotations

import json

import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.model_selection import train_test_split

from ml import config
from ml.data_loader import load_sample_raw_data
from ml.evaluate import regression_metrics
from ml.feature_engineering import build_station_area_features


def _feature_columns(features: pd.DataFrame) -> list[str]:
    excluded_columns = {"station_id", "station_name", "startup_suitability_score"}
    return [
        column
        for column in features.columns
        if column not in excluded_columns and pd.api.types.is_numeric_dtype(features[column])
    ]


def train_startup_suitability_model() -> dict[str, object]:
    raw_data = load_sample_raw_data()
    features = build_station_area_features(
        raw_data.stores,
        raw_data.bus,
        raw_data.subway,
        raw_data.stations,
        radius_m=config.DEFAULT_RADIUS_M,
    )
    if features.empty:
        raise ValueError("No station-area features were generated from sample data.")

    feature_columns = _feature_columns(features)
    target_column = "startup_suitability_score"
    x = features[feature_columns]
    y = features[target_column]

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.33,
        random_state=42,
    )

    candidate_models = {
        "random_forest": RandomForestRegressor(n_estimators=120, random_state=42),
        "gradient_boosting": GradientBoostingRegressor(random_state=42),
    }

    results: dict[str, dict[str, float]] = {}
    trained_models: dict[str, object] = {}
    for model_name, model in candidate_models.items():
        model.fit(x_train, y_train)
        predictions = model.predict(x_test)
        results[model_name] = regression_metrics(y_test.tolist(), predictions.tolist())
        trained_models[model_name] = model

    best_model_name = min(results, key=lambda name: results[name]["mae"])
    best_model = trained_models[best_model_name]

    config.PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    config.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    features.to_csv(config.STATION_AREA_FEATURES_PATH, index=False)
    joblib.dump(best_model, config.STARTUP_SUITABILITY_MODEL_PATH)
    config.STARTUP_SUITABILITY_FEATURES_PATH.write_text(
        json.dumps(feature_columns, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return {
        "model_version": config.MODEL_VERSION,
        "best_model": best_model_name,
        "metrics": results,
        "feature_columns": feature_columns,
        "processed_features_path": str(config.STATION_AREA_FEATURES_PATH),
        "model_path": str(config.STARTUP_SUITABILITY_MODEL_PATH),
        "target_note": "MVP rule-based target; replace with real sales, growth, or closure outcomes later.",
    }


def main() -> None:
    result = train_startup_suitability_model()
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
