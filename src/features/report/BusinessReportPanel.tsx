import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import type { BusinessReport } from '@/shared/data/mockReports'
import {
  businessTypeLabels,
  type BusinessType,
  type StationArea,
} from '@/shared/types/station'

import { RiskNotice } from './RiskNotice'

type BusinessReportPanelProps = {
  businessType: BusinessType
  report?: BusinessReport
  station: StationArea
}

export function BusinessReportPanel({
  businessType,
  report,
  station,
}: BusinessReportPanelProps) {
  const reasons = report?.reasons ?? station.keyReasons
  const risks = report?.risks ?? station.riskFactors
  const summary =
    report?.summary ??
    `${station.name}은(는) ${businessTypeLabels[businessType]} 업종을 검토할 수 있는 후보 권역입니다. 현재 화면의 문장은 mock 데이터 기반의 시나리오 설명이며 실제 매출 예측이 아닙니다.`

  return (
    <section className="grid gap-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-city-700">AI 요약 스타일 리포트</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {station.name} · {businessTypeLabels[businessType]}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{station.district}</p>
          </div>
          <Badge tone="warning">Mock scenario</Badge>
        </div>
        <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-800">
          {summary}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-bold text-slate-950">추천 이유</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {reasons.map((reason) => (
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

        <Card>
          <h3 className="text-base font-bold text-slate-950">위험 요인</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {risks.map((risk) => (
              <li key={risk} className="flex gap-2">
                <span
                  className="mt-2 h-1.5 w-1.5 rounded-full bg-warning-600"
                  aria-hidden="true"
                />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <RiskNotice />
    </section>
  )
}
