import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { formatIndex } from '@/shared/lib/format'
import type { StationRecommendation } from '@/shared/types/recommendation'
import { businessTypeLabels, type StationArea } from '@/shared/types/station'

type RecommendationScoreCardProps = {
  rank: number
  recommendation: StationRecommendation
  station: StationArea
}

export function RecommendationScoreCard({
  rank,
  recommendation,
  station,
}: RecommendationScoreCardProps) {
  return (
    <Card as="article" className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-city-700">추천 {rank}</p>
          <h3 className="mt-1 text-base font-bold text-slate-950">{station.name}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {station.district} · {businessTypeLabels[recommendation.businessType]}
          </p>
        </div>
        <Badge tone="success">{formatIndex(recommendation.score)}</Badge>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {recommendation.recommendationReasons.map((reason) => (
          <li key={reason} className="flex gap-2">
            <span
              className="mt-2 h-1.5 w-1.5 rounded-full bg-city-500"
              aria-hidden="true"
            />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
