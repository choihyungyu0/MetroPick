import { describe, expect, it } from 'vitest'

import { getStations } from './stationApi'

describe('stationApi', () => {
  it('returns the normalized mock station data', async () => {
    const stations = await getStations()

    expect(stations.some((station) => station.name === '시청역')).toBe(true)
    expect(stations[0]).toMatchObject({
      id: 'city-hall',
      line: '광주 2호선',
      phase: '1단계',
    })
  })
})
