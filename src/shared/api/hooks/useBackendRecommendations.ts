import { useQuery } from '@tanstack/react-query'

import { getBackendRecommendations } from '@/shared/api/backendRecommendationApi'

export function useBackendRecommendations(limit = 5) {
  return useQuery({
    queryKey: ['backend-recommendations', limit],
    queryFn: () => getBackendRecommendations(limit),
    retry: false,
  })
}
