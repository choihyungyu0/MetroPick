import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Gauge,
  Layers,
  MapPin,
  PieChart,
  RefreshCw,
  Save,
  Search,
  Store,
  Train,
} from 'lucide-react'

import { commercialAnalysisAssets } from '@/shared/assets/commercialAnalysisAssets'
import type { BackendCommercialAnalysisSummary } from '@/shared/api/backendCommercialAnalysisApi'
import { useBackendCommercialAnalysisSummary } from '@/shared/api/hooks/useBackendCommercialAnalysisSummary'
import { AppFooter } from '@/shared/components/AppFooter'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { BackendStatusBadge } from '@/shared/components/BackendStatusBadge'
import { ImageWithFallback } from '@/shared/components/ImageWithFallback'
import { TopNavigation } from '@/shared/components/TopNavigation'
import { safeParseStorage, writeStorage } from '@/shared/lib/storage'

type RadiusOption = '300m' | '500m' | '1km'

type PopulationLayerKey = 'resident' | 'worker' | 'floatingDay' | 'floatingNight'

type CommercialAnalysisFilters = {
  dateRange: string
  populationLayers: Record<PopulationLayerKey, boolean>
  radius: RadiusOption
  region: string
  route: string
  selectedBusinessTypes: string[]
  selectedStations: string[]
}

type StationComparisonRow = {
  averageFloatingPopulation: string
  averageMonthlySales: string
  competitionLevel: string
  densityLevel: string
  densityTone: 'danger' | 'warning' | 'normal'
  promisingBusinessTypes: string[]
  station: string
  storeCount: number
}

type StoredStationSetup = {
  radius?: RadiusOption
  route?: string
  selectedStations?: string[]
}

type StoredBusinessSetup = {
  selectedBusinessLabels?: string[]
}

type SavedCommercialAnalysisReport = {
  createdAt: string
  id: string
  radius: RadiusOption
  region: string
  route: string
  selectedBusinessTypes: string[]
  selectedStations: string[]
  title: string
}

type BackendStatus = 'connected' | 'fallback' | 'loading'

type SummaryCardItem = {
  title: string
  value: string
  change: string
  desc: string
}

const defaultFilters: CommercialAnalysisFilters = {
  region: '광주광역시',
  route: '광주 2호선 (예정)',
  selectedStations: ['양산역', '운천역', '상무역', '금호역', '월드컵경기장역'],
  radius: '500m',
  selectedBusinessTypes: ['음식점', '카페/디저트', '생활서비스', '소매'],
  dateRange: '2024-04-18 ~ 2024-05-18',
  populationLayers: {
    resident: true,
    worker: true,
    floatingDay: true,
    floatingNight: false,
  },
}

const summaryCards = [
  { title: '총 점포 수', value: '12,843개', change: '+8.7%', desc: '전월 대비' },
  { title: '업종 수', value: '96개', change: '+3개', desc: '전월 대비' },
  {
    title: '평균 유동인구 (주간)',
    value: '125,430명',
    change: '+12.3%',
    desc: '전월 대비',
  },
  { title: '경쟁 강도 (평균)', value: '보통', change: '2.8 / 5.0', desc: '' },
] as const

const distribution = [
  { name: '음식점', percent: '36.2%', count: '4,650', color: '#2563eb' },
  { name: '카페/디저트', percent: '17.8%', count: '2,287', color: '#14b8a6' },
  { name: '소매', percent: '15.4%', count: '1,978', color: '#8b5cf6' },
  { name: '생활서비스', percent: '12.1%', count: '1,552', color: '#ef4444' },
  { name: '학원', percent: '8.7%', count: '1,116', color: '#fbbf24' },
  { name: '기타', percent: '9.8%', count: '1,260', color: '#94a3b8' },
] as const

const comparisonRows: StationComparisonRow[] = [
  {
    station: '상무역',
    storeCount: 1842,
    densityLevel: '매우 높음',
    densityTone: 'danger',
    averageFloatingPopulation: '28,560명',
    averageMonthlySales: '28,430만원',
    competitionLevel: '높음 4.2/5',
    promisingBusinessTypes: ['음식점', '카페/디저트'],
  },
  {
    station: '월드컵경기장역',
    storeCount: 1356,
    densityLevel: '높음',
    densityTone: 'warning',
    averageFloatingPopulation: '24,310명',
    averageMonthlySales: '24,120만원',
    competitionLevel: '보통 2.9/5',
    promisingBusinessTypes: ['소매', '생활서비스'],
  },
  {
    station: '양산역',
    storeCount: 1298,
    densityLevel: '높음',
    densityTone: 'warning',
    averageFloatingPopulation: '21,870명',
    averageMonthlySales: '22,310만원',
    competitionLevel: '보통 2.6/5',
    promisingBusinessTypes: ['음식점', '학원'],
  },
  {
    station: '금호역',
    storeCount: 1124,
    densityLevel: '보통',
    densityTone: 'normal',
    averageFloatingPopulation: '18,430명',
    averageMonthlySales: '19,870만원',
    competitionLevel: '낮음 2.1/5',
    promisingBusinessTypes: ['생활서비스', '소매'],
  },
]

