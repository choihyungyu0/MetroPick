import { fetchBackendJson } from '@/shared/api/backendClient'

export type BackendRecommendationItem = {
  station_id: string
  station_name: string
  recommendation_label: string
  startup_suitability_score: number
  floating_demand_index: number
  competition_index: number
  business_diversity_index: number
  data_status: string
}

export type BackendRecommendationsResponse = {
  items: BackendRecommendationItem[]
  data_status: string
  message: string
}

export function getBackendRecommendations(
  limit = 5,
): Promise<BackendRecommendationsResponse> {
  return fetchBackendJson<BackendRecommendationsResponse>(
    `/api/recommendations?limit=${encodeURIComponent(String(limit))}`,
  )
}
