import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { landingAssets } from '@/shared/assets/landingAssets'
import { cn } from '@/shared/lib/cn'

export type TopNavigationItem = {
  active?: boolean
  href: string
  label: string
}

type TopNavigationProps = {
  activeHref?: string
  className?: string
  ctaHref?: string
  ctaLabel?: string
  navItems?: readonly TopNavigationItem[]
  renderActions?: () => ReactNode
  sticky?: boolean
}

const defaultNavItems: readonly TopNavigationItem[] = [
  { label: '서비스 소개', href: '/' },
  { label: '상권 분석', href: '/commercial-analysis' },
  { label: 'AI 예측', href: '/ai-prediction' },
  { label: '입지 추천', href: '/recommendation' },
  { label: '리포트', href: '/report' },
]

const defaultSubtitle = '광주 2호선 개통에 따른 AI 상권 변화 예측 서비스'

const actionLinkClasses =
  'inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-black transition focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none'

function NavigationLink({
  activeHref,
  className,
  item,
}: {
  activeHref?: string
  className?: string
  item: TopNavigationItem
}) {
  const isActive = item.active ?? item.href === activeHref
  const linkClasses = cn(
    'inline-flex h-11 items-center rounded-md px-3 text-base font-extrabold text-white/90 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
    isActive && 'bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]',
    className,
  )

  if (item.href.startsWith('/')) {
    return (
      <Link
        aria-current={isActive ? 'page' : undefined}
        className={linkClasses}
        to={item.href}
      >
        {item.label}
      </Link>
    )
  }

  return (
    <a className={linkClasses} href={item.href}>
      {item.label}
    </a>
  )
}

function BrandLink() {
  return (
    <Link
      aria-label="MetroPick AI 홈"
      className="flex min-w-0 items-center gap-3"
      to="/"
    >
      <img
        alt="MetroPick AI 로고"
        className="h-9 w-11 shrink-0 scale-[1.45] object-contain"
        draggable={false}
        src={landingAssets.logo}
      />
      <span className="min-w-0">
        <span className="block truncate text-xl leading-tight font-black text-white">
          MetroPick AI
        </span>
        <span className="mt-1 hidden truncate text-xs font-semibold text-white/75 sm:block">
          {defaultSubtitle}
        </span>
      </span>
    </Link>
  )
}

export function TopNavigation({
  activeHref,
  className,
  ctaHref = '/signup',
  ctaLabel = '무료로 시작하기',
  navItems = defaultNavItems,
  renderActions,
  sticky = false,
}: TopNavigationProps) {
  const renderDefaultActions = () => (
    <>
      <Link
        className={cn(
          actionLinkClasses,
          'min-w-[118px] border border-white/50 bg-slate-950/25 text-white hover:bg-white/10',
        )}
        to="/login"
      >
        로그인
      </Link>
      <Link
        className={cn(
          actionLinkClasses,
          'min-w-[170px] bg-[#086bff] text-white shadow-[0_12px_24px_rgba(0,102,255,0.26)] hover:bg-[#0054dc]',
        )}
        to={ctaHref}
      >
        {ctaLabel}
      </Link>
    </>
  )
  const renderActionContent = renderActions ?? renderDefaultActions

  return (
    <header
      className={cn(
        sticky ? 'sticky top-0' : 'relative',
        'z-50 bg-[linear-gradient(90deg,#061a3d_0%,#061f4c_52%,#052a64_100%)] text-white shadow-[0_1px_0_rgba(255,255,255,0.08)]',
        className,
      )}
    >
      <div className="mx-auto flex h-[var(--app-topbar-height)] w-[min(1840px,calc(100%-32px))] items-center justify-between gap-5">
        <div className="min-w-[280px] max-md:min-w-0">
          <BrandLink />
        </div>

        <nav
          aria-label="주요 메뉴"
          className="hidden min-w-0 flex-1 items-center justify-center gap-5 overflow-x-auto xl:flex"
        >
          {navItems.map((item) => (
            <NavigationLink activeHref={activeHref} item={item} key={item.label} />
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {renderActionContent()}
        </div>

        <details className="relative shrink-0 xl:hidden">
          <summary className="grid h-11 cursor-pointer list-none place-items-center rounded-lg border border-white/40 px-4 text-sm font-black text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none">
            메뉴
          </summary>
          <div className="absolute right-0 mt-3 grid w-64 gap-1 rounded-lg border border-slate-200 bg-white p-2 text-slate-900 shadow-xl">
            {navItems.map((item) => (
              <NavigationLink
                activeHref={activeHref}
                className="w-full justify-start text-slate-800 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-[#086bff]"
                item={item}
                key={item.label}
              />
            ))}
            <div className="mt-2 grid gap-2 border-t border-slate-100 pt-2">
              {renderActionContent()}
            </div>
          </div>
        </details>
      </div>
    </header>
  )
}
