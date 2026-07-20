import { useEffect, useState, type ReactElement } from 'react'
import { Topbar } from '../../components/Topbar'
import { Subtabs } from '../../components/Subtabs'
import { ALERT_SUBTAB_ICONS } from '../../components/subtabIcons'
import { JsonView } from '../../components/JsonView'
import { useNamespace } from '../../context/NamespaceContext'
import { useExecutions } from '../../hooks/useExecutions'
import type { ExecutionDto } from '../../api/types'
import './executions.css'

const TRIGGER_ICON: Record<string, ReactElement> = {
  CDC: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12c3-4 9-4 12 0c3-4 9-4 12 0" transform="scale(0.85) translate(0 2)" /></svg>,
  CRON: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  API: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  DELAYED: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  UNKNOWN: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></svg>,
}
const TRIGGER_CLS: Record<string, string> = { CDC: 'cdc', CRON: 'cron', API: 'api', DELAYED: 'cron', UNKNOWN: 'api' }

const ICON_CHECK = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l5 5L20 7" /></svg>
const ICON_BOLT = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
const ICON_CHEV = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>

const SUBTABS = [
  { to: '/alerts', label: 'Alerts', icon: ALERT_SUBTAB_ICONS.list },
  { to: '/alerts/a1', label: 'Alert Detail', icon: ALERT_SUBTAB_ICONS.detail },
  { to: '/executions', label: 'Execution History', icon: ALERT_SUBTAB_ICONS.executions },
  { to: '/executions/failed', label: 'Failed Executions', icon: ALERT_SUBTAB_ICONS.failed },
]

