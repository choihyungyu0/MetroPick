import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { CommercialMap } from '@/features/map/CommercialMap'
import { TopStationRecommendations } from '@/features/recommendation/TopStationRecommendations'
import { ScenarioSelector } from '@/features/scenario/ScenarioSelector'
import { ScenarioSummaryCards } from '@/features/scenario/ScenarioSummaryCards'
import { mockRecommendations } from '@/shared/data/mockRecommendations'
import { mockStations } from '@/shared/data/mockStations'
import { Card } from '@/shared/components/Card'
import { EmptyState } from '@/shared/components/EmptyState'
import type { OpeningScenario } from '@/shared/types/scenario'

export function DashboardPage() {
  const [scenario, setScenario] = useState<OpeningScenario>('phase1Opening')
  const stationsQuery = useQuery({
    queryKey: ['stations'],
    queryFn: async () => mockStations,
  })
  const recommendationsQuery = useQuery({
    queryKey: ['recommendations', scenario],
    queryFn: async () => mockRecommendations,
  })

  const stations = stationsQuery.data ?? []
  const recommendations = recommendationsQuery.data ?? []

  return (
    <div className="grid gap-6">
      <header className="max-w-4xl">
        <p className="text-sm font-bold text-city-700">2026 광주광역시 공공데이터 + AI</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
          광주 2호선 AI 상권 시뮬레이터
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          광주 도시철도 2호선 개통 시나리오를 공공데이터 기반 mock 지표로 살펴보는 초기
          MVP입니다. 실제 매출 예측이나 확정된 정책 판단으로 사용하지 않습니다.
        </p>
      </header>

      <Card>
        <ScenarioSelector value={scenario} onChange={setScenario} />
      </Card>

      {stationsQuery.isLoading ? (
        <EmptyState
          title="권역 데이터를 불러오는 중입니다"
          description="잠시 후 다시 표시됩니다."
        />
      ) : stations.length === 0 ? (
        <EmptyState
          title="표시할 권역이 없습니다"
          description="mock 데이터 또는 향후 API 연결 상태를 확인해 주세요."
        />
      ) : (
        <>
          <ScenarioSummaryCards stations={stations} />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
            <CommercialMap stations={stations} />
            <section
              className="grid content-start gap-3"
              aria-labelledby="top-stations-heading"
            >
              <div>
                <h2
                  id="top-stations-heading"
                  className="text-xl font-bold text-slate-950"
                >
                  추천 역세권 Top 5
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  단순 점수식으로 정렬한 mock 후보입니다.
                </p>
              </div>
              {recommendationsQuery.isLoading ? (
                <EmptyState
                  title="추천 후보를 계산하는 중입니다"
                  description="시나리오별 후보 점수를 준비하고 있습니다."
                />
              ) : (
                <TopStationRecommendations
                  recommendations={recommendations}
                  stations={stations}
                  limit={5}
                />
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
