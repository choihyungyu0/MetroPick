import { Fragment, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  ClipboardList,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Moon,
  PartyPopper,
  Phone,
  Train,
  TrendingUp,
  UsersRound,
  Zap,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { landingAssets } from '@/shared/assets/landingAssets'

type NotificationId =
  | 'opening-schedule'
  | 'sales-change'
  | 'location-recommendation'
  | 'competition-change'
  | 'weekly-report'

type NotificationChannel = 'email' | 'sms' | 'web-push'
type NotificationFrequency = 'realtime' | 'daily' | 'weekly'

type NotificationOption = {
  description: string
  icon: LucideIcon
  iconLabel: string
  id: NotificationId
  title: string
}

type NotificationSetup = {
  channels: NotificationChannel[]
  enabledNotificationIds: NotificationId[]
  frequency: NotificationFrequency
  quietHours: {
    enabled: boolean
    end: string
    start: string
  }
}

type NotificationPayload = NotificationSetup & {
  channelLabels: string[]
  enabledNotificationLabels: string[]
  frequencyLabel: string
}

const NOTIFICATION_STORAGE_KEY = 'metropick-onboarding-notifications'
const ONBOARDING_COMPLETED_KEY = 'metropick-onboarding-completed'
const ONBOARDING_SUMMARY_KEY = 'metropick-onboarding-summary'
const STATION_STORAGE_KEY = 'metropick-onboarding-stations'
const BUSINESS_TYPE_STORAGE_KEY = 'metropick-onboarding-business-types'

const notificationOptions: NotificationOption[] = [
  {
    id: 'opening-schedule',
    title: '개통 일정 변경 알림',
    description: '광주 2호선 개통 일정 변경 및 구간별 공사·개발 진행 상황을 알려드려요.',
    icon: Bell,
    iconLabel: '종 알림 아이콘',
  },
  {
    id: 'sales-change',
    title: '예상 매출 변동 알림',
    description: '선택한 역세권과 업종의 예상 매출 변동을 분석하여 알려드려요.',
    icon: TrendingUp,
    iconLabel: '상승 그래프 아이콘',
  },
  {
    id: 'location-recommendation',
    title: '추천 입지 업데이트',
    description: '새롭게 발견된 유망 입지와 추천 상권 정보를 알려드려요.',
    icon: MapPin,
    iconLabel: '지도 핀 아이콘',
  },
  {
    id: 'competition-change',
    title: '경쟁도 변화 알림',
    description: '상권 밀집도 및 경쟁 강도 변화 추이를 분석하여 알려드려요.',
    icon: UsersRound,
    iconLabel: '사용자 그룹 아이콘',
  },
  {
    id: 'weekly-report',
    title: '주간 요약 리포트',
    description: '주간 상권 변화 요약과 주요 인사이트를 리포트로 받아보세요.',
    icon: ClipboardList,
    iconLabel: '체크리스트 아이콘',
  },
]

const channelOptions: Array<{
  description: string
  icon: LucideIcon
  id: NotificationChannel
  label: string
}> = [
  {
    id: 'email',
    label: '이메일',
    description: '이메일로 알림을 받아보세요.',
    icon: Mail,
  },
  {
    id: 'sms',
    label: '문자',
    description: 'SMS로 알림을 받아보세요.',
    icon: MessageSquare,
  },
  {
    id: 'web-push',
    label: '웹 푸시',
    description: '브라우저 푸시로 받아보세요.',
    icon: Monitor,
  },
]

const frequencyOptions: Array<{
  icon: LucideIcon
  id: NotificationFrequency
  label: string
}> = [
  { id: 'realtime', label: '실시간', icon: Zap },
  { id: 'daily', label: '매일', icon: Calendar },
  { id: 'weekly', label: '매주', icon: CalendarDays },
]

const defaultSetup: NotificationSetup = {
  enabledNotificationIds: notificationOptions.map((option) => option.id),
  channels: ['email', 'web-push'],
  frequency: 'realtime',
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNotificationId(value: unknown): value is NotificationId {
  return (
    typeof value === 'string' && notificationOptions.some((option) => option.id === value)
  )
}

function isNotificationChannel(value: unknown): value is NotificationChannel {
  return typeof value === 'string' && channelOptions.some((option) => option.id === value)
}

function isNotificationFrequency(value: unknown): value is NotificationFrequency {
  return (
    typeof value === 'string' && frequencyOptions.some((option) => option.id === value)
  )
}

function getNotificationLabel(id: NotificationId) {
  return notificationOptions.find((option) => option.id === id)?.title ?? id
}

function getChannelLabel(channel: NotificationChannel) {
  return channelOptions.find((option) => option.id === channel)?.label ?? channel
}

function getFrequencyLabel(frequency: NotificationFrequency) {
  return frequencyOptions.find((option) => option.id === frequency)?.label ?? frequency
}

function sanitizeSavedSetup(value: unknown): NotificationSetup {
  if (!isRecord(value)) {
    return defaultSetup
  }

  const enabledNotificationIds = Array.isArray(value.enabledNotificationIds)
    ? value.enabledNotificationIds.filter(isNotificationId)
    : defaultSetup.enabledNotificationIds

  const channels = Array.isArray(value.channels)
    ? value.channels.filter(isNotificationChannel)
    : defaultSetup.channels

  const quietHours = isRecord(value.quietHours) ? value.quietHours : null

  return {
    enabledNotificationIds: enabledNotificationIds.length
      ? Array.from(new Set(enabledNotificationIds))
      : defaultSetup.enabledNotificationIds,
    channels: channels.length ? Array.from(new Set(channels)) : defaultSetup.channels,
    frequency: isNotificationFrequency(value.frequency)
      ? value.frequency
      : defaultSetup.frequency,
    quietHours: {
      enabled:
        typeof quietHours?.enabled === 'boolean'
          ? quietHours.enabled
          : defaultSetup.quietHours.enabled,
      start:
        typeof quietHours?.start === 'string'
          ? quietHours.start
          : defaultSetup.quietHours.start,
      end:
        typeof quietHours?.end === 'string'
          ? quietHours.end
          : defaultSetup.quietHours.end,
    },
  }
}

function readStorageValue(key: string): unknown | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const saved = window.localStorage.getItem(key)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

function loadInitialSetup(): NotificationSetup {
  return sanitizeSavedSetup(readStorageValue(NOTIFICATION_STORAGE_KEY))
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="flex items-center gap-3" to="/" aria-label="MetroPick AI 홈">
      <img
        alt="MetroPick AI 로고"
        className={[
          'shrink-0 scale-[1.72] object-contain',
          compact ? 'h-7 w-8' : 'h-8 w-10',
        ].join(' ')}
        draggable={false}
        src={landingAssets.logo}
      />
      <span>
        <span
          className={[
            'block leading-none font-black tracking-[-0.03em] text-white',
            compact ? 'text-xl' : 'text-2xl',
          ].join(' ')}
        >
          MetroPick AI
        </span>
        <span className="mt-2 block text-xs font-semibold text-white/75">
          광주 2호선 개통에 따른 AI 상권 변화 예측 서비스
        </span>
      </span>
    </Link>
  )
}

function Header() {
  const navItems = ['서비스 소개', '상권 분석', 'AI 예측', '입지 추천', '리포트']

  return (
    <header className="relative z-20 bg-gradient-to-r from-[#061b42] via-[#082c62] to-[#03183b] text-white shadow-[0_8px_24px_rgba(1,20,58,0.22)]">
      <div className="mx-auto grid min-h-[88px] w-[calc(100%_-_32px)] max-w-[1840px] items-center gap-5 py-5 lg:w-[calc(100%_-_96px)] xl:grid-cols-[430px_1fr_348px] xl:py-0">
        <Logo />
        <nav
          aria-label="주요 메뉴"
          className="flex flex-wrap justify-center gap-x-7 gap-y-3 text-base font-black lg:gap-x-12 2xl:gap-x-[82px]"
        >
          {navItems.map((item) => (
            <Link
              className="rounded-sm text-white transition hover:text-[#3fd4ff] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              key={item}
              to="/"
            >
              {item}
            </Link>
          ))}
        </nav>
        <div className="flex justify-center gap-3 xl:justify-end">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/80 bg-white/5 px-8 text-base font-black text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            to="/login"
          >
            로그인
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0774ff] to-[#0066ef] px-8 text-base font-black text-white shadow-[0_10px_22px_rgba(0,105,255,0.3)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            to="/signup"
          >
            무료로 시작하기
          </Link>
        </div>
      </div>
    </header>
  )
}

function Stepper() {
  const steps = [
    { label: '관심 지역 설정', done: true },
    { label: '관심 역세권 설정', done: true },
    { label: '분석 업종 설정', done: true },
    { label: '알림 설정', active: true },
  ]

  return (
    <ol className="flex min-w-[680px] items-start justify-center md:min-w-0">
      {steps.map((step, index) => (
        <Fragment key={step.label}>
          <li className="flex min-w-[124px] flex-col items-center">
            <span
              aria-current={step.active ? 'step' : undefined}
              className={[
                'flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white text-xl font-black',
                step.done
                  ? 'border-[#0969f4] bg-[#0969f4] text-white shadow-[0_8px_18px_rgba(9,105,244,0.24)]'
                  : step.active
                    ? 'border-[#0969f4] text-[#0969f4]'
                    : 'border-[#d1d9e7] text-[#b8c1d0]',
              ].join(' ')}
            >
              {step.done ? <Check size={21} strokeWidth={3} /> : index + 1}
            </span>
            <span
              className={[
                'mt-3 text-center text-sm font-black',
                step.active ? 'text-[#0969f4]' : 'text-[#303c52]',
              ].join(' ')}
            >
              {step.label}
            </span>
          </li>
          {index !== steps.length - 1 ? (
            <span
              aria-hidden="true"
              className={[
                'mt-[22px] h-0.5 w-36',
                index < 3 ? 'bg-[#0969f4]' : 'bg-[#d7deea]',
              ].join(' ')}
            />
          ) : null}
        </Fragment>
      ))}
    </ol>
  )
}

function Toggle({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={[
        'grid h-[29px] w-[52px] items-center rounded-full p-[3px] transition focus-visible:ring-2 focus-visible:ring-[#0969f4] focus-visible:ring-offset-2 focus-visible:outline-none',
        active ? 'bg-[#0969f4]' : 'bg-[#d7e0ee]',
      ].join(' ')}
      onClick={onClick}
      type="button"
    >
      <span
        className={[
          'block h-[23px] w-[23px] rounded-full bg-white shadow-[0_2px_7px_rgba(17,38,72,0.22)] transition',
          active ? 'translate-x-[23px]' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-[13px] border border-[#d2def0]/95 bg-white/95 px-5 py-5 shadow-[0_8px_22px_rgba(10,42,90,0.12)] lg:px-7">
      <h2 className="text-[23px] font-black tracking-[-0.03em] text-[#061b42]">
        {title}
      </h2>
      {children}
    </section>
  )
}

function AlertListPanel({
  enabledNotificationIds,
  errorMessage,
  onToggle,
}: {
  enabledNotificationIds: NotificationId[]
  errorMessage: string
  onToggle: (id: NotificationId) => void
}) {
  return (
    <Panel title="받고 싶은 알림 선택">
      <div className="mt-4 overflow-hidden rounded-lg border border-[#dbe4ef] bg-white">
        {notificationOptions.map((item) => {
          const Icon = item.icon
          const active = enabledNotificationIds.includes(item.id)

          return (
            <div
              className="grid min-h-16 grid-cols-[59px_1fr] items-center gap-3 border-b border-[#dbe4ef] px-4 py-3 last:border-b-0 sm:grid-cols-[59px_1fr_56px] sm:pr-7"
              key={item.id}
            >
              <span
                aria-label={item.iconLabel}
                className="flex h-[50px] w-[50px] items-center justify-center rounded-lg bg-[#edf5ff] text-[#0969f4]"
              >
                <Icon size={28} />
              </span>
              <span>
                <strong className="block text-base font-black text-[#061b42]">
                  {item.title}
                </strong>
                <span className="mt-1 block text-sm leading-5 font-semibold text-[#5d6d85]">
                  {item.description}
                </span>
              </span>
              <span className="col-span-2 sm:col-span-1 sm:justify-self-end">
                <Toggle
                  active={active}
                  label={`${item.title} ${active ? '끄기' : '켜기'}`}
                  onClick={() => onToggle(item.id)}
                />
              </span>
            </div>
          )
        })}
      </div>
      {errorMessage ? (
        <p className="mt-3 rounded-lg border border-[#ffd1d1] bg-[#fff5f5] px-4 py-3 text-sm font-bold text-[#b42318]">
          {errorMessage}
        </p>
      ) : null}
    </Panel>
  )
}

function MethodPanel({
  channels,
  errorMessage,
  onToggle,
}: {
  channels: NotificationChannel[]
  errorMessage: string
  onToggle: (channel: NotificationChannel) => void
}) {
  return (
    <Panel title="알림 방식 설정">
      <div className="mt-3 grid gap-4 xl:grid-cols-3">
        {channelOptions.map((method) => {
          const Icon = method.icon
          const active = channels.includes(method.id)

          return (
            <button
              aria-pressed={active}
              className={[
                'relative flex min-h-[82px] items-center gap-5 rounded-[10px] border bg-white px-5 py-4 pr-14 text-left transition hover:bg-[#f8fbff] focus-visible:ring-2 focus-visible:ring-[#0969f4] focus-visible:outline-none',
                active
                  ? 'border-2 border-[#0969f4] bg-gradient-to-br from-white to-[#f1f7ff]'
                  : 'border-[#dbe4ef]',
              ].join(' ')}
              key={method.id}
              onClick={() => onToggle(method.id)}
              type="button"
            >
              <Icon className={active ? 'text-[#0969f4]' : 'text-[#77859a]'} size={34} />
              <span>
                <strong
                  className={[
                    'block text-base font-black',
                    active ? 'text-[#0969f4]' : 'text-[#27364e]',
                  ].join(' ')}
                >
                  {method.label}
                </strong>
                <span className="mt-1 block text-sm font-semibold text-[#6c7890]">
                  {method.description}
                </span>
              </span>
              <span
                className={[
                  'absolute top-7 right-5 flex h-[22px] w-[22px] items-center justify-center rounded-md border',
                  active
                    ? 'border-[#0969f4] bg-[#0969f4] text-white'
                    : 'border-[#cbd6e6] bg-white',
                ].join(' ')}
              >
                {active ? <Check size={16} strokeWidth={3} /> : null}
              </span>
            </button>
          )
        })}
      </div>
      {errorMessage ? (
        <p className="mt-3 rounded-lg border border-[#ffd1d1] bg-[#fff5f5] px-4 py-3 text-sm font-bold text-[#b42318]">
          {errorMessage}
        </p>
      ) : null}
    </Panel>
  )
}

function FrequencyPanel({
  frequency,
  quietHours,
  onSelect,
}: {
  frequency: NotificationFrequency
  quietHours: NotificationSetup['quietHours']
  onSelect: (frequency: NotificationFrequency) => void
}) {
  return (
    <Panel title="알림 빈도 설정">
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {frequencyOptions.map((item) => {
          const Icon = item.icon
          const active = frequency === item.id

          return (
            <button
              aria-pressed={active}
              className={[
                'flex h-12 items-center justify-center gap-3 rounded-lg border bg-white font-black transition hover:bg-[#f8fbff] focus-visible:ring-2 focus-visible:ring-[#0969f4] focus-visible:outline-none',
                active
                  ? 'border-2 border-[#0969f4] text-[#0969f4]'
                  : 'border-[#dbe4ef] text-[#606d82]',
              ].join(' ')}
              key={item.id}
              onClick={() => onSelect(item.id)}
              type="button"
            >
              <Icon size={21} />
              {item.label}
            </button>
          )
        })}
      </div>

      <button
        className="mt-3 flex min-h-[53px] w-full flex-col gap-3 rounded-lg border border-[#dbe4ef] bg-white px-5 py-3 text-left text-[#061b42] transition hover:bg-[#f8fbff] focus-visible:ring-2 focus-visible:ring-[#0969f4] focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between"
        type="button"
      >
        <span className="flex items-center gap-3">
          <Moon className="text-[#0969f4]" size={22} />
          <strong className="font-black text-[#24324a]">방해 금지 시간</strong>
        </span>
        <span className="flex items-center gap-3 text-base font-black text-[#061b42]">
          {quietHours.start} ~ {quietHours.end}
          <ChevronDown className="text-[#0969f4]" size={20} />
        </span>
      </button>
    </Panel>
  )
}

function TagGroup({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
      {labels.map((label) => (
        <span
          className="rounded-lg border border-[#b9d5ff] bg-[#f3f8ff] px-4 py-2 text-sm font-black text-[#0969f4]"
          key={label}
        >
          {label}
        </span>
      ))}
    </div>
  )
}

function SummaryRow({
  children,
  icon: Icon,
  title,
}: {
  children: ReactNode
  icon: LucideIcon
  title: string
}) {
  return (
    <div className="grid min-h-[76px] grid-cols-[48px_1fr] items-center gap-3 border-b border-[#dbe4ef] px-5 py-4 last:border-b-0 xl:grid-cols-[48px_170px_1fr]">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef5ff] text-[#0969f4]">
        <Icon size={27} />
      </span>
      <strong className="text-base font-black text-[#101e37]">{title}</strong>
      <div className="col-span-2 flex items-center xl:col-span-1 xl:justify-end">
        {children}
      </div>
    </div>
  )
}

function SummaryPanel({
  channels,
  enabledNotificationIds,
  frequency,
  onComplete,
  onPrevious,
  quietHours,
}: NotificationSetup & {
  onComplete: () => void
  onPrevious: () => void
}) {
  const channelLabels = channels.map(getChannelLabel)
  const frequencyLabel = getFrequencyLabel(frequency)

  return (
    <aside className="flex flex-col gap-5">
      <section
        aria-label="알림 설정 요약"
        className="rounded-[13px] border border-[#d2def0]/95 bg-white/95 px-5 py-6 shadow-[0_8px_22px_rgba(10,42,90,0.12)] lg:px-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[23px] font-black tracking-[-0.03em] text-[#061b42]">
              나의 알림 설정
            </h2>
            <p className="mt-3 text-sm font-bold text-[#667389]">
              완료 전 설정 내용을 확인해 주세요.
            </p>
          </div>
          <PartyPopper
            className="mr-3 hidden fill-[#0969f4]/10 text-[#0969f4] sm:block"
            size={70}
          />
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-[#dbe4ef] bg-white">
          <SummaryRow icon={Bell} title="활성화 알림">
            <span className="text-base font-black text-[#111827]">
              {enabledNotificationIds.length}개 항목 활성화
            </span>
          </SummaryRow>
          <SummaryRow icon={Mail} title="알림 방식">
            <TagGroup labels={channelLabels} />
          </SummaryRow>
          <SummaryRow icon={Clock} title="알림 빈도">
            <span className="text-base font-black text-[#111827]">{frequencyLabel}</span>
          </SummaryRow>
          <SummaryRow icon={Moon} title="방해 금지 시간">
            <span className="text-base font-black text-[#111827]">
              {quietHours.start} ~ {quietHours.end}
            </span>
          </SummaryRow>
        </div>

        <section className="mt-5 rounded-xl bg-gradient-to-br from-[#eef6ff] to-[#e4f0ff] px-5 py-5">
          <h3 className="text-lg font-black text-[#0969f4]">
            설정 완료 후 받을 수 있어요
          </h3>
          <ul className="mt-4 grid gap-3 text-sm leading-6 font-bold text-[#34445c]">
            {[
              '선택한 역세권과 업종에 맞춘 개인화된 예측 알림을 받아보세요.',
              '개통 일정 변경, 매출 변동 등 중요한 변화를 놓치지 않아요.',
              '정기 리포트로 상권 트렌드와 인사이트를 주기적으로 확인하세요.',
            ].map((item) => (
              <li className="flex items-start gap-2" key={item}>
                <Check
                  className="mt-1 shrink-0 rounded-full bg-[#0969f4] p-0.5 text-white"
                  size={16}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </section>

      <div className="grid gap-4 sm:grid-cols-[255px_1fr]">
        <button
          className="h-16 rounded-xl border border-[#cbd6e6] bg-white text-xl font-black text-[#061b42] shadow-[0_6px_16px_rgba(10,42,90,0.08)] transition hover:bg-[#f7fbff] focus-visible:ring-2 focus-visible:ring-[#0969f4] focus-visible:ring-offset-2 focus-visible:outline-none lg:h-[73px]"
          onClick={onPrevious}
          type="button"
        >
          이전 단계
        </button>
        <button
          className="flex h-16 items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-[#0969f4] to-[#0064ec] text-xl font-black text-white shadow-[0_10px_22px_rgba(9,105,244,0.26)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#0969f4] focus-visible:ring-offset-2 focus-visible:outline-none lg:h-[73px]"
          onClick={onComplete}
          type="button"
        >
          설정 완료하고 시작하기 🎉
          <ChevronRight size={24} />
        </button>
      </div>
    </aside>
  )
}

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#061b42] via-[#08295a] to-[#041936] text-[#d8e4f5]">
      <div className="mx-auto grid min-h-[78px] w-[calc(100%_-_32px)] max-w-[1840px] items-center gap-5 py-5 text-sm font-semibold lg:w-[calc(100%_-_110px)] xl:grid-cols-[225px_1fr_650px]">
        <Logo compact />
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[#b9c8dc]">
          <span>(주)메트로픽</span>
          <span>대표이사: 김지현</span>
          <span>사업자등록번호: 123-45-67890</span>
          <span>통신판매업신고: 2024-광주동구-0123</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[#b9c8dc] xl:justify-end">
          <span className="flex items-center gap-2">
            <Phone size={15} />
            062-123-4567
          </span>
          <span className="flex items-center gap-2">
            <Mail size={15} />
            contact@metropick.ai
          </span>
          <span>© 2024 MetroPick Inc. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}

function buildPayload(setup: NotificationSetup): NotificationPayload {
  return {
    ...setup,
    enabledNotificationLabels: setup.enabledNotificationIds.map(getNotificationLabel),
    channelLabels: setup.channels.map(getChannelLabel),
    frequencyLabel: getFrequencyLabel(setup.frequency),
  }
}

export function OnboardingNotificationsPage() {
  const navigate = useNavigate()
  const [setup, setSetup] = useState<NotificationSetup>(loadInitialSetup)
  const [notificationError, setNotificationError] = useState('')
  const [channelError, setChannelError] = useState('')

  const handleToggleNotification = (id: NotificationId) => {
    setNotificationError('')
    setSetup((current) => {
      const isActive = current.enabledNotificationIds.includes(id)

      return {
        ...current,
        enabledNotificationIds: isActive
          ? current.enabledNotificationIds.filter((item) => item !== id)
          : [...current.enabledNotificationIds, id],
      }
    })
  }

  const handleToggleChannel = (channel: NotificationChannel) => {
    setChannelError('')
    setSetup((current) => {
      const isActive = current.channels.includes(channel)

      return {
        ...current,
        channels: isActive
          ? current.channels.filter((item) => item !== channel)
          : [...current.channels, channel],
      }
    })
  }

  const handleComplete = () => {
    const nextNotificationError =
      setup.enabledNotificationIds.length === 0
        ? '최소 1개 이상의 알림을 활성화해 주세요.'
        : ''
    const nextChannelError =
      setup.channels.length === 0 ? '알림 방식을 최소 1개 이상 선택해 주세요.' : ''

    setNotificationError(nextNotificationError)
    setChannelError(nextChannelError)

    if (nextNotificationError || nextChannelError) {
      return
    }

    const notifications = buildPayload(setup)
    const stations = readStorageValue(STATION_STORAGE_KEY)
    const businessTypes = readStorageValue(BUSINESS_TYPE_STORAGE_KEY)

    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications))
    window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
    window.localStorage.setItem(
      ONBOARDING_SUMMARY_KEY,
      JSON.stringify({
        completedAt: new Date().toISOString(),
        stations,
        businessTypes,
        notifications,
      }),
    )

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#f7fbff] to-[#eef6ff] text-[#061b42]">
      <Header />

      <main className="relative overflow-hidden px-4 py-7 md:px-8 lg:px-[53px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-6 right-14 hidden h-32 w-[550px] text-[#0969f4] opacity-[0.12] xl:block"
        >
          <Train className="absolute top-6 right-0 h-24 w-[270px]" strokeWidth={1.2} />
        </div>

        <section className="relative z-10 grid gap-8 lg:grid-cols-[510px_1fr] lg:items-start">
          <div>
            <h1 className="text-[clamp(2.125rem,3vw,2.6875rem)] leading-none font-black tracking-[-0.05em] text-[#061b42]">
              알림 설정
            </h1>
            <p className="mt-3 text-base font-semibold text-[#4d5d78] md:text-lg">
              중요한 상권 변화와 예측 결과를 알림으로 받아보세요.
            </p>
          </div>
          <div className="overflow-x-auto pb-2">
            <Stepper />
          </div>
        </section>

        <section className="relative z-10 mt-7 grid gap-8 2xl:grid-cols-[minmax(0,1fr)_665px] 2xl:gap-[54px]">
          <div className="grid gap-3">
            <AlertListPanel
              enabledNotificationIds={setup.enabledNotificationIds}
              errorMessage={notificationError}
              onToggle={handleToggleNotification}
            />
            <MethodPanel
              channels={setup.channels}
              errorMessage={channelError}
              onToggle={handleToggleChannel}
            />
            <FrequencyPanel
              frequency={setup.frequency}
              onSelect={(frequency) => setSetup((current) => ({ ...current, frequency }))}
              quietHours={setup.quietHours}
            />
          </div>

          <SummaryPanel
            channels={setup.channels}
            enabledNotificationIds={setup.enabledNotificationIds}
            frequency={setup.frequency}
            onComplete={handleComplete}
            onPrevious={() => navigate('/onboarding/business-type')}
            quietHours={setup.quietHours}
          />
        </section>
      </main>

      <Footer />
    </div>
  )
}
