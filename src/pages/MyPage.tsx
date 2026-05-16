import { useMemo, useState } from 'react'
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
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import type {
  BackendNotificationSetting,
  BackendNotificationSettingsCreateInput,
} from '@/shared/api/backendNotificationSettingsApi'
import type { BackendOnboardingSetting } from '@/shared/api/backendOnboardingSettingsApi'
import type { BackendSavedLocation } from '@/shared/api/backendSavedLocationsApi'
import type {
  BackendSavedReport,
  BackendSavedReportPayload,
} from '@/shared/api/backendSavedReportsApi'
import type { BackendPredictionResult } from '@/shared/api/backendPredictionResultsApi'
import {
  useBackendNotificationSettings,
  useCreateBackendNotificationSettings,
  useUpdateBackendNotificationSettings,
} from '@/shared/api/hooks/useBackendNotificationSettings'
import { useBackendOnboardingSettings } from '@/shared/api/hooks/useBackendOnboardingSettings'
import { useBackendPredictionResults } from '@/shared/api/hooks/useBackendPredictionResults'
import {
  useBackendSavedLocations,
  useDeleteBackendSavedLocation,
} from '@/shared/api/hooks/useBackendSavedLocations'
import {
  useBackendSavedReports,
  useDeleteBackendSavedReport,
  useUpdateBackendSavedReport,
} from '@/shared/api/hooks/useBackendSavedReports'
import { AppFooter } from '@/shared/components/AppFooter'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { BackendStatusBadge } from '@/shared/components/BackendStatusBadge'
import { ImageWithFallback } from '@/shared/components/ImageWithFallback'
import { TopNavigation } from '@/shared/components/TopNavigation'
import { myPageAssets } from '@/shared/assets/myPageAssets'
import { clearAuthUser } from '@/shared/auth/authStorage'
import { signOut } from '@/shared/auth/supabaseAuth'
import { safeParseStorage, writeStorage } from '@/shared/lib/storage'

type MyPageTab = 'reports' | 'interest-locations' | 'notifications' | 'activity'

type ReportCategory = '상권 분석' | 'AI 예측' | '입지 추천'

type SavedReport = {
  businessType: string
  category: ReportCategory
  description?: string
  id: string
  payload?: BackendSavedReportPayload
  predictedScore?: number
  reportType?: string
  savedAt: string
  source?: 'backend-saved-report' | 'local-report'
  summary?: string
  stationArea: string
  tags?: string[]
  thumbnailSrc: string
  title: string
}

type SavedReportEditInput = {
  description: string
  tags: string[]
}

type InterestLocation = {
  businessType: string
  district: string
  id: string
  reason?: string
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

type BackendReportStatus = 'connected' | 'fallback'

type NotificationSettingsStatus = BackendReportStatus

type OnboardingSettingsStatus = BackendReportStatus

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
  description?: string
  id?: string
  savedAt?: string
  selectedBusinessTypes?: string[]
  selectedStations?: string[]
  stationArea?: string
  tags?: string[]
  title?: string
}

type StoredPredictionResult = {
  businessType?: string
  backendStartupSuitability?: {
    predicted_score?: number
    recommendation_label?: string
  }
  createdAt?: string
  id?: string
  predicted_score?: number
  recommendation_label?: string
  riskLevel?: string
  stationArea?: string
}

const tabs: Array<{ id: MyPageTab; label: string }> = [
  { id: 'reports', label: '저장한 리포트' },
  { id: 'interest-locations', label: '관심 역세권' },
  { id: 'notifications', label: '알림 설정' },
  { id: 'activity', label: '최근 활동' },
]

function isMyPageTab(value: string | null): value is MyPageTab {
  return tabs.some((tab) => tab.id === value)
}

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
const SAVED_REPORT_EDITS_KEY = 'metropick-saved-report-edits'
const DELETED_SAVED_REPORT_IDS_KEY = 'metropick-deleted-saved-report-ids'
const COMMERCIAL_REPORTS_STORAGE_KEY = 'metropick-saved-commercial-analysis-reports'

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

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      )
    : []
}

function readTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return readStringArray(value).map((item) => item.trim())
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function parseTagsInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
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

function buildBackendProfile(
  localProfile: UserProfile,
  setting: BackendOnboardingSetting | undefined,
): UserProfile {
  if (!setting) {
    return localProfile
  }

  const selectedStations = readStringArray(setting.selected_stations)
  const selectedBusinessTypes = readStringArray(setting.selected_business_types)

  return {
    ...localProfile,
    preferredArea:
      readString(setting.region) ??
      (selectedStations.length ? selectedStations.join(', ') : localProfile.preferredArea),
    businessTypes: selectedBusinessTypes.length
      ? selectedBusinessTypes.join(', ')
      : localProfile.businessTypes,
  }
}

function getCreatedTime(value: string | null | undefined): number {
  const time = Date.parse(value ?? '')
  return Number.isFinite(time) ? time : 0
}

function selectLatestBackendOnboardingSetting(
  settings: BackendOnboardingSetting[] | undefined,
): BackendOnboardingSetting | undefined {
  if (!settings?.length) {
    return undefined
  }

  return [...settings].sort(
    (current, next) =>
      getCreatedTime(next.created_at) - getCreatedTime(current.created_at),
  )[0]
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
        reason: readString(entry.reason),
        savedAt: readString(entry.savedAt),
      },
    ]
  })

  return normalized.length ? normalized : defaultInterestLocations
}

