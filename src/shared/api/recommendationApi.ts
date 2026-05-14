import { mockBusinessTypes } from '@/shared/data/mockBusinessTypes'
import { mockLocationRecommendationResults } from '@/shared/data/mockRecommendations'
import { mockStations } from '@/shared/data/mockStations'
import type { BusinessTypeId } from '@/shared/types/business'
import type { LocationRecommendation } from '@/shared/types/recommendation'

import { appendStorageItem, withMockDelay } from './publicDataClient'

const INTEREST_LOCATION_STORAGE_KEY = 'metropick-saved-interest-locations'

export type LocationRecommendationFilters = {
  businessTypeId?: BusinessTypeId
  stationIds?: string[]
  maxResults?: number
}

export type SavedInterestLocation = {
  id: string
  stationId: string
  station: string
  district: string
  businessTypeId: string
  businessType: string
  score: number
  savedAt: string
}

export function getLocationRecommendations(
  filters: LocationRecommendationFilters = {},
): Promise<LocationRecommendation[]> {
  const results = mockLocationRecommendationResults
    .filter((recommendation) => {
      const stationMatches =
        !filters.stationIds?.length ||
        filters.stationIds.includes(recommendation.stationId)
      const businessMatches =
        !filters.businessTypeId ||
        recommendation.businessTypeId === filters.businessTypeId

      return stationMatches && businessMatches
    })
    .slice(0, filters.maxResults ?? mockLocationRecommendationResults.length)

  return withMockDelay(results)
}

export function saveInterestLocation(
  location: LocationRecommendation,
): Promise<SavedInterestLocation> {
  const station = mockStations.find((item) => item.id === location.stationId)
  const businessType = mockBusinessTypes.find(
    (item) => item.id === location.businessTypeId,
  )
  const savedLocation: SavedInterestLocation = {
    id: `interest-${location.id}-${Date.now()}`,
    stationId: location.stationId,
    station: station?.name ?? location.stationId,
    district: station?.district ?? '',
    businessTypeId: location.businessTypeId,
    businessType: businessType?.label ?? location.businessTypeId,
    score: location.score,
    savedAt: new Date().toISOString(),
  }

  appendStorageItem<SavedInterestLocation>(
    INTEREST_LOCATION_STORAGE_KEY,
    savedLocation,
  )

  return withMockDelay(savedLocation)
}
