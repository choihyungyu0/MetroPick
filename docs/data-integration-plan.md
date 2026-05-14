# MetroPick AI Data Integration Plan

## Purpose

MetroPick AI currently uses typed mock data for the MVP experience. The mock
layer exists so page components can be developed and reviewed before real public
data APIs are connected. Later integration work should replace adapter internals
without forcing page-level redesigns or direct public API calls from React
components.

## Planned public data sources

- Gwangju Big Data Platform
- data.go.kr OpenAPI and file data
- Gwangju transit ridership data
- Commercial store data
- Business license/open-close data
- Commercial growth indicator data

## Expected fields

Station:

- station name
- line
- latitude
- longitude
- phase
- opening scenario

Transit:

- date
- station or stop name
- boarding count
- alighting count
- time band

Commercial store:

- business name
- business type
- address
- latitude
- longitude
- open/close status

Business license:

- business type
- permit date
- closure date
- district

Prediction:

- station area
- business type
- scenario
- score
- confidence
- risk factors

## Current mock files

- `src/shared/data/mockStations.ts`
- `src/shared/data/mockBusinessTypes.ts`
- `src/shared/data/mockCommercialAreas.ts`
- `src/shared/data/mockPredictions.ts`
- `src/shared/data/mockRecommendations.ts`
- `src/shared/data/mockReports.ts`
- `src/shared/data/mockNotifications.ts`
- `src/shared/data/publicDataSources.ts`

## API adapter strategy

Page and feature components should read from `src/shared/api/*` functions or
query hooks instead of importing public API URLs directly. The API files
currently return typed mock data with a small artificial delay. Real public data
integration should replace only the adapter internals and keep the public
function contracts stable where possible.

Page components should not directly call `data.go.kr` URLs or platform-specific
endpoints. Keep request signing, pagination normalization, provenance metadata,
and caching inside adapter or backend layers.

## Mapper layer

Raw public data rows are mapped through `src/shared/mappers` before they become
domain-friendly app data. Page components should not directly depend on Korean
public data field names such as `상호명`, `승차건수`, or `역사명`.

API adapters should call mapper functions before returning data to features or
pages. The current fixture files under `src/shared/api/fixtures` are mock
examples only; they are not official public data and should be replaced or
supplemented only after real source schemas are verified.

## Security note

Do not place real API secrets in frontend code. Vite client environment
variables with the `VITE_` prefix are exposed to browser code. Real public data
service keys should eventually be handled by a backend or proxy server.

## AI prediction disclaimer

본 결과는 공공데이터 기반 시나리오 예측 결과이며, 실제 매출이나 창업 성과를 보장하지 않습니다.

## Page dataset mapping

- Dashboard: station setup, transit ridership trends, commercial growth indicators, saved reports, notification settings.
- Commercial analysis: station metadata, commercial store density, floating population, sales proxy indicators, business type taxonomy.
- AI prediction: station metadata, selected business type, ridership scenarios, commercial growth indicators, prediction result history.
- Recommendation: station metadata, business type taxonomy, store density, competition score inputs, saved interest locations.
- Report: selected recommendation, latest prediction result, station metadata, commercial map snapshots, current report storage.
- My Page: saved reports, saved interest locations, prediction result history, notification settings, mock user profile.

## Future adapter contracts

- `src/shared/api/stationApi.ts`: Gwangju Metro Line 2 station metadata and opening scenario fields.
- `src/shared/api/commercialAnalysisApi.ts`: commercial store, sales proxy, floating population, and density metrics.
- `src/shared/api/predictionApi.ts`: deterministic scenario prediction payloads until a production model is approved.
- `src/shared/api/recommendationApi.ts`: ranked station-area recommendation results with explainable score breakdowns.
- `src/shared/api/reportApi.ts`: saved report summaries and current report snapshots.
