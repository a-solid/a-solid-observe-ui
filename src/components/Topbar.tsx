import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

type RoleKey = 'common' | 'alert' | 'config'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  match: (path: string) => boolean
}
interface RoleSegment {
  key: RoleKey
  label: string
  items: NavItem[]
}

/* Inline icons (16px stroke; consistent with the rest of the topbar) */
const DashboardIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
)
const BellIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
)
const PulseIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12h4l3 8 4-16 3 8h4" />
  </svg>
)
const FlowIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="M8.5 6h7M6 8.5v7M18 8.5v7M8.5 18h7" />
  </svg>
)
const FilterIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
  </svg>
)
const PlayIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const NAV_SEGMENTS: RoleSegment[] = [
  {
    key: 'common',
    label: 'Common',
    items: [
      { to: '/', label: 'Dashboard', icon: DashboardIcon, match: (p) => p === '/' },
    ],
  },
  {
    key: 'alert',
    label: 'Monitor',
    items: [
      { to: '/alerts', label: 'Alerts', icon: BellIcon, match: (p) => p.startsWith('/alerts') },
      { to: '/executions', label: 'Execution History', icon: PulseIcon, match: (p) => p.startsWith('/executions') },
    ],
  },
  {
    key: 'config',
    label: 'Build',
    items: [
      { to: '/pipelines', label: 'Rules', icon: FlowIcon, match: (p) => p.startsWith('/pipelines') },
      { to: '/subscriptions', label: 'Subscriptions', icon: FilterIcon, match: (p) => p.startsWith('/subscriptions') },
    ],
  },
]

function ChevronDown({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

const SEGMENT_ARIA: Record<RoleKey, string> = {
  common: 'Common navigation',
  alert: 'Monitor navigation',
  config: 'Build navigation',
}

/**
 * Shared top navigation. Replicates the demos' <header class="topbar"> but
 * reorganises the role tabs into visually-separated role segments so the
 * platform's two user types (Monitor vs Build) have a clear workspace
 * boundary. Adds a /demo entry as well.
 *
 * Variations across pages are handled via props:
 * - `showNamespace`: render the namespace switcher (default true)
 * - `leftExtra`: node rendered after the role segments (e.g. time-range on dashboard)
 * - `rightExtra`: node pushed to the right via a nav-spacer (connection pill, etc.)
 *   — if not provided, a default Demo entry button is shown
 * - `children`: full replacement for the entire topbar-inner (used by pages like
 *   a5 that have a completely custom toolbar — crumbs + validate/reset/save)
 * - `hideDemoEntry`: opt out of the default Demo entry button
 */
interface TopbarProps {
  showNamespace?: boolean
  leftExtra?: ReactNode
  rightExtra?: ReactNode
  children?: ReactNode
  namespace?: string
  hideDemoEntry?: boolean
}

export function Topbar({
  showNamespace = true,
  leftExtra,
  rightExtra,
  children,
  namespace = 'ops',
  hideDemoEntry = false,
}: TopbarProps) {
  const { pathname } = useLocation()

  if (children) {
    return (
      <header className="topbar">
        <div className="topbar-inner">{children}</div>
      </header>
    )
  }

  const demoEntry = hideDemoEntry ? null : (
    <Link className="demo-entry" to="/demo" aria-label="Live Demo">
      {PlayIcon}
      <span>Live Demo</span>
    </Link>
  )

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" />
          <span>A-Solid Observe</span>
        </Link>

        {showNamespace && (
          <button className="namespace-switch" type="button" aria-label="Switch namespace" title="Switch namespace">
            <span className="namespace-dot" />
            <span>namespace:&nbsp;<strong>{namespace}</strong></span>
            <ChevronDown />
          </button>
        )}

        <nav className="role-nav" aria-label="Main navigation">
          {NAV_SEGMENTS.map((seg, idx) => (
            <span key={seg.key} className="role-nav-group">
              {idx > 0 && <span className="role-divider" aria-hidden="true" />}
              <span
                className={`role-segment${seg.key === 'common' ? ' common' : ''}`}
                data-role={seg.key}
                aria-label={SEGMENT_ARIA[seg.key]}
              >
                {seg.key !== 'common' && (
                  <span className="role-segment-label" aria-hidden="true">{seg.label}</span>
                )}
                {seg.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`role-tab${item.match(pathname) ? ' active' : ''}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </span>
            </span>
          ))}
        </nav>

        {leftExtra}

        {(demoEntry || rightExtra) && <div className="nav-spacer" />}
        {demoEntry}
        {rightExtra}
      </div>
    </header>
  )
}
