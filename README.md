# MetroPick

MetroPick is a responsive React + TypeScript MVP for the 2026 Gwangju Metropolitan City Public Data + AI startup competition.

The concept is an AI-powered commercial district digital twin for Gwangju Metro Line 2 opening scenarios. The current frontend helps small business owners explore mock station-area scenarios for floating population, commercial potential, overcrowding, closure risk, and startup suitability.

## Competition Context

This project targets a public-data-based service proposal for Gwangju. It is intentionally an engineering and UX foundation first: it does not include a production AI model, does not connect to official public data APIs yet, and does not claim real prediction accuracy.

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
npm run build
npm run preview
```

## Vercel API Rewrite

When the frontend is deployed over HTTPS on Vercel, browser requests directly to an
HTTP backend are blocked by mixed content rules. Use the same-origin `/api/*`
rewrite instead.

Set this Vercel environment variable:

```text
METROPICK_BACKEND_ORIGIN=http://YOUR_BACKEND_HOST:8000
```

Then call backend endpoints through the Vercel deployment origin:

```ts
await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
})
```

The browser sends `https://<frontend-domain>/api/v1/auth/login`, and the Vercel
rewrite forwards it to `http://YOUR_BACKEND_HOST:8000/api/v1/auth/login`.

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

## Future Backend/API Plan

1. Replace `src/shared/data/*` mock files with API query functions.
2. Connect Gwangju public data sources for station plans, business registrations, floating population, local sales proxies, closure/opening statistics, and demographic indicators.
3. Move scenario scoring to a documented backend service with versioned inputs and explainable outputs.
4. Add provenance metadata to every recommendation and report sentence.
5. Add API contract tests before enabling production-like scenarios.
