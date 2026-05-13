import { useState, type ReactNode } from 'react'
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

import { dashboardAssets } from '@/shared/assets/dashboardAssets'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { TopNavigation } from '@/shared/components/TopNavigation'
import {
  businessPotentials,
  dashboardInsights,
  dashboardKpis,
  dashboardNotices,
  dashboardReports,
  recommendedStations,
  type DashboardInsight,
  type DashboardKpi,
  type DashboardKpiTone,
} from '@/shared/data/mockDashboard'

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
      className={`h-12 w-[110px] self-end max-2xl:hidden ${sparklineToneClasses[tone]}`}
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
    <article className="grid min-h-[145px] grid-cols-[62px_1fr_110px] items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_22px_rgba(12,33,70,0.06)] max-2xl:grid-cols-[56px_1fr]">
      <div
        className={`grid h-[58px] w-[58px] place-items-center rounded-[10px] ${kpiToneClasses[kpi.tone]}`}
      >
        <Icon aria-hidden="true" size={32} />
      </div>

      <div>
        <span className="block text-[15px] font-extrabold text-slate-700">
          {kpi.label}
        </span>
        <strong className="mt-1 block text-[28px] font-black tracking-[-0.8px] text-slate-950">
          {kpi.value}
        </strong>
        <p className="mt-3 flex items-center gap-1 text-sm font-black text-emerald-600">
          <TrendingUp aria-hidden="true" size={15} />
          {kpi.change}
          <em className="ml-2 not-italic text-slate-500">{kpi.caption}</em>
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

function MapPanel() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)] lg:row-span-2">
      <div className="flex items-center justify-between gap-3">
        <PanelTitle info>광주 2호선 상권 변화 지도</PanelTitle>
        <button
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700"
          type="button"
        >
          히트맵: 유동인구 변화율
        </button>
      </div>

      <div className="relative mt-3.5 h-[440px] overflow-hidden rounded-[10px] border border-slate-200 bg-slate-50 max-sm:h-[320px]">
        <img
          alt="광주 2호선 상권 변화 지도"
          className="h-full w-full object-cover"
          draggable={false}
          src={dashboardAssets.commercialChangeMap}
        />
        <div className="absolute bottom-5 right-3.5 grid gap-2">
          {['+', '⌖', '⛶'].map((label) => (
            <button
              aria-label={`지도 컨트롤 ${label}`}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-lg font-extrabold text-slate-700 shadow-sm"
              key={label}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function PopulationTrendChart() {
  const xLabels = ['2024.12', '2025.01', '2025.02', '2025.03', '2025.04', '2025.05']

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)]">
      <div className="flex items-center justify-between">
        <PanelTitle>
          유동인구 추이{' '}
          <small className="text-xs text-slate-600">(광주 2호선 전체)</small>
        </PanelTitle>
        <button
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700"
          type="button"
        >
          월간
          <ChevronDown aria-hidden="true" size={14} />
        </button>
      </div>

      <div className="relative mt-3 h-[215px] pl-11">
        <div className="absolute left-0 top-4 flex h-[200px] flex-col justify-between text-xs font-extrabold text-slate-600">
          {['200K', '150K', '100K', '50K', '0'].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <svg
          aria-label="유동인구 월간 추이 차트"
          className="h-[200px] w-full"
          viewBox="0 0 440 250"
        >
          {[0, 1, 2, 3, 4].map((y) => (
            <line
              key={`h-${y}`}
              stroke="#e5ebf3"
              x1="0"
              x2="440"
              y1={y * 50 + 20}
              y2={y * 50 + 20}
            />
          ))}
          {[0, 1, 2, 3, 4, 5].map((x) => (
            <line
              key={`v-${x}`}
              stroke="#e5ebf3"
              x1={x * 80}
              x2={x * 80}
              y1="20"
              y2="220"
            />
          ))}
          <path
            d="M0 160 L80 150 L160 153 L240 145 L320 130 L400 105"
            fill="none"
            stroke="#2473ff"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M0 160 L80 150 L160 153 L240 145 L320 130 L400 105 L400 220 L0 220 Z"
            fill="#2473ff"
            opacity="0.08"
          />
          {[0, 80, 160, 240, 320, 400].map((x, index) => {
            const y = [160, 150, 153, 145, 130, 105][index] ?? 160

            return (
              <circle
                cx={x}
                cy={y}
                fill="#fff"
                key={x}
                r={index === 5 ? 8 : 5}
                stroke="#2473ff"
                strokeWidth="4"
              />
            )
          })}
        </svg>
        <div className="absolute bottom-10 right-4 w-32 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
          <span className="font-extrabold text-slate-500">2025.05</span>
          <strong className="mt-1 block text-base text-slate-950">125,430명</strong>
          <p className="m-0 mt-1 font-black text-emerald-600">↗ 12.4%</p>
        </div>
        <div className="mt-[-4px] flex justify-between text-xs font-extrabold text-slate-500">
          {xLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function BusinessPotentialPanel({
  selectedBusinessLabels,
}: {
  selectedBusinessLabels: string[]
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)]">
      <div className="flex items-center justify-between">
        <PanelTitle>
          업종별 매출 잠재력 <small className="text-xs text-slate-600">(상위 5)</small>
        </PanelTitle>
        <button
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700"
          type="button"
        >
          매출 잠재력 순
          <ChevronDown aria-hidden="true" size={14} />
        </button>
      </div>

      <div className="mt-6 grid gap-[18px]">
        {businessPotentials.map((item) => {
          const percentage = Number.parseFloat(item.percentage)
          const width = Number.isFinite(percentage) ? Math.min(100, percentage * 3.2) : 40
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
        })}
      </div>
    </section>
  )
}

function RecommendedStationTable() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)] lg:col-span-2">
      <PanelTitle info>AI 추천 역세권 TOP 5</PanelTitle>

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
            {recommendedStations.map((item) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RecentReportsPanel() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)]">
      <PanelTopLink title="최근 저장한 리포트" />

      <div className="mt-3.5 grid">
        {dashboardReports.map((report) => (
          <div
            className="grid min-h-[60px] grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-slate-100 last:border-b-0 max-sm:grid-cols-[44px_1fr]"
            key={report.title}
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <FileText aria-hidden="true" size={21} />
            </div>
            <div>
              <strong className="block text-sm text-slate-900">{report.title}</strong>
              <span className="mt-1 block text-xs text-slate-500">{report.location}</span>
            </div>
            <div className="flex items-center gap-3 max-sm:col-span-2 max-sm:ml-11">
              <span className="text-xs font-extrabold text-slate-500">{report.date}</span>
              <em className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-black not-italic text-blue-600">
                {report.tag}
              </em>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function InsightsPanel() {
  const toneClasses = {
    blue: 'bg-blue-400',
    green: 'bg-emerald-300',
    red: 'bg-rose-400',
  } satisfies Record<DashboardInsight['tone'], string>

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)]">
      <PanelTopLink title="AI 인사이트 요약" />

      <div className="mt-3.5 grid">
        {dashboardInsights.map((item) => {
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
        })}
      </div>
    </section>
  )
}

