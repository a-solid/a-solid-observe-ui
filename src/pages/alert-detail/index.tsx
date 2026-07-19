import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Topbar } from '../../components/Topbar'
import { alerts } from '../alerts/mock'
import './alertDetail.css'

const LABELS = [
  ['alertname', '"high-amount-order"'],
  ['entity', '"orders"'],
  ['namespace', '"ops"'],
  ['pipeline', '"high-amount-order-alert"'],
  ['order_id', '"20260719-X8742"'],
  ['team', '"payment"'],
] as const

const ANNOTATIONS = [
  ['summary', '订单金额 ¥58,200 超过阈值 ¥10,000'],
  ['description', '来自 CDC events 的 INSERT 事件，订单 #20260719-X8742 触发高额订单告警，请值班确认是否为正常大额订单。'],
  ['runbook', 'https://runbooks.internal/a-solid/high-amount-order'],
] as const

const TABLE_ROWS = [
  ['matched', 'true', '节点判定结果', true],
  ['value', '58200', '事件实际值（amount）', false],
  ['threshold', '10000', '告警阈值', false],
  ['operator', 'GT', '比较运算 (>)', false],
  ['field', 'amount', '判定字段', false],
  ['evaluatedAt', '2026-07-19T14:32:18Z', '判定时间', false],
] as const