function normalizeCommercialReports(): SavedReport[] {
  const stored = safeParseStorage<StoredCommercialReport[]>(
    COMMERCIAL_REPORTS_STORAGE_KEY,
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
        description: readString(item.description),
        stationArea,
        savedAt: item.savedAt ?? item.createdAt ?? new Date().toISOString(),
        source: 'local-report',
        tags: readTags(item.tags),
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
        predictedScore:
          item.predicted_score ?? item.backendStartupSuitability?.predicted_score,
        summary:
          item.recommendation_label ??
          item.backendStartupSuitability?.recommendation_label ??
          (item.riskLevel ? `위험 수준 ${item.riskLevel}` : undefined),
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

function buildSavedReports(
  locations: InterestLocation[],
  predictionReports = normalizePredictionReports(),
): SavedReport[] {
  const reports = [
    ...defaultReports,
    ...normalizeCommercialReports(),
    ...predictionReports,
    ...interestLocationsAsReports(locations),
    ...normalizeCurrentReport(),
    ...normalizeSelectedRecommendation(),
  ]

  return mergeSavedReports(reports)
}

function mergeSavedReports(reports: SavedReport[]): SavedReport[] {
  const byKey = new Map<string, SavedReport>()

  reports.forEach((report) => {
    const key = report.id || `${report.title}-${report.savedAt}`
    if (!byKey.has(key)) {
      byKey.set(key, report)
    }
  })

  return applySavedReportLocalState(Array.from(byKey.values()))
}

function getSavedReportEdits(): Record<string, SavedReportEditInput> {
  const stored = safeParseStorage<Record<string, unknown>>(SAVED_REPORT_EDITS_KEY)

  if (!isRecord(stored)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(stored).flatMap(([id, value]) => {
      if (!isRecord(value)) {
        return []
      }

      return [
        [
          id,
          {
            description: readString(value.description) ?? '',
            tags: readTags(value.tags),
          },
        ],
      ]
    }),
  )
}

function writeSavedReportEdits(edits: Record<string, SavedReportEditInput>): void {
  writeStorage(SAVED_REPORT_EDITS_KEY, edits)
}

function getDeletedSavedReportIds(): string[] {
  return readStringArray(safeParseStorage<unknown>(DELETED_SAVED_REPORT_IDS_KEY))
}

function writeDeletedSavedReportIds(ids: string[]): void {
  writeStorage(DELETED_SAVED_REPORT_IDS_KEY, Array.from(new Set(ids)))
}

function applySavedReportLocalState(reports: SavedReport[]): SavedReport[] {
  const edits = getSavedReportEdits()
  const deletedIds = getDeletedSavedReportIds()

  return reports
    .filter((report) => !deletedIds.includes(report.id))
    .map((report) => {
      const edit = edits[report.id]
      if (!edit) {
        return report
      }

      return {
        ...report,
        description: edit.description,
        tags: edit.tags,
      }
    })
}

function updateSavedReportLocalEdit(
  report: SavedReport,
  input: SavedReportEditInput,
): void {
  const edits = getSavedReportEdits()
  writeSavedReportEdits({
    ...edits,
    [report.id]: input,
  })

  const commercialReports = safeParseStorage<StoredCommercialReport[]>(
    COMMERCIAL_REPORTS_STORAGE_KEY,
  )
  if (!commercialReports?.length) {
    return
  }

  const nextReports = commercialReports.map((item, index) => {
    const id = item.id ?? `stored-commercial-${index}`
    if (id !== report.id) {
      return item
    }

    return {
      ...item,
      description: input.description,
      tags: input.tags,
    }
  })
  writeStorage(COMMERCIAL_REPORTS_STORAGE_KEY, nextReports)
}

function removeSavedReportLocalEdit(report: SavedReport): void {
  const edits = getSavedReportEdits()
  delete edits[report.id]
  writeSavedReportEdits(edits)
}

function deleteSavedReportFromLocalStorage(report: SavedReport): void {
  removeSavedReportLocalEdit(report)

  const commercialReports = safeParseStorage<StoredCommercialReport[]>(
    COMMERCIAL_REPORTS_STORAGE_KEY,
  )
  const nextCommercialReports = commercialReports?.filter((item, index) => {
    const id = item.id ?? `stored-commercial-${index}`
    return id !== report.id
  })

  if (nextCommercialReports && nextCommercialReports.length !== commercialReports?.length) {
    writeStorage(COMMERCIAL_REPORTS_STORAGE_KEY, nextCommercialReports)
    return
  }

  writeDeletedSavedReportIds([...getDeletedSavedReportIds(), report.id])
}

function readPayloadString(
  payload: Record<string, unknown> | undefined,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = readString(payload?.[key])
    if (value) {
      return value
    }
  }

  return undefined
}

function resolveBackendReportCategory(
  reportType: string | undefined,
  title: string,
): ReportCategory {
  const normalizedType = reportType
    ?.trim()
    .toLocaleLowerCase('en-US')
    .replaceAll('-', '_')

  if (
    normalizedType?.includes('ai') ||
    normalizedType?.includes('prediction') ||
    title.includes('예측')
  ) {
    return 'AI 예측'
  }

  if (
    normalizedType?.includes('recommendation') ||
    normalizedType?.includes('location') ||
    title.includes('추천') ||
    title.includes('입지')
  ) {
    return '입지 추천'
  }

  return '상권 분석'
}

function getReportThumbnailSrc(category: ReportCategory): string {
  if (category === 'AI 예측') {
    return myPageAssets.aiPredictionChart
  }

  if (category === '입지 추천') {
    return myPageAssets.recommendationMap
  }

  return myPageAssets.commercialMap
}

function normalizeBackendSavedReports(
  reports: BackendSavedReport[],
): SavedReport[] {
  return reports.map((report, index) => {
    const payload = isRecord(report.payload) ? report.payload : undefined
    const stationArea =
      readString(report.station_area) ??
      readPayloadString(payload, ['stationArea', 'station_area', 'station']) ??
      '선택 역세권'
    const businessType =
      readString(report.business_type) ??
      readPayloadString(payload, ['businessType', 'business_type']) ??
      '업종 미지정'
    const title =
      readString(report.title) ??
      readPayloadString(payload, ['title']) ??
      `${stationArea} 리포트`
    const reportType =
      readString(report.report_type) ??
      readPayloadString(payload, ['reportType', 'report_type', 'type', 'category'])
    const tags = readTags(payload?.tags)
    const category = resolveBackendReportCategory(reportType, title)
    const createdAt =
      readString(report.created_at) ??
      readPayloadString(payload, ['createdAt', 'created_at', 'savedAt']) ??
      new Date().toISOString()

    return {
      id:
        readString(report.id) ??
        readPayloadString(payload, ['id']) ??
        `backend-saved-report-${index}`,
      title,
      category,
      businessType,
      description: readPayloadString(payload, ['description']),
      payload,
      reportType,
      stationArea,
      savedAt: createdAt,
      source: 'backend-saved-report',
      tags,
      thumbnailSrc: getReportThumbnailSrc(category),
    }
  })
}

function getPredictionPayload(
  result: BackendPredictionResult,
): Record<string, unknown> | undefined {
  return isRecord(result.result_payload) ? result.result_payload : undefined
}

function getBackendStartupSuitabilityPayload(
  payload: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  const backendStartupSuitability = payload?.backendStartupSuitability
  return isRecord(backendStartupSuitability) ? backendStartupSuitability : undefined
}

function buildBackendPredictionSummary(
  payload: Record<string, unknown> | undefined,
  predictedScore: number | undefined,
): string | undefined {
  const backendStartupSuitability = getBackendStartupSuitabilityPayload(payload)
  const recommendation =
    readString(backendStartupSuitability?.recommendation_label) ??
    readPayloadString(payload, ['recommendation_label', 'recommendationLabel', 'summary'])
  if (recommendation) {
    return recommendation
  }

  const predictedSalesIncrease = readPayloadString(payload, [
    'predictedSalesIncrease',
  ])
  if (predictedSalesIncrease) {
    return `예상 매출 변화 ${predictedSalesIncrease}`
  }

  if (predictedScore !== undefined) {
    return `창업 적합도 ${predictedScore.toFixed(1)}점`
  }

  const riskLevel = readPayloadString(payload, ['riskLevel'])
  return riskLevel ? `위험 수준 ${riskLevel}` : undefined
}

function normalizeBackendPredictionResults(
  results: BackendPredictionResult[],
): SavedReport[] {
  return results.map((result, index) => {
    const payload = getPredictionPayload(result)
    const backendStartupSuitability = getBackendStartupSuitabilityPayload(payload)
    const stationArea =
      readString(result.station_area) ??
      readPayloadString(payload, ['stationArea', 'station_area']) ??
      '선택 역세권'
    const businessType =
      readString(result.business_type) ??
      readPayloadString(payload, ['businessType', 'business_type']) ??
      '업종 미지정'
    const predictedScore =
      readNumber(result.predicted_score) ??
      readNumber(backendStartupSuitability?.predicted_score)
    const createdAt =
      readString(result.created_at) ??
      readPayloadString(payload, ['createdAt', 'created_at']) ??
      new Date().toISOString()

    return {
      id:
        readString(result.id) ??
        readPayloadString(payload, ['id']) ??
        `backend-prediction-result-${index}`,
      title:
        readPayloadString(payload, ['title']) ??
        `${stationArea} 매출 예측 리포트`,
      category: 'AI 예측',
      businessType,
      predictedScore,
      summary: buildBackendPredictionSummary(payload, predictedScore),
      stationArea,
      savedAt: createdAt,
      thumbnailSrc: myPageAssets.aiPredictionChart,
    }
  })
}

function normalizeBackendInterestLocations(
  locations: BackendSavedLocation[],
): InterestLocation[] {
  return locations.map((location, index) => {
    const payload = isRecord(location.payload) ? location.payload : undefined
    const station =
      readString(location.station_name) ??
      readPayloadString(payload, ['station', 'stationName', 'station_name']) ??
      '선택 역세권'
    const businessType =
      readString(location.business_type) ??
      readPayloadString(payload, ['businessType', 'business_type']) ??
      '업종 미지정'
    const district =
      readString(location.district) ??
      readPayloadString(payload, ['district']) ??
      '지역 미지정'
    const score =
      readNumber(location.score) ?? readNumber(payload?.score) ?? 0

    return {
      id:
        readString(location.id) ??
        readPayloadString(payload, ['id']) ??
        `backend-interest-location-${index}`,
      station,
      district,
      businessType,
      score,
      reason: readPayloadString(payload, ['reason']),
      savedAt:
        readString(location.created_at) ??
        readPayloadString(payload, ['createdAt', 'created_at', 'savedAt']),
    }
  })
}

function removeStoredInterestLocation(
  location: InterestLocation,
  currentLocations?: InterestLocation[],
): InterestLocation[] {
  const existing = currentLocations ??
    safeParseStorage<InterestLocation[]>('metropick-saved-interest-locations') ?? []
  const nextLocations = existing.filter(
    (item) =>
      item.id !== location.id &&
      !(item.station === location.station && item.businessType === location.businessType),
  )
  writeStorage('metropick-saved-interest-locations', nextLocations)
  return nextLocations
}

function formatInterestSavedAt(value: string | undefined): string | null {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed)
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

function getNotificationChannelLabels(
  channels: NotificationSettings['channels'],
): string[] {
  return [
    channels.email ? '이메일' : null,
    channels.webPush ? '웹 푸시' : null,
    channels.sms ? '문자' : null,
  ].filter((item): item is string => Boolean(item))
}

function getBackendNotificationChannels(
  channels: NotificationSettings['channels'],
): string[] {
  return [
    channels.email ? 'email' : null,
    channels.webPush ? 'web-push' : null,
    channels.sms ? 'sms' : null,
  ].filter((item): item is string => Boolean(item))
}

function getBackendNotificationFrequency(
  frequency: NotificationFrequency,
): string {
  if (frequency === '매일') {
    return 'daily'
  }

  if (frequency === '매주') {
    return 'weekly'
  }

  return 'realtime'
}

function getNotificationFrequencyLabel(
  frequency: string | undefined,
): NotificationFrequency | undefined {
  if (frequency === 'daily' || frequency === '매일') {
    return '매일'
  }

  if (frequency === 'weekly' || frequency === '매주') {
    return '매주'
  }

  if (frequency === 'realtime' || frequency === '실시간') {
    return '실시간'
  }

  return undefined
}

function buildQuietHoursPayload(quietHours: string): Record<string, unknown> {
  const [start, end] = quietHours.split('~').map((item) => item.trim())

  if (start && end) {
    return { enabled: true, start, end }
  }

  return { enabled: true, label: quietHours }
}

function getQuietHoursLabel(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value
  }

  if (!isRecord(value)) {
    return undefined
  }

  const label = readString(value.label)
  if (label) {
    return label
  }

  const start = readString(value.start)
  const end = readString(value.end)

  return start && end ? `${start} ~ ${end}` : undefined
}