function NoticesPanel() {
  const labelClasses = {
    danger: 'bg-rose-50 text-rose-600',
    info: 'bg-blue-50 text-blue-600',
    warning: 'bg-amber-50 text-amber-600',
  } satisfies Record<(typeof dashboardNotices)[number]['type'], string>

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_8px_22px_rgba(12,33,70,0.06)]">
      <PanelTopLink title="알림 및 공지" />

      <div className="mt-3.5 grid">
        {dashboardNotices.map((notice) => (
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
        ))}
      </div>
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

  const [lastUpdated, setLastUpdated] = useState('2025.05.20 09:30')
  const stationCount = stationSetup?.selectedStations?.length ?? 0
  const selectedBusinessLabels = businessSetup?.selectedBusinessLabels ?? []
  const notificationCount = Math.max(
    notificationSetup?.enabledNotificationIds?.length ?? 3,
    3,
  )
  const completedLabel = onboardingSummary?.completedAt
    ? `온보딩 완료: ${onboardingSummary.completedAt}`
    : '온보딩 기본 설정'

  const handleRefresh = () => {
    const now = new Date()
    const formatted = new Intl.DateTimeFormat('ko-KR', {
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
      .format(now)
      .replace(/\. /g, '.')
      .replace(/\.$/, '')
    setLastUpdated(formatted)
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-950">
      <TopNavigation activeHref="/dashboard" sticky />

      <div className="grid min-h-[calc(100vh-var(--app-topbar-height))] grid-cols-[252px_minmax(0,1fr)] max-lg:grid-cols-1">
        <AppSidebar activeHref="/dashboard" ariaLabel="대시보드 사이드 메뉴" />

        <main className="min-w-0">
        <section className="px-10 py-7 max-lg:px-4">
          <span className="sr-only">{completedLabel}</span>

          <div className="mb-5 flex items-start justify-between gap-4 max-xl:flex-col">
            <div>
              <h1 className="m-0 text-[31px] font-black tracking-[-0.8px] text-slate-950">
                광주 2호선 상권 변화 대시보드
              </h1>
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

          <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
            {dashboardKpis.map((kpi) => (
              <SummaryCard key={kpi.id} kpi={kpi} />
            ))}
          </div>

          <div className="mt-3.5 grid grid-cols-[1.45fr_0.85fr_0.85fr] gap-3.5 max-2xl:grid-cols-2 max-lg:grid-cols-1">
            <MapPanel />
            <PopulationTrendChart />
            <BusinessPotentialPanel selectedBusinessLabels={selectedBusinessLabels} />
            <RecommendedStationTable />
          </div>

          <div className="mt-3.5 grid grid-cols-3 gap-3.5 max-xl:grid-cols-1">
            <RecentReportsPanel />
            <InsightsPanel />
            <NoticesPanel />
          </div>
        </section>
      </main>
      </div>
    </div>
  )
}

export default DashboardPage
