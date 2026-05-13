import {
  BarChart3,
  ChartNoAxesCombined,
  FileText,
  Home,
  LineChart,
  MapPin,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

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

export function AppSidebar({
  activeHref,
  ariaLabel = '사이드 메뉴',
}: AppSidebarProps) {
  return (
    <aside className="app-sidebar flex min-h-[calc(100vh-var(--app-topbar-height))] w-[252px] shrink-0 flex-col justify-between border-r border-blue-100 bg-white/90 px-3 py-6 max-lg:hidden">
      <div>
        <Link
          aria-label="MetroPick AI 홈"
          className="flex items-center gap-2.5 px-3 pb-6 text-slate-900"
          to="/"
        >
          <img
            alt="MetroPick AI 로고"
            className="h-7 w-8 object-contain"
            draggable={false}
            src={landingAssets.logo}
          />
          <strong className="text-lg font-black">MetroPick AI</strong>
        </Link>

        <nav aria-label={ariaLabel} className="grid gap-1.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === activeHref

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

      <div className="grid gap-3">
        <div className="flex gap-3 rounded-xl border border-blue-100 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
            <TrendingUp aria-hidden="true" size={18} />
          </div>
          <div>
            <div className="text-xs font-black">
              AI 예측 정확도
              <span className="ml-2 rounded-md bg-blue-600 px-2 py-1 text-xs text-white">
                Pro
              </span>
            </div>
            <p className="my-2 text-xs font-bold text-slate-500">상위 5% 예측 정확도</p>
            <button className="text-xs font-black text-blue-600" type="button">
              상세 보기
            </button>
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-blue-100 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
            <ChartNoAxesCombined aria-hidden="true" size={18} />
          </div>
          <div>
            <div className="text-xs font-black">분석 크레딧</div>
            <h4 className="my-2 text-sm font-black">잔여 1,250 크레딧</h4>
            <div className="mb-3 h-2 w-32 overflow-hidden rounded-full bg-slate-200">
              <span className="block h-full w-[58%] rounded-full bg-gradient-to-r from-teal-500 to-emerald-400" />
            </div>
            <button className="text-xs font-black text-blue-600" type="button">
              충전하기
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