function AlertDetail() {
  const { id } = useParams()
  // In a real app we'd fetch by id; here we look it up in the mock, falling back
  // to the canonical "high-amount-order" alert used by the demo.
  const alert = alerts.find((a) => a.id === id) ?? alerts[0]
  void alert

  const [view, setView] = useState<'json' | 'table'>('json')
  const [activeNode, setActiveNode] = useState<string>('alert')

  const copyJson = () => {
    const text = `"matched": true,
"value": 58200,
"threshold": 10000,
"operator": "GT",
"field": "amount",
"evaluatedAt": "2026-07-19T14:32:18Z"`
    navigator.clipboard?.writeText(text).catch(() => {})
    toast.success('JSON 已复制')
  }

  return (
    <>
      <Topbar />

      <div className="breadcrumb">
        <Link to="/alerts">告警列表</Link>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        <span className="mono">high-amount-order</span>
      </div>

      <main className="page alert-detail-page">
        {/* Hero: trace strip */}
        <section className="trace-strip">
          <div className="trace-head">
            <div>
              <p className="trace-title">溯源链路 · 这条告警从哪来</p>
              <h1 className="trace-headline">
                <span className="sev-badge-large">CRITICAL</span>
                <span className="trace-fp">high-amount-order</span>
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              startsAt <strong style={{ color: 'var(--color-text)', fontFamily: "'Fira Code', monospace", fontWeight: 500 }}>2026-07-19 14:32:18</strong>
              · 持续 <strong style={{ color: 'var(--severity-critical)', fontFamily: "'Fira Code', monospace", fontWeight: 600 }}>2m 47s</strong>
            </div>
          </div>

          <div className="trace-svg-wrap">
            <TraceSvg activeNode={activeNode} onSelect={(n) => { setActiveNode(n); toast.success(`已选中节点：${n}`) }} />
          </div>
        </section>

        {/* Detail grid */}
        <div className="detail-grid">
          <div className="detail-col">
            <section className="section-card">
              <h2 className="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v8M8 12h8" /><circle cx="12" cy="12" r="10" /></svg>
                告警元信息
              </h2>
              <div className="meta-grid">
                <div className="meta-row"><span className="meta-label">Severity</span><span className="meta-value" style={{ color: 'var(--severity-critical)', fontWeight: 600 }}>CRITICAL ▲</span></div>
                <div className="meta-row"><span className="meta-label">Status</span><span className="meta-value" style={{ color: 'var(--status-firing)', fontWeight: 600 }}>FIRING</span></div>
                <div className="meta-row"><span className="meta-label">Fingerprint</span><span className="meta-value mono">high-amount-order</span></div>
                <div className="meta-row"><span className="meta-label">Pipeline</span><span className="meta-value mono">high-amount-order-alert v3</span></div>
                <div className="meta-row"><span className="meta-label">Dedup Count</span><span className="meta-value mono">3</span></div>
                <div className="meta-row"><span className="meta-label">Team</span><span className="meta-value">支付 · payment</span></div>
              </div>

              <div className="labels-block">
                <div className="section-title" style={{ marginBottom: 10 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9M14 17H5M20 7l-3-3M20 7l-3 3M5 17l3-3M5 17l3 3" /></svg>
                  Labels
                </div>
                <div className="labels-list">
                  {LABELS.map(([k, v]) => (
                    <div className="label-row" key={k}><span className="label-key">{k}</span><span className="label-arrow">=</span><span className="label-val">{v}</span></div>
                  ))}
                </div>
              </div>

              <div className="labels-block">
                <div className="section-title" style={{ marginBottom: 10 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                  Annotations
                </div>
                <div className="annotations-list">
                  {ANNOTATIONS.map(([k, v]) => (
                    <div className="annotation-row" key={k}>
                      <span className="annotation-key">{k}</span>
                      <span className="annotation-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="section-card">
              <h2 className="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                Pipeline 节点输出 · evidence
              </h2>
              <div className="evidence-toolbar">
                <div className="view-toggle">
                  <button className={`view-btn${view === 'json' ? ' active' : ''}`} onClick={() => setView('json')}>JSON</button>
                  <button className={`view-btn${view === 'table' ? ' active' : ''}`} onClick={() => setView('table')}>Table</button>
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Fira Code', monospace" }}>check 节点输出</span>
              </div>

              {view === 'json' ? (
                <div className="json-view">
                  <button className="json-copy" onClick={copyJson}>复制</button>
                  <span className="k">"matched"</span>: <span className="b">true</span>,
                  <br />
                  <span className="k">"value"</span>: <span className="n">58200</span>,
                  <br />
                  <span className="k">"threshold"</span>: <span className="n">10000</span>,
                  <br />
                  <span className="k">"operator"</span>: <span className="s">"GT"</span>,
                  <br />
                  <span className="k">"field"</span>: <span className="s">"amount"</span>,
                  <br />
                  <span className="k">"evaluatedAt"</span>: <span className="s">"2026-07-19T14:32:18Z"</span>
                </div>
              ) : (
                <table className="table-view">
                  <thead><tr><th>字段</th><th>值</th><th>说明</th></tr></thead>
                  <tbody>
                    {TABLE_ROWS.map(([field, val, desc, isOk]) => (
                      <tr key={field}>
                        <td className="mono">{field}</td>
                        <td className={`mono${isOk ? ' ok' : ''}`}>{val}</td>
                        <td>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="evidence-narrative">
                Pipeline 在 <strong className="num">2026-07-19 14:32:18</strong> 判定：amount=<strong className="num">58,200</strong> &gt; threshold=<strong className="num">10,000</strong>，<strong>命中告警条件</strong>，触发 CRITICAL。
              </div>
            </section>
          </div>

          {/* Right col: timeline + quick actions */}
          <div className="detail-col">
            <section className="section-card">
              <h2 className="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                状态流转时间线
              </h2>
              <div className="timeline">
                <div className="tl-item start">
                  <div className="tl-time">14:32:18 · startsAt</div>
                  <div className="tl-title">告警首次触发 <span className="badge" style={{ background: 'rgba(220,38,38,0.12)', color: 'var(--severity-critical)' }}>FIRING</span></div>
                  <div className="tl-sub">由 Pipeline <span className="mono">high-amount-order-alert v3</span> 产出</div>
                </div>
                <div className="tl-item dedup">
                  <div className="tl-time">14:32:42</div>
                  <div className="tl-title">dedupCount = 2</div>
                  <div className="tl-sub">同 fingerprint 再触发，去重计数</div>
                </div>
                <div className="tl-item dedup">
                  <div className="tl-time">14:33:11</div>
                  <div className="tl-title">dedupCount = 3</div>
                  <div className="tl-sub">第三次触发，仍归并到本告警</div>
                </div>
                <div className="tl-item ack">
                  <div className="tl-time">14:34:02 · ack</div>
                  <div className="tl-title">认领告警 <span className="badge" style={{ background: 'rgba(217,119,6,0.12)', color: 'var(--color-accent)' }}>ack</span></div>
                  <div className="tl-sub">由 <strong>alice@a-solid</strong> 认领，备注：「值班跟进，疑似正常大单」</div>
                </div>
                <div className="tl-item resolved" style={{ opacity: 0.6 }}>
                  <div className="tl-time">— · 等待</div>
                  <div className="tl-title" style={{ color: 'var(--color-text-muted)' }}>尚未 Resolve</div>
                  <div className="tl-sub">点击底部 Resolve 触发恢复流程</div>
                </div>
              </div>
            </section>

            <section className="section-card">
              <h2 className="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v8M8 12h8" /><circle cx="12" cy="12" r="10" /></svg>
                快速操作
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-warn" style={{ justifyContent: 'flex-start' }} onClick={() => toast.success('已静默 1 小时')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19 12c0-2-1-3.5-2.5-4.5" /></svg>
                  静默 1 小时 · silence
                </button>
                <Link to="/alerts" className="btn btn-secondary" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-6.4A8.4 8.4 0 1 1 21 11.5z" /></svg>
                  查看相关告警 · dedup × 3
                </Link>
                <Link to="/pipelines" className="btn btn-secondary" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                  编辑 Pipeline · 跳转配置
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Bottom action bar */}
      <div className="action-bar">
        <div className="action-bar-inner">
          <div className="action-info">
            <span className="sev-pill">CRITICAL</span>
            <div>
              <div className="action-info-fp">high-amount-order</div>
              <div className="action-info-sub">订单 #20260719-X8742 · 持续 2m 47s · dedup × 3</div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => toast.success('已 Acknowledge · alice@a-solid')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            Acknowledge
          </button>
          <button className="btn btn-warn" onClick={() => toast.success('已 Silence 1 小时')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z" /></svg>
            Silence 1h
          </button>
          <button className="btn btn-primary" onClick={() => toast.success('告警已 Resolve · 进入恢复流程')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l5 5L20 7" /></svg>
            Resolve
          </button>
        </div>
      </div>
    </>
  )
}

/* The trace SVG, lifted verbatim from b2-alert-detail.html. onClick per node highlights it. */
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
        <text x="65" y="96" textAnchor="middle" fontFamily="Fira Sans" fontSize="13" fontWeight="600" fill="#0F172A">CDC: orders</text>
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
        <text x="65" y="96" textAnchor="middle" fontFamily="Fira Sans" fontSize="13" fontWeight="600" fill="#0F172A">高额订单监控</text>
        <text x="65" y="112" textAnchor="middle" fontFamily="Fira Code" fontSize="10" fill="#64748B">amount &gt; 10000</text>
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
        <text x="65" y="78" textAnchor="middle" fontFamily="Fira Sans" fontSize="10" fontWeight="600" fill="#64748B" letterSpacing="0.06em">PIPELINE · v3</text>
        <text x="65" y="96" textAnchor="middle" fontFamily="Fira Sans" fontSize="13" fontWeight="600" fill="#0F172A">高额订单告警</text>
        <text x="65" y="112" textAnchor="middle" fontFamily="Fira Code" fontSize="10" fill="#64748B">threshold: 10000</text>
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
        <text x="65" y="78" textAnchor="middle" fontFamily="Fira Sans" fontSize="10" fontWeight="600" fill="#DC2626" letterSpacing="0.06em">ALERT · 本条</text>
        <text x="65" y="96" textAnchor="middle" fontFamily="Fira Sans" fontSize="13" fontWeight="600" fill="#0F172A">CRITICAL · FIRING</text>
        <text x="65" y="112" textAnchor="middle" fontFamily="Fira Code" fontSize="10" fill="#64748B">dedup × 3</text>
      </g>
    </svg>
  )
}

export default AlertDetail
