import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { BusinessTypeFilter } from '@/features/filters/BusinessTypeFilter'
import { BusinessReportPanel } from '@/features/report/BusinessReportPanel'
import { Card } from '@/shared/components/Card'
import { EmptyState } from '@/shared/components/EmptyState'
import { mockReports } from '@/shared/data/mockReports'
import { mockStations } from '@/shared/data/mockStations'
import type { BusinessType } from '@/shared/types/station'

export function ReportPage() {
  const [stationId, setStationId] = useState('cheomdan')
  const [businessType, setBusinessType] = useState<BusinessType>('cafe')
  const stationsQuery = useQuery({
    queryKey: ['stations'],
    queryFn: async () => mockStations,
  })
  const reportsQuery = useQuery({
    queryKey: ['reports'],
    queryFn: async () => mockReports,
  })

  const stations = stationsQuery.data ?? []
  const reports = reportsQuery.data ?? []
  const station = stations.find((item) => item.id === stationId)
  const report = reports.find(
    (item) => item.stationId === stationId && item.businessType === businessType,
  )

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-bold text-city-700">Small business report</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">소상공인 상권 리포트</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          선택한 역세권과 업종에 대해 이해하기 쉬운 AI 요약 스타일의 mock 리포트를
          제공합니다.
        </p>
      </header>

      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            역세권
            <select
              className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-city-500 focus:ring-2 focus:ring-city-500 focus:outline-none"
              value={stationId}
              onChange={(event) => setStationId(event.target.value)}
            >
              {stations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <BusinessTypeFilter value={businessType} onChange={setBusinessType} />
        </div>
      </Card>

      {stationsQuery.isLoading || reportsQuery.isLoading ? (
        <EmptyState
          title="리포트를 생성하는 중입니다"
          description="mock 리포트 데이터를 불러옵니다."
        />
      ) : station ? (
        <BusinessReportPanel
          businessType={businessType}
          report={report}
          station={station}
        />
      ) : (
        <EmptyState
          title="선택한 역세권을 찾을 수 없습니다"
          description="다른 권역을 선택하거나 데이터 연결 상태를 확인해 주세요."
        />
      )}
    </div>
  )
}
