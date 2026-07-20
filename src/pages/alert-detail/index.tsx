import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Topbar } from '../../components/Topbar'
import { useNamespace } from '../../context/NamespaceContext'
import { useAlert, useEvidence, useAckAlert, useIgnoreAlert } from '../../hooks/useAlerts'
import type { EvidenceDto } from '../../api/types'
import './alertDetail.css'

function AlertDetail() {
  const { id } = useParams<{ id: string }>()
  const { namespace } = useNamespace()

  const { data: alert, isLoading, isError } = useAlert(namespace, id ?? '')
  const { data: evidence = [] } = useEvidence(namespace, id ?? '')
  const ackMutation = useAckAlert(namespace)
  const ignoreMutation = useIgnoreAlert(namespace)

  const [view, setView] = useState<'json' | 'table'>('json')
  const [activeNode, setActiveNode] = useState<string>('alert')

  const labels = alert?.labels ? Object.entries(alert.labels) : []
  const annotations = alert?.annotations ? Object.entries(alert.annotations) : []

  const handleAck = () => {
    if (!id) return
    ackMutation.mutate(
      { id, by: 'user@a-solid' },
      { onSuccess: () => toast.success('Acknowledged') },
    )
  }

  const handleIgnore = () => {
    if (!id) return
    ignoreMutation.mutate(
      { id, by: 'user@a-solid' },
      { onSuccess: () => toast.success('Ignored') },
    )
  }

  const sevLabel = alert?.severity ?? '...'
  const fingerprint = alert?.fingerprint ?? id ?? '...'
  const status = alert?.status ?? '...'
  const dedup = alert?.dedupCount ?? 0
  const pipelineRef = alert?.pipelineId ? `#${alert.pipelineId} v${alert.pipelineVersion ?? '?'}` : '--'
  const teamLabel = alert?.labelTeam ?? alert?.labels?.team ?? '--'
  const startsAt = alert?.startsAt ?? '--'
  const endsAt = alert?.endsAt
  const ackBy = alert?.ackBy
  const ackNote = alert?.ackNote

  const evidenceRows: [string, string, string, boolean][] = evidence.length > 0
    ? evidence.map((e: EvidenceDto) => [e.nodeName, e.triggerEvent?.substring(0, 60) ?? '--', `capturedAt ${e.capturedAt?.substring(0, 19) ?? '--'}`, !e.truncated])
    : [['--', '--', 'No evidence available', false]]

  const copyJson = () => {
    const text = evidence.length > 0
      ? JSON.stringify(evidence, null, 2)
      : JSON.stringify(alert, null, 2)
    navigator.clipboard?.writeText(text).catch(() => {})
    toast.success('Copied')
  }

  return (
    <>
      <Topbar />

      <div className="breadcrumb">
        <Link to="/alerts">Alerts</Link>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        <span className="mono">{fingerprint}</span>
      </div>

      <main className="page alert-detail-page">
        {/* Hero: trace strip (mock) */}
        <section className="trace-strip">
          <div className="trace-head">
            <div>
              <p className="trace-title">Trace Lineage · Where this alert came from</p>
              <h1 className="trace-headline">
                <span className="sev-badge-large">{sevLabel}</span>
                <span className="trace-fp">{fingerprint}</span>
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              startsAt <strong style={{ color: 'var(--color-text)', fontFamily: "'Fira Code', monospace", fontWeight: 500 }}>{startsAt}</strong>
            </div>
          </div>

          <div className="trace-svg-wrap">
            <TraceSvg activeNode={activeNode} onSelect={(n) => { setActiveNode(n); toast.success(`Node selected: ${n}`) }} />
          </div>
        </section>

        {isLoading && <div className="list-footer">Loading...</div>}

        {isError && <div className="list-footer" style={{ color: 'var(--severity-critical)' }}>Failed to load alert.</div>}

        {!isLoading && !isError && alert && (
          <div className="detail-grid">
            <div className="detail-col">
              <section className="section-card">
                <h2 className="section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v8M8 12h8" /><circle cx="12" cy="12" r="10" /></svg>
                  Alert Metadata
                </h2>
                <div className="meta-grid">
                  <div className="meta-row"><span className="meta-label">Severity</span><span className="meta-value" style={{ color: alert.severity === 'CRITICAL' ? 'var(--severity-critical)' : alert.severity === 'WARNING' ? 'var(--severity-warning)' : 'var(--severity-info)', fontWeight: 600 }}>{alert.severity}</span></div>
                  <div className="meta-row"><span className="meta-label">Status</span><span className="meta-value" style={{ color: 'var(--status-firing)', fontWeight: 600 }}>{status}</span></div>
                  <div className="meta-row"><span className="meta-label">Fingerprint</span><span className="meta-value mono">{fingerprint}</span></div>
                  <div className="meta-row"><span className="meta-label">Rule</span><span className="meta-value mono">{pipelineRef}</span></div>
                  <div className="meta-row"><span className="meta-label">Dedup Count</span><span className="meta-value mono">{dedup}</span></div>
                  <div className="meta-row"><span className="meta-label">Team</span><span className="meta-value">{teamLabel}</span></div>
                  {alert.disposition && (
                    <div className="meta-row"><span className="meta-label">Disposition</span><span className="meta-value">{alert.disposition}{ackBy ? ` · ${ackBy}` : ''}</span></div>
                  )}
                </div>

                {labels.length > 0 && (
                  <div className="labels-block">
                    <div className="section-title" style={{ marginBottom: 10 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9M14 17H5M20 7l-3-3M20 7l-3 3M5 17l3-3M5 17l3 3" /></svg>
                      Labels
                    </div>
                    <div className="labels-list">
                      {labels.map(([k, v]) => (
                        <div className="label-row" key={k}><span className="label-key">{k}</span><span className="label-arrow">=</span><span className="label-val">"{v}"</span></div>
                      ))}
                    </div>
                  </div>
                )}

                {annotations.length > 0 && (
                  <div className="labels-block">
                    <div className="section-title" style={{ marginBottom: 10 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                      Annotations
                    </div>
                    <div className="annotations-list">
                      {annotations.map(([k, v]) => (
                        <div className="annotation-row" key={k}>
                          <span className="annotation-key">{k}</span>
                          <span className="annotation-val">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="section-card">
                <h2 className="section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                  Rule Node Output · evidence
                </h2>
                <div className="evidence-toolbar">
                  <div className="view-toggle">
                    <button className={`view-btn${view === 'json' ? ' active' : ''}`} onClick={() => setView('json')}>JSON</button>
                    <button className={`view-btn${view === 'table' ? ' active' : ''}`} onClick={() => setView('table')}>Table</button>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Fira Code', monospace" }}>evidence</span>
                </div>

                {view === 'json' ? (
                  <div className="json-view">
                    <button className="json-copy" onClick={copyJson}>Copy</button>
                    <pre style={{ margin: 0, fontFamily: "'Fira Code',monospace", fontSize: 12, lineHeight: 1.65, color: '#CBD5E1' }}>
                      {JSON.stringify(evidence, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <table className="table-view">
                    <thead><tr><th>Node</th><th>Trigger Event</th><th>Captured At</th></tr></thead>
                    <tbody>
                      {evidenceRows.map(([node, event, captured, ok], i) => (
                        <tr key={i}>
                          <td className="mono">{node}</td>
                          <td className={`mono${ok ? ' ok' : ''}`}>{event}</td>
                          <td>{captured}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {ackNote && (
                  <div className="evidence-narrative">
                    Ack note: <strong>{ackNote}</strong>
                  </div>
                )}
              </section>
            </div>

            {/* Right col: timeline (mock) + quick actions */}
            <div className="detail-col">
              <section className="section-card">
                <h2 className="section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                  Status Transition Timeline
                </h2>
                <div className="timeline">
                  <div className="tl-item start">
                    <div className="tl-time">{startsAt} · startsAt</div>
                    <div className="tl-title">Alert triggered <span className="badge" style={{ background: 'rgba(220,38,38,0.12)', color: 'var(--severity-critical)' }}>{status}</span></div>
                    <div className="tl-sub">Produced by rule <span className="mono">{pipelineRef}</span></div>
                  </div>
                  {dedup > 1 && (
                    <div className="tl-item dedup">
                      <div className="tl-time">dedupCount = {dedup}</div>
                      <div className="tl-sub">Same fingerprint re-triggered, dedup counter incremented</div>
                    </div>
                  )}
                  {ackBy && (
                    <div className="tl-item ack">
                      <div className="tl-time">{alert.ackAt ?? '--'} · ack</div>
                      <div className="tl-title">Alert acknowledged <span className="badge" style={{ background: 'rgba(217,119,6,0.12)', color: 'var(--color-accent)' }}>ack</span></div>
                      <div className="tl-sub">Acknowledged by <strong>{ackBy}</strong>{ackNote ? `: "${ackNote}"` : ''}</div>
                    </div>
                  )}
                  {endsAt && (
                    <div className="tl-item resolved">
                      <div className="tl-time">{endsAt} · endsAt</div>
                      <div className="tl-title">Alert expired</div>
                    </div>
                  )}
                  {!endsAt && (
                    <div className="tl-item resolved" style={{ opacity: 0.6 }}>
                      <div className="tl-time">— · waiting</div>
                      <div className="tl-title" style={{ color: 'var(--color-text-muted)' }}>Not yet EXPIRED</div>
                    </div>
                  )}
                </div>
              </section>

              <section className="section-card">
                <h2 className="section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v8M8 12h8" /><circle cx="12" cy="12" r="10" /></svg>
                  Quick Actions
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button className="btn btn-warn" style={{ justifyContent: 'flex-start' }} onClick={() => toast.success('Silenced for 1 hour')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19 12c0-2-1-3.5-2.5-4.5" /></svg>
                    Silence 1 hour
                  </button>
                  <button className="btn btn-warn" style={{ justifyContent: 'flex-start' }} onClick={handleAck}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                    Acknowledge
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={handleIgnore}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-6.4A8.4 8.4 0 1 1 21 11.5z" /></svg>
                    Ignore
                  </button>
                  <Link to="/pipelines" className="btn btn-secondary" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                    Edit Rule · Jump to Config
                  </Link>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Bottom action bar */}
      <div className="action-bar">
        <div className="action-bar-inner">
          <div className="action-info">
            <span className="sev-pill">{sevLabel}</span>
            <div>
              <div className="action-info-fp">{fingerprint}</div>
              <div className="action-info-sub">dedup × {dedup}</div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={handleAck}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            Acknowledge
          </button>
          <button className="btn btn-warn" onClick={() => toast.success('Silenced for 1 hour')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z" /></svg>
            Silence 1h
          </button>
        </div>
      </div>
    </>
  )
}

function TraceSvg({ activeNode, onSelect }: { activeNode: string; onSelect: (n: string) => void }) {
  const nodeClass = (n: string, isAlert = false) =>
    `pipeline-node${isAlert ? ' alert-node' : ''}${activeNode === n ? ' active' : ''}`

  return (
    <svg className="trace-svg" viewBox="0 0 1000 180" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="chipBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>
        <filter id="chipShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.06" />
        </filter>
      </defs>

      <path className="pipeline-link" d="M 145 90 L 355 90" />
      <path className="pipeline-link" d="M 395 90 L 605 90" />
      <path className="pipeline-link" d="M 645 90 L 855 90" />
      <path className="pipeline-link-energized" d="M 145 90 L 355 90" />
      <path className="pipeline-link-energized" d="M 395 90 L 605 90" />
      <path className="pipeline-link-energized" d="M 645 90 L 855 90" />

      <circle className="flow-particle" r="4" cx="250" cy="90">
        <animateMotion dur="3.6s" repeatCount="indefinite" path="M -105 0 L 710 0" />
        <animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;0.1;0.5;0.9;1" dur="3.6s" repeatCount="indefinite" />
      </circle>

      <g className={nodeClass('source')} transform="translate(80 30)" onClick={() => onSelect('source')}>
        <rect className="node-chip-bg" width="130" height="120" rx="14" filter="url(#chipShadow)" />
        <g transform="translate(65 30)">
          <circle cx="0" cy="0" r="22" fill="rgba(30,64,175,0.10)" stroke="rgba(30,64,175,0.25)" strokeWidth="1.4" />
          <g transform="translate(-12 -12)" fill="none" stroke="#1E40AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12c3-4 9-4 12 0c3-4 9-4 12 0" />
            <path d="M3 18c3-4 9-4 12 0c3-4 9-4 12 0" />
          </g>
        </g>
        <text x="65" y="78" textAnchor="middle" fontFamily="Fira Sans" fontSize="10" fontWeight="600" fill="#64748B" letterSpacing="0.06em">SOURCE</text>
        <text x="65" y="96" textAnchor="middle" fontFamily="Fira Sans" fontSize="13" fontWeight="600" fill="#0F172A">CDC Event</text>
        <text x="65" y="112" textAnchor="middle" fontFamily="Fira Code" fontSize="10" fill="#64748B">INSERT</text>
      </g>

      <g className={nodeClass('subscription')} transform="translate(330 30)" onClick={() => onSelect('subscription')}>
        <rect className="node-chip-bg" width="130" height="120" rx="14" filter="url(#chipShadow)" />
        <g transform="translate(65 30)">
          <circle cx="0" cy="0" r="22" fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.3)" strokeWidth="1.4" />
          <g transform="translate(-12 -12)" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16v16H4z" />
            <path d="M4 9h16M9 4v16" />
          </g>
        </g>
        <text x="65" y="78" textAnchor="middle" fontFamily="Fira Sans" fontSize="10" fontWeight="600" fill="#64748B" letterSpacing="0.06em">SUBSCRIPTION</text>
        <text x="65" y="96" textAnchor="middle" fontFamily="Fira Sans" fontSize="13" fontWeight="600" fill="#0F172A">Event Monitor</text>
        <text x="65" y="112" textAnchor="middle" fontFamily="Fira Code" fontSize="10" fill="#64748B">condition matched</text>
      </g>

      <g className={nodeClass('pipeline')} transform="translate(580 30)" onClick={() => onSelect('pipeline')}>
        <rect className="node-chip-bg" width="130" height="120" rx="14" filter="url(#chipShadow)" />
        <g transform="translate(65 30)">
          <circle cx="0" cy="0" r="22" fill="rgba(30,64,175,0.12)" stroke="rgba(30,64,175,0.3)" strokeWidth="1.4" />
          <g transform="translate(-12 -12)" fill="none" stroke="#1E40AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="2.5" />
            <circle cx="18" cy="6" r="2.5" />
            <circle cx="6" cy="18" r="2.5" />
            <circle cx="18" cy="18" r="2.5" />
            <path d="M8.5 6h7M6 8.5v7M18 8.5v7M8.5 18h7" />
          </g>
        </g>
        <text x="65" y="78" textAnchor="middle" fontFamily="Fira Sans" fontSize="10" fontWeight="600" fill="#64748B" letterSpacing="0.06em">PIPELINE</text>
        <text x="65" y="96" textAnchor="middle" fontFamily="Fira Sans" fontSize="13" fontWeight="600" fill="#0F172A">Rule Pipeline</text>
        <text x="65" y="112" textAnchor="middle" fontFamily="Fira Code" fontSize="10" fill="#64748B">script evaluated</text>
      </g>

      <g className={nodeClass('alert', true)} transform="translate(830 30)" onClick={() => onSelect('alert')}>
        <rect className="node-chip-bg" width="130" height="120" rx="14" filter="url(#chipShadow)" />
        <circle cx="65" cy="30" r="22" fill="rgba(220,38,38,0.12)" stroke="rgba(220,38,38,0.4)" strokeWidth="1.6">
          <animate attributeName="r" values="22;24;22" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.5;1" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <g transform="translate(65 30)">
          <path d="M 0 -10 L 10 8 L -10 8 Z" fill="#DC2626" opacity="0.95" />
          <text x="0" y="5" textAnchor="middle" fontFamily="Fira Sans" fontSize="11" fontWeight="700" fill="#fff">!</text>
        </g>
        <text x="65" y="78" textAnchor="middle" fontFamily="Fira Sans" fontSize="10" fontWeight="600" fill="#DC2626" letterSpacing="0.06em">ALERT · THIS</text>
        <text x="65" y="96" textAnchor="middle" fontFamily="Fira Sans" fontSize="13" fontWeight="600" fill="#0F172A">Alert Generated</text>
        <text x="65" y="112" textAnchor="middle" fontFamily="Fira Code" fontSize="10" fill="#64748B">dedup × {}</text>
      </g>
    </svg>
  )
}

export default AlertDetail
