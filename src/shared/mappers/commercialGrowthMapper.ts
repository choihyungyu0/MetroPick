import type { RawCommercialGrowthDataRow } from '@/shared/types/raw-public-data/rawCommercialGrowthData'

import { isValidCoordinate, normalizeKoreanText, toNumber } from './mapperUtils'

export type NormalizedCommercialGrowth = {
  areaId: string
  areaName: string
  centerLatitude: number
  centerLongitude: number
  salesGrowthRate: number
  storeGrowthRate: number
  floatingPopulationGrowthRate: number
  openingCount: number
  closureCount: number
  growthIndex: number
}

function toCoordinate(value: unknown): number {
  const parsed = toNumber(value)

  return isValidCoordinate(parsed) ? parsed : 0
}

export function mapRawCommercialGrowthRow(
  row: RawCommercialGrowthDataRow,
): NormalizedCommercialGrowth {
  return {
    areaId: normalizeKoreanText(row.상권ID),
    areaName: normalizeKoreanText(row.상권명 || row.영역명),
    centerLatitude: toCoordinate(row.중심위도 ?? row.위도),
    centerLongitude: toCoordinate(row.중심경도 ?? row.경도),
    salesGrowthRate: toNumber(row.매출증가율),
    storeGrowthRate: toNumber(row.점포증가율),
    floatingPopulationGrowthRate: toNumber(row.유동인구증가율),
    openingCount: toNumber(row.개업수),
    closureCount: toNumber(row.폐업수),
    growthIndex: toNumber(row.성장지수),
  }
}

export function mapRawCommercialGrowthRows(
  rows: RawCommercialGrowthDataRow[],
): NormalizedCommercialGrowth[] {
  return rows.map((row, index) => {
    const mapped = mapRawCommercialGrowthRow(row)

    return {
      ...mapped,
      areaId: mapped.areaId || `commercial-growth-${index}`,
    }
  })
}
