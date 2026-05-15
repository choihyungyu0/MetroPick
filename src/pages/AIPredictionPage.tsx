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

import type {
  BackendStartupSuitabilityInput,
  BackendStartupSuitabilityResponse,
} from '@/shared/api/backendPredictionApi'
import type { BackendPredictionResult } from '@/shared/api/backendPredictionResultsApi'
import { useCreateBackendPredictionResult } from '@/shared/api/hooks/useBackendPredictionResults'
import { useBackendStartupSuitability } from '@/shared/api/hooks/useBackendStartupSuitability'
import { aiPredictionAssets } from '@/shared/assets/aiPredictionAssets'
import { AppFooter } from '@/shared/components/AppFooter'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { BackendStatusBadge } from '@/shared/components/BackendStatusBadge'
import { ImageWithFallback } from '@/shared/components/ImageWithFallback'
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
  backendStartupSuitability?: BackendStartupSuitabilityResponse
  businessType: string
  createdAt: string
  id: string
  predictedFloatingPopulationGrowthRate: number
  predictedSalesGrowthRate: number
  predictedSalesIncrease: string
  predicted_score?: number
  recommendation_label?: string
  risk_level?: string
  riskLevel: '낮음' | '보통' | '높음'
  scenario: string
  stationArea: string
  top_reasons?: string[]
}

