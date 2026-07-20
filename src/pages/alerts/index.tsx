import { useMemo, useState, type ReactElement, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Topbar } from '../../components/Topbar'
import { useNamespace } from '../../context/NamespaceContext'
import { useAlerts } from '../../hooks/useAlerts'
import type { AlertDto } from '../../api/types'
import './alerts.css'

const ICONS = {
  crit: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 6l6.5 12h-13L12 8zm-1 4v4h2v-4h-2zm0 5v2h2v-2h-2z" /></svg>
  ),
  warn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3L3 20h18L12 3z" strokeLinejoin="round" /><line x1="12" y1="10" x2="12" y2="14" /><circle cx="12" cy="17" r="0.8" fill="currentColor" /></svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="8" r="0.9" fill="currentColor" /></svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  dedup: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9" /><path d="M9 12l2 2 4-4" /></svg>
  ),
  pipeline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6h7M6 8.5v7M18 8.5v7M8.5 18h7" /></svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" /><path d="M16 5.5a3 3 0 0 1 0 5.8M21 20c0-2.42-1.43-4.5-3.5-5.4" /></svg>
  ),
}

type Severity = 'CRITICAL' | 'WARNING' | 'INFO'

const SEV_SHAPE: Record<Severity, ReactElement> = { CRITICAL: ICONS.crit, WARNING: ICONS.warn, INFO: ICONS.info }
const SEV_CLASS: Record<Severity, string> = { CRITICAL: 'critical', WARNING: 'warning', INFO: 'info' }

interface Filters {
  sev: 'all' | Severity
  status: 'all' | string
  team: 'all' | string
  q: string
}

const STATUS_VISUAL_CLASS: Record<string, string> = { ACTIVE: 'firing', EXPIRED: 'resolved', FIRING: 'firing', RESOLVED: 'resolved' }

