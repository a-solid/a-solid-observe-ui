import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

const ROLE_TABS = [
  { label: '大盘', to: '/' },
  { label: '告警', to: '/alerts' },
  { label: '配置', to: '/pipelines' },
] as const

function ChevronDown({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

/**
 * Shared top navigation. Replicates the demos' <header class="topbar">.
 *
 * Variations across pages are handled via props:
 * - `showNamespace`: render the namespace switcher (default true)
 * - `leftExtra`: node rendered after role-tabs (e.g. time-range on dashboard)
 * - `rightExtra`: node pushed to the right via a nav-spacer (connection pill, etc.)
 * - `children`: full replacement for the entire topbar-inner (used by pages like
 *   a5 that have a completely custom toolbar — crumbs + validate/reset/save)
 * - `activeRole`: overrides which role tab is highlighted
 */
interface TopbarProps {
  showNamespace?: boolean
  activeRole?: '大盘' | '告警' | '配置'
  leftExtra?: ReactNode
  rightExtra?: ReactNode
  children?: ReactNode
  namespace?: string
}

export function Topbar({
  showNamespace = true,
  activeRole,
  leftExtra,
  rightExtra,
  children,
  namespace = 'ops',
}: TopbarProps) {
  const { pathname } = useLocation()

  // Derive active role from path if not explicitly provided.
  const resolvedActive =
    activeRole ??
    (pathname === '/'
      ? '大盘'
      : pathname.startsWith('/alerts') || pathname.startsWith('/executions')
        ? '告警'
        : '配置')

  if (children) {
    return (
      <header className="topbar">
        <div className="topbar-inner">{children}</div>
      </header>
    )
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" />
          <span>A-Solid Observe</span>
        </Link>

        {showNamespace && (
          <button className="namespace-switch" type="button" aria-label="切换 namespace" title="切换 namespace">
            <span className="namespace-dot" />
            <span>namespace:&nbsp;<strong>{namespace}</strong></span>
            <ChevronDown />
          </button>
        )}

        <nav className="role-tabs" aria-label="角色导航">
          {ROLE_TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className={`role-tab${tab.label === resolvedActive ? ' active' : ''}`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {leftExtra}

        {rightExtra && <div className="nav-spacer" />}
        {rightExtra}
      </div>
    </header>
  )
}
