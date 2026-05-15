# Supabase Setup Guide

This backend uses server-side Supabase environment variables only:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Keep these values in `.env`. Do not commit `.env`, and do not add the service role key to any `VITE_` React environment variable.

## Health Check

After configuring `.env`, run the FastAPI backend and verify the Supabase client can initialize:

```bash
GET /api/db/health
```

Expected configured response:

```json
{
  "connected": true,
  "status": "client_ready",
  "message": "Supabase client is configured."
}
```

## Profiles Table Check

After `/api/db/health` succeeds, test the first table read/write path with `profiles`.

List profiles:

```bash
GET /api/profiles
```

Create or update a profile by email:

```bash
POST /api/profiles
Content-Type: application/json

{
  "email": "test@example.com",
  "name": "홍길동",
  "role": "상권 분석 전문가",
  "plan": "free"
}
```

Read a profile by email:

```bash
GET /api/profiles/test@example.com
```

The backend uses the service role key only inside FastAPI. React should continue using local fallback behavior until a public-safe API flow is added.

## Saved reports API

Use these endpoints after the `saved_reports` table is available. These calls are server-side FastAPI requests; do not expose the Supabase service role key to the frontend.

List saved reports:

```bash
curl http://127.0.0.1:8000/api/saved-reports
```

Create a saved report:

```bash
curl -X POST http://127.0.0.1:8000/api/saved-reports \
  -H "Content-Type: application/json" \
  -d '{
    "report_type": "commercial_analysis",
    "title": "충장로 카페 상권 리포트",
    "station_area": "충장로역",
    "business_type": "카페",
    "payload": {
      "source": "localStorage_sync_candidate"
    }
  }'
```

Update a saved report:

```bash
curl -X PATCH http://127.0.0.1:8000/api/saved-reports/<report_id> \
  -H "Content-Type: application/json" \
  -d '{
    "title": "수정된 상권 리포트",
    "payload": {
      "source": "updated_payload"
    }
  }'
```

Delete a saved report:

```bash
curl -X DELETE http://127.0.0.1:8000/api/saved-reports/<report_id>
```

## Saved locations API

Use these endpoints after the `saved_locations` table is available. These calls are server-side FastAPI requests; keep Supabase service credentials on the backend only.

List saved locations:

```bash
curl http://127.0.0.1:8000/api/saved-locations
```

Create a saved location:

```bash
curl -X POST http://127.0.0.1:8000/api/saved-locations \
  -H "Content-Type: application/json" \
  -d '{
    "station_name": "금남로4가역",
    "district": "동구",
    "business_type": "카페",
    "score": 91.5,
    "payload": {
      "source": "localStorage_sync_candidate"
    }
  }'
```

Update a saved location:

```bash
curl -X PATCH http://127.0.0.1:8000/api/saved-locations/<location_id> \
  -H "Content-Type: application/json" \
  -d '{
    "station_name": "수완역",
    "score": 88.0,
    "payload": {
      "source": "updated_payload"
    }
  }'
```

Delete a saved location:

```bash
curl -X DELETE http://127.0.0.1:8000/api/saved-locations/<location_id>
```

## Prediction results API

Use these endpoints after the `prediction_results` table is available. These calls store AI prediction outputs through FastAPI while keeping Supabase service credentials on the backend only.

List prediction results:

```bash
curl http://127.0.0.1:8000/api/prediction-results
```

Create a prediction result:

```bash
curl -X POST http://127.0.0.1:8000/api/prediction-results \
  -H "Content-Type: application/json" \
  -d '{
    "station_area": "상무역(2호선)",
    "business_type": "커피전문점",
    "predicted_score": 83.4,
    "result_payload": {
      "risk_level": "낮음",
      "recommendation_label": "창업 적합도 높음"
    }
  }'
```

Update a prediction result:

```bash
curl -X PATCH http://127.0.0.1:8000/api/prediction-results/<result_id> \
  -H "Content-Type: application/json" \
  -d '{
    "predicted_score": 88.2,
    "result_payload": {
      "risk_level": "보통",
      "source": "updated_payload"
    }
  }'
```

Delete a prediction result:

```bash
curl -X DELETE http://127.0.0.1:8000/api/prediction-results/<result_id>
```

## Notification settings API

Use these endpoints after the `notification_settings` table is available. These calls store notification preferences through FastAPI while keeping Supabase service credentials on the backend only.

List notification settings:

```bash
curl http://127.0.0.1:8000/api/notification-settings
```

Create notification settings:

```bash
curl -X POST http://127.0.0.1:8000/api/notification-settings \
  -H "Content-Type: application/json" \
  -d '{
    "channels": ["push", "email"],
    "frequency": "realtime",
    "quiet_hours": {
      "start": "22:00",
      "end": "08:00"
    },
    "enabled_notifications": [
      "prediction_updates",
      "saved_location_alerts"
    ]
  }'
```

Update notification settings:

```bash
curl -X PATCH http://127.0.0.1:8000/api/notification-settings/<setting_id> \
  -H "Content-Type: application/json" \
  -d '{
    "channels": ["email"],
    "frequency": "daily",
    "enabled_notifications": [
      "prediction_updates"
    ]
  }'
```

Delete notification settings:

```bash
curl -X DELETE http://127.0.0.1:8000/api/notification-settings/<setting_id>
```

## Onboarding settings API

Use these endpoints after the `onboarding_settings` table is available. These calls store onboarding page state through FastAPI while keeping Supabase service credentials on the backend only.

List onboarding settings:

```bash
curl http://127.0.0.1:8000/api/onboarding-settings
```

Create onboarding settings:

```bash
curl -X POST http://127.0.0.1:8000/api/onboarding-settings \
  -H "Content-Type: application/json" \
  -d '{
    "region": "광주",
    "selected_stations": [
      "상무역",
      "금남로4가역"
    ],
    "selected_business_types": [
      "카페",
      "음식점"
    ],
    "radius": "500m",
    "notification_settings": {
      "prediction_updates": true,
      "saved_location_alerts": true
    }
  }'
```

Update onboarding settings:

```bash
curl -X PATCH http://127.0.0.1:8000/api/onboarding-settings/<setting_id> \
  -H "Content-Type: application/json" \
  -d '{
    "region": "서울",
    "selected_stations": [
      "강남역"
    ],
    "radius": "750m",
    "notification_settings": {
      "prediction_updates": false
    }
  }'
```

Delete onboarding settings:

```bash
curl -X DELETE http://127.0.0.1:8000/api/onboarding-settings/<setting_id>
```
