import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { StreamLanguage } from '@codemirror/language'
import { groovy } from '@codemirror/legacy-modes/mode/groovy'
import { json as jsonMode } from '@codemirror/legacy-modes/mode/javascript'
import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight'
import { toast } from 'sonner'
import { JsonView } from '../../components/JsonView'
import { useNamespace } from '../../context/NamespaceContext'
import { usePipeline, useCreatePipeline } from '../../hooks/usePipelines'
import { useVersions } from '../../hooks/useVersions'
import { validateApi } from '../../api/validate'
import { injectApi } from '../../api/inject'
import { versionApi } from '../../api/version'
import type { ValidationResultDto, DryRunResultDto, InjectResultDto } from '../../api/types'
import {
  ctxChips,
  dryRunEvents,
  injectTemplates,
  type DryRunEvent,
} from './mock'
import './pipelineEditor.css'

// Dark theme matching the demo's Groovy highlighting palette exactly.
const groovyTheme = createTheme({
  theme: 'dark',
  settings: {
    background: 'transparent',
    foreground: '#CBD5E1',
    caret: '#60A5FA',
    selection: 'rgba(59,130,246,0.24)',
    lineHighlight: 'rgba(255,255,255,0.03)',
    gutterBackground: 'transparent',
    gutterForeground: '#475569',
    gutterBorder: 'rgba(255,255,255,0.06)',
  },
  styles: [
    { tag: t.keyword, color: '#C084FC', fontWeight: '600' },
    { tag: t.atom, color: '#C084FC' },
    { tag: t.string, color: '#86EFAC' },
    { tag: t.number, color: '#FBBF24' },
    { tag: t.comment, color: '#64748B', fontStyle: 'italic' },
    { tag: t.variableName, color: '#FBA74D' },
    { tag: t.function(t.variableName), color: '#60A5FA' },
    { tag: t.propertyName, color: '#60A5FA' },
    { tag: t.punctuation, color: '#94A3B8' },
    { tag: t.operator, color: '#94A3B8' },
  ],
})

const ICON_CHECK = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l5 5L20 7" /></svg>
const ICON_X = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6l12 12M6 18L18 6" /></svg>
const ICON_BOLT = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
const ICON_ALERT = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 6l6.5 12h-13L12 8zm-1 4v4h2v-4h-2zm0 5v2h2v-2h-2z" /></svg>
const ICON_PLAY = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>

function CausalCard({ node, ev }: { node: string; ev: DryRunEvent }) {
  const amount = ev === 'match' ? 58200 : 890
  if (node === 'input') {
    return (
      <div className="causal-card">
        <span className="k">event.after.amount</span> = <span className="n">{amount}</span> · <span className="k">op</span>=<span style={{ color: '#86EFAC' }}>INSERT</span>
      </div>
    )
  }
  if (node === 'script') {
    return (
      <div className="causal-card success">
        <span className="k">groovy</span>: amount(<span className="n">{amount}</span>) <span className="n">&gt;</span> threshold(<span className="n">10000</span>) → <span className="b">return true</span> · took <span className="n">3.2ms</span>
      </div>
    )
  }
  if (node === 'script-miss') {
    return (
      <div className="causal-card">
        <span className="k">groovy</span>: amount(<span className="n">{amount}</span>) <span className="n">&gt;</span> threshold(<span className="n">10000</span>) → <span className="b">return false</span> · took <span className="n">2.1ms</span>
      </div>
    )
  }
  if (node === 'output') {
    return (
      <div className="causal-card alert">
        <span className="alert-icon">{ICON_ALERT}</span>
        <div>
          <div>alerts.emit() · <span className="b">CRITICAL</span></div>
          <div className="alert-meta">fingerprint=high-amount-order · labels={'{'}app=order-service, team=payment{'}'}</div>
        </div>
      </div>
    )
  }
  return (
    <div className="causal-card">
      <span className="k">NodeOutcome.SHORT_CIRCUIT</span> · No alert triggered · Flow terminated
    </div>
  )
}

function ValidationResult({ result }: { result: ValidationResultDto | null }) {
  if (!result) return null
  const ok = result.ok
  return (
    <div className="validation-result">
      <div className={`validation-icon${ok ? '' : ' fail'}`}>
        {ok ? ICON_CHECK : ICON_X}
      </div>
      <div className="validation-text">
        <div className="validation-title">
          {ok ? 'Validation passed · Ready to publish' : 'Validation failed'}
        </div>
        {ok ? (
          <div className="validation-sub">definitionHash generated</div>
        ) : (
          <div className="validation-sub" style={{ color: 'var(--severity-critical)' }}>
            {result.errors?.map((e: string, i: number) => (
              <div key={i}>{e}</div>
            )) ?? 'Unknown error'}
          </div>
        )}
      </div>
    </div>
  )
}

