import { describe, expect, it } from 'vitest'

import { mapRawUrbanRailwayStationRow } from './urbanRailwayStationMapper'

describe('urbanRailwayStationMapper', () => {
  it('maps station metadata and parses transfer flags', () => {
    const station = mapRawUrbanRailwayStationRow({
      역번호: 'GJ-TRANSFER',
      역사명: '백운광장역',
      노선명: '광주 2호선',
      환승역여부: '환승',
      환승노선명: '광주 1호선',
      위도: '35.1335',
      경도: '126.9007',
      운영기관명: '광주광역시',
      도로명주소: '광주광역시 남구 백운동',
      데이터기준일자: '20240601',
    })

    expect(station).toMatchObject({
      id: 'GJ-TRANSFER',
      stationName: '백운광장역',
      isTransferStation: true,
      latitude: 35.1335,
      longitude: 126.9007,
      dataReferenceDate: '2024-06-01',
    })
  })

  it('returns false for non-transfer station values', () => {
    const station = mapRawUrbanRailwayStationRow({
      역사명: '상무역',
      노선명: '광주 1호선',
      환승역여부: '아니오',
    })

    expect(station.id).toBe('광주 1호선-상무역')
    expect(station.isTransferStation).toBe(false)
  })
})
