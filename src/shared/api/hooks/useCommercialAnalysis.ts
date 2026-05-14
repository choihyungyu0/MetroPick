import { useQuery } from '@tanstack/react-query'

import {
  getCommercialAreaMetrics,
  getCommercialSummary,
  type CommercialAreaMetricFilters,
} from '@/shared/api/commercialAnalysisApi'

export function useCommercialAreaMetrics(filters?: CommercialAreaMetricFilters) {
  return useQuery({
    queryKey: ['commercial-area-metrics', filters],
    queryFn: () => getCommercialAreaMetrics(filters),
  })
}

export function useCommercialSummary(filters?: CommercialAreaMetricFilters) {
  return useQuery({
    queryKey: ['commercial-summary', filters],
    queryFn: () => getCommercialSummary(filters),
  })
}
