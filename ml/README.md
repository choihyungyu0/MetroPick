# MetroPick AI ML Scaffold

This directory contains the sample-first data pipeline and machine-learning scaffold for MetroPick AI.

## Current Status

- The current model is an MVP baseline.
- The current target is `startup_suitability_score`, a deterministic rule-based score generated from sample fixtures.
- The current pipeline does not call real external APIs and does not use API keys.
- The saved model should not be treated as a validated prediction model or used to claim real-world accuracy.

## Data Flow

1. Load sample CSV fixtures from `data/raw`.
2. Assign stores and transit stops to station areas with a haversine radius search.
3. Build station-area features in `ml.feature_engineering`.
4. Generate deterministic baseline scores in `ml.scoring`.
5. Train baseline regressors against the rule-based target.
6. Save processed features and the best MVP model under `data/processed` and `data/models`.

## Future Target

Replace the current rule-based target with real public or licensed outcomes later, such as:

- Store sales growth by station area and business type
- New opening and closure rates
- Commercial rent and vacancy changes
- Footfall or card-spend changes after Line 2 opening phases

## Train

```bash
python -m ml.train_startup_suitability
```

This writes:

- `data/processed/station_area_features.csv`
- `data/models/startup_suitability_model.joblib`
- `data/models/startup_suitability_features.json`

## Run Tests

```bash
python -m pytest
```

## Run Backend

```bash
uvicorn backend.app.main:app --reload
```

Sample endpoints:

- `GET /health`
- `GET /api/commercial-analysis/summary`
- `GET /api/recommendations`
- `POST /api/prediction/startup-suitability`

The backend currently returns sample-data outputs only.
