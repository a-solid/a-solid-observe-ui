import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { Topbar } from '../../components/Topbar'
import { useECharts } from '../../lib/useECharts'
import { useCountUp } from '../../lib/useCountUp'
import {
  sparkData,
  topPipelines,
  topFingerprints,
  trend,
} from './mock'
import {
  buildTrendOption,
  buildThroughputOption,
  buildSeverityOption,
  buildTeamOption,
  buildSparkOption,
} from './chartOptions'
import './dashboard.css'

type PipelineNode = {
  label: string
  name: string
  meta: ReactNode
  metaNum?: string
  icon: ReactNode
  danger: boolean
}

const PIPELINE_NODES: PipelineNode[] = [
  {
    label: 'Source',
    name: 'CDC · orders',
    meta: 'Events',
    metaNum: '1,284',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14a9 3 0 0 0 18 0V5" />
        <path d="M3 12a9 3 0 0 0 18 0" />
      </svg>
    ),
    danger: false,
  },
  {
    label: 'Subscription',
    name: 'High-Amount Orders',
    meta: 'Matches',
    metaNum: '312',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" /><path d="M7 12h10" /><path d="M10 18h4" />
      </svg>
    ),
    danger: false,
  },
  {
    label: 'Rule',
    name: 'check: high-amount-order',
    meta: 'Runs',
    metaNum: '312',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4" /><path d="m16.24 7.76 2.83-2.83" /><path d="M18 12h4" /><path d="m16.24 16.24 2.83 2.83" /><path d="M12 18v4" /><path d="m4.93 19.07 2.83-2.83" /><path d="M2 12h4" /><path d="m4.93 4.93 2.83 2.83" />
      </svg>
    ),
    danger: false,
  },
  {
    label: 'Alert',
    name: 'Trigger Alert',
    meta: (
      <>
        <span className="sev-tag critical">CRI 12</span>
        <span className="sev-tag warning">WAR 47</span>
      </>
    ),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
      </svg>
    ),
    danger: true,
  },
]

function Kpi({
  label,
  value,
  unit,
  sub,
  trend: trendClass,
  trendLabel,
  variant,
  spark,
  sparkColor,
}: {
  label: string
  value: number
  unit?: string
  sub: string
  trend: 'up' | 'down' | 'flat'
  trendLabel: string
  variant?: 'firing' | 'critical'
  spark: number[]
  sparkColor: string
}) {
  const animated = useCountUp(value)
  const { ref } = useECharts(buildSparkOption(spark, sparkColor), [spark, sparkColor])
  return (
    <article className={`kpi${variant ? ` kpi-${variant}` : ''}`}>
      <div className="kpi-head">
        <span className="kpi-label">{label}</span>
        <span className={`kpi-trend ${trendClass}`}>{trendLabel}</span>
      </div>
      <div className="kpi-value">
        <span className="num">{animated.toLocaleString()}</span>
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="kpi-sub">{sub}</div>
      <div className="kpi-spark" ref={ref} />
    </article>
  )
}

function TopList({ items }: { items: { name: string; count: number }[] }) {
  const max = Math.max(...items.map((i) => i.count))
  return (
    <ul className="top-list">
      {items.map((it, i) => (
        <li key={it.name}>
          <span className="top-rank">{String(i + 1).padStart(2, '0')}</span>
          <span className="top-name">{it.name}</span>
          <span className="top-bar">
            <span className="top-bar-fill" style={{ width: `${(it.count / max * 100).toFixed(1)}%` }} />
          </span>
          <span className="top-val">{it.count}</span>
        </li>
      ))}
    </ul>
  )
}

