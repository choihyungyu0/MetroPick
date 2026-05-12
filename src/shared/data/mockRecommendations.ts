import { calculateStartupSuitabilityScore } from '@/features/recommendation/scoring'
import { mockStations } from '@/shared/data/mockStations'
import { recommendationSchema } from '@/shared/types/recommendation'
import type { BusinessType } from '@/shared/types/station'

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
