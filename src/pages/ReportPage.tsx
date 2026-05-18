import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { LatLngExpression } from 'leaflet'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  Coffee,
  FileDown,
  Gauge,
  Link as LinkIcon,
  Megaphone,
  RefreshCw,
  Route,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Target,
  TrendingUp,
  UsersRound,
} from 'lucide-react'
import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'

import { reportAssets } from '@/shared/assets/reportAssets'
import { AppFooter } from '@/shared/components/AppFooter'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { ImageWithFallback } from '@/shared/components/ImageWithFallback'
import { SimulationDisclaimer } from '@/shared/components/SimulationDisclaimer'
import { TopNavigation } from '@/shared/components/TopNavigation'
import { mockStations } from '@/shared/data/mockStations'
import { safeParseStorage, writeStorage } from '@/shared/lib/storage'

type ReportMetric = {
  caption: string
  id: string
  label: string
  point?: string
  value: string
  variant?: 'stars'
}

type ReportFactor = {
  description?: string
  id: string
  label: string
}

type FutureSalesReport = {
  annualGrowthRate: string
  businessType: string
  createdAt: string
  expectedAnnualSales2030: string
  id: string
  investmentFit: '상' | '중' | '하'
  mapCoordinate?: ReportCoordinate
  radius: string
  scenario: string
  stationArea: string
  title: string
}

type ReportCoordinate = {
  lat: number
  lng: number
}

type ReportSummary = {
  analysisDate: string
  businessType: string
  coordinate?: ReportCoordinate
  coordinateSourceLabel: string
  expectedOpeningDate: string
  model: string
  radius: string
  scenario: string
  stationArea: string
  stationLabel: string
  title: string
}

type StoredRecommendation = {
  accessibility?: number
  businessType?: string
  competition?: number
  createdAt?: string
  dataStatus?: string
  district?: string
  growth?: number
  lat?: number | null
  line?: string
  lng?: number | null
  reason?: string
  riskLevel?: string
  score?: number
  sourceLabel?: string
  stability?: number
  station?: string
  stationId?: string
}

type StoredPredictionSimulation = {
  business_diversity_index?: number
  competition_index?: number
  data_status?: string
  floating_demand_index?: number
  predicted_growth_rate?: number
  predicted_sales_change_rate?: number
  startup_suitability_score?: number
}

type StoredPredictionResult = {
  aiSummaryComment?: string
  backendPredictionSimulation?: StoredPredictionSimulation
  businessType?: string
  createdAt?: string
  predicted_score?: number
  predictedSalesGrowthRate?: number
  riskLevel?: string
  stationArea?: string
  strategyComment?: string
}

type StoredOnboardingSummary = {
  completedAt?: string
}

const defaultReportSummary: ReportSummary = {
  analysisDate: '2025.05.25',
  businessType: '카페/커피전문점',
  coordinate: { lat: 35.1335, lng: 126.9007 },
  coordinateSourceLabel: '내장 역 좌표',
  expectedOpeningDate: '2027.12 (예정)',
  model: 'MetroPick AI v2.1',
  radius: '500m',
  scenario: '2027 개통 시나리오',
  stationArea: '백운광장역 500m 상권',
  stationLabel: '백운광장역',
  title: '백운광장역 500m 상권 미래 매출 예측 리포트',
}

const metricCards: ReportMetric[] = [
  {
    id: 'annual-sales-2030',
    label: '예상 연평균 매출 (2030)',
    value: '3.21억 원',
    caption: '연평균 성장률',
    point: '+24.3%',
  },
  {
    id: 'third-year-sales',
    label: '개통 3년차 매출 (2029)',
    value: '2.93억 원',
    caption: '2026년 대비',
    point: '+118%',
  },
  {
    id: 'max-monthly-sales',
    label: '최대 월 매출 (2030.05)',
    value: '3,950만 원',
    caption: '성수기 (5월) 기준',
  },
  {
    id: 'break-even',
    label: '손익분기점 도달 시점',
    value: '15개월',
    caption: '개업 후 예상',
  },
  {
    id: 'investment-fit',
    label: '투자 적합도',
    value: '상',
    caption: '별점 5점',
    variant: 'stars',
  },
]

const opportunities: ReportFactor[] = [
  { id: 'transit-traffic', label: '2호선 개통에 따른 유동인구 급증' },
  { id: 'redevelopment', label: '대규모 재개발·재건축 진행' },
  { id: 'young-demand', label: '젊은 층 유입 및 소비 트렌드 변화' },
  { id: 'housing-demand', label: '배후 주거 밀집 및 근린 수요 확대' },
  { id: 'low-cafe-competition', label: '상권 내 경쟁 카페 수 낮음' },
]

