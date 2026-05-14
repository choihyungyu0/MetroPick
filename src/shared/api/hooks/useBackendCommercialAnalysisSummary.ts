import { useQuery } from '@tanstack/react-query'

import { getBackendCommercialAnalysisSummary } from '@/shared/api/backendCommercialAnalysisApi'

export function useBackendCommercialAnalysisSummary() {
  return useQuery({
    queryKey: ['backend-commercial-analysis-summary'],
    queryFn: getBackendCommercialAnalysisSummary,
    retry: false,
  })
}
