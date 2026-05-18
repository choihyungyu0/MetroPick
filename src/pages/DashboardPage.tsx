import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  FileText,
  Info,
  Map,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Store,
  Target,
  TrendingUp,
  User,
  Users,
  Wallet,
} from 'lucide-react'

import { RecommendationMap } from '@/components/recommendation/RecommendationMap'
import {
  getBackendCommercialAnalysisMapData,
  type BackendCommercialAnalysisMapData,
  type BackendCommercialBusinessDistributionItem,
  type BackendCommercialSummaryCard,
} from '@/shared/api/backendCommercialAnalysisApi'
import type {
  BackendRecommendationItem,
  BackendRecommendationMap,
  BackendRecommendationsResponse,
} from '@/shared/api/backendRecommendationApi'
import { useBackendRecommendations } from '@/shared/api/hooks/useBackendRecommendations'
import { AppFooter } from '@/shared/components/AppFooter'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { BackendStatusBadge } from '@/shared/components/BackendStatusBadge'
import { SimulationDisclaimer } from '@/shared/components/SimulationDisclaimer'
import { TopNavigation } from '@/shared/components/TopNavigation'
import {
  businessPotentials as fallbackBusinessPotentials,
  dashboardInsights,
  dashboardKpis as fallbackDashboardKpis,
  dashboardNotices,
  recommendedStations as fallbackRecommendedStations,
  type BusinessPotential,
  type DashboardInsight,
  type DashboardKpi,
  type DashboardKpiTone,
  type DashboardNotice,
  type DashboardReport,
  type RecommendedStation,
} from '@/shared/data/mockDashboard'
import { safeParseStorage } from '@/shared/lib/storage'

type StoredStationSetup = {
  selectedStations?: string[]
}

type StoredBusinessTypeSetup = {
  selectedBusinessLabels?: string[]
}

type StoredNotificationSetup = {
  enabledNotificationIds?: string[]
}

type StoredOnboardingSummary = {
  completedAt?: string
}

type StoredCommercialAnalysisReport = {
  createdAt?: string
  region?: string
  route?: string
  selectedBusinessTypes?: string[]
  selectedStations?: string[]
  title?: string
}

type StoredPredictionResult = {
  businessType?: string
  createdAt?: string
  recommendation_label?: string
  stationArea?: string
}

type BackendStatus = 'connected' | 'fallback' | 'loading'

type RecommendationMetricKey =
  | 'businessDiversityScore'
  | 'competitionScore'
  | 'demandScore'
  | 'suitabilityScore'

type DashboardRecommendationMetricPoint = Record<RecommendationMetricKey, number> & {
  rank: number
  station: string
}

type DashboardRecentReport = DashboardReport & {
  id: string
}

const dashboardMapLayers = ['line_2', 'stations', 'density'] as const
const emptyRecommendationItems: BackendRecommendationItem[] = []
const emptySummaryCards: BackendCommercialSummaryCard[] = []
const emptyBusinessDistribution: BackendCommercialBusinessDistributionItem[] = []

const apiSummaryIconKeys = ['users', 'store', 'alert', 'wallet'] as const
const apiSummaryTones = ['blue', 'green', 'red', 'orange'] as const

const kpiIcons = {
  alert: ShieldAlert,
  store: Store,
  users: Users,
  wallet: Wallet,
} satisfies Record<DashboardKpi['iconKey'], LucideIcon>

const insightIcons = {
  alert: ShieldAlert,
  building: Building2,
  target: Target,
} satisfies Record<DashboardInsight['iconKey'], LucideIcon>

const kpiToneClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-amber-50 text-amber-600',
  red: 'bg-rose-50 text-rose-600',
} satisfies Record<DashboardKpiTone, string>

const sparklineToneClasses = {
  blue: 'text-blue-500',
  green: 'text-cyan-500',
  orange: 'text-teal-500',
  red: 'text-rose-500',
} satisfies Record<DashboardKpiTone, string>

const recommendationMetricSeries = [
  { color: '#059669', key: 'suitabilityScore', label: '종합 점수' },
  { color: '#2563eb', key: 'demandScore', label: '수요 지수' },
  { color: '#e11d48', key: 'competitionScore', label: '경쟁 지수' },
  { color: '#d97706', key: 'businessDiversityScore', label: '업종 다양성' },
] as const satisfies ReadonlyArray<{
  color: string
  key: RecommendationMetricKey
  label: string
}>

function formatPoint(value: number): string {
  if (!Number.isFinite(value)) {
    return '0.0'
  }

  return value.toFixed(1)
}

function clampMetricScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, value))
}

function formatStationTick(label: string): string {
  const normalizedLabel = label.trim().replace(/\s+/g, ' ')

  if (normalizedLabel.length <= 7) {
    return normalizedLabel
  }

  return `${normalizedLabel.slice(0, 6)}...`
}

