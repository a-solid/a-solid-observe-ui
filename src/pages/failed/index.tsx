import { Fragment, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Topbar } from '../../components/Topbar'
import { Subtabs } from '../../components/Subtabs'
import { ALERT_SUBTAB_ICONS } from '../../components/subtabIcons'
import { JsonView } from '../../components/JsonView'
import { useNamespace } from '../../context/NamespaceContext'
import { useExecutions } from '../../hooks/useExecutions'
import type { ExecutionDto } from '../../api/types'
import './failed.css'

const ICON_RETRY = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
const ICON_ALERT = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22h20L12 2zm0 6l6.5 12h-13L12 8zm-1 4v4h2v-4h-2zm0 5v2h2v-2h-2z" /></svg>
const ICON_SCOPE = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /></svg>

const SUBTABS = [
  { to: '/alerts', label: 'Alerts', icon: ALERT_SUBTAB_ICONS.list },
  { to: '/alerts/a1', label: 'Alert Detail', icon: ALERT_SUBTAB_ICONS.detail },
  { to: '/executions', label: 'Execution History', icon: ALERT_SUBTAB_ICONS.executions },
  { to: '/executions/failed', label: 'Failed Executions', icon: ALERT_SUBTAB_ICONS.failed },
]

interface FailGroup {
  type: string
  count: number
  items: ExecutionDto[]
}

function FailCard({ e, selected, onSelect }: { e: ExecutionDto; selected: boolean; onSelect: () => void }) {
  const errorTypeShort = e.errorType ?? 'Unknown'
  const nodeName = e.nodeName ?? '?'
  const pipeline = `#${e.pipelineId} v${e.pipelineVersion}`

  return (
    <div
      className={`fail-card pending${selected ? ' selected' : ''}`}
      onClick={onSelect}
    >
      <div className="fail-card-head">
        <div className="fail-error-type">{errorTypeShort} @ {nodeName}</div>
        <span className="fail-status">FAILED</span>
      </div>
      <div className="fail-card-title">
        {pipeline}
        <span className="fail-node-tag">node: {nodeName}</span>
      </div>
      <div className="fail-card-meta">
        <div className="fail-card-meta-row">pipeline: <strong>#{e.pipelineId}</strong></div>
        <div className="fail-card-meta-row">createdAt: <strong>{e.createdAt?.substring(0, 19) ?? '--'}</strong></div>
      </div>
    </div>
  )
}

function HighlightedError({ msg }: { msg: string }) {
  const parts = msg.split(/("[^"]+")/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('"')) {
          return <span key={i} className="highlight">{part}</span>
        }
        const kw = part.split(/\b(null|timeout|missing|failed)\b/gi)
        return (
          <Fragment key={i}>
            {kw.map((seg, j) =>
              /^(null|timeout|missing|failed)$/i.test(seg) ? (
                <span key={j} className="highlight">{seg}</span>
              ) : (
                <Fragment key={j}>{seg}</Fragment>
              ),
            )}
          </Fragment>
        )
      })}
    </>
  )
}

function StackLine({ line, first }: { line: string; first: boolean }) {
  if (line.startsWith('Caused by')) {
    return <span className="st-at">{line}</span>
  }
  const m = line.match(/^at\s+(.+)\.(\w+)\(([\w.$]+):(\d+)\)$/)
  if (!m) {
    return <span className="st-at">{line}</span>
  }
  const [, cls, method, file, lineNo] = m
  return (
    <span className="st-at">
      <span style={{ color: '#64748B' }}>at </span>
      <span className="st-class">{cls}</span>.
      <span className="st-method">{method}</span>(
      <span className="st-file">{file}</span>:<span className="st-line">{lineNo}</span>
      ){first ? '' : null}
    </span>
  )
}

function OscStage({ x, label, name, tag, state, markerX }: {
  x: number; label: string; name: string; tag: string
  state: 'fail' | 'ok' | 'muted'; markerX?: number
}) {
  return (
    <g className={`osc-stage ${state}`}>
      <rect className="stage-rect" x={x} y="70" width={x === 320 ? 200 : 130} height="80" rx="8" />
      {state === 'fail' && markerX !== undefined && (
        <circle className="breath fail-marker" cx={markerX} cy="70" r="5" />
      )}
      <text className="stage-label" x={x === 320 ? 420 : x === 60 ? 125 : 725} y="58">{label}</text>
      <text className="stage-name" x={x === 320 ? 420 : x === 60 ? 125 : 725} y="105">{name}</text>
      <text className="osc-tag" x={x === 320 ? 420 : x === 60 ? 125 : 725} y="135">{tag}</text>
    </g>
  )
}

