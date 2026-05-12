import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { formatIndex, formatPercentDelta } from '@/shared/lib/format'
import type { StationArea } from '@/shared/types/station'

type ScenarioSummaryCardsProps = {
  stations: StationArea[]
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function ScenarioSummaryCards({ stations }: ScenarioSummaryCardsProps) {
  const floatingPopulation = average(
    stations.map((station) => station.floatingPopulationIndex),
  )
  const salesPotential = average(stations.map((station) => station.salesPotentialIndex))
  const overcrowding = average(stations.map((station) => station.overcrowdingIndex))
  const startupSuitability = average(
    stations.map((station) => station.startupSuitabilityScore),
  )

  const summaries = [
    {
      label: '예상 유동인구 변화',
      value: formatPercentDelta(floatingPopulation - 65),
      helper: '기준 생활권 대비 모의 변화율',
      tone: 'info' as const,
    },
    {
      label: '매출 잠재력',
      value: formatIndex(salesPotential),
      helper: '공공데이터 기반 시나리오 지표',
      tone: 'success' as const,
    },
    {
      label: '동일업종 과밀도',
      value: formatIndex(overcrowding),
      helper: '높을수록 경쟁 부담이 큼',
      tone: 'warning' as const,
    },
    {
      label: '창업 적합도',
      value: formatIndex(startupSuitability),
      helper: '매출·유동·위험 지표를 단순 조합',
      tone: 'neutral' as const,
    },
  ]

  return (
    <section
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="시나리오 요약 지표"
    >
      {summaries.map((summary) => (
        <Card key={summary.label} as="article" className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-700">{summary.label}</h3>
            <Badge tone={summary.tone}>Mock</Badge>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-950">{summary.value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{summary.helper}</p>
        </Card>
      ))}
    </section>
  )
}
