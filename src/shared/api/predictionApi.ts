import { mockSalesPredictions } from '@/shared/data/mockPredictions'
import type { BusinessTypeId } from '@/shared/types/business'
import type { SalesPredictionResult } from '@/shared/types/prediction'

import { appendStorageItem, withMockDelay } from './publicDataClient'

const PREDICTION_STORAGE_KEY = 'metropick-ai-prediction-results'

export type SalesPredictionFilters = {
  stationId?: string
  businessTypeId?: BusinessTypeId
  scenarioId?: string
}

function matchesPrediction(
  prediction: SalesPredictionResult,
  filters: SalesPredictionFilters = {},
): boolean {
  return (
    (!filters.stationId || prediction.stationId === filters.stationId) &&
    (!filters.businessTypeId || prediction.businessTypeId === filters.businessTypeId) &&
    (!filters.scenarioId || prediction.scenarioId === filters.scenarioId)
  )
}

export function getSalesPrediction(
  filters?: SalesPredictionFilters,
): Promise<SalesPredictionResult | null> {
  return withMockDelay(
    mockSalesPredictions.find((prediction) => matchesPrediction(prediction, filters)) ??
      mockSalesPredictions[0] ??
      null,
  )
}

export function savePredictionResult(
  result: SalesPredictionResult,
): Promise<SalesPredictionResult> {
  appendStorageItem<SalesPredictionResult>(PREDICTION_STORAGE_KEY, result)

  return withMockDelay(result)
}
