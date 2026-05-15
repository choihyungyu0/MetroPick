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
