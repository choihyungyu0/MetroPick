import { useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  Coffee,
  GraduationCap,
  MapPin,
  Pill,
  Scissors,
  Store,
  TrainFront,
  Utensils,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { AppFooter } from '@/shared/components/AppFooter'
import { TopNavigation } from '@/shared/components/TopNavigation'
import { onboardingAssets } from '@/shared/assets/onboardingAssets'

type InitialSetupState = {
  alertSettings: string[]
  selectedIndustries: string[]
  selectedRegion: string
  selectedStations: string[]
}

type IndustryOption = {
  icon: LucideIcon
  label: string
}

type AlertOption = {
  desc: string
  icon: LucideIcon
  title: string
}

const regions = ['광주광역시 전체', '북구', '서구', '동구', '남구', '광산구']
const stations = ['시청역', '백운광장역', '광주역', '남광주역', '첨단역', '더보기']

const industries: IndustryOption[] = [
  { label: '카페', icon: Coffee },
  { label: '편의점', icon: Store },
  { label: '음식점', icon: Utensils },
  { label: '약국', icon: Pill },
  { label: '미용실', icon: Scissors },
  { label: '학원', icon: GraduationCap },
]

const alerts: AlertOption[] = [
  {
    title: '개통 일정 변경 알림',
    desc: '광주 2호선 개통 일정 및 관련 변경 사항을 알려드려요.',
    icon: CalendarDays,
  },
  {
    title: '예상 매출 변동 알림',
    desc: '선택한 역세권의 예상 매출 변동을 정기적으로 알려드려요.',
    icon: BarChart3,
  },
  {
    title: '추천 입지 업데이트',
    desc: '새로운 추천 입지나 분석 리포트가 등록되면 알려드려요.',
    icon: Bell,
  },
]

const initialSetupState: InitialSetupState = {
  selectedRegion: '광주광역시 전체',
  selectedStations: ['시청역', '백운광장역', '남광주역'],
  selectedIndustries: ['카페', '음식점'],
  alertSettings: alerts.map((alert) => alert.title),
}

function StepProgress() {
  const steps = ['관심 지역 설정', '관심 역세권 설정', '분석 업종 설정', '알림 설정']

  return (
    <ol className="relative flex min-w-[640px] items-start justify-center pt-1 md:min-w-0">
      {steps.map((step, index) => (
        <li className="relative flex w-40 flex-col items-center" key={step}>
          <span
            className={[
              'relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 text-lg font-black',
              index === 0
                ? 'border-[#096bff] bg-white text-[#096bff] shadow-[0_10px_24px_rgba(9,107,255,0.22)]'
                : 'border-[#cad8e8] bg-white text-[#7b889c]',
            ].join(' ')}
            aria-current={index === 0 ? 'step' : undefined}
          >
            {index + 1}
          </span>
          <span className="mt-3 text-center text-sm font-black text-[#1e2e49]">
            {step}
          </span>
          {index < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute top-5 left-[100px] h-px w-[120px] bg-[#cad8e8]"
            />
          ) : null}
        </li>
      ))}
    </ol>
  )
}

function ChoiceButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      aria-pressed={active}
      className={[
        'inline-flex h-12 min-w-[112px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[11px] border px-5 text-sm font-black transition focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:outline-none md:text-[15px]',
        active
          ? 'border-2 border-[#096bff] bg-[#f7fbff] text-[#096bff] shadow-[0_8px_20px_rgba(9,107,255,0.08)]'
          : 'border-[#d5e0ec] bg-white text-[#526177] hover:bg-slate-50',
      ].join(' ')}
      onClick={onClick}
      type="button"
    >
      {children}
      {active ? (
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#096bff] text-white">
          <Check size={13} strokeWidth={3} />
        </span>
      ) : null}
    </button>
  )
}