const risks: ReportFactor[] = [
  { id: 'opening-delay', label: '개통 초기 상권 형성 지연 가능성' },
  { id: 'construction-competition', label: '공공 공사에 따른 경쟁 심화 우려' },
  { id: 'cost-pressure', label: '임대료 및 인건비 상승 압력' },
  { id: 'seasonality', label: '계절성 및 경기 변동 영향' },
  { id: 'brand-awareness', label: '브랜드 인지도 확보 필요' },
]

const evidenceItems: Array<{
  description: string
  icon: LucideIcon
  title: string
}> = [
  {
    title: '유동인구 예측',
    description: '광주 2호선 교통 수요 예측 모델 기반',
    icon: UsersRound,
  },
  {
    title: '배후 수요 분석',
    description: '주택보급률, 통계청, 광주시 데이터 기반',
    icon: Route,
  },
  {
    title: '상권 트렌드 분석',
    description: '카드 매출, POS, SNS, 리뷰 데이터 기반',
    icon: Store,
  },
  {
    title: 'AI 예측 모델',
    description: '시계열 + 회귀 + 딥러닝 하이브리드 모델',
    icon: Sparkles,
  },
]

const warningItems: ReportFactor[] = [
  {
    id: 'opening-schedule',
    label: '개통 지연 리스크',
    description: '개통 일정 변동 시 매출 성장 시점 지연 가능',
  },
  {
    id: 'district-growth',
    label: '상권 성장 지연',
    description: '주변 개발 및 입주 지연 시 수요 감소 가능',
  },
  {
    id: 'competition-risk',
    label: '경쟁 심화 리스크',
    description: '유사 브랜드 입점 증가 시 수익성 악화 가능',
  },
  {
    id: 'macro-risk',
    label: '거시 경제 리스크',
    description: '경기 침체 및 소비 위축 시 매출 감소 가능',
  },
]

const strategyCards: Array<{
  description: string
  icon: LucideIcon
  id: string
  title: string
  tone: string
}> = [
  {
    id: '01',
    title: '프리미엄 포지셔닝',
    description: '고품질 원두, 스페셜티 커피, 시그니처 메뉴로 차별화',
    icon: Coffee,
    tone: 'border-blue-100 bg-gradient-to-br from-blue-50 to-white text-blue-600',
  },
  {
    id: '02',
    title: '오픈 초기 마케팅 집중',
    description: '개통 전후 SNS, 지역 커뮤니티 연계 마케팅 강화',
    icon: Megaphone,
    tone: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-emerald-600',
  },
  {
    id: '03',
    title: '공간 경험 강화',
    description: '스터디/모임 특화 공간, 감성 인테리어로 체류 유도',
    icon: BriefcaseBusiness,
    tone: 'border-violet-100 bg-gradient-to-br from-violet-50 to-white text-violet-600',
  },
  {
    id: '04',
    title: '시즌/이벤트 전략',
    description: '계절 메뉴, 지역 행사 연계로 재방문 및 입소문 유도',
    icon: CalendarDays,
    tone: 'border-orange-100 bg-gradient-to-br from-orange-50 to-white text-orange-500',
  },
]

type MapStat = {
  label: string
  value: string
}

type ReportInsight = {
  body: string
  conclusion: string
  sourceLabel: string
}

const defaultMapCenter: [number, number] = [35.1595, 126.8526]

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function cleanText(value?: string): string {
  return value?.trim() ?? ''
}

function normalizeReportKey(value?: string): string {
  return normalizeStationLabel(value).replace(/\s/g, '').toLowerCase()
}

function getStoredCoordinate(
  selectedRecommendation: StoredRecommendation | null,
): ReportCoordinate | undefined {
  const lat = selectedRecommendation?.lat
  const lng = selectedRecommendation?.lng

  if (isFiniteNumber(lat) && isFiniteNumber(lng)) {
    return {
      lat,
      lng,
    }
  }

  return undefined
}

function findStationCoordinate(stationLabel: string): ReportCoordinate | undefined {
  const stationKey = normalizeReportKey(stationLabel)
  const station = mockStations.find(
    (item) =>
      normalizeReportKey(item.name) === stationKey ||
      normalizeReportKey(item.id) === stationKey,
  )

  if (!station) {
    return undefined
  }

  return {
    lat: station.latitude,
    lng: station.longitude,
  }
}

function getRecommendationSourceLabel(
  selectedRecommendation: StoredRecommendation | null,
): string {
  const explicitSourceLabel = cleanText(selectedRecommendation?.sourceLabel)
  if (explicitSourceLabel) {
    return explicitSourceLabel
  }

  if (selectedRecommendation?.dataStatus === 'recommendation_csv') {
    return 'FastAPI 추천 CSV'
  }

  if (selectedRecommendation?.dataStatus === 'sample_fixture') {
    return 'FastAPI 샘플 추천'
  }

  if (selectedRecommendation?.dataStatus === 'mock_fixture') {
    return '목업 추천 데이터'
  }

  return selectedRecommendation ? '저장된 추천 데이터' : '선택 데이터 없음'
}

