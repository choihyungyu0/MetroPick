import { useMemo, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Briefcase,
  Check,
  ChevronRight,
  Coffee,
  Dumbbell,
  FileText,
  GraduationCap,
  Info,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
  Pill,
  Scissors,
  Store,
  Target,
  Train,
  Users,
  Utensils,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { landingAssets } from '@/shared/assets/landingAssets'

type BusinessTypeId =
  | 'cafe-dessert'
  | 'restaurant'
  | 'convenience-store'
  | 'pharmacy'
  | 'beauty-salon'
  | 'academy'
  | 'health-beauty'
  | 'life-service'

type BusinessTypeOption = {
  description: string
  icon: LucideIcon
  iconLabel: string
  id: BusinessTypeId
  label: string
}

type BusinessTypeSetup = {
  analysisGoal: string
  recommendationCriteria: string[]
  reportType: string
  selectedBusinessTypes: BusinessTypeId[]
}

type StationSetup = {
  radius?: string
  route?: string
  selectedStations?: string[]
}

const STORAGE_KEY = 'metropick-onboarding-business-types'
const STATION_STORAGE_KEY = 'metropick-onboarding-stations'
const MAX_SELECTIONS = 3

const analysisGoal = '매출 잠재력 예측 / 성장성 비교'
const recommendationCriteria = ['유동인구', '경쟁도', '생활인구']
const reportType = 'AI 매출 예측 리포트'

const businessTypeOptions: BusinessTypeOption[] = [
  {
    id: 'cafe-dessert',
    label: '카페/디저트',
    description: '소비 빈도 높음',
    icon: Coffee,
    iconLabel: '커피잔 아이콘',
  },
  {
    id: 'restaurant',
    label: '음식점',
    description: '배후 수요 다양',
    icon: Utensils,
    iconLabel: '음식점 아이콘',
  },
  {
    id: 'convenience-store',
    label: '편의점',
    description: '접근성 중요',
    icon: Store,
    iconLabel: '상점 아이콘',
  },
  {
    id: 'pharmacy',
    label: '약국',
    description: '필수 수요 안정',
    icon: Pill,
    iconLabel: '약 아이콘',
  },
  {
    id: 'beauty-salon',
    label: '미용실',
    description: '생활 밀착 업종',
    icon: Scissors,
    iconLabel: '가위 아이콘',
  },
  {
    id: 'academy',
    label: '학원',
    description: '교육 수요 기반',
    icon: GraduationCap,
    iconLabel: '학사모 아이콘',
  },
  {
    id: 'health-beauty',
    label: '헬스/뷰티',
    description: '건강 관심 증가',
    icon: Dumbbell,
    iconLabel: '덤벨 아이콘',
  },
  {
    id: 'life-service',
    label: '생활서비스',
    description: '수요 지속형 업종',
    icon: Briefcase,
    iconLabel: '가방 아이콘',
  },
]

const defaultSetup: BusinessTypeSetup = {
  selectedBusinessTypes: ['cafe-dessert', 'restaurant'],
  analysisGoal,
  recommendationCriteria,
  reportType,
}

const analysisPoints = [
  {
    title: '매출 변동',
    text: '시간대별·요일별 매출 추이를 AI로 예측합니다.',
    icon: BarChart3,
    tone: 'blue',
  },
  {
    title: '경쟁 점포 수',
    text: '주변 경쟁 점포 현황과 추이를 분석합니다.',
    icon: Users,
    tone: 'green',
  },
  {
    title: '유동인구 적합도',
    text: '유동인구 특성과 업종 적합도를 평가합니다.',
    icon: MapPin,
    tone: 'purple',
  },
] as const

const recommendCombos: Array<{
  businessTypeId: BusinessTypeId
  station: string
}> = [
  { businessTypeId: 'cafe-dessert', station: '상무역' },
  { businessTypeId: 'restaurant', station: '시청역' },
  { businessTypeId: 'convenience-store', station: '남광주역' },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isBusinessTypeId(value: unknown): value is BusinessTypeId {
  return (
    typeof value === 'string' && businessTypeOptions.some((option) => option.id === value)
  )
}

function getBusinessTypeOption(id: BusinessTypeId) {
  return businessTypeOptions.find((option) => option.id === id) ?? businessTypeOptions[0]!
}

function sanitizeSavedSetup(value: unknown): BusinessTypeSetup {
  if (!isRecord(value)) {
    return defaultSetup
  }

  const selectedBusinessTypes = Array.isArray(value.selectedBusinessTypes)
    ? value.selectedBusinessTypes.filter(isBusinessTypeId)
    : defaultSetup.selectedBusinessTypes

  return {
    selectedBusinessTypes: selectedBusinessTypes.length
      ? Array.from(new Set(selectedBusinessTypes)).slice(0, MAX_SELECTIONS)
      : defaultSetup.selectedBusinessTypes,
    analysisGoal:
      typeof value.analysisGoal === 'string'
        ? value.analysisGoal
        : defaultSetup.analysisGoal,
    recommendationCriteria: Array.isArray(value.recommendationCriteria)
      ? value.recommendationCriteria.filter(
          (criterion): criterion is string => typeof criterion === 'string',
        )
      : defaultSetup.recommendationCriteria,
    reportType:
      typeof value.reportType === 'string' ? value.reportType : defaultSetup.reportType,
  }
}

function loadInitialSetup(): BusinessTypeSetup {
  if (typeof window === 'undefined') {
    return defaultSetup
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? sanitizeSavedSetup(JSON.parse(saved)) : defaultSetup
  } catch {
    return defaultSetup
  }
}

function loadStationSetup(): StationSetup | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const saved = window.localStorage.getItem(STATION_STORAGE_KEY)
    if (!saved) {
      return null
    }

    const parsed: unknown = JSON.parse(saved)
    if (!isRecord(parsed)) {
      return null
    }

    return {
      radius: typeof parsed.radius === 'string' ? parsed.radius : undefined,
      route: typeof parsed.route === 'string' ? parsed.route : undefined,
      selectedStations: Array.isArray(parsed.selectedStations)
        ? parsed.selectedStations.filter(
            (station): station is string => typeof station === 'string',
          )
        : undefined,
    }
  } catch {
    return null
  }
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
          광주 2호선 기반에 따른 AI 상권 변화 예측 서비스
        </span>
      </span>
    </Link>
  )
}

