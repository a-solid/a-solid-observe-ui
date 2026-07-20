import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useNamespace } from '../../context/NamespaceContext'
import { useSubscription, useCreateSubscription, useUpdateSubscription } from '../../hooks/useSubscriptions'
import { usePipelines } from '../../hooks/usePipelines'
import type { SubscriptionFields, PipelineDto } from '../../api/types'
import './subscriptionEditor.css'

const CHIP_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /><path d="M8.5 12h7" /></svg>
const X_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M6 18L18 6" /></svg>
const PLUS_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
const GROOVY_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>
const ALERT_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>

const SOURCE_ICONS = {
  cdc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12c3-4 9-4 12 0c3-4 9-4 12 0" transform="translate(-3 0)" /></svg>,
  cron: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  api: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>,
}

interface PipelineBinding {
  id: number | string
  name: string
  labels: Record<string, string>
}

function BindingChip({ b, onRemove }: { b: PipelineBinding; onRemove: () => void }) {
  const [removing, setRemoving] = useState(false)
  const handleRemove = () => {
    setRemoving(true)
    window.setTimeout(onRemove, 220)
  }
  return (
    <span className={`binding-chip${removing ? ' removing' : ''}`} data-id={b.id}>
      <span className="chip-icon">{CHIP_ICON}</span>
      {b.name || `#${b.id}`}
      <button className="chip-x" onClick={(e) => { e.stopPropagation(); handleRemove() }} aria-label={`Remove ${b.name || b.id}`}>
        {X_ICON}
      </button>
    </span>
  )
}

function ForkPipeline({ b, index }: { b: PipelineBinding; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const labelTags = Object.entries(b.labels ?? {})
  return (
    <div
      className={`fork-pipeline${expanded ? ' expanded' : ''}`}
      data-id={b.id}
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={() => setExpanded((v) => !v)}
    >
      <span className="fp-dot" />
      <div className="fp-main">
        <div className="fp-row-head">
          <span className="fp-name">{b.name || `#${b.id}`}</span>
          <div className="fp-tools">
            <span className="fp-groovy" title="Groovy Rule">{GROOVY_ICON}Groovy</span>
            <span className="fp-alert-out">{ALERT_ICON}Alert</span>
          </div>
        </div>
        <div className="fp-labels">
          {labelTags.map(([k, v]) => (
            <span className="fp-label" key={k}><span className="lk">{k}</span><span className="lv">{v}</span></span>
          ))}
        </div>
      </div>
      <svg className="fp-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
    </div>
  )
}

function BranchPaths({ bindings }: { bindings: PipelineBinding[] }) {
  const n = bindings.length
  if (n === 0) return null
  const gap = Math.min(48, 160 / Math.max(n, 1))
  const totalH = (n - 1) * gap
  const startY = 110 - totalH / 2
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const y = startY + i * gap
        const cx = 335 + 30
        const d = `M 335 110 C ${cx} 110, ${cx} ${y}, 400 ${y} L 440 ${y}`
        return (
          <g key={i}>
            <path d={d} stroke="url(#branchGrad)" strokeWidth="2" fill="none" className="fork-energized" style={{ animationDelay: `${(i * 0.2).toFixed(2)}s` }} />
            <circle r="3" className="particle">
              <animateMotion dur={`${(2.4 + i * 0.3).toFixed(1)}s`} repeatCount="indefinite" path={d} />
            </circle>
            <circle cx="445" cy={y} r="5" fill="#3B82F6" opacity="0.8" />
          </g>
        )
      })}
    </g>
  )
}

