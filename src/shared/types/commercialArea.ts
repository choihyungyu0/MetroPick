export type CommercialDensityLevel =
  | '매우 높음'
  | '높음'
  | '보통'
  | '낮음'
  | '매우 낮음'

export type CommercialAreaMetric = {
  stationId: string
  storeCount: number
  businessTypeCount: number
  averageFloatingPopulationDay: number
  averageMonthlySalesAmount: number
  competitionScore: number
  densityLevel: CommercialDensityLevel
}
