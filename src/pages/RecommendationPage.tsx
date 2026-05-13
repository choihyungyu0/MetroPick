import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Bookmark,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  Info,
  MapPin,
  PiggyBank,
  SlidersHorizontal,
  Store,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { landingAssets } from '@/shared/assets/landingAssets'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { TopNavigation } from '@/shared/components/TopNavigation'
import { recommendationAssets } from '@/shared/assets/recommendationAssets'
import {
  mockLocationRecommendations,
  type LocationRecommendationItem,
} from '@/shared/data/mockRecommendations'

type RecommendationFilters = {
  budgetRange: string
  businessType: string
  preferredArea: string
  riskTolerance: string
}

type SavedInterestLocation = {
  businessType: string
  district: string
  id: string
  savedAt: string
  score: number
  station: string
}

type StoredBusinessSetup = {
  selectedBusinessLabels?: string[]
}

type StoredStationSetup = {
  selectedStations?: string[]
}

type StoredOnboardingSummary = {
  completedAt?: string
}

const defaultFilters: RecommendationFilters = {
  businessType: '카페/디저트',
  budgetRange: '3억 ~ 5억 원',
  preferredArea: '광주 2호선 전체',
  riskTolerance: '보통 (중간 위험)',
}

const metricKeys = ['growth', 'stability', 'competition', 'accessibility'] as const

const metricLabels = {
  accessibility: '접근성',
  competition: '경쟁도',
  growth: '성장성',
  stability: '안정성',
} satisfies Record<(typeof metricKeys)[number], string>

const metricColors = {
  accessibility: '#6d4cff',
  competition: '#f5a400',
  growth: '#0065ff',
  stability: '#16cfa5',
} satisfies Record<(typeof metricKeys)[number], string>

const stationColorClasses = [
  'bg-blue-600',
  'bg-sky-400',
  'bg-teal-400',
  'bg-amber-400',
  'bg-cyan-400',
] as const

function safeParseStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function buildInitialFilters(): RecommendationFilters {
  const businessSetup = safeParseStorage<StoredBusinessSetup>(
    'metropick-onboarding-business-types',
  )
  const stationSetup = safeParseStorage<StoredStationSetup>(
    'metropick-onboarding-stations',
  )
  const onboardingSummary = safeParseStorage<StoredOnboardingSummary>(
    'metropick-onboarding-summary',
  )
  const firstBusiness = businessSetup?.selectedBusinessLabels?.[0]
  const hasStationSetup = Boolean(stationSetup?.selectedStations?.length)
  const hasOnboardingSummary = Boolean(onboardingSummary?.completedAt)

  return {
    ...defaultFilters,
    businessType: firstBusiness ?? defaultFilters.businessType,
    preferredArea:
      hasStationSetup || hasOnboardingSummary
        ? '온보딩 설정 기반'
        : defaultFilters.preferredArea,
  }
}

function appendInterestLocation(item: SavedInterestLocation) {
  const key = 'metropick-saved-interest-locations'
  const existing = safeParseStorage<SavedInterestLocation[]>(key) ?? []
  const isDuplicate = existing.some(
    (entry) => entry.station === item.station && entry.businessType === item.businessType,
  )

  if (isDuplicate) {
    window.localStorage.setItem(key, JSON.stringify(existing))
    return
  }

  window.localStorage.setItem(key, JSON.stringify([...existing, item]))
}

function TopControls() {
  return (
    <div className="flex items-center gap-2.5 max-md:w-full max-md:flex-wrap">
      <select className="h-10 min-w-[168px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-extrabold text-slate-700">
        <option>광주광역시 전체</option>
      </select>
      <select className="h-10 min-w-[168px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-extrabold text-slate-700">
        <option>2026년 4월 예측</option>
      </select>
      <button aria-label="알림" className="text-slate-500" type="button">
        <CalendarDays size={22} />
      </button>
      <button
        aria-label="사용자 메뉴"
        className="grid h-9 w-9 place-items-center rounded-full bg-slate-400 text-white"
        type="button"
      >
        <CircleUserRound size={19} />
      </button>
    </div>
  )
}

