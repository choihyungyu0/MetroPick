import { useMutation } from '@tanstack/react-query'

import {
  predictBackendStartupSuitability,
  simulateBackendPrediction,
} from '@/shared/api/backendPredictionApi'

export function useBackendStartupSuitability() {
  return useMutation({
    mutationFn: predictBackendStartupSuitability,
  })
}

export function useBackendPredictionSimulation() {
  return useMutation({
    mutationFn: simulateBackendPrediction,
  })
}
