# MetroPick AI Public Data Source Inventory

## Purpose

This document maps planned public data sources to MetroPick AI domain models.
It is an implementation guide for converting future CSV, XLSX, JSON, platform,
and OpenAPI responses into typed app data without making page components depend
on provider-specific field names.

## Source priority

| Priority | sourceName | provider | expected format | expected fields | target domain model | target page | integration status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Gwangju Metro Line 2 route and planned station data | Gwangju Metropolitan City / transit planning sources | manual, csv, xlsx | station name, line, phase, opening scenario, latitude, longitude | `StationArea`, `PredictionScenario` | `/dashboard`, `/commercial-analysis`, `/ai-prediction` | needs-verification |
| 2 | Gwangju Big Data Platform | Gwangju Big Data Platform | platform, csv, json | district, commercial area, population indicators, sales indicators | `CommercialAreaMetric`, `LocationRecommendation` | `/dashboard`, `/commercial-analysis`, `/recommendation` | planned |
| 3 | Gwangju transit ridership data | Gwangju Transportation Corporation / Gwangju Metropolitan City | csv, xlsx, open-api | date, station name, line, boarding count, alighting count, time band | transit ridership normalized model, `CommercialAreaMetric` | `/dashboard`, `/ai-prediction` | planned |
| 4 | Gwangju city bus boarding/alighting data | Gwangju Metropolitan City | csv, xlsx, open-api | date, route name, stop name, boarding count, alighting count, time band | bus ridership normalized model, `CommercialAreaMetric` | `/dashboard`, `/commercial-analysis`, `/ai-prediction` | mocked |
| 5 | Commercial store data | Small Enterprise and Market Service / data.go.kr | csv, xlsx | store id, business name, business category, address, latitude, longitude | store normalized model, `CommercialAreaMetric` | `/commercial-analysis`, `/recommendation` | mocked |
| 6 | Business license/open-close data | Local administrative license data sources / data.go.kr | open-api, csv, xlsx | business name, business type, permit date, closure date, status, district, address | business license normalized model, risk factors | `/ai-prediction`, `/report`, `/mypage` | mocked |
| 7 | Commercial growth indicator data | Public commercial analysis datasets / local platforms | csv, xlsx, platform | area id, area name, sales growth, store growth, floating population growth, opening count, closure count | commercial growth normalized model, `LocationRecommendation` | `/dashboard`, `/recommendation`, `/report` | mocked |
| 8 | National urban railway station standard data | Ministry of Land, Infrastructure and Transport / data.go.kr | csv, xlsx, open-api | station id, station name, line, transfer flag, latitude, longitude, operator, address | urban railway station normalized model, `StationArea` | `/onboarding/stations`, `/commercial-analysis` | needs-verification |