function FilterPanel({ filters }: { filters: RecommendationFilters }) {
  const filtersConfig: Array<{
    icon: LucideIcon
    label: string
    tone: string
    value: string
  }> = [
    {
      label: '업종 선택',
      value: filters.businessType,
      icon: Store,
      tone: 'bg-teal-50 text-teal-600',
    },
    {
      label: '예산 범위',
      value: filters.budgetRange,
      icon: PiggyBank,
      tone: 'bg-blue-50 text-blue-600',
    },
    {
      label: '선호 지역',
      value: filters.preferredArea,
      icon: MapPin,
      tone: 'bg-blue-50 text-blue-600',
    },
    {
      label: '위험 허용 수준',
      value: filters.riskTolerance,
      icon: SlidersHorizontal,
      tone: 'bg-slate-100 text-slate-600',
    },
  ]

  return (
    <section className="mb-3 grid min-h-[82px] grid-cols-4 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-[0_10px_24px_rgba(18,65,120,0.07)] max-xl:grid-cols-2 max-md:grid-cols-1">
      {filtersConfig.map((item) => {
        const Icon = item.icon

        return (
          <button
            className="grid grid-cols-[44px_1fr_24px] items-center gap-3 border-r border-slate-100 px-4 text-left last:border-r-0 max-xl:min-h-[82px]"
            key={item.label}
            type="button"
          >
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${item.tone}`}>
              <Icon aria-hidden="true" size={20} />
            </span>
            <span>
              <span className="mb-1.5 block text-xs font-extrabold text-slate-500">
                {item.label}
              </span>
              <strong className="text-[15px] font-black text-slate-900">
                {item.value}
              </strong>
            </span>
            <ChevronDown aria-hidden="true" className="text-slate-500" size={18} />
          </button>
        )
      })}
    </section>
  )
}

function ScoreCircle({ score }: { score: number }) {
  return (
    <div
      className="mx-auto h-[70px] w-[70px] rounded-full p-1"
      style={{ background: `conic-gradient(#0065ff ${score * 3.6}deg, #e7eefb 0deg)` }}
    >
      <div className="grid h-full w-full place-items-center rounded-full bg-white">
        <div className="text-center leading-none">
          <strong className="block text-2xl font-black text-slate-900">{score}</strong>
          <span className="mt-1 block text-[11px] font-extrabold text-slate-500">
            /100
          </span>
        </div>
      </div>
    </div>
  )
}

function MetricBars({ item }: { item: LocationRecommendationItem }) {
  return (
    <div className="grid gap-2">
      {metricKeys.map((key) => (
        <div className="grid grid-cols-[42px_1fr_26px] items-center gap-2" key={key}>
          <p className="m-0 text-[11px] font-black text-slate-700">
            {metricLabels[key]}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ background: metricColors[key], width: `${item[key]}%` }}
            />
          </div>
          <strong className="text-[11px] font-black text-slate-700">{item[key]}</strong>
        </div>
      ))}
    </div>
  )
}

function RecommendationCard({
  filters,
  item,
  onSaveInterest,
  onViewReport,
}: {
  filters: RecommendationFilters
  item: LocationRecommendationItem
  onSaveInterest: (item: LocationRecommendationItem) => void
  onViewReport: (item: LocationRecommendationItem) => void
}) {
  const rankClass =
    item.rank === 1
      ? 'bg-gradient-to-b from-amber-300 to-amber-600'
      : item.rank === 2
        ? 'bg-gradient-to-b from-sky-300 to-blue-600'
        : item.rank === 3
          ? 'bg-gradient-to-b from-orange-300 to-orange-700'
          : 'bg-gradient-to-b from-slate-400 to-slate-600'
  const riskClass =
    item.riskLevel === '위험 낮음'
      ? 'bg-emerald-50 text-emerald-600'
      : 'bg-amber-50 text-amber-600'

  return (
    <article className="grid min-h-[126px] w-full min-w-0 grid-cols-[36px_minmax(148px,156px)_80px_minmax(118px,150px)_minmax(0,1fr)_132px] items-center gap-2 rounded-[10px] border border-blue-100 bg-white p-3 max-xl:grid-cols-[42px_1fr_100px] max-xl:gap-3">
      <div
        className={`grid h-8 w-8 place-items-center rounded-lg text-lg font-black text-white ${rankClass}`}
      >
        {item.rank}
      </div>

      <div className="min-w-0 border-r border-slate-100 pr-3 max-xl:border-r-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="m-0 whitespace-nowrap text-xl font-black tracking-normal text-slate-900">
            {item.station}
          </h3>
          <span className="grid h-5 min-w-11 place-items-center rounded-md bg-blue-50 text-[11px] font-black text-blue-600">
            {item.line}
          </span>
        </div>
        <p className="m-0 mt-1.5 text-sm font-bold text-slate-600">{item.district}</p>
      </div>

      <div className="min-w-0 text-center max-xl:col-start-3 max-md:col-span-full max-md:flex max-md:items-center max-md:gap-4 max-md:text-left">
        <p className="m-0 mb-1 text-[10px] font-black text-slate-500">AI 종합 점수</p>
        <ScoreCircle score={item.score} />
      </div>

      <div className="min-w-0 max-xl:col-span-2 max-xl:col-start-2 max-md:col-span-full">
        <MetricBars item={item} />
      </div>

      <div className="min-w-0 max-xl:col-span-2 max-xl:col-start-2 max-md:col-span-full">
        <span
          className={`mb-1.5 inline-flex h-5 items-center rounded-md px-2.5 text-[11px] font-black ${riskClass}`}
        >
          {item.riskLevel}
        </span>
        <strong className="mb-0.5 block text-[11px] font-black text-slate-700">
          추천 사유
        </strong>
        <p className="m-0 break-words text-[11px] leading-snug font-bold text-slate-600">
          {item.reason}
        </p>
      </div>

      <div className="grid min-w-0 gap-2 max-xl:col-start-3 max-md:col-span-full">
        <button
          className="h-[34px] w-full min-w-0 whitespace-nowrap rounded-lg bg-blue-600 px-2 text-xs font-black text-white shadow-[0_8px_18px_rgba(0,101,255,0.24)]"
          onClick={() => onViewReport(item)}
          type="button"
        >
          리포트 보기
        </button>
        <button
          className="h-[34px] w-full min-w-0 whitespace-nowrap rounded-lg border border-blue-200 bg-white px-2 text-xs font-black text-blue-600"
          onClick={() => onSaveInterest(item)}
          type="button"
        >
          <Bookmark aria-hidden="true" className="mr-1 inline" size={15} />
          관심 지역 저장
        </button>
        <span className="sr-only">현재 업종: {filters.businessType}</span>
      </div>
    </article>
  )
}

function RecommendationList({
  filters,
  onSaveInterest,
  onViewReport,
}: {
  filters: RecommendationFilters
  onSaveInterest: (item: LocationRecommendationItem) => void
  onViewReport: (item: LocationRecommendationItem) => void
}) {
  return (
    <section className="rounded-xl border border-blue-100 bg-white px-3 py-3.5 shadow-[0_10px_24px_rgba(18,65,120,0.06)]">
      <div className="flex items-center justify-between px-3.5 pb-2.5">
        <h2 className="m-0 text-xl font-black text-slate-900">AI 추천 Top 5</h2>
        <span className="text-xs font-black text-slate-600">AI 종합 점수 기준</span>
      </div>

      <div className="grid gap-2">
        {mockLocationRecommendations.map((item) => (
          <RecommendationCard
            filters={filters}
            item={item}
            key={item.station}
            onSaveInterest={onSaveInterest}
            onViewReport={onViewReport}
          />
        ))}
      </div>

      <p className="m-0 mt-2.5 px-2 text-xs font-bold text-slate-600">
        <Info aria-hidden="true" className="mr-1 inline text-teal-500" size={15} />
        AI 종합 점수는 성장성, 안정성, 경쟁도, 접근성 4가지 지표를 종합하여 산출됩니다.
      </p>
    </section>
  )
}

function MapCard() {
  return (
    <section className="rounded-xl border border-blue-100 bg-white p-4 shadow-[0_10px_24px_rgba(18,65,120,0.06)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="m-0 text-[19px] font-black text-slate-900">추천 지역 위치</h2>
      </div>

      <div className="h-[390px] overflow-hidden rounded-xl border border-slate-200 bg-white">
        <img
          alt="광주 2호선 창업 유망 지점 추천 지도"
          className="h-full w-full object-cover"
          draggable={false}
          src={recommendationAssets.recommendedLocationsMap}
        />
      </div>
    </section>
  )
}

function CompareChart() {
  return (
    <section className="rounded-xl border border-blue-100 bg-white px-5 py-4 shadow-[0_10px_24px_rgba(18,65,120,0.06)]">
      <h2 className="m-0 text-[19px] font-black text-slate-900">Top 5 지역 지표 비교</h2>

      <div className="my-4 flex flex-wrap justify-center gap-5">
        {mockLocationRecommendations.map((item, index) => (
          <span
            className="flex items-center gap-1.5 text-xs font-black text-slate-700"
            key={item.station}
          >
            <i
              className={`h-1.5 w-3 rounded-sm ${stationColorClasses[index] ?? 'bg-slate-400'}`}
            />
            {item.station}
          </span>
        ))}
      </div>

      <div className="relative grid h-[210px] grid-cols-4 items-end gap-8 pl-10">
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 bottom-8 flex flex-col justify-between">
          {[100, 75, 50, 25, 0].map((line) => (
            <div className="relative h-px bg-slate-100" key={line}>
              <span className="absolute -top-2 -left-1 text-xs font-extrabold text-slate-500">
                {line}
              </span>
            </div>
          ))}
        </div>
        {metricKeys.map((key) => (
          <div
            className="relative z-10 flex h-full flex-col items-center justify-end"
            key={key}
          >
            <div className="flex h-[164px] items-end gap-2">
              {mockLocationRecommendations.map((item, index) => (
                <div
                  className={`w-3.5 rounded-t ${stationColorClasses[index] ?? 'bg-slate-400'} shadow-sm`}
                  key={`${key}-${item.station}`}
                  style={{ height: `${item[key]}%` }}
                />
              ))}
            </div>
            <p className="m-0 mt-3 text-sm font-black text-slate-700">
              {metricLabels[key]}
            </p>
          </div>
        ))}
      </div>

      <p className="m-0 mt-3 text-xs font-bold text-slate-600">
        ※ 경쟁도는 낮을수록 유리합니다.
      </p>
    </section>
  )
}

function Footer() {
  return (
    <footer className="grid min-h-[96px] grid-cols-[320px_1fr_420px] items-center gap-8 bg-[linear-gradient(90deg,#001a3d,#001f4f)] px-16 py-4 text-white max-xl:grid-cols-1 max-xl:gap-4 max-md:px-5">
      <div className="flex items-center gap-3">
        <img
          alt="MetroPick AI 로고"
          className="h-9 w-11 shrink-0 object-contain"
          draggable={false}
          src={landingAssets.logo}
        />
        <div>
          <strong className="text-xl font-black">MetroPick AI</strong>
          <p className="m-0 mt-1 text-xs text-white/70">
            광주 2호선 개통에 따른 AI 상권 분석 예측 서비스
          </p>
        </div>
      </div>

      <nav aria-label="푸터 링크" className="flex flex-wrap items-center gap-4">
        {['서비스 소개', '이용약관', '개인정보처리방침', '데이터 출처', '문의하기'].map(
          (item) => (
            <a className="text-sm font-bold text-white/80" href="/" key={item}>
              {item}
            </a>
          ),
        )}
      </nav>

      <div className="text-xs leading-6 text-white/70">
        <p className="m-0">(주)메트로픽AI ㅣ 대표이사: 김지훈</p>
        <p className="m-0">광주광역시 동구 금남로 193-22, 4층</p>
        <p className="m-0">사업자 등록번호: 123-45-67890 ㅣ 062-123-4567</p>
      </div>
    </footer>
  )
}

export function RecommendationPage() {
  const navigate = useNavigate()
  const [filters] = useState<RecommendationFilters>(() => buildInitialFilters())
  const [message, setMessage] = useState('')

  const firstStationName = useMemo(
    () => mockLocationRecommendations[0]?.station ?? '상무역',
    [],
  )

  const handleSaveInterest = (item: LocationRecommendationItem) => {
    appendInterestLocation({
      id: `interest-location-${Date.now()}`,
      station: item.station,
      district: item.district,
      businessType: filters.businessType,
      score: item.score,
      savedAt: new Date().toISOString(),
    })
    setMessage('관심 지역에 저장되었습니다.')
  }

  const handleViewReport = (item: LocationRecommendationItem) => {
    window.localStorage.setItem(
      'metropick-selected-recommendation',
      JSON.stringify({
        station: item.station,
        businessType: filters.businessType,
        score: item.score,
        createdAt: new Date().toISOString(),
      }),
    )
    navigate('/report')
  }

  return (
    <div className="recommendation-page min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,101,255,0.08),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#f2f7ff_100%)] text-slate-900">
      <TopNavigation activeHref="/recommendation" />

      <div className="flex min-h-[calc(100vh-var(--app-topbar-height))] max-lg:flex-col">
        <AppSidebar activeHref="/recommendation" ariaLabel="입지 추천 사이드 메뉴" />

        <main className="min-w-0 flex-1 px-7 py-7 max-md:px-4">
          <div className="mb-5 flex items-center justify-between gap-4 max-lg:flex-col max-lg:items-start">
            <div className="flex items-end gap-4 max-md:block">
              <h1 className="m-0 text-[32px] font-black tracking-[-1.1px] text-slate-950">
                창업 유망 지점 추천
              </h1>
              <p className="mb-1.5 text-[15px] font-bold text-slate-500">
                AI가 분석한 최적의 창업 입지를 추천해드립니다.
              </p>
            </div>
            <TopControls />
          </div>

          <div className="grid grid-cols-[minmax(760px,1fr)_minmax(520px,600px)] gap-5 max-[1640px]:grid-cols-1">
            <div className="min-w-0">
              <FilterPanel filters={filters} />
              <RecommendationList
                filters={filters}
                onSaveInterest={handleSaveInterest}
                onViewReport={handleViewReport}
              />
            </div>

            <div className="grid gap-4 max-[1600px]:grid-cols-2 max-lg:grid-cols-1">
              <MapCard />
              <CompareChart />
            </div>
          </div>

          <span className="sr-only">첫 번째 추천 지점: {firstStationName}</span>
        </main>
      </div>

      <Footer />

      {message ? (
        <div
          className="fixed right-5 bottom-5 z-50 rounded-lg border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-lg"
          role="status"
        >
          {message}
        </div>
      ) : null}
    </div>
  )
}

export default RecommendationPage
