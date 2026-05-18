import { lazy, Suspense, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  BrainCircuit,
  CircleUserRound,
  Coins,
  Info,
  Play,
  ShieldCheck,
  ShieldQuestion,
  Target,
  Train,
  Users,
  Wallet,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type {
  BackendPredictionEvidenceCard,
  BackendPredictionMonthlySalesSeriesItem,
  BackendPredictionSimulationResponse,
  BackendStartupSuitabilityResponse,
} from '@/shared/api/backendPredictionApi'
import type { BackendPredictionResult } from '@/shared/api/backendPredictionResultsApi'
import type { BackendRecommendationItem } from '@/shared/api/backendRecommendationApi'
import { useCreateBackendPredictionResult } from '@/shared/api/hooks/useBackendPredictionResults'
import { useBackendRecommendations } from '@/shared/api/hooks/useBackendRecommendations'
import { useBackendPredictionSimulation } from '@/shared/api/hooks/useBackendStartupSuitability'
import { AppFooter } from '@/shared/components/AppFooter'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { BackendStatusBadge } from '@/shared/components/BackendStatusBadge'
import { SimulationDisclaimer } from '@/shared/components/SimulationDisclaimer'
import { TopNavigation } from '@/shared/components/TopNavigation'
import { safeParseStorage, writeStorage } from '@/shared/lib/storage'

type PredictionFilters = {
  businessType: string
  date: string
  region: string
  scenario: string
  stationArea: string
}

type PredictionResult = {
  aiSummaryComment?: string
  backendPredictionSimulation?: BackendPredictionSimulationResponse
  backendStartupSuitability?: BackendStartupSuitabilityResponse
  businessType: string
  createdAt: string
  evidenceCards?: BackendPredictionEvidenceCard[]
  id: string
  predictedFloatingPopulationGrowthRate: number
  predictedSalesGrowthRate: number
  predictedSalesIncrease: string
  predicted_score?: number
  recommendation_label?: string
  risk_level?: string
  riskFactors?: string[]
  riskLevel: '낮음' | '보통' | '높음'
  scenario: string
  stationArea: string
  strategyComment?: string
  top_reasons?: string[]
}

type GrowthRateItem = {
  label: string
  value: number
}

type SalesForecastChartDatum = {
  afterOpeningValue: number | null
  beforeOpeningValue: number | null
  label: string
}

type ConfidenceMetric = {
  icon: LucideIcon
  label: string
  level: string
  score: number
}

type StoredStationSetup = {
  selectedStations?: string[]
}

type StoredBusinessSetup = {
  selectedBusinessLabels?: string[]
}

type BackendStatus = 'connected' | 'fallback' | 'loading'

type StationOption = {
  displayName: string
  stationName: string
  stationId?: string
}

const PredictionReportDownloadButton = lazy(
  () => import('@/features/prediction/PredictionReportDownloadButton'),
)

const defaultFilters: PredictionFilters = {
  scenario: '광주 2호선 2단계 개통 - 2026년 예정',
  businessType: '커피전문점',
  stationArea: '상무역',
  region: '광주광역시 전체',
  date: '2026년 4월 18일',
}

const scenarioOptions = ['광주 2호선 2단계 개통 - 2026년 예정']
const businessTypeOptions = ['커피전문점', '편의점', '외식업', '베이커리']
const defaultStationOptions: StationOption[] = [
  { displayName: '시청역', stationName: '시청역', stationId: 'GJ-S001' },
  { displayName: '상무역', stationName: '상무역', stationId: 'GJ-S002' },
  { displayName: '백운광장역', stationName: '백운광장역', stationId: 'GJ-S003' },
  { displayName: '광주역', stationName: '광주역', stationId: 'GJ-S007' },
  { displayName: '첨단역', stationName: '첨단역', stationId: 'GJ-S008' },
  { displayName: '서남동 예정역', stationName: '2호선_215', stationId: '2호선_215' },
]
const regionOptions = ['광주광역시 전체']
const dateOptions = ['2026년 4월 18일']

const baseGrowthRates: GrowthRateItem[] = [
  { label: '커피전문점', value: 47.6 },
  { label: '편의점', value: 38.2 },
  { label: '외식업', value: 34.7 },
  { label: '베이커리', value: 31.5 },
  { label: '스포츠·피트니스', value: 28.4 },
]

const confidenceMetrics: ConfidenceMetric[] = [
  { label: '종합 예측 신뢰도', score: 82, level: '높음', icon: ShieldCheck },
  { label: '데이터 기반 신뢰도', score: 87, level: '높음', icon: Coins },
  { label: '모델 점검 수준', score: 79, level: '높음', icon: BrainCircuit },
  { label: '유사 상권 적합도', score: 81, level: '높음', icon: Target },
]

const evidenceItems: BackendPredictionEvidenceCard[] = [
  {
    title: '공공데이터 기반 시나리오',
    value: '대기',
    comment: '시뮬레이션 실행 후 예측 근거가 표시됩니다.',
  },
  {
    title: '잠재 유동수요',
    value: '대기',
    comment: '선택한 역세권과 업종의 API 응답을 기다리고 있습니다.',
  },
  {
    title: '경쟁 지수',
    value: '대기',
    comment: '시뮬레이션 결과에서 경쟁 수준을 확인합니다.',
  },
  {
    title: '참고용 예측 결과',
    value: '대기',
    comment: '실제 매출을 보장하지 않는 참고용 결과입니다.',
  },
]

const defaultRiskReasons = [
  '시뮬레이션 실행 후 공공데이터 기반 위험 요인이 표시됩니다.',
]

function normalizeStationOptionKey(value: string): string {
  return value.replace(/\s*\([^)]*\)/g, '').replace(/\s/g, '')
}

