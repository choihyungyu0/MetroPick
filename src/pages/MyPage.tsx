import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  BellRing,
  CalendarClock,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  FileText,
  Mail,
  MessageSquare,
  MoreVertical,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCog,
  Zap,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { landingAssets } from '@/shared/assets/landingAssets'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { TopNavigation } from '@/shared/components/TopNavigation'
import { myPageAssets } from '@/shared/assets/myPageAssets'
import { safeParseStorage, writeStorage } from '@/shared/lib/storage'

type MyPageTab = 'reports' | 'interest-locations' | 'notifications' | 'activity'

type ReportCategory = '상권 분석' | 'AI 예측' | '입지 추천'

type SavedReport = {
  businessType: string
  category: ReportCategory
  id: string
  savedAt: string
  stationArea: string
  thumbnailSrc: string
  title: string
}

type InterestLocation = {
  businessType: string
  district: string
  id: string
  savedAt?: string
  score: number
  station: string
}

type RecentNotification = {
  description: string
  id: string
  timeAgo: string
  title: string
}

type ActivityItem = {
  createdAt: string
  id: string
  message: string
}

type CategoryFilter = 'all' | 'commercial-analysis' | 'ai-prediction' | 'recommendation'

type SortOrder = 'latest' | 'oldest'

type NotificationFrequency = '실시간' | '매일' | '매주'

type NotificationSettings = {
  channels: {
    email: boolean
    sms: boolean
    webPush: boolean
  }
  enabledNotifications: string[]
  frequency: NotificationFrequency
  quietHours: string
}

type UserProfile = {
  businessTypes: string
  email: string
  name: string
  plan: string
  preferredArea: string
  role: string
}

type StoredUser = {
  businessTypes?: string[]
  email?: string
  name?: string
  plan?: string
  preferredArea?: string
  role?: string
}

type StoredBusinessSetup = {
  selectedBusinessLabels?: string[]
}

type StoredOnboardingSummary = {
  businessTypes?: StoredBusinessSetup
  completedAt?: string
  stations?: {
    selectedStations?: string[]
  }
}

type StoredCurrentReport = {
  businessType?: string
  createdAt?: string
  id?: string
  stationArea?: string
  title?: string
}

type StoredRecommendation = {
  businessType?: string
  createdAt?: string
  score?: number
  station?: string
}

type StoredCommercialReport = {
  businessType?: string
  createdAt?: string
  id?: string
  savedAt?: string
  selectedBusinessTypes?: string[]
  selectedStations?: string[]
  stationArea?: string
  title?: string
}

type StoredPredictionResult = {
  businessType?: string
  createdAt?: string
  id?: string
  stationArea?: string
}

const tabs: Array<{ id: MyPageTab; label: string }> = [
  { id: 'reports', label: '저장한 리포트' },
  { id: 'interest-locations', label: '관심 역세권' },
  { id: 'notifications', label: '알림 설정' },
  { id: 'activity', label: '최근 활동' },
]

const categoryFilters: Array<{
  count: number
  id: CategoryFilter
  label: string
}> = [
  { id: 'all', label: '전체', count: 12 },
  { id: 'commercial-analysis', label: '상권 분석', count: 6 },
  { id: 'ai-prediction', label: 'AI 예측', count: 4 },
  { id: 'recommendation', label: '입지 추천', count: 2 },
]

const reportsPerPage = 4

const defaultReports: SavedReport[] = [
  {
    id: 'default-commercial-sangmu',
    title: '상무역 상권 분석 리포트',
    category: '상권 분석',
    businessType: '카페',
    stationArea: '상무역',
    savedAt: '2024.06.18 14:30',
    thumbnailSrc: myPageAssets.commercialMap,
  },
  {
    id: 'default-recommendation-uncheon',
    title: '운천역 입지 추천 리포트',
    category: '입지 추천',
    businessType: '음식점',
    stationArea: '운천역',
    savedAt: '2024.06.16 09:15',
    thumbnailSrc: myPageAssets.recommendationMap,
  },
  {
    id: 'default-ai-ssangchon',
    title: '쌍촌역 매출 예측 리포트',
    category: 'AI 예측',
    businessType: '편의점',
    stationArea: '쌍촌역',
    savedAt: '2024.06.15 16:45',
    thumbnailSrc: myPageAssets.aiPredictionChart,
  },
  {
    id: 'default-commercial-all',
    title: '전체 역세권 비교 분석 리포트',
    category: '상권 분석',
    businessType: '전체',
    stationArea: '전체',
    savedAt: '2024.06.14 11:20',
    thumbnailSrc: myPageAssets.dashboardMap,
  },
]

const defaultInterestLocations: InterestLocation[] = [
  {
    id: 'interest-sangmu',
    station: '상무역',
    district: '서구 치평동',
    businessType: '카페/디저트',
    score: 92,
  },
  {
    id: 'interest-uncheon',
    station: '운천역',
    district: '서구 운천동',
    businessType: '음식점',
    score: 87,
  },
  {
    id: 'interest-baegun',
    station: '백운광장역',
    district: '남구 백운동',
    businessType: '카페/커피전문점',
    score: 84,
  },
]

