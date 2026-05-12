import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { landingAssets } from '@/shared/assets/landingAssets'

type RadiusOption = '300m' | '500m' | '1km'

type OnboardingStationSetup = {
  route: string
  selectedStations: string[]
  radius: RadiusOption
}

const STORAGE_KEY = 'metropick-onboarding-stations'
const ONBOARDING_BUSINESS_TYPE_ROUTE = '/onboarding/business-type'

const routeOptions = ['광주 2호선(예정)', '광주 1호선 비교']
const radiusOptions: RadiusOption[] = ['300m', '500m', '1km']
const availableStations = [
  '시청역',
  '상무역',
  '백운광장역',
  '남광주역',
  '운천역',
  '금남로5가역',
  '광주역',
  '첨단지구역',
]

const defaultSetup: OnboardingStationSetup = {
  route: '광주 2호선(예정)',
  selectedStations: ['시청역', '상무역', '백운광장역', '남광주역'],
  radius: '500m',
}

const stationPreviewPositions: Record<string, { x: number; y: number }> = {
  시청역: { x: 34, y: 36 },
  상무역: { x: 47, y: 29 },
  백운광장역: { x: 55, y: 60 },
  남광주역: { x: 68, y: 71 },
  운천역: { x: 28, y: 50 },
  금남로5가역: { x: 62, y: 45 },
  광주역: { x: 74, y: 31 },
  첨단지구역: { x: 42, y: 18 },
}

