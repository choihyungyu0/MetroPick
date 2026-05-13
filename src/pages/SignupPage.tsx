import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  EyeOff,
  Landmark,
  LockKeyhole,
  Sparkles,
  Store,
  UserRound,
} from 'lucide-react'

import { landingAssets } from '@/shared/assets/landingAssets'
import { TopNavigation } from '@/shared/components/TopNavigation'
import { signupAssets } from '@/shared/assets/signupAssets'

const userTypes = [
  { Icon: UserRound, label: '예비 창업자', active: true },
  { Icon: Store, label: '소상공인', active: false },
  { Icon: Landmark, label: '정책 담당자', active: false },
  { Icon: BarChart3, label: '분석가', active: false },
]

const footerLinks = [
  '서비스 소개',
  '이용약관',
  '개인정보처리방침',
  '데이터 출처',
  '문의하기',
]

function Logo({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
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
            'block leading-none font-black tracking-[-0.03em]',
            compact ? 'text-xl' : 'text-2xl',
            dark ? 'text-[#09214a]' : 'text-white',
          ].join(' ')}
        >
          MetroPick AI
        </span>
        <span
          className={[
            'mt-2 block text-xs',
            dark ? 'text-[#40516b]' : 'text-white/75',
          ].join(' ')}
        >
          광주 2호선 개통에 따른 AI 상권 분석 예측 서비스
        </span>
      </span>
    </Link>
  )
}

function LeftIntro() {
  return (
    <section className="relative isolate min-h-[420px] overflow-hidden rounded-[22px] bg-[#eef8ff] pt-8 text-center xl:min-h-[710px] xl:self-stretch xl:overflow-visible xl:rounded-none xl:pt-[90px] xl:text-left">
      <div className="relative z-10 inline-flex xl:flex">
        <Logo dark />
      </div>

      <h1 className="relative z-10 mt-9 text-[clamp(2.75rem,3.5vw,3.5rem)] leading-[1.08] font-black tracking-[-0.04em] text-[#07152f] xl:mt-5">
        회원가입!
      </h1>
      <p className="relative z-10 mt-5 text-lg leading-8 tracking-[-0.02em] text-[#5f6d81] sm:text-xl xl:mt-4">
        계정을 생성하면 MetroPick AI의
        <br />
        모든 기능을 이용하실 수 있습니다.
      </p>

      <div
        className="pointer-events-none absolute top-0 right-[-80px] bottom-0 left-[-86px] z-0 opacity-90 xl:right-[-54px] xl:left-[-112px]"
        aria-hidden="true"
      >
        <img
          alt=""
          className="h-full w-full object-cover object-left-bottom"
          draggable={false}
          onError={(event) => {
            const image = event.currentTarget

            if (image.dataset.fallbackSrcApplied === 'true') {
              return
            }

            image.dataset.fallbackSrcApplied = 'true'
            image.src = landingAssets.heroTrainBg
          }}
          src={signupAssets.trainHero}
        />
        <div className="absolute inset-x-0 top-0 h-[54%] bg-gradient-to-b from-[#f3faff]/95 via-[#f6fbff]/78 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/80 via-white/35 to-transparent xl:h-16" />
      </div>
    </section>
  )
}

function UserTypeButton({
  active,
  Icon,
  label,
}: {
  active: boolean
  Icon: typeof UserRound
  label: string
}) {
  return (
    <button
      className={[
        'flex h-[50px] items-center justify-center gap-2 rounded-lg border text-sm font-black transition focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:outline-none sm:text-[15px]',
        active
          ? 'border-[#096bff] bg-[#f7fbff] text-[#096bff] shadow-[0_8px_20px_rgba(9,107,255,0.08)]'
          : 'border-[#d3ddea] bg-white text-[#536075] hover:bg-slate-50',
      ].join(' ')}
      type="button"
    >
      <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={1.9} />
      {label}
    </button>
  )
}

function AgreementRow({
  label,
  optional = false,
}: {
  label: string
  optional?: boolean
}) {
  return (
    <div className="flex min-h-7 flex-col gap-2 py-0.5 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex items-center gap-2 text-sm font-semibold text-[#33435b] sm:text-[15px]">
        <input className="h-4 w-4 accent-[#096bff]" type="checkbox" />
        <span>
          {label}{' '}
          {optional ? <em className="not-italic text-[#7c8798]">(선택)</em> : null}
        </span>
      </label>
      <button className="w-fit text-sm font-bold text-[#7f8da1]" type="button">
        자세히 보기 〉
      </button>
    </div>
  )
}