const defaultNotifications: RecentNotification[] = [
  {
    id: 'opening-schedule',
    title: '개통 일정 업데이트',
    description: '광주 2호선 개통 일정이 변경되었습니다.',
    timeAgo: '1시간 전',
  },
  {
    id: 'new-recommendation',
    title: '새로운 추천 입지',
    description: '운천역 인근에 새로운 추천 입지가 도출되었습니다.',
    timeAgo: '3시간 전',
  },
  {
    id: 'sales-change',
    title: '매출 예측 변화',
    description: '상무역 주변 카페 업종의 매출 예측이 상향 조정되었습니다.',
    timeAgo: '1일 전',
  },
  {
    id: 'report-complete',
    title: '리포트 생성 완료',
    description: '상무역 상권 분석 리포트가 생성되었습니다.',
    timeAgo: '2일 전',
  },
]

const defaultActivities: ActivityItem[] = [
  {
    id: 'view-commercial-report',
    message: '상무역 상권 분석 리포트를 다시 확인했습니다.',
    createdAt: '2024.06.18 16:20',
  },
  {
    id: 'save-interest',
    message: '운천역을 관심 역세권에 저장했습니다.',
    createdAt: '2024.06.16 09:18',
  },
  {
    id: 'run-prediction',
    message: '쌍촌역 매출 예측 시뮬레이션을 실행했습니다.',
    createdAt: '2024.06.15 16:45',
  },
  {
    id: 'change-notification',
    message: '알림 설정을 변경했습니다.',
    createdAt: '2024.06.14 10:05',
  },
  {
    id: 'complete-onboarding',
    message: '온보딩 설정을 완료했습니다.',
    createdAt: '2024.06.13 18:30',
  },
]

const defaultNotificationSettings: NotificationSettings = {
  channels: {
    email: true,
    webPush: true,
    sms: false,
  },
  frequency: '실시간',
  quietHours: '22:00 ~ 08:00',
  enabledNotifications: [
    '개통 일정 업데이트',
    '새로운 추천 입지',
    '매출 예측 변화',
    '리포트 생성 완료',
  ],
}

const categoryByFilter: Record<
  Exclude<CategoryFilter, 'all'>,
  ReportCategory
> = {
  'commercial-analysis': '상권 분석',
  'ai-prediction': 'AI 예측',
  recommendation: '입지 추천',
}

const badgeClasses: Record<ReportCategory, string> = {
  '상권 분석': 'bg-emerald-50 text-emerald-600',
  'AI 예측': 'bg-blue-50 text-blue-600',
  '입지 추천': 'bg-violet-50 text-violet-600',
}

const notificationIcons = [Bell, Sparkles, TrendingUp, FileText] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function buildProfile(): UserProfile {
  const user = safeParseStorage<StoredUser>('metropick-user')
  const businessSetup = safeParseStorage<StoredBusinessSetup>(
    'metropick-onboarding-business-types',
  )
  const summary = safeParseStorage<StoredOnboardingSummary>(
    'metropick-onboarding-summary',
  )

  const businessTypes =
    user?.businessTypes?.join(', ') ??
    businessSetup?.selectedBusinessLabels?.join(', ') ??
    summary?.businessTypes?.selectedBusinessLabels?.join(', ')
  const preferredArea = summary?.stations?.selectedStations?.join(', ')

  return {
    name: user?.name ?? '홍길동',
    email: user?.email ?? 'honggildong@example.com',
    plan: user?.plan ?? '프로 플랜',
    role: user?.role ?? '상권 분석 전문가',
    preferredArea: user?.preferredArea ?? preferredArea ?? '광주광역시 전체',
    businessTypes: businessTypes ?? '카페, 음식점, 편의점',
  }
}

function normalizeInterestLocations(): InterestLocation[] {
  const stored = safeParseStorage<unknown[]>('metropick-saved-interest-locations')

  if (!stored?.length) {
    return defaultInterestLocations
  }

  const normalized = stored.flatMap((entry, index): InterestLocation[] => {
    if (!isRecord(entry)) {
      return []
    }

    const station = readString(entry.station)
    const district = readString(entry.district)
    const businessType = readString(entry.businessType)
    const score = readNumber(entry.score)

    if (!station || !district || !businessType || score === undefined) {
      return []
    }

    return [
      {
        id: readString(entry.id) ?? `stored-interest-${index}`,
        station,
        district,
        businessType,
        score,
        savedAt: readString(entry.savedAt),
      },
    ]
  })

  return normalized.length ? normalized : defaultInterestLocations
}

function normalizeCommercialReports(): SavedReport[] {
  const stored = safeParseStorage<StoredCommercialReport[]>(
    'metropick-saved-commercial-analysis-reports',
  )

  return (stored ?? []).flatMap((item, index): SavedReport[] => {
    const stationArea =
      item.stationArea ?? item.selectedStations?.join(', ') ?? '상권 분석'
    const businessType =
      item.businessType ?? item.selectedBusinessTypes?.[0] ?? '카페'

    if (!item.title && !stationArea) {
      return []
    }

    return [
      {
        id: item.id ?? `stored-commercial-${index}`,
        title: item.title ?? `${stationArea} 상권 분석 리포트`,
        category: '상권 분석',
        businessType,
        stationArea,
        savedAt: item.savedAt ?? item.createdAt ?? new Date().toISOString(),
        thumbnailSrc: myPageAssets.commercialMap,
      },
    ]
  })
}

