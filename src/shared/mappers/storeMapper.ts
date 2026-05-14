import type { RawStoreDataRow } from '@/shared/types/raw-public-data/rawStoreData'

import { isValidCoordinate, normalizeKoreanText, toNumber } from './mapperUtils'

export type NormalizedStore = {
  id: string
  storeName: string
  businessCategoryLarge: string
  businessCategoryMedium: string
  businessCategorySmall: string
  businessTypeCode: string
  province: string
  district: string
  legalDong: string
  roadAddress: string
  lotAddress: string
  latitude: number
  longitude: number
}

function toCoordinate(value: unknown): number {
  const parsed = toNumber(value)

  return isValidCoordinate(parsed) ? parsed : 0
}

export function mapRawStoreRow(row: RawStoreDataRow): NormalizedStore {
  return {
    id: normalizeKoreanText(row.상가업소번호),
    storeName: normalizeKoreanText(row.상호명),
    businessCategoryLarge: normalizeKoreanText(row.상권업종대분류명),
    businessCategoryMedium: normalizeKoreanText(row.상권업종중분류명),
    businessCategorySmall: normalizeKoreanText(row.상권업종소분류명),
    businessTypeCode: normalizeKoreanText(row.상권업종코드),
    province: normalizeKoreanText(row.시도명),
    district: normalizeKoreanText(row.시군구명),
    legalDong: normalizeKoreanText(row.법정동명),
    roadAddress: normalizeKoreanText(row.도로명주소),
    lotAddress: normalizeKoreanText(row.지번주소),
    latitude: toCoordinate(row.위도),
    longitude: toCoordinate(row.경도),
  }
}

export function mapRawStoreRows(rows: RawStoreDataRow[]): NormalizedStore[] {
  return rows.map((row, index) => {
    const mapped = mapRawStoreRow(row)

    return {
      ...mapped,
      id: mapped.id || `store-${index}`,
    }
  })
}