function stationOptionMatches(option: StationOption, value: string): boolean {
  const normalizedValue = normalizeStationOptionKey(value)
  return [option.displayName, option.stationName, option.stationId ?? ''].some(
    (candidate) => normalizeStationOptionKey(candidate) === normalizedValue,
  )
}

function findStationOption(
  value: string,
  options: StationOption[] = defaultStationOptions,
): StationOption | undefined {
  return options.find((option) => stationOptionMatches(option, value))
}

function toStationDisplayName(value: string): string {
  const matchedOption = findStationOption(value)
  return matchedOption?.displayName ?? value
}

function stationOptionFromRecommendation(
  item: BackendRecommendationItem,
): StationOption {
  const displayName = item.display_station_name?.trim() || item.station_name
  return {
    displayName,
    stationName: item.station_name,
    stationId: item.station_id,
  }
}

function mergeStationOptions(
  recommendationItems: BackendRecommendationItem[] | undefined,
): StationOption[] {
  const mergedOptions: StationOption[] = []

  const addOption = (option: StationOption) => {
    const alreadyAdded = mergedOptions.some((currentOption) =>
      stationOptionMatches(currentOption, option.displayName),
    )
    if (!alreadyAdded) {
      mergedOptions.push(option)
    }
  }

  const recommendationOptions =
    recommendationItems?.map(stationOptionFromRecommendation) ?? []
  recommendationOptions.forEach(addOption)
  defaultStationOptions.forEach(addOption)
  return mergedOptions
}

function stationOptionLabelsFor(
  selectedStationArea: string,
  options: StationOption[],
): string[] {
  const labels = options.map((option) => option.displayName)
  return labels.includes(selectedStationArea)
    ? labels
    : [selectedStationArea, ...labels]
}

function buildPredictionStationPayload(
  selectedStationArea: string,
  options: StationOption[],
): { station_id?: string; station_name: string } {
  const matchedOption = findStationOption(selectedStationArea, options)
  return {
    station_id: matchedOption?.stationId,
    station_name: matchedOption?.stationName ?? selectedStationArea,
  }
}

function normalizeBusinessType(label: string) {
  if (label.includes('카페') || label.includes('커피')) {
    return '커피전문점'
  }

  if (label.includes('외식') || label.includes('음식')) {
    return '외식업'
  }

  if (label.includes('편의')) {
    return '편의점'
  }

  return label
}

function buildInitialFilters(): PredictionFilters {
  const stationSetup = safeParseStorage<StoredStationSetup>(
    'metropick-onboarding-stations',
  )
  const businessSetup = safeParseStorage<StoredBusinessSetup>(
    'metropick-onboarding-business-types',
  )

  const station = stationSetup?.selectedStations?.[0]
  const businessType = businessSetup?.selectedBusinessLabels?.[0]

  return {
    ...defaultFilters,
    stationArea: station ? toStationDisplayName(station) : defaultFilters.stationArea,
    businessType: businessType
      ? normalizeBusinessType(businessType)
      : defaultFilters.businessType,
  }
}

function appendPredictionResult(result: PredictionResult) {
  const key = 'metropick-ai-prediction-results'
  const existing = safeParseStorage<PredictionResult[]>(key) ?? []
  writeStorage(key, [...existing, result])
}

function buildPredictionResultInput(result: PredictionResult) {
  const simulation = result.backendPredictionSimulation
  return {
    station_area: result.stationArea,
    business_type: result.businessType,
    predicted_score: result.predicted_score ?? null,
    result_payload: {
      title: `${result.stationArea} ${result.businessType} AI 예측 결과`,
      scenario: result.scenario,
      score: result.predicted_score ?? null,
      risk_level: result.risk_level ?? result.riskLevel,
      growth_rate: simulation?.predicted_growth_rate ?? result.predictedSalesGrowthRate,
      sales_change_rate:
        simulation?.predicted_sales_change_rate ?? result.predictedSalesGrowthRate,
      risk_factors: result.riskFactors ?? [],
      strategy_comment: result.strategyComment ?? '',
      ai_summary_comment: result.aiSummaryComment ?? '',
      evidence_cards: result.evidenceCards ?? [],
      predictedSalesGrowthRate: result.predictedSalesGrowthRate,
      predictedSalesIncrease: result.predictedSalesIncrease,
      predictedFloatingPopulationGrowthRate:
        result.predictedFloatingPopulationGrowthRate,
      riskLevel: result.riskLevel,
      backendPredictionSimulation: simulation,
      backendStartupSuitability: result.backendStartupSuitability,
      createdAt: result.createdAt,
    },
  }
}

