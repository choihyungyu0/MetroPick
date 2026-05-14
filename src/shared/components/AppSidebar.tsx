import {
  BarChart3,
  BadgeHelp,
  ChartNoAxesCombined,
  FileText,
  Home,
  LineChart,
  MapPin,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
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
  { label: '관심 역세권', icon: MapPin, href: '/mypage?tab=interest-locations' },
  { label: '설정', icon: Settings, href: '/mypage?tab=notifications' },
]

const sidebarStatusCards: readonly AppSidebarItem[] = [
  { label: '데이터 업데이트', icon: ChartNoAxesCombined, href: '/report' },
  { label: '도움말 및 문의', icon: BadgeHelp, href: '/mypage#support' },
]

function SidebarInsights() {
  return (
    <div className="mt-auto grid gap-3">
      {sidebarStatusCards.map((item) => {
        const Icon = item.icon
        const description =
          item.label === '데이터 업데이트' ? '2024.05.18 기준' : 'FAQ · 고객센터'

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

  return (
    <aside className="app-sidebar flex min-h-[calc(100vh-var(--app-topbar-height)-var(--app-footer-height))] w-[252px] shrink-0 flex-col justify-between border-r border-blue-100 bg-white/90 px-3 py-6 max-[1121px]:hidden">
      <div>
        <Link
          aria-label="MetroPick AI 홈"
          className="flex items-center gap-2.5 px-3 pb-6 text-slate-900"
          to="/"
        >
          <img
            alt="MetroPick AI 로고"
            className="h-8 w-10 scale-[1.45] object-contain"
            draggable={false}
            src={landingAssets.logo}
          />
          <strong className="text-lg font-black">MetroPick AI</strong>
        </Link>

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
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-10 items-center gap-3 rounded-lg px-4 text-sm font-bold ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
                key={item.label}
                to={item.href}
              >
                <Icon aria-hidden="true" size={17} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <SidebarInsights />
    </aside>
  )
}