function buildStoredNotificationSettings(settings: NotificationSettings) {
  return {
    channels: settings.channels,
    channelLabels: getNotificationChannelLabels(settings.channels),
    enabledNotificationLabels: settings.enabledNotifications,
    frequency: settings.frequency,
    quietHours: settings.quietHours,
    savedAt: new Date().toISOString(),
  }
}

function buildBackendNotificationSettingsInput(
  settings: NotificationSettings,
): BackendNotificationSettingsCreateInput {
  return {
    channels: getBackendNotificationChannels(settings.channels),
    frequency: getBackendNotificationFrequency(settings.frequency),
    quiet_hours: buildQuietHoursPayload(settings.quietHours),
    enabled_notifications: settings.enabledNotifications,
  }
}

function buildBackendNotificationSettings(
  localSettings: NotificationSettings,
  setting: BackendNotificationSetting | undefined,
): NotificationSettings {
  if (!setting) {
    return localSettings
  }

  const channels = readStringArray(setting.channels)
  const hasBackendChannels = Array.isArray(setting.channels)
  const enabledNotifications = Array.isArray(setting.enabled_notifications)
    ? readStringArray(setting.enabled_notifications)
    : localSettings.enabledNotifications

  return {
    channels: hasBackendChannels
      ? {
          email: channels.includes('email'),
          sms: channels.includes('sms'),
          webPush: channels.includes('web-push') || channels.includes('webPush'),
        }
      : localSettings.channels,
    frequency:
      getNotificationFrequencyLabel(readString(setting.frequency)) ??
      localSettings.frequency,
    quietHours:
      getQuietHoursLabel(setting.quiet_hours) ?? localSettings.quietHours,
    enabledNotifications,
  }
}