function resolveReportCoordinate(
  stationLabel: string,
  selectedRecommendation: StoredRecommendation | null,
): { coordinate?: ReportCoordinate; sourceLabel: string } {
  const storedCoordinate = getStoredCoordinate(selectedRecommendation)
  if (storedCoordinate) {
    return {
      coordinate: storedCoordinate,
      sourceLabel: `${getRecommendationSourceLabel(selectedRecommendation)} 좌표`,
    }
  }

  const stationCoordinate = findStationCoordinate(stationLabel)
  if (stationCoordinate) {
    return {
      coordinate: stationCoordinate,
      sourceLabel: '내장 역 좌표',
    }
  }

  return {
    sourceLabel: '좌표 없음',
  }
}

function formatIndexScore(value: number | undefined): string {
  return isFiniteNumber(value) ? `${Math.round(value)}점` : '데이터 없음'
}

function coalesceNumber(...values: Array<number | undefined>): number | undefined {
  return values.find(isFiniteNumber)
}

function getFitLabel(score: number | undefined): string {
  if (!isFiniteNumber(score)) {
    return '데이터 연결 필요'
  }

  if (score >= 85) {
    return '매우 유망'
  }

  if (score >= 70) {
    return '검토 유망'
  }

  return '보수 검토'
}

function buildMapStats(
  selectedRecommendation: StoredRecommendation | null,
  predictionResult: StoredPredictionResult | undefined,
): MapStat[] {
  const simulation = predictionResult?.backendPredictionSimulation

  return [
    {
      label: '추천 점수',
      value: formatIndexScore(
        coalesceNumber(
          selectedRecommendation?.score,
          predictionResult?.predicted_score,
          simulation?.startup_suitability_score,
        ),
      ),
    },
    {
      label: '성장성',
      value: formatIndexScore(
        coalesceNumber(
          selectedRecommendation?.growth,
          predictionResult?.predictedSalesGrowthRate,
          simulation?.floating_demand_index,
        ),
      ),
    },
    {
      label: '경쟁도',
      value: formatIndexScore(
        coalesceNumber(selectedRecommendation?.competition, simulation?.competition_index),
      ),
    },
    {
      label: '상권 다양성',
      value: formatIndexScore(
        coalesceNumber(selectedRecommendation?.stability, simulation?.business_diversity_index),
      ),
    },
  ]
}

function buildReportInsight(
  reportSummary: ReportSummary,
  selectedRecommendation: StoredRecommendation | null,
  predictionResult: StoredPredictionResult | undefined,
): ReportInsight {
  const simulation = predictionResult?.backendPredictionSimulation
  const recommendationSourceLabel = getRecommendationSourceLabel(selectedRecommendation)
  const predictionSummary = cleanText(predictionResult?.aiSummaryComment)
  const score = coalesceNumber(
    selectedRecommendation?.score,
    predictionResult?.predicted_score,
    simulation?.startup_suitability_score,
  )
  const growth = coalesceNumber(
    selectedRecommendation?.growth,
    predictionResult?.predictedSalesGrowthRate,
    simulation?.floating_demand_index,
  )
  const competition = coalesceNumber(
    selectedRecommendation?.competition,
    simulation?.competition_index,
  )
  const sourceLabel = predictionSummary
    ? '예측 API 응답'
    : recommendationSourceLabel

  if (predictionSummary) {
    return {
      sourceLabel,
      body: `${predictionSummary} 이 요약은 저장된 예측 API 응답과 선택 추천 지표를 바탕으로 표시되며, 실제 매출을 보장하지 않습니다.`,
      conclusion: `종합 결론: ${getFitLabel(score)}${
        isFiniteNumber(score) ? ` (추천 점수 ${Math.round(score)}점)` : ''
      }`,
    }
  }

  if (isFiniteNumber(score) || isFiniteNumber(growth) || isFiniteNumber(competition)) {
    const metricSummary = [
      isFiniteNumber(score) ? `추천 점수 ${Math.round(score)}점` : '',
      isFiniteNumber(growth) ? `성장성 ${Math.round(growth)}점` : '',
      isFiniteNumber(competition) ? `경쟁도 ${Math.round(competition)}점` : '',
    ]
      .filter(Boolean)
      .join(', ')
    const reason = cleanText(selectedRecommendation?.reason)

    return {
      sourceLabel,
      body: `${reportSummary.stationArea}의 ${reportSummary.businessType} 업종은 ${recommendationSourceLabel} 지표를 반영했습니다. ${metricSummary}을 기준으로 요약했으며${
        reason ? `, 추천 사유는 "${reason}"입니다` : ''
      }. 이 내용은 저장된 추천 데이터 기반의 참고용 판단이며 실제 매출을 보장하지 않습니다.`,
      conclusion: `종합 결론: ${getFitLabel(score)}${
        isFiniteNumber(score) ? ` (추천 점수 ${Math.round(score)}점)` : ''
      }`,
    }
  }

  return {
    sourceLabel,
    body: `${reportSummary.stationArea}의 ${reportSummary.businessType} 업종은 아직 선택 추천 또는 예측 API 응답이 없어 기본 리포트 구조만 표시 중입니다. 실제 CSV/API 데이터가 연결되면 요약 인사이트가 해당 지표로 다시 계산됩니다.`,
    conclusion: '종합 결론: 데이터 연결 필요',
  }
}

