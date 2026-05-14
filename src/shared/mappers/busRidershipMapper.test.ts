import { describe, expect, it } from 'vitest'

import { mapRawBusRidershipRow } from './busRidershipMapper'

describe('busRidershipMapper', () => {
  it('maps bus ridership fields and calculates totalCount', () => {
    const ridership = mapRawBusRidershipRow({
      기준일자: '2024.06.01',
      노선명: '지원25',
      정류장명: '상무역',
      시간대: '08',
      승차건수: '1,240',
      하차건수: 980,
    })

    expect(ridership).toMatchObject({
      date: '2024-06-01',
      routeName: '지원25',
      stopName: '상무역',
      boardingCount: 1240,
      alightingCount: 980,
      totalCount: 2220,
    })
  })

  it('uses safe fallbacks for missing fields', () => {
    const ridership = mapRawBusRidershipRow({})

    expect(ridership.totalCount).toBe(0)
    expect(ridership.stopName).toBe('')
  })
})