function Header() {
  const navItems = ['서비스 소개', '상권 분석', 'AI 예측', '입지 추천', '리포트']

  return (
    <header className="relative z-20 bg-gradient-to-r from-[#061b42] via-[#082c62] to-[#03183b] text-white shadow-[0_8px_26px_rgba(2,20,58,0.22)]">
      <div className="mx-auto grid min-h-[88px] w-[calc(100%_-_32px)] max-w-[1840px] items-center gap-5 py-5 lg:w-[calc(100%_-_72px)] xl:grid-cols-[360px_1fr_350px] xl:py-0">
        <Logo />
        <nav
          aria-label="주요 메뉴"
          className="flex flex-wrap justify-center gap-x-7 gap-y-3 text-base font-extrabold lg:gap-x-12 2xl:gap-x-[78px]"
        >
          {navItems.map((item) => (
            <Link
              className="rounded-sm text-[#f7fbff] transition hover:text-[#53d7ff] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              key={item}
              to="/"
            >
              {item}
            </Link>
          ))}
        </nav>
        <div className="flex justify-center gap-3 xl:justify-end">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/70 bg-white/5 px-8 text-base font-black text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            to="/login"
          >
            로그인
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0573ff] to-[#0065ec] px-8 text-base font-black text-white shadow-[0_10px_22px_rgba(0,105,255,0.3)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
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
    { label: '분석 업종 설정', active: true },
    { label: '알림 설정' },
  ]

  return (
    <ol className="flex min-w-[640px] items-start justify-center md:min-w-0">
      {steps.map((step, index) => (
        <li className="flex items-start" key={step.label}>
          <div className="flex min-w-[116px] flex-col items-center">
            <span
              aria-current={step.active ? 'step' : undefined}
              className={[
                'flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white text-xl font-black',
                step.done
                  ? 'border-[#0969f4] bg-[#0969f4] text-white shadow-[0_8px_18px_rgba(9,105,244,0.24)]'
                  : step.active
                    ? 'border-[#0969f4] text-[#0969f4]'
                    : 'border-[#d0d8e6] text-[#b7c1d2]',
              ].join(' ')}
            >
              {step.done ? <Check size={22} strokeWidth={3} /> : index + 1}
            </span>
            <span
              className={[
                'mt-3 text-center text-sm font-black',
                step.active ? 'text-[#0969f4]' : 'text-[#6d7890]',
              ].join(' ')}
            >
              {step.label}
            </span>
          </div>
          {index !== steps.length - 1 ? (
            <span
              aria-hidden="true"
              className={[
                'mt-[22px] h-0.5 w-[135px]',
                step.done ? 'bg-[#0969f4]' : 'bg-[#d7deea]',
              ].join(' ')}
            />
          ) : null}
        </li>
      ))}
    </ol>
  )
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-[13px] border border-[#d2def0]/90 bg-white/95 px-5 py-5 shadow-[0_8px_22px_rgba(10,42,90,0.11)] lg:px-6">
      <h2 className="mb-4 text-2xl font-black tracking-[-0.03em] text-[#061b42]">
        {title}
      </h2>
      {children}
    </section>
  )
}

