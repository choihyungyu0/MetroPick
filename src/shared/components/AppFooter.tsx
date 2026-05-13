import { Link } from 'react-router-dom'

import { landingAssets } from '@/shared/assets/landingAssets'
import { cn } from '@/shared/lib/cn'

type AppFooterProps = {
  className?: string
}

const footerLinks = [
  { label: '서비스 소개', href: '/#service-intro' },
  { label: '이용약관', href: '/' },
  { label: '개인정보처리방침', href: '/' },
  { label: '데이터 출처', href: '/' },
  { label: '문의하기', href: '/' },
] as const

const socialLinks = [
  { label: 'Facebook', text: 'f' },
  { label: 'Naver', text: 'N' },
  { label: 'YouTube', text: '▶' },
] as const

export function AppFooter({ className }: AppFooterProps) {
  return (
    <footer
      className={cn(
        'app-footer bg-[linear-gradient(90deg,#061a3d_0%,#061f4c_52%,#052a64_100%)] text-white',
        className,
      )}
    >
      <div className="mx-auto grid min-h-[var(--app-footer-height)] w-[calc(100%_-_32px)] max-w-[1720px] items-center gap-6 py-5 text-center lg:w-[calc(100%_-_96px)] lg:grid-cols-[340px_minmax(320px,1fr)_390px_170px] lg:text-left">
        <Link
          aria-label="MetroPick AI 홈"
          className="flex min-w-0 items-center justify-center gap-3 lg:justify-start"
          to="/"
        >
          <img
            alt="MetroPick AI 로고"
            className="h-9 w-11 shrink-0 scale-[1.45] object-contain"
            draggable={false}
            src={landingAssets.logo}
          />
          <span className="min-w-0">
            <strong className="block truncate text-2xl font-black tracking-[-0.03em]">
              MetroPick AI
            </strong>
            <span className="mt-1 block truncate text-xs font-semibold text-white/72">
              광주 2호선 개통에 따른 AI 상권 변화 예측 서비스
            </span>
          </span>
        </Link>

        <nav
          aria-label="푸터 링크"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold text-white/76"
        >
          {footerLinks.map((item) => (
            <Link
              className="rounded-sm transition hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              key={item.label}
              to={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <address className="text-sm leading-6 font-semibold text-white/72 not-italic">
          <p>(주)메트로픽AI ㅣ 대표이사: 김지훈</p>
          <p>광주광역시 동구 금남로 193-22, 4층</p>
          <p>사업자등록번호: 123-45-67890 ㅣ 062-123-4567</p>
        </address>

        <div className="flex justify-center gap-3 lg:justify-end">
          {socialLinks.map((item) => (
            <button
              aria-label={`${item.label} 링크`}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/5 font-black text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              key={item.label}
              type="button"
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
    </footer>
  )
}
