import type {
  PredictionScenario,
  SalesPredictionResult,
} from '@/shared/types/prediction'

export const mockPredictionScenarios: PredictionScenario[] = [
  {
    id: 'line2-phase1-2026',
    label: '광주 2호선 1단계 개통 - 2026년 예정',
    openingYear: 2026,
    description: '1단계 개통 예정 역세권의 상권 변화 시나리오',
  },
  {
    id: 'line2-phase2-2027',
    label: '광주 2호선 2단계 개통 - 2027년 예정',
    openingYear: 2027,
    description: '2단계 개통 예정 역세권의 상권 변화 시나리오',
  },
]

export const mockSalesPredictions: SalesPredictionResult[] = [
  {
    id: 'prediction-sangmu-cafe',
    stationId: 'sangmu',
    businessTypeId: 'cafe-dessert',
    scenarioId: 'line2-phase1-2026',
    predictedSalesGrowthRate: 47.6,
    predictedSalesIncreaseLabel: '+1,280만원',
    predictedFloatingPopulationGrowthRate: 42.3,
    riskLevel: '보통',
    points: [
      {
        year: 2025,
        annualAverageSalesAmount: 193000000,
        monthlyAverageSalesAmount: 16080000,
      },
      {
        year: 2026,
        annualAverageSalesAmount: 224000000,
        monthlyAverageSalesAmount: 18670000,
      },
      {
        year: 2027,
        annualAverageSalesAmount: 271000000,
        monthlyAverageSalesAmount: 22580000,
      },
      {
        year: 2028,
        annualAverageSalesAmount: 285000000,
        monthlyAverageSalesAmount: 23750000,
      },
    ],
  },
  {
    id: 'prediction-baegun-restaurant',
    stationId: 'baegun-square',
    businessTypeId: 'restaurant',
    scenarioId: 'line2-phase1-2026',
    predictedSalesGrowthRate: 34.7,
    predictedSalesIncreaseLabel: '+820만원',
    predictedFloatingPopulationGrowthRate: 31.2,
    riskLevel: '보통',
    points: [
      {
        year: 2025,
        annualAverageSalesAmount: 172000000,
        monthlyAverageSalesAmount: 14330000,
      },
      {
        year: 2026,
        annualAverageSalesAmount: 188000000,
        monthlyAverageSalesAmount: 15670000,
      },
      {
        year: 2027,
        annualAverageSalesAmount: 216000000,
        monthlyAverageSalesAmount: 18000000,
      },
    ],
  },
]