function buildDashboardKpis(
  summaryCards: BackendCommercialSummaryCard[] | undefined,
): DashboardKpi[] {
  if (summaryCards === undefined) {
    return fallbackDashboardKpis
  }

  if (summaryCards.length === 0) {
    return []
  }

  return summaryCards.slice(0, 4).map((card, index) => ({
    id: `api-summary-${index}-${card.title}`,
    label: card.title,
    value: card.value,
    change: card.change,
    caption: card.desc,
    iconKey: apiSummaryIconKeys[index] ?? 'store',
    tone: apiSummaryTones[index] ?? 'blue',
  }))
}

function buildBusinessPotentials(
  distribution: BackendCommercialBusinessDistributionItem[] | undefined,
): BusinessPotential[] {
  if (distribution === undefined) {
    return fallbackBusinessPotentials
  }

  if (distribution.length === 0) {
    return []
  }

  return distribution.slice(0, 5).map((item) => ({
    businessType: item.name,
    value: `${item.count.toLocaleString()}개`,
    percentage: `${formatPoint(item.percent)}%`,
  }))
}

function buildRecommendedStations(
  items: BackendRecommendationItem[] | undefined,
): RecommendedStation[] {
  if (items === undefined) {
    return fallbackRecommendedStations
  }

  if (items.length === 0) {
    return []
  }

  return items.slice(0, 5).map((item, index) => ({
    rank: item.rank || index + 1,
    station: item.display_station_name?.trim() || item.station_name,
    score: Number(formatPoint(item.startup_suitability_score)),
    strengths: [
      item.recommended_business_type || item.recommendation_label,
      `수요 ${formatPoint(item.floating_demand_index)}점`,
      `위험 ${item.risk_level || '확인 필요'}`,
    ],
  }))
}

function buildRecommendationMetricPoints(
  items: BackendRecommendationItem[] | undefined,
): DashboardRecommendationMetricPoint[] {
  if (!items?.length) {
    return []
  }

  return items.slice(0, 5).map((item, index) => ({
    businessDiversityScore: clampMetricScore(item.business_diversity_index),
    competitionScore: clampMetricScore(item.competition_index),
    demandScore: clampMetricScore(item.floating_demand_index),
    rank: item.rank || index + 1,
    station: item.display_station_name?.trim() || item.station_name,
    suitabilityScore: clampMetricScore(item.startup_suitability_score),
  }))
}

