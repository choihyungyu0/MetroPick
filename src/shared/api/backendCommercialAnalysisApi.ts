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

export type BackendCommercialMapPoint = {
  lat: number
  lng: number
}

export type BackendCommercialMapFilters = {
  region: string
  line: string
  station_ids: string[]
  radius_m: number
  business_type: string
  business_type_key: string
  layers: string[]
}

export type BackendCommercialRouteLine = {
  line: string
  color: string
  points: BackendCommercialMapPoint[]
}

export type BackendCommercialStationMarker = {
  station_id: string
  station_name: string
  raw_station_name: string
  line: string
  district: string
  dong: string
  lat: number
  lng: number
  selected: boolean
  score: {
    total_store_count: number
    competition_index: number
    business_diversity_index: number
    startup_suitability_score: number
  }
  business_counts: Record<string, number>
}

export type BackendCommercialDensityPoint = {
  id: string
  lat: number
  lng: number
  business_type: string
  business_type_key: string
  store_name: string
  weight: number
}

export type BackendCommercialStationCircle = {
  station_id: string
  station_name: string
  lat: number
  lng: number
  radius_m: number
}

export type BackendCommercialBusStopMarker = {
  id: string
  name: string
  lat: number
  lng: number
}

export type BackendCommercialSummaryCard = {
  title: string
  value: string
  change: string
  desc: string
}

export type BackendCommercialBusinessDistributionItem = {
  name: string
  key: string
  count: number
  percent: number
  color: string
}

export type BackendCommercialComparisonRow = {
  station_id: string
  station: string
  storeCount: number
  densityLevel: string
  densityTone: 'danger' | 'warning' | 'normal'
  averageFloatingPopulation: string
  averageMonthlySales: string
  competitionLevel: string
  promisingBusinessTypes: string[]
}

export type BackendCommercialAnalysisMapData = {
  data_status: 'public_store_csv' | 'sample_fixture' | string
  filters: BackendCommercialMapFilters
  map: {
    center: BackendCommercialMapPoint
    zoom: number
  }
  route_lines: BackendCommercialRouteLine[]
  station_markers: BackendCommercialStationMarker[]
  density_points: BackendCommercialDensityPoint[]
  selected_station_circles: BackendCommercialStationCircle[]
  bus_stop_markers: BackendCommercialBusStopMarker[]
  summary_cards: BackendCommercialSummaryCard[]
  business_distribution: BackendCommercialBusinessDistributionItem[]
  comparison_rows: BackendCommercialComparisonRow[]
  insight_summaries: string[]
  message: string
  available_layers: string[]
}

export type BackendCommercialAnalysisMapDataParams = {
  region?: string
  line?: string
  stationIds?: string[]
  radiusM?: number
  businessType?: string
  layers?: string[]
}

export function getBackendCommercialAnalysisSummary(): Promise<BackendCommercialAnalysisSummary> {
  return fetchBackendJson<BackendCommercialAnalysisSummary>(
    '/api/commercial-analysis/summary',
  )
}

export function getBackendCommercialAnalysisMapData({
  businessType,
  layers,
  line,
  radiusM = 500,
  region,
  stationIds,
}: BackendCommercialAnalysisMapDataParams): Promise<BackendCommercialAnalysisMapData> {
  const params = new URLSearchParams()
  if (region) {
    params.set('region', region)
  }
  if (line) {
    params.set('line', line)
  }
  if (stationIds && stationIds.length > 0) {
    params.set('station_ids', stationIds.join(','))
  }
  params.set('radius_m', String(radiusM))
  if (businessType) {
    params.set('business_type', businessType)
  }
  if (layers && layers.length > 0) {
    params.set('layers', layers.join(','))
  }

  return fetchBackendJson<BackendCommercialAnalysisMapData>(
    `/api/commercial-analysis/map-data?${params.toString()}`,
  )
}
