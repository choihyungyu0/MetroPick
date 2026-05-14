import { useMutation, useQuery } from '@tanstack/react-query'

import {
  getSalesPrediction,
  savePredictionResult,
  type SalesPredictionFilters,
} from '@/shared/api/predictionApi'

export function useSalesPrediction(filters?: SalesPredictionFilters) {
  return useQuery({
    queryKey: ['sales-prediction', filters],
    queryFn: () => getSalesPrediction(filters),
  })
}

export function useSavePredictionResult() {
  return useMutation({
    mutationFn: savePredictionResult,
  })
}