const tabs = [
  '핵심 역세권 비교',
  '업종 분포',
  '유동인구',
  '매출 현황',
  '경쟁도',
  '상권 변화 추이',
]

const layerLabels: Record<PopulationLayerKey, string> = {
  resident: '상주인구',
  worker: '직장인구',
  floatingDay: '유동인구 (주간)',
  floatingNight: '유동인구 (야간)',
}

function buildInitialFilters(): CommercialAnalysisFilters {
  const stationSetup = safeParseStorage<StoredStationSetup>(
    'metropick-onboarding-stations',
  )
  const businessSetup = safeParseStorage<StoredBusinessSetup>(
    'metropick-onboarding-business-types',
  )

  return {
    ...defaultFilters,
    route: stationSetup?.route ?? defaultFilters.route,
    selectedStations:
      stationSetup?.selectedStations && stationSetup.selectedStations.length > 0
        ? stationSetup.selectedStations
        : defaultFilters.selectedStations,
    radius: stationSetup?.radius ?? defaultFilters.radius,
    selectedBusinessTypes:
      businessSetup?.selectedBusinessLabels &&
      businessSetup.selectedBusinessLabels.length > 0
        ? businessSetup.selectedBusinessLabels
        : defaultFilters.selectedBusinessTypes,
  }
}

function appendSavedReport(report: SavedCommercialAnalysisReport) {
  const key = 'metropick-saved-commercial-analysis-reports'
  const existing = safeParseStorage<SavedCommercialAnalysisReport[]>(key) ?? []
  writeStorage(key, [...existing, report])
}

function formatBackendIndex(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0'
}

function buildBackendSummaryCards(
  summary: BackendCommercialAnalysisSummary,
): SummaryCardItem[] {
  return [
    {
      title: '분석 역세권',
      value: `${summary.station_count.toLocaleString()}개`,
      change: `적합도 ${formatBackendIndex(summary.average_startup_suitability_score)}`,
      desc: summary.top_station?.station_name
        ? `상위 ${summary.top_station.station_name}`
        : 'FastAPI 샘플',
    },
    {
      title: '평균 창업 적합도',
      value: `${formatBackendIndex(summary.average_startup_suitability_score)}점`,
      change: '샘플 기준',
      desc: '규칙 기반',
    },
    {
      title: '평균 유동 수요 지표',
      value: `${formatBackendIndex(summary.average_floating_demand_index)}점`,
      change: 'FastAPI',
      desc: '샘플 데이터',
    },
    {
      title: '평균 경쟁 지표',
      value: `${formatBackendIndex(summary.average_competition_index)}점`,
      change: '참고용',
      desc: '목업 대체',
    },
  ]
}

function getBackendStatus({
  isError,
  isLoading,
  isSuccess,
}: {
  isError: boolean
  isLoading: boolean
  isSuccess: boolean
}): BackendStatus {
  if (isLoading) {
    return 'loading'
  }

  if (isSuccess && !isError) {
    return 'connected'
  }

  return 'fallback'
}

function SelectBox({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 flex items-center gap-2 text-sm font-black text-slate-800">
        <Icon aria-hidden="true" size={16} />
        {label}
      </label>
      <button
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-700"
        type="button"
      >
        <span>{value}</span>
        <ChevronDown aria-hidden="true" size={16} />
      </button>
    </div>
  )
}

