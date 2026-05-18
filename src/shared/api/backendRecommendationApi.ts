import { fetchBackendJson } from '@/shared/api/backendClient'

export type BackendRecommendationItem = {
  rank: number
  station_id: string
  station_name: string
  display_station_name: string
  line: string
  lat: number | null
  lng: number | null
  recommended_business_type?: string
  growth_score?: number
  risk_level?: string
  recommendation_label: string
  startup_suitability_score: number
  floating_demand_index: number
  competition_index: number
  business_diversity_index: number
  data_status: string
}

export type BackendRecommendationMap = {
  center: [number, number]
  zoom: number
  route: Array<[number, number]>
}

export type BackendRecommendationsResponse = {
  items: BackendRecommendationItem[]
  data_status: string
  message: string
  map?: BackendRecommendationMap
}

export function getBackendRecommendations(
  limit = 5,
): Promise<BackendRecommendationsResponse> {
  return fetchBackendJson<BackendRecommendationsResponse>(
    `/api/recommendations?limit=${encodeURIComponent(String(limit))}`,
  )
}
