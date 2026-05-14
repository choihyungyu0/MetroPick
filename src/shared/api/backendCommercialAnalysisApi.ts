import { fetchBackendJson } from '@/shared/api/backendClient'

export type BackendCommercialAnalysisSummary = {
  station_count: number
  average_startup_suitability_score: number
  average_floating_demand_index: number
  average_competition_index: number
  top_station: {
    station_id: string
    station_name: string
    startup_suitability_score: number
  } | null
  data_status: string
  message: string
}

export function getBackendCommercialAnalysisSummary(): Promise<BackendCommercialAnalysisSummary> {
  return fetchBackendJson<BackendCommercialAnalysisSummary>(
    '/api/commercial-analysis/summary',
  )
}