function normalizeBackendPredictionResultForStorage(
  backendResult: BackendPredictionResult,
  fallback: PredictionResult,
): PredictionResult {
  const payload =
    typeof backendResult.result_payload === 'object' &&
    backendResult.result_payload !== null
      ? backendResult.result_payload
      : {}

  return {
    ...fallback,
    id: backendResult.id ?? fallback.id,
    businessType: backendResult.business_type ?? fallback.businessType,
    stationArea: backendResult.station_area ?? fallback.stationArea,
    predicted_score: backendResult.predicted_score ?? fallback.predicted_score,
    createdAt:
      backendResult.created_at ??
      (typeof payload.createdAt === 'string' ? payload.createdAt : fallback.createdAt),
  }
}

function buildMockPredictionResult(filters: PredictionFilters): PredictionResult {
  return {
    id: `ai-prediction-${Date.now()}`,
    createdAt: new Date().toISOString(),
    scenario: filters.scenario,
    businessType: filters.businessType,
    stationArea: filters.stationArea,
    predictedSalesGrowthRate: 47.6,
    predictedSalesIncrease: '+1,280만원',
    predictedFloatingPopulationGrowthRate: 42.3,
    riskLevel: '보통',
  }
}

function normalizeRiskLevel(value: string): PredictionResult['riskLevel'] {
  if (value === '낮음' || value === '보통' || value === '높음') {
    return value
  }

  return '보통'
}

function formatSignedPercent(value: number): string {
  return `+${value.toFixed(1)}%`
}

function deriveFloatingPopulationGrowth(result: BackendPredictionSimulationResponse): number {
  return Math.max(0, Math.min(75, Math.round(result.floating_demand_index * 0.6 * 10) / 10))
}

function toStartupSuitabilityResponse(
  result: BackendPredictionSimulationResponse | null,
): BackendStartupSuitabilityResponse | null {
  if (!result) {
    return null
  }

  return {
    predicted_score: result.startup_suitability_score,
    risk_level: result.risk_level,
    recommendation_label: result.recommendation_label,
    top_reasons: result.risk_factors,
  }
}

function buildBackendPredictionResult(
  filters: PredictionFilters,
  prediction: BackendPredictionSimulationResponse,
): PredictionResult {
  const stationArea = prediction.display_station_name || prediction.station_name
  const backendStartupSuitability = toStartupSuitabilityResponse(prediction)

  return {
    ...buildMockPredictionResult({
      ...filters,
      businessType: prediction.business_type,
      stationArea,
    }),
    backendPredictionSimulation: prediction,
    backendStartupSuitability: backendStartupSuitability ?? undefined,
    businessType: prediction.business_type,
    stationArea,
    predictedFloatingPopulationGrowthRate: deriveFloatingPopulationGrowth(prediction),
    predictedSalesGrowthRate: prediction.predicted_growth_rate,
    predictedSalesIncrease: formatSignedPercent(prediction.predicted_sales_change_rate),
    predicted_score: prediction.startup_suitability_score,
    risk_level: prediction.risk_level,
    recommendation_label: prediction.recommendation_label,
    riskFactors: prediction.risk_factors,
    riskLevel: normalizeRiskLevel(prediction.risk_level),
    strategyComment: prediction.strategy_comment,
    aiSummaryComment: prediction.ai_summary_comment,
    evidenceCards: prediction.evidence_cards,
    top_reasons: prediction.risk_factors,
  }
}

function getPredictionBackendStatus({
  simulationResult,
  isPending,
}: {
  simulationResult: BackendPredictionSimulationResponse | null
  isPending: boolean
}): BackendStatus {
  if (isPending) {
    return 'loading'
  }

  return simulationResult?.data_status === 'ml_model' ? 'connected' : 'fallback'
}

function buildGrowthRates(
  businessType: string,
  simulationResult: BackendPredictionSimulationResponse | null,
): GrowthRateItem[] {
  if (!simulationResult) {
    return baseGrowthRates
  }

  const selectedRate = simulationResult.predicted_growth_rate
  const otherRates = baseGrowthRates
    .filter((item) => item.label !== businessType)
    .slice(0, 4)
    .map((item, index) => ({
      ...item,
      value: Math.max(8, Math.round((selectedRate * (0.86 - index * 0.07)) * 10) / 10),
    }))

  return [{ label: businessType, value: selectedRate }, ...otherRates].slice(0, 5)
}

function getBusinessSalesModifier(businessType: string): number {
  if (businessType.includes('커피') || businessType.includes('카페')) {
    return 1.08
  }

  if (businessType.includes('외식') || businessType.includes('음식')) {
    return 1.12
  }

  if (businessType.includes('편의')) {
    return 0.94
  }

  if (businessType.includes('베이커리') || businessType.includes('빵')) {
    return 1.02
  }

  return 1
}

function roundSalesSeriesValue(value: number): number {
  return Math.round(value / 10) * 10
}

