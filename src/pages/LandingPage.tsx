import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { landingAssets } from '@/shared/assets/landingAssets'

const navItems = [
  { label: '서비스 소개', href: '#service-intro' },
  { label: '상권 분석', href: '/scenario' },
  { label: 'AI 예측', href: '/scenario' },
  { label: '입지 추천', href: '/dashboard' },
  { label: '리포트', href: '/report' },
] as const

const summaryCards = [
  {
    label: '유동인구(일평균)',
    value: '125,430명',
    change: '+24.6%',
    description: '개통 이후 시나리오',
  },
  {
    label: '매출 잠재력',
    value: '2,845억원',
    change: '+31.2%',
    description: '개통 이후 시나리오',
  },
  {
    label: '신규 창업 기회',
    value: '1,203개',
    change: '+18.7%',
    description: '개통 이후 시나리오',
  },
] as const

const ranking = [
  { rank: 1, name: '무등시장역 인근', score: '92.1' },
  { rank: 2, name: '금남로5가역 상권', score: '89.3' },
  { rank: 3, name: '백운광장역 인근', score: '86.7' },
  { rank: 4, name: '첨단지구(신가역)', score: '83.4' },
  { rank: 5, name: '효천역 상권', score: '80.8' },
] as const

const featureCards = [
  {
    image: landingAssets.mapPin,
    imageAlt: '지도 위치 핀 아이콘',
    title: '역세권 상권 분석 매핑',
    description:
      '2호선 역세권을 중심으로 유동인구, 업종 분포, 매출 흐름을 지도 기반으로 시각화합니다.',
  },
  {
    image: landingAssets.growthChart,
    imageAlt: '성장 차트 아이콘',
    title: 'AI 매출 변동 시뮬레이션',
    description:
      '개통 전후의 상권 변화를 AI가 예측하여 업종별 매출 변동 시나리오를 제공합니다.',
  },
  {
    image: landingAssets.trophy,
    imageAlt: '우수 추천 지점을 나타내는 트로피 아이콘',
    title: '창업 유망 지점 TOP 5 추천',
    description:
      '유동인구, 경쟁도, 성장성 등을 종합 분석해 창업 유망 지점을 TOP 5로 추천합니다.',
  },
] as const

const dataCards = [
  {
    label: 'GJ',
    title: '광주 빅데이터 통합플랫폼',
    description: '행정·교통·상권 등 다양한 빅데이터 제공',
  },
  {
    label: 'DATA',
    title: '공공데이터포털 data.go.kr',
    description: '공공기관 보유 데이터를 표준화하여 개방',
  },
  {
    label: 'M2',
    title: '도시철도/버스 이용객 데이터',
    description: '교통 이용객 데이터를 기반으로 분석',
  },
] as const

const processSteps = [
  {
    number: '01',
    title: '데이터 수집',
    description: '공공데이터 및 교통, 상권 데이터 수집',
  },
  {
    number: '02',
    title: '공간 분석',
    description: 'GIS 기반 공간 분석으로 상권 특성 파악',
  },
  {
    number: '03',
    title: 'AI 예측',
    description: '머신러닝 모델로 미래 상권 변화 시뮬레이션',
  },
  {
    number: '04',
    title: '리포트 제공',
    description: '맞춤형 리포트와 인사이트를 시각적으로 제공',
  },
] as const

const sidebarItems = [
  '대시보드',
  '상권 분석',
  'AI 예측',
  '입지 추천',
  '리포트',
  '관심 지역',
  '설정',
]

