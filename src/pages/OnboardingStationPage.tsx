import { useMemo, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleCheck,
  Lightbulb,
  MapPin,
  Search,
  Target,
  TrainFront,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { AppFooter } from '@/shared/components/AppFooter'
import { ImageWithFallback } from '@/shared/components/ImageWithFallback'
import { TopNavigation } from '@/shared/components/TopNavigation'
import { onboardingAssets } from '@/shared/assets/onboardingAssets'
import { safeParseStorage, writeStorage } from '@/shared/lib/storage'

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
  return sanitizeSavedSetup(safeParseStorage<unknown>(STORAGE_KEY))
}

function Stepper() {
  return (
    <ol className="relative flex min-w-[600px] items-start justify-center pt-1 md:min-w-0">
      {stepItems.map((step, index) => (
        <li className="relative flex w-[150px] flex-col items-center" key={step.label}>
          <span
            className={[
              'relative z-10 grid h-11 w-11 place-items-center rounded-full border-2 text-lg font-black',
              step.status === 'completed'
                ? 'border-[#096bff] bg-[#096bff] text-white shadow-[0_10px_24px_rgba(9,107,255,0.22)]'
                : '',
              step.status === 'active'
                ? 'border-[#096bff] bg-white text-[#096bff] shadow-[0_10px_24px_rgba(9,107,255,0.12)]'
                : '',
              step.status === 'inactive'
                ? 'border-[#cad8e8] bg-white text-[#8a96a7]'
                : '',
            ].join(' ')}
            aria-current={step.status === 'active' ? 'step' : undefined}
          >
            {step.status === 'completed' ? <Check size={21} strokeWidth={3} /> : index + 1}
          </span>
          <span
            className={[
              'mt-3 text-center text-sm font-black',
              step.status === 'active' ? 'text-[#096bff]' : 'text-[#59677c]',
            ].join(' ')}
          >
            {step.label}
          </span>
          {index < stepItems.length - 1 ? (
            <span
              aria-hidden="true"
              className={[
                'absolute top-[22px] left-[98px] h-px w-[104px]',
                index === 0 ? 'bg-[#096bff]' : 'bg-[#cad8e8]',
              ].join(' ')}
            />
          ) : null}
        </li>
      ))}
    </ol>
  )
}

function HeroTrainBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 right-[-24px] hidden h-[185px] w-[640px] bg-contain bg-right-bottom bg-no-repeat opacity-[0.18] lg:block"
      style={{ backgroundImage: `url(${onboardingAssets.initialSetupTrainBg})` }}
    />
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
        'inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border px-4 text-sm font-black transition focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:ring-offset-2 focus-visible:outline-none sm:text-base',
        isSelected
          ? 'border-2 border-[#096bff] bg-[#f7fbff] text-[#096bff] shadow-[0_8px_20px_rgba(9,107,255,0.08)]'
          : 'border-[#d5e0ec] bg-white text-[#526177] hover:border-[#96b9e9]',
      ].join(' ')}
      onClick={onClick}
      type="button"
    >
      {isSelected ? (
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#096bff] text-white">
          <Check size={13} strokeWidth={3} />
        </span>
      ) : null}
      {station}
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
        'inline-flex h-12 items-center justify-center gap-3 rounded-[10px] border px-5 text-base font-black transition focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:ring-offset-2 focus-visible:outline-none',
        isSelected
          ? 'border-2 border-[#096bff] bg-[#f7fbff] text-[#096bff] shadow-[0_8px_20px_rgba(9,107,255,0.08)]'
          : 'border-[#d5e0ec] bg-white text-[#526177] hover:border-[#96b9e9]',
      ].join(' ')}
      onClick={onClick}
      type="button"
    >
      <span
        className={[
          'grid h-5 w-5 place-items-center rounded-full border',
          isSelected ? 'border-[#096bff]' : 'border-[#c5d1df]',
        ].join(' ')}
        aria-hidden="true"
      >
        {isSelected ? <span className="h-2.5 w-2.5 rounded-full bg-[#096bff]" /> : null}
      </span>
      {radius}
    </button>
  )
}

function SelectedStationMap() {
  return (
    <section className="rounded-2xl border border-[#dce9f7] bg-white/95 p-6 shadow-[0_14px_38px_rgba(14,59,116,0.06)]">
      <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#07152f]">
        선택 역세권 미리보기
      </h2>

      <div className="mt-4 h-[168px] overflow-hidden rounded-xl border border-[#dbe7f4] bg-white shadow-sm max-lg:h-auto">
        <ImageWithFallback
          alt="선택한 광주 2호선 역세권 미리보기 지도"
          className="block h-full w-full object-cover"
          draggable={false}
          fallbackText="역세권 미리보기 지도를 불러올 수 없습니다."
          src={onboardingAssets.stationPreviewMap}
        />
      </div>
    </section>
  )
}

