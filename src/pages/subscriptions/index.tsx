import { type ReactElement, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Topbar } from '../../components/Topbar'
import { Subtabs } from '../../components/Subtabs'
import { useNamespace } from '../../context/NamespaceContext'
import { useSubscriptions, useDeactivateSubscription } from '../../hooks/useSubscriptions'
import type { SubscriptionDto } from '../../api/types'
import './subscriptions.css'

const CONFIG_SUBTABS = [
  { to: '/pipelines', label: 'Rules', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6h7M6 8.5v7M18 8.5v7M8.5 18h7" /></svg> },
  { to: '/subscriptions', label: 'Subscription', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z" /><path d="M4 9h16M9 4v16" /></svg> },
  { to: '/pipelines/high-amount-order-alert/edit', label: 'Editor', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg> },
  { to: '/pipelines/high-amount-order-alert/versions', label: 'Versions', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v8M8 12h8" /><circle cx="12" cy="12" r="10" /></svg> },
]

type SourceKind = 'CDC' | 'CRON' | 'API'

const SOURCE_ICON: Record<string, ReactElement> = {
  CDC: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12c3-4 9-4 12 0c3-4 9-4 12 0" transform="translate(-3 0)" /></svg>,
  CRON: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  API: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
}

const ACTION_ICON: Record<string, ReactElement> = {
  RUN: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>,
  SCHEDULE: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  CANCEL: <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>,
}

const EDIT_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
const CLOCK_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
const BIND_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6h7M6 8.5v7M18 8.5v7M8.5 18h7" /></svg>
const CHEV_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>

const SOURCE_DESC: Record<string, string> = {
  CDC: 'Change Data Capture · real-time event streams',
  CRON: 'Scheduled triggers',
  API: 'Triggered via HTTP POST',
}

function configRows(s: SubscriptionDto): { k: string; v: string }[] {
  const rows: { k: string; v: string }[] = []
  if (s.sourceType === 'CDC') {
    if (s.db) rows.push({ k: 'db', v: s.db })
    if (s.table) rows.push({ k: 'table', v: s.table })
    if (s.opTypes?.length) rows.push({ k: 'opTypes', v: `[${s.opTypes.join(', ')}]` })
  } else if (s.sourceType === 'CRON') {
    if (s.cronExpression) rows.push({ k: 'cron', v: s.cronExpression })
  } else if (s.sourceType === 'API') {
    rows.push({ k: 'api', v: s.name })
  }
  return rows
}

function SubCard({ s }: { s: SubscriptionDto }) {
  const sourceCls = (s.sourceType ?? 'unknown').toLowerCase()
  const actionCls = (s.actionType ?? 'run').toLowerCase()
  const statusCls = s.status === 'ACTIVE' ? 'active' : 'paused'
  const rows = configRows(s)
  const pipelineCount = s.pipelineIds?.length ?? 0

  return (
    <Link to={`/subscriptions/${s.name}/edit`} className={`sub-card ${sourceCls}`}>
      <div className="sub-card-head">
        <div className="sub-name-block">
          <h3 className="sub-name">{s.name}</h3>
          <span className="source-tag">
            {SOURCE_ICON[s.sourceType ?? ''] ?? null}
            {s.sourceType}
          </span>
        </div>
        <div className="action-status">
          {s.actionType && (
            <span className={`action-pill ${actionCls}`}>
              {ACTION_ICON[s.actionType] ?? null}
              {s.actionType}
            </span>
          )}
          <span className={`status-pill ${statusCls}`}>
            <span className="dot" />
            {s.status ?? 'UNKNOWN'}
          </span>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="source-config">
          {rows.map((row) => (
            <div className="row" key={row.k}>
              <span className="k">{row.k}</span>
              <span className="v">{row.v}</span>
            </div>
          ))}
        </div>
      )}

      <div className="pipeline-bindings">
        <div className="bindings-label">
          {BIND_ICON}
          Rule Bindings
          <span className="count">{pipelineCount}</span>
        </div>
        {pipelineCount > 0 && (
          <div className="bindings-list">
            {s.pipelineIds.map((id: number) => (
              <span className="binding-pill" key={id}>
                #{id}
                {CHEV_ICON}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="sub-card-foot">
        <div className="foot-meta">
          <span className="foot-item">
            {CLOCK_ICON}
            Updated {s.name ? 'recently' : '--'}
          </span>
        </div>
        <div className="sub-card-actions">
          <span className="icon-btn" title="Edit">{EDIT_ICON}</span>
        </div>
      </div>
    </Link>
  )
}

function Subscriptions() {
  const { namespace } = useNamespace()
  const { data: subscriptions = [], isLoading, isError, refetch } = useSubscriptions(namespace)

  const sourceGroups = useMemo(() => {
    const groups: Record<string, SubscriptionDto[]> = {}
    subscriptions.forEach((s) => {
      const key = s.sourceType ?? 'UNKNOWN'
      if (!groups[key]) groups[key] = []
      groups[key].push(s)
    })
    const order: SourceKind[] = ['CDC', 'CRON', 'API']
    return order
      .filter((k) => groups[k]?.length)
      .map((k) => ({
        source: k,
        title: k,
        count: `${groups[k].length} subscriptions`,
        desc: SOURCE_DESC[k] ?? '',
        items: groups[k],
      }))
  }, [subscriptions])

  const totalBindings = subscriptions.reduce((sum, s) => sum + (s.pipelineIds?.length ?? 0), 0)

  return (
    <>
      <Topbar />
      <Subtabs tabs={CONFIG_SUBTABS} />

      <main className="page subscriptions-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Subscription</h1>
            <p className="page-subtitle">
              <span className="num">{subscriptions.length}</span> subscriptions · CDC / CRON / API sources
            </p>
          </div>
          <Link className="btn-new" to="/subscriptions/new">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
            New Subscription
          </Link>
        </div>

        {isLoading && (
          <div className="list-footer">
            <span className="num">Loading subscriptions...</span>
          </div>
        )}

        {isError && (
          <div className="list-footer">
            <span className="num" style={{ color: 'var(--severity-critical)' }}>Failed to load subscriptions.</span>{' '}
            <button className="btn btn-ghost" onClick={() => refetch()}>Retry</button>
          </div>
        )}

        {!isLoading && !isError && sourceGroups.length > 0 && (
          <>
            {sourceGroups.map((g) => (
              <div className={`source-group ${g.source.toLowerCase()}`} key={g.source}>
                <div className="source-group-head">
                  <span className="source-group-icon">{SOURCE_ICON[g.source]}</span>
                  <span className="source-group-title">{g.title}</span>
                  <span className="source-group-count">{g.count}</span>
                  <span className="source-group-desc">{g.desc}</span>
                </div>
                <div className="sub-grid">
                  {g.items.map((s) => (
                    <SubCard key={s.name} s={s} />
                  ))}
                </div>
              </div>
            ))}
            <div className="list-footer">
              <span className="num">{subscriptions.length}</span> subscriptions · across <span className="num">{totalBindings}</span> rule bindings
            </div>
          </>
        )}

        {!isLoading && !isError && subscriptions.length === 0 && (
          <div className="list-footer">
            <span className="num">No subscriptions found.</span>
          </div>
        )}
      </main>
    </>
  )
}

export default Subscriptions
