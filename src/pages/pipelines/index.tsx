import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Topbar } from '../../components/Topbar'
import { Subtabs } from '../../components/Subtabs'
import { pipelines as all, type Pipeline, type PipeStatus } from './mock'
import './pipelines.css'

const ICON_VIEW = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
const ICON_EDIT = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
const ICON_ARCHIVE = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" /></svg>
const ICON_TIME = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
const ICON_VER = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg>
const ICON_GROOVY = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>

const CONFIG_SUBTABS = [
  { to: '/pipelines', label: 'Pipeline', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6h7M6 8.5v7M18 8.5v7M8.5 18h7" /></svg> },
  { to: '/subscriptions', label: 'Subscription', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z" /><path d="M4 9h16M9 4v16" /></svg> },
  { to: '/pipelines/high-amount-order-alert/edit', label: '编辑器', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg> },
  { to: '/pipelines/high-amount-order-alert/versions', label: '版本', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v8M8 12h8" /><circle cx="12" cy="12" r="10" /></svg> },
]

function statusColor(s: PipeStatus): string {
  if (s === 'PUBLISHED') return 'var(--pipe-published)'
  if (s === 'DRAFT') return 'var(--pipe-draft)'
  return 'var(--pipe-archived)'
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const { areaPath, linePath, lastPt } = useMemo(() => {
    const w = 280, h = 36
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * (h - 4) - 2
      return [x, y] as const
    })
    const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')
    const area = line + ` L${w},${h} L0,${h} Z`
    return { areaPath: area, linePath: line, lastPt: pts[pts.length - 1] }
  }, [data])

  return (
    <svg className="pipe-card-spark-svg" viewBox="0 0 280 36" preserveAspectRatio="none">
      <path d={areaPath} fill={color} fillOpacity="0.18" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastPt[0].toFixed(1)} cy={lastPt[1].toFixed(1)} r="2.5" fill={color} />
    </svg>
  )
}

function PipeCard({ p, index }: { p: Pipeline; index: number }) {
  const labelEntries = Object.entries(p.labels)
  return (
    <article
      className={`pipe-card ${p.status.toLowerCase()}`}
      style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
    >
      <div className="pipe-card-head">
        <div className="pipe-card-title-block">
          <h3 className="pipe-card-name">{p.name}</h3>
          <p className="pipe-card-desc">{p.desc}</p>
        </div>
        <span className="status-pill">
          <span className="dot" />
          {p.status}
        </span>
      </div>

      <div className="pipe-card-tags">
        <span className="tag groovy" title="单节点 · Groovy 脚本">{ICON_GROOVY}Groovy · {p.groovyLines} 行</span>
        {labelEntries.map(([k, v]) => (
          <span key={k} className={`tag label ${k === 'team' ? 'team' : k === 'app' ? 'app' : ''}`}>
            <span className="lk">{k}</span>
            <span className="lv">{v}</span>
          </span>
        ))}
        <span className="tag ver">{ICON_VER}{p.version}</span>
      </div>

      {p.status !== 'ARCHIVED' && (
        <div className="pipe-card-spark">
          <div className="pipe-card-spark-head">
            <span className="pipe-card-spark-label">近期执行 · 12h</span>
            <span className="pipe-card-spark-num">{p.execCount.toLocaleString()} 次</span>
          </div>
          <Sparkline data={p.spark} color={statusColor(p.status)} />
        </div>
      )}

      <div className="pipe-card-foot">
        <div className="pipe-card-foot-meta">
          <span className="foot-item">{ICON_TIME}{p.updatedAt}</span>
        </div>
        <div className="pipe-card-actions">
          <Link to={`/pipelines/${p.name}/versions`} className="icon-btn" title="查看">{ICON_VIEW}</Link>
          <Link to={`/pipelines/${p.name}/edit`} className="icon-btn" title="编辑">{ICON_EDIT}</Link>
          <button className="icon-btn" title="归档" onClick={(e) => e.preventDefault()}>{ICON_ARCHIVE}</button>
        </div>
      </div>
    </article>
  )
}

function Pipelines() {
  const [status, setStatus] = useState<'all' | PipeStatus>('all')
  const [team, setTeam] = useState<'all' | string>('all')
  const [q, setQ] = useState('')

  const filtered = all.filter((p) => {
    if (status !== 'all' && p.status !== status) return false
    if (team !== 'all' && p.team !== team) return false
    if (q) {
      const query = q.toLowerCase()
      if (!p.name.toLowerCase().includes(query) && !p.application.toLowerCase().includes(query) && !p.desc.toLowerCase().includes(query)) return false
    }
    return true
  })

  const statusPillCls = (s: 'all' | PipeStatus) =>
    `opt-pill${status === s ? ` active ${s === 'all' ? 'primary' : s.toLowerCase()}` : ''}`

  return (
    <>
      <Topbar />
      <Subtabs tabs={CONFIG_SUBTABS} />

      <main className="page pipelines-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Pipeline</h1>
            <p className="page-subtitle">
              <span className="num">9</span> 个 pipeline ·{' '}
              <span className="num" style={{ color: 'var(--pipe-published)', fontWeight: 600 }}>6</span> PUBLISHED ·{' '}
              <span className="num" style={{ color: 'var(--pipe-draft)', fontWeight: 600 }}>2</span> DRAFT ·{' '}
              <span className="num" style={{ color: 'var(--pipe-archived)' }}>1</span> ARCHIVED
            </p>
          </div>
          <button className="btn-new">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
            新建 Pipeline
          </button>
        </div>

        <div className="filters">
          <div className="filter-group">
            <span className="filter-label">状态</span>
            <div className="pill-group">
              <button className={statusPillCls('all')} onClick={() => setStatus('all')}>全部</button>
              {(['PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((s) => (
                <button key={s} className={statusPillCls(s)} onClick={() => setStatus(s)}>
                  <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">团队</span>
            <div className="pill-group">
              <button className={`opt-pill${team === 'all' ? ' active primary' : ''}`} onClick={() => setTeam('all')}>全部</button>
              {([['payment', '支付'], ['risk', '风控'], ['ops', '运维']] as const).map(([t, label]) => (
                <button key={t} className={`opt-pill${team === t ? ' active primary' : ''}`} onClick={() => setTeam(t)}>{label}</button>
              ))}
            </div>
          </div>

          <div className="filter-spacer" />

          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input type="text" placeholder="搜索 name / application..." value={q} onChange={(e) => setQ(e.target.value.trim())} />
          </div>
        </div>

        <div className="grid">
          {filtered.map((p, i) => (
            <PipeCard key={p.name} p={p} index={i} />
          ))}
        </div>

        <div className="list-footer">
          共 <span className="num">9</span> 个 pipeline
        </div>
      </main>
    </>
  )
}

export default Pipelines
