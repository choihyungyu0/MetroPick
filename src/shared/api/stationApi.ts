import { mockStations } from '@/shared/data/mockStations'
import type { StationArea } from '@/shared/types/station'

import { withMockDelay } from './publicDataClient'

export function getStations(): Promise<StationArea[]> {
  return withMockDelay(mockStations)
}

export function getStationById(id: string): Promise<StationArea | null> {
  return withMockDelay(mockStations.find((station) => station.id === id) ?? null)
}