function DryRunResultView({ result }: { result: DryRunResultDto | null }) {
  if (!result) return null
  return (
    <div className="validation-result">
      <div className="validation-text">
        <div className="validation-title">
          Dry run: <span style={{ fontWeight: 700 }}>{result.outcome}</span>
        </div>
        {result.alerts && result.alerts.length > 0 && (
          <div className="validation-sub">
            {result.alerts.length} alert(s) generated
          </div>
        )}
      </div>
    </div>
  )
}

function InjectResultCard({ result }: { result: InjectResultDto }) {
  const ok = result.outcome === 'SUCCESS'
  const cls = ok ? 'success' : 'fail'
  return (
    <div className={`inject-result ${cls}`}>
      <div className="ir-head">
        <span className={`ir-badge ${cls}`}>{result.outcome}</span>
        <span className="ir-msg">{result.outcome}</span>
      </div>
    </div>
  )
}

function PipelineEditor() {
  const { name: urlName } = useParams<{ name?: string }>()
  const { namespace } = useNamespace()
  const isNew = !urlName
  const pipelineName = urlName ?? ''

  // Fetch pipeline metadata + versions (for script content)
  const { data: pipeline } = usePipeline(namespace, isNew ? '' : pipelineName)
  const { data: versions = [] } = useVersions(namespace, isNew ? '' : pipelineName)
  const createMutation = useCreatePipeline(namespace)

  // Find the latest version (last in array — API returns chronological order)
  const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null
  const definition = useMemo(() => {
    if (!latestVersion?.definitionJson) return null
    try {
      return JSON.parse(latestVersion.definitionJson) as {
        nodes?: { name?: string; scriptSource?: string }[]
        labels?: Record<string, string>
        description?: string
      }
    } catch {
      return null
    }
  }, [latestVersion?.definitionJson])

  const [tab, setTab] = useState<'visual' | 'json'>('visual')
  const [pipelineNameInput, setPipelineNameInput] = useState('')
  const [labels, setLabels] = useState<{ key: string; value: string }[]>(() =>
    pipeline?.labels
      ? Object.entries(pipeline.labels).map(([k, v]) => ({ key: k, value: v }))
      : [{ key: 'app', value: '' }, { key: 'team', value: '' }],
  )
  const [code, setCode] = useState('// Write your Groovy script here...')
  const [ev, setEv] = useState<DryRunEvent>('match')
  const [shownSteps, setShownSteps] = useState<number>(0)
  const runTimer = useRef<number | undefined>(undefined)

  // API states
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResultDto | null>(null)
  const [dryRunning, setDryRunning] = useState(false)
  const [dryRunResult, setDryRunResult] = useState<DryRunResultDto | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Inject state
  const [injectEventJson, setInjectEventJson] = useState(injectTemplates[0].eventJson)
  const [injecting, setInjecting] = useState(false)
  const [injectResult, setInjectResult] = useState<InjectResultDto | null>(null)

  const data = dryRunEvents[ev]

  // Build pipeline JSON from current editor state
  const effectiveName = isNew ? (pipelineNameInput || 'untitled') : pipelineName
  const buildPipelineJson = () =>
    JSON.stringify({
      name: effectiveName,
      description: pipeline?.description ?? '',
      labels: Object.fromEntries(labels.filter((l) => l.key).map((l) => [l.key, l.value])),
      nodes: [{ name: 'check', scriptSource: code }],
    })

  const handleValidate = async () => {
    setValidating(true)
    setValidationResult(null)
    try {
      const result = await validateApi.validatePipeline({ pipelineJson: buildPipelineJson() })
      setValidationResult(result)
      if (result.ok) {
        toast.success('Validation passed')
      } else {
        toast.error('Validation failed', { description: result.errors?.join(', ') })
      }
    } catch {
      // error already toasted by interceptor
    } finally {
      setValidating(false)
    }
  }

  const handleDryRun = async () => {
    setDryRunning(true)
    setDryRunResult(null)
    // Show animated causal flow
    setShownSteps(0)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduce) {
      for (let i = 1; i <= data.steps.length; i++) {
        setShownSteps(i)
        await new Promise<void>((r) => {
          runTimer.current = window.setTimeout(r, 400)
        })
      }
    } else {
      setShownSteps(data.steps.length)
    }

    try {
      const result = await validateApi.dryRun({
        pipelineJson: buildPipelineJson(),
        eventJson: JSON.stringify(data.event),
      })
      setDryRunResult(result)
      toast.success(`Dry run complete · ${result.outcome}`)
    } catch {
      // error already toasted
    } finally {
      setDryRunning(false)
    }
  }

  const handleNewVersion = async () => {
    setSaving(true)
    try {
      if (isNew) {
        // Create the pipeline first, then save a version
        const name = pipelineNameInput || 'untitled'
        const created = await createMutation.mutateAsync({
          name,
          description: '',
          labels: Object.fromEntries(labels.filter((l) => l.key).map((l) => [l.key, l.value])),
        })
        await versionApi.saveVersion(namespace, created.name, {
          pipelineJson: buildPipelineJson(),
        })
        toast.success('Pipeline created')
        window.location.href = `/pipelines/${created.name}/edit`
      } else {
        await versionApi.saveVersion(namespace, pipelineName, {
          pipelineJson: buildPipelineJson(),
        })
        toast.success('New version saved')
      }
    } catch {
      // error already toasted
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      if (isNew) {
        // Create first, then publish
        const name = pipelineNameInput || 'untitled'
        const created = await createMutation.mutateAsync({
          name,
          description: '',
          labels: Object.fromEntries(labels.filter((l) => l.key).map((l) => [l.key, l.value])),
        })
        const saved = await versionApi.saveVersion(namespace, created.name, {
          pipelineJson: buildPipelineJson(),
        })
        if (saved.version != null) {
          await versionApi.publish(namespace, created.name, saved.version)
          toast.success(`Published v${saved.version}`)
        }
        window.location.href = `/pipelines/${created.name}/edit`
      } else {
        const saved = await versionApi.saveVersion(namespace, pipelineName, {
          pipelineJson: buildPipelineJson(),
        })
        if (saved.version != null) {
          await versionApi.publish(namespace, pipelineName, saved.version)
          toast.success(`Published v${saved.version}`)
        }
      }
    } catch {
      // error already toasted
    } finally {
      setPublishing(false)
    }
  }

  const handleInject = async () => {
    setInjecting(true)
    setInjectResult(null)
    try {
      const result = await injectApi.inject(namespace, pipelineName, {
        eventJson: injectEventJson,
      })
      setInjectResult(result)
      if (result.outcome === 'SUCCESS') {
        toast.success('Inject succeeded')
      } else {
        toast.error(`Inject: ${result.outcome}`)
      }
    } catch {
      // error already toasted
    } finally {
      setInjecting(false)
    }
  }

  const loadTemplate = (idx: number) => {
    setInjectEventJson(injectTemplates[idx].eventJson)
    setInjectResult(null)
  }

  const switchEvent = (next: DryRunEvent) => {
    setEv(next)
    setShownSteps(0)
    setDryRunResult(null)
  }

  useEffect(() => () => { if (runTimer.current) window.clearTimeout(runTimer.current) }, [])

  // Sync code & labels from version definitionJson (takes priority) or pipeline metadata
  useEffect(() => {
    if (definition) {
      // Load script from the definition's nodes
      const scriptSource = definition.nodes?.[0]?.scriptSource
      if (scriptSource) setCode(scriptSource)
      // Load labels from definition
      if (definition.labels) {
        const entries = Object.entries(definition.labels)
        if (entries.length > 0) {
          setLabels(entries.map(([k, v]) => ({ key: k, value: v })))
        }
      }
    } else if (pipeline?.labels) {
      // Fallback: pipeline metadata labels
      const entries = Object.entries(pipeline.labels)
      if (entries.length > 0) {
        setLabels(entries.map(([k, v]) => ({ key: k, value: v })))
      }
    }
  }, [definition, pipeline?.labels])

  const groovyHost = tab === 'visual' && (
    <div className="groovy-host">
      <CodeMirror
        value={code}
        height="280px"
        theme={groovyTheme}
        extensions={[StreamLanguage.define(groovy), EditorView.lineWrapping]}
        onChange={(v) => setCode(v)}
        basicSetup={{ lineNumbers: true, highlightActiveLine: true, foldGutter: false }}
      />
    </div>
  )

  return (
    <>
      {/* Custom topbar */}
      <header className="topbar">
        <div className="topbar-inner" style={{ maxWidth: 1600, padding: '14px var(--space-xl)', gap: 'var(--space-lg)' }}>
          <Link className="brand" to="/">
            <span className="brand-mark" />
            <span>A-Solid Observe</span>
          </Link>
          <div className="nav-spacer" />
          <nav className="role-tabs">
            <Link to="/" className="role-tab">Dashboard</Link>
            <Link to="/alerts" className="role-tab">Alerts</Link>
            <Link to="/pipelines" className="role-tab active">Config</Link>
          </nav>
        </div>
      </header>

      <div className="editor-toolbar">
        <div className="editor-toolbar-inner">
          {isNew ? (
            <input
              className="editor-name-input"
              value={pipelineNameInput}
              onChange={(e) => setPipelineNameInput(e.target.value)}
              placeholder="pipeline-name"
              style={{
                fontSize: 15, fontWeight: 600, background: 'transparent', border: '1px dashed var(--color-border)',
                borderRadius: 6, padding: '4px 8px', color: 'var(--color-text)', fontFamily: 'inherit',
                width: 220,
              }}
            />
          ) : (
            <span className="editor-name">{pipeline?.name ?? pipelineName}</span>
          )}
          <span className="editor-version">
            <span className="dot" />
            {pipeline ? (pipeline.status === 'PUBLISHED' ? `v${pipeline.currentVersion}` : `draft (latest v${pipeline.currentVersion})`) : 'new'}
          </span>
          <span className="editor-meta">{namespace}/{pipelineName}</span>
          <div className="toolbar-spacer" />
          <button className="btn btn-secondary" onClick={handleValidate} disabled={validating}>
            {validating ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin"><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            )}
            Validate
          </button>
          <button className="btn btn-warn" onClick={() => { document.querySelector('.right-pane')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); window.setTimeout(handleDryRun, 400) }} disabled={dryRunning}>
            {ICON_BOLT}Dry Run
          </button>
          <button className="btn btn-secondary" onClick={handleNewVersion} disabled={saving}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
            New Version
          </button>
          <button className="btn btn-primary" onClick={handlePublish} disabled={publishing}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            Publish
          </button>
        </div>
      </div>

      <main className="workspace">
        {/* Left: editor */}
        <div className="pane">
          <div className="pane-tabs">
            <button className={`pane-tab${tab === 'visual' ? ' active' : ''}`} onClick={() => setTab('visual')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /></svg>
              Visual
            </button>
            <button className={`pane-tab${tab === 'json' ? ' active' : ''}`} onClick={() => setTab('json')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>
              JSON
            </button>
          </div>
          <div className="pane-body">
            {tab === 'visual' ? (
              <>
                <div className="vis-canvas">
                  <div className="node-editor">
                    <div className="source-bubble">
                      <div className="bubble-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12c3-4 9-4 12 0c3-4 9-4 12 0" transform="translate(-3 0)" /></svg>
                      </div>
                      <span>event</span>
                    </div>

                    <div className="connector" />

                    <div className="check-node">
                      <div className="node-head">
                        <div className="node-title-row">
                          <div className="node-title">check</div>
                          <span className="node-type-tag">GROOVY</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#94A3B8', fontFamily: "'Fira Code', monospace" }}>
                          <span>{code.split('\n').length} lines · {code.length} chars</span>
                        </div>
                      </div>
                      {groovyHost}
                      <div className="ctx-bar">
                        {ctxChips.map((c) => (
                          <span className="ctx-chip" key={c.k} title={c.title}>
                            <span className="ck">{c.k}</span> · {c.type}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="connector" />

                    <div className="source-bubble">
                      <div className="bubble-icon alert">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 6l6.5 12h-13L12 8zm-1 4v4h2v-4h-2zm0 5v2h2v-2h-2z" /></svg>
                      </div>
                      <span>alerts.emit()</span>
                    </div>
                  </div>
                </div>

                {/* Labels editor */}
                <div className="labels-block">
                  <div className="labels-head">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><path d="M7 7h.01" /></svg>
                    <span className="lh-title">Rule Metadata Labels</span>
                    <span className="lh-hint">Used for list filtering, alert silencing matching · Map&lt;String,String&gt;</span>
                    <span className="lh-count">{labels.length}</span>
                  </div>
                  <div className="labels-rows">
                    {labels.map((l, i) => (
                      <div className="label-row" key={i}>
                        <input
                          className="label-input k"
                          value={l.key}
                          onChange={(e) => setLabels((prev) => prev.map((p, idx) => idx === i ? { ...p, key: e.target.value } : p))}
                        />
                        <input
                          className="label-input"
                          value={l.value}
                          onChange={(e) => setLabels((prev) => prev.map((p, idx) => idx === i ? { ...p, value: e.target.value } : p))}
                        />
                        <button
                          className="label-remove"
                          onClick={() => setLabels((prev) => prev.filter((_, idx) => idx !== i))}
                          aria-label="Remove label"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6l12 12M6 18L18 6" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="label-add" onClick={() => setLabels((prev) => [...prev, { key: '', value: '' }])}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                    Add Label
                  </button>
                </div>
              </>
            ) : (
              <div className="json-editor">
                <span className="c">{'// PipelineDefinition · GroovyScriptEngine sandbox (whitelist import / 5s timeout)'}</span>
                {'\n{\n  '}
                <span className="k">"name"</span>: <span className="s">"{pipelineName}"</span>,
                {'\n  '}<span className="k">"labels"</span>: {'{\n    '}
                {labels.map((l, i) => (
                  <span key={i}>
                    <span className="k">"{l.key || '...'}"</span>: <span className="s">"{l.value}"</span>{i < labels.length - 1 ? ',' : ''}
                    {i < labels.length - 1 ? '\n    ' : '\n  '}
                  </span>
                ))}
                {'}'},
                {'\n  '}<span className="k">"nodes"</span>: [{'{'}
                {'\n      '}<span className="k">"name"</span>: <span className="s">"check"</span>,
                {'\n      '}<span className="k">"scriptSource"</span>: <span className="s">{JSON.stringify(code)}</span>
                {'\n    }'}{']}\n}'}</div>
            )}
          </div>
        </div>

        {/* Right: validation + dry-run */}
        <div className="right-pane">
          <div className="section-block">
            <p className="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              Validation Result
            </p>
            {validationResult ? (
              <ValidationResult result={validationResult} />
            ) : (
              <div className="validation-result">
                <div className="validation-text">
                  <div className="validation-sub">Click Validate to check the pipeline definition</div>
                </div>
              </div>
            )}
          </div>

          <div className="section-block">
            <p className="section-title">
              {ICON_BOLT}
              Dry Run · Causal Demo
            </p>

            <div className="dryrun-event">
              <div className="dryrun-event-head">
                <span>Sample Event</span>
                <div className="dryrun-event-actions">
                  <button className={`event-opt${ev === 'match' ? ' active' : ''}`} onClick={() => switchEvent('match')}>Match</button>
                  <button className={`event-opt${ev === 'miss' ? ' active' : ''}`} onClick={() => switchEvent('miss')}>Miss</button>
                </div>
              </div>
              <div className="event-json">
                <JsonView value={data.event} />
              </div>
            </div>

            <button className="run-btn" onClick={handleDryRun} disabled={dryRunning}>
              {dryRunning ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin"><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>
              ) : ICON_PLAY}
              {dryRunning ? 'Running...' : 'Run Dry Run'}
            </button>

            {dryRunResult && <DryRunResultView result={dryRunResult} />}

            <div className="causal-flow">
              {data.steps.map((s, i) => (
                <div className={`causal-step${i < shownSteps ? ' show' : ''}`} key={i}>
                  <span className="causal-stage">{s.stage}</span>
                  <CausalCard node={s.node} ev={ev} />
                </div>
              ))}
            </div>
          </div>

          {/* Inject — production runner, real DB writes */}
          <div className="section-block inject-block">
            <p className="section-title inject-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              Production Inject · Real Event Trigger
            </p>

            <div className="inject-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22h20L12 2z" /><path d="M12 9v4" /><circle cx="12" cy="17" r="0.8" fill="currentColor" /></svg>
              <div>
                <div className="iw-strong">Real DB write · Not rolled back</div>
                <div className="iw-sub">
                  Unlike dry run: goes through the production runner. Alerts land in the DB, execution records are actually written.
                  <span className="mono">POST /api/v1/namespaces/{namespace}/pipelines/{pipelineName}/inject</span>
                </div>
              </div>
            </div>

            <div className="inject-templates">
              <label className="it-label">Template</label>
              <select
                className="it-select"
                defaultValue={0}
                onChange={(e) => loadTemplate(Number(e.target.value))}
              >
                {injectTemplates.map((tpl, i) => (
                  <option key={i} value={i}>
                    {tpl.label} · {tpl.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="inject-editor">
              <CodeMirror
                value={injectEventJson}
                height="220px"
                theme={groovyTheme}
                extensions={[StreamLanguage.define(jsonMode), EditorView.lineWrapping]}
                onChange={(v) => setInjectEventJson(v)}
                basicSetup={{ lineNumbers: true, highlightActiveLine: true, foldGutter: false }}
              />
            </div>

            <button
              className="inject-btn"
              type="button"
              disabled={injecting}
              onClick={handleInject}
            >
              {injecting ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin"><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
              {injecting ? 'Injecting…' : 'Run Inject'}
            </button>

            {injectResult && <InjectResultCard result={injectResult} />}
          </div>
        </div>
      </main>
    </>
  )
}

export default PipelineEditor