function LandingLink({
  children,
  className,
  href,
}: {
  children: ReactNode
  className?: string
  href: string
}) {
  const isInternalRoute = href.startsWith('/')

  if (isInternalRoute) {
    return (
      <Link className={className} to={href}>
        {children}
      </Link>
    )
  }

  return (
    <a className={className} href={href}>
      {children}
    </a>
  )
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#06162d] text-white shadow-[0_1px_0_rgba(255,255,255,0.08)]">
      <div className="mx-auto flex min-h-20 w-[min(1720px,calc(100%-32px))] items-center justify-between gap-5 py-3">
        <Link
          className="flex min-w-0 items-center gap-3"
          to="/"
          aria-label="MetroPick AI 홈"
        >
          <img
            className="h-9 w-11 shrink-0 object-contain"
            src={landingAssets.logo}
            alt="MetroPick AI 로고"
          />
          <span className="min-w-0">
            <span className="block text-xl font-black tracking-[-0.02em]">
              MetroPick AI
            </span>
            <span className="mt-1 hidden text-xs text-white/75 sm:block">
              광주 2호선 개통에 따른 AI 상권 변화 예측 서비스
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-10 text-base font-bold xl:flex"
          aria-label="랜딩 주요 메뉴"
        >
          {navItems.map((item) => (
            <LandingLink
              key={item.label}
              href={item.href}
              className="text-white/90 transition hover:text-[#43e8df] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              {item.label}
            </LandingLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/45 px-7 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            to="/login"
          >
            로그인
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#086bff] px-7 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(0,102,255,0.26)] transition hover:bg-[#0054dc] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            to="/scenario"
          >
            무료로 시작하기
          </Link>
        </div>

        <details className="relative lg:hidden">
          <summary className="list-none rounded-lg border border-white/35 px-4 py-2 text-sm font-bold text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none">
            메뉴
          </summary>
          <div className="absolute right-0 mt-3 grid w-52 gap-1 rounded-lg border border-slate-200 bg-white p-2 text-slate-900 shadow-xl">
            {navItems.map((item) => (
              <LandingLink
                key={item.label}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-bold hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#086bff] focus-visible:outline-none"
              >
                {item.label}
              </LandingLink>
            ))}
            <Link
              className="rounded-md bg-[#086bff] px-3 py-2 text-center text-sm font-extrabold text-white"
              to="/scenario"
            >
              무료로 시작하기
            </Link>
          </div>
        </details>
      </div>
    </header>
  )
}

function MapMockup() {
  const stations = [
    { name: '운천', x: 58, y: 12 },
    { name: '신가', x: 53, y: 23 },
    { name: '시청', x: 42, y: 37 },
    { name: '금남로5가', x: 35, y: 50 },
    { name: '백운', x: 46, y: 60 },
    { name: '남광주', x: 55, y: 72 },
    { name: '효천', x: 63, y: 84 },
    { name: '월드컵', x: 70, y: 43 },
    { name: '풍암', x: 67, y: 57 },
  ] as const

  return (
    <div className="relative min-h-[270px] overflow-hidden rounded-2xl border border-[#e4edf6] bg-[linear-gradient(30deg,rgba(214,231,218,0.7),rgba(246,249,244,0.85))] lg:row-span-2">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(35deg,transparent_0_34px,rgba(151,172,181,0.1)_35px_37px),repeating-linear-gradient(-35deg,transparent_0_42px,rgba(151,172,181,0.09)_43px_45px)]" />
      <div className="absolute top-[31%] left-[23%] h-24 w-24 rounded-full bg-[#ffb14c]/70 blur-xl" />
      <div className="absolute top-[29%] right-[12%] h-24 w-24 rounded-full bg-[#19b99f]/55 blur-xl" />
      <div className="absolute bottom-[17%] left-[42%] h-24 w-24 rounded-full bg-[#066bff]/30 blur-xl" />

      <svg
        className="absolute inset-[18px_22px] z-10 h-[calc(100%-36px)] w-[calc(100%-44px)]"
        viewBox="0 0 100 100"
        role="img"
        aria-label="광주 2호선 주요 역세권 모의 노선 지도"
      >
        <path
          d="M58 12 C56 18, 53 19, 53 23 C52 30, 44 30, 42 37 C39 43, 35 44, 35 50 C36 56, 44 56, 46 60 C52 65, 55 67, 55 72 C56 79, 62 78, 63 84"
          fill="none"
          stroke="#19b99f"
          strokeLinecap="round"
          strokeWidth="3.2"
        />
        <path
          d="M42 37 C50 40, 60 38, 70 43 C70 50, 68 54, 67 57"
          fill="none"
          stroke="#19b99f"
          strokeLinecap="round"
          strokeWidth="3.2"
        />
        {stations.map((station) => (
          <circle
            key={station.name}
            cx={station.x}
            cy={station.y}
            fill="#fff"
            r="2.7"
            stroke="#13b79f"
            strokeWidth="1.7"
          />
        ))}
      </svg>

      {stations.map((station) => (
        <span
          key={station.name}
          className="absolute z-20 translate-x-2 -translate-y-3 rounded-md border border-[#13b79f]/55 bg-white px-2 py-1 text-[9px] font-extrabold text-[#31536b] shadow"
          style={{ left: `${station.x}%`, top: `${station.y}%` }}
        >
          {station.name}
        </span>
      ))}

      <div className="absolute bottom-4 left-4 z-20 w-32 rounded-xl border border-[#e7edf5] bg-white/95 p-3 shadow-lg">
        <strong className="block text-[9px] text-[#25384f]">유동인구 증가율(모의)</strong>
        {[
          ['#18c6a8', '30% 이상'],
          ['#83db8a', '15~30%'],
          ['#f5d56b', '5~15%'],
          ['#f6a95e', '0~5%'],
          ['#ec5a5a', '감소'],
        ].map(([color, label]) => (
          <span
            key={label}
            className="mt-1 flex items-center gap-1.5 text-[8px] text-[#5a6573]"
          >
            <i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function DashboardPreview() {
  return (
    <section
      id="dashboard-preview"
      className="grid min-h-[444px] overflow-hidden rounded-[22px] border border-[#cad9eb] bg-white/90 shadow-[0_22px_60px_rgba(15,44,82,0.15)] lg:grid-cols-[150px_1fr]"
      aria-label="MetroPick AI 대시보드 미리보기"
    >
      <aside className="hidden border-r border-[#e6edf5] bg-gradient-to-b from-white to-[#f8fbff] p-4 lg:block">
        <div className="mb-5 flex items-center gap-2 text-sm font-extrabold text-[#153151]">
          <img
            className="h-5 w-6 object-contain"
            src={landingAssets.logo}
            alt="MetroPick AI 미니 로고"
          />
          MetroPick AI
        </div>
        <nav className="grid gap-2" aria-label="대시보드 미리보기 메뉴">
          {sidebarItems.map((item, index) => (
            <span
              key={item}
              className={[
                'rounded-lg px-3 py-2 text-xs font-bold',
                index === 0 ? 'bg-[#edf6ff] text-[#086bff]' : 'text-[#556274]',
              ].join(' ')}
            >
              {item}
            </span>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 bg-[#f9fcff] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-black tracking-[-0.02em] text-[#142a48]">
              광주 2호선 상권 변화 대시보드
            </h2>
            <p className="mt-1 text-xs text-[#8a98aa]">데이터 업데이트: 2026.05.12</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="rounded-md border border-[#d8e2ee] bg-white px-3 py-2 text-[10px] font-bold text-[#6b7788]">
              광주광역시 전체
            </button>
            <button className="rounded-md border border-[#d8e2ee] bg-white px-3 py-2 text-[10px] font-bold text-[#6b7788]">
              2026년 개통 이후
            </button>
            <span
              className="h-6 w-6 rounded-full bg-[#8aa0bd]"
              aria-label="사용자 프로필 표시"
            />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr] xl:grid-rows-[108px_1fr]">
          <MapMockup />

          <div className="grid gap-3 sm:grid-cols-3">
            {summaryCards.map((card) => (
              <article
                key={card.label}
                className="rounded-xl border border-[#e5edf5] bg-white p-4 shadow-sm"
              >
                <p className="text-[11px] font-extrabold text-[#556475]">{card.label}</p>
                <strong className="mt-2 block text-lg font-black tracking-[-0.03em] text-[#111d31]">
                  {card.value}
                </strong>
                <span className="mt-1 block text-[11px] font-bold text-[#10b79a]">
                  {card.change}
                </span>
                <span className="mt-1 block text-[9px] text-[#7d8898]">
                  {card.description}
                </span>
              </article>
            ))}
          </div>

          <article className="rounded-xl border border-[#e5edf5] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-black tracking-[-0.02em] text-[#142a48]">
              매출 잠재력 변화 예측
            </h3>
            <div className="mt-2 h-36">
              <svg
                className="h-full w-full"
                viewBox="0 0 360 170"
                role="img"
                aria-label="매출 잠재력 모의 선형 차트"
              >
                <line x1="35" y1="135" x2="340" y2="135" stroke="#e4eaf3" />
                <line x1="35" y1="100" x2="340" y2="100" stroke="#edf2f8" />
                <line x1="35" y1="65" x2="340" y2="65" stroke="#edf2f8" />
                <line x1="35" y1="30" x2="340" y2="30" stroke="#edf2f8" />
                <polyline
                  fill="none"
                  points="40,118 80,113 120,108 160,92 200,90"
                  stroke="#94a3b8"
                  strokeLinecap="round"
                  strokeWidth="5"
                />
                <polyline
                  fill="none"
                  points="205,84 245,70 285,56 320,35"
                  stroke="#086bff"
                  strokeLinecap="round"
                  strokeWidth="5"
                />
                {[40, 80, 120, 160, 200].map((x, index) => (
                  <circle
                    key={x}
                    cx={x}
                    cy={[118, 113, 108, 92, 90][index]}
                    fill="#94a3b8"
                    r="5"
                  />
                ))}
                {[205, 245, 285, 320].map((x, index) => (
                  <circle
                    key={x}
                    cx={x}
                    cy={[84, 70, 56, 35][index]}
                    fill="#086bff"
                    r="5"
                  />
                ))}
              </svg>
            </div>
          </article>

          <article className="rounded-xl border border-[#e5edf5] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-black tracking-[-0.02em] text-[#142a48]">
              창업 유망 지점 TOP 5
            </h3>
            <ol className="mt-2 grid gap-1">
              {ranking.map((item) => (
                <li
                  key={item.rank}
                  className="grid min-h-7 grid-cols-[22px_1fr_auto] items-center gap-2 text-[10px]"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-[#0d68d9] to-[#35b8d9] font-black text-white">
                    {item.rank}
                  </span>
                  <span className="font-extrabold text-[#24364c]">{item.name}</span>
                  <span className="whitespace-nowrap text-[9px] text-[#758294]">
                    종합 점수 {item.score}
                  </span>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </div>
    </section>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f3fbff] to-white py-8 lg:py-10">
      <div className="absolute inset-0 opacity-65 lg:opacity-90">
        <img
          className="absolute left-0 top-10 h-full w-full object-cover object-left-bottom opacity-30 lg:opacity-45"
          src={landingAssets.heroTrainBg}
          alt="광주 도시철도와 도시 배경 이미지"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white" />
      </div>

      <div className="relative z-10 mx-auto grid w-[min(1720px,calc(100%-32px))] items-center gap-10 xl:grid-cols-[620px_1fr] xl:gap-16">
        <div className="pt-4">
          <p className="inline-flex min-h-9 items-center rounded-full border border-[#0c71ff]/25 bg-[#eff8ff]/95 px-5 text-sm font-extrabold text-[#046bff] shadow-sm">
            광주 2호선 개통 · 2026년 예정
          </p>
          <h1 className="mt-5 text-[clamp(2.35rem,5vw,3.75rem)] leading-[1.14] font-black tracking-[-0.04em] text-[#091a36]">
            광주 2호선 개통 이후,
            <br />
            우리 상권은 <span className="text-[#066dff]">어떻게 바뀔까요?</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 font-medium tracking-[-0.02em] text-[#58677b]">
            공공데이터와 머신러닝 기반 AI가 예측하는 유동인구, 매출 잠재력, 창업 기회를
            한눈에 확인하세요.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-14 items-center justify-center rounded-xl bg-[#086bff] px-8 text-base font-black text-white shadow-[0_16px_32px_rgba(0,97,255,0.22)] transition hover:bg-[#0054e8] focus-visible:ring-2 focus-visible:ring-[#086bff] focus-visible:ring-offset-2 focus-visible:outline-none"
              to="/scenario"
            >
              지금 분석 시작
            </Link>
            <a
              className="inline-flex min-h-14 items-center justify-center rounded-xl border border-[#9fb4cf] bg-white/90 px-8 text-base font-black text-[#102747] shadow-sm transition hover:bg-white focus-visible:ring-2 focus-visible:ring-[#086bff] focus-visible:ring-offset-2 focus-visible:outline-none"
              href="#dashboard-preview"
            >
              데모 보기
            </a>
          </div>

          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              ['공공데이터 기반', '신뢰할 수 있는 데이터'],
              ['AI 시나리오', '모의 변화 흐름 확인'],
              ['직관적인 인사이트', '한눈에 보는 상권 변화'],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-[#c5daec] bg-white/80 p-4 shadow-sm"
              >
                <strong className="block text-xs font-black text-[#163759]">
                  {title}
                </strong>
                <span className="mt-1 block text-xs text-[#7b8797]">{description}</span>
              </div>
            ))}
          </div>
        </div>

        <DashboardPreview />
      </div>
    </section>
  )
}

function FeatureSection() {
  return (
    <section id="service-intro" className="mx-auto w-[min(1720px,calc(100%-32px))] pb-4">
      <div className="grid gap-5 lg:grid-cols-3">
        {featureCards.map((card) => (
          <article
            key={card.title}
            className="grid min-h-28 grid-cols-[64px_1fr_34px] items-center gap-4 rounded-2xl border border-[#d6e2f0] bg-white/95 p-5 shadow-[0_12px_26px_rgba(15,44,82,0.07)]"
          >
            <img
              className="h-12 w-12 object-contain"
              src={card.image}
              alt={card.imageAlt}
            />
            <div>
              <h2 className="text-lg font-black tracking-[-0.02em] text-[#102747]">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#4e6076]">{card.description}</p>
            </div>
            <Link
              className="grid h-9 w-9 place-items-center rounded-full bg-[#edf6ff] text-xl font-black text-[#006dff] focus-visible:ring-2 focus-visible:ring-[#086bff] focus-visible:outline-none"
              to="/scenario"
              aria-label={`${card.title} 화면으로 이동`}
            >
              ›
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-7 grid gap-8 xl:grid-cols-[44%_1fr]">
        <section aria-labelledby="data-source-heading">
          <h2
            id="data-source-heading"
            className="text-xl font-black tracking-[-0.02em] text-[#102747]"
          >
            신뢰할 수 있는 공공데이터 기반
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-3">
            {dataCards.map((card) => (
              <article
                key={card.title}
                className="flex min-h-24 gap-3 rounded-xl border border-[#dfe9f3] bg-white p-4 shadow-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#edf6ff] text-xs font-black text-[#086bff]">
                  {card.label}
                </span>
                <div>
                  <h3 className="text-sm font-black text-[#173656]">{card.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#6b798b]">
                    {card.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-[#5f6d7c]">
            개인정보 비식별화 처리로 안전하게 분석합니다.
          </p>
        </section>

        <section aria-labelledby="process-heading">
          <h2
            id="process-heading"
            className="text-xl font-black tracking-[-0.02em] text-[#102747]"
          >
            분석부터 인사이트까지 한눈에
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {processSteps.map((step, index) => (
              <div key={step.number} className="relative">
                <article className="min-h-32 rounded-2xl border border-[#b9d8ff] bg-white p-4 shadow-sm">
                  <strong className="grid h-10 w-10 place-items-center rounded-full border-2 border-current text-sm font-black text-[#0186c9]">
                    {step.number}
                  </strong>
                  <h3 className="mt-3 text-base font-black text-[#173656]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#59687a]">
                    {step.description}
                  </p>
                </article>
                {index < processSteps.length - 1 && (
                  <span
                    className="absolute top-12 -right-5 hidden text-3xl font-light text-[#8e98a5] xl:block"
                    aria-hidden="true"
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-7 grid items-center gap-5 rounded-xl bg-gradient-to-r from-[#061b42] via-[#006c95] to-[#0bb0b2] px-6 py-6 text-white shadow-[0_18px_34px_rgba(2,65,99,0.18)] lg:grid-cols-[86px_1fr_auto] lg:px-12">
        <img
          className="h-16 w-16 rounded-full border border-cyan-200/40 bg-cyan-300/10 p-3"
          src={landingAssets.growthChart}
          alt="성장 전략을 나타내는 차트 아이콘"
        />
        <div>
          <h2 className="text-xl font-black tracking-[-0.02em] lg:text-2xl">
            데이터로 앞서가는 상권 전략, 지금 시작하세요!
          </h2>
          <p className="mt-2 text-sm text-white/85 lg:text-base">
            2호선 개통이 가져올 새로운 기회를 MetroPick AI와 함께 발견하세요.
          </p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-8 text-base font-black text-[#0b2850] shadow-lg transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          to="/scenario"
        >
          지금 무료로 시작하기
        </Link>
      </section>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="mt-4 bg-[#06162d] text-white">
      <div className="mx-auto grid min-h-28 w-[min(1720px,calc(100%-32px))] items-center gap-6 py-6 text-center lg:grid-cols-[290px_1fr_390px] lg:text-left">
        <div className="flex items-center justify-center gap-3 lg:justify-start">
          <img
            className="h-8 w-10 object-contain"
            src={landingAssets.logo}
            alt="MetroPick AI 푸터 로고"
          />
          <div>
            <h2 className="text-lg font-black">MetroPick AI</h2>
            <p className="mt-1 text-xs text-white/65">
              광주 2호선 개통에 따른 AI 상권 변화 예측 서비스
            </p>
          </div>
        </div>

        <nav
          className="flex flex-wrap justify-center gap-4 text-sm text-white/75"
          aria-label="푸터 링크"
        >
          {['서비스 소개', '이용약관', '개인정보처리방침', '데이터 출처', '문의하기'].map(
            (item) => (
              <a
                key={item}
                className="hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                href="#service-intro"
              >
                {item}
              </a>
            ),
          )}
        </nav>

        <address className="not-italic text-sm leading-6 text-white/72">
          <p>(주)메트로픽시 ㅣ 대표이사: 김지현</p>
          <p>광주광역시 동구 금남로 193-22, 4층</p>
          <p>이메일: contact@metropick.ai ㅣ 062-123-4567</p>
        </address>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#f7fcff] via-white to-[#f7fbff] text-[#071936]">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeatureSection />
      </main>
      <LandingFooter />
    </div>
  )
}
