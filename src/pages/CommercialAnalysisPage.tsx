import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarDays,
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

import { CommercialAnalysisMap } from '@/features/commercial-analysis/CommercialAnalysisMap'
import {
  getBackendCommercialAnalysisMapData,
  type BackendCommercialAnalysisMapData,
  type BackendCommercialBusinessDistributionItem,
  type BackendCommercialComparisonRow,
  type BackendCommercialStationMarker,
  type BackendCommercialSummaryCard,
} from '@/shared/api/backendCommercialAnalysisApi'
import { AppFooter } from '@/shared/components/AppFooter'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { BackendStatusBadge } from '@/shared/components/BackendStatusBadge'
import { TopNavigation } from '@/shared/components/TopNavigation'
import { safeParseStorage, writeStorage } from '@/shared/lib/storage'

type RadiusOption = '300m' | '500m' | '1km'
type MapLayerKey = 'line_1' | 'line_2' | 'stations' | 'density' | 'bus_stops'

type CommercialAnalysisFilters = {
  businessType: string
  dateRange: string
  mapLayers: Record<MapLayerKey, boolean>
  radius: RadiusOption
  region: string
  route: string
  selectedStations: string[]
}

type StoredStationSetup = {
  radius?: RadiusOption
  route?: string
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

const defaultFilters: CommercialAnalysisFilters = {
  region: '광주광역시',
  route: '전체',
  selectedStations: [],
  radius: '500m',
  businessType: '',
  dateRange: '2024-04-18 ~ 2024-05-18',
  mapLayers: {
    line_1: true,
    line_2: true,
    stations: true,
    density: true,
    bus_stops: false,
  },
}

const fallbackSummaryCards: BackendCommercialSummaryCard[] = [
  { title: '총 점포 수', value: '12,843개', change: '+8.7%', desc: '전월 대비' },
  { title: '업종 수', value: '96개', change: '+3개', desc: '전월 대비' },
  {
    title: '평균 유동인구 (주간)',
    value: '125,430명',
    change: '+12.3%',
    desc: '전월 대비',
  },
  { title: '경쟁 강도 (평균)', value: '보통', change: '2.8 / 5.0', desc: '' },
]

const fallbackDistribution: BackendCommercialBusinessDistributionItem[] = [
  { name: '음식점', key: 'restaurant', percent: 36.2, count: 4650, color: '#2563eb' },
  { name: '카페/디저트', key: 'cafe', percent: 17.8, count: 2287, color: '#14b8a6' },
  { name: '소매', key: 'retail', percent: 15.4, count: 1978, color: '#8b5cf6' },
  { name: '생활서비스', key: 'service', percent: 12.1, count: 1552, color: '#ef4444' },
  { name: '학원', key: 'academy', percent: 8.7, count: 1116, color: '#fbbf24' },
  { name: '기타', key: 'etc', percent: 9.8, count: 1260, color: '#94a3b8' },
]

const fallbackComparisonRows: BackendCommercialComparisonRow[] = [
  {
    station_id: 'fallback-sangmu',
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
    station_id: 'fallback-worldcup',
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
    station_id: 'fallback-yangsan',
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
    station_id: 'fallback-geumho',
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

const fallbackInsights = [
  '상무역 반경 500m 내 음식점 밀집도가 가장 높습니다.',
  '월드컵경기장역은 유동인구 대비 점포 밀도가 낮아 성장 여지가 있습니다.',
  '효천역은 학원·교육 업종 비중이 타 역 대비 높게 나타납니다.',
]

const tabs = [
  '핵심 역세권 비교',
  '업종 분포',
  '유동인구',
  '매출 현황',
  '경쟁도',
  '상권 변화 추이',
]

const layerLabels: Record<MapLayerKey, string> = {
  line_1: '1호선 경로',
  line_2: '2호선 예정 경로',
  stations: '역 마커',
  density: '점포 밀도',
  bus_stops: '버스 정류소',
}

const businessTypeOptions = [
  { label: '전체 업종', value: '' },
  { label: '음식점', value: '음식점' },
  { label: '카페/디저트', value: '카페/디저트' },
  { label: '소매', value: '소매' },
  { label: '미용', value: '미용' },
  { label: '학원', value: '학원' },
  { label: '편의점', value: '편의점' },
  { label: '약국', value: '약국' },
]

const regionOptions = ['광주광역시', '동구', '서구', '남구', '북구', '광산구']
const routeOptions = ['전체', '1호선', '2호선']

function normalizeStoredRoute(route: string | undefined): string {
  if (!route) {
    return defaultFilters.route
  }
  if (routeOptions.includes(route)) {
    return route
  }
  if (route.includes('1')) {
    return '1호선'
  }
  if (route.includes('2')) {
    return '2호선'
  }
  return defaultFilters.route
}

function cloneFilters(filters: CommercialAnalysisFilters): CommercialAnalysisFilters {
  return {
    ...filters,
    mapLayers: { ...filters.mapLayers },
    selectedStations: [...filters.selectedStations],
  }
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
    route: normalizeStoredRoute(stationSetup?.route),
    selectedStations: defaultFilters.selectedStations,
    radius: stationSetup?.radius ?? defaultFilters.radius,
    businessType:
      businessSetup?.selectedBusinessLabels &&
      businessSetup.selectedBusinessLabels.length > 0
        ? (businessSetup.selectedBusinessLabels[0] ?? defaultFilters.businessType)
        : defaultFilters.businessType,
  }
}

function appendSavedReport(report: SavedCommercialAnalysisReport) {
  const key = 'metropick-saved-commercial-analysis-reports'
  const existing = safeParseStorage<SavedCommercialAnalysisReport[]>(key) ?? []
  writeStorage(key, [...existing, report])
}

function radiusToMeters(radius: RadiusOption): number {
  if (radius === '300m') {
    return 300
  }
  if (radius === '1km') {
    return 1000
  }
  return 500
}

function enabledLayers(mapLayers: Record<MapLayerKey, boolean>): string[] {
  return (Object.keys(mapLayers) as MapLayerKey[]).filter((key) => mapLayers[key])
}

function getBackendStatus({
  data,
  isError,
  isLoading,
}: {
  data: BackendCommercialAnalysisMapData | undefined
  isError: boolean
  isLoading: boolean
}): BackendStatus {
  if (isLoading) {
    return 'loading'
  }

  if (!isError && data?.data_status === 'public_store_csv') {
    return 'connected'
  }

  return 'fallback'
}

function normalStationKey(value: string): string {
  return value.replace(/\s|역|예정|\(|\)|_/g, '').toLowerCase()
}

function stationMatchesToken(
  station: BackendCommercialStationMarker,
  token: string,
): boolean {
  const lowerToken = token.toLowerCase()
  const normalizedToken = normalStationKey(token)
  return (
    station.station_id.toLowerCase() === lowerToken ||
    normalStationKey(station.station_name) === normalizedToken ||
    normalStationKey(station.raw_station_name) === normalizedToken
  )
}

function isStationSelected(
  station: BackendCommercialStationMarker,
  selectedStations: string[],
): boolean {
  return selectedStations.some((token) => stationMatchesToken(station, token))
}

function SelectControl({
  icon: Icon,
  label,
  onChange,
  options,
  value,
}: {
  icon: LucideIcon
  label: string
  onChange: (value: string) => void
  options: string[]
  value: string
}) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 flex items-center gap-2 text-sm font-black text-slate-800">
        <Icon aria-hidden="true" size={16} />
        {label}
      </label>
      <select
        className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-700"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
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

function StationSelector({
  filters,
  onStationToggle,
  stations,
}: {
  filters: CommercialAnalysisFilters
  onStationToggle: (station: BackendCommercialStationMarker) => void
  stations: BackendCommercialStationMarker[]
}) {
  const selectedLabels = stations
    .filter((station) => isStationSelected(station, filters.selectedStations))
    .map((station) => station.station_name)

  return (
    <div className="mb-3">
      <label className="mb-1.5 flex items-center gap-2 text-sm font-black text-slate-800">
        <Search aria-hidden="true" size={16} />
        역 선택 <small className="font-bold text-slate-400">(복수 선택 가능)</small>
      </label>
      <div className="mb-2 rounded-lg border border-slate-300 bg-slate-50 p-2">
        <div className="mb-2 min-h-7 text-sm font-bold text-slate-500">
          {selectedLabels.length > 0
            ? selectedLabels.slice(0, 4).join(', ')
            : '전체 역'}
        </div>
        <div className="grid max-h-36 gap-1 overflow-auto pr-1">
          {stations.slice(0, 40).map((station) => (
            <label
              className="flex h-7 items-center gap-2 rounded-md px-1.5 text-xs font-extrabold text-slate-700 hover:bg-white"
              key={station.station_id}
            >
              <input
                checked={isStationSelected(station, filters.selectedStations)}
                className="h-3.5 w-3.5"
                onChange={() => onStationToggle(station)}
                type="checkbox"
              />
              <span className="truncate">
                {station.station_name} · {station.line}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {selectedLabels.slice(0, 5).map((station) => (
          <span
            className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-extrabold text-blue-700"
            key={station}
          >
            {station}
          </span>
        ))}
        {selectedLabels.length > 5 ? (
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-extrabold text-slate-500">
            +{selectedLabels.length - 5}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function FilterPanel({
  filters,
  isApplying,
  onApplyFilters,
  onBusinessTypeChange,
  onLayerToggle,
  onRadiusChange,
  onRegionChange,
  onRouteChange,
  onStationToggle,
  stations,
}: {
  filters: CommercialAnalysisFilters
  isApplying: boolean
  onApplyFilters: () => void
  onBusinessTypeChange: (businessType: string) => void
  onLayerToggle: (key: MapLayerKey) => void
  onRadiusChange: (radius: RadiusOption) => void
  onRegionChange: (region: string) => void
  onRouteChange: (route: string) => void
  onStationToggle: (station: BackendCommercialStationMarker) => void
  stations: BackendCommercialStationMarker[]
}) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white/95 p-[18px] shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
      <SelectControl
        icon={MapPin}
        label="지역 선택"
        onChange={onRegionChange}
        options={regionOptions}
        value={filters.region}
      />
      <SelectControl
        icon={Train}
        label="노선 선택"
        onChange={onRouteChange}
        options={routeOptions}
        value={filters.route}
      />

      <StationSelector
        filters={filters}
        onStationToggle={onStationToggle}
        stations={stations}
      />

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

      <div className="mb-3">
        <label
          className="mb-1.5 flex items-center gap-2 text-sm font-black text-slate-800"
          htmlFor="commercial-analysis-business-type"
        >
          <Store aria-hidden="true" size={16} />
          업종 선택
        </label>
        <select
          id="commercial-analysis-business-type"
          className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-700"
          onChange={(event) => onBusinessTypeChange(event.target.value)}
          value={filters.businessType}
        >
          {businessTypeOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="mb-1.5 flex items-center gap-2 text-sm font-black text-slate-800">
          <CalendarDays aria-hidden="true" size={16} />
          기간 설정
        </label>
        <div className="flex h-10 items-center rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-500">
          {filters.dateRange}
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1.5 flex items-center gap-2 text-sm font-black text-slate-800">
          <Layers aria-hidden="true" size={16} />
          지도 레이어
        </label>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
          {(Object.keys(layerLabels) as MapLayerKey[]).map((key) => (
            <ToggleSwitch
              checked={filters.mapLayers[key]}
              key={key}
              label={layerLabels[key]}
              onClick={() => onLayerToggle(key)}
            />
          ))}
        </div>
      </div>

      <button
        className="h-11 w-full rounded-lg bg-blue-600 text-base font-black text-white shadow-[0_8px_18px_rgba(7,93,245,0.24)] disabled:cursor-wait disabled:bg-blue-400"
        disabled={isApplying}
        onClick={onApplyFilters}
        type="button"
      >
        {isApplying ? '분석 갱신 중' : '분석 적용'}
      </button>
    </aside>
  )
}

function SummaryPanel({
  mapData,
  radius,
}: {
  mapData: BackendCommercialAnalysisMapData | null
  radius: RadiusOption
}) {
  const cards = mapData?.summary_cards ?? fallbackSummaryCards
  const distribution = mapData?.business_distribution ?? fallbackDistribution
  const insights = mapData?.insight_summaries ?? fallbackInsights
  const stationCount = mapData?.station_markers.length ?? 8

  return (
    <aside className="min-w-0 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-base font-black">
            <PieChart aria-hidden="true" className="text-blue-600" size={18} />
            선택 영역 요약{' '}
            <span className="text-slate-500">
              ({stationCount}개 역, 반경 {radius})
            </span>
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
            <strong className="block text-2xl font-black">{card.value}</strong>
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
            {distribution.slice(0, 6).map((item) => (
              <div
                className="grid grid-cols-[10px_minmax(0,1fr)_48px_56px] items-center gap-1.5 text-xs font-extrabold text-slate-600"
                key={item.key}
              >
                <i
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
                <b className="text-right text-slate-700">
                  {item.percent.toFixed(1)}%
                </b>
                <small className="text-slate-500">({item.count.toLocaleString()})</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h4 className="mb-3 text-sm font-black">인사이트 요약</h4>
        <ul className="m-0 list-disc space-y-1.5 pl-5 text-xs font-extrabold leading-relaxed text-slate-700">
          {insights.map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

function ComparisonTable({ rows }: { rows: BackendCommercialComparisonRow[] }) {
  const densityClasses = {
    danger: 'bg-red-500',
    normal: 'bg-amber-400',
    warning: 'bg-orange-500',
  } satisfies Record<BackendCommercialComparisonRow['densityTone'], string>

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
            {rows.map((row) => (
              <tr key={row.station_id}>
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
  const [appliedFilters, setAppliedFilters] = useState<CommercialAnalysisFilters>(() =>
    cloneFilters(buildInitialFilters()),
  )
  const [applyVersion, setApplyVersion] = useState(0)
  const [saveMessage, setSaveMessage] = useState('')

  const mapDataQuery = useQuery({
    queryKey: ['backend-commercial-analysis-map-data', appliedFilters, applyVersion],
    queryFn: () =>
      getBackendCommercialAnalysisMapData({
        businessType: appliedFilters.businessType,
        layers: enabledLayers(appliedFilters.mapLayers),
        line: appliedFilters.route,
        radiusM: radiusToMeters(appliedFilters.radius),
        region: appliedFilters.region,
        stationIds: appliedFilters.selectedStations,
      }),
    retry: false,
  })

  const mapData = mapDataQuery.isSuccess ? mapDataQuery.data : null
  const stationOptions = useMemo(
    () => mapData?.station_markers ?? [],
    [mapData?.station_markers],
  )
  const activeLayers = useMemo(() => enabledLayers(filters.mapLayers), [filters.mapLayers])
  const comparisonRows = mapData?.comparison_rows ?? fallbackComparisonRows
  const backendStatus = getBackendStatus({
    data: mapDataQuery.data,
    isError: mapDataQuery.isError,
    isLoading: mapDataQuery.isLoading,
  })

  const handleLayerToggle = (key: MapLayerKey) => {
    setFilters((current) => ({
      ...current,
      mapLayers: {
        ...current.mapLayers,
        [key]: !current.mapLayers[key],
      },
    }))
  }

  const handleStationToggle = (station: BackendCommercialStationMarker) => {
    setFilters((current) => {
      const alreadySelected = isStationSelected(station, current.selectedStations)
      return {
        ...current,
        selectedStations: alreadySelected
          ? current.selectedStations.filter(
              (token) => !stationMatchesToken(station, token),
            )
          : [...current.selectedStations, station.station_id],
      }
    })
  }

  const handleApplyFilters = () => {
    setAppliedFilters(cloneFilters(filters))
    setApplyVersion((current) => current + 1)
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
      selectedBusinessTypes: filters.businessType ? [filters.businessType] : [],
    }

    appendSavedReport(report)
    setSaveMessage('리포트가 저장되었습니다.')
  }

  return (
    <div className="commercial-analysis-page min-h-screen bg-gradient-to-b from-slate-50 to-[#eef4fb] text-slate-900">
      <TopNavigation activeHref="/commercial-analysis" />

      <div className="flex min-h-[calc(100vh-var(--app-topbar-height)-var(--app-footer-height))] max-lg:flex-col">
        <AppSidebar
          activeHref="/commercial-analysis"
          ariaLabel="상권 분석 사이드 메뉴"
        />

        <main className="min-w-0 flex-1 overflow-x-clip px-6 pt-7 pb-20 max-md:px-3.5">
          <section className="mb-5 flex items-end gap-3 max-md:block">
            <h1 className="m-0 text-[32px] font-black text-slate-950">
              역세권 상권 분석
            </h1>
            <BackendStatusBadge
              connectedLabel="FastAPI 실데이터 지도 연결됨"
              fallbackLabel="백엔드 미연결 · 목업 데이터 표시"
              loadingLabel="FastAPI 연결 확인 중"
              status={backendStatus}
            />
            <p className="mb-1.5 text-sm font-bold text-slate-500">
              광주 1호선과 2호선 예정 역세권의 상권 특성을 지도와 데이터로 분석하세요.
            </p>
          </section>

          <section className="grid grid-cols-[minmax(300px,335px)_minmax(0,1fr)] items-start gap-4 max-[1760px]:grid-cols-1">
            <FilterPanel
              filters={filters}
              isApplying={mapDataQuery.isFetching}
              onApplyFilters={handleApplyFilters}
              onBusinessTypeChange={(businessType) =>
                setFilters((current) => ({ ...current, businessType }))
              }
              onLayerToggle={handleLayerToggle}
              onRadiusChange={(radius) =>
                setFilters((current) => ({ ...current, radius }))
              }
              onRegionChange={(region) =>
                setFilters((current) => ({ ...current, region }))
              }
              onRouteChange={(route) =>
                setFilters((current) => ({ ...current, route }))
              }
              onStationToggle={handleStationToggle}
              stations={stationOptions}
            />

            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(280px,320px)] items-stretch gap-4 max-[1380px]:grid-cols-1">
              <CommercialAnalysisMap activeLayers={activeLayers} data={mapData} />
              <SummaryPanel mapData={mapData} radius={filters.radius} />
              <div className="col-span-2 min-w-0 max-[1380px]:col-span-1">
                <ComparisonTable rows={comparisonRows} />
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
