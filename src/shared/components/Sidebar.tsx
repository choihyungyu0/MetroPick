import { NavLink } from 'react-router-dom'

import { navigationItems } from './navigation'

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <nav className="sticky top-[73px] space-y-2 p-4" aria-label="주요 화면">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'block rounded-md px-4 py-3 text-sm font-semibold',
                isActive ? 'bg-city-700 text-white' : 'text-slate-700 hover:bg-slate-100',
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
