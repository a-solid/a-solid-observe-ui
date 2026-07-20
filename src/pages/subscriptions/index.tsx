import { type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { Topbar } from '../../components/Topbar'
import { Subtabs } from '../../components/Subtabs'
import { sourceGroups, STATUS_VISUAL_CLASS, type SourceKind, type ActionType, type Subscription } from './mock'
import './subscriptions.css'

const CONFIG_SUBTABS = [
  { to: '/pipelines', label: 'Rules', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6h7M6 8.5v7M18 8.5v7M8.5 18h7" /></svg> },
  { to: '/subscriptions', label: 'Subscription', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z" /><path d="M4 9h16M9 4v16" /></svg> },
  { to: '/pipelines/high-amount-order-alert/edit', label: 'Editor', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg> },
  { to: '/pipelines/high-amount-order-alert/versions', label: 'Versions', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v8M8 12h8" /><circle cx="12" cy="12" r="10" /></svg> },
]

const SOURCE_ICON: Record<SourceKind, ReactElement> = {
  CDC: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12c3-4 9-4 12 0c3-4 9-4 12 0" transform="translate(-3 0)" /></svg>,
  CRON: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  API: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
}

const ACTION_ICON: Record<ActionType, ReactElement> = {
  RUN: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>,
  SCHEDULE: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  CANCEL: <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>,
}

const EDIT_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
const CLOCK_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
const FORK_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="6" cy="18" r="2" /><path d="M8 6h4a4 4 0 0 1 4 4v0M8 18h4a4 4 0 0 0 4-4v0" /></svg>
const BIND_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6h7M6 8.5v7M18 8.5v7M8.5 18h7" /></svg>
const CHEV_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>

function SubCard({ s }: { s: Subscription }) {
  const forkLabel = s.forkTo ? `Fork to ${s.forkTo}` : null
  const sourceCls = s.source.toLowerCase()
  const actionCls = s.actionType.toLowerCase()
  const statusCls = STATUS_VISUAL_CLASS[s.status]
  return (
    <Link to="/subscriptions/order-event/edit" className={`sub-card ${sourceCls}`}>
      <div className="sub-card-head">
        <div className="sub-name-block">
          <h3 className="sub-name">{s.name}</h3>
          <span className="source-tag">
            {SOURCE_ICON[s.source]}
            {s.sourceTag}
          </span>
        </div>
        <div className="action-status">
          <span className={`action-pill ${actionCls}`}>{ACTION_ICON[s.actionType]}{s.actionType}</span>
          <span className={`status-pill ${statusCls}`}><span className="dot" />{s.status}</span>
        </div>
      </div>

      <div className="source-config">
        {s.config.map((row) => (
          <div className="row" key={row.k}>
            <span className="k">{row.k}</span>
            <span className="v">{row.v}</span>
          </div>
        ))}
      </div>

      <div className="pipeline-bindings">
        <div className="bindings-label">
          {BIND_ICON}
          Rule Bindings
          <span className="count">{s.bindings.length}{s.forkTo ? ' · fork' : ''}</span>
        </div>
        <div className="bindings-list">
          {forkLabel && (
            <span className="fork-indicator">
              {FORK_ICON}
              {forkLabel}
            </span>
          )}
          {s.bindings.map((b) => (
            <span className="binding-pill" key={b.name}>
              {b.name}
              {b.chevron && CHEV_ICON}
            </span>
          ))}
        </div>
      </div>

      <div className="sub-card-foot">
        <div className="foot-meta">
          {s.foot.map((f, i) => (
            <span className="foot-item" key={i}>
              {f.icon === 'clock' && CLOCK_ICON}
              {f.label} {f.strong && <strong style={{ color: 'var(--color-text)' }}>{f.strong}</strong>}
            </span>
          ))}
        </div>
        <div className="sub-card-actions">
          <span className="icon-btn" title="Edit">{EDIT_ICON}</span>
        </div>
      </div>
    </Link>
  )
}

function Subscriptions() {
  return (
    <>
      <Topbar />
      <Subtabs tabs={CONFIG_SUBTABS} />

      <main className="page subscriptions-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Subscription</h1>
            <p className="page-subtitle"><span className="num">8</span> subscriptions · CDC / CRON / API sources</p>
          </div>
          <button className="btn-new">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
            New Subscription
          </button>
        </div>

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
          <span className="num">8</span> subscriptions · across <span className="num">14</span> rule bindings
        </div>
      </main>
    </>
  )
}

export default Subscriptions