function normalizePredictionReports(): SavedReport[] {
  const stored = safeParseStorage<StoredPredictionResult[]>(
    'metropick-ai-prediction-results',
  )

  return (stored ?? []).flatMap((item, index): SavedReport[] => {
    if (!item.stationArea && !item.businessType) {
      return []
    }

    const stationArea = item.stationArea ?? '선택 역세권'

    return [
      {
        id: item.id ?? `stored-ai-${index}`,
        title: `${stationArea} 매출 예측 리포트`,
        category: 'AI 예측',
        businessType: item.businessType ?? '카페',
        stationArea,
        savedAt: item.createdAt ?? new Date().toISOString(),
        thumbnailSrc: myPageAssets.aiPredictionChart,
      },
    ]
  })
}

function normalizeCurrentReport(): SavedReport[] {
  const report = safeParseStorage<StoredCurrentReport>('metropick-current-report')

  if (!report?.title && !report?.stationArea) {
    return []
  }

  return [
    {
      id: report.id ?? 'stored-current-report',
      title: report.title ?? `${report.stationArea ?? '백운광장역'} 미래 매출 예측 리포트`,
      category: 'AI 예측',
      businessType: report.businessType ?? '카페/커피전문점',
      stationArea: report.stationArea ?? '백운광장역 500m 상권',
      savedAt: report.createdAt ?? new Date().toISOString(),
      thumbnailSrc: myPageAssets.aiPredictionChart,
    },
  ]
}

function normalizeSelectedRecommendation(): SavedReport[] {
  const recommendation = safeParseStorage<StoredRecommendation>(
    'metropick-selected-recommendation',
  )

  if (!recommendation?.station) {
    return []
  }

  return [
    {
      id: `selected-recommendation-${recommendation.station}`,
      title: `${recommendation.station} 입지 추천 리포트`,
      category: '입지 추천',
      businessType: recommendation.businessType ?? '카페/디저트',
      stationArea: recommendation.station,
      savedAt: recommendation.createdAt ?? new Date().toISOString(),
      thumbnailSrc: myPageAssets.recommendationMap,
    },
  ]
}

function interestLocationsAsReports(locations: InterestLocation[]): SavedReport[] {
  return locations.map((item) => ({
    id: `interest-report-${item.id}`,
    title: `${item.station} 입지 추천 리포트`,
    category: '입지 추천',
    businessType: item.businessType,
    stationArea: item.station,
    savedAt: item.savedAt ?? new Date().toISOString(),
    thumbnailSrc: myPageAssets.recommendationMap,
  }))
}

function buildSavedReports(locations: InterestLocation[]): SavedReport[] {
  const byKey = new Map<string, SavedReport>()
  const reports = [
    ...defaultReports,
    ...normalizeCommercialReports(),
    ...normalizePredictionReports(),
    ...interestLocationsAsReports(locations),
    ...normalizeCurrentReport(),
    ...normalizeSelectedRecommendation(),
  ]

  reports.forEach((report) => {
    const key = report.id || `${report.title}-${report.savedAt}`
    if (!byKey.has(key)) {
      byKey.set(key, report)
    }
  })

  return Array.from(byKey.values())
}

function buildNotificationSettings(): NotificationSettings {
  const stored = safeParseStorage<unknown>('metropick-onboarding-notifications')

  if (!isRecord(stored)) {
    return defaultNotificationSettings
  }

  const channels = Array.isArray(stored.channels) ? stored.channels : []
  const storedChannels = isRecord(stored.channels) ? stored.channels : null
  const frequency = readString(stored.frequency)
  const enabledNotifications = Array.isArray(stored.enabledNotificationLabels)
    ? stored.enabledNotificationLabels.filter(
        (item): item is string => typeof item === 'string',
      )
    : defaultNotificationSettings.enabledNotifications

  return {
    channels: {
      email:
        storedChannels && typeof storedChannels.email === 'boolean'
          ? storedChannels.email
          : channels.includes('email') || defaultNotificationSettings.channels.email,
      sms:
        storedChannels && typeof storedChannels.sms === 'boolean'
          ? storedChannels.sms
          : channels.includes('sms') || defaultNotificationSettings.channels.sms,
      webPush:
        storedChannels && typeof storedChannels.webPush === 'boolean'
          ? storedChannels.webPush
          : channels.includes('web-push') ||
            defaultNotificationSettings.channels.webPush,
    },
    frequency:
      frequency === '매일' || frequency === '매주' || frequency === '실시간'
        ? frequency
        : defaultNotificationSettings.frequency,
    quietHours:
      readString(stored.quietHours) ?? defaultNotificationSettings.quietHours,
    enabledNotifications,
  }
}

function buildActivities(): ActivityItem[] {
  const summary = safeParseStorage<StoredOnboardingSummary>(
    'metropick-onboarding-summary',
  )

  if (!summary?.completedAt) {
    return defaultActivities
  }

  const hasOnboardingActivity = defaultActivities.some((item) =>
    item.message.includes('온보딩 설정을 완료했습니다.'),
  )

  return hasOnboardingActivity
    ? defaultActivities
    : [
        ...defaultActivities,
        {
          id: 'stored-onboarding-complete',
          message: '온보딩 설정을 완료했습니다.',
          createdAt: summary.completedAt,
        },
      ]
}

