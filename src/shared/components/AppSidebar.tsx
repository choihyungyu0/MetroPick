import {
  BarChart3,
  BadgeHelp,
  ChartNoAxesCombined,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Home,
  LineChart,
  MapPin,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { type MouseEvent, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { landingAssets } from '@/shared/assets/landingAssets'

type AppSidebarItem = {
  href: string
  icon: LucideIcon
  label: string
}

type AppSidebarProps = {
  activeHref: string
  ariaLabel?: string
}

const sidebarItems: readonly AppSidebarItem[] = [
  { label: '대시보드', icon: Home, href: '/dashboard' },
  { label: '상권 분석', icon: BarChart3, href: '/commercial-analysis' },
  { label: 'AI 예측', icon: LineChart, href: '/ai-prediction' },
  { label: '입지 추천', icon: MapPin, href: '/recommendation' },
  { label: '리포트', icon: FileText, href: '/report' },
  { label: '마이페이지', icon: UserRound, href: '/mypage' },
]

const sidebarStatusCards: readonly AppSidebarItem[] = [
  { label: '데이터 업데이트', icon: ChartNoAxesCombined, href: '/report' },
  { label: '도움말 및 문의', icon: BadgeHelp, href: '/mypage#support' },
]

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'metropick-sidebar-collapsed'

function getInitialCollapsedState() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
}

function SidebarInsights({ isCollapsed }: { isCollapsed: boolean }) {
  if (isCollapsed) {
    return (
      <div className="mt-auto grid gap-2">
        {sidebarStatusCards.map((item) => {
          const Icon = item.icon

          return (
            <Link
              aria-label={item.label}
              className="grid h-11 w-11 place-items-center rounded-xl border border-blue-100 bg-white text-cyan-600 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              key={item.label}
              title={item.label}
              to={item.href}
            >
              <Icon aria-hidden="true" size={18} />
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div className="mt-auto grid gap-3">
      {sidebarStatusCards.map((item) => {
        const Icon = item.icon
        const description =
          item.label === '데이터 업데이트' ? '실제 CSV 기준' : 'FAQ · 고객센터'

        return (
          <Link
            className="flex min-h-[62px] items-center gap-3 rounded-xl border border-blue-100 bg-white p-3 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
            key={item.label}
            to={item.href}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
              <Icon aria-hidden="true" size={18} />
            </span>
            <span>
              <strong className="block text-xs font-black">{item.label}</strong>
              <span className="mt-1 block text-xs font-bold text-slate-500">
                {description}
              </span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export function AppSidebar({
  activeHref,
  ariaLabel = '사이드 메뉴',
}: AppSidebarProps) {
  const location = useLocation()
  const currentHref = `${location.pathname}${location.search}`
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState)

  const handleToggleSidebar = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsCollapsed((current) => !current)
  }

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(isCollapsed),
    )
  }, [isCollapsed])

  return (
    <aside
      className={`app-sidebar flex min-h-[calc(100vh-var(--app-topbar-height)-var(--app-footer-height))] shrink-0 flex-col justify-between border-r border-blue-100 bg-white/90 px-3 py-6 transition-[width] duration-200 max-[1121px]:hidden ${
        isCollapsed ? 'w-[72px]' : 'w-[252px]'
      }`}
    >
      <div>
        <div
          className={`flex items-center gap-2.5 pb-6 ${
            isCollapsed ? 'justify-center px-0' : 'px-3'
          }`}
        >
          {isCollapsed ? null : (
            <Link
              aria-label="MetroPick AI 홈"
              className="flex min-w-0 items-center gap-2.5 text-slate-900"
              to="/"
            >
              <img
                alt="MetroPick AI 로고"
                className="h-8 w-10 scale-[1.45] object-contain"
                draggable={false}
                src={landingAssets.logo}
              />
              <strong className="text-lg font-black whitespace-nowrap">
                MetroPick AI
              </strong>
            </Link>
          )}
          <button
            aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-blue-100 bg-white text-slate-600 shadow-sm hover:bg-blue-50 ${
              isCollapsed ? '' : 'ml-auto'
            }`}
            onClick={handleToggleSidebar}
            title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            type="button"
          >
            {isCollapsed ? (
              <ChevronsRight aria-hidden="true" size={18} />
            ) : (
              <ChevronsLeft aria-hidden="true" size={18} />
            )}
          </button>
        </div>

        <nav aria-label={ariaLabel} className="grid gap-1.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const matchesPath =
              !item.href.includes('?') &&
              location.search === '' &&
              item.href === location.pathname
            const isActive =
              (location.search === '' && item.href === activeHref) ||
              item.href === currentHref ||
              matchesPath

            return (
              <Link
                aria-label={isCollapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-10 items-center rounded-lg text-sm font-bold ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-700 hover:bg-slate-50'
                } ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'}`}
                key={item.label}
                title={isCollapsed ? item.label : undefined}
                to={item.href}
              >
                <Icon aria-hidden="true" size={17} />
                {isCollapsed ? <span className="sr-only">{item.label}</span> : item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <SidebarInsights isCollapsed={isCollapsed} />
    </aside>
  )
}