type GrowthRateItem = {
  label: string
  value: number
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

const PredictionReportDownloadButton = lazy(
  () => import('@/features/prediction/PredictionReportDownloadButton'),
)

const defaultFilters: PredictionFilters = {
  scenario: '광주 2호선 2단계 개통 - 2026년 예정',
  businessType: '커피전문점',
  stationArea: '상무역(2호선)',
  region: '광주광역시 전체',
  date: '2026년 4월 18일',
}

const scenarioOptions = ['광주 2호선 2단계 개통 - 2026년 예정']
const businessTypeOptions = ['커피전문점', '편의점', '외식업', '베이커리']
const stationOptions = ['상무역(2호선)', '광주역', '전남대역']
const regionOptions = ['광주광역시 전체']
const dateOptions = ['2026년 4월 18일']

const growthRates: GrowthRateItem[] = [
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

const evidenceItems = [
  { title: '버스 승하차 증가', value: '+28.6%' },
  { title: '20~30대 생활인구 비중', value: '+6.8%p' },
  { title: '경쟁 점포 수', value: '적정 수준 예상' },
  { title: '기존 상권 성장률', value: '평균 +3.7%' },
] as const

const defaultRiskReasons = [
  '반경 500m 내 경쟁 점포 증가 가능성',
  '신규 상업시설 공급 계획 존재',
  '주말 유동인구 변동성 높음',
]

const sampleStartupSuitabilityPayload: BackendStartupSuitabilityInput = {
  radius_m: 500,
  total_store_count: 120,
  same_business_count_by_type: 28,
  cafe_count: 28,
  restaurant_count: 42,
  convenience_count: 9,
  pharmacy_count: 4,
  beauty_count: 13,
  academy_count: 8,
  retail_count: 16,
  business_type_count: 7,
  business_diversity_index: 78,
  bus_boarding_count: 850,
  bus_alighting_count: 920,
  bus_total_count: 1770,
  nearby_bus_stop_count: 9,
  subway_pattern_score: 72,
  competition_index: 58,
  floating_demand_index: 81,
  sales_potential_index: 76,
  closure_risk_index: 35,
  accessibility_score: 84,
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
    stationArea: station ? `${station} (2호선)` : defaultFilters.stationArea,
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
  return {
    station_area: result.stationArea,
    business_type: result.businessType,
    predicted_score: result.backendStartupSuitability?.predicted_score ?? null,
    result_payload: {
      scenario: result.scenario,
      predictedSalesGrowthRate: result.predictedSalesGrowthRate,
      predictedSalesIncrease: result.predictedSalesIncrease,
      predictedFloatingPopulationGrowthRate:
        result.predictedFloatingPopulationGrowthRate,
      riskLevel: result.riskLevel,
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

function buildBackendPredictionResult(
  filters: PredictionFilters,
  prediction: BackendStartupSuitabilityResponse,
): PredictionResult {
  return {
    ...buildMockPredictionResult(filters),
    backendStartupSuitability: prediction,
    predicted_score: prediction.predicted_score,
    risk_level: prediction.risk_level,
    recommendation_label: prediction.recommendation_label,
    top_reasons: prediction.top_reasons,
  }
}

function getPredictionBackendStatus({
  backendPrediction,
  isPending,
}: {
  backendPrediction: BackendStartupSuitabilityResponse | null
  isPending: boolean
}): BackendStatus {
  if (isPending) {
    return 'loading'
  }

  return backendPrediction ? 'connected' : 'fallback'
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
}: {
  filters: PredictionFilters
  onChange: (next: PredictionFilters) => void
  onRun: () => void
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
        options={
          stationOptions.includes(filters.stationArea)
            ? stationOptions
            : [filters.stationArea, ...stationOptions]
        }
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

function SalesForecastChartCard() {
  return (
    <section className="h-[360px] rounded-xl border border-blue-100 bg-white p-4 shadow-[0_8px_22px_rgba(22,72,140,0.06)]">
      <h3 className="sr-only">개통 전후 매출 전망</h3>
      <div className="h-full overflow-hidden rounded-xl border border-slate-100 bg-white">
        <ImageWithFallback
          alt="개통 전후 매출 전망 예측 차트"
          className="h-full w-full object-contain"
          draggable={false}
          fallbackText="매출 전망 차트를 불러오지 못했습니다."
          src={aiPredictionAssets.salesForecastChart}
        />
      </div>
    </section>
  )
}

function GrowthRateCard() {
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
  backendPrediction,
  stationArea,
}: {
  backendPrediction: BackendStartupSuitabilityResponse | null
  stationArea: string
}) {
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
        <strong className="text-2xl font-black text-blue-600">+42.3%</strong>
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
        <strong className="text-2xl font-black text-blue-600">+47.6%</strong>
        <small className="col-start-2 text-xs font-bold text-slate-500">
          (+1,280만원)
        </small>
      </div>

      {backendPrediction ? (
        <div className="border-b border-slate-100 py-5">
          <h4 className="mb-3 text-sm font-black text-slate-900">
            FastAPI 창업 적합도 결과
          </h4>
          <dl className="grid gap-2 text-xs font-bold text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <dt>창업 적합도 점수</dt>
              <dd className="font-black text-blue-600">
                {backendPrediction.predicted_score.toFixed(1)}점
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>위험 수준</dt>
              <dd className="font-black text-slate-800">{backendPrediction.risk_level}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>추천 판단</dt>
              <dd className="font-black text-slate-800">
                {backendPrediction.recommendation_label}
              </dd>
            </div>
          </dl>

          <strong className="mt-4 block text-xs font-black text-slate-700">
            주요 예측 근거
          </strong>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-xs leading-relaxed font-bold text-slate-500">
            {backendPrediction.top_reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="pt-5">
        <div className="flex items-center gap-2.5">
          <ShieldQuestion aria-hidden="true" className="text-rose-400" size={25} />
          <p className="m-0 font-black text-slate-700">위험 요인</p>
          <em className="ml-auto rounded-lg bg-amber-50 px-3 py-1 text-xs font-black not-italic text-amber-600">
            보통
          </em>
        </div>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-xs leading-relaxed font-bold text-slate-500">
          {defaultRiskReasons.map((reason) => (
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

function ConfidenceSection() {
  return (
    <section className="mt-3">
      <h3 className="mb-2.5 ml-5 text-[17px] font-black text-slate-900">
        AI 예측 신뢰도
      </h3>
      <div className="grid grid-cols-4 gap-3.5 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {confidenceMetrics.map((item) => {
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

function EvidenceSection() {
  return (
    <section className="rounded-xl border border-blue-100 bg-white px-6 py-4 shadow-[0_8px_22px_rgba(22,72,140,0.06)]">
      <h3 className="flex items-center gap-1 text-lg font-black text-slate-900">
        예측 근거 <Info aria-hidden="true" className="text-slate-400" size={16} />
      </h3>
      <div className="mt-4 grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {evidenceItems.map((item) => (
          <div
            className="grid min-h-[58px] place-items-center rounded-lg border border-blue-100 bg-white px-3 text-center"
            key={item.title}
          >
            <p className="m-0 text-xs font-black text-blue-600">{item.title}</p>
            <strong className="text-sm font-black text-slate-800">{item.value}</strong>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed font-semibold text-slate-500">
        이 예측 근거는 주요 데이터 기반 인사이트를 요약한 것입니다.
      </p>
    </section>
  )
}

function CommentSection() {
  return (
    <section className="rounded-xl border border-blue-100 bg-gradient-to-b from-white to-blue-50 px-6 py-4 shadow-[0_8px_22px_rgba(22,72,140,0.06)]">
      <h3 className="flex items-center gap-2 text-lg font-black text-indigo-600">
        <BrainCircuit aria-hidden="true" size={20} />
        AI 요약 코멘트
      </h3>
      <p className="my-3 text-sm leading-5 font-bold text-slate-700">
        상무역(2호선) 일대는 개통 이후 유동인구 증가와 20~30대 생활인구
        비중 확대가 예상되어 커피전문점의 매출 성장 잠재력이 높게 보입니다.
        특히 개통 후 6개월부터 의미 있는 상승 전환이 예상되며, 24개월
        뒤에는 현재 대비 약 47.6%의 매출 상승을 참고 시나리오로 볼 수
        있습니다. 다만 경쟁 점포 증가와 신규 상업시설 공급 변화를 지속적으로
        모니터링하는 것이 좋습니다.
      </p>
      <small className="text-xs font-semibold text-slate-500">
        이 내용은 AI가 생성한 요약으로 실제 결과와 다를 수 있습니다.
      </small>
    </section>
  )
}

export function AIPredictionPage() {
  const [filters, setFilters] = useState<PredictionFilters>(() => buildInitialFilters())
  const [saveMessage, setSaveMessage] = useState('')
  const [lastSimulated, setLastSimulated] = useState('')
  const [backendPrediction, setBackendPrediction] =
    useState<BackendStartupSuitabilityResponse | null>(null)
  const startupSuitabilityMutation = useBackendStartupSuitability()
  const createPredictionResultMutation = useCreateBackendPredictionResult()

  const stationSummary = useMemo(() => filters.stationArea, [filters.stationArea])
  const backendStatus = getPredictionBackendStatus({
    backendPrediction,
    isPending: startupSuitabilityMutation.isPending,
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
      const prediction = await startupSuitabilityMutation.mutateAsync(
        sampleStartupSuitabilityPayload,
      )
      setBackendPrediction(prediction)
      result = buildBackendPredictionResult(filters, prediction)
    } catch {
      setBackendPrediction(null)
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
                  connectedLabel="FastAPI 예측 결과 연결됨"
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
                  backendPrediction={backendPrediction}
                  businessType={filters.businessType}
                  confidenceMetrics={confidenceMetrics}
                  generatedAt={predictionReportGeneratedAt}
                  growthRates={growthRates}
                  scenario={filters.scenario}
                  stationArea={filters.stationArea}
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
          />

          <div className="mb-4">
            <SimulationDisclaimer />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_390px] gap-4 max-2xl:grid-cols-1">
            <div className="min-w-0">
              <div className="grid grid-cols-[minmax(0,1.65fr)_minmax(330px,1fr)] gap-4 max-xl:grid-cols-1">
                <SalesForecastChartCard />
                <GrowthRateCard />
              </div>

              <ConfidenceSection />
            </div>

            <SummaryCard
              backendPrediction={backendPrediction}
              stationArea={stationSummary}
            />
          </div>

          <div className="mt-4 grid grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] gap-4 max-xl:grid-cols-1">
            <EvidenceSection />
            <CommentSection />
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