function buildFallbackMonthlySalesSeries(
  simulationResult: BackendPredictionSimulationResponse | null,
  businessType: string,
): BackendPredictionMonthlySalesSeriesItem[] {
  const startupSuitabilityScore = simulationResult?.startup_suitability_score ?? 68
  const predictedGrowthRate = simulationResult?.predicted_growth_rate ?? 47.6
  const predictedSalesChangeRate =
    simulationResult?.predicted_sales_change_rate ?? 47.6
  const floatingDemandIndex = simulationResult?.floating_demand_index ?? 62
  const competitionIndex = simulationResult?.competition_index ?? 44
  const diversityIndex = simulationResult?.business_diversity_index ?? 70
  const businessModifier = getBusinessSalesModifier(businessType)

  const openingValue = Math.max(
    900,
    (1150 +
      startupSuitabilityScore * 8.8 +
      predictedGrowthRate * 7.4 +
      floatingDemandIndex * 4.2 +
      diversityIndex * 1.8 -
      competitionIndex * 3.2) *
      businessModifier,
  )
  const beforeSlope =
    Math.max(
      90,
      predictedGrowthRate * 4.8 + floatingDemandIndex * 2.6 - competitionIndex * 1.5,
    ) * businessModifier
  const afterTarget = openingValue * (1 + predictedSalesChangeRate / 100)
  const afterLift = afterTarget - openingValue
  const earlyMomentum = Math.max(
    0.22,
    Math.min(0.42, (floatingDemandIndex - competitionIndex + 70) / 260),
  )

  return [
    {
      label: '-12개월',
      before_opening_value: roundSalesSeriesValue(openingValue - beforeSlope * 2),
      after_opening_value: null,
    },
    {
      label: '-6개월',
      before_opening_value: roundSalesSeriesValue(openingValue - beforeSlope),
      after_opening_value: null,
    },
    {
      label: '개통 시점',
      before_opening_value: roundSalesSeriesValue(openingValue),
      after_opening_value: roundSalesSeriesValue(openingValue),
    },
    {
      label: '+6개월',
      before_opening_value: null,
      after_opening_value: roundSalesSeriesValue(
        openingValue + afterLift * earlyMomentum,
      ),
    },
    {
      label: '+12개월',
      before_opening_value: null,
      after_opening_value: roundSalesSeriesValue(openingValue + afterLift * 0.58),
    },
    {
      label: '+18개월',
      before_opening_value: null,
      after_opening_value: roundSalesSeriesValue(openingValue + afterLift * 0.8),
    },
    {
      label: '+24개월',
      before_opening_value: null,
      after_opening_value: roundSalesSeriesValue(afterTarget),
    },
  ]
}

function normalizeSalesSeriesValue(value: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function resolveMonthlySalesSeries(
  simulationResult: BackendPredictionSimulationResponse | null,
  businessType: string,
): BackendPredictionMonthlySalesSeriesItem[] {
  const responseSeries = simulationResult?.monthly_sales_series

  if (
    responseSeries?.some(
      (item) =>
        normalizeSalesSeriesValue(item.before_opening_value) !== null ||
        normalizeSalesSeriesValue(item.after_opening_value) !== null,
    )
  ) {
    return responseSeries
  }

  return buildFallbackMonthlySalesSeries(simulationResult, businessType)
}

function toSalesForecastChartData(
  series: BackendPredictionMonthlySalesSeriesItem[],
): SalesForecastChartDatum[] {
  return series.map((item) => ({
    label: item.label,
    beforeOpeningValue: normalizeSalesSeriesValue(item.before_opening_value),
    afterOpeningValue: normalizeSalesSeriesValue(item.after_opening_value),
  }))
}

function salesForecastChartDomain(data: SalesForecastChartDatum[]): [number, number] {
  const values = data.flatMap((item) =>
    [item.beforeOpeningValue, item.afterOpeningValue].filter(
      (value): value is number => value !== null,
    ),
  )
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)

  return [
    Math.max(0, Math.floor((minimum * 0.9) / 100) * 100),
    Math.ceil((maximum * 1.08) / 100) * 100,
  ]
}

