import { fetchBackendJson } from '@/shared/api/backendClient'

export type BackendStartupSuitabilityInput = {
  radius_m: number
  total_store_count: number
  same_business_count_by_type: number
  cafe_count: number
  restaurant_count: number
  convenience_count: number
  pharmacy_count: number
  beauty_count: number
  academy_count: number
  retail_count: number
  business_type_count: number
  business_diversity_index: number
  bus_boarding_count: number
  bus_alighting_count: number
  bus_total_count: number
  nearby_bus_stop_count: number
  subway_pattern_score: number
  competition_index: number
  floating_demand_index: number
  sales_potential_index: number
  closure_risk_index: number
  accessibility_score: number
}

export type BackendStartupSuitabilityResponse = {
  predicted_score: number
  risk_level: string
  recommendation_label: string
  top_reasons: string[]
}

export function predictBackendStartupSuitability(
  input: BackendStartupSuitabilityInput,
): Promise<BackendStartupSuitabilityResponse> {
  return fetchBackendJson<BackendStartupSuitabilityResponse>(
    '/api/prediction/startup-suitability',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}
