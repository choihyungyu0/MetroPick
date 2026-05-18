import { mockStations } from '@/shared/data/mockStations'
import { calculateStartupSuitabilityScore } from '@/shared/lib/scoring'
import {
  recommendationSchema,
  type LocationRecommendation,
} from '@/shared/types/recommendation'
import type { BusinessType } from '@/shared/types/station'

export type LocationRecommendationRiskLevel = '위험 낮음' | '위험 보통' | '위험 높음'

export type LocationRecommendationItem = {
  accessibility: number
  competition: number
  district: string
  growth: number
  id: string
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
    recommendationReasons: ['업무·주거 복합 수요', '경쟁 과밀도가 상대적으로 낮음'],
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
    recommendationReasons: ['학생·주거 수요 결합', '간편식 반복 구매 가능성'],
  },
  {
    stationId: 'sangmu',
    businessType: 'convenienceStore',
    businessDemandFit: 82,
    recommendationReasons: ['업무시간 내 편의 수요', '야간 유동 인구 기반'],
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

export const mockLocationRecommendationResults: LocationRecommendation[] = [
  {
    id: 'recommendation-sangmu-cafe',
    rank: 1,
    stationId: 'sangmu',
    businessTypeId: 'cafe-dessert',
    score: 92,
    riskLevel: '위험 낮음',
    reason:
      '상무지구 중심 상권으로 유동인구가 풍부하고 배후 업무 수요가 안정적인 권역입니다.',
    scoreBreakdown: {
      growth: 93,
      stability: 88,
      competition: 72,
      accessibility: 94,
    },
  },
  {
    id: 'recommendation-uncheon-restaurant',
    rank: 2,
    stationId: 'uncheon',
    businessTypeId: 'restaurant',
    score: 87,
    riskLevel: '위험 낮음',
    reason:
      '주거지와 업무지구 사이 이동 동선이 겹쳐 생활형 외식 수요를 검토할 수 있습니다.',
    scoreBreakdown: {
      growth: 88,
      stability: 85,
      competition: 65,
      accessibility: 90,
    },
  },
  {
    id: 'recommendation-cheomdan-cafe',
    rank: 3,
    stationId: 'cheomdan',
    businessTypeId: 'cafe-dessert',
    score: 84,
    riskLevel: '위험 보통',
    reason:
      '첨단 산업단지와 배후 주거단지 확장으로 장기 성장성이 기대되는 권역입니다.',
    scoreBreakdown: {
      growth: 86,
      stability: 80,
      competition: 68,
      accessibility: 86,
    },
  },
  {
    id: 'recommendation-ssangchon-life-service',
    rank: 4,
    stationId: 'ssangchon',
    businessTypeId: 'life-service',
    score: 81,
    riskLevel: '위험 보통',
    reason:
      '주거지 기반 반복 방문 수요가 있으며 생활서비스 업종의 안정성을 검토할 수 있습니다.',
    scoreBreakdown: {
      growth: 82,
      stability: 78,
      competition: 70,
      accessibility: 84,
    },
  },
  {
    id: 'recommendation-geumho-retail',
    rank: 5,
    stationId: 'geumho',
    businessTypeId: 'retail',
    score: 78,
    riskLevel: '위험 보통',
    reason:
      '주거 배후 수요가 안정적인 권역으로 소형 근린 소매 입지 후보로 검토할 수 있습니다.',
    scoreBreakdown: {
      growth: 76,
      stability: 74,
      competition: 66,
      accessibility: 82,
    },
  },
]

export const mockLocationRecommendations: LocationRecommendationItem[] =
  mockLocationRecommendationResults.map((item) => {
    const station = getStation(item.stationId)

    return {
      id: item.id,
      rank: item.rank,
      station: station.name,
      line: station.line.replace('광주 ', ''),
      district: station.district,
      score: item.score,
      growth: item.scoreBreakdown.growth,
      stability: item.scoreBreakdown.stability,
      competition: item.scoreBreakdown.competition,
      accessibility: item.scoreBreakdown.accessibility,
      riskLevel: item.riskLevel,
      reason: item.reason,
    }
  })
