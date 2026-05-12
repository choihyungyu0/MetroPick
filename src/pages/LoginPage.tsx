import { Link } from 'react-router-dom'

import { loginAssets } from '@/shared/assets/loginAssets'

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="flex items-center gap-3" to="/" aria-label="MetroPick AI 홈">
      <span
        className={[
          'relative inline-block shrink-0',
          compact ? 'h-7 w-8' : 'h-8 w-10',
        ].join(' ')}
        aria-hidden="true"
      >
        <span
          className={[
            'absolute top-1 left-0 rounded-[7px_7px_11px_11px] bg-gradient-to-br from-[#00d9d8] to-[#0a6dff] -skew-x-[14deg]',
            compact ? 'h-[22px] w-[17px]' : 'h-6 w-[19px]',
          ].join(' ')}
        />
        <span
          className={[
            'absolute top-1 right-0 rounded-[7px_7px_11px_11px] bg-gradient-to-br from-[#00d9d8] to-[#0a6dff] skew-x-[14deg]',
            compact ? 'h-[22px] w-[17px]' : 'h-6 w-[19px]',
          ].join(' ')}
        />
      </span>
      <span>
        <span
          className={[
            'block leading-none font-black tracking-[-0.03em] text-white',
            compact ? 'text-xl' : 'text-2xl',
          ].join(' ')}
        >
          MetroPick AI
        </span>
        <span className="mt-2 block text-xs text-white/75">
          광주 2호선 상권 예측 AI 분석·예측 서비스
        </span>
      </span>
    </Link>
  )
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
    <img alt={alt} className={className} draggable={false} loading={loading} src={src} />
  )
}

