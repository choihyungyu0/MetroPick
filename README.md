# MetroPick

MetroPick is a responsive React + TypeScript MVP for the 2026 Gwangju Metropolitan City Public Data + AI startup competition.

The concept is an AI-powered commercial district digital twin for Gwangju Metro Line 2 opening scenarios. The current frontend helps small business owners explore mock station-area scenarios for floating population, commercial potential, overcrowding, closure risk, and startup suitability.

## Competition Context

This project targets a public-data-based service proposal for Gwangju. It is intentionally an engineering and UX foundation first: it does not include a production AI model, does not connect to official public data APIs yet, and does not claim real prediction accuracy.

## MVP Demo Guide

MetroPick AI is a connected React + TypeScript + Vite MVP for the 2026 Gwangju public data + AI competition. It demonstrates a deterministic public-data scenario workflow for commercial district changes after the planned Gwangju Metro Line 2 opening.

Demo user flow:

1. Open `/`.
2. Continue through `/login` or `/signup`.
3. Complete onboarding at `/onboarding`, `/onboarding/stations`, `/onboarding/business-type`, and `/onboarding/notifications`.
4. Land on `/dashboard`.
5. Explore `/commercial-analysis`, `/ai-prediction`, `/recommendation`, `/report`, and `/mypage`.

Routes:

- `/`
- `/login`
- `/signup`
- `/onboarding`
- `/onboarding/stations`
- `/onboarding/business-type`
- `/onboarding/notifications`
- `/dashboard`
- `/commercial-analysis`
- `/ai-prediction`
- `/recommendation`
- `/report`
- `/mypage`

Local storage keys:

- `metropick-authenticated`
- `metropick-user`
- `metropick-onboarding-stations`
- `metropick-onboarding-business-types`
- `metropick-onboarding-notifications`
- `metropick-onboarding-completed`
- `metropick-onboarding-summary`
- `metropick-ai-prediction-results`
- `metropick-saved-commercial-analysis-reports`
- `metropick-saved-interest-locations`
- `metropick-current-report`
- `metropick-selected-recommendation`

Local asset folders:

- `public/assets/landing/`
- `public/assets/login/`
- `public/assets/signup/`
- `public/assets/onboarding/`
- `public/assets/dashboard/`
- `public/assets/commercial-analysis/`
- `public/assets/ai-prediction/`
- `public/assets/recommendation/`
- `public/assets/report/`

Mock data disclaimer:

본 결과는 공공데이터 기반 시나리오 예측 결과이며, 실제 매출이나 창업 성과를 보장하지 않습니다.

Public data integration plan:

- Replace mock data adapters with Gwangju Big Data Platform and `data.go.kr` sources.
- Normalize transit ridership, commercial store, business license/open-close, and commercial growth datasets in adapter modules.
- Keep API keys and signing on a backend or proxy layer.
- Add provenance metadata to predictions, recommendations, and reports before any production-like use.

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Zod
- Recharts
- React Leaflet / Leaflet
- Vitest
- React Testing Library
- Playwright
- ESLint
- Prettier

## Folder Structure

```text
src/
  app/                  App composition, router, providers
  pages/                Route-level screens
  features/             Domain feature modules
  shared/
    components/         Reusable UI components
    data/               Typed mock data
    lib/                Small shared utilities
    types/              Zod schemas and inferred types
    test/               Test setup
tests/e2e/              Playwright specs
```

## Local Development

```bash
npm install
npm run dev
npm run test
npm run build
npm run validate
npm run preview
```

## Frontend and FastAPI local integration

Create a local frontend environment file:

```bash
# .env.local
VITE_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Do not put real public data API keys in frontend env files. `VITE_` variables
are visible in browser bundles.

Terminal 1:

```bash
python -m ml.train_startup_suitability
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2:

```bash
npm run dev
```

The FastAPI backend currently uses sample fixture data from `data/raw`. The
frontend attempts to use the local backend first and falls back to existing mock
data when the backend is unavailable. No real public data APIs or API keys are
connected yet.

## Vercel Routing

The app uses React Router with browser history, so Vercel rewrites all unmatched
paths to `/index.html`. Keep `vercel.json` as a static configuration file with a
`destination` value on every rewrite entry.

When a production backend is connected later, add an explicit `/api/:path*`
rewrite with the backend origin as the `destination`. Do not leave the
destination dynamic or undefined, because Vercel validates the rewrite schema
before deployment.

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run e2e
npm run validate
```

`npm run validate` runs linting, TypeScript checking, unit/component tests, and the production build.

## Mock Data Disclaimer

All station-area metrics, recommendation scores, charts, report text, and map markers are realistic mock placeholders. They are suitable for MVP demos and UX validation only. They must not be presented as actual revenue forecasts, official station-area predictions, or final public-data analysis.

## Data and API Layer

The current app uses typed mock data under `src/shared/data`. Mock API adapters
under `src/shared/api` return Promises from those datasets and provide the
future integration boundary for public data sources. TanStack Query hooks are
available under `src/shared/api/hooks`.

The public data integration plan is documented in
`docs/data-integration-plan.md`. MVP persistence still uses localStorage keys
for saved reports, prediction runs, and interest locations. Real public API
integration is future work and should be handled through the adapter layer, not
directly from page components.

## Public data mapper layer

Expected raw public data row types live under
`src/shared/types/raw-public-data`. Mapper functions live under
`src/shared/mappers` and convert provider-shaped rows into domain-friendly
objects with safe fallbacks for missing text, numbers, coordinates, and dates.

Small fixture examples live under `src/shared/api/fixtures`, and
`src/shared/api/publicDataMapperApi.ts` demonstrates mapping those local mock
rows without calling external APIs. Future real API integration should fetch
data through a backend or proxy, pass raw rows through these mapper functions,
and return typed app data from the existing adapter layer.

Do not put real public data service keys in frontend code. `VITE_` variables are
visible in browser bundles and must not be used for secrets.

## Future Backend/API Plan

1. Replace `src/shared/data/*` mock files with API query functions.
2. Connect Gwangju public data sources for station plans, business registrations, floating population, local sales proxies, closure/opening statistics, and demographic indicators.
3. Move scenario scoring to a documented backend service with versioned inputs and explainable outputs.
4. Add provenance metadata to every recommendation and report sentence.
5. Add API contract tests before enabling production-like scenarios.