function normalizeStationLabel(station?: string): string {
  const trimmedStation = station?.trim()

  if (!trimmedStation) {
    return defaultReportSummary.stationLabel
  }

  return trimmedStation.replace(/\s*500m\s*상권$/u, '')
}

function normalizeBusinessType(businessType?: string): string {
  const trimmedBusinessType = businessType?.trim()
  return trimmedBusinessType || defaultReportSummary.businessType
}

function getBusinessBadgeLabel(businessType: string): string {
  const [firstSegment] = businessType.split(/[/·,]/u)
  return firstSegment?.trim() || businessType
}

function buildReportSummary(selectedRecommendation: StoredRecommendation | null) {
  const stationLabel = normalizeStationLabel(selectedRecommendation?.station)
  const businessType = normalizeBusinessType(selectedRecommendation?.businessType)
  const stationArea = `${stationLabel} 500m 상권`
  const { coordinate, sourceLabel } = resolveReportCoordinate(
    stationLabel,
    selectedRecommendation,
  )

  return {
    ...defaultReportSummary,
    businessType,
    coordinate,
    coordinateSourceLabel: sourceLabel,
    stationArea,
    stationLabel,
    title: `${stationArea} 미래 매출 예측 리포트`,
  } satisfies ReportSummary
}

function buildCurrentReport(reportSummary: ReportSummary): FutureSalesReport {
  return {
    id: `future-sales-report-${Date.now()}`,
    title: reportSummary.title,
    stationArea: reportSummary.stationArea,
    businessType: reportSummary.businessType,
    scenario: reportSummary.scenario,
    radius: reportSummary.radius,
    expectedAnnualSales2030: '3.21억 원',
    annualGrowthRate: '+24.3%',
    investmentFit: '상',
    mapCoordinate: reportSummary.coordinate,
    createdAt: new Date().toISOString(),
  }
}

function saveCurrentReport(reportSummary: ReportSummary) {
  writeStorage('metropick-current-report', buildCurrentReport(reportSummary))
}

function getMatchedPredictionResult(
  predictionResults: StoredPredictionResult[],
  reportSummary: ReportSummary,
): StoredPredictionResult | undefined {
  const stationKeys = new Set([
    normalizeReportKey(reportSummary.stationLabel),
    normalizeReportKey(reportSummary.stationArea),
  ])
  const businessKey = cleanText(reportSummary.businessType)

  for (let index = predictionResults.length - 1; index >= 0; index -= 1) {
    const result = predictionResults[index]
    if (!result) {
      continue
    }

    const stationMatches =
      !result.stationArea || stationKeys.has(normalizeReportKey(result.stationArea))
    const businessMatches =
      !result.businessType || !businessKey || result.businessType === businessKey

    if (stationMatches && businessMatches) {
      return result
    }
  }

  return undefined
}

function CardTitle({ children, icon: Icon }: { children: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {Icon ? <Icon aria-hidden="true" className="text-blue-600" size={17} /> : null}
      <h3 className="m-0 text-base font-black tracking-normal text-slate-900">
        {children}
      </h3>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="grid grid-cols-[22px_92px_1fr] items-center gap-2 text-sm max-xl:grid-cols-[22px_1fr]">
      <Icon aria-hidden="true" className="text-slate-500" size={16} />
      <p className="m-0 font-extrabold text-slate-500">{label}</p>
      <strong className="font-black text-slate-900 max-xl:col-start-2">{value}</strong>
    </div>
  )
}

