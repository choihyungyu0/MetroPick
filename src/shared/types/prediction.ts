export type PredictionScenario = {
  id: string
  label: string
  openingYear: number
  description: string
}

export type SalesPredictionPoint = {
  year: number
  annualAverageSalesAmount: number
  monthlyAverageSalesAmount: number
}

export type SalesPredictionResult = {
  id: string
  stationId: string
  businessTypeId: string
  scenarioId: string
  predictedSalesGrowthRate: number
  predictedSalesIncreaseLabel: string
  predictedFloatingPopulationGrowthRate: number
  riskLevel: '낮음' | '보통' | '높음'
  points: SalesPredictionPoint[]
}
