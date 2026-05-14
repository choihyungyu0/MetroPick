import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

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
  variant = 'desktop',
}: {
  activeHref?: string
  className?: string
  item: TopNavigationItem
  variant?: 'desktop' | 'menu'
}) {
  const buildLinkClasses = (isRouteActive: boolean) => {
    const isActive = item.active ?? (item.href === activeHref || isRouteActive)

    return cn(
      'inline-flex items-center px-3 text-base font-extrabold transition focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
      variant === 'desktop' &&
        'relative h-11 rounded-none text-white/90 hover:text-white',
      variant === 'menu' &&
        'h-10 rounded-md text-slate-800 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-[#086bff]',
      isActive &&
        variant === 'desktop' &&
        'text-white after:absolute after:right-3 after:-bottom-2 after:left-3 after:h-[3px] after:rounded-full after:bg-blue-500',
      isActive && variant === 'menu' && 'bg-blue-50 text-blue-700',
      className,
    )
  }

  if (item.href.startsWith('/')) {
    return (
      <NavLink
        className={({ isActive }) => buildLinkClasses(isActive)}
        end={item.href === '/'}
        to={item.href}
      >
        {item.label}
      </NavLink>
    )
  }

  return (
    <a className={buildLinkClasses(false)} href={item.href}>
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
        className="h-11 w-14 shrink-0 scale-[1.6] object-contain"
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
      <div className="relative flex h-[var(--app-topbar-height)] w-full items-center justify-between gap-5 px-8 max-md:px-4">
        <div className="min-w-[280px] max-md:min-w-0">
          <BrandLink />
        </div>

        <nav
          aria-label="주요 메뉴"
          className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-9 xl:flex"
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
                className="w-full justify-start"
                item={item}
                key={item.label}
                variant="menu"
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