function SubscriptionEditor() {
  const { id } = useParams<{ id: string }>()
  const { namespace } = useNamespace()
  const subscriptionName = id ?? ''
  const isNew = subscriptionName === 'new'

  const { data: existing } = useSubscription(namespace, isNew ? '' : subscriptionName)
  const { data: pipelines = [] } = usePipelines(namespace)
  const createMutation = useCreateSubscription(namespace)
  const updateMutation = useUpdateSubscription(namespace)

  const [bindings, setBindings] = useState<PipelineBinding[]>([])
  const [source, setSource] = useState<'cdc' | 'cron' | 'api'>('cdc')
  const [action, setAction] = useState<string>('RUN')
  const [ops, setOps] = useState<Record<string, boolean>>({ INSERT: true, UPDATE: true, DELETE: false })
  const [db, setDb] = useState('')
  const [table, setTable] = useState('')
  const [subNameInput, setSubNameInput] = useState('')
  const [cronExpression, setCronExpression] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [showPipelinePicker, setShowPipelinePicker] = useState(false)

  useEffect(() => {
    if (!showPipelinePicker) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPipelinePicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPipelinePicker])

  // Init bindings from existing subscription
  useEffect(() => {
    if (existing?.pipelineIds) {
      const bound = existing.pipelineIds
        .map((pid) => {
          const p = pipelines.find((pl: PipelineDto) => String(pl.id) === String(pid))
          return p ? { id: p.id, name: p.name, labels: p.labels ?? {} } : null
        })
        .filter(Boolean) as PipelineBinding[]
      setBindings(bound)
    }
    if (existing?.sourceType) {
      setSource(existing.sourceType.toLowerCase() as 'cdc' | 'cron' | 'api')
    }
    if (existing?.actionType) setAction(existing.actionType)
    if (existing?.db) setDb(existing.db)
    if (existing?.table) setTable(existing.table)
    if (existing?.cronExpression) setCronExpression(existing.cronExpression)
    if (existing?.opTypes) {
      const o: Record<string, boolean> = { INSERT: false, UPDATE: false, DELETE: false }
      existing.opTypes.forEach((op: string) => { o[op] = true })
      setOps(o)
    }
  }, [existing, pipelines])

  const availablePipelines = pipelines.filter(
    (p: PipelineDto) => !bindings.find((b) => String(b.id) === String(p.id)),
  )

  const selectBinding = (p: PipelineDto) => {
    setBindings((prev) => [...prev, { id: p.id, name: p.name, labels: p.labels ?? {} }])
    setShowPipelinePicker(false)
    toast.success(`Added ${p.name}`)
  }

  const removeBinding = (id: number | string) => {
    setBindings((prev) => prev.filter((b) => String(b.id) !== String(id)))
  }

  const buildFields = (): SubscriptionFields => ({
    pipelineIds: bindings.map((b) => b.id),
    sourceType: source.toUpperCase() as SubscriptionFields['sourceType'],
    actionType: action,
    ...(source === 'cdc' ? { db, table, opTypes: (Object.entries(ops).filter(([, v]) => v).map(([k]) => k) as ('INSERT' | 'UPDATE' | 'DELETE')[]) } : {}),
    ...(source === 'cron' ? { cronExpression } : {}),
    name: isNew ? (subNameInput || 'untitled-subscription') : subscriptionName,
  })

  const handleSave = async () => {
    setSaving(true)
    const fields = buildFields()
    try {
      if (existing) {
        await updateMutation.mutateAsync({ name: subscriptionName, subscription: fields })
        toast.success('Subscription updated')
      } else {
        const created = await createMutation.mutateAsync({ subscription: fields })
        toast.success('Subscription created')
        if (isNew && created.name) {
          window.location.href = `/subscriptions/${created.name}/edit`
        }
      }
    } catch {
      // error toasted by interceptor
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" to="/subscriptions">
            <span className="brand-mark" />
            A-Solid Observe
          </Link>
          <nav className="crumbs">
            <Link to="/subscriptions">Subscriptions</Link>
            <span className="sep">/</span>
            <span className="current">{subscriptionName || 'New Subscription'}</span>
          </nav>
          <div className="nav-spacer" />
          <div className="toolbar-actions">
            <button className="btn btn-ghost" onClick={() => toast('Validation not yet implemented')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>
              Validate
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
              {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <main className="editor-shell subscription-editor-page">
        <div className="editor-title-block">
          <div>
            <h1 className="editor-title">
              {isNew ? (
                <input
                  className="editor-name-input"
                  value={subNameInput}
                  onChange={(e) => setSubNameInput(e.target.value)}
                  placeholder="subscription-name"
                  style={{
                    fontSize: 18, fontWeight: 600, background: 'transparent', border: '1px dashed var(--color-border)',
                    borderRadius: 6, padding: '4px 8px', color: 'var(--color-text)', fontFamily: 'inherit',
                    width: 280,
                  }}
                />
              ) : (
                subscriptionName
              )}
              <span className="draft-pill">DRAFT</span>
            </h1>
            <p className="editor-subtitle">Configure Source event subscription, forking to one or more Rules for processing.</p>
          </div>
          <div className="editor-meta">
            <span className="kv">Namespace <strong>{namespace}</strong></span>
            <span className="kv">POST /api/v1/namespaces/{namespace}/subscriptions</span>
          </div>
        </div>

        {/* LEFT: form */}
        <div className="form-col">
          {/* ① Rule bindings */}
          <section className="form-section">
            <div className="section-head">
              <span className="section-num">1</span>
              <h3 className="section-title">Rule Bindings</h3>
              <span className="section-hint">Supports one-to-many · Events fork to all bound Rules</span>
            </div>
            <div className="binding-chips">
              {bindings.map((b) => (
                <BindingChip key={b.id} b={b} onRemove={() => removeBinding(b.id)} />
              ))}
              <div style={{ position: 'relative' }} ref={pickerRef}>
                <button
                  className="add-binding"
                  onClick={() => setShowPipelinePicker((v) => !v)}
                  disabled={availablePipelines.length === 0}
                >
                  {PLUS_ICON}Add Rule
                </button>
                {showPipelinePicker && availablePipelines.length > 0 && (
                  <div className="pipeline-picker-dropdown">
                    {availablePipelines.map((p) => (
                      <button
                        key={p.id}
                        className="pipeline-picker-item"
                        onClick={() => selectBinding(p)}
                      >
                        <span className="picker-name">{p.name}</span>
                        <span className="picker-meta">#{String(p.id).slice(-8)} · v{p.currentVersion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="binding-meta">
              <span>Bound <span className="binding-count">{bindings.length}</span> Rules · Events will fan out</span>
              <span>POST /api/v1/namespaces/{namespace}/subscriptions</span>
            </div>
          </section>

          {/* ② Source config */}
          <section className="form-section">
            <div className="section-head">
              <span className="section-num">2</span>
              <h3 className="section-title">Source Config</h3>
              <span className="section-hint">Choose event source type and fill in connection info</span>
            </div>
            <div className="source-tabs">
              {(['cdc', 'cron', 'api'] as const).map((s) => (
                <button key={s} className={`source-tab${source === s ? ' active' : ''}`} onClick={() => setSource(s)}>
                  {SOURCE_ICONS[s]}
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="source-fields">
              {source === 'cdc' && (
                <>
                  <div className="field-group">
                    <label className="field-label">db</label>
                    <input className="field-input" value={db} onChange={(e) => setDb(e.target.value)} placeholder="e.g. commerce_db" />
                  </div>
                  <div className="field-group">
                    <label className="field-label">table</label>
                    <input className="field-input" value={table} onChange={(e) => setTable(e.target.value)} placeholder="e.g. orders" />
                  </div>
                  <div className="field-group full">
                    <label className="field-label">opTypes</label>
                    <div className="op-types">
                      {['INSERT', 'UPDATE', 'DELETE'].map((op) => (
                        <button
                          key={op}
                          className={`op-chip${ops[op] ? ' on' : ''}`}
                          onClick={() => setOps((prev) => ({ ...prev, [op]: !prev[op] }))}
                        >{op}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {source === 'cron' && (
                <div className="field-group full">
                  <label className="field-label">cronExpression</label>
                  <input className="field-input" value={cronExpression} onChange={(e) => setCronExpression(e.target.value)} placeholder="e.g. */10 * * * *" />
                </div>
              )}
            </div>
          </section>

          {/* ③ ActionType */}
          <section className="form-section">
            <div className="section-head">
              <span className="section-num">3</span>
              <h3 className="section-title">Action Type</h3>
              <span className="section-hint">Action executed against bound Rules when conditions are matched</span>
            </div>
            <div className="action-types">
              <div className={`action-card run${action === 'RUN' ? ' active' : ''}`} onClick={() => setAction('RUN')}>
                <div className="ac-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></div>
                <div className="ac-label">RUN</div>
                <div className="ac-desc">Trigger immediately</div>
              </div>
              <div className={`action-card schedule${action === 'SCHEDULE' ? ' active' : ''}`} onClick={() => setAction('SCHEDULE')}>
                <div className="ac-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></div>
                <div className="ac-label">SCHEDULE</div>
                <div className="ac-desc">Delayed execution</div>
              </div>
              <div className={`action-card cancel${action === 'CANCEL' ? ' active' : ''}`} onClick={() => setAction('CANCEL')}>
                <div className="ac-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="1" /></svg></div>
                <div className="ac-label">CANCEL</div>
                <div className="ac-desc">Cancel subscription</div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT: preview */}
        <aside className="preview-col">
          <div className="preview-card">
            <div className="preview-header">
              <h3 className="preview-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="6" cy="18" r="2" /><path d="M8 6h4a4 4 0 0 1 4 4v0M8 18h4a4 4 0 0 0 4-4v0" /></svg>
                Fork Lineage Preview
              </h3>
              <span className="preview-live"><span className="dot" />Live</span>
            </div>

            <div className="fork-diagram">
              <svg className="fork-svg" viewBox="0 0 480 220" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="flowGrad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#D97706" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id="branchGrad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#D97706" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.7" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                <g transform="translate(40, 95)">
                  <circle r="32" fill="rgba(30, 64, 175, 0.08)" stroke="#1E40AF" strokeWidth="1.5" />
                  <circle r="22" fill="#1E40AF" opacity="0.18" />
                  <g transform="translate(-10, -10)" stroke="#1E40AF" strokeWidth="1.8" fill="none">
                    <path d="M3 12c3-4 9-4 12 0c3-4 9-4 12 0" transform="translate(-3 0)" />
                  </g>
                  <text x="0" y="52" textAnchor="middle" className="node-label">Source</text>
                  <text x="0" y="66" textAnchor="middle" className="node-sub">{source.toUpperCase()}</text>
                </g>

                <path d="M 75 110 C 130 110, 150 110, 195 110" stroke="url(#flowGrad)" strokeWidth="2.5" fill="none" className="fork-energized" />
                <circle r="4" className="particle">
                  <animateMotion dur="2.4s" repeatCount="indefinite" path="M 75 110 C 130 110, 150 110, 195 110" />
                </circle>

                <g transform="translate(240, 95)">
                  <rect x="-45" y="-40" width="90" height="80" rx="14" fill="rgba(217, 119, 6, 0.10)" stroke="#D97706" strokeWidth="1.5" />
                  <rect x="-35" y="-32" width="70" height="64" rx="10" fill="#fff" opacity="0.5" />
                  <g transform="translate(-12, -12)" stroke="#D97706" strokeWidth="1.8" fill="none">
                    <path d="M2 6h20M2 12h20M2 18h13" />
                  </g>
                  <text x="0" y="14" textAnchor="middle" className="node-label">Subscription</text>
                  <text x="0" y="28" textAnchor="middle" className="node-sub">{action}</text>
                  <text x="0" y="58" textAnchor="middle" className="node-sub" style={{ fill: '#D97706', fontWeight: 600 }}>{subscriptionName}</text>
                </g>

                <path d="M 285 110 L 330 110" stroke="url(#branchGrad)" strokeWidth="2.5" fill="none" className="fork-energized" />

                <circle cx="335" cy="110" r="6" fill="#D97706" filter="url(#glow)">
                  <animate attributeName="r" values="5;7;5" dur="1.6s" repeatCount="indefinite" />
                </circle>
                <text x="335" y="92" textAnchor="middle" className="node-sub" style={{ fill: '#D97706', fontWeight: 700 }}>FORK</text>

                <BranchPaths bindings={bindings} />
              </svg>
            </div>

            <div className="fork-nodes">
              {bindings.length === 0 ? (
                <div className="fork-empty">No Rule bound · Add one on the left to fork here</div>
              ) : (
                bindings.map((b, idx) => (
                  <ForkPipeline key={b.id} b={b} index={idx} />
                ))
              )}
            </div>

            <div className="preview-footer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
              When you add / remove Rules on the left, the right fork syncs in real time.
            </div>
          </div>
        </aside>
      </main>
    </>
  )
}

export default SubscriptionEditor