function MetricCard({ item }: { item: ReportMetric }) {
  return (
    <article className="flex min-h-[118px] flex-col items-center rounded-xl border border-blue-100 bg-gradient-to-b from-white to-slate-50 px-3 py-4 text-center">
      <p className="m-0 mb-2 text-xs font-black text-slate-500">{item.label}</p>
      <h3
        className={`m-0 mb-2 text-xl font-black tracking-normal ${
          item.variant === 'stars' ? 'text-emerald-600' : 'text-slate-900'
        }`}
      >
        {item.value}
      </h3>
      {item.point ? (
        <strong className="mb-1 text-base font-black text-emerald-600">{item.point}</strong>
      ) : null}
      {item.variant === 'stars' ? (
        <span aria-label="투자 적합도 별점 5점" className="flex gap-1 text-emerald-600">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star aria-hidden="true" fill="currentColor" key={star} size={16} />
          ))}
        </span>
      ) : (
        <small className="text-xs font-bold text-slate-500">{item.caption}</small>
      )}
    </article>
  )
}

function HeroCard({ reportSummary }: { reportSummary: ReportSummary }) {
  const businessBadgeLabel = getBusinessBadgeLabel(reportSummary.businessType)

  return (
    <section className="mb-3 grid min-h-[166px] min-w-0 grid-cols-[250px_minmax(0,1fr)_410px] items-center gap-5 rounded-xl border border-blue-100 bg-white/95 p-4 shadow-[0_10px_30px_rgba(25,55,90,0.06)] max-2xl:grid-cols-[250px_minmax(0,1fr)] max-lg:grid-cols-1">
      <div className="h-[136px] overflow-hidden rounded-xl bg-slate-200 max-lg:h-[210px]">
        <ImageWithFallback
          alt={`${reportSummary.stationLabel} 개통 예정 상권 대표 이미지`}
          className="h-full w-full object-cover"
          draggable={false}
          fallbackText="상권 대표 이미지를 불러올 수 없습니다."
          src={reportAssets.stationHero}
        />
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="m-0 text-2xl font-black tracking-normal text-slate-950 max-lg:text-2xl">
            {reportSummary.stationArea}
          </h2>
          <span className="inline-flex h-8 items-center rounded-full border border-orange-300 bg-orange-50 px-3 text-sm font-black text-orange-500">
            {businessBadgeLabel}
          </span>
          <span className="inline-flex h-8 items-center rounded-full border border-emerald-300 bg-emerald-50 px-3 text-sm font-black text-emerald-600">
            {reportSummary.stationLabel} 500m
          </span>
          <span className="inline-flex h-8 items-center rounded-full border border-blue-300 bg-blue-50 px-3 text-sm font-black text-blue-600">
            {reportSummary.scenario}
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 font-semibold text-slate-600">
          광주 2호선 {reportSummary.stationLabel} 개통(2027년 예정) 시점을 기준으로
          예측한{' '}
          <strong className="font-black text-slate-900">
            {reportSummary.businessType} 업종의 미래 매출
          </strong>
          전망 리포트입니다.
        </p>
      </div>

      <div className="grid gap-2.5 max-2xl:col-span-2 max-2xl:grid-cols-5 max-lg:col-span-1 max-lg:grid-cols-1">
        <InfoRow
          icon={CalendarDays}
          label="분석 기준일"
          value={reportSummary.analysisDate}
        />
        <InfoRow
          icon={RefreshCw}
          label="개통 예상일"
          value={reportSummary.expectedOpeningDate}
        />
        <InfoRow icon={Target} label="분석 반경" value={reportSummary.radius} />
        <InfoRow icon={Store} label="업종 분류" value={reportSummary.businessType} />
        <InfoRow icon={ShieldCheck} label="분석 모델" value={reportSummary.model} />
      </div>
    </section>
  )
}

function SummaryInsightCard({
  predictionResult,
  reportSummary,
  selectedRecommendation,
}: {
  predictionResult?: StoredPredictionResult
  reportSummary: ReportSummary
  selectedRecommendation: StoredRecommendation | null
}) {
  const insight = buildReportInsight(
    reportSummary,
    selectedRecommendation,
    predictionResult,
  )

  return (
    <section className="rounded-xl border border-blue-100 bg-white/95 px-4 py-3.5 shadow-[0_10px_30px_rgba(25,55,90,0.06)]">
      <CardTitle icon={Gauge}>
        요약 인사이트 <span className="text-sm text-slate-500">(데이터 기반 요약)</span>
      </CardTitle>
      <p className="m-0 text-sm leading-6 font-semibold text-slate-700">
        {insight.body}
      </p>
      <p className="m-0 mt-2 text-xs font-bold text-slate-500">
        반영 데이터: {insight.sourceLabel}
      </p>
      <div className="mt-3 flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 px-3 text-sm font-black text-emerald-700">
        <TrendingUp
          aria-hidden="true"
          className="rounded-lg border border-emerald-200 bg-white p-1"
          size={26}
        />
        {insight.conclusion}
      </div>
    </section>
  )
}

