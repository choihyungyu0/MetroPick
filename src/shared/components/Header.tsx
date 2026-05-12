import { Link, NavLink } from 'react-router-dom'

import { navigationItems } from './navigation'

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link className="min-w-0" to="/dashboard" aria-label="대시보드로 이동">
          <span className="block text-sm font-bold text-city-700">MetroPick</span>
          <span className="block truncate text-xs text-slate-500">
            광주 2호선 공공데이터 시나리오 MVP
          </span>
        </Link>
        <nav className="flex gap-2 overflow-x-auto lg:hidden" aria-label="주요 화면">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'shrink-0 rounded-md px-3 py-2 text-sm font-semibold',
                  isActive
                    ? 'bg-city-700 text-white'
                    : 'text-slate-700 hover:bg-slate-100',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