function IndustryCard({
  item,
  onToggle,
  selected,
}: {
  item: BusinessTypeOption
  onToggle: (id: BusinessTypeId) => void
  selected: boolean
}) {
  const Icon = item.icon

  return (
    <button
      aria-pressed={selected}
      className={[
        'relative flex min-h-[105px] items-center gap-4 rounded-[10px] border bg-white px-4 py-5 text-left transition hover:-translate-y-0.5 hover:border-[#7db3ff] focus-visible:ring-2 focus-visible:ring-[#0969f4] focus-visible:outline-none',
        selected
          ? 'border-2 border-[#0969f4] bg-gradient-to-br from-[#f9fcff] to-[#eef6ff] shadow-[0_6px_16px_rgba(9,105,244,0.1)]'
          : 'border-[#dbe4ef]',
      ].join(' ')}
      onClick={() => onToggle(item.id)}
      type="button"
    >
      <span
        aria-label={item.iconLabel}
        className={[
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
          selected ? 'bg-[#eef5ff] text-[#0969f4]' : 'bg-[#f7f9fc] text-[#92a0b2]',
        ].join(' ')}
      >
        <Icon size={30} strokeWidth={1.9} />
      </span>
      <span className="grid gap-2">
        <strong className="text-base font-black text-[#061b42]">{item.label}</strong>
        <span className="text-sm font-semibold text-[#62708a]">{item.description}</span>
      </span>
      {selected ? (
        <span className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#0969f4] text-white">
          <Check size={18} strokeWidth={3} />
        </span>
      ) : null}
    </button>
  )
}