function SignupForm() {
  const navigate = useNavigate()

  const handleSignupSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    window.localStorage.setItem('metropick-authenticated', 'true')
    navigate('/onboarding')
  }

  return (
    <section className="min-w-0" aria-label="회원가입 입력 양식">
      <form className="grid gap-4" onSubmit={handleSignupSubmit}>
        <div>
          <label
            className="mb-2 block text-base font-black tracking-[-0.02em] text-[#0f2446]"
            htmlFor="signup-name"
          >
            이름
          </label>
          <input
            className="h-[52px] w-full rounded-lg border border-[#cbd7e6] bg-white px-5 text-base font-semibold text-[#10213d] outline-none transition placeholder:text-[#9ba8ba] focus:border-[#096bff] focus:ring-4 focus:ring-[#096bff]/10"
            id="signup-name"
            placeholder="이름을 입력해주세요"
            type="text"
          />
        </div>

        <div>
          <label
            className="mb-2 block text-base font-black tracking-[-0.02em] text-[#0f2446]"
            htmlFor="signup-email"
          >
            이메일
          </label>
          <input
            className="h-[52px] w-full rounded-lg border border-[#cbd7e6] bg-white px-5 text-base font-semibold text-[#10213d] outline-none transition placeholder:text-[#9ba8ba] focus:border-[#096bff] focus:ring-4 focus:ring-[#096bff]/10"
            id="signup-email"
            placeholder="이메일 주소를 입력해주세요"
            type="email"
          />
        </div>

        <div>
          <label
            className="mb-2 block text-base font-black tracking-[-0.02em] text-[#0f2446]"
            htmlFor="signup-password"
          >
            비밀번호
          </label>
          <div className="relative">
            <input
              className="h-[52px] w-full rounded-lg border border-[#cbd7e6] bg-white px-5 pr-14 text-base font-semibold text-[#10213d] outline-none transition placeholder:text-[#9ba8ba] focus:border-[#096bff] focus:ring-4 focus:ring-[#096bff]/10"
              id="signup-password"
              placeholder="영문, 숫자, 특수문자 포함 8자 이상"
              type="password"
            />
            <button
              aria-label="비밀번호 표시 전환"
              className="absolute top-1/2 right-3 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-xl text-[#758399] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:outline-none"
              type="button"
            >
              <EyeOff className="h-5 w-5" aria-hidden="true" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div>
          <label
            className="mb-2 block text-base font-black tracking-[-0.02em] text-[#0f2446]"
            htmlFor="signup-password-confirm"
          >
            비밀번호 확인
          </label>
          <div className="relative">
            <input
              className="h-[52px] w-full rounded-lg border border-[#cbd7e6] bg-white px-5 pr-14 text-base font-semibold text-[#10213d] outline-none transition placeholder:text-[#9ba8ba] focus:border-[#096bff] focus:ring-4 focus:ring-[#096bff]/10"
              id="signup-password-confirm"
              placeholder="비밀번호를 다시 입력해주세요"
              type="password"
            />
            <button
              aria-label="비밀번호 확인 표시 전환"
              className="absolute top-1/2 right-3 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-xl text-[#758399] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:outline-none"
              type="button"
            >
              <EyeOff className="h-5 w-5" aria-hidden="true" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <label
              className="block text-base font-black tracking-[-0.02em] text-[#0f2446]"
              htmlFor="user-type-help"
            >
              소속 유형
            </label>
            <span
              className="grid h-[18px] w-[18px] place-items-center rounded-full border border-[#9cadc4] text-xs font-black text-[#7b8aa0]"
              id="user-type-help"
            >
              ?
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {userTypes.map((type) => (
              <UserTypeButton
                active={type.active}
                Icon={type.Icon}
                key={type.label}
                label={type.label}
              />
            ))}
          </div>
        </div>

        <div className="mt-1 rounded-lg border border-[#e2e8f2] bg-[#fbfdff] px-4 py-2">
          <AgreementRow label="이용약관 동의" />
          <AgreementRow label="개인정보 수집 및 이용 동의" />
          <AgreementRow label="마케팅 정보 수신 동의" optional />
        </div>

        <button
          className="h-[52px] rounded-lg bg-gradient-to-r from-[#096bff] to-[#0057f2] text-base font-black text-white shadow-[0_14px_28px_rgba(0,101,255,0.2)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#096bff] focus-visible:ring-offset-2 focus-visible:outline-none"
          type="submit"
        >
          회원가입 완료
        </button>

        <p className="text-center text-base font-semibold text-[#637188]">
          이미 계정이 있으신가요?{' '}
          <Link className="font-black text-[#096bff]" to="/login">
            로그인
          </Link>
        </p>
      </form>
    </section>
  )
}