function IndustryCard({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-pressed={active}
      className={[
        'relative grid h-[104px] place-items-center content-center gap-2 rounded-[11px] border bg-white text-[#11284c] transition focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:outline-none',
        active
          ? 'border-2 border-[#096bff] bg-gradient-to-b from-white to-[#f5faff] shadow-[0_10px_24px_rgba(9,107,255,0.08)]'
          : 'border-[#d5e0ec] hover:bg-slate-50',
      ].join(' ')}
      onClick={onClick}
      type="button"
    >
      {active ? (
        <span className="absolute top-3 right-3 grid h-5 w-5 place-items-center rounded-full bg-[#096bff] text-white">
          <Check size={13} strokeWidth={3} />
        </span>
      ) : null}
      <Icon className="text-[#0b4a99]" size={34} strokeWidth={1.8} />
      <span className="whitespace-nowrap text-sm font-black text-[#1a2e51] md:text-[15px]">
        {label}
      </span>
    </button>
  )
}

function ToggleRow({
  active,
  desc,
  icon: Icon,
  onClick,
  title,
}: {
  active: boolean
  desc: string
  icon: LucideIcon
  onClick: () => void
  title: string
}) {
  return (
    <div className="grid min-h-14 grid-cols-[42px_1fr] items-center gap-3 border-b border-[#edf2f7] bg-white px-5 py-2.5 last:border-b-0 sm:grid-cols-[42px_1fr_72px] sm:pr-7">
      <div className="flex justify-center text-[#096bff]">
        <Icon size={25} strokeWidth={2} />
      </div>
      <div>
        <strong className="block text-base font-black tracking-[-0.02em] text-[#0c1e3c]">
          {title}
        </strong>
        <p className="mt-1 text-xs font-semibold text-[#6f7c90] md:text-[13px]">{desc}</p>
      </div>
      <button
        aria-label={`${title} 토글`}
        aria-pressed={active}
        className={[
          'grid h-[26px] w-[50px] items-center rounded-full p-[3px] transition sm:justify-self-end',
          active ? 'bg-[#096bff]' : 'bg-[#c8d4e2]',
        ].join(' ')}
        onClick={onClick}
        type="button"
      >
        <span
          className={[
            'block h-5 w-5 rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.18)] transition',
            active ? 'translate-x-6' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

function SetupSection({
  children,
  desc,
  number,
  title,
}: {
  children: ReactNode
  desc: string
  number: string
  title: string
}) {
  return (
    <section className="grid gap-5 rounded-2xl border border-[#dce9f7] bg-white/95 px-5 py-6 shadow-[0_14px_38px_rgba(14,59,116,0.07)] lg:grid-cols-[288px_1fr] lg:items-center lg:px-8 lg:py-6">
      <div className="grid min-h-16 grid-cols-[44px_1fr] gap-3 border-b border-[#dbe5f1] pb-5 lg:border-r lg:border-b-0 lg:pr-5 lg:pb-0">
        <span className="text-2xl leading-none font-black text-[#096bff]">{number}</span>
        <div>
          <h2 className="text-xl font-black tracking-[-0.03em] text-[#0a1834]">
            {title}
          </h2>
          <p className="mt-2 text-[13px] leading-5 font-semibold text-[#6a7688]">
            {desc}
          </p>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function SummaryItem({
  children,
  icon: Icon,
  title,
}: {
  children: ReactNode
  icon: LucideIcon
  title: string
}) {
  return (
    <article className="grid grid-cols-[42px_1fr_52px] gap-3 border-b border-[#edf2f7] px-4 py-4 last:border-b-0">
      <div className="flex justify-center pt-1 text-[#096bff]">
        <Icon size={27} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <strong className="block text-base font-black text-[#0b1d3a]">{title}</strong>
        <div className="mt-2">{children}</div>
      </div>
      <button
        className="h-9 rounded-lg border border-[#d4dfec] bg-[#fbfdff] text-sm font-bold text-[#465872] transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:outline-none"
        type="button"
      >
        수정
      </button>
    </article>
  )
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          className="inline-flex min-h-6 items-center rounded-full border border-[#dce6f1] bg-[#f2f6fb] px-2.5 text-xs font-extrabold text-[#53637a]"
          key={item}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function SummaryPanel({
  alertSettings,
  onComplete,
  selectedIndustries,
  selectedRegion,
  selectedStations,
}: InitialSetupState & { onComplete: () => void }) {
  return (
    <aside className="rounded-2xl border border-[#dce9f7] bg-white/95 px-5 py-6 shadow-[0_18px_52px_rgba(14,59,116,0.1)] lg:px-6">
      <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#07152f]">
        나의 설정 요약
      </h2>
      <p className="mt-2 text-sm font-semibold text-[#67758a]">
        설정한 정보를 확인해주세요.
      </p>

      <div className="mt-5 overflow-hidden rounded-xl border border-[#dce8f5] bg-white">
        <SummaryItem icon={MapPin} title="관심 지역">
          <p className="text-sm font-semibold text-[#5d6b80]">{selectedRegion}</p>
        </SummaryItem>
        <SummaryItem icon={TrainFront} title="관심 역세권">
          <TagList items={selectedStations} />
        </SummaryItem>
        <SummaryItem icon={Store} title="분석 업종">
          <TagList items={selectedIndustries} />
        </SummaryItem>
        <SummaryItem icon={Bell} title="알림 설정">
          <div className="grid gap-1.5">
            {alertSettings.map((item) => (
              <p
                className="flex items-center gap-1.5 text-xs font-bold text-[#58677d]"
                key={item}
              >
                <CircleCheck className="text-[#11b3a3]" size={15} />
                {item}
              </p>
            ))}
          </div>
        </SummaryItem>
      </div>

      <section className="mt-4 rounded-xl border border-[#cfe1f5] bg-gradient-to-b from-[#f3f9ff] to-[#eaf4ff] px-5 py-4">
        <h3 className="flex items-center gap-2 text-base font-black tracking-[-0.02em] text-[#0a4ba3]">
          <Clock3 size={18} />
          잠깐! 이런 혜택을 받아보세요
        </h3>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-sm leading-6 font-bold text-[#28405f]">
          <li>맞춤형 AI 상권 분석 리포트 제공</li>
          <li>선택한 지역의 개통 영향 예측</li>
          <li>관심 업종 맞춤 입지 추천</li>
        </ul>
      </section>

      <button
        className="mt-5 flex h-16 w-full items-center justify-center gap-4 rounded-lg bg-gradient-to-r from-[#096bff] to-[#0058f5] text-lg font-black text-white shadow-[0_16px_28px_rgba(9,107,255,0.22)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:ring-offset-2 focus-visible:outline-none"
        onClick={onComplete}
        type="button"
      >
        설정 완료하고 시작하기
        <ArrowRight size={24} />
      </button>
    </aside>
  )
}

function OnboardingNavigationActions() {
  const actionClasses =
    'inline-flex h-11 items-center justify-center rounded-lg px-6 text-sm font-black transition focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none'

  return (
    <>
      <Link
        className={`${actionClasses} min-w-[112px] border border-white/45 bg-slate-950/25 text-white hover:bg-white/10`}
        to="/login"
      >
        로그인
      </Link>
      <Link
        className={`${actionClasses} min-w-[170px] bg-[#086bff] text-white shadow-[0_12px_24px_rgba(0,102,255,0.24)] hover:bg-[#0054dc]`}
        to="/signup"
      >
        무료로 시작하기
      </Link>
    </>
  )
}

export function OnboardingInitialSetupPage() {
  const navigate = useNavigate()
  const [selectedRegion, setSelectedRegion] = useState(initialSetupState.selectedRegion)
  const [selectedStations, setSelectedStations] = useState(
    initialSetupState.selectedStations,
  )
  const [selectedIndustries, setSelectedIndustries] = useState(
    initialSetupState.selectedIndustries,
  )
  const [alertSettings, setAlertSettings] = useState(initialSetupState.alertSettings)

  const toggleStation = (station: string) => {
    if (station === '더보기') {
      return
    }

    setSelectedStations((current) =>
      current.includes(station)
        ? current.filter((item) => item !== station)
        : [...current, station],
    )
  }

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((current) =>
      current.includes(industry)
        ? current.filter((item) => item !== industry)
        : [...current, industry],
    )
  }

  const toggleAlert = (alertTitle: string) => {
    setAlertSettings((current) =>
      current.includes(alertTitle)
        ? current.filter((item) => item !== alertTitle)
        : [...current, alertTitle],
    )
  }

  const handleComplete = () => {
    window.localStorage.setItem(
      'metropick-onboarding-initial',
      JSON.stringify({
        alertSettings,
        selectedIndustries,
        selectedRegion,
        selectedStations,
      }),
    )
    navigate('/onboarding/stations')
  }

  return (
    <div className="onboarding-initial-page flex min-h-screen flex-col overflow-x-clip bg-[#f6fbff] text-[#07152f]">
      <TopNavigation renderActions={OnboardingNavigationActions} />

      <main className="relative flex-1 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.78) 30%, rgba(255,255,255,0.96) 60%, #ffffff 100%), url(${onboardingAssets.initialSetupTrainBg})`,
            backgroundPosition: 'left bottom',
            backgroundSize: 'auto 84%',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(46,154,255,0.10),transparent_26%),radial-gradient(circle_at_78%_20%,rgba(0,210,214,0.08),transparent_24%)]" />

        <div className="relative z-10 mx-auto w-[calc(100%_-_32px)] max-w-[1720px] pt-8 pb-2 lg:w-[calc(100%_-_80px)]">
          <section className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start xl:gap-14">
            <div className="min-w-0">
              <section className="grid gap-8 xl:grid-cols-[minmax(280px,1fr)_720px] xl:items-start">
                <div>
                  <h1 className="text-[clamp(2.5rem,3vw,3rem)] leading-none font-black tracking-[-0.05em] text-[#07152f]">
                    초기 설정
                  </h1>
                  <p className="mt-4 text-base font-semibold text-[#53637a] md:text-lg">
                    맞춤형 AI 분석과 예측을 위해 선호 정보를 설정해주세요.
                  </p>
                </div>
                <div className="overflow-x-auto pb-2">
                  <StepProgress />
                </div>
              </section>

              <div className="mt-6 grid gap-3">
                <SetupSection
                  desc="분석을 원하는 지역을 선택해주세요."
                  number="01"
                  title="관심 지역 선택"
                >
                  <div className="flex flex-wrap gap-3">
                    {regions.map((region) => (
                      <ChoiceButton
                        active={selectedRegion === region}
                        key={region}
                        onClick={() => setSelectedRegion(region)}
                      >
                        {region}
                      </ChoiceButton>
                    ))}
                  </div>
                </SetupSection>

                <SetupSection
                  desc="분석을 원하는 역세권을 선택해주세요."
                  number="02"
                  title="관심 역세권 선택"
                >
                  <div className="flex flex-wrap gap-3">
                    {stations.map((station) => {
                      const isActive = selectedStations.includes(station)
                      const isMore = station === '더보기'

                      return (
                        <ChoiceButton
                          active={isActive}
                          key={station}
                          onClick={() => toggleStation(station)}
                        >
                          {station}
                          {isMore ? <ChevronDown size={16} /> : null}
                        </ChoiceButton>
                      )
                    })}
                  </div>
                </SetupSection>

                <SetupSection
                  desc="관심 있는 업종을 선택해주세요."
                  number="03"
                  title="분석 업종 선택"
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                    {industries.map((industry) => (
                      <IndustryCard
                        active={selectedIndustries.includes(industry.label)}
                        icon={industry.icon}
                        key={industry.label}
                        label={industry.label}
                        onClick={() => toggleIndustry(industry.label)}
                      />
                    ))}
                  </div>
                  <button
                    className="mt-3 inline-flex items-center gap-1 text-sm font-black text-[#096bff] focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:outline-none"
                    type="button"
                  >
                    더 많은 업종 보기
                    <ChevronDown size={15} />
                  </button>
                </SetupSection>

                <SetupSection
                  desc="중요한 정보를 놓치지 않도록 알림을 설정하세요."
                  number="04"
                  title="알림 설정"
                >
                  <div className="overflow-hidden rounded-xl border border-[#e2eaf3] bg-white">
                    {alerts.map((alert) => (
                      <ToggleRow
                        active={alertSettings.includes(alert.title)}
                        desc={alert.desc}
                        icon={alert.icon}
                        key={alert.title}
                        onClick={() => toggleAlert(alert.title)}
                        title={alert.title}
                      />
                    ))}
                  </div>
                </SetupSection>
              </div>
            </div>

            <div className="xl:pt-4">
              <SummaryPanel
                alertSettings={alertSettings}
                onComplete={handleComplete}
                selectedIndustries={selectedIndustries}
                selectedRegion={selectedRegion}
                selectedStations={selectedStations}
              />
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