function MetricSection() {
  return (
    <section className="rounded-xl border border-blue-100 bg-white/95 px-4 py-3.5 shadow-[0_10px_30px_rgba(25,55,90,0.06)]">
      <CardTitle icon={BarChart3}>핵심 지표 요약</CardTitle>
      <div className="grid grid-cols-5 gap-3 max-2xl:grid-cols-2 max-md:grid-cols-1">
        {metricCards.map((item) => (
          <MetricCard item={item} key={item.id} />
        ))}
      </div>
    </section>
  )
}

function SalesTrendCard() {
  return (
    <section className="rounded-xl border border-blue-100 bg-white/95 px-4 py-3.5 shadow-[0_10px_30px_rgba(25,55,90,0.06)]">
      <CardTitle>연도별 예상 매출 추이</CardTitle>
      <div className="h-[190px] overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ImageWithFallback
          alt="연도별 예상 매출 추이 차트"
          className="h-full w-full object-contain"
          draggable={false}
          fallbackText="예상 매출 추이 차트를 불러올 수 없습니다."
          src={reportAssets.salesTrendChart}
        />
      </div>
      <p className="m-0 mt-3 text-xs font-bold text-slate-500">
        * 2025년은 개통 전 기준으로 시뮬레이션한 예측치입니다.
      </p>
    </section>
  )
}

function ReportMapViewport({ coordinate }: { coordinate?: ReportCoordinate }) {
  const map = useMap()

  useEffect(() => {
    if (coordinate) {
      map.setView([coordinate.lat, coordinate.lng], 15)
      return
    }

    map.setView(defaultMapCenter, 12)
  }, [coordinate, map])

  return null
}