function parseReportDate(value: string | undefined): number {
  if (!value) {
    return 0
  }

  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function formatReportDate(value: string | undefined): string {
  if (!value) {
    return '저장일 없음'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(date)
    .replace(/\. /g, '.')
    .replace(/\.$/, '')
}

function buildDashboardReportId({
  createdAt,
  index,
  location,
  source,
  tag,
  title,
}: {
  createdAt: string | undefined
  index: number
  location: string
  source: 'commercial' | 'prediction'
  tag: string
  title: string
}): string {
  return [source, index, createdAt?.trim() || 'unknown-date', title, location, tag].join(
    '|',
  )
}

function buildStoredDashboardReports(): DashboardRecentReport[] {
  const commercialReports =
    safeParseStorage<StoredCommercialAnalysisReport[]>(
      'metropick-saved-commercial-analysis-reports',
    ) ?? []
  const predictionResults =
    safeParseStorage<StoredPredictionResult[]>('metropick-ai-prediction-results') ?? []
  const reportsWithSort = [
    ...commercialReports.map((report, index) => {
      const businessLabel = report.selectedBusinessTypes?.[0]
      const stationLabel = report.selectedStations?.[0]
      const location =
        [report.region, report.route, stationLabel].filter(Boolean).join(' · ') ||
        '광주광역시'
      const tag = businessLabel ? `상권 분석 · ${businessLabel}` : '상권 분석'
      const title = report.title?.trim() || '역세권 상권 분석 리포트'

      return {
        date: formatReportDate(report.createdAt),
        id: buildDashboardReportId({
          createdAt: report.createdAt,
          index,
          location,
          source: 'commercial',
          tag,
          title,
        }),
        location,
        sortAt: parseReportDate(report.createdAt),
        tag,
        title,
      }
    }),
    ...predictionResults.map((result, index) => {
      const location = result.stationArea || '선택 역세권'
      const tag = result.businessType ? `AI 예측 · ${result.businessType}` : 'AI 예측'
      const title = result.recommendation_label || 'AI 예측 결과 리포트'

      return {
        date: formatReportDate(result.createdAt),
        id: buildDashboardReportId({
          createdAt: result.createdAt,
          index,
          location,
          source: 'prediction',
          tag,
          title,
        }),
        location,
        sortAt: parseReportDate(result.createdAt),
        tag,
        title,
      }
    }),
  ]

  return reportsWithSort
    .sort((first, second) => second.sortAt - first.sortAt)
    .slice(0, 3)
    .map((report) => ({
      date: report.date,
      id: report.id,
      location: report.location,
      tag: report.tag,
      title: report.title,
    }))
}

function buildDashboardInsights({
  commercialMapData,
  recommendationItems,
  useFallback,
}: {
  commercialMapData: BackendCommercialAnalysisMapData | null
  recommendationItems: BackendRecommendationItem[] | undefined
  useFallback: boolean
}): DashboardInsight[] {
  if (!commercialMapData && !recommendationItems?.length) {
    return useFallback ? dashboardInsights : []
  }

  const apiInsights: DashboardInsight[] =
    commercialMapData?.insight_summaries.slice(0, 2).map((message, index) => ({
      id: `commercial-map-insight-${index}`,
      iconKey: index === 0 ? 'target' : 'building',
      message,
      title: index === 0 ? '공공 상가 CSV 요약' : '선택 조건 기반 업종 분포',
      tone: index === 0 ? 'green' : 'blue',
    })) ?? []
  const topRecommendation = recommendationItems?.[0]
  if (topRecommendation) {
    apiInsights.push({
      id: 'recommendation-top-station',
      iconKey: 'target',
      message: `${topRecommendation.recommended_business_type || '추천 업종'} 기준 적합도 ${formatPoint(
        topRecommendation.startup_suitability_score,
      )}점, 유동수요 ${formatPoint(topRecommendation.floating_demand_index)}점입니다.`,
      title: `${topRecommendation.display_station_name || topRecommendation.station_name} 추천 CSV 1순위`,
      tone: 'green',
    })
  }

  return apiInsights.slice(0, 3)
}

function buildDashboardNotices({
  commercialMapData,
  recommendationItems,
  useFallback,
}: {
  commercialMapData: BackendCommercialAnalysisMapData | null
  recommendationItems: BackendRecommendationItem[] | undefined
  useFallback: boolean
}): DashboardNotice[] {
  if (!commercialMapData && !recommendationItems?.length) {
    return useFallback ? dashboardNotices : []
  }

  const notices: DashboardNotice[] = []
  if (commercialMapData) {
    notices.push({
      label: '정보',
      title: commercialMapData.message,
      description: `상권 데이터 상태: ${commercialMapData.data_status}`,
      type: 'info',
    })

    const denseStation =
      commercialMapData.comparison_rows.find((row) => row.densityTone === 'danger') ??
      commercialMapData.comparison_rows[0]
    if (denseStation) {
      notices.push({
        label: '주의',
        title: `${denseStation.station} 경쟁 강도 ${denseStation.competitionLevel}`,
        description: '공공 상가 CSV 기준 점포 밀집도입니다.',
        type: 'warning',
      })
    }
  }

  const topRecommendation = recommendationItems?.[0]
  if (topRecommendation) {
    notices.push({
      label: '정보',
      title: `${topRecommendation.display_station_name || topRecommendation.station_name} 추천 CSV 1순위`,
      description: `추천 업종: ${
        topRecommendation.recommended_business_type || '업종 미정'
      } · 위험 수준: ${topRecommendation.risk_level || '정보 없음'}`,
      type: 'info',
    })
  }

  return notices.slice(0, 3)
}

function getDashboardBackendStatus({
  commercialDataStatus,
  isCommercialLoading,
  isRecommendationLoading,
  recommendationDataStatus,
}: {
  commercialDataStatus?: string
  isCommercialLoading: boolean
  isRecommendationLoading: boolean
  recommendationDataStatus?: string
}): BackendStatus {
  if (isCommercialLoading || isRecommendationLoading) {
    return 'loading'
  }

  if (
    commercialDataStatus === 'public_store_csv' &&
    recommendationDataStatus === 'recommendation_csv'
  ) {
    return 'connected'
  }

  return 'fallback'
}

function getDashboardFallbackLabel({
  commercialDataStatus,
  recommendationDataStatus,
}: {
  commercialDataStatus?: string
  recommendationDataStatus?: string
}): string {
  if (
    commercialDataStatus === 'sample_fixture' ||
    recommendationDataStatus === 'sample_fixture'
  ) {
    return 'FastAPI 샘플 데이터 표시'
  }

  return '백엔드 미연결 · 목업 데이터 표시'
}

function formatDashboardDataSource(status: string | undefined): string {
  if (status === 'public_store_csv') {
    return '공공 상가 CSV'
  }

  if (status === 'recommendation_csv') {
    return '추천 CSV'
  }

  if (status === 'sample_fixture') {
    return '샘플 fixture'
  }

  return status?.trim() || '확인 중'
}

function formatDashboardTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(date)
    .replace(/\. /g, '.')
    .replace(/\.$/, '')
}

function DashboardControls({
  notificationCount,
  stationCount,
}: {
  notificationCount: number
  stationCount: number
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 text-slate-700">
      <button
        aria-label={`광주광역시 전체 지역 필터, 선택 역세권 ${stationCount}개`}
        className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-extrabold shadow-sm"
        type="button"
      >
        <MapPin aria-hidden="true" size={16} />
        광주광역시 전체
        <ChevronDown aria-hidden="true" size={15} />
      </button>

      <button
        className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-extrabold shadow-sm"
        type="button"
      >
        <Map aria-hidden="true" size={16} />
        시나리오: 기본 시나리오
        <ChevronDown aria-hidden="true" size={15} />
      </button>

      <button
        aria-label={`알림 ${notificationCount}개`}
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white shadow-sm"
        type="button"
      >
        <Bell aria-hidden="true" size={21} />
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
          {notificationCount}
        </span>
      </button>

      <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-700">
          <User aria-hidden="true" size={18} />
        </div>
        <div>
          <strong className="block text-xs">김지훈</strong>
          <p className="m-0 text-[11px] text-slate-500">프로 플랜</p>
        </div>
        <ChevronDown aria-hidden="true" size={15} />
      </div>
    </div>
  )
}

function MiniSparkline({ tone }: { tone: DashboardKpiTone }) {
  const points = [
    [2, 37],
    [14, 31],
    [25, 33],
    [37, 25],
    [49, 29],
    [61, 20],
    [74, 18],
    [86, 15],
    [98, 17],
    [108, 8],
  ] as const

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute right-5 bottom-5 h-12 w-[110px] max-[1880px]:hidden ${sparklineToneClasses[tone]}`}
      viewBox="0 0 110 45"
    >
      <path
        d="M2 37 L14 31 L25 33 L37 25 L49 29 L61 20 L74 18 L86 15 L98 17 L108 8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M2 37 L14 31 L25 33 L37 25 L49 29 L61 20 L74 18 L86 15 L98 17 L108 8 L108 45 L2 45 Z"
        fill="currentColor"
        opacity="0.08"
      />
      {points.map(([x, y]) => (
        <circle cx={x} cy={y} fill="currentColor" key={x} r="2.5" />
      ))}
    </svg>
  )
}

function SummaryCard({ kpi }: { kpi: DashboardKpi }) {
  const Icon = kpiIcons[kpi.iconKey]

  return (
    <article className="relative grid min-h-[145px] min-w-0 grid-cols-[58px_minmax(0,1fr)] items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-5 pr-[136px] shadow-[0_8px_22px_rgba(12,33,70,0.06)] max-[1880px]:pr-5">
      <div
        className={`grid h-[58px] w-[58px] place-items-center rounded-[10px] ${kpiToneClasses[kpi.tone]}`}
      >
        <Icon aria-hidden="true" size={32} />
      </div>

      <div className="min-w-0">
        <span className="block text-[15px] font-extrabold text-slate-700">
          {kpi.label}
        </span>
        <strong className="mt-1 block whitespace-nowrap text-[28px] font-black tracking-[-0.8px] text-slate-950">
          {kpi.value}
        </strong>
        <p className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm font-black text-emerald-600">
          <TrendingUp aria-hidden="true" size={15} />
          {kpi.change}
          <em className="ml-2 whitespace-nowrap not-italic text-slate-500">
            {kpi.caption}
          </em>
        </p>
      </div>

      <MiniSparkline tone={kpi.tone} />
    </article>
  )
}

function PanelTitle({ children, info }: { children: ReactNode; info?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <h3 className="m-0 text-lg font-black tracking-[-0.4px] text-slate-950">
        {children}
      </h3>
      {info ? <Info aria-hidden="true" className="text-slate-500" size={15} /> : null}
    </div>
  )
}

function PanelTopLink({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="m-0 text-lg font-black tracking-[-0.4px] text-slate-950">{title}</h3>
      <button className="font-black text-blue-600" type="button">
        전체 보기
      </button>
    </div>
  )
}

function MapPanel({
  isLoading,
  recommendationItems,
  recommendationMap,
}: {
  isLoading: boolean
  recommendationItems: BackendRecommendationItem[]
  recommendationMap?: BackendRecommendationMap
}) {
  const hasRecommendationMap = recommendationItems.length > 0

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)] lg:row-span-2">
      <div className="flex items-center justify-between gap-3">
        <PanelTitle info>광주 2호선 추천 역세권 지도</PanelTitle>
        <button
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700"
          type="button"
        >
          CSV 추천 위치
        </button>
      </div>

      <div className="relative mt-3.5 h-[440px] overflow-hidden rounded-[10px] border border-slate-200 bg-slate-50 max-sm:h-[320px]">
        {hasRecommendationMap ? (
          <RecommendationMap items={recommendationItems} map={recommendationMap} />
        ) : (
          <div className="flex h-full items-center justify-center px-5 text-center">
            <div>
              <strong className="block text-sm font-black text-slate-800">
                {isLoading
                  ? '추천 CSV 지도를 불러오는 중입니다.'
                  : '추천 CSV 지도 데이터가 없습니다.'}
              </strong>
              <p className="m-0 mt-2 text-xs font-bold leading-relaxed text-slate-500">
                추천 API가 연결되면 실제 좌표 기반 역세권 지도가 표시됩니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function RecommendationMetricChart({
  isLoading,
  points,
}: {
  isLoading: boolean
  points: DashboardRecommendationMetricPoint[]
}) {
  const chartPoints = points.slice(0, 5)
  const plot = {
    height: 142,
    width: 450,
    x: 44,
    y: 24,
  }
  const gridValues = [100, 75, 50, 25, 0] as const
  const groupWidth = chartPoints.length > 0 ? plot.width / chartPoints.length : plot.width
  const barGap = 4
  const barWidth = Math.min(
    12,
    Math.max(7, (groupWidth - 24) / recommendationMetricSeries.length),
  )
  const groupBarWidth =
    recommendationMetricSeries.length * barWidth +
    (recommendationMetricSeries.length - 1) * barGap
  const scoreToY = (score: number) =>
    plot.y + plot.height - (clampMetricScore(score) / 100) * plot.height
  const topPoint = chartPoints.reduce<DashboardRecommendationMetricPoint | null>(
    (highest, point) => {
      if (!highest || point.suitabilityScore > highest.suitabilityScore) {
        return point
      }

      return highest
    },
    null,
  )

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PanelTitle>
          추천 역세권 지표 비교{' '}
          <small className="text-xs text-slate-600">(CSV Top 5)</small>
        </PanelTitle>
        <div className="flex flex-wrap items-center gap-2">
          {topPoint ? (
            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
              최고 종합 {topPoint.station} {formatPoint(topPoint.suitabilityScore)}점
            </span>
          ) : null}
          <button
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700"
            type="button"
          >
            지표 비교
            <ChevronDown aria-hidden="true" size={14} />
          </button>
        </div>
      </div>

      {chartPoints.length > 0 ? (
        <div className="mt-3 h-[254px] overflow-hidden rounded-lg border border-slate-100 bg-white px-2 py-3">
          <svg
            aria-label="CSV 추천 Top 5 역세권 지표 비교 그래프"
            className="h-[200px] w-full"
            role="img"
            viewBox="0 0 520 214"
          >
            {gridValues.map((value) => {
              const y = scoreToY(value)

              return (
                <g key={value}>
                  <line
                    stroke="#e5ebf3"
                    x1={plot.x}
                    x2={plot.x + plot.width}
                    y1={y}
                    y2={y}
                  />
                  <text
                    fill="#64748b"
                    fontSize="11"
                    fontWeight="800"
                    textAnchor="end"
                    x={plot.x - 10}
                    y={y + 4}
                  >
                    {value}
                  </text>
                </g>
              )
            })}

            {chartPoints.map((point, pointIndex) => {
              const groupX =
                plot.x +
                pointIndex * groupWidth +
                Math.max(8, (groupWidth - groupBarWidth) / 2)
              const labelX = plot.x + pointIndex * groupWidth + groupWidth / 2

              return (
                <g key={`${point.rank}-${point.station}`}>
                  {recommendationMetricSeries.map((series, seriesIndex) => {
                    const score = point[series.key]
                    const y = scoreToY(score)
                    const barHeight = plot.y + plot.height - y
                    const x = groupX + seriesIndex * (barWidth + barGap)

                    return (
                      <rect
                        fill={series.color}
                        height={barHeight}
                        key={series.key}
                        rx="3"
                        width={barWidth}
                        x={x}
                        y={y}
                      >
                        <title>
                          {point.station} {series.label}: {formatPoint(score)}점
                        </title>
                      </rect>
                    )
                  })}
                  <text
                    fill="#475569"
                    fontSize="11"
                    fontWeight="800"
                    textAnchor="middle"
                    x={labelX}
                    y={plot.y + plot.height + 24}
                  >
                    {formatStationTick(point.station)}
                  </text>
                </g>
              )
            })}
          </svg>
          <div className="mt-1 flex flex-wrap justify-end gap-x-4 gap-y-2 text-[11px] font-black text-slate-600">
            {recommendationMetricSeries.map((series) => (
              <span className="inline-flex items-center gap-1.5" key={series.key}>
                <span
                  className="h-2.5 w-4 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                {series.label}
              </span>
            ))}
          </div>
          <p className="m-0 mt-2 text-xs font-bold text-slate-500">
            추천 CSV API에서 내려온 지표만 표시합니다.
          </p>
        </div>
      ) : (
        <div className="mt-3 flex h-[254px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
          <div>
            <strong className="block text-sm font-black text-slate-800">
              {isLoading
                ? '추천 CSV 지표를 불러오는 중입니다.'
                : '표시할 추천 CSV 지표가 없습니다.'}
            </strong>
            <p className="m-0 mt-2 text-xs font-bold leading-relaxed text-slate-500">
              실제 추천 API 응답이 있을 때만 그래프를 그립니다.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

function BusinessPotentialPanel({
  items,
  selectedBusinessLabels,
}: {
  items: BusinessPotential[]
  selectedBusinessLabels: string[]
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)]">
      <div className="flex items-center justify-between">
        <PanelTitle>
          업종별 점포 분포 <small className="text-xs text-slate-600">(상위 5)</small>
        </PanelTitle>
        <button
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700"
          type="button"
        >
          점포 수 기준
          <ChevronDown aria-hidden="true" size={14} />
        </button>
      </div>

      <div className="mt-6 grid gap-[18px]">
        {items.length > 0 ? (
          items.map((item) => {
            const percentage = Number.parseFloat(item.percentage)
            const width = Number.isFinite(percentage)
              ? Math.min(100, percentage * 3.2)
              : 40
            const isSelected = selectedBusinessLabels.includes(item.businessType)

            return (
              <div
                className="grid grid-cols-[105px_1fr_78px_58px] items-center gap-2.5 max-sm:grid-cols-[88px_1fr]"
                key={item.businessType}
              >
                <span
                  className={`text-sm font-black ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}
                >
                  {item.businessType}
                </span>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="text-right text-xs font-black text-slate-700 max-sm:hidden">
                  {item.value}
                </span>
                <span className="text-xs font-extrabold text-slate-500 max-sm:hidden">
                  ({item.percentage})
                </span>
              </div>
            )
          })
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
            실제 CSV 응답에 표시할 업종 분포가 없습니다.
          </div>
        )}
      </div>
    </section>
  )
}

