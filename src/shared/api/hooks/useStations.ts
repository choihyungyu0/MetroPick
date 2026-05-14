import { useQuery } from '@tanstack/react-query'

import { getStationById, getStations } from '@/shared/api/stationApi'

export function useStations() {
  return useQuery({
    queryKey: ['stations'],
    queryFn: getStations,
  })
}

export function useStation(stationId: string | undefined) {
  return useQuery({
    queryKey: ['stations', stationId],
    queryFn: () => (stationId ? getStationById(stationId) : Promise.resolve(null)),
  })
}
