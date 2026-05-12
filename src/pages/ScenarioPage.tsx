import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { BusinessTypeFilter } from '@/features/filters/BusinessTypeFilter'
import { RadiusFilter } from '@/features/filters/RadiusFilter'
import { ScenarioSelector } from '@/features/scenario/ScenarioSelector'
import { Card } from '@/shared/components/Card'
import { EmptyState } from '@/shared/components/EmptyState'
import { mockStations } from '@/shared/data/mockStations'
import type { OpeningScenario, RadiusOption } from '@/shared/types/scenario'
import type { BusinessType, StationArea } from '@/shared/types/station'

type TrendPoint = {
  month: string
  floatingPopulation: number
  salesPotential: number
  overcrowding: number
}

const scenarioFactors: Record<OpeningScenario, number> = {
  phase1Opening: 1,
  phase2Expansion: 1.12,
  delayedOpening: 0.78,
}

const radiusFactors: Record<RadiusOption, number> = {
  '300': 0.92,
  '500': 1,
  '1000': 1.08,
}

const businessFitFactors: Record<BusinessType, number> = {
  cafe: 1.04,
  convenienceStore: 1.01,
  snackBar: 0.98,
  pharmacy: 0.95,
  hairSalon: 0.93,
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function buildTrendData(
  stations: StationArea[],
  scenario: OpeningScenario,
  businessType: BusinessType,
  radius: RadiusOption,
): TrendPoint[] {
  const baseFloating = average(stations.map((station) => station.floatingPopulationIndex))
  const baseSales = average(stations.map((station) => station.salesPotentialIndex))
  const baseOvercrowding = average(stations.map((station) => station.overcrowdingIndex))
  const factor =
    scenarioFactors[scenario] * radiusFactors[radius] * businessFitFactors[businessType]

  return ['개통 전', '개통 3개월', '개통 6개월', '개통 12개월'].map((month, index) => ({
    month,
    floatingPopulation: Math.round(baseFloating * (0.88 + index * 0.05) * factor),
    salesPotential: Math.round(baseSales * (0.9 + index * 0.045) * factor),
    overcrowding: Math.round(baseOvercrowding * (0.96 + index * 0.025)),
  }))
}

export function ScenarioPage() {
  const [scenario, setScenario] = useState<OpeningScenario>('phase1Opening')
  const [businessType, setBusinessType] = useState<BusinessType>('cafe')
  const [radius, setRadius] = useState<RadiusOption>('500')
  const stationsQuery = useQuery({
    queryKey: ['stations'],
    queryFn: async () => mockStations,
  })

  const stations = useMemo(() => stationsQuery.data ?? [], [stationsQuery.data])
  const trendData = useMemo(
    () => buildTrendData(stations, scenario, businessType, radius),
    [businessType, radius, scenario, stations],
  )

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-bold text-city-700">Scenario analysis</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">개통 시나리오 분석</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          업종과 반경을 바꿔보며 유동인구, 매출 잠재력, 동일업종 과밀도 mock 추세를
          비교합니다.
        </p>
      </header>

      <Card>
        <div className="grid gap-5">
          <ScenarioSelector value={scenario} onChange={setScenario} />
          <div className="grid gap-4 md:grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)]">
            <BusinessTypeFilter value={businessType} onChange={setBusinessType} />
            <RadiusFilter value={radius} onChange={setRadius} />
          </div>
        </div>
      </Card>

      {stationsQuery.isLoading ? (
        <EmptyState
          title="시나리오 데이터를 준비 중입니다"
          description="mock 권역 지표를 불러옵니다."
        />
      ) : stations.length === 0 ? (
        <EmptyState
          title="분석할 권역이 없습니다"
          description="mock 데이터 또는 API 연결 상태를 확인해 주세요."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <figure>
              <figcaption>
                <h2 className="text-lg font-bold text-slate-950">
                  유동인구·매출 잠재력 추세
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  선택 조건을 반영한 단순 mock 추세입니다.
                </p>
              </figcaption>
              <div
                className="mt-4 h-80 min-w-0"
                role="img"
                aria-label="유동인구와 매출 잠재력 추세 차트"
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={320}
                  initialDimension={{ width: 640, height: 320 }}
                >
                  <AreaChart data={trendData} margin={{ left: -18, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} />
                    <YAxis tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Area
                      dataKey="floatingPopulation"
                      fill="#dceee8"
                      name="유동인구 지표"
                      stroke="#1f5c51"
                      type="monotone"
                    />
                    <Area
                      dataKey="salesPotential"
                      fill="#eef4ff"
                      name="매출 잠재력"
                      stroke="#326fd1"
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </figure>
          </Card>

          <Card>
            <figure>
              <figcaption>
                <h2 className="text-lg font-bold text-slate-950">동일업종 과밀도 변화</h2>
                <p className="mt-1 text-sm text-slate-600">
                  높을수록 같은 업종 경쟁 부담이 커지는 가정입니다.
                </p>
              </figcaption>
              <div
                className="mt-4 h-80 min-w-0"
                role="img"
                aria-label="동일업종 과밀도 변화 차트"
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={320}
                  initialDimension={{ width: 640, height: 320 }}
                >
                  <BarChart data={trendData} margin={{ left: -18, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} />
                    <YAxis tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="overcrowding"
                      fill="#a15c06"
                      name="동일업종 과밀도"
                      radius={4}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </figure>
          </Card>
        </div>
      )}
    </div>
  )
}
