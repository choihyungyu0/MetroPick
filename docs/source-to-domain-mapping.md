# MetroPick AI Source To Domain Mapping

## Store data mapping

| Public data field | App field | Notes |
| --- | --- | --- |
| 상가업소번호 | id | Falls back to `store-${index}` when rows are mapped in a list. |
| 상호명 | storeName | Trimmed Korean text. |
| 상권업종대분류명 | businessCategoryLarge | Trimmed Korean text. |
| 상권업종중분류명 | businessCategoryMedium | Trimmed Korean text. |
| 상권업종소분류명 | businessCategorySmall | Trimmed Korean text. |
| 상권업종코드 | businessTypeCode | Used for later category matching. |
| 시도명 | province | Expected to be `광주광역시` for local analysis. |
| 시군구명 | district | Used for district-level grouping. |
| 법정동명 | legalDong | Used for neighborhood grouping. |
| 도로명주소 | roadAddress | Preferred display address. |
| 지번주소 | lotAddress | Fallback display address. |
| 위도 | latitude | Invalid coordinates become `0`. |
| 경도 | longitude | Invalid coordinates become `0`. |

## Bus ridership mapping

| Public data field | App field | Notes |
| --- | --- | --- |
| 기준일자 | date | Normalized to `YYYY-MM-DD` when possible. |
| 노선명 | routeName | Trimmed text. |
| 정류장명 | stopName | Trimmed text. |
| 시간대 | timeBand | Kept as provider text. |
| 승차건수 | boardingCount | Numeric strings are parsed. |
| 하차건수 | alightingCount | Numeric strings are parsed. |
| 승차건수 + 하차건수 | totalCount | Calculated by mapper. |

## Urban railway station mapping

| Public data field | App field | Notes |
| --- | --- | --- |
| 역번호 | id | Falls back to station and line text if missing. |
| 역사명 | stationName | Trimmed text. |
| 노선명 | lineName | Trimmed text. |
| 환승역여부 | isTransferStation | `Y`, `예`, `true`, or `환승` become `true`. |
| 환승노선명 | transferLineName | Trimmed text. |
| 위도 | latitude | Invalid coordinates become `0`. |
| 경도 | longitude | Invalid coordinates become `0`. |
| 운영기관명 | operatorName | Trimmed text. |
| 도로명주소 | roadAddress | Trimmed text. |
| 데이터기준일자 | dataReferenceDate | Malformed dates become `null`. |

## Commercial growth mapping

| Public data field | App field | Notes |
| --- | --- | --- |
| 상권ID | areaId | Falls back to `commercial-growth-${index}` in list mapping. |
| 상권명 | areaName | Exact source field must be verified against final data. |
| 중심위도 | centerLatitude | Invalid coordinates become `0`. |
| 중심경도 | centerLongitude | Invalid coordinates become `0`. |
| 매출증가율 | salesGrowthRate | Numeric strings and percent strings are parsed. |
| 점포증가율 | storeGrowthRate | Exact source field must be verified. |
| 유동인구증가율 | floatingPopulationGrowthRate | Exact source field must be verified. |
| 개업수 | openingCount | Missing values become `0`. |
| 폐업수 | closureCount | Missing values become `0`. |
| 성장지수 | growthIndex | Used as a future recommendation input. |

## Missing data strategy

- Missing text becomes an empty string.
- Missing numbers become `0`.
- Invalid coordinates become `0`.
- Malformed dates become `null`.
- Mapper functions should not crash the UI. API adapters should call mappers
  before returning domain data to page components.
