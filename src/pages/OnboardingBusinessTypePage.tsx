import { Link } from 'react-router-dom'

export function OnboardingBusinessTypePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6fbff] px-6 text-center text-[#07152f]">
      <section className="w-full max-w-xl rounded-2xl border border-[#dce9f7] bg-white p-8 shadow-[0_18px_52px_rgba(14,59,116,0.1)]">
        <p className="text-sm font-black text-[#096bff]">MetroPick AI 온보딩</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.045em]">분석 업종 설정</h1>
        <p className="mt-4 text-base leading-7 text-[#53637a]">
          다음 단계 화면은 추후 구현 예정입니다.
        </p>
        <Link
          className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-[#096bff] px-6 font-black text-white shadow-[0_12px_24px_rgba(9,107,255,0.2)]"
          to="/onboarding/stations"
        >
          역세권 설정으로 돌아가기
        </Link>
      </section>
    </main>
  )
}