function IndustrySection({
  errorMessage,
  onToggle,
  selectedBusinessTypes,
}: {
  errorMessage: string
  onToggle: (id: BusinessTypeId) => void
  selectedBusinessTypes: BusinessTypeId[]
}) {
  return (
    <Panel title="관심 업종 선택">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {businessTypeOptions.map((item) => (
          <IndustryCard
            item={item}
            key={item.id}
            onToggle={onToggle}
            selected={selectedBusinessTypes.includes(item.id)}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 text-sm font-bold text-[#8792a5] sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <Info size={16} />
          최대 3개 업종까지 선택 가능합니다.
        </p>
        <strong className="text-base text-[#0969f4]">
          {selectedBusinessTypes.length} / {MAX_SELECTIONS} 선택
        </strong>
      </div>
      {errorMessage ? (
        <p className="mt-3 rounded-lg border border-[#ffd1d1] bg-[#fff5f5] px-4 py-3 text-sm font-bold text-[#b42318]">
          {errorMessage}
        </p>
      ) : null}
    </Panel>
  )
}

function AnalysisSection() {
  const toneClass = {
    blue: 'bg-[#eef5ff] text-[#0969f4]',
    green: 'bg-[#e9fff6] text-[#13a77a]',
    purple: 'bg-[#f1edff] text-[#6d45eb]',
  } satisfies Record<(typeof analysisPoints)[number]['tone'], string>

  return (
    <Panel title="업종 분석 포인트">
      <div className="grid gap-4 xl:grid-cols-3">
        {analysisPoints.map((point) => {
          const Icon = point.icon

          return (
            <article
              className="flex min-h-24 items-center gap-4 rounded-xl border border-[#dbe4ef] bg-white px-5 py-4"
              key={point.title}
            >
              <span
                className={[
                  'flex h-14 w-14 shrink-0 items-center justify-center rounded-full',
                  toneClass[point.tone],
                ].join(' ')}
              >
                <Icon size={32} strokeWidth={1.9} />
              </span>
              <span>
                <strong className="text-base font-black text-[#061b42]">
                  {point.title}
                </strong>
                <p className="mt-2 text-sm leading-6 font-semibold text-[#55647c]">
                  {point.text}
                </p>
              </span>
            </article>
          )
        })}
      </div>
    </Panel>
  )
}

function RecommendSection({
  onApply,
}: {
  onApply: (businessTypeId: BusinessTypeId) => void
}) {
  return (
    <Panel title="추천 분석 조합">
      <div className="grid gap-4 xl:grid-cols-3">
        {recommendCombos.map((combo) => {
          const option = getBusinessTypeOption(combo.businessTypeId)
          const Icon = option.icon

          return (
            <button
              aria-label={`${option.label}와 ${combo.station} 추천 분석 조합 적용`}
              className="flex min-h-20 items-center gap-3 rounded-xl border-2 border-[#0969f4] bg-gradient-to-br from-white to-[#f1f8ff] px-4 py-3 text-left text-[#061b42] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(9,105,244,0.12)] focus-visible:ring-2 focus-visible:ring-[#0969f4] focus-visible:outline-none"
              key={`${option.id}-${combo.station}`}
              onClick={() => onApply(option.id)}
              type="button"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef5ff] text-[#0969f4]">
                <Icon size={30} />
              </span>
              <strong className="font-black">{option.label}</strong>
              <span className="font-black text-[#0969f4]">+</span>
              <span className="font-extrabold text-[#45556f]">{combo.station}</span>
              <em className="ml-auto rounded-lg border border-[#cfe2ff] bg-[#eef5ff] px-3 py-2 text-sm font-black not-italic text-[#0969f4]">
                추천
              </em>
            </button>
          )
        })}
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#8792a5]">
        <Info size={16} />
        추천 조합을 클릭하면 관심 지역과 함께 분석을 빠르게 설정할 수 있습니다.
      </p>
    </Panel>
  )
}

function TagGroup({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => (
        <span
          className="rounded-lg border border-[#b9d5ff] bg-[#f3f8ff] px-3.5 py-2 text-sm font-black text-[#0969f4]"
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
    <div className="grid min-h-[77px] grid-cols-[48px_1fr] items-center gap-4 border-b border-[#dbe4ef] px-5 py-4 last:border-b-0">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef5ff] text-[#0969f4]">
        <Icon size={24} />
      </span>
      <div className="grid gap-2 xl:grid-cols-[170px_1fr] xl:items-center">
        <strong className="text-base font-black text-[#061b42]">{title}</strong>
        <div>{children}</div>
      </div>
    </div>
  )
}

function SummaryPanel({
  onNext,
  onPrevious,
  selectedLabels,
  stationSetup,
}: {
  onNext: () => void
  onPrevious: () => void
  selectedLabels: string[]
  stationSetup: StationSetup | null
}) {
  return (
    <aside className="flex flex-col gap-6">
      <section className="rounded-[13px] border border-[#d2def0]/90 bg-white/95 px-5 py-6 shadow-[0_8px_22px_rgba(10,42,90,0.11)] lg:px-7">
        <h2 className="text-2xl font-black tracking-[-0.03em] text-[#061b42]">
          나의 업종 설정
        </h2>
        <p className="mt-2 text-sm font-bold text-[#6c7890]">
          선택한 업종과 분석 방향을 확인해 주세요.
        </p>

        {stationSetup ? null : (
          <p className="mt-4 rounded-lg border border-[#d6e5f7] bg-[#f6fbff] px-4 py-3 text-sm font-bold text-[#53637a]">
            이전 단계 설정 정보가 없어 기본값으로 표시됩니다.
          </p>
        )}

        <div className="mt-5 overflow-hidden rounded-xl border border-[#dbe4ef] bg-white">
          <SummaryRow icon={Train} title="선택 업종">
            <TagGroup labels={selectedLabels} />
          </SummaryRow>
          <SummaryRow icon={Target} title="분석 목표">
            <p className="text-base font-extrabold text-[#1d2b44]">{analysisGoal}</p>
          </SummaryRow>
          <SummaryRow icon={BarChart3} title="추천 분석 기준">
            <TagGroup labels={recommendationCriteria} />
          </SummaryRow>
          <SummaryRow icon={FileText} title="예상 리포트 유형">
            <p className="text-base font-extrabold text-[#1d2b44]">{reportType}</p>
          </SummaryRow>
        </div>

        <section className="mt-5 rounded-xl bg-gradient-to-br from-[#eef6ff] to-[#e6f1ff] px-5 py-5">
          <h3 className="flex items-center gap-2 text-base font-black text-[#0969f4]">
            <Lightbulb size={22} />
            선택 업종 활용 예시
          </h3>
          <ul className="mt-4 grid gap-3 text-sm leading-6 font-bold text-[#43526b]">
            {[
              '카페/디저트: 유동인구가 많은 중심상권에서 매출 상승 가능성이 높아요.',
              '음식점: 배후 주거지와 오피스 밀집 지역에서 안정적 수요가 예상돼요.',
              '편의점: 역세권·주거지 인접 지역에서 접근성과 수요가 핵심이에요.',
            ].map((item) => (
              <li className="flex items-start gap-2" key={item}>
                <Check className="mt-1 shrink-0 text-[#0969f4]" size={17} />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </section>

      <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
        <button
          className="h-16 rounded-[13px] border border-[#cbd6e6] bg-white text-xl font-black text-[#071a3d] shadow-[0_6px_16px_rgba(10,42,90,0.08)] transition hover:bg-[#f7fbff] focus-visible:ring-2 focus-visible:ring-[#0969f4] focus-visible:ring-offset-2 focus-visible:outline-none lg:h-[78px]"
          onClick={onPrevious}
          type="button"
        >
          이전 단계
        </button>
        <button
          className="flex h-16 items-center justify-center gap-3 rounded-[13px] bg-gradient-to-br from-[#0969f4] to-[#0064ec] text-xl font-black text-white shadow-[0_10px_22px_rgba(9,105,244,0.25)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#0969f4] focus-visible:ring-offset-2 focus-visible:outline-none lg:h-[78px]"
          onClick={onNext}
          type="button"
        >
          다음: 알림 설정
          <ChevronRight size={26} />
        </button>
      </div>
    </aside>
  )
}

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#061b42] via-[#08295a] to-[#041936] text-[#d8e4f5]">
      <div className="mx-auto grid min-h-[78px] w-[calc(100%_-_32px)] max-w-[1840px] items-center gap-5 py-5 text-sm font-semibold lg:w-[calc(100%_-_96px)] xl:grid-cols-[230px_1fr_650px]">
        <Logo compact />
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[#b9c8dc]">
          <span>(주)메트로픽</span>
          <span>대표이사: 김지현</span>
          <span>사업자등록번호: 123-45-67890</span>
          <span>통신판매업신고: 2024-광주동구-0123</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[#b9c8dc] xl:justify-end">
          <span className="flex items-center gap-2">
            <Phone size={16} />
            062-123-4567
          </span>
          <span className="flex items-center gap-2">
            <Mail size={16} />
            contact@metropick.ai
          </span>
          <span>© 2024 MetroPick Inc. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}

export function OnboardingBusinessTypePage() {
  const navigate = useNavigate()
  const stationSetup = useMemo(() => loadStationSetup(), [])
  const [setup, setSetup] = useState<BusinessTypeSetup>(loadInitialSetup)
  const [errorMessage, setErrorMessage] = useState('')

  const selectedLabels = setup.selectedBusinessTypes.map(
    (id) => getBusinessTypeOption(id).label,
  )

  const handleToggleBusinessType = (id: BusinessTypeId) => {
    setErrorMessage('')
    setSetup((current) => {
      const isSelected = current.selectedBusinessTypes.includes(id)

      if (isSelected) {
        return {
          ...current,
          selectedBusinessTypes: current.selectedBusinessTypes.filter(
            (item) => item !== id,
          ),
        }
      }

      if (current.selectedBusinessTypes.length >= MAX_SELECTIONS) {
        return current
      }

      return {
        ...current,
        selectedBusinessTypes: [...current.selectedBusinessTypes, id],
      }
    })
  }

  const handleApplyRecommendation = (id: BusinessTypeId) => {
    setErrorMessage('')
    setSetup((current) => {
      if (current.selectedBusinessTypes.includes(id)) {
        return current
      }

      if (current.selectedBusinessTypes.length >= MAX_SELECTIONS) {
        return current
      }

      return {
        ...current,
        selectedBusinessTypes: [...current.selectedBusinessTypes, id],
      }
    })
  }

  const handleNext = () => {
    if (setup.selectedBusinessTypes.length === 0) {
      setErrorMessage('분석할 업종을 최소 1개 이상 선택해 주세요.')
      return
    }

    const savedShape = {
      selectedBusinessTypes: setup.selectedBusinessTypes,
      selectedBusinessLabels: selectedLabels,
      analysisGoal: setup.analysisGoal,
      recommendationCriteria: setup.recommendationCriteria,
      reportType: setup.reportType,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedShape))
    navigate('/onboarding/notifications')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#f7fbff] to-[#eef6ff] text-[#071a3d]">
      <Header />

      <main className="relative overflow-hidden px-4 py-7 md:px-8 lg:px-11">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-8 right-10 hidden h-32 w-[530px] text-[#0567dd] opacity-[0.13] xl:block"
        >
          <Train className="absolute top-6 right-0 h-24 w-64" strokeWidth={1.2} />
        </div>

        <section className="relative z-10 grid gap-8 lg:grid-cols-[480px_1fr] lg:items-start">
          <div>
            <h1 className="text-[clamp(2rem,3vw,2.625rem)] leading-none font-black tracking-[-0.05em] text-[#061b42]">
              분석 업종 설정
            </h1>
            <p className="mt-3 text-base font-semibold text-[#4b5d78] md:text-lg">
              분석하고 싶은 업종을 선택해 맞춤형 AI 예측을 준비해 주세요.
            </p>
          </div>
          <div className="overflow-x-auto pb-2">
            <Stepper />
          </div>
        </section>

        <section className="relative z-10 mt-7 grid gap-7 2xl:grid-cols-[minmax(0,1fr)_670px]">
          <div className="grid gap-3">
            <IndustrySection
              errorMessage={errorMessage}
              onToggle={handleToggleBusinessType}
              selectedBusinessTypes={setup.selectedBusinessTypes}
            />
            <AnalysisSection />
            <RecommendSection onApply={handleApplyRecommendation} />
          </div>

          <SummaryPanel
            onNext={handleNext}
            onPrevious={() => navigate('/onboarding/stations')}
            selectedLabels={selectedLabels}
            stationSetup={stationSetup}
          />
        </section>
      </main>

      <Footer />
    </div>
  )
}