function buildConfidenceMetrics(
  simulationResult: BackendPredictionSimulationResponse | null,
): ConfidenceMetric[] {
  if (!simulationResult) {
    return confidenceMetrics
  }

  const icons = [ShieldCheck, Coins, BrainCircuit, Target] as const
  return simulationResult.confidence_metrics.map((metric, index) => ({
    label: metric.label,
    level: metric.level,
    score: Math.round(metric.score),
    icon: icons[index] ?? Target,
  }))
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
  wide,
}: {
  label: string
  onChange: (value: string) => void
  options: string[]
  value: string
  wide?: boolean
}) {
  return (
    <label
      className={`grid min-w-0 items-center gap-3 ${wide ? 'grid-cols-[120px_minmax(0,1fr)]' : 'grid-cols-[92px_minmax(0,1fr)]'} max-[1700px]:grid-cols-1`}
    >
      <span className="text-[15px] font-extrabold text-slate-900">{label}</span>
      <select
        className="h-[46px] w-full min-w-0 rounded-lg border border-blue-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function FilterBar({
  filters,
  onChange,
  onRun,
  stationOptionLabels,
}: {
  filters: PredictionFilters
  onChange: (next: PredictionFilters) => void
  onRun: () => void
  stationOptionLabels: string[]
}) {
  return (
    <section className="mb-5 grid min-h-20 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.95fr)_minmax(190px,220px)] items-center gap-8 rounded-xl border border-blue-100 bg-white px-7 py-4 shadow-[0_10px_24px_rgba(23,72,137,0.08)] max-[1700px]:gap-5 max-[1500px]:grid-cols-2 max-lg:grid-cols-1">
      <FilterSelect
        label="개통 시나리오"
        onChange={(scenario) => onChange({ ...filters, scenario })}
        options={scenarioOptions}
        value={filters.scenario}
        wide
      />
      <FilterSelect
        label="업종 선택"
        onChange={(businessType) => onChange({ ...filters, businessType })}
        options={businessTypeOptions}
        value={filters.businessType}
      />
      <FilterSelect
        label="역세권 선택"
        onChange={(stationArea) => onChange({ ...filters, stationArea })}
        options={stationOptionLabels}
        value={filters.stationArea}
      />
      <button
        aria-label="시뮬레이션 실행"
        className="inline-flex h-[46px] w-full min-w-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-base font-black whitespace-nowrap text-white shadow-[0_8px_20px_rgba(0,101,255,0.25)]"
        onClick={onRun}
        type="button"
      >
        <Play aria-hidden="true" size={18} />
        시뮬레이션 실행
      </button>
    </section>
  )
}

function SalesForecastChartCard({
  businessType,
  simulationResult,
  stationArea,
}: {
  businessType: string
  simulationResult: BackendPredictionSimulationResponse | null
  stationArea: string
}) {
  const monthlySalesSeries = resolveMonthlySalesSeries(simulationResult, businessType)
  const chartData = toSalesForecastChartData(monthlySalesSeries)
  const yAxisDomain = salesForecastChartDomain(chartData)
  const salesChangeRate = simulationResult?.predicted_sales_change_rate ?? 47.6
  const chartLabel = `${stationArea} ${businessType} 개통 전후 매출 전망 차트`

  return (
    <section className="h-[360px] rounded-xl border border-blue-100 bg-white p-4 shadow-[0_8px_22px_rgba(22,72,140,0.06)]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 text-sm font-black text-slate-900">
            개통 전·후 매출 전망
          </h3>
          <p className="mt-1 truncate text-xs font-bold text-slate-500">
            {stationArea} · {businessType}
          </p>
        </div>
        <strong
          aria-label="예측 매출 변화율"
          className="rounded-full bg-blue-50 px-3 py-1 text-lg leading-none font-black whitespace-nowrap text-blue-600"
        >
          {formatSignedPercent(salesChangeRate)}
        </strong>
      </div>
      <div
        aria-label={chartLabel}
        className="grid h-[calc(100%-44px)] grid-rows-[minmax(0,1fr)_24px] overflow-hidden rounded-xl border border-slate-100 bg-white px-2 pt-2"
        role="img"
      >
        <div className="min-h-0 overflow-x-auto overflow-y-hidden">
          <div className="h-full min-w-[700px]">
            <LineChart
              data={chartData}
              height={244}
              margin={{ bottom: 4, left: 0, right: 18, top: 18 }}
              width={700}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                interval={0}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                domain={yAxisDomain}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                tickFormatter={(value: number) => `${Math.round(value / 10) / 100}천`}
                tickLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  borderColor: '#dbeafe',
                  borderRadius: 8,
                  boxShadow: '0 8px 22px rgba(22,72,140,0.12)',
                  fontSize: 12,
                  fontWeight: 700,
                }}
                cursor={{ stroke: '#bfdbfe', strokeWidth: 1 }}
                labelStyle={{ color: '#0f172a', fontWeight: 900 }}
              />
              <ReferenceLine
                label={{
                  fill: '#1d4ed8',
                  fontSize: 11,
                  fontWeight: 800,
                  position: 'top',
                  value: '개통 시점',
                }}
                stroke="#1d4ed8"
                strokeDasharray="4 4"
                x="개통 시점"
              />
              <Line
                connectNulls={false}
                dataKey="beforeOpeningValue"
                dot={{ fill: '#ffffff', r: 4, stroke: '#2563eb', strokeWidth: 2 }}
                isAnimationActive={false}
                name="개통 전"
                stroke="#2563eb"
                strokeLinecap="round"
                strokeWidth={3}
                type="monotone"
              />
              <Line
                connectNulls={false}
                dataKey="afterOpeningValue"
                dot={{ fill: '#ffffff', r: 4, stroke: '#0f766e', strokeWidth: 2 }}
                isAnimationActive={false}
                name="개통 후"
                stroke="#0f766e"
                strokeLinecap="round"
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          </div>
        </div>
        <div className="flex items-center justify-end gap-4 pr-3 text-[11px] font-black text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-blue-600" />
            개통 전
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-teal-700" />
            개통 후
          </span>
        </div>
      </div>
    </section>
  )
}

