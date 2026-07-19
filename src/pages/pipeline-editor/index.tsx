import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { StreamLanguage } from '@codemirror/language'
import { groovy } from '@codemirror/legacy-modes/mode/groovy'
import { json as jsonMode } from '@codemirror/legacy-modes/mode/javascript'
import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight'
import { toast } from 'sonner'
import { JsonView } from '../../components/JsonView'
import {
  groovyScript,
  initialLabels,
  ctxChips,
  dryRunEvents,
  injectTemplates,
  injectPipelineMeta,
  mockInject,
  type DryRunEvent,
  type InjectResult,
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
        <span className="k">groovy</span>: amount(<span className="n">{amount}</span>) <span className="n">&gt;</span> threshold(<span className="n">10000</span>) → <span className="b">return true</span> · 耗时 <span className="n">3.2ms</span>
      </div>
    )
  }
  if (node === 'script-miss') {
    return (
      <div className="causal-card">
        <span className="k">groovy</span>: amount(<span className="n">{amount}</span>) <span className="n">&gt;</span> threshold(<span className="n">10000</span>) → <span className="b">return false</span> · 耗时 <span className="n">2.1ms</span>
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
  // output-miss
  return (
    <div className="causal-card">
      <span className="k">NodeOutcome.SHORT_CIRCUIT</span> · 未触发告警 · 流程终止
    </div>
  )
}

function PipelineEditor() {
  const [tab, setTab] = useState<'visual' | 'json'>('visual')
  const [labels, setLabels] = useState(initialLabels.map((l) => ({ ...l })))
  const [code, setCode] = useState(groovyScript)
  const [ev, setEv] = useState<DryRunEvent>('match')
  const [shownSteps, setShownSteps] = useState<number>(0)
  const runTimer = useRef<number | undefined>(undefined)

  const data = dryRunEvents[ev]

  const runDryRun = async () => {
    setShownSteps(0)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShownSteps(data.steps.length)
      toast.success(ev === 'match' ? '干跑完成 · 命中告警条件' : '干跑完成 · 未命中')
      return
    }
    for (let i = 1; i <= data.steps.length; i++) {
      setShownSteps(i)
      // eslint-disable-next-line no-await-in-loop
      await new Promise<void>((r) => {
        runTimer.current = window.setTimeout(r, 400)
      })
    }
    toast.success(ev === 'match' ? '干跑完成 · 命中告警条件' : '干跑完成 · 未命中')
  }

  useEffect(() => () => { if (runTimer.current) window.clearTimeout(runTimer.current) }, [])

  // Inject state (production runner — real alerts/executions land in DB)
  const [injectEventJson, setInjectEventJson] = useState(injectTemplates[0].eventJson)
  const [injecting, setInjecting] = useState(false)
  const [injectResult, setInjectResult] = useState<InjectResult | null>(null)

  const runInject = async () => {
    setInjecting(true)
    setInjectResult(null)
    const result = await mockInject(injectEventJson, injectPipelineMeta)
    setInjectResult(result)
    setInjecting(false)
    if (result.outcome === 'SUCCESS') {
      if (result.alertFingerprint) {
        toast.success('注入成功 · 已生成告警', { description: `fingerprint=${result.alertFingerprint}` })
      } else {
        toast.success('注入成功 · 未命中告警条件')
      }
    } else if (result.outcome === 'FAILED') {
      toast.error('注入失败 · runner 抛出异常')
    } else if (result.outcome === 'PIPELINE_NOT_FOUND') {
      toast.error('Pipeline 未加载', { description: '检查是否已发布/热加载' })
    } else {
      toast.error('eventJson 不合法')
    }
  }

  const loadTemplate = (idx: number) => {
    setInjectEventJson(injectTemplates[idx].eventJson)
    setInjectResult(null)
  }

  const switchEvent = (next: DryRunEvent) => {
    setEv(next)
    setShownSteps(0)
  }

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
      {/* Custom topbar — no namespace, role tab 配置 */}
      <header className="topbar">
        <div className="topbar-inner" style={{ maxWidth: 1600, padding: '14px var(--space-xl)', gap: 'var(--space-lg)' }}>
          <Link className="brand" to="/">
            <span className="brand-mark" />
            <span>A-Solid Observe</span>
          </Link>
          <div className="nav-spacer" />
          <nav className="role-tabs">
            <Link to="/" className="role-tab">大盘</Link>
            <Link to="/alerts" className="role-tab">告警</Link>
            <Link to="/pipelines" className="role-tab active">配置</Link>
          </nav>
        </div>
      </header>

      <div className="editor-toolbar">
        <div className="editor-toolbar-inner">
          <span className="editor-name">高额订单告警</span>
          <span className="editor-version"><span className="dot" />draft v4</span>
          <span className="editor-meta">namespace/ops · 未保存改动</span>
          <div className="toolbar-spacer" />
          <button className="btn btn-secondary" onClick={() => toast.success('校验通过 · definitionHash 已生成')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            校验
          </button>
          <button className="btn btn-warn" onClick={() => { document.querySelector('.right-pane')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); window.setTimeout(runDryRun, 400) }}>
            {ICON_BOLT}干跑
          </button>
          <button className="btn btn-secondary" onClick={() => toast.success('已保存为新版本 · draft v5')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
            保存版本
          </button>
          <button className="btn btn-primary" onClick={() => toast.success('已发布 · v5 PUBLISHED')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            发布
          </button>
        </div>
      </div>

      <main className="workspace">
        {/* Left: editor */}
        <div className="pane">
          <div className="pane-tabs">
            <button className={`pane-tab${tab === 'visual' ? ' active' : ''}`} onClick={() => setTab('visual')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /></svg>
              可视化
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
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#86EFAC' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l5 5L20 7" /></svg>
                            编译通过
                          </span>
                          <span>·</span>
                          <span>{code.split('\n').length} 行 · {code.length} 字符</span>
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
                    <span className="lh-title">Pipeline 元数据 Labels</span>
                    <span className="lh-hint">用于列表过滤、告警 silencing 匹配 · Map&lt;String,String&gt;</span>
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
                          aria-label="删除 label"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6l12 12M6 18L18 6" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="label-add" onClick={() => setLabels((prev) => [...prev, { key: '', value: '' }])}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                    添加 Label
                  </button>
                </div>
              </>
            ) : (
              <div className="json-editor">
                <span className="c">{'// PipelineDefinition · draft v4 · GroovyScriptEngine 沙箱（白名单 import / 5s 超时）'}</span>
                {'\n{\n  '}
                <span className="k">"id"</span>: <span className="n">1001</span>,
                {'\n  '}<span className="k">"namespace"</span>: <span className="s">"ops"</span>,
                {'\n  '}<span className="k">"name"</span>: <span className="s">"high-amount-order-alert"</span>,
                {'\n  '}<span className="k">"description"</span>: <span className="s">"高额订单告警 · amount &gt; 10000"</span>,
                {'\n  '}<span className="k">"status"</span>: <span className="s">"DRAFT"</span>,
                {'\n  '}<span className="k">"currentVersion"</span>: <span className="n">4</span>,
                {'\n  '}<span className="k">"labels"</span>: {'{\n    '}
                {labels.map((l, i) => (
                  <span key={i}>
                    <span className="k">"{l.key || '...'}"</span>: <span className="s">"{l.value}"</span>{i < labels.length - 1 ? ',' : ''}
                    {i < labels.length - 1 ? '\n    ' : '\n  '}
                  </span>
                ))}
                {'}'},
                {'\n  '}<span className="k">"version"</span>: {'{\n    '}<span className="k">"nodes"</span>: [{'{'}
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
              校验结果
            </p>
            <div className="validation-result">
              <div className="validation-icon">{ICON_CHECK}</div>
              <div className="validation-text">
                <div className="validation-title">校验通过 · 可以发布</div>
                <div className="validation-sub">definitionHash: 0x9a4f...e21b</div>
              </div>
            </div>
            <div className="validation-checks">
              <div className="check-row">
                <span className="check-icon">{ICON_CHECK}</span>
                <span className="check-text">Groovy 编译通过 · <span className="mono">SecureASTCustomizer</span></span>
              </div>
              <div className="check-row">
                <span className="check-icon">{ICON_CHECK}</span>
                <span className="check-text">import 全部命中白名单</span>
              </div>
              <div className="check-row">
                <span className="check-icon">{ICON_CHECK}</span>
                <span className="check-text">无 receivers 黑名单调用</span>
              </div>
              <div className="check-row">
                <span className="check-icon">{ICON_CHECK}</span>
                <span className="check-text">超时阈值 <span className="mono">5000ms</span> 设置生效</span>
              </div>
              <div className="check-row muted">
                <span className="check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /></svg></span>
                <span className="check-text">建议：labels 至少标注 <span className="mono">team</span></span>
              </div>
            </div>
          </div>

          <div className="section-block">
            <p className="section-title">
              {ICON_BOLT}
              干跑 · 因果演示
            </p>

            <div className="dryrun-event">
              <div className="dryrun-event-head">
                <span>示例事件</span>
                <div className="dryrun-event-actions">
                  <button className={`event-opt${ev === 'match' ? ' active' : ''}`} onClick={() => switchEvent('match')}>命中</button>
                  <button className={`event-opt${ev === 'miss' ? ' active' : ''}`} onClick={() => switchEvent('miss')}>未命中</button>
                </div>
              </div>
              <div className="event-json">
                <JsonView value={data.event} />
              </div>
            </div>

            <button className="run-btn" onClick={runDryRun}>
              {ICON_PLAY}运行干跑
            </button>

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
              生产注入 · 真事件触发
            </p>

            <div className="inject-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22h20L12 2z" /><path d="M12 9v4" /><circle cx="12" cy="17" r="0.8" fill="currentColor" /></svg>
              <div>
                <div className="iw-strong">真落库 · 不会回滚</div>
                <div className="iw-sub">
                  与干跑不同:走生产 runner,告警真实落库,execution 记录真实写入。
                  <span className="mono">POST /api/v1/namespaces/{injectPipelineMeta.namespace}/pipelines/{injectPipelineMeta.name}/inject</span>
                </div>
              </div>
            </div>

            <div className="inject-templates">
              <label className="it-label">示例模板</label>
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
              onClick={runInject}
            >
              {injecting ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin"><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
              {injecting ? '注入中…' : '执行注入'}
            </button>

            {injectResult && <InjectResultCard result={injectResult} />}
          </div>
        </div>
      </main>
    </>
  )
}

function InjectResultCard({ result }: { result: InjectResult }) {
  const ok = result.outcome === 'SUCCESS'
  const partial = ok && !result.alertFingerprint
  const cls = ok ? (partial ? 'partial' : 'success') : 'fail'
  return (
    <div className={`inject-result ${cls}`}>
      <div className="ir-head">
        <span className={`ir-badge ${cls}`}>{result.outcome}</span>
        <span className="ir-msg">{result.message}</span>
        {typeof result.durationMs === 'number' && (
          <span className="ir-dur">{result.durationMs} ms</span>
        )}
      </div>
      {result.executionId && (
        <div className="ir-links">
          <Link to="/executions" className="ir-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l3 8 4-16 3 8h4" /></svg>
            execution: <span className="mono">{result.executionId}</span>
          </Link>
          {result.alertFingerprint && (
            <Link to="/alerts" className="ir-link alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2z" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>
              alert: <span className="mono">{result.alertFingerprint}</span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default PipelineEditor
