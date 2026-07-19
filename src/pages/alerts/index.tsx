import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Topbar } from '../../components/Topbar'
import { useCountUp } from '../../lib/useCountUp'
import { alerts as initialAlerts, incoming, severityCounts, type Alert, type Severity } from './mock'
import './alerts.css'

/* Inline icon SVGs (1:1 from b1-alerts.html) */
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

const SEV_SHAPE: Record<Severity, ReactElement> = { CRITICAL: ICONS.crit, WARNING: ICONS.warn, INFO: ICONS.info }
const SEV_CLASS: Record<Severity, string> = { CRITICAL: 'critical', WARNING: 'warning', INFO: 'info' }
const SEV_SHAPE_CLASS: Record<Severity, string> = { CRITICAL: 'crit', WARNING: 'warn', INFO: '' }

interface Filters {
  sev: 'all' | Severity
  status: 'all' | 'FIRING' | 'RESOLVED'
  team: 'all' | string
  q: string
}

function passes(a: Alert, f: Filters): boolean {
  if (f.sev !== 'all' && a.severity !== f.sev) return false
  if (f.status !== 'all' && a.status !== f.status) return false
  if (f.team !== 'all' && a.team !== f.team) return false
  if (f.q) {
    const q = f.q.toLowerCase()
    if (!a.fingerprint.toLowerCase().includes(q) && !a.entity.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false
  }
  return true
}

function AlertCard({ a }: { a: Alert }) {
  const time = a.status === 'RESOLVED' ? (a.resolvedAt || a.startedAt) : a.startedAt
  return (
    <Link
      to={`/alerts/${a.id}`}
      className={`alert-card ${SEV_CLASS[a.severity]} ${a.status.toLowerCase()}${a.new ? ' new' : ''}`}
    >
      <div className="alert-bar" />
      <div className="alert-sev-icon">
        <div className={`sev-shape ${SEV_SHAPE_CLASS[a.severity]}`}>{SEV_SHAPE[a.severity]}</div>
      </div>
      <div className="alert-body">
        <div className="alert-title-row">
          <span className="alert-fp">{a.fingerprint}</span>
          <span className="pipeline-tag">{ICONS.pipeline}{a.pipeline}</span>
          <span className="team-tag">{ICONS.users}{a.teamLabel}</span>
        </div>
        <div className="alert-entity">labels.entity = <strong>"{a.entity}"</strong></div>
        <div className="alert-desc">{a.description}</div>
        <div className="alert-meta">
          <span className="alert-meta-item">{ICONS.clock}<strong>{time}</strong></span>
          {a.dedupCount > 0 && (
            <span className="alert-meta-item dedup">{ICONS.dedup}dedupCount = <span className="num">{a.dedupCount}</span></span>
          )}
          {a.status === 'RESOLVED' && (
            <span className="alert-meta-item" style={{ color: '#15803D' }}>✓ resolved</span>
          )}
        </div>
      </div>
      <div className="alert-right">
        <span className={`status-badge ${a.status.toLowerCase()}`}>{a.status}</span>
        <span className="alert-time">startsAt <strong>{a.startedAt}</strong></span>
      </div>
    </Link>
  )
}

function Alerts() {
  const [filters, setFilters] = useState<Filters>({ sev: 'all', status: 'all', team: 'all', q: '' })
  const [list, setList] = useState<Alert[]>(initialAlerts)

  const filtered = useMemo(() => {
    const rank = (a: Alert) => {
      const sevRank = a.severity === 'CRITICAL' ? 0 : a.severity === 'WARNING' ? 1 : 2
      const stRank = a.status === 'FIRING' ? 0 : 1
      return sevRank * 10 + stRank
    }
    return list.filter((a) => passes(a, filters)).sort((a, b) => rank(a) - rank(b))
  }, [list, filters])

  // Simulate live incoming alerts (respects reduced-motion).
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    let idx = 0
    const timer = window.setInterval(() => {
      const next = incoming[idx % incoming.length]
      idx++
      const a: Alert = { ...next, id: `${next.id}_${Date.now()}`, new: true }
      if (!passes(a, filters)) return
      setList((prev) => {
        const updated = [a, ...prev]
        return updated.length > 24 ? updated.slice(0, 24) : updated
      })
    }, 12000)
    return () => window.clearInterval(timer)
  }, [filters])

  const total = useCountUp(severityCounts.total, 700)
  const firing = useCountUp(severityCounts.firing, 700)
  const resolved = useCountUp(severityCounts.resolved, 700)

  const sevCards: { cls: string; dataSev: 'all' | Severity; label: ReactNode; count: number; meta: string | null; icon: ReactNode | null; metaNode: ReactNode | null }[] = [
    { cls: 'total', dataSev: 'all', label: '全部告警', count: severityCounts.total, meta: '最近 24h', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>, metaNode: null },
    { cls: 'critical', dataSev: 'CRITICAL', label: (<><span className="sev-icon">▲</span>CRITICAL</>), count: severityCounts.CRITICAL, meta: null, icon: null, metaNode: (<><span className="firing num">{severityCounts.criticalFiring}</span> firing · <span className="num">{severityCounts.criticalResolved}</span> resolved</>) },
    { cls: 'warning', dataSev: 'WARNING', label: (<><span className="sev-icon">△</span>WARNING</>), count: severityCounts.WARNING, meta: null, icon: null, metaNode: (<><span className="firing num">{severityCounts.warningFiring}</span> firing · <span className="num">{severityCounts.warningResolved}</span> resolved</>) },
    { cls: 'info', dataSev: 'INFO', label: (<><span className="sev-icon">○</span>INFO</>), count: severityCounts.INFO, meta: null, icon: null, metaNode: (<><span className="num">{severityCounts.infoFiring}</span> firing · <span className="num">{severityCounts.infoResolved}</span> resolved</>) },
  ]

  const setSev = (sev: 'all' | Severity) => setFilters((f) => ({ ...f, sev }))

  const isSevCardActive = (dataSev: string) => {
    if (dataSev === 'all') return filters.sev === 'all'
    return filters.sev === dataSev
  }

  const connectionPill = (
    <div className="connection-pill">
      <span className="live-dot" />
      <span>实时 · 已连接</span>
    </div>
  )

  return (
    <>
      <Topbar rightExtra={connectionPill} />

      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">告警列表</h1>
            <p className="page-subtitle">
              <span className="num">{total}</span> 条告警 · <span className="num">{firing}</span> FIRING · <span className="num">{resolved}</span> RESOLVED
            </p>
          </div>
        </div>

        {/* Severity overview */}
        <div className="severity-overview">
          {sevCards.map((c) => (
            <div
              key={c.dataSev}
              className={`sev-card ${c.cls}${isSevCardActive(c.dataSev) ? ' active' : ''}`}
              onClick={() => setSev(c.dataSev === 'all' ? 'all' : c.dataSev)}
            >
              <div className="sev-card-head">
                <div className="sev-label">{c.label}</div>
                {c.icon}
              </div>
              <SevCount target={c.count} />
              <div className="sev-meta">{c.metaNode || c.meta}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <span className="filter-label">严重度</span>
            <div className="severity-picker">
              <button
                className={`sev-pill${filters.sev === 'all' ? ' active' : ''}`}
                onClick={() => setSev('all')}
              >全部</button>
              <button
                className={`sev-pill crit${filters.sev === 'CRITICAL' ? ' active' : ''}`}
                onClick={() => setSev('CRITICAL')}
              ><span>▲</span> CRITICAL</button>
              <button
                className={`sev-pill warn${filters.sev === 'WARNING' ? ' active' : ''}`}
                onClick={() => setSev('WARNING')}
              ><span>△</span> WARNING</button>
              <button
                className={`sev-pill info${filters.sev === 'INFO' ? ' active' : ''}`}
                onClick={() => setSev('INFO')}
              ><span>○</span> INFO</button>
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">状态</span>
            <div className="status-picker">
              {(['all', 'FIRING', 'RESOLVED'] as const).map((st) => (
                <button
                  key={st}
                  className={`opt-pill${filters.status === st.toLowerCase() || (filters.status === 'all' && st === 'all') ? ' active' : ''}`}
                  onClick={() => setFilters((f) => ({ ...f, status: st === 'all' ? 'all' : st }))}
                >
                  {st === 'all' ? '全部' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">团队</span>
            <div className="team-picker">
              {([['all', '全部'], ['payment', '支付'], ['risk', '风控'], ['ops', '运维']] as const).map(([team, label]) => (
                <button
                  key={team}
                  className={`opt-pill${filters.team === team ? ' active' : ''}`}
                  onClick={() => setFilters((f) => ({ ...f, team }))}
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
              placeholder="搜索 fingerprint / entity…"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value.trim() }))}
            />
          </div>
        </div>

        {/* Alert list */}
        <div className="alert-list">
          {filtered.map((a, i) => (
            <div key={a.id} style={{ animationDelay: `${Math.min(i * 35, 400)}ms` }}>
              <AlertCard a={a} />
            </div>
          ))}
        </div>

        <div className="list-footer">
          显示 <span className="num">{filtered.length}</span> / <span className="num">{severityCounts.total}</span> 条 · 自动加载更多
        </div>
      </main>
    </>
  )
}

function SevCount({ target }: { target: number }) {
  const v = useCountUp(target, 700)
  return <div className="sev-count mono">{v}</div>
}

export default Alerts