function ExecCard({ e, index }: { e: ExecutionDto; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [barW, setBarW] = useState(0)
  const isShort = e.status === 'SHORT_CIRCUITED'
  const execColor = isShort ? 'var(--exec-short)' : e.status === 'FAILED' ? 'var(--exec-failed)' : 'var(--exec-success)'
  const badgeCls = isShort ? 'result-short' : e.status === 'FAILED' ? 'result-fail' : 'result-success'
  const badgeIcon = isShort ? ICON_BOLT : e.status === 'FAILED' ? ICON_BOLT : ICON_CHECK

  const durationPct = Math.min(100, Math.max(5, (e.durationMs ?? 0) / 2))

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const delay = reduce ? 0 : 80 + Math.min(index * 30, 360)
    const t = window.setTimeout(() => setBarW(durationPct), delay)
    return () => window.clearTimeout(t)
  }, [durationPct, index])

  const started = e.startedAt ? new Date(e.startedAt) : null
  const timeStr = started ? `${String(started.getHours()).padStart(2, '0')}:${String(started.getMinutes()).padStart(2, '0')}:${String(started.getSeconds()).padStart(2, '0')}` : '--'
  const relStr = started ? formatRel(started) : '--'

  let triggerEvent: Record<string, unknown> | undefined
  if (e.triggerEvent) {
    try { triggerEvent = JSON.parse(e.triggerEvent) } catch { /* ignore */ }
  }

  return (
    <div className="exec-card" style={{ animationDelay: `${Math.min(index * 30, 360)}ms` }}>
      <div
        className={`exec-row${expanded ? ' expanded' : ''}`}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="exec-time">
          <div className="exec-time-stamp">{timeStr}</div>
          <div className="exec-time-rel">{relStr}</div>
        </div>
        <div className="exec-trigger">
          <div className={`trigger-icon ${TRIGGER_CLS[e.triggerType] ?? 'api'}`} title={e.triggerType}>{TRIGGER_ICON[e.triggerType] ?? TRIGGER_ICON.UNKNOWN}</div>
        </div>
        <div className="exec-pipeline">
          <div className="exec-pipeline-name">#{e.pipelineId} v{e.pipelineVersion}</div>
          <div className="exec-pipeline-meta">{e.triggerType} · {e.namespace}</div>
        </div>
        <div className="exec-duration">
          <div className="duration-bar-wrap">
            <div className="duration-bar" style={{ width: `${barW}%`, background: execColor }} />
          </div>
          <div className="duration-meta">
            <span className="num">{e.durationMs}ms</span>
          </div>
        </div>
        <div className="exec-result">
          <span className={`result-badge ${badgeCls}`}>{badgeIcon}{e.status}</span>
        </div>
        <div className="exec-chev">{ICON_CHEV}</div>
      </div>
      <div className={`exec-detail${expanded ? ' expanded' : ''}`}>
        <div className="exec-detail-inner">
          <div>
            <p className="detail-block-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l3-9 4 18 3-9h4" /></svg>
              triggerEvent
            </p>
            <div className="event-json">
              {triggerEvent ? <JsonView value={triggerEvent} /> : <span style={{ color: 'var(--color-text-muted)' }}>{e.triggerEvent ?? '--'}</span>}
            </div>
          </div>
          <div>
            <p className="detail-block-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6h7M6 8.5v7M18 8.5v7M8.5 18h7" /></svg>
              Execution Path
            </p>
            <div className="path-mini">
              <span className="path-mini-node">source</span>
              <span className="path-mini-arrow">→</span>
              <span className="path-mini-node">subscription</span>
              <span className="path-mini-arrow">→</span>
              <span className="path-mini-node check">pipeline</span>
              {isShort ? (
                <span className="path-mini-check">✓ Condition not matched</span>
              ) : e.status === 'FAILED' ? (
                <span className="path-mini-check" style={{ color: 'var(--exec-failed)' }}>✗ Failed · {e.errorType}</span>
              ) : (
                <>
                  <span className="path-mini-arrow">→</span>
                  <span className="path-mini-node alert">alert</span>
                  <span className="path-mini-check" style={{ color: 'var(--severity-critical)' }}>✓ Alert triggered</span>
                </>
              )}
            </div>
            <div className="exec-detail-stat"><span className="lbl">executionId</span><span className="val">{e.executionId ?? e.id}</span></div>
            <div className="exec-detail-stat"><span className="lbl">triggerType</span><span className="val">{e.triggerType}</span></div>
            <div className="exec-detail-stat"><span className="lbl">durationMs</span><span className="val">{e.durationMs}</span></div>
            <div className="exec-detail-stat"><span className="lbl">status</span><span className="val" style={{ color: execColor }}>{e.status}</span></div>
            <div className="exec-detail-stat"><span className="lbl">startedAt</span><span className="val">{e.startedAt}</span></div>
            {e.errorMessage && (
              <div className="exec-detail-stat"><span className="lbl">error</span><span className="val" style={{ color: 'var(--exec-failed)' }}>{e.errorMessage}</span></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatRel(d: Date): string {
  const diff = Date.now() - d.getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  return `${Math.round(mins / 60)} hours ago`
}

function Executions() {
  const { namespace } = useNamespace()
  const [resultFilter, setResultFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const params = {
    namespace,
    ...(resultFilter !== 'all' ? { status: resultFilter } : {}),
    page,
    size: pageSize,
  }

  const { data, isLoading, isError, refetch } = useExecutions(params)
  const executions = data?.data ?? []
  const pageInfo = data?.page
  const totalPages = pageInfo ? Math.ceil(pageInfo.total / pageInfo.size) : 1
  const total = pageInfo?.total ?? 0

  const resultPillCls = (r: string) =>
    `opt-pill${resultFilter === r ? ` active ${r === 'all' ? 'primary' : r === 'SUCCESS' ? 'success' : r === 'FAILED' ? 'fail' : 'short'}` : ''}`

  return (
    <>
      <Topbar />
      <Subtabs tabs={SUBTABS} />

      <main className="page executions-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Execution History</h1>
            <p className="page-subtitle"><span className="num">{total}</span> executions total</p>
          </div>
        </div>

        <div className="filters">
          <div className="filter-group">
            <span className="filter-label">Result</span>
            <div className="pill-group">
              <button className={resultPillCls('all')} onClick={() => { setResultFilter('all'); setPage(1) }}>All</button>
              <button className={resultPillCls('SUCCESS')} onClick={() => { setResultFilter('SUCCESS'); setPage(1) }}>
                {ICON_CHECK} SUCCESS
              </button>
              <button className={resultPillCls('SHORT_CIRCUITED')} onClick={() => { setResultFilter('SHORT_CIRCUITED'); setPage(1) }}>
                {ICON_BOLT} SHORT
              </button>
              <button className={resultPillCls('FAILED')} onClick={() => { setResultFilter('FAILED'); setPage(1) }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22h20L12 2z" /></svg> FAILED
              </button>
            </div>
          </div>

          <div className="filter-spacer" />
        </div>

        {isLoading && <div className="list-footer"><span className="num">Loading executions...</span></div>}

        {isError && (
          <div className="list-footer">
            <span className="num" style={{ color: 'var(--severity-critical)' }}>Failed to load.</span>{' '}
            <button className="btn btn-ghost" onClick={() => refetch()}>Retry</button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="exec-list">
              {executions.map((e, i) => (
                <ExecCard key={e.id} e={e} index={i} />
              ))}
              {executions.length === 0 && (
                <div className="list-footer">No executions found.</div>
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

export default Executions
