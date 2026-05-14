import type { RawBusRidershipDataRow } from '@/shared/types/raw-public-data/rawBusRidershipData'

import { normalizeKoreanText, parseDateLike, toNumber } from './mapperUtils'

export type NormalizedBusRidership = {
  date: string
  routeName: string
  stopName: string
  timeBand: string
  boardingCount: number
  alightingCount: number
  totalCount: number
}

export function mapRawBusRidershipRow(
  row: RawBusRidershipDataRow,
): NormalizedBusRidership {
  const boardingCount = toNumber(row.승차건수)
  const alightingCount = toNumber(row.하차건수)

  return {
    date: parseDateLike(row.기준일자) ?? '',
    routeName: normalizeKoreanText(row.노선명),
    stopName: normalizeKoreanText(row.정류장명),
    timeBand: normalizeKoreanText(row.시간대),
    boardingCount,
    alightingCount,
    totalCount: boardingCount + alightingCount,
  }
}

export function mapRawBusRidershipRows(
  rows: RawBusRidershipDataRow[],
): NormalizedBusRidership[] {
  return rows.map(mapRawBusRidershipRow)
}
