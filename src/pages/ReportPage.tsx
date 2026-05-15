import { useEffect, useState, type ReactNode } from 'react'
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

import { reportAssets } from '@/shared/assets/reportAssets'
import { AppFooter } from '@/shared/components/AppFooter'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { ImageWithFallback } from '@/shared/components/ImageWithFallback'
import { SimulationDisclaimer } from '@/shared/components/SimulationDisclaimer'
import { TopNavigation } from '@/shared/components/TopNavigation'
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
  radius: string
  scenario: string
  stationArea: string
  title: string
}

type StoredRecommendation = {
  businessType?: string
  score?: number
  station?: string
}

type StoredPredictionResult = {
  businessType?: string
  createdAt?: string
  stationArea?: string
}

type StoredOnboardingSummary = {
  completedAt?: string
}

const reportSummary = {
  analysisDate: '2025.05.25',
  businessType: '카페/커피전문점',
  expectedOpeningDate: '2027.12 (예정)',
  model: 'MetroPick AI v2.1',
  radius: '500m',
  scenario: '2027 개통 시나리오',
  stationArea: '백운광장역 500m 상권',
} as const

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

const mapStats = [
  { label: '유동인구(일평균)', value: '28,430명' },
  { label: '배후세대(예상)', value: '18,650세대' },
  { label: '주변 상점 수', value: '1,203개' },
  { label: '경쟁 카페 수', value: '24개' },
] as const

function buildCurrentReport(): FutureSalesReport {
  return {
    id: `future-sales-report-${Date.now()}`,
    title: '백운광장역 500m 상권 미래 매출 예측 리포트',
    stationArea: reportSummary.stationArea,
    businessType: reportSummary.businessType,
    scenario: reportSummary.scenario,
    radius: reportSummary.radius,
    expectedAnnualSales2030: '3.21억 원',
    annualGrowthRate: '+24.3%',
    investmentFit: '상',
    createdAt: new Date().toISOString(),
  }
}

function saveCurrentReport() {
  writeStorage('metropick-current-report', buildCurrentReport())
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

function HeroCard() {
  return (
    <section className="mb-3 grid min-h-[166px] min-w-0 grid-cols-[250px_minmax(0,1fr)_410px] items-center gap-5 rounded-xl border border-blue-100 bg-white/95 p-4 shadow-[0_10px_30px_rgba(25,55,90,0.06)] max-2xl:grid-cols-[250px_minmax(0,1fr)] max-lg:grid-cols-1">
      <div className="h-[136px] overflow-hidden rounded-xl bg-slate-200 max-lg:h-[210px]">
        <ImageWithFallback
          alt="백운광장역 개통 예정 상권 대표 이미지"
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
            카페
          </span>
          <span className="inline-flex h-8 items-center rounded-full border border-emerald-300 bg-emerald-50 px-3 text-sm font-black text-emerald-600">
            백운광장역 500m
          </span>
          <span className="inline-flex h-8 items-center rounded-full border border-blue-300 bg-blue-50 px-3 text-sm font-black text-blue-600">
            {reportSummary.scenario}
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 font-semibold text-slate-600">
          광주 2호선 백운광장역 개통(2027년 예정) 시점을 기준으로 예측한{' '}
          <strong className="font-black text-slate-900">카페 업종</strong>의 미래 매출
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

function SummaryInsightCard() {
  return (
    <section className="rounded-xl border border-blue-100 bg-white/95 px-4 py-3.5 shadow-[0_10px_30px_rgba(25,55,90,0.06)]">
      <CardTitle icon={Gauge}>
        요약 인사이트 <span className="text-sm text-slate-500">(AI 요약)</span>
      </CardTitle>
      <p className="m-0 text-sm leading-6 font-semibold text-slate-700">
        백운광장역 500m 상권의 카페 업종은 2027년 개통 이후 꾸준한 성장세가 예상되며, 특히
        2028~2030년에 매출 성장이 가속화될 것으로 전망됩니다. 유동인구 증가와 주변 개발
        호재, 젊은 세대 유입이 주요 성장 요인으로 작용하며, 프리미엄 커피·디저트 특화
        전략이 높은 성과를 기대할 수 있습니다.
      </p>
      <div className="mt-3 flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 px-3 text-sm font-black text-emerald-700">
        <TrendingUp
          aria-hidden="true"
          className="rounded-lg border border-emerald-200 bg-white p-1"
          size={26}
        />
        종합 결론: 매우 유망 (투자 적합도 상)
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

function MapSnapshotCard() {
  return (
    <section className="rounded-xl border border-blue-100 bg-white/95 px-4 py-3.5 shadow-[0_10px_30px_rgba(25,55,90,0.06)]">
      <CardTitle>상권 지도 스냅샷</CardTitle>
      <div className="h-[190px] overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ImageWithFallback
          alt="백운광장역 500m 상권 지도 스냅샷"
          className="h-full w-full object-contain"
          draggable={false}
          fallbackText="상권 지도 스냅샷을 불러올 수 없습니다."
          src={reportAssets.areaMap}
        />
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5 max-md:grid-cols-1">
        {mapStats.map((item) => (
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
  const selectedRecommendation = safeParseStorage<StoredRecommendation>(
    'metropick-selected-recommendation',
  )
  const predictionResults =
    safeParseStorage<StoredPredictionResult[]>('metropick-ai-prediction-results') ?? []
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
    saveCurrentReport()
  }, [])

  const handleShare = async () => {
    saveCurrentReport()

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
    saveCurrentReport()
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

          <HeroCard />

          <div className="mb-3 grid min-w-0 grid-cols-[minmax(390px,0.9fr)_minmax(0,1.45fr)] gap-3 max-2xl:grid-cols-1">
            <SummaryInsightCard />
            <MetricSection />
          </div>

          <div className="mb-3 grid min-w-0 grid-cols-[minmax(0,1.12fr)_minmax(0,0.86fr)_minmax(320px,0.95fr)] gap-3 max-2xl:grid-cols-1">
            <SalesTrendCard />
            <MapSnapshotCard />
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