function BenefitItem({
  alt,
  desc,
  iconSrc,
  number,
  title,
}: {
  alt: string
  desc: string
  iconSrc: string
  number: string
  title: string
}) {
  return (
    <article className="relative grid grid-cols-[34px_72px_1fr] items-center gap-4 md:grid-cols-[34px_84px_1fr] md:gap-5">
      <div className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-[#096bff] text-sm font-black text-white shadow-[0_8px_18px_rgba(9,107,255,0.28)]">
        {number}
      </div>
      <div className="grid h-[72px] w-[72px] place-items-center rounded-2xl border border-white/80 bg-gradient-to-b from-[#eaf5ff] to-[#dbefff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)] md:h-[84px] md:w-[84px]">
        <img
          alt={alt}
          className="h-12 w-12 object-contain md:h-[58px] md:w-[58px]"
          draggable={false}
          loading="lazy"
          src={iconSrc}
        />
      </div>
      <div className="min-w-0">
        <h3 className="text-lg font-black tracking-[-0.025em] text-[#07152f] md:text-xl">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 font-semibold text-[#526178] md:text-base">
          {desc}
        </p>
      </div>
    </article>
  )
}

function BenefitPanel() {
  return (
    <aside className="min-w-0 rounded-2xl bg-[radial-gradient(circle_at_82%_10%,rgba(0,198,255,0.09),transparent_32%),linear-gradient(180deg,#f4f9ff_0%,#eef6ff_100%)] px-5 py-7 lg:px-8 xl:px-[34px] xl:py-8">
      <h2 className="flex items-center gap-3 text-xl leading-snug font-black tracking-[-0.03em] text-[#07152f] md:text-[22px]">
        <Sparkles
          className="h-6 w-6 shrink-0 text-[#096bff]"
          aria-hidden="true"
          strokeWidth={1.8}
        />
        <span>계정 생성 시 이런 혜택을 누리실 수 있어요!</span>
      </h2>

      <div className="relative mt-7 grid gap-7 before:absolute before:top-7 before:bottom-10 before:left-4 before:w-px before:bg-[#c7d8ee] before:content-['']">
        <BenefitItem
          alt="분석 리포트 저장 아이콘"
          desc="생성한 상권 분석 리포트를 저장하고 언제든 확인하세요."
          iconSrc={signupAssets.report}
          number="1"
          title="분석 리포트 저장"
        />
        <BenefitItem
          alt="맞춤형 역세권 알림 아이콘"
          desc="관심 지역의 개발 소식과 상권 변화를 실시간으로 받아보세요."
          iconSrc={signupAssets.bell}
          number="2"
          title="맞춤형 역세권 알림"
        />
        <BenefitItem
          alt="AI 추천 히스토리 아이콘"
          desc="AI 입지 추천 결과와 분석 히스토리를 저장하고 비교할 수 있어요."
          iconSrc={signupAssets.aiHistory}
          number="3"
          title="AI 추천 히스토리"
        />
      </div>

      <section className="mt-8 flex gap-4 rounded-xl border border-[#d2e4f8] bg-white/75 px-5 py-5 shadow-[0_12px_26px_rgba(10,76,143,0.06)]">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eef6ff] text-[#096bff]"
          aria-hidden="true"
        >
          <LockKeyhole className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-black tracking-[-0.025em] text-[#096bff]">
            안전한 데이터 보호
          </h3>
          <p className="mt-2 text-sm leading-7 font-semibold text-[#516176] md:text-[15px]">
            고객님의 정보는 안전하게 암호화되어 보호되며, 개인정보보호정책에 따라
            관리됩니다.
          </p>
        </div>
      </section>
    </aside>
  )
}

function SignupCard() {
  return (
    <section className="grid min-w-0 gap-8 rounded-3xl border border-[#dce9f7] bg-white/95 p-5 shadow-[0_28px_80px_rgba(11,56,118,0.15)] sm:p-8 2xl:grid-cols-[minmax(500px,660px)_minmax(360px,520px)] 2xl:p-10">
      <SignupForm />
      <BenefitPanel />
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#061b3f] via-[#061f4c] to-[#052a64] text-white">
      <div className="mx-auto grid min-h-[110px] w-[calc(100%_-_32px)] max-w-[1840px] items-center gap-6 py-7 text-center lg:w-[calc(100%_-_88px)] xl:grid-cols-[350px_1fr_420px_180px] xl:text-left">
        <Logo compact />

        <nav
          className="flex flex-wrap justify-center gap-3 text-sm font-semibold text-white/70 xl:gap-5"
          aria-label="푸터 링크"
        >
          {footerLinks.map((item) => (
            <a
              className="rounded-sm transition hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              href="/"
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>

        <address className="text-sm leading-6 text-white/75 not-italic">
          <p>(주)메트로픽시 ㅣ 대표이사: 김규현</p>
          <p>광주광역시 동구 금남로 193-22, 4층</p>
          <p>사업자등록번호: 123-45-67890 ㅣ 062-123-4567</p>
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

export function SignupPage() {
  return (
    <div className="signup-page min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_20%_25%,rgba(33,145,255,0.12),transparent_28%),radial-gradient(circle_at_85%_26%,rgba(0,213,210,0.1),transparent_26%),linear-gradient(180deg,#eef7ff_0%,#ffffff_58%,#ffffff_100%)] text-[#07152f]">
      <TopNavigation />

      <main className="mx-auto grid min-h-[calc(100vh-208px)] w-[calc(100%_-_32px)] max-w-[1700px] items-center gap-8 py-7 lg:w-[calc(100%_-_80px)] xl:grid-cols-[385px_minmax(0,1fr)] xl:gap-[45px]">
        <LeftIntro />
        <SignupCard />
      </main>

      <Footer />
    </div>
  )
}