const stepItems = [
  { label: '관심 지역 설정', status: 'completed' },
  { label: '관심 역세권 설정', status: 'active' },
  { label: '분석 업종 설정', status: 'inactive' },
  { label: '알림 설정', status: 'inactive' },
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isRadiusOption(value: unknown): value is RadiusOption {
  return radiusOptions.includes(value as RadiusOption)
}

function sanitizeSavedSetup(value: unknown): OnboardingStationSetup {
  if (!isRecord(value)) {
    return defaultSetup
  }

  const savedStations = Array.isArray(value.selectedStations)
    ? value.selectedStations.filter(
        (station): station is string =>
          typeof station === 'string' && availableStations.includes(station),
      )
    : defaultSetup.selectedStations

  return {
    route: typeof value.route === 'string' ? value.route : defaultSetup.route,
    selectedStations: savedStations.length
      ? Array.from(new Set(savedStations)).slice(0, 5)
      : defaultSetup.selectedStations,
    radius: isRadiusOption(value.radius) ? value.radius : defaultSetup.radius,
  }
}

function loadInitialSetup(): OnboardingStationSetup {
  if (typeof window === 'undefined') {
    return defaultSetup
  }

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    return defaultSetup
  }

  try {
    return sanitizeSavedSetup(JSON.parse(saved) as unknown)
  } catch {
    return defaultSetup
  }
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="flex items-center gap-3" to="/" aria-label="MetroPick AI 홈">
      <img
        alt="MetroPick AI 로고"
        className={[
          'shrink-0 scale-[1.75] object-contain',
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
          광주 2호선 개통의 미래, AI 상권 분석 예측 서비스
        </span>
      </span>
    </Link>
  )
}

function Header() {
  return (
    <header className="relative z-10 bg-gradient-to-r from-[#061a3d] via-[#071f4b] to-[#052b67] text-white">
      <div className="mx-auto grid min-h-[82px] w-[calc(100%_-_32px)] max-w-[1840px] items-center gap-5 py-5 lg:w-[calc(100%_-_64px)] xl:grid-cols-[360px_1fr_330px] xl:py-0">
        <Logo />
        <nav
          className="flex flex-wrap justify-center gap-x-7 gap-y-3 text-base font-black tracking-[-0.02em] lg:gap-x-12 xl:gap-x-16 xl:text-lg"
          aria-label="주요 메뉴"
        >
          {['서비스 소개', '상권 분석', 'AI 예측', '입지 추천', '리포트'].map((item) => (
            <a
              className="rounded-sm transition hover:text-[#42e5df] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              href="/"
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="flex justify-center gap-3 xl:justify-end">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/55 bg-white/5 px-7 font-black transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            to="/login"
          >
            로그인
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-[#096bff] to-[#0058f5] px-7 font-black shadow-[0_14px_24px_rgba(0,100,255,0.23)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
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
  return (
    <ol className="relative grid min-w-[640px] grid-cols-4 pt-1 before:absolute before:top-[23px] before:right-[72px] before:left-[72px] before:h-px before:bg-[#cad8e8] before:content-['']">
      {stepItems.map((step, index) => (
        <li className="relative grid justify-items-center gap-2.5" key={step.label}>
          <span
            className={[
              'relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 text-lg font-black',
              step.status === 'completed'
                ? 'border-[#13bfae] bg-[#13bfae] text-white shadow-[0_10px_24px_rgba(19,191,174,0.2)]'
                : '',
              step.status === 'active'
                ? 'border-[#096bff] bg-[#096bff] text-white shadow-[0_10px_24px_rgba(9,107,255,0.22)]'
                : '',
              step.status === 'inactive'
                ? 'border-[#cad8e8] bg-white text-[#7b889c]'
                : '',
            ].join(' ')}
            aria-current={step.status === 'active' ? 'step' : undefined}
          >
            {step.status === 'completed' ? '✓' : index + 1}
          </span>
          <span className="text-center text-sm font-black text-[#1e2e49]">
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  )
}

function BackgroundTrain() {
  return (
    <div className="pointer-events-none absolute top-32 left-[-110px] h-[540px] w-[510px] opacity-50 lg:opacity-80">
      <img
        alt=""
        aria-hidden="true"
        className="h-full w-full object-contain object-left-top"
        draggable={false}
        src={landingAssets.heroTrainBg}
      />
    </div>
  )
}

function StationButton({
  isSelected,
  onClick,
  station,
}: {
  isSelected: boolean
  onClick: () => void
  station: string
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={[
        'relative h-12 rounded-xl border px-4 text-sm font-black transition focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:ring-offset-2 focus-visible:outline-none sm:text-base',
        isSelected
          ? 'border-2 border-[#096bff] bg-[#f7fbff] text-[#096bff] shadow-[0_8px_20px_rgba(9,107,255,0.08)]'
          : 'border-[#d5e0ec] bg-white text-[#526177] hover:border-[#96b9e9]',
      ].join(' ')}
      onClick={onClick}
      type="button"
    >
      {station}
      {isSelected ? (
        <span className="ml-2 inline-grid h-5 w-5 place-items-center rounded-full bg-[#096bff] text-xs text-white">
          ✓
        </span>
      ) : null}
    </button>
  )
}

function RadiusButton({
  isSelected,
  onClick,
  radius,
}: {
  isSelected: boolean
  onClick: () => void
  radius: RadiusOption
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={[
        'h-12 rounded-xl border px-5 text-base font-black transition focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:ring-offset-2 focus-visible:outline-none',
        isSelected
          ? 'border-2 border-[#096bff] bg-[#f7fbff] text-[#096bff] shadow-[0_8px_20px_rgba(9,107,255,0.08)]'
          : 'border-[#d5e0ec] bg-white text-[#526177] hover:border-[#96b9e9]',
      ].join(' ')}
      onClick={onClick}
      type="button"
    >
      {radius}
    </button>
  )
}

function SelectedStationMap({ selectedStations }: { selectedStations: string[] }) {
  const visibleStations = selectedStations
    .map((station) => ({ station, position: stationPreviewPositions[station] }))
    .filter((item): item is { station: string; position: { x: number; y: number } } =>
      Boolean(item.position),
    )

  return (
    <section className="rounded-2xl border border-[#dce9f7] bg-white p-5 shadow-[0_14px_38px_rgba(14,59,116,0.06)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black tracking-[-0.03em] text-[#07152f]">
          선택 역세권 미리보기
        </h2>
        <div className="flex flex-wrap gap-2 text-xs font-bold text-[#53637a]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf7f5] px-3 py-1">
            <i className="h-2.5 w-2.5 rounded-full bg-[#13bfae]" />
            선택 역세권
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#edf4ff] px-3 py-1">
            <i className="h-1 w-6 rounded-full bg-[#096bff]" />
            2호선 예정 노선
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff8e8] px-3 py-1">
            <i className="h-2.5 w-2.5 rounded-full border border-[#f4b343]" />
            500m 반경
          </span>
        </div>
      </div>

      <div className="relative mt-4 h-[300px] overflow-hidden rounded-2xl border border-[#dbe7f4] bg-[linear-gradient(30deg,rgba(214,231,218,0.78),rgba(246,249,244,0.9)),repeating-linear-gradient(35deg,transparent_0_34px,rgba(151,172,181,0.12)_35px_37px),repeating-linear-gradient(-35deg,transparent_0_42px,rgba(151,172,181,0.1)_43px_45px)]">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_34%_42%,rgba(255,178,78,0.35),transparent_20%),radial-gradient(circle_at_62%_54%,rgba(19,191,174,0.28),transparent_18%),radial-gradient(circle_at_73%_32%,rgba(9,107,255,0.2),transparent_18%)]"
          aria-hidden="true"
        />
        <svg
          aria-label="선택한 역세권과 광주 2호선 예정 노선 미리보기"
          className="absolute inset-0 h-full w-full"
          role="img"
          viewBox="0 0 100 100"
        >
          <path
            d="M42 18 C50 25 45 34 34 36 C24 39 22 50 32 54 C45 61 52 54 62 45 C72 36 82 36 74 31"
            fill="none"
            stroke="#13bfae"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.8"
          />
          <path
            d="M34 36 C45 43 54 49 55 60 C57 70 64 75 68 71"
            fill="none"
            stroke="#13bfae"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.8"
          />
          {visibleStations.map(({ position, station }) => (
            <g key={station}>
              <circle
                cx={position.x}
                cy={position.y}
                fill="rgba(244,179,67,0.12)"
                r="8"
                stroke="rgba(244,179,67,0.55)"
                strokeDasharray="2 2"
              />
              <circle
                cx={position.x}
                cy={position.y}
                fill="#fff"
                r="2.7"
                stroke="#13bfae"
                strokeWidth="1.5"
              />
            </g>
          ))}
        </svg>
        {visibleStations.map(({ position, station }) => (
          <span
            className="absolute z-10 rounded-md border border-[#13bfae]/50 bg-white px-2 py-1 text-xs font-black text-[#31536b] shadow-[0_5px_14px_rgba(0,0,0,0.08)]"
            key={station}
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            {station}
          </span>
        ))}
      </div>
    </section>
  )
}

function SummaryPanel({ radius, route, selectedStations }: OnboardingStationSetup) {
  return (
    <aside className="rounded-2xl border border-[#dce9f7] bg-white/95 p-6 shadow-[0_18px_52px_rgba(14,59,116,0.1)] xl:sticky xl:top-28">
      <h2 className="text-2xl font-black tracking-[-0.03em] text-[#07152f]">
        나의 역세권 설정
      </h2>
      <p className="mt-2 text-sm font-semibold text-[#67758a]">
        설정한 정보를 확인해주세요.
      </p>

      <div className="mt-6 divide-y divide-[#edf2f7] overflow-hidden rounded-xl border border-[#dce8f5] bg-white">
        <SummaryRow label="선택 노선" value={route} />
        <SummaryRow label="선택 역세권" tags={selectedStations} />
        <SummaryRow label="분석 반경" value={radius} />
        <SummaryRow
          label="예상 분석 범위"
          value={`${selectedStations.length}개 역세권 / 반경 ${radius}`}
        />
      </div>

      <section className="mt-4 rounded-xl border border-[#cfe1f5] bg-gradient-to-b from-[#f3f9ff] to-[#eaf4ff] p-5">
        <h3 className="text-base font-black tracking-[-0.02em] text-[#0a4ba3]">
          이렇게 활용돼요
        </h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 font-bold text-[#28405f]">
          <li>역세권별 상권 현황과 성장 잠재력을 비교할 수 있어요.</li>
          <li>개통 후 유동인구 변화와 상권 영향도를 예측해요.</li>
          <li>분석 결과를 바탕으로 최적의 입지를 추천받을 수 있어요.</li>
        </ul>
      </section>
    </aside>
  )
}

function SummaryRow({
  label,
  tags,
  value,
}: {
  label: string
  tags?: string[]
  value?: string
}) {
  return (
    <div className="grid gap-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm font-black text-[#0b1d3a]">{label}</strong>
        <button
          className="h-8 rounded-lg border border-[#d4dfec] bg-[#fbfdff] px-3 text-xs font-bold text-[#465872] focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:outline-none"
          type="button"
        >
          수정
        </button>
      </div>
      {value ? <p className="text-sm font-semibold text-[#5d6b80]">{value}</p> : null}
      {tags ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              className="inline-flex min-h-6 items-center rounded-full border border-[#dce6f1] bg-[#f2f6fb] px-2.5 text-xs font-black text-[#53637a]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Footer() {
  return (
    <footer className="relative z-10 bg-gradient-to-r from-[#061a3d] via-[#071f4b] to-[#052b67] text-white">
      <div className="mx-auto grid min-h-28 w-[calc(100%_-_32px)] max-w-[1840px] items-center gap-6 py-7 text-center lg:w-[calc(100%_-_64px)] xl:grid-cols-[1fr_440px_180px] xl:text-left">
        <div className="flex flex-col items-center gap-4 xl:flex-row">
          <div className="grid h-[78px] w-[78px] shrink-0 place-items-center rounded-full border border-[#00d6d5]/70 bg-[#00d9d8]/10 shadow-[0_0_24px_rgba(0,217,216,0.14)]">
            <img
              alt=""
              aria-hidden="true"
              className="h-12 w-12 object-contain"
              draggable={false}
              src={landingAssets.growthChart}
            />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-[-0.025em]">
              AI가 분석한 광주 2호선 상권 변화, 지금 바로 확인해보세요!
            </h2>
            <p className="mt-2 text-sm font-semibold text-white/75 sm:text-base">
              맞춤 설정 완료 후 다양한 인사이트와 리포트를 이용할 수 있습니다.
            </p>
          </div>
        </div>
        <address className="text-sm leading-6 text-white/75 not-italic">
          <p>(주)메트로픽시 ㅣ 대표이사: 김주현</p>
          <p>광주광역시 동구 금남로 193-22, 4층</p>
          <p>고객센터: 062-123-4567 ㅣ 062-123-4567</p>
          <p>contact@metropick.ai</p>
        </address>
        <div className="flex justify-center gap-3 xl:justify-end">
          {['f', 'N', '▶'].map((item) => (
            <button
              className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/5 font-black text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              key={item}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </footer>
  )
}

export function OnboardingStationPage() {
  const navigate = useNavigate()
  const [setup, setSetup] = useState<OnboardingStationSetup>(loadInitialSetup)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const filteredStations = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim()

    if (!normalizedKeyword) {
      return availableStations
    }

    return availableStations.filter((station) => station.includes(normalizedKeyword))
  }, [searchKeyword])

  const selectedCountLabel = `${setup.selectedStations.length} / 5 선택`

  const handleStationToggle = (station: string) => {
    setErrorMessage('')
    setSetup((currentSetup) => {
      const isSelected = currentSetup.selectedStations.includes(station)

      if (isSelected) {
        return {
          ...currentSetup,
          selectedStations: currentSetup.selectedStations.filter(
            (item) => item !== station,
          ),
        }
      }

      if (currentSetup.selectedStations.length >= 5) {
        setErrorMessage('역세권은 최대 5개까지 선택할 수 있어요.')
        return currentSetup
      }

      return {
        ...currentSetup,
        selectedStations: [...currentSetup.selectedStations, station],
      }
    })
  }

  const handleNext = () => {
    if (setup.selectedStations.length === 0) {
      setErrorMessage('최소 1개 역세권을 선택해주세요.')
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(setup))
    navigate(ONBOARDING_BUSINESS_TYPE_ROUTE)
  }

  const handleComparisonClick = () => {
    console.info('MetroPick AI: 1호선 비교 기능은 추후 연결 예정입니다.')
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_18%_25%,rgba(46,154,255,0.12),transparent_26%),radial-gradient(circle_at_78%_20%,rgba(0,210,214,0.08),transparent_24%),linear-gradient(180deg,#eef8ff_0%,#ffffff_56%,#ffffff_100%)] text-[#07152f]">
      <Header />
      <BackgroundTrain />

      <main className="relative z-10 mx-auto w-[calc(100%_-_32px)] max-w-[1720px] py-9 lg:w-[calc(100%_-_80px)]">
        <section className="grid items-start gap-8 xl:grid-cols-[minmax(360px,1fr)_720px_420px]">
          <div>
            <h1 className="text-[clamp(2.5rem,3.2vw,3.25rem)] leading-none font-black tracking-[-0.05em] text-[#07152f]">
              관심 역세권 설정
            </h1>
            <p className="mt-4 text-base font-semibold text-[#53637a] sm:text-lg">
              분석하고 싶은 역세권을 선택하고 반경을 설정해 주세요.
            </p>
          </div>
          <div className="overflow-x-auto pb-2 xl:col-span-1">
            <Stepper />
          </div>
        </section>

        <section className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:gap-14">
          <div className="grid min-w-0 gap-5">
            <section className="rounded-2xl border border-[#dce9f7] bg-white/95 p-5 shadow-[0_14px_38px_rgba(14,59,116,0.07)] sm:p-7">
              <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
                <div className="border-b border-[#dbe5f1] pb-5 lg:border-r lg:border-b-0 lg:pr-7 lg:pb-0">
                  <span className="text-2xl font-black text-[#096bff]">02</span>
                  <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[#0a1834]">
                    노선 및 역 선택
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-[#6a7688]">
                    분석을 원하는 노선과 역세권을 선택해주세요.
                  </p>
                </div>

                <div className="grid gap-5">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                    <label className="sr-only" htmlFor="route-select">
                      분석 노선 선택
                    </label>
                    <select
                      className="h-12 rounded-xl border border-[#d5e0ec] bg-white px-4 text-base font-black text-[#11284c] outline-none focus:border-[#096bff] focus:ring-4 focus:ring-[#096bff]/10"
                      id="route-select"
                      onChange={(event) =>
                        setSetup((currentSetup) => ({
                          ...currentSetup,
                          route: event.target.value,
                        }))
                      }
                      value={setup.route}
                    >
                      {routeOptions.map((route) => (
                        <option key={route} value={route}>
                          {route}
                        </option>
                      ))}
                    </select>
                    <button
                      className="h-12 rounded-xl border border-[#d5e0ec] bg-white px-5 font-black text-[#096bff] transition hover:bg-[#f7fbff] focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:ring-offset-2 focus-visible:outline-none"
                      onClick={handleComparisonClick}
                      type="button"
                    >
                      1호선 비교
                    </button>
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-sm font-black text-[#0f2446]"
                      htmlFor="station-search"
                    >
                      역세권 검색
                    </label>
                    <input
                      className="h-12 w-full rounded-xl border border-[#d5e0ec] bg-white px-4 text-base font-semibold text-[#11284c] outline-none placeholder:text-[#98a7ba] focus:border-[#096bff] focus:ring-4 focus:ring-[#096bff]/10"
                      id="station-search"
                      onChange={(event) => setSearchKeyword(event.target.value)}
                      placeholder="역명으로 검색하세요"
                      type="search"
                      value={searchKeyword}
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm font-black text-[#0f2446]">
                        역세권 선택
                      </strong>
                      <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-sm font-black text-[#096bff]">
                        {selectedCountLabel}
                      </span>
                    </div>
                    {filteredStations.length ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {filteredStations.map((station) => (
                          <StationButton
                            isSelected={setup.selectedStations.includes(station)}
                            key={station}
                            onClick={() => handleStationToggle(station)}
                            station={station}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-[#cfddea] bg-[#fbfdff] px-4 py-5 text-center text-sm font-bold text-[#6a7688]">
                        검색 결과가 없습니다.
                      </p>
                    )}
                    {errorMessage ? (
                      <p className="text-sm font-bold text-[#d4380d]" role="alert">
                        {errorMessage}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#dce9f7] bg-white/95 p-5 shadow-[0_14px_38px_rgba(14,59,116,0.07)] sm:p-7">
              <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
                <div className="border-b border-[#dbe5f1] pb-5 lg:border-r lg:border-b-0 lg:pr-7 lg:pb-0">
                  <span className="text-2xl font-black text-[#096bff]">02-1</span>
                  <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[#0a1834]">
                    분석 반경 설정
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-[#6a7688]">
                    역 주변 상권을 비교할 거리 기준을 선택해주세요.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {radiusOptions.map((radius) => (
                    <RadiusButton
                      isSelected={setup.radius === radius}
                      key={radius}
                      onClick={() =>
                        setSetup((currentSetup) => ({ ...currentSetup, radius }))
                      }
                      radius={radius}
                    />
                  ))}
                </div>
              </div>
            </section>

            <SelectedStationMap selectedStations={setup.selectedStations} />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                className="h-14 rounded-lg border border-[#cbd9ea] bg-white px-7 text-base font-black text-[#465872] transition hover:bg-[#f7fbff] focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:ring-offset-2 focus-visible:outline-none"
                onClick={() => navigate(-1)}
                type="button"
              >
                이전 단계
              </button>
              <button
                className="h-14 rounded-lg bg-gradient-to-r from-[#096bff] to-[#0058f5] px-7 text-base font-black text-white shadow-[0_16px_28px_rgba(9,107,255,0.22)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:ring-offset-2 focus-visible:outline-none"
                onClick={handleNext}
                type="button"
              >
                다음: 분석 업종 설정
                <span className="ml-3" aria-hidden="true">
                  →
                </span>
              </button>
            </div>
          </div>

          <SummaryPanel
            radius={setup.radius}
            route={setup.route}
            selectedStations={setup.selectedStations}
          />
        </section>
      </main>

      <Footer />
    </div>
  )
}
