import { useState, type FormEvent } from 'react'
import {
  ChartNoAxesColumnIncreasing,
  Database,
  EyeOff,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { landingAssets } from '@/shared/assets/landingAssets'
import { AppFooter } from '@/shared/components/AppFooter'
import { ImageWithFallback } from '@/shared/components/ImageWithFallback'
import { TopNavigation } from '@/shared/components/TopNavigation'
import { loginAssets } from '@/shared/assets/loginAssets'
import { fetchOnboardingSettings } from '@/shared/api/backendOnboardingSettingsApi'
import {
  clearStoredOnboardingState,
  clearAuthUser,
  getStoredAuthUser,
  hasStoredAuthUserCompletedOnboarding,
  markStoredAuthUserOnboardingCompleted,
  saveAuthUser,
} from '@/shared/auth/authStorage'
import { signInWithEmail, signOut } from '@/shared/auth/supabaseAuth'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getLoginErrorMessage(message: string): string {
  if (message.includes('Email not confirmed')) {
    return '이메일 인증을 완료한 뒤 다시 로그인해주세요.'
  }

  return '이메일 또는 비밀번호를 확인해주세요.'
}

function PreviewImage({
  alt,
  className,
  loading,
  src,
}: {
  alt: string
  className: string
  loading?: 'eager' | 'lazy'
  src: string
}) {
  return (
    <ImageWithFallback
      alt={alt}
      className={className}
      draggable={false}
      fallbackText="미리보기 이미지를 불러올 수 없습니다."
      loading={loading}
      src={src}
    />
  )
}

function HeroVisual() {
  return (
    <div className="relative mt-8 min-h-[640px] overflow-visible md:min-h-[520px] xl:mt-[-14px] xl:h-[430px] xl:min-h-0 min-[1700px]:!mt-8 min-[1700px]:!h-[540px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-[-160px] left-[-300px] z-0 hidden h-[630px] overflow-hidden [mask-image:linear-gradient(90deg,black_0%,black_72%,transparent_100%)] md:block xl:bottom-[-180px] xl:left-[-250px] xl:h-[720px] min-[1700px]:!bottom-[-210px] min-[1700px]:!left-[-320px] min-[1700px]:!h-[844px]"
      >
        <img
          alt=""
          className="h-full w-full object-cover object-left-bottom opacity-90 mix-blend-multiply [mask-image:linear-gradient(180deg,transparent_0%,black_18%,black_78%,transparent_100%)]"
          draggable={false}
          src={landingAssets.heroTrainBg}
        />
      </div>

      <div className="relative z-10 grid gap-4 md:grid-cols-2 xl:absolute xl:inset-0 xl:block">
        <PreviewImage
          alt="광주 2호선 예상 상권 변화 지도 미리보기"
          className="mx-auto h-auto w-full max-w-[430px] rounded-[18px] border border-[#d3e3f5] bg-white/85 object-contain shadow-[0_20px_48px_rgba(0,42,103,0.12)] backdrop-blur md:mx-0 xl:absolute xl:top-[26px] xl:left-[118px] xl:w-[252px] min-[1700px]:!top-5 min-[1700px]:!left-[142px] min-[1700px]:!w-[315px]"
          loading="eager"
          src={loginAssets.mapPreview}
        />
        <PreviewImage
          alt="상권 성장 지수 추이 차트 미리보기"
          className="mx-auto h-auto w-full max-w-[390px] rounded-[18px] border border-[#d3e3f5] bg-white/85 object-contain shadow-[0_20px_48px_rgba(0,42,103,0.12)] backdrop-blur md:mx-0 xl:absolute xl:top-[88px] xl:left-[360px] xl:w-[258px] min-[1700px]:!top-[92px] min-[1700px]:!left-[444px] min-[1700px]:!w-[315px]"
          loading="lazy"
          src={loginAssets.growthChart}
        />
        <PreviewImage
          alt="핵심 인사이트 목록 미리보기"
          className="mx-auto h-auto w-full max-w-[300px] rounded-[18px] border border-[#d3e3f5] bg-white/85 object-contain shadow-[0_20px_48px_rgba(0,42,103,0.12)] backdrop-blur md:col-span-2 xl:absolute xl:top-[270px] xl:left-[280px] xl:w-[200px] min-[1700px]:!top-[310px] min-[1700px]:!left-[328px] min-[1700px]:!w-[250px]"
          loading="lazy"
          src={loginAssets.insightList}
        />
      </div>
    </div>
  )
}

function LoginCard() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')

  const getPostLoginPath = async () => {
    const storedUser = getStoredAuthUser()

    if (storedUser?.source !== 'supabase' || !storedUser.id) {
      return hasStoredAuthUserCompletedOnboarding() ? '/dashboard' : '/onboarding'
    }

    try {
      const response = await fetchOnboardingSettings()

      if (response.data_status === 'supabase_connected') {
        if (response.settings.length > 0) {
          markStoredAuthUserOnboardingCompleted()
          return '/dashboard'
        }

        if (hasStoredAuthUserCompletedOnboarding()) {
          return '/dashboard'
        }

        clearStoredOnboardingState()
        return '/onboarding'
      }
    } catch {
      // Keep the local fallback path when the backend is unavailable.
    }

    return hasStoredAuthUserCompletedOnboarding() ? '/dashboard' : '/onboarding'
  }

  const resetPreviousAuth = async () => {
    clearAuthUser()

    try {
      await signOut()
    } catch {
      // A failed sign-out should not block the next login attempt.
    }
  }

  const continueWithDemoLogin = (email: string) => {
    saveAuthUser({
      email: email || 'demo@metropick.ai',
      name: '데모 사용자',
      role: '예비 창업자',
      source: 'demo',
    })
    setMessage('Supabase Auth 미설정 · 데모 로그인으로 진행합니다.')
    window.setTimeout(() => {
      void getPostLoginPath().then((path) => navigate(path))
    }, 250)
  }

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    if (!email || !password) {
      setMessage('이메일과 비밀번호를 모두 입력해주세요.')
      return
    }

    if (!emailPattern.test(email)) {
      setMessage('올바른 이메일 주소를 입력해주세요.')
      return
    }

    await resetPreviousAuth()
    const result = await signInWithEmail(email, password)

    if (result.ok) {
      saveAuthUser({
        id: result.user.id,
        email: result.user.email ?? email,
        name:
          typeof result.user.user_metadata.name === 'string'
            ? result.user.user_metadata.name
            : result.user.email ?? email,
        role:
          typeof result.user.user_metadata.role === 'string'
            ? result.user.user_metadata.role
            : '예비 창업자',
        source: 'supabase',
      })
      navigate(await getPostLoginPath())
      return
    }

    if (result.reason === 'missing_client') {
      continueWithDemoLogin(email)
      return
    }

    setMessage(getLoginErrorMessage(result.message))
  }

  return (
    <section className="w-full rounded-[22px] border border-[#e3edf8] bg-white/95 px-6 py-9 shadow-[0_28px_70px_rgba(13,54,115,0.14)] sm:px-10 lg:px-14 xl:min-h-[512px] xl:px-[67px] xl:py-[30px] min-[1700px]:!min-h-[665px] min-[1700px]:!px-[84px] min-[1700px]:!py-[38px]">
      <div className="flex items-center justify-center gap-3 text-2xl font-black text-[#071633]">
        <img
          alt="MetroPick AI 로고"
          className="h-7 w-8 scale-[1.75] object-contain"
          draggable={false}
          src={landingAssets.logo}
        />
        <strong>MetroPick AI</strong>
      </div>

      <h2 className="mt-2 text-center text-[30px] font-black tracking-[-0.03em] text-[#071633] min-[1700px]:!mt-4 min-[1700px]:!text-[32px]">
        로그인
      </h2>
      <p className="text-center text-[15px] text-[#69778c] min-[1700px]:!mt-1">
        MetroPick AI에 오신 것을 환영합니다.
      </p>

      <form
        className="mt-4 grid gap-2 min-[1700px]:!mt-6"
        noValidate
        onSubmit={handleLoginSubmit}
      >
        <label className="text-sm font-extrabold text-[#0e1f3f]" htmlFor="login-email">
          이메일
        </label>
        <input
          className="h-10 rounded-lg border border-[#cfdbea] bg-white px-4 text-base text-[#0d1b35] outline-none transition placeholder:font-semibold placeholder:text-[#96a3b5] focus:border-[#0b6cff] focus:ring-4 focus:ring-[#0b6cff]/10 min-[1700px]:!h-[50px]"
          id="login-email"
          name="email"
          placeholder="이메일 주소를 입력하세요"
          required
          type="email"
        />

        <label
          className="mt-2 text-sm font-extrabold text-[#0e1f3f]"
          htmlFor="login-password"
        >
          비밀번호
        </label>
        <div className="relative">
          <input
            className="h-10 w-full rounded-lg border border-[#cfdbea] bg-white px-4 pr-12 text-base text-[#0d1b35] outline-none transition placeholder:font-semibold placeholder:text-[#96a3b5] focus:border-[#0b6cff] focus:ring-4 focus:ring-[#0b6cff]/10 min-[1700px]:!h-[50px]"
            id="login-password"
            name="password"
            placeholder="비밀번호를 입력하세요"
            required
            type="password"
          />
          <button
            aria-label="비밀번호 표시 전환"
            className="absolute top-1/2 right-3 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-[#6e7d92] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#0b6cff] focus-visible:outline-none"
            type="button"
          >
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="my-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#6a7789]">
            <input className="h-5 w-5 accent-[#0b6cff]" type="checkbox" />
            <span>로그인 상태 유지</span>
          </label>
          <Link className="text-sm font-extrabold text-[#0b6cff]" to="/login">
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        <button
          className="h-11 rounded-lg bg-gradient-to-r from-[#096bff] to-[#0057f2] text-lg font-black text-white shadow-[0_14px_28px_rgba(0,101,255,0.2)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#0b6cff] focus-visible:ring-offset-2 focus-visible:outline-none min-[1700px]:!h-[53px]"
          type="submit"
        >
          로그인
        </button>
        <button
          className="mt-2 h-11 rounded-lg border border-[#d4deea] bg-white text-lg font-black text-[#111c31] transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0b6cff] focus-visible:ring-offset-2 focus-visible:outline-none min-[1700px]:!h-[53px]"
          type="button"
        >
          카카오로 계속하기
        </button>

        <p className="mt-2 text-center text-base font-semibold text-[#738096]">
          아직 계정이 없나요?{' '}
          <Link className="font-black text-[#0b6cff]" to="/signup">
            회원가입
          </Link>
        </p>
        {message ? (
          <p
            aria-live="polite"
            className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-center text-sm font-extrabold text-blue-700"
          >
            {message}
          </p>
        ) : null}
      </form>
    </section>
  )
}

