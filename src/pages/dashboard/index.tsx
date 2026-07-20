import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Topbar } from '../../components/Topbar'
import { useECharts } from '../../lib/useECharts'
import { useCountUp } from '../../lib/useCountUp'
import { useNamespace } from '../../context/NamespaceContext'
import { useDashboard, useAlertTimeseries, useExecutionTimeseries } from '../../hooks/useDashboard'
import {
  buildTrendOption,
  buildThroughputOption,
  buildSeverityOption,
  buildTeamOption,
  buildSparkOption,
  toSparkData,
} from './chartOptions'
import type { DimensionCountDto, PipelineCountDto } from '../../api/types'
import './dashboard.css'

type TimeRange = 'today' | '7d' | '30d'

function timeRangeToDates(range: TimeRange): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString()
  let from: Date
  if (range === 'today') {
    from = new Date(now)
    from.setHours(0, 0, 0, 0)
  } else if (range === '7d') {
    from = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
  } else {
    from = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
  }
  return { from: from.toISOString(), to }
}

type PipelineNode = {
  label: string; name: string; meta: ReactNode; metaNum?: string; icon: ReactNode; danger: boolean
}

const PIPELINE_NODES: PipelineNode[] = [
  {
    label: 'Source', name: 'CDC / API / CRON', meta: 'Events', metaNum: '—',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /><path d="M3 12a9 3 0 0 0 18 0" /></svg>,
    danger: false,
  },
  {
    label: 'Subscription', name: 'Event Subscriptions', meta: 'Matches', metaNum: '—',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M7 12h10" /><path d="M10 18h4" /></svg>,
    danger: false,
  },
  {
    label: 'Rule', name: 'Pipeline Rules', meta: 'Runs', metaNum: '—',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="m16.24 7.76 2.83-2.83" /><path d="M18 12h4" /><path d="m16.24 16.24 2.83 2.83" /><path d="M12 18v4" /><path d="m4.93 19.07 2.83-2.83" /><path d="M2 12h4" /><path d="m4.93 4.93 2.83 2.83" /></svg>,
    danger: false,
  },
  {
    label: 'Alert', name: 'Trigger Alert', meta: <span>CRI / WAR / INFO</span>,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>,
    danger: true,
  },
]

function Kpi({ label, value, unit, sub, spark, sparkColor }: {
  label: string; value: number; unit?: string; sub: string; spark: number[]; sparkColor: string
}) {
  const animated = useCountUp(value)
  const { ref } = useECharts(spark.length > 0 ? buildSparkOption(spark, sparkColor) : null as any, [spark, sparkColor])
  return (
    <article className="kpi">
      <div className="kpi-head"><span className="kpi-label">{label}</span></div>
      <div className="kpi-value">
        <span className="num">{animated.toLocaleString()}</span>
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="kpi-sub">{sub}</div>
      {spark.length > 0 && <div className="kpi-spark" ref={ref} />}
    </article>
  )
}

function TopList({ items }: { items: { name: string; count: number }[] }) {
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <ul className="top-list">
      {items.map((it, i) => (
        <li key={it.name}>
          <span className="top-rank">{String(i + 1).padStart(2, '0')}</span>
          <span className="top-name">{it.name}</span>
          <span className="top-bar"><span className="top-bar-fill" style={{ width: `${(it.count / max * 100).toFixed(1)}%` }} /></span>
          <span className="top-val">{it.count}</span>
        </li>
      ))}
    </ul>
  )
}

