import type { CommercialAreaMetric } from '@/shared/types/commercialArea'

export const mockCommercialAreaMetrics: CommercialAreaMetric[] = [
  {
    stationId: 'sangmu',
    storeCount: 1842,
    businessTypeCount: 86,
    averageFloatingPopulationDay: 28560,
    averageMonthlySalesAmount: 284300000,
    competitionScore: 84,
    densityLevel: '매우 높음',
  },
  {
    stationId: 'world-cup-stadium',
    storeCount: 1356,
    businessTypeCount: 72,
    averageFloatingPopulationDay: 24310,
    averageMonthlySalesAmount: 241200000,
    competitionScore: 58,
    densityLevel: '높음',
  },
  {
    stationId: 'city-hall',
    storeCount: 1284,
    businessTypeCount: 78,
    averageFloatingPopulationDay: 25140,
    averageMonthlySalesAmount: 263500000,
    competitionScore: 76,
    densityLevel: '높음',
  },
  {
    stationId: 'geumho',
    storeCount: 1124,
    businessTypeCount: 61,
    averageFloatingPopulationDay: 18430,
    averageMonthlySalesAmount: 198700000,
    competitionScore: 42,
    densityLevel: '보통',
  },
  {
    stationId: 'baegun-square',
    storeCount: 1088,
    businessTypeCount: 65,
    averageFloatingPopulationDay: 20360,
    averageMonthlySalesAmount: 213400000,
    competitionScore: 51,
    densityLevel: '보통',
  },
  {
    stationId: 'cheomdan',
    storeCount: 1465,
    businessTypeCount: 74,
    averageFloatingPopulationDay: 22180,
    averageMonthlySalesAmount: 238900000,
    competitionScore: 55,
    densityLevel: '높음',
  },
]

export const mockCommercialSummary = {
  totalStoreCount: 12843,
  businessTypeCount: 96,
  averageFloatingPopulationDay: 125430,
  averageCompetitionLevel: '보통',
} as const