function ToggleSwitch({
  checked,
  label,
  onClick,
}: {
  checked: boolean
  label: string
  onClick: () => void
}) {
  return (
    <div className="flex h-8 items-center justify-between">
      <span className="text-sm font-extrabold text-slate-700">{label}</span>
      <button
        aria-checked={checked}
        className={`h-[22px] w-[39px] rounded-full p-0.5 transition ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
        onClick={onClick}
        role="switch"
        type="button"
      >
        <span
          className={`block h-[18px] w-[18px] rounded-full bg-white transition ${checked ? 'translate-x-[17px]' : ''}`}
        />
      </button>
    </div>
  )
}

function FilterPanel({
  filters,
  onLayerToggle,
  onRadiusChange,
}: {
  filters: CommercialAnalysisFilters
  onLayerToggle: (key: PopulationLayerKey) => void
  onRadiusChange: (radius: RadiusOption) => void
}) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white/95 p-[18px] shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
      <SelectBox icon={MapPin} label="지역 선택" value={filters.region} />
      <SelectBox icon={Train} label="노선 선택" value={filters.route} />

      <div className="mb-3">
        <label className="mb-1.5 flex items-center gap-2 text-sm font-black text-slate-800">
          <Search aria-hidden="true" size={16} />역 선택{' '}
          <small className="font-bold text-slate-400">(복수 선택 가능)</small>
        </label>
        <div className="mb-2 flex h-10 items-center rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-400">
          역명을 검색하세요
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.selectedStations.slice(0, 5).map((station) => (
            <span
              className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-extrabold text-blue-700"
              key={station}
            >
              {station} <b className="text-blue-400">×</b>
            </span>
          ))}
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-extrabold text-slate-500">
            +5
          </span>
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1.5 flex items-center gap-2 text-sm font-black text-slate-800">
          <Gauge aria-hidden="true" size={16} />
          분석 반경
        </label>
        <div className="flex gap-5">
          {(['300m', '500m', '1km'] satisfies RadiusOption[]).map((radius) => (
            <button
              aria-pressed={filters.radius === radius}
              className="flex items-center gap-2 text-sm font-extrabold text-slate-700"
              key={radius}
              onClick={() => onRadiusChange(radius)}
              type="button"
            >
              <span
                className={`grid h-[18px] w-[18px] place-items-center rounded-full border ${
                  filters.radius === radius ? 'border-blue-600' : 'border-slate-400'
                }`}
              >
                {filters.radius === radius ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                ) : null}
              </span>
              {radius}
            </button>
          ))}
        </div>
      </div>

      <SelectBox icon={Store} label="업종 선택" value="업종 선택 (전체)" />
      <div className="mb-3 mt-[-6px] flex flex-wrap gap-1.5">
        {filters.selectedBusinessTypes.slice(0, 4).map((businessType) => (
          <span
            className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-extrabold text-blue-700"
            key={businessType}
          >
            {businessType}
          </span>
        ))}
        <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-extrabold text-blue-700">
          +3
        </span>
      </div>

      <SelectBox icon={CalendarDays} label="기간 설정" value={filters.dateRange} />

      <div className="mb-3">
        <label className="mb-1.5 flex items-center gap-2 text-sm font-black text-slate-800">
          <Layers aria-hidden="true" size={16} />
          인구/유동인구 레이어
        </label>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
          {(Object.keys(layerLabels) as PopulationLayerKey[]).map((key) => (
            <ToggleSwitch
              checked={filters.populationLayers[key]}
              key={key}
              label={layerLabels[key]}
              onClick={() => onLayerToggle(key)}
            />
          ))}
        </div>
      </div>

      <button
        className="h-11 w-full rounded-lg bg-blue-600 text-base font-black text-white shadow-[0_8px_18px_rgba(7,93,245,0.24)]"
        type="button"
      >
        분석 적용
      </button>
    </aside>
  )
}

function MapCard() {
  return (
    <section className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
      <div className="h-full overflow-x-auto">
        <ImageWithFallback
          alt="광주 2호선 역세권 상권 밀집도 지도"
          className="h-full min-h-[560px] w-full min-w-[760px] object-cover"
          draggable={false}
          fallbackText="상권 밀집도 지도를 불러올 수 없습니다."
          src={commercialAnalysisAssets.commercialDensityMap}
        />
      </div>
    </section>
  )
}

function SummaryPanel({
  backendSummary,
  radius,
}: {
  backendSummary: BackendCommercialAnalysisSummary | null
  radius: RadiusOption
}) {
  const cards: readonly SummaryCardItem[] = backendSummary
    ? buildBackendSummaryCards(backendSummary)
    : summaryCards

  return (
    <aside className="min-w-0 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-base font-black">
            <PieChart aria-hidden="true" className="text-blue-600" size={18} />
            선택 영역 요약 <span className="text-slate-500">(8개 역, 반경 {radius})</span>
          </h3>
          <p className="mb-4 mt-2 text-xs font-extrabold text-slate-500">
            분석 기준일: 2024.05.18
          </p>
        </div>
        <button aria-label="요약 새로고침" className="text-slate-600" type="button">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5 max-xl:grid-cols-4 max-md:grid-cols-2">
        {cards.map((card) => (
          <div
            className="min-h-[94px] rounded-[10px] border border-slate-200 bg-white p-3 shadow-sm"
            key={card.title}
          >
            <p className="m-0 mb-2 text-xs font-black text-slate-500">{card.title}</p>
            <strong className="block text-2xl font-black tracking-[-0.8px]">
              {card.value}
            </strong>
            <span className="mt-2 block text-xs font-black text-emerald-600">
              {card.change}{' '}
              {card.desc ? (
                <small className="ml-2 text-slate-400">{card.desc}</small>
              ) : null}
            </span>
          </div>
        ))}
      </div>

      <div>
        <h4 className="mb-3 text-sm font-black">
          업종 분포 <span className="text-slate-500">(상위 5개)</span>
        </h4>
        <div className="mb-5 grid grid-cols-[104px_1fr] items-center gap-4 max-md:grid-cols-1 max-md:justify-items-center">
          <div className="h-24 w-24 rounded-full bg-[radial-gradient(circle,#fff_0_37%,transparent_38%),conic-gradient(#2563eb_0_36%,#14b8a6_36%_54%,#8b5cf6_54%_69%,#ef4444_69%_81%,#fbbf24_81%_90%,#94a3b8_90%_100%)]" />
          <div className="grid w-full gap-2">
            {distribution.map((item) => (
              <div
                className="grid grid-cols-[10px_minmax(0,1fr)_42px_48px] items-center gap-1.5 text-xs font-extrabold text-slate-600"
                key={item.name}
              >
                <i
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
                <b className="text-right text-slate-700">{item.percent}</b>
                <small className="text-slate-500">({item.count})</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h4 className="mb-3 text-sm font-black">인사이트 요약</h4>
        <ul className="m-0 list-disc space-y-1.5 pl-5 text-xs font-extrabold leading-relaxed text-slate-700">
          <li>상무역 반경 500m 내 음식점 밀집도가 가장 높습니다.</li>
          <li>월드컵경기장역은 유동인구 대비 점포 밀도가 낮아 성장 여지가 있습니다.</li>
          <li>효천역은 학원·교육 업종 비중이 타 역 대비 높게 나타납니다.</li>
        </ul>
      </div>
    </aside>
  )
}

function ComparisonTable() {
  const densityClasses = {
    danger: 'bg-red-500',
    normal: 'bg-amber-400',
    warning: 'bg-orange-500',
  } satisfies Record<StationComparisonRow['densityTone'], string>

  return (
    <section className="max-h-[246px] overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
      <div className="flex h-10 items-center gap-5 overflow-x-auto border-b border-slate-200 px-[18px]">
        {tabs.map((tab, index) => (
          <button
            className={`relative h-10 whitespace-nowrap text-sm font-black ${
              index === 0
                ? 'text-blue-600 after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-blue-600'
                : 'text-slate-600'
            }`}
            key={tab}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="max-h-[206px] overflow-auto">
        <table className="w-full min-w-[1040px] border-collapse">
          <thead>
            <tr>
              {[
                '역명',
                '총 점포 수',
                '상권 밀집도',
                '평균 유동인구 (주간)',
                '평균 매출 (월)',
                '경쟁 강도',
                '유망 업종 TOP 2',
                '상세 분석',
              ].map((heading) => (
                <th
                  className="h-9 border-b border-slate-100 bg-slate-50 px-4 text-left text-xs font-black text-slate-700"
                  key={heading}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.station}>
                <td className="h-9 border-b border-slate-100 px-4 text-sm font-extrabold text-slate-700">
                  <MapPin
                    aria-hidden="true"
                    className="mr-2 inline text-blue-600"
                    size={16}
                  />
                  {row.station}
                </td>
                <td className="h-9 border-b border-slate-100 px-4 text-sm font-extrabold text-slate-700">
                  {row.storeCount.toLocaleString()}
                </td>
                <td className="h-9 border-b border-slate-100 px-4 text-sm font-extrabold text-slate-700">
                  <span
                    className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${densityClasses[row.densityTone]}`}
                  />
                  {row.densityLevel}
                </td>
                <td className="h-9 border-b border-slate-100 px-4 text-sm font-extrabold text-slate-700">
                  {row.averageFloatingPopulation}
                </td>
                <td className="h-9 border-b border-slate-100 px-4 text-sm font-extrabold text-slate-700">
                  {row.averageMonthlySales}
                </td>
                <td className="h-9 border-b border-slate-100 px-4 text-sm font-extrabold text-slate-700">
                  {row.competitionLevel}
                </td>
                <td className="h-9 border-b border-slate-100 px-4">
                  <div className="flex gap-1.5">
                    {row.promisingBusinessTypes.map((businessType) => (
                      <span
                        className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500"
                        key={businessType}
                      >
                        {businessType}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="h-9 border-b border-slate-100 px-4">
                  <button
                    className="inline-flex h-7 items-center gap-1.5 rounded-md border border-blue-100 bg-white px-4 text-xs font-black text-blue-600"
                    type="button"
                  >
                    <BarChart3 aria-hidden="true" size={15} />
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function CommercialAnalysisPage() {
  const [filters, setFilters] = useState<CommercialAnalysisFilters>(() =>
    buildInitialFilters(),
  )
  const [saveMessage, setSaveMessage] = useState('')
  const backendSummaryQuery = useBackendCommercialAnalysisSummary()

  const summaryRadius = useMemo(() => filters.radius, [filters.radius])
  const backendSummary = backendSummaryQuery.isSuccess ? backendSummaryQuery.data : null
  const backendStatus = getBackendStatus({
    isError: backendSummaryQuery.isError,
    isLoading: backendSummaryQuery.isLoading,
    isSuccess: backendSummaryQuery.isSuccess,
  })

  const handleLayerToggle = (key: PopulationLayerKey) => {
    setFilters((current) => ({
      ...current,
      populationLayers: {
        ...current.populationLayers,
        [key]: !current.populationLayers[key],
      },
    }))
  }

  const handleSaveReport = () => {
    const report: SavedCommercialAnalysisReport = {
      id: `commercial-analysis-${Date.now()}`,
      title: '역세권 상권 분석 리포트',
      createdAt: new Date().toISOString(),
      route: filters.route,
      region: filters.region,
      radius: filters.radius,
      selectedStations: filters.selectedStations,
      selectedBusinessTypes: filters.selectedBusinessTypes,
    }

    appendSavedReport(report)
    setSaveMessage('리포트가 저장되었습니다.')
  }

  return (
    <div className="commercial-analysis-page min-h-screen bg-gradient-to-b from-slate-50 to-[#eef4fb] text-slate-900">
      <TopNavigation activeHref="/commercial-analysis" />

      <div className="grid min-h-[calc(100vh-var(--app-topbar-height)-var(--app-footer-height))] grid-cols-[252px_minmax(0,1fr)] max-lg:grid-cols-1">
        <AppSidebar
          activeHref="/commercial-analysis"
          ariaLabel="상권 분석 사이드 메뉴"
        />

        <main className="min-w-0 overflow-x-clip px-6 pt-7 pb-20 max-md:px-3.5">
          <section className="mb-5 flex items-end gap-3 max-md:block">
            <h1 className="m-0 text-[32px] font-black tracking-[-1px] text-slate-950">
              역세권 상권 분석
            </h1>
            <BackendStatusBadge
              connectedLabel="FastAPI 샘플 데이터 연결됨"
              fallbackLabel="백엔드 미연결 · 목업 데이터 표시"
              loadingLabel="FastAPI 연결 확인 중"
              status={backendStatus}
            />
            <p className="mb-1.5 text-sm font-bold text-slate-500">
              광주 2호선 예정 역세권의 상권 특성을 지도와 데이터로 분석하세요.
            </p>
          </section>

          <section className="grid grid-cols-[minmax(300px,335px)_minmax(0,1fr)] items-start gap-4 max-[1760px]:grid-cols-1">
            <FilterPanel
              filters={filters}
              onLayerToggle={handleLayerToggle}
              onRadiusChange={(radius) =>
                setFilters((current) => ({ ...current, radius }))
              }
            />

            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(280px,320px)] items-stretch gap-4 max-[1380px]:grid-cols-1">
              <MapCard />
              <SummaryPanel backendSummary={backendSummary} radius={summaryRadius} />
              <div className="col-span-2 min-w-0 max-[1380px]:col-span-1">
                <ComparisonTable />
              </div>
            </div>
          </section>
        </main>
      </div>

      <AppFooter />

      <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-2">
        {saveMessage ? (
          <div
            className="rounded-lg border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-lg"
            role="status"
          >
            {saveMessage}
          </div>
        ) : null}
        <button
          className="inline-flex h-12 items-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-black text-white shadow-[0_10px_24px_rgba(7,93,245,0.3)]"
          onClick={handleSaveReport}
          type="button"
        >
          <Save aria-hidden="true" size={18} />
          리포트로 저장
        </button>
      </div>
    </div>
  )
}

export default CommercialAnalysisPage
