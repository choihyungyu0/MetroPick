import type { RawTransitRidershipDataRow } from '@/shared/types/raw-public-data/rawTransitRidershipData'

import { normalizeKoreanText, parseDateLike, toNumber } from './mapperUtils'

export type NormalizedTransitRidership = {
  date: string
  lineName: string
  stationName: string
  timeBand: string
  boardingCount: number
  alightingCount: number
  totalCount: number
}

export function mapRawTransitRidershipRow(
  row: RawTransitRidershipDataRow,
): NormalizedTransitRidership {
  const boardingCount = toNumber(row.승차건수 ?? row.승차인원)
  const alightingCount = toNumber(row.하차건수 ?? row.하차인원)

  return {
    date: parseDateLike(row.기준일자) ?? '',
    lineName: normalizeKoreanText(row.노선명),
    stationName: normalizeKoreanText(row.역사명 || row.역명),
    timeBand: normalizeKoreanText(row.시간대),
    boardingCount,
    alightingCount,
    totalCount: boardingCount + alightingCount,
  }
}

export function mapRawTransitRidershipRows(
  rows: RawTransitRidershipDataRow[],
): NormalizedTransitRidership[] {
  return rows.map(mapRawTransitRidershipRow)
}
