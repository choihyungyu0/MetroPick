import { EmptyState } from '@/shared/components/EmptyState'
import type { StationRecommendation } from '@/shared/types/recommendation'
import type { StationArea } from '@/shared/types/station'

import { RecommendationScoreCard } from './RecommendationScoreCard'

type TopStationRecommendationsProps = {
  recommendations: StationRecommendation[]
  stations: StationArea[]
  limit?: number
}

export function TopStationRecommendations({
  recommendations,
  stations,
  limit = 5,
}: TopStationRecommendationsProps) {
  const visibleRecommendations = recommendations.slice(0, limit)

  if (visibleRecommendations.length === 0) {
    return (
      <EmptyState
        title="추천 권역이 없습니다"
        description="시나리오와 필터 조건을 조정하면 후보 권역을 다시 확인할 수 있습니다."
      />
    )
  }

  return (
    <section className="grid gap-3" aria-label="추천 역세권 상위 5개">
      {visibleRecommendations.map((recommendation, index) => {
        const station = stations.find((item) => item.id === recommendation.stationId)

        if (!station) {
          return null
        }

        return (
          <RecommendationScoreCard
            key={`${recommendation.stationId}-${recommendation.businessType}`}
            rank={index + 1}
            recommendation={recommendation}
            station={station}
          />
        )
      })}
    </section>
  )
}
