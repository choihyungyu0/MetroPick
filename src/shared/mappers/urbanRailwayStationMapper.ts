import type { RawUrbanRailwayStationDataRow } from '@/shared/types/raw-public-data/rawUrbanRailwayStationData'

import {
  isValidCoordinate,
  normalizeKoreanText,
  parseDateLike,
  toNumber,
} from './mapperUtils'

export type NormalizedUrbanRailwayStation = {
  id: string
  stationName: string
  lineName: string
  isTransferStation: boolean
  transferLineName: string
  latitude: number
  longitude: number
  operatorName: string
  roadAddress: string
  dataReferenceDate: string | null
}

function toCoordinate(value: unknown): number {
  const parsed = toNumber(value)

  return isValidCoordinate(parsed) ? parsed : 0
}

function isTransferStation(value: unknown): boolean {
  const normalized = normalizeKoreanText(value).toLocaleLowerCase('ko-KR')

  return (
    normalized.includes('y') ||
    normalized.includes('예') ||
    normalized.includes('true') ||
    normalized.includes('환승')
  )
}

export function mapRawUrbanRailwayStationRow(
  row: RawUrbanRailwayStationDataRow,
): NormalizedUrbanRailwayStation {
  const stationName = normalizeKoreanText(row.역사명)
  const lineName = normalizeKoreanText(row.노선명)

  return {
    id: normalizeKoreanText(row.역번호) || `${lineName}-${stationName}`,
    stationName,
    lineName,
    isTransferStation: isTransferStation(row.환승역여부),
    transferLineName: normalizeKoreanText(row.환승노선명),
    latitude: toCoordinate(row.위도),
    longitude: toCoordinate(row.경도),
    operatorName: normalizeKoreanText(row.운영기관명),
    roadAddress: normalizeKoreanText(row.도로명주소),
    dataReferenceDate: parseDateLike(row.데이터기준일자),
  }
}

export function mapRawUrbanRailwayStationRows(
  rows: RawUrbanRailwayStationDataRow[],
): NormalizedUrbanRailwayStation[] {
  return rows.map(mapRawUrbanRailwayStationRow)
}