function Dashboard() {
  const { namespace } = useNamespace()
  const [range, setRange] = useState<TimeRange>('today')
  const { from, to } = timeRangeToDates(range)

  // All API calls use the same time range
  const { data: dash } = useDashboard({ namespace, from, to, limit: 5 })
  const { data: alertTs = [] } = useAlertTimeseries({ namespace, from, to, bucket: '1h' })
  const { data: execTs = [] } = useExecutionTimeseries({ namespace, from, to, bucket: '1h' })

  // Charts
  const trendChart = useECharts(buildTrendOption(alertTs), [alertTs])
  const throughputChart = useECharts(buildThroughputOption(execTs), [execTs])

  // Sparkline data derived from alert timeseries (total count per bucket)
  const sparkTotal = useMemo(() => {
    const map = new Map<string, number>()
    alertTs.forEach((p) => {
      const k = p.bucketStart?.substring(0, 13) ?? ''
      map.set(k, (map.get(k) ?? 0) + p.count)
    })
    return [...map.values()]
  }, [alertTs])

  const sparkActive = useMemo(() => alertTs.filter((p) => p.severity === 'CRITICAL' || p.severity === 'WARNING').map((p) => p.count), [alertTs])
  const sparkCritical = useMemo(() => alertTs.filter((p) => p.severity === 'CRITICAL').map((p) => p.count), [alertTs])
  const sparkExec = useMemo(() => execTs.filter((p) => p.status === 'SUCCESS').map((p) => p.count), [execTs])

  const heroEvents = useCountUp(dash?.eventsToday ?? 0)
  const heroAlerts = useCountUp(dash?.alertsToday ?? 0)

  const topPipelines: { name: string; count: number }[] = (dash?.topPipelines ?? []).map(
    (p: PipelineCountDto) => ({ name: p.pipelineName, count: p.count }),
  )
  const topFingerprints: { name: string; count: number }[] = (dash?.topFingerprints ?? []).map(
    (d: DimensionCountDto) => ({ name: d.dimension, count: d.count }),
  )

  const timeRange = (
    <div className="time-range" role="tablist" aria-label="Time range">
      {(['today', '7d', '30d'] as const).map((r) => (
        <button key={r} className={range === r ? 'active' : ''} type="button" onClick={() => setRange(r)}>
          {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <Topbar showNamespace={false} leftExtra={timeRange} />

      <main className="page dashboard-page">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-head">
            <div>
              <p className="hero-title" id="hero-title">{range === 'today' ? "Today's" : range === '7d' ? '7-Day' : '30-Day'} Overview</p>
              <h1 className="hero-headline">
                <span className="num">{heroEvents.toLocaleString()}</span> events ·{' '}
                <span className="num alert-count">{heroAlerts}</span> alerts
              </h1>
            </div>
            <span className="hero-realtime"><span className="pulse-dot" />API · Live</span>
          </div>

          <div className="pipeline">
            <svg className="pipeline-svg" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="flow-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1E40AF" /><stop offset="50%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#0EA5E9" />
                </linearGradient>
              </defs>
              <line className="flow-line" x1="0" y1="6" x2="100" y2="6" />
              <circle className="flow-particle" cx="0" cy="6" r="2.4"><animateMotion dur="3.2s" repeatCount="indefinite" path="M0,0 L100,0" /></circle>
            </svg>
            <div className="pipeline-track">
              {PIPELINE_NODES.map((node) => (
                <div className="pipeline-node" key={node.label}>
                  <div className="node-chip">
                    <div className="node-icon" style={node.danger ? { background: 'linear-gradient(135deg, rgba(220,38,38,0.12), rgba(217,119,6,0.15))', color: 'var(--severity-critical)' } : undefined}>{node.icon}</div>
                    <div className="node-label">{node.label}</div>
                    <div className="node-name">{node.name}</div>
                    <div className="node-meta">{typeof node.meta === 'string' ? <>{node.meta} <span className="num">{node.metaNum}</span></> : node.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="kpi-grid" aria-label="Key metrics">
          <Kpi label="Alerts" value={dash?.alertsTotal ?? 0} sub={`${dash?.alertsByStatus?.ACTIVE ?? 0} active / ${dash?.alertsByStatus?.EXPIRED ?? 0} expired`} spark={sparkTotal} sparkColor="#1E40AF" />
          <Kpi label="Active" value={dash?.alertsByStatus?.ACTIVE ?? 0} sub="Needs attention" spark={sparkActive} sparkColor="#DC2626" />
          <Kpi label="Critical" value={dash?.alertsBySeverity?.CRITICAL ?? 0} sub="Most severe" spark={sparkCritical} sparkColor="#DC2626" />
          <Kpi label="Success Rate" value={dash?.executionsSuccessRate ?? 0} unit="%" sub={`${dash?.executionsTotal ?? 0} total / ${dash?.executionsFailed ?? 0} failed`} spark={sparkExec} sparkColor="#16A34A" />
        </section>

        <section className="grid-2">
          <article className="card">
            <header className="card-head">
              <div>
                <h3 className="card-title">Alert Trend</h3>
                <p className="card-sub">{range === 'today' ? 'Hourly' : 'Daily'} · stacked by severity</p>
              </div>
              <div className="legend">
                <span className="legend-dot" style={{ '--lc': '#DC2626' } as CSSProperties}>CRITICAL</span>
                <span className="legend-dot" style={{ '--lc': '#D97706' } as CSSProperties}>WARNING</span>
                <span className="legend-dot" style={{ '--lc': '#0EA5E9' } as CSSProperties}>INFO</span>
              </div>
            </header>
            <div className="chart" ref={trendChart.ref} role="img" aria-label="Alert trend" />
          </article>

          <article className="card">
            <header className="card-head">
              <div>
                <h3 className="card-title">Execution Throughput</h3>
                <p className="card-sub">{range === 'today' ? 'Hourly' : 'Daily'} · success / failed</p>
              </div>
              <div className="legend">
                <span className="legend-dot" style={{ '--lc': '#16A34A' } as CSSProperties}>SUCCESS</span>
                <span className="legend-dot" style={{ '--lc': '#DC2626' } as CSSProperties}>FAILED</span>
              </div>
            </header>
            <div className="chart" ref={throughputChart.ref} role="img" aria-label="Execution throughput" />
          </article>
        </section>

        <section className="grid-2-equal">
          <article className="card">
            <header className="card-head"><div><h3 className="card-title">Alerts by Severity</h3><p className="card-sub">{dash?.alertsTotal ?? 0} total</p></div></header>
            <SeverityChart data={dash?.alertsBySeverity ?? {}} />
          </article>
          <article className="card">
            <header className="card-head"><div><h3 className="card-title">Alerts by Team</h3><p className="card-sub">Top {(dash?.teamDist ?? []).length} teams</p></div></header>
            <TeamChart data={dash?.teamDist ?? []} />
          </article>
        </section>

        <section className="grid-2-equal">
          <article className="card">
            <header className="card-head"><h3 className="card-title">Most Active Rules · Top {topPipelines.length}</h3></header>
            {topPipelines.length > 0 ? <TopList items={topPipelines} /> : <div className="list-footer">No data</div>}
          </article>
          <article className="card">
            <header className="card-head"><h3 className="card-title">Top Alert Fingerprints · Top {topFingerprints.length}</h3></header>
            {topFingerprints.length > 0 ? <TopList items={topFingerprints} /> : <div className="list-footer">No data</div>}
          </article>
        </section>
      </main>
    </>
  )
}

function SeverityChart({ data }: { data: Record<string, number> }) {
  const { ref } = useECharts(buildSeverityOption(data), [data])
  return <div className="chart" ref={ref} role="img" aria-label="Alert severity pie" />
}
function TeamChart({ data }: { data: { dimension: string; count: number }[] }) {
  const { ref } = useECharts(buildTeamOption(data), [data])
  return <div className="chart" ref={ref} role="img" aria-label="Alert team bar" />
}

export default Dashboard