function toComparableDate(value: string): number {
  const normalized = value.replaceAll('.', '-')
  const parsed = Date.parse(normalized)
  return Number.isNaN(parsed) ? 0 : parsed
}

function getReportRoute(category: ReportCategory): string {
  if (category === '상권 분석') {
    return '/commercial-analysis'
  }

  if (category === 'AI 예측') {
    return '/ai-prediction'
  }

  return '/recommendation'
}

function ProfileCard({ profile }: { profile: UserProfile }) {
  return (
    <section className="rounded-[15px] border border-blue-100 bg-white/95 px-7 py-7 shadow-[0_10px_30px_rgba(20,55,90,0.05)] max-sm:px-5">
      <div className="mb-5 flex items-center gap-4">
        <div className="relative grid h-[68px] w-[68px] shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-blue-300">
          <CircleUserRound
            aria-hidden="true"
            className="text-blue-600"
            fill="rgba(37,99,235,0.15)"
            size={58}
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h3 className="m-0 text-[22px] font-black tracking-[-0.3px]">
              {profile.name}
            </h3>
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-black text-blue-600">
              {profile.plan}
            </span>
          </div>
          <p className="m-0 mt-2 truncate text-[14px] font-semibold text-slate-500">
            {profile.email}
          </p>
        </div>
      </div>

      <dl className="grid gap-4">
        <div className="grid grid-cols-[96px_1fr] items-center">
          <dt className="text-[14px] font-extrabold text-slate-500">역할</dt>
          <dd className="m-0 text-[14px] font-extrabold text-slate-900">
            {profile.role}
          </dd>
        </div>
        <div className="grid grid-cols-[96px_1fr] items-center">
          <dt className="text-[14px] font-extrabold text-slate-500">관심 지역</dt>
          <dd className="m-0 text-[14px] font-extrabold text-slate-900">
            {profile.preferredArea}
          </dd>
        </div>
        <div className="grid grid-cols-[96px_1fr] items-center">
          <dt className="text-[14px] font-extrabold text-slate-500">관심 업종</dt>
          <dd className="m-0 text-[14px] font-extrabold text-slate-900">
            {profile.businessTypes}
          </dd>
        </div>
      </dl>

      <button className="mt-6 flex h-12 w-full items-center gap-3 rounded-[10px] border-none bg-slate-100 px-4 text-[15px] font-black text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
        <UserCog aria-hidden="true" className="text-slate-700" size={20} />
        계정 설정
        <span className="ml-auto text-2xl">›</span>
      </button>
    </section>
  )
}