function selectLatestBackendNotificationSetting(
  settings: BackendNotificationSetting[] | undefined,
): BackendNotificationSetting | undefined {
  if (!settings?.length) {
    return undefined
  }

  return [...settings].sort(
    (current, next) =>
      getCreatedTime(next.created_at) - getCreatedTime(current.created_at),
  )[0]
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

function ProfileCard({
  onboardingSettingsStatus,
  profile,
}: {
  onboardingSettingsStatus: OnboardingSettingsStatus
  profile: UserProfile
}) {
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
          <div className="mt-2">
            <BackendStatusBadge
              connectedLabel="Supabase 초기 설정 연결됨"
              fallbackLabel="백엔드 미연결 · 로컬 초기 설정 표시"
              loadingLabel="백엔드 미연결 · 로컬 초기 설정 표시"
              status={onboardingSettingsStatus}
            />
          </div>
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
      <ImageWithFallback
        alt={`${report.title} 썸네일`}
        className="h-full w-full object-cover"
        draggable={false}
        fallbackText="리포트 썸네일을 불러올 수 없습니다."
        src={report.thumbnailSrc}
      />
    </div>
  )
}

function ReportItem({
  onDelete,
  onEdit,
  onOpen,
  onShare,
  report,
}: {
  onDelete: (report: SavedReport) => void
  onEdit: (report: SavedReport, input: SavedReportEditInput) => Promise<void>
  onOpen: (report: SavedReport) => void
  onShare: (report: SavedReport) => void
  report: SavedReport
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState(report.description ?? '')
  const [tagsDraft, setTagsDraft] = useState(report.tags?.join(', ') ?? '')

  const handleEditOpen = () => {
    setDescriptionDraft(report.description ?? '')
    setTagsDraft(report.tags?.join(', ') ?? '')
    setIsEditing(true)
  }

  const handleEditSave = async () => {
    await onEdit(report, {
      description: descriptionDraft.trim(),
      tags: parseTagsInput(tagsDraft),
    })
    setIsEditing(false)
  }

  return (
    <article className="grid min-h-[108px] grid-cols-[120px_minmax(165px,1fr)_88px_minmax(300px,auto)] items-center gap-4 rounded-[13px] border border-blue-100 bg-white px-3.5 py-2.5 shadow-[0_8px_22px_rgba(20,55,90,0.04)] max-[1400px]:grid-cols-[130px_minmax(0,1fr)] max-lg:grid-cols-1">
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
        {report.predictedScore !== undefined || report.summary ? (
          <p className="m-0 mt-1 text-sm font-bold text-slate-500">
            {report.predictedScore !== undefined ? (
              <strong className="text-blue-600">
                예측 점수 {report.predictedScore.toFixed(1)}점
              </strong>
            ) : null}
            {report.predictedScore !== undefined && report.summary ? ' · ' : null}
            {report.summary}
          </p>
        ) : null}
        {report.description ? (
          <p className="m-0 mt-1 text-sm leading-5 font-bold text-slate-600">
            {report.description}
          </p>
        ) : null}
        {report.tags?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {report.tags.map((tag) => (
              <span
                className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-600"
                key={tag}
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
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
        <button
          aria-label={`${report.title} 편집`}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 max-sm:flex-1 max-sm:justify-center"
          onClick={handleEditOpen}
          type="button"
        >
          편집
        </button>
        <button
          aria-label={`${report.title} 삭제`}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-100 bg-white px-3 text-sm font-black text-rose-600 max-sm:flex-1 max-sm:justify-center"
          onClick={() => onDelete(report)}
          type="button"
        >
          <Trash2 aria-hidden="true" size={16} />
          삭제
        </button>
      </div>

      {isEditing ? (
        <div className="col-span-4 grid gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4 max-[1400px]:col-span-2 max-lg:col-auto">
          <label className="grid gap-1 text-sm font-black text-slate-700">
            설명
            <textarea
              className="min-h-20 resize-y rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-300"
              onChange={(event) => setDescriptionDraft(event.target.value)}
              value={descriptionDraft}
            />
          </label>
          <label className="grid gap-1 text-sm font-black text-slate-700">
            태그
            <input
              className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-300"
              onChange={(event) => setTagsDraft(event.target.value)}
              placeholder="쉼표로 구분해 입력"
              value={tagsDraft}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-black text-white"
              onClick={handleEditSave}
              type="button"
            >
              수정 저장
            </button>
            <button
              className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
              onClick={() => setIsEditing(false)}
              type="button"
            >
              취소
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function ReportsTab({
  activeFilter,
  onDelete,
  onEdit,
  onFilterChange,
  onOpen,
  onSearchChange,
  onShare,
  onSortChange,
  predictionResultSourceStatus,
  reportSourceStatus,
  reports,
  searchQuery,
  sortOrder,
}: {
  activeFilter: CategoryFilter
  onDelete: (report: SavedReport) => void
  onEdit: (report: SavedReport, input: SavedReportEditInput) => Promise<void>
  onFilterChange: (filter: CategoryFilter) => void
  onOpen: (report: SavedReport) => void
  onSearchChange: (value: string) => void
  onShare: (report: SavedReport) => void
  onSortChange: (value: SortOrder) => void
  predictionResultSourceStatus: BackendReportStatus
  reportSourceStatus: BackendReportStatus
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
          <BackendStatusBadge
            connectedLabel="Supabase 리포트 연결됨"
            fallbackLabel="백엔드 미연결 · 로컬 저장 리포트 표시"
            loadingLabel="백엔드 미연결 · 로컬 저장 리포트 표시"
            status={reportSourceStatus}
          />
          <BackendStatusBadge
            connectedLabel="Supabase AI 예측 결과 연결됨"
            fallbackLabel="백엔드 미연결 · 로컬 AI 예측 결과 표시"
            loadingLabel="백엔드 미연결 · 로컬 AI 예측 결과 표시"
            status={predictionResultSourceStatus}
          />
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
              onDelete={onDelete}
              onEdit={onEdit}
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
  locationSourceStatus,
  locations,
  onDelete,
  onView,
}: {
  locationSourceStatus: BackendReportStatus
  locations: InterestLocation[]
  onDelete: (location: InterestLocation) => void
  onView: () => void
}) {
  const statusBadge = (
    <div className="flex justify-end px-5 pt-4">
      <BackendStatusBadge
        connectedLabel="Supabase 관심 지역 연결됨"
        fallbackLabel="백엔드 미연결 · 로컬 관심 지역 표시"
        loadingLabel="백엔드 미연결 · 로컬 관심 지역 표시"
        status={locationSourceStatus}
      />
    </div>
  )

  if (locations.length === 0) {
    return (
      <>
        {statusBadge}
        <div className="grid min-h-[220px] place-items-center px-5 py-5">
          <div className="rounded-xl border border-dashed border-blue-100 bg-slate-50 px-6 py-8 text-center">
            <p className="m-0 text-sm font-black text-slate-700">
              저장된 관심 역세권이 없습니다.
            </p>
            <p className="m-0 mt-2 text-sm font-bold text-slate-500">
              입지 추천에서 관심 지역을 저장하면 이곳에 표시됩니다.
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {statusBadge}
      <div className="grid gap-3 px-5 py-5">
        {locations.map((location) => {
          const savedAtLabel = formatInterestSavedAt(location.savedAt)

          return (
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
                {savedAtLabel ? (
                  <p className="m-0 mt-1 text-xs font-bold text-slate-400">
                    저장일 {savedAtLabel}
                  </p>
                ) : null}
                {location.reason ? (
                  <p className="m-0 mt-2 text-sm font-bold text-slate-600">
                    {location.reason}
                  </p>
                ) : null}
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
          )
        })}
      </div>
    </>
  )
}

function NotificationsTab({
  notificationSourceStatus,
  onChange,
  onSave,
  settings,
}: {
  notificationSourceStatus: NotificationSettingsStatus
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
      <div>
        <BackendStatusBadge
          connectedLabel="Supabase 알림 설정 연결됨"
          fallbackLabel="백엔드 미연결 · 로컬 알림 설정 표시"
          loadingLabel="백엔드 미연결 · 로컬 알림 설정 표시"
          status={notificationSourceStatus}
        />
      </div>

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
  locationSourceStatus,
  notificationSourceStatus,
  notificationSettings,
  onDeleteInterest,
  onDeleteReport,
  onEditReport,
  onFilterChange,
  onOpenReport,
  onSaveNotifications,
  onSearchChange,
  onSetNotificationSettings,
  onShareReport,
  onSortChange,
  onTabChange,
  onViewInterest,
  predictionResultSourceStatus,
  reportSourceStatus,
  searchQuery,
  sortOrder,
}: {
  activeFilter: CategoryFilter
  activeTab: MyPageTab
  activities: ActivityItem[]
  filteredReports: SavedReport[]
  interestLocations: InterestLocation[]
  locationSourceStatus: BackendReportStatus
  notificationSourceStatus: NotificationSettingsStatus
  notificationSettings: NotificationSettings
  onDeleteInterest: (location: InterestLocation) => void
  onDeleteReport: (report: SavedReport) => void
  onEditReport: (report: SavedReport, input: SavedReportEditInput) => Promise<void>
  onFilterChange: (filter: CategoryFilter) => void
  onOpenReport: (report: SavedReport) => void
  onSaveNotifications: () => void
  onSearchChange: (value: string) => void
  onSetNotificationSettings: (settings: NotificationSettings) => void
  onShareReport: (report: SavedReport) => void
  onSortChange: (value: SortOrder) => void
  onTabChange: (tab: MyPageTab) => void
  onViewInterest: () => void
  predictionResultSourceStatus: BackendReportStatus
  reportSourceStatus: BackendReportStatus
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
          onDelete={onDeleteReport}
          onEdit={onEditReport}
          onFilterChange={onFilterChange}
          onOpen={onOpenReport}
          onSearchChange={onSearchChange}
          onShare={onShareReport}
          onSortChange={onSortChange}
          predictionResultSourceStatus={predictionResultSourceStatus}
          reportSourceStatus={reportSourceStatus}
          reports={filteredReports}
          searchQuery={searchQuery}
          sortOrder={sortOrder}
        />
      ) : null}

      {activeTab === 'interest-locations' ? (
        <InterestLocationsTab
          locationSourceStatus={locationSourceStatus}
          locations={interestLocations}
          onDelete={onDeleteInterest}
          onView={onViewInterest}
        />
      ) : null}

      {activeTab === 'notifications' ? (
        <NotificationsTab
          notificationSourceStatus={notificationSourceStatus}
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

export function MyPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const localProfile = useMemo(() => buildProfile(), [])
  const [interestLocations, setInterestLocations] = useState<InterestLocation[]>(() =>
    normalizeInterestLocations(),
  )
  const [hiddenBackendInterestLocationIds, setHiddenBackendInterestLocationIds] =
    useState<string[]>([])
  const [hiddenBackendReportIds, setHiddenBackendReportIds] = useState<string[]>([])
  const [, setReportStorageRevision] = useState(0)
  const requestedTab = searchParams.get('tab')
  const activeTab: MyPageTab = isMyPageTab(requestedTab) ? requestedTab : 'reports'
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest')
  const localNotificationSettings = useMemo(() => buildNotificationSettings(), [])
  const [notificationDraftSettings, setNotificationDraftSettings] =
    useState<NotificationSettings | null>(null)
  const [message, setMessage] = useState('')
  const activities = useMemo(() => buildActivities(), [])
  const backendNotificationSettingsQuery = useBackendNotificationSettings()
  const createBackendNotificationSettingsMutation =
    useCreateBackendNotificationSettings()
  const updateBackendNotificationSettingsMutation =
    useUpdateBackendNotificationSettings()
  const backendNotificationSetting =
    backendNotificationSettingsQuery.data?.data_status === 'supabase_connected'
      ? selectLatestBackendNotificationSetting(
          backendNotificationSettingsQuery.data.settings,
        )
      : undefined
  const notificationSourceStatus: NotificationSettingsStatus =
    backendNotificationSetting ? 'connected' : 'fallback'
  const backendNotificationSettings = useMemo(
    () =>
      buildBackendNotificationSettings(
        localNotificationSettings,
        backendNotificationSetting,
      ),
    [backendNotificationSetting, localNotificationSettings],
  )
  const notificationSettings =
    notificationDraftSettings ?? backendNotificationSettings
  const backendOnboardingSettingsQuery = useBackendOnboardingSettings()
  const backendOnboardingSetting =
    backendOnboardingSettingsQuery.data?.data_status === 'supabase_connected'
      ? selectLatestBackendOnboardingSetting(
          backendOnboardingSettingsQuery.data.settings,
        )
      : undefined
  const onboardingSettingsStatus: OnboardingSettingsStatus = backendOnboardingSetting
    ? 'connected'
    : 'fallback'
  const profile = useMemo(
    () => buildBackendProfile(localProfile, backendOnboardingSetting),
    [backendOnboardingSetting, localProfile],
  )
  const backendSavedLocationsQuery = useBackendSavedLocations()
  const deleteBackendSavedLocationMutation = useDeleteBackendSavedLocation()
  const backendPredictionResultsQuery = useBackendPredictionResults()
  const isBackendSavedLocationsConnected =
    backendSavedLocationsQuery.data?.data_status === 'supabase_connected'
  const backendInterestLocations = useMemo(() => {
    const response = backendSavedLocationsQuery.data
    return response?.data_status === 'supabase_connected'
      ? normalizeBackendInterestLocations(response.locations)
      : []
  }, [backendSavedLocationsQuery.data])
  const visibleInterestLocations = isBackendSavedLocationsConnected
    ? backendInterestLocations.filter(
        (location) => !hiddenBackendInterestLocationIds.includes(location.id),
      )
    : interestLocations
  const locationSourceStatus: BackendReportStatus = isBackendSavedLocationsConnected
    ? 'connected'
    : 'fallback'
  const isBackendPredictionResultsConnected =
    backendPredictionResultsQuery.data?.data_status === 'supabase_connected'
  const backendPredictionReports = useMemo(() => {
    const response = backendPredictionResultsQuery.data
    return response?.data_status === 'supabase_connected'
      ? normalizeBackendPredictionResults(response.results)
      : []
  }, [backendPredictionResultsQuery.data])
  const predictionReportsForMyPage = isBackendPredictionResultsConnected
    ? backendPredictionReports
    : normalizePredictionReports()
  const predictionResultSourceStatus: BackendReportStatus =
    isBackendPredictionResultsConnected ? 'connected' : 'fallback'
  const localSavedReports = buildSavedReports(
    visibleInterestLocations,
    predictionReportsForMyPage,
  )
  const backendSavedReportsQuery = useBackendSavedReports()
  const updateBackendSavedReportMutation = useUpdateBackendSavedReport()
  const deleteBackendSavedReportMutation = useDeleteBackendSavedReport()
  const isBackendSavedReportsConnected =
    backendSavedReportsQuery.data?.data_status === 'supabase_connected'
  const backendSavedReports = useMemo(() => {
    const response = backendSavedReportsQuery.data
    return response?.data_status === 'supabase_connected'
      ? normalizeBackendSavedReports(response.reports).filter(
          (report) => !hiddenBackendReportIds.includes(report.id),
        )
      : []
  }, [backendSavedReportsQuery.data, hiddenBackendReportIds])
  const savedReports = isBackendSavedReportsConnected
    ? mergeSavedReports([...backendSavedReports, ...predictionReportsForMyPage])
    : localSavedReports
  const reportSourceStatus: BackendReportStatus = isBackendSavedReportsConnected
    ? 'connected'
    : 'fallback'

  const handleTabChange = (tab: MyPageTab) => {
    setSearchParams(tab === 'reports' ? {} : { tab })
  }

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
          report.description ?? '',
          ...(report.tags ?? []),
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

  const handleEditReport = async (
    report: SavedReport,
    input: SavedReportEditInput,
  ) => {
    updateSavedReportLocalEdit(report, input)
    setReportStorageRevision((current) => current + 1)

    if (isBackendSavedReportsConnected && report.source === 'backend-saved-report') {
      try {
        const nextPayload: BackendSavedReportPayload = {
          ...(report.payload ?? {}),
          description: input.description,
          tags: input.tags,
        }

        const response = await updateBackendSavedReportMutation.mutateAsync({
          id: report.id,
          input: {
            business_type: report.businessType,
            payload: nextPayload,
            station_area: report.stationArea,
            title: report.title,
          },
        })

        showMessage(
          response.data_status === 'supabase_connected'
            ? 'Supabase에 리포트 수정 내용을 저장했어요.'
            : '백엔드 미연결 · 로컬 리포트를 수정했어요.',
        )
      } catch {
        showMessage('백엔드 미연결 · 로컬 리포트를 수정했어요.')
      }
      return
    }

    showMessage('백엔드 미연결 · 로컬 리포트를 수정했어요.')
  }

  const handleDeleteReport = async (report: SavedReport) => {
    if (!window.confirm('이 리포트를 삭제할까요?')) {
      return
    }

    if (isBackendSavedReportsConnected && report.source === 'backend-saved-report') {
      const previousHiddenReportIds = hiddenBackendReportIds
      setHiddenBackendReportIds((current) => [...current, report.id])

      try {
        const response = await deleteBackendSavedReportMutation.mutateAsync(report.id)
        removeSavedReportLocalEdit(report)
        setReportStorageRevision((current) => current + 1)
        showMessage(
          response.data_status === 'supabase_connected'
            ? 'Supabase에서 리포트를 삭제했어요.'
            : '백엔드 미연결 · 로컬 리포트를 삭제했어요.',
        )
      } catch {
        setHiddenBackendReportIds(previousHiddenReportIds)
        deleteSavedReportFromLocalStorage(report)
        setReportStorageRevision((current) => current + 1)
        showMessage('백엔드 미연결 · 로컬 리포트를 삭제했어요.')
      }
      return
    }

    deleteSavedReportFromLocalStorage(report)
    setReportStorageRevision((current) => current + 1)
    showMessage('백엔드 미연결 · 로컬 리포트를 삭제했어요.')
  }

  const handleDeleteInterest = async (location: InterestLocation) => {
    if (isBackendSavedLocationsConnected) {
      const previousHiddenIds = hiddenBackendInterestLocationIds
      setHiddenBackendInterestLocationIds((current) => [...current, location.id])

      try {
        await deleteBackendSavedLocationMutation.mutateAsync(location.id)
        setInterestLocations(removeStoredInterestLocation(location))
        showMessage('관심 역세권에서 삭제되었습니다.')
      } catch {
        setHiddenBackendInterestLocationIds(previousHiddenIds)
        showMessage('백엔드 삭제에 실패했습니다. 관심 지역 목록을 유지합니다.')
      }
      return
    }

    const nextLocations = removeStoredInterestLocation(location, interestLocations)
    setInterestLocations(nextLocations)
    showMessage('관심 역세권에서 삭제되었습니다.')
  }

  const handleSaveNotifications = async () => {
    writeStorage(
      'metropick-onboarding-notifications',
      buildStoredNotificationSettings(notificationSettings),
    )

    try {
      const backendInput = buildBackendNotificationSettingsInput(notificationSettings)
      const settingId = readString(backendNotificationSetting?.id)
      const response = settingId
        ? await updateBackendNotificationSettingsMutation.mutateAsync({
            id: settingId,
            input: backendInput,
          })
        : await createBackendNotificationSettingsMutation.mutateAsync(backendInput)

      showMessage(
        response.data_status === 'supabase_connected'
          ? 'Supabase에 알림 설정을 저장했어요.'
          : '백엔드 미연결 · 로컬에 알림 설정을 저장했어요.',
      )
    } catch {
      showMessage('백엔드 미연결 · 로컬에 알림 설정을 저장했어요.')
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } finally {
      clearAuthUser()
      navigate('/login', { replace: true })
    }
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
            <button
              className="inline-flex h-12 min-w-[112px] items-center justify-center rounded-lg border border-white/55 bg-white px-5 text-sm font-black text-[#061f4c] transition hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              onClick={handleLogout}
              type="button"
            >
              로그아웃
            </button>
          </>
        )}
        sticky
      />

      <div className="flex min-h-[calc(100vh-var(--app-topbar-height)-var(--app-footer-height))] max-[1121px]:flex-col">
        <AppSidebar activeHref="/mypage" ariaLabel="마이페이지 사이드 메뉴" />

        <main className="min-w-0 flex-1 px-[58px] pt-7 pb-4 max-2xl:px-8 max-md:px-4">
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
              <ProfileCard
                onboardingSettingsStatus={onboardingSettingsStatus}
                profile={profile}
              />
              <AlertCard notifications={defaultNotifications} />
            </div>

            <ReportPanel
              activeFilter={activeFilter}
              activeTab={activeTab}
              activities={activities}
              filteredReports={filteredReports}
              interestLocations={visibleInterestLocations}
              locationSourceStatus={locationSourceStatus}
              notificationSourceStatus={notificationSourceStatus}
              notificationSettings={notificationSettings}
              onDeleteInterest={handleDeleteInterest}
              onDeleteReport={handleDeleteReport}
              onEditReport={handleEditReport}
              onFilterChange={setActiveFilter}
              onOpenReport={handleOpenReport}
              onSaveNotifications={handleSaveNotifications}
              onSearchChange={setSearchQuery}
              onSetNotificationSettings={setNotificationDraftSettings}
              onShareReport={handleShareReport}
              onSortChange={setSortOrder}
              onTabChange={handleTabChange}
              onViewInterest={() => navigate('/recommendation')}
              predictionResultSourceStatus={predictionResultSourceStatus}
              reportSourceStatus={reportSourceStatus}
              searchQuery={searchQuery}
              sortOrder={sortOrder}
            />
          </div>

          <UpgradeBanner />
        </main>
      </div>

      <AppFooter />

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