function DiagPanel({ e }: { e: ExecutionDto }) {
  const [stackOpen, setStackOpen] = useState(false)
  const failIdx = 1 // default to process

  const stackLines = e.stackTrace
    ? e.stackTrace.split('\n').filter(Boolean)
    : []

  let triggerEvent: Record<string, unknown> | undefined
  if (e.triggerEvent) {
    try { triggerEvent = JSON.parse(e.triggerEvent) } catch { /* ignore */ }
  }

  return (
    <section className="diag-pane">
      <div className="diag-head">
        <div className="diag-title-block">
          <span className="diag-eyebrow">Node Diagnostics · {e.nodeName ?? 'unknown'}</span>
          <h2 className="diag-title">
            #{e.pipelineId} v{e.pipelineVersion}
            <span className="diag-error-tag">{ICON_ALERT}{e.errorType ?? 'Unknown'}</span>
          </h2>
          <span className="diag-sub">Failed at <span className="mono">{e.startedAt}</span> · <span className="mono">{e.createdAt}</span></span>
        </div>
        <button className="btn-retry" onClick={() => toast.success(`Retry submitted · #${e.pipelineId}`)}>
          {ICON_RETRY}One-click Retry
        </button>
      </div>

      <div>
        <p className="diag-section-title">
          {ICON_SCOPE}
          Diagnostic Signals · Input → Node Processing → Output
        </p>
        <div className="oscilloscope">
          <svg className="osc-svg" viewBox="0 0 850 220" preserveAspectRatio="xMidYMid meet">
            <g className="osc-wave-group">
              <path className="osc-wave" d="M 0 110 Q 20 100 40 110 T 80 110 T 120 110 T 160 110 T 200 110 T 240 110 T 280 110 T 320 110 T 360 110 T 400 110 T 440 110 T 480 110 T 520 110 T 560 110 T 600 110 T 640 110 T 680 110 T 720 110 T 760 110 T 800 110 T 840 110 T 880 110" />
            </g>
            <path className="osc-arrow" d="M 200 110 L 310 110" />
            <path className="osc-arrow" d="M 530 110 L 650 110" />

            <OscStage x={60} state="ok" label="INPUT" name="triggerEvent" tag="✓ Entered OK" />
            <OscStage x={320} state="fail" markerX={420} label="NODE · Processing" name={e.nodeName ?? '?'} tag="✗ Crashed here" />
            <OscStage x={660} state="muted" label="OUTPUT · Skipped" name="emit alert" tag="— Not reached" />

            <line x1="40" y1="180" x2="810" y2="180" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
            <text x="125" y="200" fontFamily="Fira Code" fontSize="10" fill="#64748B" textAnchor="middle">t₀</text>
            <text x="420" y="200" fontFamily="Fira Code" fontSize="10" fill="#64748B" textAnchor="middle">t₁</text>
            <text x="725" y="200" fontFamily="Fira Code" fontSize="10" fill="#64748B" textAnchor="middle">t₂</text>
          </svg>
        </div>
      </div>

      <div className="error-msg-block">
        <p className="error-msg-title">
          {ICON_ALERT}
          ERROR MESSAGE · {e.errorType ?? 'Unknown'}
        </p>
        <div className="error-msg-text">
          <HighlightedError msg={e.errorMessage ?? 'No error message'} />
        </div>
      </div>

      <div>
        <p className="diag-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          triggerEvent · Input Snapshot
        </p>
        <div className="oscilloscope" style={{ padding: 14 }}>
          <pre style={{ margin: 0, fontFamily: "'Fira Code',monospace", fontSize: 12, lineHeight: 1.65, color: '#CBD5E1' }}>
            {triggerEvent ? <JsonView value={triggerEvent} /> : <span style={{ color: 'var(--color-text-muted)' }}>{e.triggerEvent ?? '--'}</span>}
          </pre>
        </div>
      </div>

      {stackLines.length > 0 && (
        <div>
          <button className={`stack-toggle${stackOpen ? ' open' : ''}`} onClick={() => setStackOpen((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
            Expand stackTrace
          </button>
          <div className={`stack-trace${stackOpen ? ' open' : ''}`}>
            {stackLines.map((line, i) => (
              <StackLine key={i} line={line} first={i === 0} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function Failed() {
  const { namespace } = useNamespace()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useExecutions({
    namespace,
    status: 'FAILED',
    page,
    size: 50,
  })

  const executions = data?.data ?? []
  const pageInfo = data?.page
  const total = pageInfo?.total ?? 0

  const errorGroups = useMemo(() => {
    const map: Record<string, ExecutionDto[]> = {}
    executions.forEach((e) => {
      const key = e.errorType ?? 'Unknown'
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return Object.entries(map).map(([type, items]) => ({ type, count: items.length, items }))
  }, [executions])

  const selected = executions.find((e) => e.id === selectedId)

  return (
    <>
      <Topbar />
      <Subtabs tabs={SUBTABS} />

      <main className="page failed-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Failed Executions · Node Diagnostics</h1>
            <p className="page-subtitle">
              <span className="num">{total}</span> failures total
            </p>
          </div>
        </div>

        {isLoading && <div className="list-footer"><span className="num">Loading...</span></div>}

        {isError && (
          <div className="list-footer">
            <span className="num" style={{ color: 'var(--severity-critical)' }}>Failed to load.</span>{' '}
            <button className="btn btn-ghost" onClick={() => refetch()}>Retry</button>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="dual-pane">
            <aside className="list-pane">
              {errorGroups.map((g) => (
                <div className="error-group" key={g.type}>
                  <div className="error-group-head">
                    <span>{g.type}</span>
                    <span className="error-group-count">{g.count}</span>
                  </div>
                  {g.items.map((e) => (
                    <FailCard
                      key={e.id}
                      e={e}
                      selected={selectedId === e.id}
                      onSelect={() => setSelectedId(e.id)}
                    />
                  ))}
                </div>
              ))}
              {executions.length === 0 && (
                <div className="list-footer">No failed executions found.</div>
              )}
            </aside>

            {selected ? <DiagPanel e={selected} /> : <div className="diag-pane" />}
          </div>
        )}
      </main>
    </>
  )
}

export default Failed
