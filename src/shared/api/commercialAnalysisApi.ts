import {
  mockCommercialAreaMetrics,
  mockCommercialSummary,
} from '@/shared/data/mockCommercialAreas'
import type {
  CommercialAreaMetric,
  CommercialDensityLevel,
} from '@/shared/types/commercialArea'

import { withMockDelay } from './publicDataClient'

export type CommercialAreaMetricFilters = {
  stationIds?: string[]
  densityLevels?: CommercialDensityLevel[]
}

export type CommercialSummary = {
  totalStoreCount: number
  businessTypeCount: number
  averageFloatingPopulationDay: number
  averageCompetitionScore: number
  averageCompetitionLevel: string
}

function filterMetrics(
  filters: CommercialAreaMetricFilters = {},
): CommercialAreaMetric[] {
  return mockCommercialAreaMetrics.filter((metric) => {
    const stationMatches =
      !filters.stationIds?.length || filters.stationIds.includes(metric.stationId)
    const densityMatches =
      !filters.densityLevels?.length ||
      filters.densityLevels.includes(metric.densityLevel)

    return stationMatches && densityMatches
  })
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length)
}

export function getCommercialAreaMetrics(
  filters?: CommercialAreaMetricFilters,
): Promise<CommercialAreaMetric[]> {
  return withMockDelay(filterMetrics(filters))
}

export function getCommercialSummary(
  filters?: CommercialAreaMetricFilters,
): Promise<CommercialSummary> {
  const metrics = filterMetrics(filters)

  if (metrics.length === 0) {
    return withMockDelay({
      totalStoreCount: mockCommercialSummary.totalStoreCount,
      businessTypeCount: mockCommercialSummary.businessTypeCount,
      averageFloatingPopulationDay:
        mockCommercialSummary.averageFloatingPopulationDay,
      averageCompetitionScore: 0,
      averageCompetitionLevel: mockCommercialSummary.averageCompetitionLevel,
    })
  }

  return withMockDelay({
    totalStoreCount: metrics.reduce((total, metric) => total + metric.storeCount, 0),
    businessTypeCount: Math.max(...metrics.map((metric) => metric.businessTypeCount)),
    averageFloatingPopulationDay: average(
      metrics.map((metric) => metric.averageFloatingPopulationDay),
    ),
    averageCompetitionScore: average(
      metrics.map((metric) => metric.competitionScore),
    ),
    averageCompetitionLevel: mockCommercialSummary.averageCompetitionLevel,
  })
}
