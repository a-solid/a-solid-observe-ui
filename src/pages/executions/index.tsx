import { useEffect, useState, type ReactElement } from 'react'
import { Topbar } from '../../components/Topbar'
import { Subtabs } from '../../components/Subtabs'
import { ALERT_SUBTAB_ICONS } from '../../components/subtabIcons'
import { JsonView } from '../../components/JsonView'
import { useCountUp } from '../../lib/useCountUp'
import { executions as initial, liveTemplates, type Execution, type TriggerType } from './mock'
import './executions.css'

const TRIGGER_ICON: Record<TriggerType, ReactElement> = {
  CDC: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12c3-4 9-4 12 0c3-4 9-4 12 0" transform="scale(0.85) translate(0 2)" /></svg>,
  CRON: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  API: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
}
const TRIGGER_CLS: Record<TriggerType, string> = { CDC: 'cdc', CRON: 'cron', API: 'api' }

const ICON_CHECK = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l5 5L20 7" /></svg>
const ICON_BOLT = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
const ICON_CHEV = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>

const SUBTABS = [
  { to: '/alerts', label: '告警列表', icon: ALERT_SUBTAB_ICONS.list },
  { to: '/alerts/a1', label: '告警详情', icon: ALERT_SUBTAB_ICONS.detail },
  { to: '/executions', label: '执行历史', icon: ALERT_SUBTAB_ICONS.executions },
  { to: '/executions/failed', label: '失败执行', icon: ALERT_SUBTAB_ICONS.failed },
]

