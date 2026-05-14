import { useMutation, useQuery } from '@tanstack/react-query'

import {
  getLocationRecommendations,
  saveInterestLocation,
  type LocationRecommendationFilters,
} from '@/shared/api/recommendationApi'

export function useLocationRecommendations(filters?: LocationRecommendationFilters) {
  return useQuery({
    queryKey: ['location-recommendations', filters],
    queryFn: () => getLocationRecommendations(filters),
  })
}

export function useSaveInterestLocation() {
  return useMutation({
    mutationFn: saveInterestLocation,
  })
}
