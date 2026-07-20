import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface Subtab {
  to: string
  label: string
  icon: ReactNode
}

/**
 * Secondary nav for the b-series (Alerts) and a-series (Config) pages.
 * Active state derived from current path.
 */
export function Subtabs({ tabs }: { tabs: Subtab[] }) {
  const { pathname } = useLocation()
  return (
    <nav className="subtabs">
      <div className="subtabs-inner">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className={`subtab${pathname === t.to ? ' active' : ''}`}
          >
            {t.icon}
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