function ExecCard({ e, index }: { e: Execution; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [barW, setBarW] = useState(0)
  const isShort = e.result === 'SHORT_CIRCUITED'
  const execColor = isShort ? 'var(--exec-short)' : 'var(--exec-success)'
  const badgeCls = isShort ? 'result-short' : 'result-success'
  const badgeIcon = isShort ? ICON_BOLT : ICON_CHECK

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const delay = reduce ? 0 : 80 + Math.min(index * 30, 360)
    const t = window.setTimeout(() => setBarW(e.durationPct), delay)
    return () => window.clearTimeout(t)
  }, [e.durationPct, index])

  return (
    <div className="exec-card" style={{ animationDelay: `${Math.min(index * 30, 360)}ms` }}>
      <div
        className={`exec-row${expanded ? ' expanded' : ''}`}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="exec-time">
          <div className="exec-time-stamp">{e.time}</div>
          <div className="exec-time-rel">{e.rel}</div>
        </div>
        <div className="exec-trigger">
          <div className={`trigger-icon ${TRIGGER_CLS[e.trigger]}`} title={e.trigger}>{TRIGGER_ICON[e.trigger]}</div>
        </div>
        <div className="exec-pipeline">
          <div className="exec-pipeline-name">{e.pipeline}</div>
          <div className="exec-pipeline-meta">{e.trigger} · {e.pipelineMeta}</div>
        </div>
        <div className="exec-duration">
          <div className="duration-bar-wrap">
            <div className="duration-bar" style={{ width: `${barW}%`, background: execColor }} />
          </div>
          <div className="duration-meta">
            <span>0ms</span>
            <span className="num">{e.duration}ms</span>
            <span>200ms</span>
          </div>
        </div>
        <div className="exec-result">
          <span className={`result-badge ${badgeCls}`}>{badgeIcon}{e.result}</span>
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
              <JsonView value={e.event} />
            </div>
          </div>
          <div>
            <p className="detail-block-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6h7M6 8.5v7M18 8.5v7M8.5 18h7" /></svg>
              执行路径
            </p>
            <div className="path-mini">
              <span className="path-mini-node">source</span>
              <span className="path-mini-arrow">→</span>
              <span className="path-mini-node">subscription</span>
              <span className="path-mini-arrow">→</span>
              <span className="path-mini-node check">check</span>
              {isShort ? (
                <span className="path-mini-check">✓ 条件未命中</span>
              ) : (
                <>
                  <span className="path-mini-arrow">→</span>
                  <span className="path-mini-node alert">alert</span>
                  <span className="path-mini-check" style={{ color: 'var(--severity-critical)' }}>✓ 触发告警</span>
                </>
              )}
            </div>
            <div className="exec-detail-stat"><span className="lbl">executionId</span><span className="val">exec_{e.id}_20260719</span></div>
            <div className="exec-detail-stat"><span className="lbl">triggerType</span><span className="val">{e.trigger}</span></div>
            <div className="exec-detail-stat"><span className="lbl">durationMs</span><span className="val">{e.duration}</span></div>
            <div className="exec-detail-stat"><span className="lbl">result</span><span className="val" style={{ color: execColor }}>{e.result}</span></div>
            <div className="exec-detail-stat"><span className="lbl">startedAt</span><span className="val">2026-07-19T{e.time}Z</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatNum({ target }: { target: number }) {
  const v = useCountUp(target, 700)
  return <span className="num">{v.toLocaleString()}</span>
}

function Executions() {
  const [resultFilter, setResultFilter] = useState<'all' | 'SUCCESS' | 'SHORT_CIRCUITED'>('all')
  const [range, setRange] = useState<'1h' | '24h' | '7d'>('24h')
  const [list, setList] = useState<Execution[]>(initial)

  const filtered = list.filter((e) => resultFilter === 'all' || e.result === resultFilter)

  // Live: prepend a new execution every 10s (respects reduced-motion).
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    let idx = 0
    const timer = window.setInterval(() => {
      const t = liveTemplates[idx % liveTemplates.length]
      idx++
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      const e: Execution = { id: `live_${Date.now()}`, time, rel: '刚刚', ...t }
      if (resultFilter !== 'all' && e.result !== resultFilter) return
      setList((prev) => [e, ...prev])
    }, 10000)
    return () => window.clearInterval(timer)
  }, [resultFilter])

  const resultPillCls = (r: 'all' | 'SUCCESS' | 'SHORT_CIRCUITED') =>
    `opt-pill${resultFilter === r ? ` active ${r === 'all' ? 'primary' : r === 'SUCCESS' ? 'success' : 'short'}` : ''}`

  return (
    <>
      <Topbar activeRole="告警" />
      <Subtabs tabs={SUBTABS} />

      <main className="page executions-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">执行历史</h1>
            <p className="page-subtitle">最近 <span className="num">24h</span> · <span className="num">1,284</span> 次执行 · 实时流入</p>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card success">
            <div className="stat-head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7" /></svg>
              SUCCESS
            </div>
            <div className="stat-num"><StatNum target={1102} /></div>
            <div className="stat-meta">触发告警 · 占比 85.8%</div>
          </div>
          <div className="stat-card short">
            <div className="stat-head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              SHORT_CIRCUITED
            </div>
            <div className="stat-num"><StatNum target={182} /></div>
            <div className="stat-meta">条件未命中 · 占比 14.2%</div>
          </div>
          <div className="stat-card avg">
            <div className="stat-head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              平均耗时
            </div>
            <div className="stat-num"><StatNum target={48} /><span className="unit">ms</span></div>
            <div className="stat-meta">P95: <span className="num">112ms</span> · P99: <span className="num">186ms</span></div>
          </div>
          <div className="stat-card throughput">
            <div className="stat-head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l3-9 4 18 3-9h4" /></svg>
              吞吐 · 5min
            </div>
            <div className="stat-num"><StatNum target={142} /><span className="unit">/min</span></div>
            <div className="stat-meta">峰值 <span className="num">218/min</span> · 14:30</div>
          </div>
        </div>

        <div className="filters">
          <div className="filter-group">
            <span className="filter-label">Pipeline</span>
            <button className="pipeline-select">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6h7M6 8.5v7M18 8.5v7M8.5 18h7" /></svg>
              <span>全部 pipeline</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </button>
          </div>

          <div className="filter-group">
            <span className="filter-label">结果</span>
            <div className="pill-group">
              <button className={resultPillCls('all')} onClick={() => setResultFilter('all')}>全部</button>
              <button className={resultPillCls('SUCCESS')} onClick={() => setResultFilter('SUCCESS')}>
                {ICON_CHECK} SUCCESS
              </button>
              <button className={resultPillCls('SHORT_CIRCUITED')} onClick={() => setResultFilter('SHORT_CIRCUITED')}>
                {ICON_BOLT} SHORT
              </button>
            </div>
          </div>

          <div className="filter-spacer" />

          <div className="filter-group">
            <span className="filter-label">时间</span>
            <div className="range-group">
              {(['1h', '24h', '7d'] as const).map((r) => (
                <button key={r} className={`opt-pill${range === r ? ' active primary' : ''}`} onClick={() => setRange(r)}>{r}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="exec-list">
          {filtered.map((e, i) => (
            <ExecCard key={e.id} e={e} index={i} />
          ))}
        </div>

        <div className="list-footer">
          显示 <span className="num">{filtered.length}</span> 条 · 滚动加载更多
        </div>
      </main>
    </>
  )
}

export default Executions