function LocationMapSnapshot({
  coordinate,
  stationArea,
  stationLabel,
}: {
  coordinate?: ReportCoordinate
  stationArea: string
  stationLabel: string
}) {
  const center: LatLngExpression = coordinate
    ? [coordinate.lat, coordinate.lng]
    : defaultMapCenter

  return (
    <section
      aria-label={`${stationArea} 위치 기반 지도`}
      className="relative h-full w-full"
      role="region"
    >
      <MapContainer
        center={center}
        className="h-full w-full"
        dragging
        scrollWheelZoom={false}
        zoom={coordinate ? 15 : 12}
        zoomControl={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ReportMapViewport coordinate={coordinate} />

        {coordinate ? (
          <>
            <Circle
              center={[coordinate.lat, coordinate.lng]}
              color="#0f766e"
              fillColor="#14b8a6"
              fillOpacity={0.08}
              radius={500}
              weight={2}
            />
            <CircleMarker
              center={[coordinate.lat, coordinate.lng]}
              color="#ffffff"
              fillColor="#0d9488"
              fillOpacity={1}
              radius={8}
              weight={3}
            >
              <Tooltip direction="top" offset={[0, -10]} permanent>
                {stationLabel}
              </Tooltip>
            </CircleMarker>
          </>
        ) : null}
      </MapContainer>

      {coordinate ? (
        <div className="pointer-events-none absolute right-3 bottom-3 z-[500] rounded-lg border border-teal-100 bg-white/95 px-2.5 py-1.5 text-xs font-black text-teal-700 shadow-sm">
          500m 반경
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-x-4 top-4 z-[500] rounded-lg border border-amber-200 bg-white/95 px-3 py-2 text-center text-xs font-black text-amber-700 shadow-sm"
          role="status"
        >
          저장된 좌표가 없어 광주 전체 지도를 표시합니다.
        </div>
      )}
    </section>
  )
}

function MapSnapshotCard({
  predictionResult,
  reportSummary,
  selectedRecommendation,
}: {
  predictionResult?: StoredPredictionResult
  reportSummary: ReportSummary
  selectedRecommendation: StoredRecommendation | null
}) {
  const stats = buildMapStats(selectedRecommendation, predictionResult)

  return (
    <section className="rounded-xl border border-blue-100 bg-white/95 px-4 py-3.5 shadow-[0_10px_30px_rgba(25,55,90,0.06)]">
      <CardTitle>상권 지도 스냅샷</CardTitle>
      <div className="h-[190px] overflow-hidden rounded-xl border border-slate-200 bg-white">
        <LocationMapSnapshot
          coordinate={reportSummary.coordinate}
          stationArea={reportSummary.stationArea}
          stationLabel={reportSummary.stationLabel}
        />
      </div>
      <p className="m-0 mt-2 text-xs font-bold text-slate-500">
        지도 기준: {reportSummary.coordinateSourceLabel}
      </p>
      <div className="mt-2 grid grid-cols-4 gap-1.5 max-md:grid-cols-1">
        {stats.map((item) => (
          <div
            className="grid h-[52px] place-items-center rounded-lg border border-blue-100 bg-slate-50 text-center"
            key={item.label}
          >
            <p className="m-0 text-xs font-black text-slate-500">{item.label}</p>
            <strong className="text-sm font-black text-slate-900">{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function FactorList({
  items,
  title,
  type,
}: {
  items: ReportFactor[]
  title: string
  type: 'bad' | 'good'
}) {
  const isGood = type === 'good'

  return (
    <div
      className={`rounded-xl px-4 py-3.5 ${isGood ? 'bg-emerald-50' : 'bg-rose-50'}`}
    >
      <h4
        className={`m-0 mb-3 text-sm font-black ${isGood ? 'text-emerald-600' : 'text-rose-600'}`}
      >
        {title}
      </h4>
      <div className="grid gap-2">
        {items.map((item) => (
          <div className="flex items-start gap-2" key={item.id}>
            <span
              className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-white ${
                isGood ? 'bg-emerald-600' : 'bg-rose-500'
              }`}
            >
              {isGood ? (
                <ShieldCheck aria-hidden="true" size={11} />
              ) : (
                <AlertTriangle aria-hidden="true" size={11} />
              )}
            </span>
            <p className="m-0 text-[11px] leading-snug font-bold text-slate-700">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function FactorSection() {
  return (
    <section className="rounded-xl border border-blue-100 bg-white/95 px-4 py-3.5 shadow-[0_10px_30px_rgba(25,55,90,0.06)]">
      <CardTitle>기회 요인 vs 리스크 요인</CardTitle>
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <FactorList items={opportunities} title="기회 요인" type="good" />
        <FactorList items={risks} title="리스크 요인" type="bad" />
      </div>
    </section>
  )
}

function EvidenceCard() {
  return (
    <section className="rounded-xl border border-blue-100 bg-white/95 px-4 py-3.5 shadow-[0_10px_30px_rgba(25,55,90,0.06)]">
      <CardTitle icon={ShieldCheck}>예측 근거</CardTitle>
      <div className="grid gap-1.5">
        {evidenceItems.map((item) => {
          const Icon = item.icon

          return (
            <div className="flex items-start gap-2" key={item.title}>
              <Icon
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-blue-600"
                size={15}
              />
              <div className="min-w-0">
                <strong className="block text-xs leading-none font-black text-slate-900">
                  {item.title}
                </strong>
                <p className="m-0 mt-0.5 truncate text-[11px] leading-none font-bold text-slate-500">
                  {item.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function WarningCard() {
  return (
    <section className="rounded-xl border border-blue-100 bg-white/95 px-4 py-3.5 shadow-[0_10px_30px_rgba(25,55,90,0.06)]">
      <CardTitle icon={AlertTriangle}>주의 요인</CardTitle>
      <div className="grid gap-1.5">
        {warningItems.map((item) => (
          <div className="flex items-start gap-2" key={item.id}>
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-rose-500"
              size={15}
            />
            <div className="min-w-0">
              <strong className="block text-xs leading-none font-black text-slate-900">
                {item.label}
              </strong>
              <p className="m-0 mt-0.5 truncate text-[11px] leading-none font-bold text-slate-500">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function StrategySection() {
  return (
    <section className="rounded-xl border border-blue-100 bg-white/95 px-4 py-3.5 shadow-[0_10px_30px_rgba(25,55,90,0.06)]">
      <CardTitle icon={Sparkles}>운영 전략 제안</CardTitle>
      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        {strategyCards.map((item) => {
          const Icon = item.icon

          return (
            <article
              className={`relative min-h-[116px] overflow-hidden rounded-xl border px-3 py-3 ${item.tone}`}
              key={item.id}
            >
              <strong className="mb-2 block text-base font-black">{item.id}</strong>
              <h4 className="m-0 mb-2 text-sm font-black tracking-normal">
                {item.title}
              </h4>
              <p className="m-0 text-xs leading-relaxed font-bold text-slate-600">
                {item.description}
              </p>
              <Icon
                aria-hidden="true"
                className="absolute bottom-3 right-3 opacity-45"
                size={28}
              />
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function ReportPage() {
  const [message, setMessage] = useState('')
  const [selectedRecommendation] = useState<StoredRecommendation | null>(() =>
    safeParseStorage<StoredRecommendation>('metropick-selected-recommendation'),
  )
  const reportSummary = useMemo(
    () => buildReportSummary(selectedRecommendation),
    [selectedRecommendation],
  )
  const predictionResults = useMemo(
    () => safeParseStorage<StoredPredictionResult[]>('metropick-ai-prediction-results') ?? [],
    [],
  )
  const matchedPredictionResult = useMemo(
    () => getMatchedPredictionResult(predictionResults, reportSummary),
    [predictionResults, reportSummary],
  )
  const onboardingSummary = safeParseStorage<StoredOnboardingSummary>(
    'metropick-onboarding-summary',
  )

  const selectedStation = selectedRecommendation?.station
  const latestPrediction = predictionResults.at(-1)?.stationArea
  const completedAt = onboardingSummary?.completedAt
  const storageContextLabel = [selectedStation, latestPrediction, completedAt]
    .filter(Boolean)
    .join(' / ')

  useEffect(() => {
    saveCurrentReport(reportSummary)
  }, [reportSummary])

  const handleShare = async () => {
    saveCurrentReport(reportSummary)

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
      }
    } catch {
      // Clipboard availability varies by browser and test environment.
    }

    setMessage('리포트 링크가 복사되었습니다.')
  }

  const handlePdfSave = () => {
    saveCurrentReport(reportSummary)
    setMessage('PDF 저장 기능은 추후 연동 예정입니다.')
  }

  return (
    <div className="report-page-compact min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top_right,rgba(0,117,255,0.08),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#f6f9fe_100%)] text-slate-900">
      <TopNavigation activeHref="/report" sticky />

      <div className="flex min-h-[calc(100vh-var(--app-topbar-height)-var(--app-footer-height))] min-w-0 max-lg:flex-col">
        <AppSidebar activeHref="/report" ariaLabel="리포트 사이드 메뉴" />

        <main className="min-w-0 flex-1 px-8 pt-6 pb-2 max-2xl:px-6 max-md:px-4">
          <span className="sr-only">이전 설정 컨텍스트: {storageContextLabel}</span>

          <div className="mb-3 flex items-start justify-between gap-5 max-lg:flex-col">
            <div>
              <h1 className="m-0 mb-4 text-2xl font-black tracking-normal text-slate-950 max-md:text-2xl">
                미래 매출 예측 리포트
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 items-center rounded-full border border-blue-100 bg-white px-3 text-xs font-bold text-slate-500">
                  선택 상권
                </span>
                <strong className="inline-flex h-8 items-center rounded-full border border-blue-100 bg-white px-3 text-sm font-black text-slate-900">
                  {reportSummary.stationArea}
                </strong>
                <span className="inline-flex h-8 items-center rounded-full border border-blue-100 bg-white px-3 text-xs font-bold text-slate-500">
                  선택 업종
                </span>
                <strong className="inline-flex h-8 items-center rounded-full border border-blue-100 bg-white px-3 text-sm font-black text-slate-900">
                  {reportSummary.businessType}
                </strong>
              </div>
            </div>

            <div className="flex gap-3 max-md:w-full">
              <button
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-black text-slate-900 max-md:flex-1 max-md:justify-center"
                onClick={handleShare}
                type="button"
              >
                <Share2 aria-hidden="true" size={17} />
                공유하기
              </button>
              <button
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(0,109,255,0.24)] max-md:flex-1 max-md:justify-center"
                onClick={handlePdfSave}
                type="button"
              >
                <FileDown aria-hidden="true" size={17} />
                PDF 저장
              </button>
            </div>
          </div>

          <HeroCard reportSummary={reportSummary} />

          <div className="mb-3 grid min-w-0 grid-cols-[minmax(390px,0.9fr)_minmax(0,1.45fr)] gap-3 max-2xl:grid-cols-1">
            <SummaryInsightCard
              predictionResult={matchedPredictionResult}
              reportSummary={reportSummary}
              selectedRecommendation={selectedRecommendation}
            />
            <MetricSection />
          </div>

          <div className="mb-3 grid min-w-0 grid-cols-[minmax(0,1.12fr)_minmax(0,0.86fr)_minmax(320px,0.95fr)] gap-3 max-2xl:grid-cols-1">
            <SalesTrendCard />
            <MapSnapshotCard
              predictionResult={matchedPredictionResult}
              reportSummary={reportSummary}
              selectedRecommendation={selectedRecommendation}
            />
            <FactorSection />
          </div>

          <div className="grid min-w-0 grid-cols-[minmax(250px,0.72fr)_minmax(250px,0.72fr)_minmax(0,1.48fr)] gap-3 max-2xl:grid-cols-1">
            <EvidenceCard />
            <WarningCard />
            <StrategySection />
          </div>

          <div className="mt-3">
            <SimulationDisclaimer />
          </div>
        </main>
      </div>

      <AppFooter />

      {message ? (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-lg border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-lg"
          role="status"
        >
          <LinkIcon aria-hidden="true" className="mr-2 inline" size={16} />
          {message}
        </div>
      ) : null}
    </div>
  )
}

export default ReportPage