function SummaryPanel({ radius, route, selectedStations }: OnboardingStationSetup) {
  return (
    <aside className="rounded-2xl border border-[#dce9f7] bg-white/95 p-7 shadow-[0_18px_52px_rgba(14,59,116,0.1)]">
      <h2 className="text-[25px] font-black tracking-[-0.03em] text-[#07152f]">
        나의 역세권 설정
      </h2>
      <p className="mt-2 text-sm font-semibold text-[#67758a]">
        선택한 내용을 확인해 주세요.
      </p>

      <div className="mt-5 grid gap-0 overflow-hidden rounded-xl border border-[#dce8f5] bg-white">
        <SummaryRow icon={TrainFront} label="선택 노선">
          <p className="text-base font-black text-[#17233d]">{route}</p>
        </SummaryRow>
        <SummaryRow icon={MapPin} label="선택 역세권">
          <div className="flex flex-wrap gap-2">
            {selectedStations.map((station) => (
              <span
                className="inline-flex min-h-8 items-center rounded-lg border border-[#79adff] bg-white px-3 text-sm font-black text-[#096bff]"
                key={station}
              >
                {station}
              </span>
            ))}
          </div>
        </SummaryRow>
        <SummaryRow icon={Target} label="분석 반경">
          <p className="text-base font-black text-[#17233d]">{radius}</p>
        </SummaryRow>
        <SummaryRow icon={BarChart3} label="예상 분석 범위">
          <p className="text-base font-black text-[#17233d]">
            {selectedStations.length}개 역세권 / 반경 {radius}
          </p>
        </SummaryRow>
      </div>

      <section className="mt-5 rounded-xl bg-[#eef6ff] px-6 py-5">
        <h3 className="flex items-center gap-2 text-base font-black tracking-[-0.02em] text-[#096bff]">
          <Lightbulb size={19} strokeWidth={2.3} />
          이렇게 활용돼요
        </h3>
        <ul className="mt-3 grid gap-2 text-sm leading-5 font-bold text-[#28405f]">
          {[
            '역세권별 상권 현황과 성장 잠재력을 비교할 수 있어요.',
            '개통 후 유동인구 변화와 상권 영향도를 예측해요.',
            '분석 결과를 바탕으로 최적의 입지를 추천받을 수 있어요.',
          ].map((item) => (
            <li className="flex items-start gap-2" key={item}>
              <CircleCheck
                className="mt-0.5 shrink-0 text-[#096bff]"
                size={16}
                strokeWidth={2.6}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}

function SummaryRow({
  children,
  icon: Icon,
  label,
}: {
  children: ReactNode
  icon: LucideIcon
  label: string
}) {
  return (
    <div className="grid min-h-[76px] grid-cols-[44px_116px_minmax(0,1fr)] items-center gap-4 border-b border-[#edf2f7] px-4 py-4 last:border-b-0 max-sm:grid-cols-[40px_1fr]">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eef6ff] text-[#096bff]">
        <Icon size={22} strokeWidth={2.2} />
      </span>
      <strong className="text-base font-black text-[#0b1d3a]">{label}</strong>
      <div className="min-w-0 max-sm:col-span-2">{children}</div>
    </div>
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

    writeStorage(STORAGE_KEY, setup)
    navigate(ONBOARDING_BUSINESS_TYPE_ROUTE)
  }

  const handleComparisonClick = () => {
    console.info('MetroPick AI: 1호선 비교 기능은 추후 연결 예정입니다.')
  }

  return (
    <div className="onboarding-station-page flex min-h-screen flex-col overflow-x-clip bg-[#f6fbff] text-[#07152f]">
      <TopNavigation />

      <main className="relative flex-1 overflow-hidden">
        <HeroTrainBackdrop />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(46,154,255,0.09),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(0,210,214,0.07),transparent_26%)]" />

        <div className="relative z-10 mx-auto w-[calc(100%_-_32px)] max-w-[1820px] pt-8 pb-8 lg:w-[calc(100%_-_80px)]">
          <section className="grid items-start gap-7 xl:grid-cols-[520px_minmax(0,1fr)]">
            <div>
              <h1 className="text-[clamp(2.35rem,3vw,3.15rem)] leading-none font-black tracking-[-0.05em] text-[#07152f]">
                관심 역세권 설정
              </h1>
              <p className="mt-4 text-base font-semibold text-[#53637a] sm:text-lg">
                분석하고 싶은 역세권을 선택하고 반경을 설정해 주세요.
              </p>
            </div>
            <div className="overflow-x-auto pb-2">
              <Stepper />
            </div>
          </section>

          <section className="mt-6 grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_620px]">
            <div className="grid min-w-0 gap-3">
              <section className="rounded-2xl border border-[#dce9f7] bg-white/95 px-6 py-5 shadow-[0_14px_38px_rgba(14,59,116,0.07)] sm:px-7">
                <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#0a1834]">
                  노선 및 역 선택
                </h2>

                <div className="mt-4 grid items-end gap-4 lg:grid-cols-[minmax(220px,360px)_112px_minmax(280px,1fr)]">
                  <div>
                    <label
                      className="mb-2 block text-xs font-black text-[#59677c]"
                      htmlFor="route-select"
                    >
                      노선 선택
                    </label>
                    <select
                      className="h-12 w-full rounded-lg border border-[#d5e0ec] bg-white px-4 text-sm font-black text-[#11284c] outline-none focus:border-[#096bff] focus:ring-4 focus:ring-[#096bff]/10 sm:text-base"
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
                  </div>
                  <button
                    className="h-12 rounded-lg border border-[#86b5ff] bg-white px-4 font-black text-[#096bff] transition hover:bg-[#f7fbff] focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:ring-offset-2 focus-visible:outline-none"
                    onClick={handleComparisonClick}
                    type="button"
                  >
                    1호선 비교
                  </button>
                  <div className="relative">
                    <label className="sr-only" htmlFor="station-search">
                      역세권 검색
                    </label>
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#8d9bb0]"
                      size={22}
                      strokeWidth={2}
                    />
                    <input
                      className="h-12 w-full rounded-lg border border-[#d5e0ec] bg-white pr-4 pl-12 text-base font-semibold text-[#11284c] outline-none placeholder:text-[#7f8da1] focus:border-[#096bff] focus:ring-4 focus:ring-[#096bff]/10"
                      id="station-search"
                      onChange={(event) => setSearchKeyword(event.target.value)}
                      placeholder="역명으로 검색하세요"
                      type="search"
                      value={searchKeyword}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  {filteredStations.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#8a96a7]">
                      최대 5개 역세권까지 선택할 수 있습니다.
                    </p>
                    <span className="text-sm font-black text-[#096bff]">
                      {selectedCountLabel}
                    </span>
                  </div>
                  {errorMessage ? (
                    <p className="mt-2 text-sm font-bold text-[#d4380d]" role="alert">
                      {errorMessage}
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="rounded-2xl border border-[#dce9f7] bg-white/95 px-6 py-4 shadow-[0_14px_38px_rgba(14,59,116,0.07)] sm:px-7">
                <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,580px)_1fr]">
                  <div>
                    <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#0a1834]">
                      분석 반경 설정
                    </h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-3">
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
                  <div className="text-sm leading-6 font-semibold text-[#7a8798]">
                    <p>선택한 역을 중심으로 설정한 반경 내</p>
                    <p>도보 이동 가능 범위를 기준으로 분석합니다.</p>
                    <p className="mt-1 text-xs text-[#9aa6b6]">
                      일반적인 도보 5~7분 거리를 기준으로 합니다.
                    </p>
                  </div>
                </div>
              </section>

              <SelectedStationMap />
            </div>

            <div>
              <SummaryPanel
                radius={setup.radius}
                route={setup.route}
                selectedStations={setup.selectedStations}
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  className="h-16 rounded-lg border border-[#cbd9ea] bg-white px-7 text-lg font-black text-[#17233d] transition hover:bg-[#f7fbff] focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:ring-offset-2 focus-visible:outline-none"
                  onClick={() => navigate(-1)}
                  type="button"
                >
                  이전 단계
                </button>
                <button
                  className="inline-flex h-16 items-center justify-center gap-4 rounded-lg bg-gradient-to-r from-[#096bff] to-[#0058f5] px-7 text-lg font-black text-white shadow-[0_16px_28px_rgba(9,107,255,0.22)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:ring-offset-2 focus-visible:outline-none"
                  onClick={handleNext}
                  type="button"
                >
                  다음: 분석 업종 설정
                  <ArrowRight size={24} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
