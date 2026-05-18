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

export type BackendPredictionConfidenceMetric = {
  label: string
  level: string
  score: number
}

export type BackendPredictionMonthlySalesSeriesItem = {
  label: string
  before_opening_value: number | null
  after_opening_value: number | null
}

export type BackendPredictionEvidenceCard = {
  title: string
  value: string
  comment: string
}

export type BackendPredictionSimulationInput = {
  station_id?: string
  station_name?: string
  display_station_name?: string
  business_type: string
  scenario?: string
  radius_m?: number
}

export type BackendPredictionSimulationResponse = {
  data_status: string
  station_id: string
  station_name: string
  display_station_name: string
  business_type: string
  scenario?: string | null
  radius_m: number
  startup_suitability_score: number
  predicted_score: number
  predicted_growth_rate: number
  predicted_sales_change_rate: number
  monthly_sales_series?: BackendPredictionMonthlySalesSeriesItem[]
  floating_demand_index: number
  competition_index: number
  business_diversity_index: number
  risk_level: string
  recommendation_label: string
  risk_factors: string[]
  strategy_comment: string
  ai_summary_comment: string
  evidence_cards: BackendPredictionEvidenceCard[]
  confidence_metrics: BackendPredictionConfidenceMetric[]
  feature_payload?: Record<string, number>
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

export function simulateBackendPrediction(
  input: BackendPredictionSimulationInput,
): Promise<BackendPredictionSimulationResponse> {
  return fetchBackendJson<BackendPredictionSimulationResponse>(
    '/api/prediction/simulate',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}
