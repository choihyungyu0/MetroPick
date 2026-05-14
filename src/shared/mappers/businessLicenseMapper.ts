import type { RawBusinessLicenseDataRow } from '@/shared/types/raw-public-data/rawBusinessLicenseData'

import { normalizeKoreanText, parseDateLike } from './mapperUtils'

export type NormalizedBusinessLicense = {
  id: string
  businessName: string
  businessTypeName: string
  district: string
  roadAddress: string
  permitDate: string | null
  closureDate: string | null
  status: '영업' | '폐업' | '휴업' | '알수없음'
}

function normalizeLicenseStatus(row: RawBusinessLicenseDataRow) {
  const statusText = normalizeKoreanText(
    `${row.영업상태명 ?? ''} ${row.상세영업상태명 ?? ''}`,
  ).toLocaleLowerCase('ko-KR')

  if (statusText.includes('폐업')) {
    return '폐업'
  }

  if (statusText.includes('휴업')) {
    return '휴업'
  }

  if (statusText.includes('영업') || statusText.includes('정상')) {
    return '영업'
  }

  return '알수없음'
}

export function mapRawBusinessLicenseRow(
  row: RawBusinessLicenseDataRow,
): NormalizedBusinessLicense {
  return {
    id: normalizeKoreanText(row.관리번호 || row.인허가번호),
    businessName: normalizeKoreanText(row.사업장명 || row.업소명 || row.상호명),
    businessTypeName: normalizeKoreanText(row.업태구분명 || row.업종명),
    district: normalizeKoreanText(row.시군구명),
    roadAddress: normalizeKoreanText(row.도로명주소 || row.도로명전체주소 || row.소재지전체주소),
    permitDate: parseDateLike(row.인허가일자),
    closureDate: parseDateLike(row.폐업일자),
    status: normalizeLicenseStatus(row),
  }
}

export function mapRawBusinessLicenseRows(
  rows: RawBusinessLicenseDataRow[],
): NormalizedBusinessLicense[] {
  return rows.map((row, index) => {
    const mapped = mapRawBusinessLicenseRow(row)

    return {
      ...mapped,
      id: mapped.id || `business-license-${index}`,
    }
  })
}