function Dashboard() {
  const heroEvents = useCountUp(1284)
  const heroAlerts = useCountUp(47)

  const trendChart = useECharts(buildTrendOption())
  const throughputChart = useECharts(buildThroughputOption())

  // "Real-time" simulated — push a new trend point every 5s (respects reduced-motion).
  const trendRef = useRef(trend)
  trendRef.current = trend
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const timer = window.setInterval(() => {
      const t = trendRef.current
      const newCritical = Math.random() < 0.3 ? Math.floor(Math.random() * 3) : 0
      const newWarning = Math.floor(Math.random() * 6)
      const newInfo = Math.random() < 0.4 ? 1 : 0
      t.CRITICAL.shift(); t.CRITICAL.push(newCritical)
      t.WARNING.shift(); t.WARNING.push(newWarning)
      t.INFO.shift(); t.INFO.push(newInfo)
      trendChart.chart.current?.setOption(buildTrendOption(t), false)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [trendChart.chart])

  const timeRange = (
    <div className="time-range" role="tablist" aria-label="Time range">
      <button className="active" type="button">Today</button>
      <button type="button">7 Days</button>
      <button type="button">30 Days</button>
    </div>
  )

  return (
    <>
      <Topbar showNamespace={false} leftExtra={timeRange} />

      <main className="page dashboard-page">
        {/* Hero: pipeline + headline KPIs */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-head">
            <div>
              <p className="hero-title" id="hero-title">Today's Overview · End-to-End Traceability</p>
              <h1 className="hero-headline">
                <span className="num">{heroEvents.toLocaleString()}</span> events flowed through rules
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, margin: '0 8px' }}>·</span>
                triggering <span className="num alert-count">{heroAlerts}</span> alerts
              </h1>
            </div>
            <span className="hero-realtime">
              <span className="pulse-dot" />
              Real-Time · Connected
            </span>
          </div>

          {/* Pipeline visualization */}
          <div className="pipeline">
            <svg className="pipeline-svg" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="flow-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1E40AF" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#0EA5E9" />
                </linearGradient>
              </defs>
              <line className="flow-line" x1="0" y1="6" x2="100" y2="6" />
              <circle className="flow-particle" cx="0" cy="6" r="2.4">
                <animateMotion dur="3.2s" repeatCount="indefinite" path="M0,0 L100,0" />
              </circle>
              <circle className="flow-particle" cx="0" cy="6" r="1.8" opacity="0.6">
                <animateMotion dur="3.2s" begin="1s" repeatCount="indefinite" path="M0,0 L100,0" />
              </circle>
              <circle className="flow-particle" cx="0" cy="6" r="1.4" opacity="0.4">
                <animateMotion dur="3.2s" begin="2s" repeatCount="indefinite" path="M0,0 L100,0" />
              </circle>
            </svg>

            <div className="pipeline-track">
              {PIPELINE_NODES.map((node) => (
                <div className="pipeline-node" key={node.label}>
                  <div className="node-chip">
                    <div
                      className="node-icon"
                      style={node.danger ? { background: 'linear-gradient(135deg, rgba(220,38,38,0.12), rgba(217,119,6,0.15))', color: 'var(--severity-critical)' } : undefined}
                    >
                      {node.icon}
                    </div>
                    <div className="node-label">{node.label}</div>
                    <div className="node-name">{node.name}</div>
                    <div className="node-meta">
                      {typeof node.meta === 'string' ? (
                        <>{node.meta} <span className="num">{node.metaNum}</span></>
                      ) : (
                        node.meta
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KPI cards */}
        <section className="kpi-grid" aria-label="Today's key metrics">
          <Kpi label="Today's Alerts" value={64} sub="+5 vs. yesterday" trend="up" trendLabel="▲ 8%" spark={sparkData.total} sparkColor="#1E40AF" />
          <Kpi label="FIRING" value={8} variant="firing" sub="Action needed · 4 acked" trend="up" trendLabel="▲ 2" spark={sparkData.firing} sparkColor="#DC2626" />
          <Kpi label="CRITICAL" value={12} variant="critical" sub="Most severe · all acked" trend="flat" trendLabel="— Flat" spark={sparkData.critical} sparkColor="#DC2626" />
          <Kpi label="Execution Success Rate" value={98.4} unit="%" sub="1,204 succeeded / 21 failed" trend="down" trendLabel="▼ 0.3%" spark={sparkData.success} sparkColor="#16A34A" />
        </section>

        {/* Trend charts */}
        <section className="grid-2">
          <article className="card">
            <header className="card-head">
              <div>
                <h3 className="card-title">Alert Trend (Hourly)</h3>
                <p className="card-sub">Today 00:00 – now · stacked by severity</p>
              </div>
              <div className="legend">
                <span className="legend-dot" style={{ '--lc': '#DC2626' } as CSSProperties}>CRITICAL</span>
                <span className="legend-dot" style={{ '--lc': '#D97706' } as CSSProperties}>WARNING</span>
                <span className="legend-dot" style={{ '--lc': '#0EA5E9' } as CSSProperties}>INFO</span>
              </div>
            </header>
            <div className="chart" ref={trendChart.ref} role="img" aria-label="Alert trend stacked area chart" />
          </article>

          <article className="card">
            <header className="card-head">
              <div>
                <h3 className="card-title">Execution Throughput (Hourly)</h3>
                <p className="card-sub">success / failed dual series</p>
              </div>
              <div className="legend">
                <span className="legend-dot" style={{ '--lc': '#16A34A' } as CSSProperties}>SUCCESS</span>
                <span className="legend-dot" style={{ '--lc': '#DC2626' } as CSSProperties}>FAILED</span>
              </div>
            </header>
            <div className="chart" ref={throughputChart.ref} role="img" aria-label="Execution throughput bar chart" />
          </article>
        </section>

        {/* Distribution */}
        <section className="grid-2-equal">
          <article className="card">
            <header className="card-head">
              <div>
                <h3 className="card-title">Alerts by Severity</h3>
                <p className="card-sub">64 total today</p>
              </div>
            </header>
            <SeverityChart />
          </article>

          <article className="card">
            <header className="card-head">
              <div>
                <h3 className="card-title">Alerts by Team</h3>
                <p className="card-sub">Top 5 teams</p>
              </div>
            </header>
            <TeamChart />
          </article>
        </section>

        {/* Top N tables */}
        <section className="grid-2-equal">
          <article className="card">
            <header className="card-head">
              <h3 className="card-title">Most Active Rules · Top 5</h3>
            </header>
            <TopList items={topPipelines} />
          </article>

          <article className="card">
            <header className="card-head">
              <h3 className="card-title">Most Frequent Alert Fingerprints · Top 5</h3>
            </header>
            <TopList items={topFingerprints} />
          </article>
        </section>
      </main>
    </>
  )
}

// Separate components so each gets its own hook instance (hooks can't be called conditionally).
function SeverityChart() {
  const { ref } = useECharts(buildSeverityOption())
  return <div className="chart" ref={ref} role="img" aria-label="Alert severity distribution pie chart" />
}
function TeamChart() {
  const { ref } = useECharts(buildTeamOption())
  return <div className="chart" ref={ref} role="img" aria-label="Alert team distribution horizontal bar chart" />
}

export default Dashboard