function formatTime(iso: string): string {
  if (!iso) return '--'
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMin = Math.round((now.getTime() - d.getTime()) / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin} min ago`
    if (diffMin < 1440) return `${Math.round(diffMin / 60)} hours ago`
    return d.toLocaleDateString()
  } catch {
    return iso
  }
}

function AlertCard({ a }: { a: AlertDto }) {
  const sev = a.severity as Severity
  const statusCls = STATUS_VISUAL_CLASS[a.status] ?? 'firing'
  const entity = a.labels?.app ?? a.labelApp ?? '--'
  const description = a.annotations?.summary ?? a.annotations?.description ?? 'No description'
  const teamLabel = a.labelTeam ?? a.labels?.team ?? '--'
  const time = a.status === 'EXPIRED' ? (a.endsAt || a.lastSeenAt || a.startsAt) : a.startsAt

  return (
    <Link
      to={`/alerts/${a.id}`}
      className={`alert-card ${SEV_CLASS[sev] ?? 'info'} ${statusCls}`}
    >
      <div className="alert-bar" />
      <div className="alert-sev-icon">
        <div className="sev-shape">{SEV_SHAPE[sev] ?? SEV_SHAPE.INFO}</div>
      </div>
      <div className="alert-body">
        <div className="alert-title-row">
          <span className="alert-fp">{a.fingerprint}</span>
          <span className="pipeline-tag">{ICONS.pipeline}#{a.pipelineId}</span>
          <span className="team-tag">{ICONS.users}{teamLabel}</span>
        </div>
        <div className="alert-entity">labels.app = <strong>"{entity}"</strong></div>
        <div className="alert-desc">{description}</div>
        <div className="alert-meta">
          <span className="alert-meta-item">{ICONS.clock}<strong>{formatTime(time)}</strong></span>
          {a.dedupCount > 0 && (
            <span className="alert-meta-item dedup">{ICONS.dedup}dedupCount = <span className="num">{a.dedupCount}</span></span>
          )}
          {a.status === 'EXPIRED' && (
            <span className="alert-meta-item" style={{ color: '#15803D' }}>✓ expired</span>
          )}
          {a.disposition === 'ACKNOWLEDGED' && (
            <span className="alert-meta-item" style={{ color: 'var(--color-accent)' }}>ack · {a.ackBy}</span>
          )}
          {a.disposition === 'IGNORED' && (
            <span className="alert-meta-item" style={{ color: 'var(--color-text-muted)' }}>ignored</span>
          )}
        </div>
      </div>
      <div className="alert-right">
        <span className={`status-badge ${statusCls}`}>{a.status}</span>
        <span className="alert-time">startsAt <strong>{formatTime(a.startsAt)}</strong></span>
      </div>
    </Link>
  )
}

function Alerts() {
  const { namespace } = useNamespace()
  const [filters, setFilters] = useState<Filters>({ sev: 'all', status: 'all', team: 'all', q: '' })
  const [page, setPage] = useState(1)
  const pageSize = 20

  const params = {
    namespace,
    ...(filters.sev !== 'all' ? { severity: filters.sev } : {}),
    ...(filters.status !== 'all' ? { status: filters.status } : {}),
    ...(filters.team !== 'all' ? { team: filters.team } : {}),
    page,
    size: pageSize,
  }

  const { data, isLoading, isError, refetch } = useAlerts(params)
  const alerts = data?.data ?? []
  const pageInfo = data?.page
  const totalPages = pageInfo ? Math.ceil(pageInfo.total / pageInfo.size) : 1

  const filtered = useMemo(() => {
    let list = alerts
    if (filters.q) {
      const q = filters.q.toLowerCase()
      list = list.filter((a) =>
        a.fingerprint?.toLowerCase().includes(q) ||
        a.labels?.app?.toLowerCase().includes(q) ||
        (a.annotations?.summary ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [alerts, filters.q])

  const total = pageInfo?.total ?? 0

  const sevCards: { cls: string; dataSev: 'all' | Severity; label: ReactNode; count: number; meta: string | null }[] = [
    { cls: 'total', dataSev: 'all', label: 'All Alerts', count: total, meta: 'Server-side paginated' },
    { cls: 'critical', dataSev: 'CRITICAL', label: <><span className="sev-icon">▲</span>CRITICAL</>, count: alerts.filter((a) => a.severity === 'CRITICAL').length, meta: 'This page' },
    { cls: 'warning', dataSev: 'WARNING', label: <><span className="sev-icon">△</span>WARNING</>, count: alerts.filter((a) => a.severity === 'WARNING').length, meta: 'This page' },
    { cls: 'info', dataSev: 'INFO', label: <><span className="sev-icon">○</span>INFO</>, count: alerts.filter((a) => a.severity === 'INFO').length, meta: 'This page' },
  ]

  const setSev = (sev: 'all' | Severity) => { setFilters((f) => ({ ...f, sev })); setPage(1) }

  const teams = ['payment', 'risk', 'ops']

  return (
    <>
      <Topbar />

      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Alerts</h1>
            <p className="page-subtitle">
              <span className="num">{total}</span> alerts total
            </p>
          </div>
        </div>

        <div className="severity-overview">
          {sevCards.map((c) => (
            <div
              key={c.dataSev}
              className={`sev-card ${c.cls}${filters.sev === c.dataSev || (c.dataSev === 'all' && filters.sev === 'all') ? ' active' : ''}`}
              onClick={() => setSev(c.dataSev === 'all' ? 'all' : c.dataSev)}
            >
              <div className="sev-card-head">
                <div className="sev-label">{c.label}</div>
              </div>
              <div className="sev-count mono">{c.count}</div>
              <div className="sev-meta">{c.meta}</div>
            </div>
          ))}
        </div>

        <div className="filters">
          <div className="filter-group">
            <span className="filter-label">Severity</span>
            <div className="severity-picker">
              <button className={`sev-pill${filters.sev === 'all' ? ' active' : ''}`} onClick={() => setSev('all')}>All</button>
              <button className={`sev-pill crit${filters.sev === 'CRITICAL' ? ' active' : ''}`} onClick={() => setSev('CRITICAL')}><span>▲</span> CRITICAL</button>
              <button className={`sev-pill warn${filters.sev === 'WARNING' ? ' active' : ''}`} onClick={() => setSev('WARNING')}><span>△</span> WARNING</button>
              <button className={`sev-pill info${filters.sev === 'INFO' ? ' active' : ''}`} onClick={() => setSev('INFO')}><span>○</span> INFO</button>
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Status</span>
            <div className="status-picker">
              {(['all', 'ACTIVE', 'EXPIRED'] as const).map((st) => (
                <button
                  key={st}
                  className={`opt-pill${filters.status === st || (st === 'all' && filters.status === 'all') ? ' active' : ''}`}
                  onClick={() => { setFilters((f) => ({ ...f, status: st === 'all' ? 'all' : st })); setPage(1) }}
                >
                  {st === 'all' ? 'All' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Team</span>
            <div className="team-picker">
              {([['all', 'All'], ...teams.map((t) => [t, t.charAt(0).toUpperCase() + t.slice(1)])] as const).map(([team, label]) => (
                <button
                  key={team}
                  className={`opt-pill${filters.team === team ? ' active' : ''}`}
                  onClick={() => { setFilters((f) => ({ ...f, team })); setPage(1) }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-spacer" />

          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input
              type="text"
              placeholder="Search fingerprint / app…"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value.trim() }))}
            />
          </div>
        </div>

        {isLoading && (
          <div className="list-footer"><span className="num">Loading alerts...</span></div>
        )}

        {isError && (
          <div className="list-footer">
            <span className="num" style={{ color: 'var(--severity-critical)' }}>Failed to load.</span>{' '}
            <button className="btn btn-ghost" onClick={() => refetch()}>Retry</button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="alert-list">
              {filtered.map((a, i) => (
                <div key={a.id} style={{ animationDelay: `${Math.min(i * 35, 400)}ms` }}>
                  <AlertCard a={a} />
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="list-footer">No alerts match the filters.</div>
              )}
            </div>

            <div className="list-footer" style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
              <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span className="num">Page {page} / {totalPages}</span>
              <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          </>
        )}
      </main>
    </>
  )
}

export default Alerts