function HeroVisual() {
  return (
    <div className="relative mt-10 min-h-[660px] overflow-visible md:min-h-[700px] xl:absolute xl:right-0 xl:bottom-0 xl:left-[-48px] xl:mt-0 xl:h-[520px] xl:min-h-0">
      <div
        className="absolute bottom-20 left-0 hidden h-[300px] w-[320px] opacity-15 md:block"
        aria-hidden="true"
      >
        <div className="h-full w-full bg-[linear-gradient(to_top,rgba(72,158,238,0.5)_0_42%,transparent_42%)_0_160px/34px_160px_no-repeat,linear-gradient(to_top,rgba(72,158,238,0.42)_0_68%,transparent_68%)_46px_88px/48px_240px_no-repeat,linear-gradient(to_top,rgba(72,158,238,0.48)_0_52%,transparent_52%)_112px_138px/42px_190px_no-repeat,linear-gradient(to_top,rgba(72,158,238,0.4)_0_76%,transparent_76%)_180px_60px/54px_270px_no-repeat,linear-gradient(to_top,rgba(72,158,238,0.46)_0_58%,transparent_58%)_250px_128px/42px_200px_no-repeat]" />
      </div>
      <div
        className="absolute right-4 bottom-20 hidden h-[300px] w-[320px] scale-x-[-1] opacity-15 md:block"
        aria-hidden="true"
      >
        <div className="h-full w-full bg-[linear-gradient(to_top,rgba(72,158,238,0.5)_0_42%,transparent_42%)_0_160px/34px_160px_no-repeat,linear-gradient(to_top,rgba(72,158,238,0.42)_0_68%,transparent_68%)_46px_88px/48px_240px_no-repeat,linear-gradient(to_top,rgba(72,158,238,0.48)_0_52%,transparent_52%)_112px_138px/42px_190px_no-repeat,linear-gradient(to_top,rgba(72,158,238,0.4)_0_76%,transparent_76%)_180px_60px/54px_270px_no-repeat,linear-gradient(to_top,rgba(72,158,238,0.46)_0_58%,transparent_58%)_250px_128px/42px_200px_no-repeat]" />
      </div>

      <div
        className="absolute bottom-10 left-[-130px] h-[180px] w-[660px] origin-left-bottom -rotate-[14deg] scale-75 md:left-[-72px] xl:left-[-62px] xl:bottom-9 xl:scale-100"
        aria-hidden="true"
      >
        <div className="absolute bottom-[30px] left-[-20px] h-[34px] w-[760px] rounded-full border-y-4 border-t-[rgba(76,166,234,0.34)] border-b-[rgba(76,166,234,0.18)] bg-gradient-to-r from-[rgba(112,184,240,0.1)] to-[rgba(38,126,215,0.3)]" />
        <div className="absolute bottom-[68px] left-10 flex h-[86px] w-[420px] drop-shadow-[0_24px_32px_rgba(0,91,184,0.18)]">
          <div className="relative z-10 -mr-[22px] h-[86px] w-[86px] rounded-[22px_34px_34px_22px] border-[5px] border-[#a7d8f5] bg-gradient-to-br from-[#e8fbff] via-[#1bc6d6] to-[#0f6fe8]">
            <span className="absolute right-3 bottom-3 h-2.5 w-8 rounded-full bg-[#ffd047]" />
          </div>
          <div className="flex h-20 w-[340px] items-center gap-4 rounded-[26px_10px_10px_26px] border-[5px] border-[#a7d8f5] bg-gradient-to-b from-white to-[#dff7ff] pl-6">
            {[0, 1, 2].map((item) => (
              <span
                key={item}
                className="h-10 w-[76px] rounded-xl bg-gradient-to-br from-[#0ad4d9] to-[#0875e9] shadow-[inset_0_0_0_4px_rgba(255,255,255,0.45)]"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 grid gap-4 md:grid-cols-2 xl:block">
        <PreviewImage
          alt="광주 2호선 예상 상권 변화 지도 미리보기"
          className="mx-auto h-auto w-full max-w-[430px] rounded-[18px] border border-[#d3e3f5] bg-white/85 object-contain shadow-[0_20px_48px_rgba(0,42,103,0.12)] backdrop-blur md:mx-0 xl:absolute xl:bottom-[88px] xl:left-[280px] xl:w-[330px]"
          loading="eager"
          src={loginAssets.mapPreview}
        />
        <PreviewImage
          alt="상권 성장 지수 추이 차트 미리보기"
          className="mx-auto h-auto w-full max-w-[390px] rounded-[18px] border border-[#d3e3f5] bg-white/85 object-contain shadow-[0_20px_48px_rgba(0,42,103,0.12)] backdrop-blur md:mx-0 xl:absolute xl:right-[14px] xl:bottom-[98px] xl:w-[344px]"
          loading="lazy"
          src={loginAssets.growthChart}
        />
        <PreviewImage
          alt="핵심 인사이트 목록 미리보기"
          className="mx-auto h-auto w-full max-w-[300px] rounded-[18px] border border-[#d3e3f5] bg-white/85 object-contain shadow-[0_20px_48px_rgba(0,42,103,0.12)] backdrop-blur md:col-span-2 xl:absolute xl:bottom-[-10px] xl:left-[470px] xl:w-[250px]"
          loading="lazy"
          src={loginAssets.insightList}
        />
      </div>
    </div>
  )
}

function LoginCard() {
  return (
    <section className="w-full rounded-[22px] border border-[#e3edf8] bg-white/95 px-6 py-9 shadow-[0_28px_70px_rgba(13,54,115,0.14)] sm:px-10 lg:px-14 xl:min-h-[655px] xl:px-[88px] xl:py-[58px]">
      <div className="flex items-center justify-center gap-3 text-2xl font-black text-[#071633]">
        <span className="relative inline-block h-7 w-8" aria-hidden="true">
          <span className="absolute top-1 left-0 h-[22px] w-[17px] rounded-[7px_7px_11px_11px] bg-gradient-to-br from-[#00d9d8] to-[#0a6dff] -skew-x-[14deg]" />
          <span className="absolute top-1 right-0 h-[22px] w-[17px] rounded-[7px_7px_11px_11px] bg-gradient-to-br from-[#00d9d8] to-[#0a6dff] skew-x-[14deg]" />
        </span>
        <strong>MetroPick AI</strong>
      </div>

      <h2 className="mt-7 text-center text-3xl font-black tracking-[-0.03em] text-[#071633] sm:text-4xl">
        로그인
      </h2>
      <p className="mt-3 text-center text-base text-[#69778c]">
        MetroPick AI에 오신 것을 환영합니다.
      </p>

      <form className="mt-8 grid gap-3">
        <label className="text-sm font-extrabold text-[#0e1f3f]" htmlFor="login-email">
          이메일
        </label>
        <input
          className="h-14 rounded-lg border border-[#cfdbea] bg-white px-4 text-base text-[#0d1b35] outline-none transition placeholder:font-semibold placeholder:text-[#96a3b5] focus:border-[#0b6cff] focus:ring-4 focus:ring-[#0b6cff]/10"
          id="login-email"
          placeholder="이메일 주소를 입력하세요"
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
            className="h-14 w-full rounded-lg border border-[#cfdbea] bg-white px-4 pr-12 text-base text-[#0d1b35] outline-none transition placeholder:font-semibold placeholder:text-[#96a3b5] focus:border-[#0b6cff] focus:ring-4 focus:ring-[#0b6cff]/10"
            id="login-password"
            placeholder="비밀번호를 입력하세요"
            type="password"
          />
          <button
            aria-label="비밀번호 표시 전환"
            className="absolute top-1/2 right-3 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-[#6e7d92] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#0b6cff] focus-visible:outline-none"
            type="button"
          >
            ⌧
          </button>
        </div>

        <div className="my-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#6a7789]">
            <input className="h-5 w-5 accent-[#0b6cff]" type="checkbox" />
            <span>로그인 상태 유지</span>
          </label>
          <a className="text-sm font-extrabold text-[#0b6cff]" href="/login">
            비밀번호를 잊으셨나요?
          </a>
        </div>

        <button
          className="h-[62px] rounded-lg bg-gradient-to-r from-[#096bff] to-[#0057f2] text-lg font-black text-white shadow-[0_14px_28px_rgba(0,101,255,0.2)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#0b6cff] focus-visible:ring-offset-2 focus-visible:outline-none"
          type="button"
        >
          로그인
        </button>
        <button
          className="mt-2 h-[62px] rounded-lg border border-[#d4deea] bg-white text-lg font-black text-[#111c31] transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0b6cff] focus-visible:ring-offset-2 focus-visible:outline-none"
          type="button"
        >
          카카오로 계속하기
        </button>

        <p className="mt-4 text-center text-base font-semibold text-[#738096]">
          아직 계정이 없나요?{' '}
          <a className="font-black text-[#0b6cff]" href="/login">
            회원가입
          </a>
        </p>
      </form>
    </section>
  )
}

function BenefitCard({
  icon,
  title,
  text,
}: {
  icon: string
  title: string
  text: string
}) {
  return (
    <article className="flex min-h-20 items-center gap-3 rounded-2xl border border-[#dce7f4] bg-white/95 px-4 shadow-[0_12px_30px_rgba(20,78,132,0.07)]">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#e5fffb] to-[#eef6ff] text-xl">
        {icon}
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

function LoginFooter() {
  return (
    <footer className="bg-gradient-to-r from-[#061a3d] via-[#071d43] to-[#06265d] text-white">
      <div className="mx-auto grid min-h-28 w-[min(1500px,calc(100%-32px))] items-center gap-6 py-7 text-center lg:w-[min(1500px,calc(100%-96px))] lg:grid-cols-[1.2fr_1.5fr_1.45fr_auto] lg:text-left">
        <Logo compact />
        <nav
          className="flex flex-wrap justify-center gap-3 text-sm text-white/70 lg:gap-5"
          aria-label="로그인 푸터 링크"
        >
          {['이용약관', '개인정보처리방침', '데이터 출처', '문의하기'].map((item) => (
            <a
              className="hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              href="/login"
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>
        <address className="text-sm leading-6 text-white/70 not-italic">
          <p>(주)메트로픽시 ㅣ 대표이사: 김지훈</p>
          <p>광주광역시 동구 금남로 193-22, 4층</p>
          <p>고객센터: 062-123-4567 ㅣ 062-123-4567</p>
        </address>
        <div className="flex justify-center gap-3">
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

export function LoginPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_18%_35%,rgba(0,141,255,0.13),transparent_28%),radial-gradient(circle_at_82%_25%,rgba(0,204,217,0.13),transparent_24%),linear-gradient(180deg,#eef7ff_0%,#ffffff_54%,#ffffff_100%)] text-[#071633]">
      <header className="bg-gradient-to-r from-[#061a3d] via-[#071d43] to-[#06265d] text-white">
        <div className="mx-auto flex min-h-[88px] w-[min(1500px,calc(100%-32px))] items-center lg:w-[min(1500px,calc(100%-96px))]">
          <Logo />
        </div>
      </header>

      <main className="mx-auto w-[min(1500px,calc(100%-32px))] lg:w-[min(1500px,calc(100%-96px))]">
        <section className="grid items-center gap-9 py-10 xl:min-h-[900px] xl:grid-cols-[1.08fr_0.92fr] xl:gap-[88px] xl:py-12">
          <div className="relative xl:min-h-[760px]">
            <p className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#b9d9ff] bg-[#eef7ff]/85 px-5 text-sm font-extrabold text-[#0069ff] shadow-[0_8px_22px_rgba(21,98,211,0.08)] sm:text-lg">
              광주 2호선 개통 · 2026년 예정
            </p>
            <h1 className="mt-8 text-[clamp(2.625rem,4.2vw,4.75rem)] leading-[1.16] font-black tracking-[-0.045em] text-[#071633]">
              데이터로 먼저 보는
              <br />
              <span className="text-[#096bff]">광주 상권의 미래</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 tracking-[-0.02em] text-[#5e6d82] sm:text-xl">
              공공데이터와 AI 분석으로 변화하는 상권을 예측하고,
              <br className="hidden sm:block" />더 나은 의사결정을 앞서 준비하세요.
            </p>
            <HeroVisual />
          </div>

          <div className="grid gap-6">
            <LoginCard />
            <section className="grid gap-4 md:grid-cols-3" aria-label="서비스 신뢰 요소">
              <BenefitCard
                icon="□"
                title="공공데이터 기반"
                text="신뢰할 수 있는 데이터"
              />
              <BenefitCard icon="↗" title="AI 예측" text="정확하고 객관적인 분석" />
              <BenefitCard
                icon="◇"
                title="안전한 데이터 처리"
                text="보안 인증 및 암호화"
              />
            </section>
          </div>
        </section>
      </main>

      <LoginFooter />
    </div>
  )
}