function GrowthRateCard({ growthRates }: { growthRates: GrowthRateItem[] }) {
  return (
    <section className="h-[360px] rounded-xl border border-blue-100 bg-white p-5 shadow-[0_8px_22px_rgba(22,72,140,0.06)]">
      <h3 className="text-lg font-black text-slate-900">
        업종별 매출 상승률{' '}
        <span className="text-xs text-slate-500">(개통 후 24개월 기준)</span>
      </h3>

      <div className="mt-8 grid gap-4">
        {growthRates.map((item, index) => (
          <div
            className="grid grid-cols-[90px_1fr_70px] items-center gap-3"
            key={item.label}
          >
            <p className="m-0 text-right text-xs font-extrabold text-slate-700">
              {item.label}
            </p>
            <div className="h-[22px] overflow-hidden bg-blue-50">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-sky-400"
                style={{ opacity: 1 - index * 0.09, width: `${item.value * 1.6}%` }}
              />
            </div>
            <strong className="text-xs font-black text-blue-600">+{item.value}%</strong>
          </div>
        ))}
      </div>

      <div className="mt-5 ml-[92px] flex justify-between text-xs font-bold text-slate-500">
        {['0%', '10%', '20%', '30%', '40%', '50%', '60%'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed font-semibold text-slate-500">
        선택 업종을 포함한 주요 업종의 예상 매출 상승률입니다.
      </p>
    </section>
  )
}

function SummaryCard({
  simulationResult,
  stationArea,
}: {
  simulationResult: BackendPredictionSimulationResponse | null
  stationArea: string
}) {
  const floatingGrowthRate = simulationResult
    ? deriveFloatingPopulationGrowth(simulationResult)
    : 42.3
  const salesChangeRate = simulationResult
    ? simulationResult.predicted_sales_change_rate
    : 47.6
  const riskLevel = simulationResult?.risk_level ?? '보통'
  const riskFactors = simulationResult?.risk_factors ?? defaultRiskReasons

  return (
    <aside className="min-h-[488px] self-start rounded-xl border border-blue-100 bg-white p-5 shadow-[0_8px_22px_rgba(22,72,140,0.06)]">
      <h3 className="text-lg font-black text-slate-900">선택 역세권 예측 요약</h3>

      <div className="mt-6 grid grid-cols-[48px_1fr_98px] items-center gap-2.5 border-b border-slate-100 pb-5">
        <div className="grid h-10 w-10 place-items-center rounded-lg border-2 border-slate-800 text-slate-800">
          <Train aria-hidden="true" size={22} />
        </div>
        <strong className="text-base text-slate-800">{stationArea}</strong>
        <button
          className="h-8 rounded-md border border-blue-200 bg-blue-50 text-xs font-black text-blue-600"
          type="button"
        >
          역 정보 보기
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto] border-b border-slate-100 py-5">
        <div className="flex items-center gap-3">
          <Users aria-hidden="true" className="text-slate-400" size={24} />
          <p className="m-0 text-sm font-extrabold text-slate-600">
            예상 유동인구 증가율
          </p>
        </div>
        <strong className="text-2xl font-black text-blue-600">
          {formatSignedPercent(floatingGrowthRate)}
        </strong>
        <small className="col-start-2 text-xs font-bold text-slate-500">
          (개통 후 24개월 기준)
        </small>
      </div>

      <div className="grid grid-cols-[1fr_auto] border-b border-slate-100 py-5">
        <div className="flex items-center gap-3">
          <Wallet aria-hidden="true" className="text-slate-400" size={24} />
          <p className="m-0 text-sm font-extrabold text-slate-600">
            예상 매출 잠재력 변화
          </p>
        </div>
        <strong className="text-2xl font-black text-blue-600">
          {formatSignedPercent(salesChangeRate)}
        </strong>
        <small className="col-start-2 text-xs font-bold text-slate-500">
          공공데이터 기반 시나리오
        </small>
      </div>

      {simulationResult ? (
        <div className="border-b border-slate-100 py-5">
          <h4 className="mb-3 text-sm font-black text-slate-900">
            FastAPI ML 예측 결과
          </h4>
          <dl className="grid gap-2 text-xs font-bold text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <dt>창업 적합도 점수</dt>
              <dd className="font-black text-blue-600">
                {simulationResult.startup_suitability_score.toFixed(1)}점
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>위험 수준</dt>
              <dd className="font-black text-slate-800">{simulationResult.risk_level}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>추천 판단</dt>
              <dd className="font-black text-slate-800">
                {simulationResult.recommendation_label}
              </dd>
            </div>
          </dl>

          <strong className="mt-4 block text-xs font-black text-slate-700">전략 코멘트</strong>
          <p className="mt-2 text-xs leading-relaxed font-bold text-slate-500">
            {simulationResult.strategy_comment}
          </p>
        </div>
      ) : null}

      <div className="pt-5">
        <div className="flex items-center gap-2.5">
          <ShieldQuestion aria-hidden="true" className="text-rose-400" size={25} />
          <p className="m-0 font-black text-slate-700">위험 요인</p>
          <em className="ml-auto rounded-lg bg-amber-50 px-3 py-1 text-xs font-black not-italic text-amber-600">
            {riskLevel}
          </em>
        </div>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-xs leading-relaxed font-bold text-slate-500">
          {riskFactors.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-xs leading-relaxed font-semibold text-slate-500">
        이 예측 결과는 실제 상황과 다를 수 있으며 참고용으로 사용해 주세요.
      </p>
    </aside>
  )
}

function ConfidenceSection({ metrics }: { metrics: ConfidenceMetric[] }) {
  return (
    <section className="mt-3">
      <h3 className="mb-2.5 ml-5 text-[17px] font-black text-slate-900">
        AI 예측 신뢰도
      </h3>
      <div className="grid grid-cols-4 gap-3.5 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {metrics.map((item) => {
          const Icon = item.icon

          return (
            <div
              className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-3 shadow-[0_8px_22px_rgba(22,72,140,0.05)]"
              key={item.label}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                <Icon aria-hidden="true" size={19} />
              </div>
              <div className="flex-1">
                <p className="m-0 text-xs font-extrabold text-slate-700">{item.label}</p>
                <strong className="mt-1 block text-xl font-black leading-none text-blue-600">
                  {item.score}% <span className="text-xs">{item.level}</span>
                </strong>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function EvidenceSection({
  simulationResult,
}: {
  simulationResult: BackendPredictionSimulationResponse | null
}) {
  const items =
    simulationResult && simulationResult.evidence_cards.length > 0
      ? simulationResult.evidence_cards
      : evidenceItems

  return (
    <section className="rounded-xl border border-blue-100 bg-white px-6 py-4 shadow-[0_8px_22px_rgba(22,72,140,0.06)]">
      <h3 className="flex items-center gap-1 text-lg font-black text-slate-900">
        예측 근거 <Info aria-hidden="true" className="text-slate-400" size={16} />
      </h3>
      <div className="mt-4 grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {items.map((item) => (
          <div
            className="grid min-h-[112px] place-items-center rounded-lg border border-blue-100 bg-white px-3 py-3 text-center"
            key={item.title}
          >
            <p className="m-0 text-xs font-black text-blue-600">{item.title}</p>
            <strong className="text-sm font-black text-slate-800">{item.value}</strong>
            <span className="text-[11px] leading-4 font-semibold text-slate-500">
              {item.comment}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed font-semibold text-slate-500">
        이 예측 근거는 API 응답의 공공데이터 기반 시나리오를 요약한 것입니다.
      </p>
    </section>
  )
}

function CommentSection({
  simulationResult,
}: {
  simulationResult: BackendPredictionSimulationResponse | null
}) {
  const comment =
    simulationResult?.ai_summary_comment ??
    '시뮬레이션 실행 후 API 응답의 공공데이터 기반 시나리오 요약이 표시됩니다.'

  return (
    <section className="rounded-xl border border-blue-100 bg-gradient-to-b from-white to-blue-50 px-6 py-4 shadow-[0_8px_22px_rgba(22,72,140,0.06)]">
      <h3 className="flex items-center gap-2 text-lg font-black text-indigo-600">
        <BrainCircuit aria-hidden="true" size={20} />
        AI 요약 코멘트
      </h3>
      <p className="my-3 text-sm leading-5 font-bold text-slate-700">
        {comment}
      </p>
      <small className="text-xs font-semibold text-slate-500">
        공공데이터 기반 규칙으로 생성된 참고용 예측 결과이며 실제 매출을 보장하지 않습니다.
      </small>
    </section>
  )
}

export function AIPredictionPage() {
  const [filters, setFilters] = useState<PredictionFilters>(() => buildInitialFilters())
  const [saveMessage, setSaveMessage] = useState('')
  const [lastSimulated, setLastSimulated] = useState('')
  const [simulationResult, setSimulationResult] =
    useState<BackendPredictionSimulationResponse | null>(null)
  const backendRecommendationsQuery = useBackendRecommendations(5)
  const predictionSimulationMutation = useBackendPredictionSimulation()
  const createPredictionResultMutation = useCreateBackendPredictionResult()
  const stationOptions = useMemo(
    () => mergeStationOptions(backendRecommendationsQuery.data?.items),
    [backendRecommendationsQuery.data?.items],
  )
  const stationOptionLabels = useMemo(
    () => stationOptionLabelsFor(filters.stationArea, stationOptions),
    [filters.stationArea, stationOptions],
  )

  const stationSummary = useMemo(
    () => simulationResult?.display_station_name || filters.stationArea,
    [filters.stationArea, simulationResult],
  )
  const reportBackendPrediction = useMemo(
    () => toStartupSuitabilityResponse(simulationResult),
    [simulationResult],
  )
  const visibleGrowthRates = useMemo(
    () => buildGrowthRates(filters.businessType, simulationResult),
    [filters.businessType, simulationResult],
  )
  const visibleConfidenceMetrics = useMemo(
    () => buildConfidenceMetrics(simulationResult),
    [simulationResult],
  )
  const backendStatus = getPredictionBackendStatus({
    simulationResult,
    isPending: predictionSimulationMutation.isPending,
  })
  const predictionReportGeneratedAt = useMemo(
    () =>
      new Date().toLocaleDateString('ko-KR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    [],
  )

  const handleRunSimulation = async () => {
    let result: PredictionResult

    try {
      const stationPayload = buildPredictionStationPayload(
        filters.stationArea,
        stationOptions,
      )
      const prediction = await predictionSimulationMutation.mutateAsync({
        ...stationPayload,
        business_type: filters.businessType,
        scenario: filters.scenario,
        radius_m: 500,
      })
      setSimulationResult(prediction)
      result = buildBackendPredictionResult(filters, prediction)
    } catch {
      setSimulationResult(null)
      result = buildMockPredictionResult(filters)
    }

    try {
      const response = await createPredictionResultMutation.mutateAsync(
        buildPredictionResultInput(result),
      )

      if (response.data_status === 'supabase_connected') {
        appendPredictionResult(
          normalizeBackendPredictionResultForStorage(response.result, result),
        )
        setSaveMessage('Supabase에 AI 예측 결과를 저장했어요.')
      } else {
        appendPredictionResult(result)
        setSaveMessage('백엔드 미연결 · 로컬에 AI 예측 결과를 저장했어요.')
      }
    } catch {
      appendPredictionResult(result)
      setSaveMessage('백엔드 미연결 · 로컬에 AI 예측 결과를 저장했어요.')
    }

    setLastSimulated(
      new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    )
  }

  return (
    <div className="ai-prediction-page min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,100,255,0.08),transparent_28%),#f5f9ff] text-slate-900">
      <TopNavigation activeHref="/ai-prediction" />

      <div className="flex min-h-[calc(100vh-var(--app-topbar-height)-var(--app-footer-height))] max-lg:flex-col">
        <AppSidebar activeHref="/ai-prediction" ariaLabel="AI 예측 사이드 메뉴" />

        <main className="min-w-0 flex-1 overflow-hidden pt-7 pr-[68px] pb-4 pl-20 max-2xl:px-9 max-md:px-4">
          <div className="mb-4 flex items-center justify-between gap-4 max-lg:flex-col max-lg:items-start">
            <div>
              <h1 className="m-0 flex items-center gap-2 text-3xl font-black tracking-[-0.8px] text-slate-950">
                AI 매출 변동 시뮬레이션
                <Info aria-hidden="true" className="text-slate-400" size={17} />
              </h1>
              <div className="mt-2">
                <BackendStatusBadge
                  connectedLabel="FastAPI ML 예측 결과 연결됨"
                  fallbackLabel="백엔드 미연결 · 목업 예측 결과 표시"
                  loadingLabel="FastAPI 예측 요청 중"
                  status={backendStatus}
                />
              </div>
              {lastSimulated ? (
                <p className="m-0 mt-2 text-xs font-bold text-blue-600">
                  마지막 실행: {lastSimulated}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                className="h-9 rounded-md border border-blue-100 bg-white px-3 text-xs font-bold text-slate-700"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, region: event.target.value }))
                }
                value={filters.region}
              >
                {regionOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border border-blue-100 bg-white px-3 text-xs font-bold text-slate-700"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, date: event.target.value }))
                }
                value={filters.date}
              >
                {dateOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <Suspense
                fallback={
                  <button
                    className="inline-flex h-9 items-center justify-center rounded-md border border-blue-200 bg-white px-3 text-xs font-black whitespace-nowrap text-blue-600"
                    type="button"
                  >
                    리포트 준비 중
                  </button>
                }
              >
                <PredictionReportDownloadButton
                  backendPrediction={reportBackendPrediction}
                  businessType={filters.businessType}
                  confidenceMetrics={visibleConfidenceMetrics}
                  generatedAt={predictionReportGeneratedAt}
                  growthRates={visibleGrowthRates}
                  scenario={filters.scenario}
                  stationArea={stationSummary}
                />
              </Suspense>
              <button aria-label="알림" className="text-slate-500" type="button">
                <Bell size={21} />
              </button>
              <button aria-label="사용자 메뉴" className="text-slate-500" type="button">
                <CircleUserRound size={21} />
              </button>
            </div>
          </div>

          <FilterBar
            filters={filters}
            onChange={setFilters}
            onRun={handleRunSimulation}
            stationOptionLabels={stationOptionLabels}
          />

          <div className="mb-4">
            <SimulationDisclaimer />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_390px] gap-4 max-2xl:grid-cols-1">
            <div className="min-w-0">
              <div className="grid grid-cols-[minmax(0,1.65fr)_minmax(330px,1fr)] gap-4 max-xl:grid-cols-1">
                <SalesForecastChartCard
                  businessType={filters.businessType}
                  simulationResult={simulationResult}
                  stationArea={stationSummary}
                />
                <GrowthRateCard growthRates={visibleGrowthRates} />
              </div>

              <ConfidenceSection metrics={visibleConfidenceMetrics} />
            </div>

            <SummaryCard
              simulationResult={simulationResult}
              stationArea={stationSummary}
            />
          </div>

          <div className="mt-4 grid grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] gap-4 max-xl:grid-cols-1">
            <EvidenceSection simulationResult={simulationResult} />
            <CommentSection simulationResult={simulationResult} />
          </div>
        </main>
      </div>

      <AppFooter />

      {saveMessage ? (
        <div
          className="fixed right-5 bottom-5 z-50 rounded-lg border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-lg"
          role="status"
        >
          {saveMessage}
        </div>
      ) : null}
    </div>
  )
}

export default AIPredictionPage