function RecommendedStationTable({ items }: { items: RecommendedStation[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)] lg:col-span-2">
      <PanelTitle info>CSV 추천 역세권 TOP 5</PanelTitle>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="h-9 bg-slate-50 px-4 text-left text-xs font-black text-slate-500">
                순위
              </th>
              <th className="h-9 bg-slate-50 px-4 text-left text-xs font-black text-slate-500">
                역세권
              </th>
              <th className="h-9 bg-slate-50 px-4 text-left text-xs font-black text-slate-500">
                종합 점수
              </th>
              <th className="h-9 bg-slate-50 px-4 text-left text-xs font-black text-slate-500">
                핵심 강점
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.rank}>
                  <td className="h-10 border-b border-slate-100 px-4 text-center font-black text-slate-950">
                    {item.rank}
                  </td>
                  <td className="h-10 border-b border-slate-100 px-4 font-extrabold text-slate-700">
                    {item.station}
                  </td>
                  <td className="h-10 border-b border-slate-100 px-4 font-black text-emerald-600">
                    {item.score}
                  </td>
                  <td className="h-10 border-b border-slate-100 px-4">
                    <div className="flex flex-wrap gap-2">
                      {item.strengths.map((strength) => (
                        <span
                          className="inline-flex h-6 items-center rounded-full border border-slate-200 px-3 text-xs font-extrabold text-slate-500"
                          key={strength}
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="h-24 border-b border-slate-100 px-4 text-center text-sm font-bold text-slate-500"
                  colSpan={4}
                >
                  실제 추천 CSV 응답에 표시할 Top 5 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RecentReportsPanel({ reports }: { reports: DashboardRecentReport[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)]">
      <PanelTopLink title="최근 저장한 리포트" />

      <div className="mt-3.5 grid">
        {reports.length > 0 ? (
          reports.map((report) => (
            <div
              className="grid min-h-[60px] grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-slate-100 last:border-b-0 max-sm:grid-cols-[44px_1fr]"
              key={report.id}
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <FileText aria-hidden="true" size={21} />
              </div>
              <div>
                <strong className="block text-sm text-slate-900">{report.title}</strong>
                <span className="mt-1 block text-xs text-slate-500">
                  {report.location}
                </span>
              </div>
              <div className="flex items-center gap-3 max-sm:col-span-2 max-sm:ml-11">
                <span className="text-xs font-extrabold text-slate-500">
                  {report.date}
                </span>
                <em className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-black not-italic text-blue-600">
                  {report.tag}
                </em>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
            저장된 리포트가 없습니다.
          </div>
        )}
      </div>
    </section>
  )
}

function InsightsPanel({ insights }: { insights: DashboardInsight[] }) {
  const toneClasses = {
    blue: 'bg-blue-400',
    green: 'bg-emerald-300',
    red: 'bg-rose-400',
  } satisfies Record<DashboardInsight['tone'], string>

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)]">
      <PanelTopLink title="CSV 인사이트 요약" />

      <div className="mt-3.5 grid">
        {insights.length > 0 ? (
          insights.map((item) => {
            const Icon = insightIcons[item.iconKey]

            return (
              <div
                className="grid grid-cols-[44px_1fr] gap-3 border-b border-slate-100 py-3 last:border-b-0"
                key={item.id}
              >
                <div
                  className={`grid h-10 w-10 place-items-center rounded-full text-white ${toneClasses[item.tone]}`}
                >
                  <Icon aria-hidden="true" size={18} />
                </div>
                <div>
                  <strong className="block text-sm text-slate-900">{item.title}</strong>
                  <p className="m-0 mt-1.5 text-xs leading-relaxed text-slate-500">
                    {item.message}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
            실제 API 응답을 확인한 뒤 인사이트를 표시합니다.
          </div>
        )}
      </div>
    </section>
  )
}

function NoticesPanel({ notices }: { notices: DashboardNotice[] }) {
  const labelClasses = {
    danger: 'bg-rose-50 text-rose-600',
    info: 'bg-blue-50 text-blue-600',
    warning: 'bg-amber-50 text-amber-600',
  } satisfies Record<(typeof dashboardNotices)[number]['type'], string>

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)]">
      <PanelTopLink title="알림 및 공지" />

      <div className="mt-3.5 grid">
        {notices.length > 0 ? (
          notices.map((notice) => (
            <button
              className="grid min-h-16 grid-cols-[58px_1fr_24px] items-center gap-3 border-b border-slate-100 text-left last:border-b-0"
              key={notice.title}
              type="button"
            >
              <span
                className={`grid h-8 place-items-center rounded-lg text-xs font-black ${labelClasses[notice.type]}`}
              >
                {notice.label}
              </span>
              <span>
                <strong className="block text-sm text-slate-900">{notice.title}</strong>
                <span className="mt-1.5 block text-xs text-slate-500">
                  {notice.description}
                </span>
              </span>
              <ChevronRight aria-hidden="true" size={20} />
            </button>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
            실제 API 응답을 확인한 뒤 알림을 표시합니다.
          </div>
        )}
      </div>
    </section>
  )
}

function DataSourceStatusPanel({
  commercialMapData,
  recommendationsData,
}: {
  commercialMapData: BackendCommercialAnalysisMapData | null
  recommendationsData: BackendRecommendationsResponse | undefined
}) {
  const sourceItems = [
    {
      id: 'commercial-map',
      label: '상권 지도',
      message: commercialMapData?.message,
      status: commercialMapData?.data_status,
    },
    {
      id: 'recommendations',
      label: '입지 추천',
      message: recommendationsData?.message,
      status: recommendationsData?.data_status,
    },
  ] as const

  return (
    <section
      aria-label="대시보드 데이터 출처"
      className="mb-3 grid gap-2 rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm shadow-sm md:grid-cols-2"
      data-testid="dashboard-data-source-status"
    >
      {sourceItems.map((source) => (
        <div className="min-w-0" key={source.id}>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-slate-900">{source.label}</strong>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
              {formatDashboardDataSource(source.status)}
            </span>
          </div>
          <p className="m-0 mt-1 text-xs font-bold leading-relaxed text-slate-500">
            {source.message || 'FastAPI 응답을 확인하고 있습니다.'}
          </p>
        </div>
      ))}
    </section>
  )
}

export function DashboardPage() {
  const stationSetup = safeParseStorage<StoredStationSetup>(
    'metropick-onboarding-stations',
  )
  const businessSetup = safeParseStorage<StoredBusinessTypeSetup>(
    'metropick-onboarding-business-types',
  )
  const notificationSetup = safeParseStorage<StoredNotificationSetup>(
    'metropick-onboarding-notifications',
  )
  const onboardingSummary = safeParseStorage<StoredOnboardingSummary>(
    'metropick-onboarding-summary',
  )
  const commercialMapQuery = useQuery({
    queryKey: ['dashboard-commercial-map-data'],
    queryFn: () =>
      getBackendCommercialAnalysisMapData({
        layers: [...dashboardMapLayers],
        line: '2호선',
        radiusM: 500,
        region: '광주광역시',
      }),
    retry: false,
  })
  const backendRecommendationsQuery = useBackendRecommendations(5)

  const [lastUpdated, setLastUpdated] = useState(() =>
    formatDashboardTimestamp(new Date()),
  )
  const stationCount = stationSetup?.selectedStations?.length ?? 0
  const selectedBusinessLabels = businessSetup?.selectedBusinessLabels ?? []
  const notificationCount = Math.max(
    notificationSetup?.enabledNotificationIds?.length ?? 3,
    3,
  )
  const completedLabel = onboardingSummary?.completedAt
    ? `온보딩 완료: ${onboardingSummary.completedAt}`
    : '온보딩 기본 설정'
  const commercialMapData = commercialMapQuery.isSuccess ? commercialMapQuery.data : null
  const recommendationItems = useMemo(() => {
    if (backendRecommendationsQuery.isSuccess) {
      return backendRecommendationsQuery.data.items
    }

    return backendRecommendationsQuery.isError ? undefined : emptyRecommendationItems
  }, [
    backendRecommendationsQuery.data?.items,
    backendRecommendationsQuery.isError,
    backendRecommendationsQuery.isSuccess,
  ])
  const commercialSummaryCards = useMemo(() => {
    if (commercialMapQuery.isSuccess) {
      return commercialMapData?.summary_cards ?? emptySummaryCards
    }

    return commercialMapQuery.isError ? undefined : emptySummaryCards
  }, [commercialMapData?.summary_cards, commercialMapQuery.isError, commercialMapQuery.isSuccess])
  const commercialBusinessDistribution = useMemo(() => {
    if (commercialMapQuery.isSuccess) {
      return commercialMapData?.business_distribution ?? emptyBusinessDistribution
    }

    return commercialMapQuery.isError ? undefined : emptyBusinessDistribution
  }, [
    commercialMapData?.business_distribution,
    commercialMapQuery.isError,
    commercialMapQuery.isSuccess,
  ])
  const shouldUseMockFallback =
    commercialMapQuery.isError && backendRecommendationsQuery.isError
  const dashboardKpiItems = useMemo(
    () => buildDashboardKpis(commercialSummaryCards),
    [commercialSummaryCards],
  )
  const businessPotentialItems = useMemo(
    () => buildBusinessPotentials(commercialBusinessDistribution),
    [commercialBusinessDistribution],
  )
  const recommendedStationItems = useMemo(
    () => buildRecommendedStations(recommendationItems),
    [recommendationItems],
  )
  const recommendationMetricPoints = useMemo(
    () => buildRecommendationMetricPoints(recommendationItems),
    [recommendationItems],
  )
  const dashboardInsightItems = useMemo(
    () =>
      buildDashboardInsights({
        commercialMapData,
        recommendationItems,
        useFallback: shouldUseMockFallback,
      }),
    [commercialMapData, recommendationItems, shouldUseMockFallback],
  )
  const dashboardNoticeItems = useMemo(
    () =>
      buildDashboardNotices({
        commercialMapData,
        recommendationItems,
        useFallback: shouldUseMockFallback,
      }),
    [commercialMapData, recommendationItems, shouldUseMockFallback],
  )
  const recentReports = useMemo(() => buildStoredDashboardReports(), [])
  const backendStatus = getDashboardBackendStatus({
    commercialDataStatus: commercialMapQuery.data?.data_status,
    isCommercialLoading: commercialMapQuery.isLoading,
    isRecommendationLoading: backendRecommendationsQuery.isLoading,
    recommendationDataStatus: backendRecommendationsQuery.data?.data_status,
  })
  const backendFallbackLabel = getDashboardFallbackLabel({
    commercialDataStatus: commercialMapQuery.data?.data_status,
    recommendationDataStatus: backendRecommendationsQuery.data?.data_status,
  })

  const handleRefresh = () => {
    void commercialMapQuery.refetch()
    void backendRecommendationsQuery.refetch()
    setLastUpdated(formatDashboardTimestamp(new Date()))
  }

  return (
    <div className="dashboard-page min-h-screen w-full bg-slate-50 text-slate-950">
      <TopNavigation activeHref="/dashboard" />

      <div className="flex min-h-[calc(100vh-var(--app-topbar-height)-var(--app-footer-height))] max-[1121px]:flex-col">
        <AppSidebar activeHref="/dashboard" ariaLabel="대시보드 사이드 메뉴" />

        <main className="min-w-0 flex-1">
          <section className="px-10 py-7 max-lg:px-4">
            <span className="sr-only">{completedLabel}</span>

            <div className="mb-5 flex items-start justify-between gap-4 max-xl:flex-col">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="m-0 text-[31px] font-black tracking-[-0.8px] text-slate-950">
                    광주 2호선 상권 변화 대시보드
                  </h1>
                  <BackendStatusBadge
                    connectedLabel="FastAPI CSV 데이터 연결됨"
                    fallbackLabel={backendFallbackLabel}
                    loadingLabel="FastAPI 데이터 확인 중"
                    status={backendStatus}
                  />
                </div>
                <p className="m-0 mt-2 text-sm font-bold text-slate-500">
                  데이터 업데이트: {lastUpdated}
                </p>
              </div>

              <div className="flex flex-col items-end gap-3 max-xl:items-start">
                <DashboardControls
                  notificationCount={notificationCount}
                  stationCount={stationCount}
                />
                <button
                  className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 font-extrabold text-slate-700"
                  onClick={handleRefresh}
                  type="button"
                >
                  <RefreshCw aria-hidden="true" size={16} />
                  새로고침
                </button>
              </div>
            </div>

            <div className="mb-3">
              <SimulationDisclaimer />
            </div>

            <DataSourceStatusPanel
              commercialMapData={commercialMapData}
              recommendationsData={backendRecommendationsQuery.data}
            />

            {!onboardingSummary ? (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                온보딩 정보가 없어 기본 데모 설정으로 대시보드를 표시합니다.
              </div>
            ) : null}

            <div className="grid grid-cols-4 gap-4 max-[1880px]:grid-cols-2 max-sm:grid-cols-1">
              {dashboardKpiItems.map((kpi) => (
                <SummaryCard key={kpi.id} kpi={kpi} />
              ))}
            </div>

            <div className="mt-3.5 grid grid-cols-[1.45fr_0.85fr_0.85fr] gap-3.5 max-[1880px]:grid-cols-2 max-lg:grid-cols-1">
              <MapPanel
                isLoading={backendRecommendationsQuery.isLoading}
                recommendationItems={recommendationItems ?? []}
                recommendationMap={backendRecommendationsQuery.data?.map}
              />
              <RecommendationMetricChart
                isLoading={backendRecommendationsQuery.isLoading}
                points={recommendationMetricPoints}
              />
              <BusinessPotentialPanel
                items={businessPotentialItems}
                selectedBusinessLabels={selectedBusinessLabels}
              />
              <RecommendedStationTable items={recommendedStationItems} />
            </div>

            <div className="mt-3.5 grid grid-cols-3 gap-3.5 max-xl:grid-cols-1">
              <RecentReportsPanel reports={recentReports} />
              <InsightsPanel insights={dashboardInsightItems} />
              <NoticesPanel notices={dashboardNoticeItems} />
            </div>
          </section>
        </main>
      </div>
      <AppFooter />
    </div>
  )
}

export default DashboardPage