function AlertCard({ notifications }: { notifications: RecentNotification[] }) {
  return (
    <section className="rounded-[15px] border border-blue-100 bg-white/95 px-5 py-5 shadow-[0_10px_30px_rgba(20,55,90,0.05)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="m-0 text-lg font-black">최근 알림</h3>
        <button className="text-sm font-black text-blue-600" type="button">
          모두 보기 ›
        </button>
      </div>

      <div className="grid gap-3.5">
        {notifications.map((item, index) => {
          const Icon = notificationIcons[index] ?? Bell
          const tones = [
            'bg-blue-50 text-blue-600',
            'bg-emerald-50 text-emerald-600',
            'bg-violet-50 text-violet-600',
            'bg-sky-50 text-sky-600',
          ]

          return (
            <article
              className="grid grid-cols-[30px_minmax(0,1fr)_58px] items-start gap-3"
              key={item.id}
            >
              <div
                className={`grid h-7 w-7 place-items-center rounded-[9px] ${
                  tones[index] ?? tones[0]
                }`}
              >
                <Icon aria-hidden="true" size={15} />
              </div>
              <div className="min-w-0">
                <strong className="block text-sm font-black text-slate-900">
                  {item.title}
                </strong>
                <p className="m-0 mt-1 text-xs leading-snug font-bold text-slate-500">
                  {item.description}
                </p>
              </div>
              <time className="text-right text-xs font-bold text-slate-500">
                {item.timeAgo}
              </time>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ReportThumbnail({ report }: { report: SavedReport }) {
  return (
    <div className="h-[76px] w-[120px] overflow-hidden rounded-[9px] border border-blue-50 bg-slate-100 max-[1400px]:w-[140px] max-lg:h-[150px] max-lg:w-full">
      <img
        alt={`${report.title} 썸네일`}
        className="h-full w-full object-cover"
        draggable={false}
        src={report.thumbnailSrc}
      />
    </div>
  )
}

function ReportItem({
  onOpen,
  onShare,
  report,
}: {
  onOpen: (report: SavedReport) => void
  onShare: (report: SavedReport) => void
  report: SavedReport
}) {
  return (
    <article className="grid min-h-[108px] grid-cols-[120px_minmax(165px,1fr)_88px_minmax(236px,auto)] items-center gap-4 rounded-[13px] border border-blue-100 bg-white px-3.5 py-2.5 shadow-[0_8px_22px_rgba(20,55,90,0.04)] max-[1400px]:grid-cols-[130px_minmax(0,1fr)] max-lg:grid-cols-1">
      <ReportThumbnail report={report} />

      <div className="min-w-0">
        <h3 className="m-0 mb-2 text-[17px] font-black text-slate-900">
          {report.title}
        </h3>
        <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-slate-500">
          <span>업종</span>
          <strong className="text-slate-900">{report.businessType}</strong>
          <span>역세권</span>
          <strong className="text-slate-900">{report.stationArea}</strong>
        </div>
        <p className="m-0 text-sm font-bold text-slate-500">
          저장일 <strong className="text-slate-900">{report.savedAt}</strong>
        </p>
      </div>

      <span
        className={`justify-self-start rounded-md px-3 py-2 text-[13px] font-black ${
          badgeClasses[report.category]
        } max-[1400px]:col-start-2 max-lg:col-auto`}
      >
        {report.category}
      </span>

      <div className="flex min-w-0 items-center justify-end gap-2 max-[1400px]:col-start-2 max-[1400px]:justify-start max-lg:col-auto max-lg:flex-wrap">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 max-sm:flex-1 max-sm:justify-center"
          onClick={() => onOpen(report)}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={16} />
          다시 보기
        </button>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 max-sm:flex-1 max-sm:justify-center"
          onClick={() => onShare(report)}
          type="button"
        >
          <Share2 aria-hidden="true" size={16} />
          공유
        </button>
        <button
          aria-label={`${report.title} 더보기`}
          className="grid h-10 w-10 place-items-center rounded-lg border-none bg-white text-slate-800"
          type="button"
        >
          <MoreVertical aria-hidden="true" size={20} />
        </button>
      </div>
    </article>
  )
}

function ReportsTab({
  activeFilter,
  onFilterChange,
  onOpen,
  onSearchChange,
  onShare,
  onSortChange,
  reports,
  searchQuery,
  sortOrder,
}: {
  activeFilter: CategoryFilter
  onFilterChange: (filter: CategoryFilter) => void
  onOpen: (report: SavedReport) => void
  onSearchChange: (value: string) => void
  onShare: (report: SavedReport) => void
  onSortChange: (value: SortOrder) => void
  reports: SavedReport[]
  searchQuery: string
  sortOrder: SortOrder
}) {
  const visibleReports = reports.slice(0, reportsPerPage)

  return (
    <>
      <div className="flex items-center justify-between gap-5 px-5 py-3 max-[1740px]:flex-col max-[1740px]:items-stretch">
        <div className="flex flex-wrap items-center gap-3">
          {categoryFilters.map((filter) => (
            <button
              aria-pressed={activeFilter === filter.id}
              className={`h-[38px] rounded-[9px] px-3 text-sm font-black ${
                activeFilter === filter.id
                  ? 'bg-blue-50 text-slate-900'
                  : 'bg-transparent text-slate-500'
              }`}
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              type="button"
            >
              {filter.label}
              <span className="ml-2 text-blue-600">{filter.count}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 max-md:flex-col max-md:items-stretch">
          <label className="flex h-10 w-[260px] items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 max-md:w-full">
            <Search aria-hidden="true" className="text-slate-400" size={16} />
            <input
              className="w-full border-none bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="리포트 제목, 역세권, 업종 검색"
              value={searchQuery}
            />
          </label>
          <label className="sr-only" htmlFor="mypage-sort-order">
            정렬
          </label>
          <select
            className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-black text-slate-700"
            id="mypage-sort-order"
            onChange={(event) => onSortChange(event.target.value as SortOrder)}
            value={sortOrder}
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2 px-5 pb-2">
        {visibleReports.length ? (
          visibleReports.map((report) => (
            <ReportItem
              key={report.id}
              onOpen={onOpen}
              onShare={onShare}
              report={report}
            />
          ))
        ) : (
          <div className="grid min-h-[260px] place-items-center rounded-xl border border-dashed border-blue-100 bg-slate-50 text-sm font-black text-slate-500">
            검색 조건에 맞는 리포트가 없습니다.
          </div>
        )}
      </div>

      <div className="flex h-12 items-center justify-center gap-4">
        <button className="h-8 w-8 rounded-md text-slate-700" type="button">
          ‹
        </button>
        <button className="h-8 w-8 rounded-md bg-blue-600 text-sm font-black text-white" type="button">
          1
        </button>
        <button className="h-8 w-8 rounded-md text-sm font-black text-slate-700" type="button">
          2
        </button>
        <button className="h-8 w-8 rounded-md text-sm font-black text-slate-700" type="button">
          3
        </button>
        <button className="h-8 w-8 rounded-md text-slate-700" type="button">
          ›
        </button>
      </div>
    </>
  )
}

function InterestLocationsTab({
  locations,
  onDelete,
  onView,
}: {
  locations: InterestLocation[]
  onDelete: (location: InterestLocation) => void
  onView: () => void
}) {
  return (
    <div className="grid gap-3 px-5 py-5">
      {locations.map((location) => (
        <article
          className="grid grid-cols-[1fr_120px_220px] items-center gap-4 rounded-[13px] border border-blue-100 bg-white p-5 max-lg:grid-cols-1"
          key={location.id}
        >
          <div>
            <h3 className="m-0 text-xl font-black text-slate-900">
              {location.station}
            </h3>
            <p className="m-0 mt-2 text-sm font-bold text-slate-500">
              {location.district} · {location.businessType}
            </p>
          </div>
          <div className="text-center max-lg:text-left">
            <span className="block text-xs font-black text-slate-500">AI 점수</span>
            <strong className="text-2xl font-black text-blue-600">
              {location.score}
            </strong>
          </div>
          <div className="flex justify-end gap-2 max-lg:justify-start">
            <button
              className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-black text-white"
              onClick={onView}
              type="button"
            >
              분석 보기
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700"
              onClick={() => onDelete(location)}
              type="button"
            >
              <Trash2 aria-hidden="true" size={16} />
              삭제
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function NotificationsTab({
  onChange,
  onSave,
  settings,
}: {
  onChange: (settings: NotificationSettings) => void
  onSave: () => void
  settings: NotificationSettings
}) {
  const toggleChannel = (channel: keyof NotificationSettings['channels']) => {
    onChange({
      ...settings,
      channels: {
        ...settings.channels,
        [channel]: !settings.channels[channel],
      },
    })
  }

  return (
    <div className="grid gap-5 px-5 py-5">
      <section className="rounded-xl border border-blue-100 bg-white p-5">
        <h3 className="m-0 mb-4 text-lg font-black">알림 방식</h3>
        <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
          {[
            { id: 'email', label: '이메일', icon: Mail },
            { id: 'webPush', label: '웹 푸시', icon: BellRing },
            { id: 'sms', label: '문자', icon: MessageSquare },
          ].map((item) => {
            const Icon = item.icon
            const key = item.id as keyof NotificationSettings['channels']

            return (
              <button
                aria-pressed={settings.channels[key]}
                className={`flex h-14 items-center justify-center gap-2 rounded-lg border text-sm font-black ${
                  settings.channels[key]
                    ? 'border-blue-200 bg-blue-50 text-blue-600'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
                key={item.id}
                onClick={() => toggleChannel(key)}
                type="button"
              >
                <Icon aria-hidden="true" size={18} />
                {item.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-xl border border-blue-100 bg-white p-5">
        <h3 className="m-0 mb-4 text-lg font-black">알림 빈도</h3>
        <div className="flex flex-wrap gap-2">
          {(['실시간', '매일', '매주'] as NotificationFrequency[]).map((frequency) => (
            <button
              aria-pressed={settings.frequency === frequency}
              className={`h-10 rounded-lg px-5 text-sm font-black ${
                settings.frequency === frequency
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
              key={frequency}
              onClick={() => onChange({ ...settings, frequency })}
              type="button"
            >
              {frequency}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 rounded-xl border border-blue-100 bg-white p-5">
        <h3 className="m-0 text-lg font-black">방해 금지 시간</h3>
        <p className="m-0 text-sm font-bold text-slate-500">{settings.quietHours}</p>
      </section>

      <section className="rounded-xl border border-blue-100 bg-white p-5">
        <h3 className="m-0 mb-4 text-lg font-black">활성화 알림 목록</h3>
        <div className="grid gap-2">
          {settings.enabledNotifications.map((item) => (
            <p
              className="m-0 flex items-center gap-2 text-sm font-bold text-slate-600"
              key={item}
            >
              <CheckCircle2 aria-hidden="true" className="text-emerald-600" size={17} />
              {item}
            </p>
          ))}
        </div>
      </section>

      <button
        className="h-12 justify-self-start rounded-lg bg-blue-600 px-6 text-sm font-black text-white"
        onClick={onSave}
        type="button"
      >
        알림 설정 저장
      </button>
    </div>
  )
}

function ActivityTab({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="grid gap-3 px-5 py-5">
      {activities.map((item) => (
        <article
          className="flex items-start gap-4 rounded-xl border border-blue-100 bg-white p-5"
          key={item.id}
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
            <CalendarClock aria-hidden="true" size={20} />
          </div>
          <div>
            <p className="m-0 text-base font-black text-slate-900">{item.message}</p>
            <time className="mt-1 block text-sm font-bold text-slate-500">
              {item.createdAt}
            </time>
          </div>
        </article>
      ))}
    </div>
  )
}

function ReportPanel({
  activeFilter,
  activeTab,
  activities,
  filteredReports,
  interestLocations,
  notificationSettings,
  onDeleteInterest,
  onFilterChange,
  onOpenReport,
  onSaveNotifications,
  onSearchChange,
  onSetNotificationSettings,
  onShareReport,
  onSortChange,
  onTabChange,
  onViewInterest,
  searchQuery,
  sortOrder,
}: {
  activeFilter: CategoryFilter
  activeTab: MyPageTab
  activities: ActivityItem[]
  filteredReports: SavedReport[]
  interestLocations: InterestLocation[]
  notificationSettings: NotificationSettings
  onDeleteInterest: (location: InterestLocation) => void
  onFilterChange: (filter: CategoryFilter) => void
  onOpenReport: (report: SavedReport) => void
  onSaveNotifications: () => void
  onSearchChange: (value: string) => void
  onSetNotificationSettings: (settings: NotificationSettings) => void
  onShareReport: (report: SavedReport) => void
  onSortChange: (value: SortOrder) => void
  onTabChange: (tab: MyPageTab) => void
  onViewInterest: () => void
  searchQuery: string
  sortOrder: SortOrder
}) {
  return (
    <section className="min-h-[642px] overflow-hidden rounded-[15px] border border-blue-100 bg-white/95 shadow-[0_10px_30px_rgba(20,55,90,0.05)]">
      <nav
        aria-label="마이페이지 탭"
        className="flex h-[60px] items-center gap-[54px] overflow-x-auto border-b border-blue-100 px-7 max-md:gap-8 max-md:px-5"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            aria-selected={activeTab === tab.id}
            className={`relative h-[60px] shrink-0 text-base font-black ${
              activeTab === tab.id
                ? 'text-blue-600 after:absolute after:right-0 after:bottom-[-1px] after:left-0 after:h-1 after:rounded-full after:bg-blue-600'
                : 'text-slate-500'
            }`}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'reports' ? (
        <ReportsTab
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          onOpen={onOpenReport}
          onSearchChange={onSearchChange}
          onShare={onShareReport}
          onSortChange={onSortChange}
          reports={filteredReports}
          searchQuery={searchQuery}
          sortOrder={sortOrder}
        />
      ) : null}

      {activeTab === 'interest-locations' ? (
        <InterestLocationsTab
          locations={interestLocations}
          onDelete={onDeleteInterest}
          onView={onViewInterest}
        />
      ) : null}

      {activeTab === 'notifications' ? (
        <NotificationsTab
          onChange={onSetNotificationSettings}
          onSave={onSaveNotifications}
          settings={notificationSettings}
        />
      ) : null}

      {activeTab === 'activity' ? <ActivityTab activities={activities} /> : null}
    </section>
  )
}

function UpgradeBanner() {
  return (
    <section className="mt-4 grid min-h-[82px] grid-cols-[58px_1fr_285px] items-center gap-5 rounded-xl bg-[linear-gradient(100deg,#031b42_0%,#004f7a_65%,#00a7a7_100%)] px-7 py-3 text-white shadow-[0_14px_30px_rgba(3,27,66,0.22)] max-lg:grid-cols-1 max-lg:text-center">
      <div className="grid h-[50px] w-[50px] place-items-center rounded-full border border-cyan-400 bg-cyan-400/10 text-cyan-300 max-lg:mx-auto">
        <ChartNoAxesCombined aria-hidden="true" size={28} />
      </div>
      <div>
        <h3 className="m-0 mb-1.5 text-[21px] font-black">
          더 많은 인사이트를 원하시나요?
        </h3>
        <p className="m-0 text-sm font-bold text-white/80">
          프로 플랜에서는 리포트 저장 무제한, 고급 분석, 데이터 다운로드 기능을 제공합니다.
        </p>
      </div>
      <button className="h-11 rounded-lg bg-white text-[16px] font-black text-slate-900" type="button">
        프로 플랜 업그레이드 →
      </button>
    </section>
  )
}

function Footer() {
  return (
    <footer className="grid min-h-[104px] grid-cols-[290px_1fr_420px_170px] items-center gap-10 bg-[linear-gradient(90deg,#071e45_0%,#03152f_52%,#06204a_100%)] px-16 py-4 text-white max-2xl:grid-cols-2 max-lg:grid-cols-1 max-lg:text-center max-md:px-5">
      <div>
        <div className="flex items-center gap-3 max-lg:justify-center">
          <img
            alt="MetroPick AI 로고"
            className="h-8 w-9 object-contain"
            draggable={false}
            src={landingAssets.logo}
          />
          <strong className="text-xl font-black">MetroPick AI</strong>
        </div>
        <p className="m-0 mt-2 text-xs font-semibold text-white/70">
          광주 2호선 개통에 따른 AI 상권 변화 예측 서비스
        </p>
      </div>

      <nav className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-white/70">
        {['서비스 소개', '이용약관', '개인정보처리방침', '데이터 출처', '문의하기'].map(
          (item) => (
            <a href="/" key={item}>
              {item}
            </a>
          ),
        )}
      </nav>

      <div className="text-sm font-bold leading-6 text-white/70 max-lg:justify-self-center">
        <p className="m-0">(주)메트로픽스 ㅣ 대표이사: 김지훈</p>
        <p className="m-0">광주광역시 동구 금남로 193-22, 4층</p>
        <p className="m-0">사업자 등록번호: 123-45-67890 ㅣ 062-123-4567</p>
      </div>

      <div className="flex justify-end gap-4 max-lg:justify-center">
        {['f', 'N', '▶'].map((label) => (
          <button
            aria-label={`${label} 소셜 링크`}
            className="h-[42px] w-[42px] rounded-full border border-white/30 bg-white/5 font-black"
            key={label}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </footer>
  )
}

export function MyPage() {
  const navigate = useNavigate()
  const [profile] = useState<UserProfile>(() => buildProfile())
  const [interestLocations, setInterestLocations] = useState<InterestLocation[]>(() =>
    normalizeInterestLocations(),
  )
  const [activeTab, setActiveTab] = useState<MyPageTab>('reports')
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest')
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(() => buildNotificationSettings())
  const [message, setMessage] = useState('')
  const activities = useMemo(() => buildActivities(), [])
  const savedReports = useMemo(
    () => buildSavedReports(interestLocations),
    [interestLocations],
  )

  useEffect(() => {
    safeParseStorage<boolean>('metropick-authenticated')
  }, [])

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('ko-KR')

    return savedReports
      .filter((report) => {
        if (activeFilter === 'all') {
          return true
        }

        return report.category === categoryByFilter[activeFilter]
      })
      .filter((report) => {
        if (!query) {
          return true
        }

        return [
          report.title,
          report.stationArea,
          report.businessType,
          report.category,
        ].some((field) => field.toLocaleLowerCase('ko-KR').includes(query))
      })
      .sort((a, b) => {
        const diff = toComparableDate(b.savedAt) - toComparableDate(a.savedAt)
        return sortOrder === 'latest' ? diff : -diff
      })
  }, [activeFilter, savedReports, searchQuery, sortOrder])

  const showMessage = (nextMessage: string) => {
    setMessage(nextMessage)
  }

  const handleOpenReport = (report: SavedReport) => {
    navigate(getReportRoute(report.category))
  }

  const handleShareReport = async (report: SavedReport) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${window.location.origin}/report#${report.id}`)
      }
    } catch {
      // Clipboard can be unavailable in browsers without permission or in test runners.
    }

    showMessage('리포트 링크가 복사되었습니다.')
  }

  const handleDeleteInterest = (location: InterestLocation) => {
    const nextLocations = interestLocations.filter((item) => item.id !== location.id)
    setInterestLocations(nextLocations)
    writeStorage('metropick-saved-interest-locations', nextLocations)
    showMessage('관심 역세권에서 삭제되었습니다.')
  }

  const handleSaveNotifications = () => {
    writeStorage('metropick-onboarding-notifications', {
      channels: notificationSettings.channels,
      channelLabels: [
        notificationSettings.channels.email ? '이메일' : null,
        notificationSettings.channels.webPush ? '웹 푸시' : null,
        notificationSettings.channels.sms ? '문자' : null,
      ].filter((item): item is string => Boolean(item)),
      enabledNotificationLabels: notificationSettings.enabledNotifications,
      frequency: notificationSettings.frequency,
      quietHours: notificationSettings.quietHours,
      savedAt: new Date().toISOString(),
    })
    showMessage('알림 설정이 저장되었습니다.')
  }

  return (
    <div className="mypage-page min-h-screen bg-slate-50 text-slate-900">
      <TopNavigation
        renderActions={() => (
          <>
            <Link
              className="inline-flex h-12 min-w-[132px] items-center justify-center gap-2 rounded-lg border border-white/45 bg-slate-950/35 px-5 text-sm font-black text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              to="/mypage"
            >
              {profile.name}님
              <ChevronDown aria-hidden="true" size={17} />
            </Link>
            <Link
              className="inline-flex h-12 min-w-[170px] items-center justify-center rounded-lg bg-[#086bff] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(0,102,255,0.26)] transition hover:bg-[#0054dc] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              to="/signup"
            >
              무료로 시작하기
            </Link>
          </>
        )}
        sticky
      />

      <div className="grid min-h-[calc(100vh-var(--app-topbar-height))] grid-cols-[252px_minmax(0,1fr)] max-[1121px]:grid-cols-1">
        <AppSidebar activeHref="/mypage" ariaLabel="마이페이지 사이드 메뉴" />

        <main className="min-w-0 px-[58px] pt-7 pb-4 max-2xl:px-8 max-md:px-4">
          <div className="mb-4">
            <h1 className="m-0 mb-2 text-[31px] font-black tracking-[-0.8px]">
              마이페이지
            </h1>
            <p className="m-0 text-base font-bold text-slate-500">
              저장한 리포트와 알림, 계정 정보를 관리하세요.
            </p>
          </div>

          <div className="grid grid-cols-[380px_minmax(0,1fr)] gap-7 max-[1740px]:grid-cols-[340px_minmax(0,1fr)] max-xl:grid-cols-1">
            <div className="grid content-start gap-5">
              <ProfileCard profile={profile} />
              <AlertCard notifications={defaultNotifications} />
            </div>

            <ReportPanel
              activeFilter={activeFilter}
              activeTab={activeTab}
              activities={activities}
              filteredReports={filteredReports}
              interestLocations={interestLocations}
              notificationSettings={notificationSettings}
              onDeleteInterest={handleDeleteInterest}
              onFilterChange={setActiveFilter}
              onOpenReport={handleOpenReport}
              onSaveNotifications={handleSaveNotifications}
              onSearchChange={setSearchQuery}
              onSetNotificationSettings={setNotificationSettings}
              onShareReport={handleShareReport}
              onSortChange={setSortOrder}
              onTabChange={setActiveTab}
              onViewInterest={() => navigate('/recommendation')}
              searchQuery={searchQuery}
              sortOrder={sortOrder}
            />
          </div>

          <UpgradeBanner />
        </main>
      </div>

      <Footer />

      {message ? (
        <div
          className="fixed right-5 bottom-5 z-50 rounded-lg border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-lg"
          role="status"
        >
          <Zap aria-hidden="true" className="mr-2 inline" size={16} />
          {message}
        </div>
      ) : null}
    </div>
  )
}

export default MyPage
