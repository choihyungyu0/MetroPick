import { calculateStartupSuitabilityScore } from '@/features/recommendation/scoring'
import { mockStations } from '@/shared/data/mockStations'
import { recommendationSchema } from '@/shared/types/recommendation'
import type { BusinessType } from '@/shared/types/station'

export type LocationRecommendationRiskLevel = '위험 낮음' | '위험 보통' | '위험 높음'

export type LocationRecommendationItem = {
  accessibility: number
  competition: number
  district: string
  growth: number
  line: string
  rank: number
  reason: string
  riskLevel: LocationRecommendationRiskLevel
  score: number
  stability: number
  station: string
}

type RecommendationSeed = {
  stationId: string
  businessType: BusinessType
  businessDemandFit: number
  recommendationReasons: string[]
}

const seeds: RecommendationSeed[] = [
  {
    stationId: 'cheomdan',
    businessType: 'cafe',
    businessDemandFit: 88,
    recommendationReasons: ['업무·주거 복합 수요', '경쟁 과밀도가 상대적으로 낮은 편'],
  },
  {
    stationId: 'gwangju-station',
    businessType: 'convenienceStore',
    businessDemandFit: 84,
    recommendationReasons: ['이동형 소비에 적합', '역세권 재편 시나리오 수혜 가능성'],
  },
  {
    stationId: 'chonnam-university',
    businessType: 'snackBar',
    businessDemandFit: 86,
    recommendationReasons: ['학생·주거 수요 혼합', '간편식 반복 구매 가능성'],
  },
  {
    stationId: 'sangmu',
    businessType: 'convenienceStore',
    businessDemandFit: 82,
    recommendationReasons: ['업무시간 외 편의 수요', '야간 유동 인구 기반'],
  },
  {
    stationId: 'baegun-square',
    businessType: 'pharmacy',
    businessDemandFit: 81,
    recommendationReasons: ['생활권 중심 접근성', '고정 방문 목적 수요'],
  },
]

function getStation(stationId: string) {
  const station = mockStations.find((item) => item.id === stationId)

  if (!station) {
    throw new Error(`Missing station seed: ${stationId}`)
  }

  return station
}

export const mockRecommendations = recommendationSchema
  .array()
  .parse(
    seeds.map((seed) => {
      const station = getStation(seed.stationId)

      return {
        ...seed,
        score: calculateStartupSuitabilityScore({
          salesPotentialIndex: station.salesPotentialIndex,
          floatingPopulationIndex: station.floatingPopulationIndex,
          businessDemandFit: seed.businessDemandFit,
          overcrowdingIndex: station.overcrowdingIndex,
          closureRiskIndex: station.closureRiskIndex,
        }),
      }
    }),
  )
  .sort((first, second) => second.score - first.score)

export const mockLocationRecommendations: LocationRecommendationItem[] = [
  {
    rank: 1,
    station: '상무역',
    line: '2호선',
    district: '서구 치평동',
    score: 92,
    growth: 93,
    stability: 88,
    competition: 72,
    accessibility: 94,
    riskLevel: '위험 낮음',
    reason:
      '상무지구 중심 상권으로 유동인구가 풍부하고 배후 수요가 안정적입니다. 업무지구 수요와 주거지 수요를 동시에 확보할 수 있는 최적 입지입니다.',
  },
  {
    rank: 2,
    station: '운천역',
    line: '2호선',
    district: '서구 운천동',
    score: 87,
    growth: 88,
    stability: 85,
    competition: 65,
    accessibility: 90,
    riskLevel: '위험 낮음',
    reason:
      '신규 주거단지 개발이 활발하며, 상권 성장 잠재력이 높은 지역입니다. 생활 밀착형 업종에 특히 유리합니다.',
  },
  {
    rank: 3,
    station: '첨단지구역',
    line: '2호선',
    district: '광산구 첨단동',
    score: 84,
    growth: 86,
    stability: 80,
    competition: 68,
    accessibility: 86,
    riskLevel: '위험 보통',
    reason:
      '첨단 산업단지 배후 수요와 인근 주거단지 확장으로 꾸준한 성장이 예상되는 지역입니다.',
  },
  {
    rank: 4,
    station: '능성역',
    line: '2호선',
    district: '서구 농성동',
    score: 81,
    growth: 82,
    stability: 78,
    competition: 70,
    accessibility: 84,
    riskLevel: '위험 보통',
    reason: '전통 상권과 신흥 주거지가 혼재되어 있어 다양한 고객층 확보가 가능합니다.',
  },
  {
    rank: 5,
    station: '돌고개역',
    line: '2호선',
    district: '남구 봉선동',
    score: 78,
    growth: 76,
    stability: 74,
    competition: 66,
    accessibility: 82,
    riskLevel: '위험 보통',
    reason: '주거 밀집 지역으로 안정적인 수요가 기대되며, 상권 확장 여지가 있습니다.',
  },
]
