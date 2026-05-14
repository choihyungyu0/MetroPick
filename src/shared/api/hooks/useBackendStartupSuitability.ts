import { useMutation } from '@tanstack/react-query'

import { predictBackendStartupSuitability } from '@/shared/api/backendPredictionApi'

export function useBackendStartupSuitability() {
  return useMutation({
    mutationFn: predictBackendStartupSuitability,
  })
}