function BenefitCard({
  Icon,
  title,
  text,
}: {
  Icon: LucideIcon
  title: string
  text: string
}) {
  return (
    <article className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#dce7f4] bg-white/95 px-4 shadow-[0_12px_30px_rgba(20,78,132,0.07)] min-[1700px]:!min-h-20">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#e5fffb] to-[#eef6ff] text-[#0b6cff] min-[1700px]:!h-11 min-[1700px]:!w-11">
        <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={2.3} />
      </span>
      <div>
        <strong className="block text-sm font-black tracking-[-0.02em] text-[#0c1d3a]">
          {title}
        </strong>
        <p className="mt-1 text-xs text-[#6e7c90]">{text}</p>
      </div>
    </article>
  )
}

export function LoginPage() {
  return (
    <div className="login-page flex min-h-screen flex-col overflow-x-clip bg-[radial-gradient(circle_at_18%_35%,rgba(0,141,255,0.13),transparent_28%),radial-gradient(circle_at_82%_25%,rgba(0,204,217,0.13),transparent_24%),linear-gradient(180deg,#eef7ff_0%,#ffffff_54%,#ffffff_100%)] text-[#071633]">
      <TopNavigation />

      <main className="mx-auto w-[calc(100%_-_32px)] max-w-[1300px] flex-1 overflow-y-clip lg:w-[calc(100%_-_96px)] min-[1700px]:max-w-[1640px]">
        <section className="grid items-start gap-9 py-8 xl:min-h-[700px] xl:grid-cols-[626px_586px] xl:gap-16 xl:py-11 min-[1700px]:!min-h-[888px] min-[1700px]:!grid-cols-[790px_730px] min-[1700px]:!gap-[80px] min-[1700px]:!pt-[68px] min-[1700px]:!pb-[55px]">
          <div className="relative xl:min-h-[612px] min-[1700px]:!min-h-[750px]">
            <p className="relative z-10 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#b9d9ff] bg-[#eef7ff]/85 px-5 text-sm font-extrabold text-[#0069ff] shadow-[0_8px_22px_rgba(21,98,211,0.08)] sm:text-lg xl:min-h-9 min-[1700px]:!min-h-10">
              광주 2호선 개통 · 2026년 예정
            </p>
            <h1 className="relative z-10 mt-3 text-[clamp(2.625rem,3.35vw,4rem)] leading-[1.12] font-black tracking-[-0.045em] text-[#071633] min-[1700px]:!mt-4">
              데이터로 먼저 보는
              <br />
              <span className="text-[#096bff]">광주 상권의 미래</span>
            </h1>
            <p className="relative z-10 mt-3 max-w-2xl text-base leading-8 tracking-[-0.02em] text-[#5e6d82] sm:text-xl min-[1700px]:!mt-4">
              공공데이터와 AI 분석으로 변화하는 상권을 예측하고,
              <br className="hidden sm:block" />더 나은 의사결정을 앞서 준비하세요.
            </p>
            <HeroVisual />
          </div>

          <div className="grid gap-5 min-[1700px]:!gap-6">
            <LoginCard />
            <section className="grid gap-4 md:grid-cols-3" aria-label="서비스 신뢰 요소">
              <BenefitCard
                Icon={Database}
                title="공공데이터 기반"
                text="신뢰할 수 있는 데이터"
              />
              <BenefitCard
                Icon={ChartNoAxesColumnIncreasing}
                title="AI 예측"
                text="정확하고 객관적인 분석"
              />
              <BenefitCard
                Icon={ShieldCheck}
                title="안전한 데이터 처리"
                text="보안 인증 및 암호화"
              />
            </section>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  )
}
