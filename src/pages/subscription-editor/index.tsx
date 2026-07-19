import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { initialBindings, pipelinePool, type PipelineBinding } from './mock'
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

function BindingChip({ b, onRemove }: { b: PipelineBinding; onRemove: () => void }) {
  const [removing, setRemoving] = useState(false)
  const handleRemove = () => {
    setRemoving(true)
    window.setTimeout(onRemove, 220)
  }
  return (
    <span className={`binding-chip${removing ? ' removing' : ''}`} data-id={b.id}>
      <span className="chip-icon">{CHIP_ICON}</span>
      {b.id}
      <button className="chip-x" onClick={(e) => { e.stopPropagation(); handleRemove() }} aria-label={`移除 ${b.id}`}>
        {X_ICON}
      </button>
    </span>
  )
}

function ForkPipeline({ b, index }: { b: PipelineBinding; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const labelTags = Object.entries(b.labels)
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
          <span className="fp-name">{b.id}</span>
          <div className="fp-tools">
            <span className="fp-groovy" title={`Groovy · ${b.groovyLines} 行`}>{GROOVY_ICON}Groovy · {b.groovyLines}</span>
            <span className="fp-alert-out">{ALERT_ICON}{b.severity}</span>
          </div>
        </div>
        <div className="fp-labels">
          {labelTags.map(([k, v]) => (
            <span className="fp-label" key={k}><span className="lk">{k}</span><span className="lv">{v}</span></span>
          ))}
        </div>
        <div className="fp-detail">
          <div className="fp-row"><span>label</span><strong>{b.label}</strong></div>
          <div className="fp-row"><span>match</span><strong>{b.cond}</strong></div>
          <div className="fp-row"><span>scriptSource</span><strong className="fp-groovy-src">{b.groovy}</strong></div>
          <div className="fp-row"><span>action</span><strong>RUN → Alert</strong></div>
        </div>
      </div>
      <svg className="fp-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
    </div>
  )
}

/** Fork SVG branch paths generated from current bindings — 1:1 port of demo's renderBranchPaths(). */
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
  const [bindings, setBindings] = useState<PipelineBinding[]>(initialBindings)
  const [source, setSource] = useState<'cdc' | 'cron' | 'api'>('cdc')
  const [action, setAction] = useState<'RUN' | 'SCHEDULE' | 'CANCEL'>('RUN')
  const [ops, setOps] = useState<Record<string, boolean>>({ INSERT: true, UPDATE: true, DELETE: false })

  const addBinding = () => {
    const available = pipelinePool.filter((p) => !bindings.find((b) => b.id === p.id))
    if (available.length === 0) {
      toast('所有 Pipeline 都已绑定')
      return
    }
    const pick = available[0]
    setBindings((prev) => [...prev, pick])
    toast.success(`已添加 ${pick.id} · 右侧分叉同步`)
  }

  const removeBinding = (id: string) => {
    setBindings((prev) => prev.filter((b) => b.id !== id))
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
            <span className="current">订单事件中心订阅</span>
          </nav>
          <div className="nav-spacer" />
          <div className="toolbar-actions">
            <button className="btn btn-ghost" onClick={() => toast.success('校验通过 · 3 个 Pipeline 绑定均合法')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>
              校验
            </button>
            <button className="btn btn-ghost" onClick={() => toast('已重置为初始状态')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
              重置
            </button>
            <button className="btn btn-primary" onClick={() => toast.success('已保存 · v2')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
              保存
            </button>
          </div>
        </div>
      </header>

      <main className="editor-shell subscription-editor-page">
        <div className="editor-title-block">
          <div>
            <h1 className="editor-title">
              订单事件中心订阅
              <span className="draft-pill">DRAFT · v2</span>
            </h1>
            <p className="editor-subtitle">配置 Source 事件订阅，分叉到一个或多个 Pipeline 进行处理。</p>
          </div>
          <div className="editor-meta">
            <span className="kv">订阅 ID <strong>sub_order_center_v2</strong></span>
            <span className="kv">命名空间 <strong>ops</strong></span>
            <span className="kv">更新时间 <strong>3 分钟前</strong></span>
          </div>
        </div>

        {/* LEFT: form */}
        <div className="form-col">
          {/* ① Pipeline 绑定 */}
          <section className="form-section">
            <div className="section-head">
              <span className="section-num">1</span>
              <h3 className="section-title">Pipeline 绑定</h3>
              <span className="section-hint">支持一绑多 · 事件将分叉到所有绑定的 Pipeline</span>
            </div>
            <div className="binding-chips">
              {bindings.map((b) => (
                <BindingChip key={b.id} b={b} onRemove={() => removeBinding(b.id)} />
              ))}
              <button className="add-binding" onClick={addBinding}>
                {PLUS_ICON}添加 Pipeline
              </button>
            </div>
            <div className="binding-meta">
              <span>已绑 <span className="binding-count">{bindings.length}</span> 个 Pipeline · 事件将扇出</span>
              <span>POST /api/v1/namespaces/ops/subscriptions</span>
            </div>
          </section>

          {/* ② Source 配置 */}
          <section className="form-section">
            <div className="section-head">
              <span className="section-num">2</span>
              <h3 className="section-title">源配置</h3>
              <span className="section-hint">选择事件来源类型并填写连接信息</span>
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
              <div className="field-group">
                <label className="field-label">mq</label>
                <input className="field-input" defaultValue="kafka://orders-cluster" />
              </div>
              <div className="field-group">
                <label className="field-label">topic</label>
                <input className="field-input" defaultValue="cdc.orders.all" />
              </div>
              <div className="field-group">
                <label className="field-label">db</label>
                <input className="field-input" defaultValue="commerce_db" />
              </div>
              <div className="field-group">
                <label className="field-label">table</label>
                <input className="field-input" defaultValue="orders" />
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
            </div>
          </section>

          {/* ③ 条件编辑器 */}
          <section className="form-section">
            <div className="section-head">
              <span className="section-num">3</span>
              <h3 className="section-title">条件编辑器</h3>
              <span className="section-hint">fieldFilter · AND/OR 组合 + Compare/In 叶子</span>
            </div>
            <div className="cond-tree">
              <div className="cond-node">
                <div className="cond-container" data-op="AND">
                  <div className="cond-leaf compare">
                    <span className="leaf-type">CMP</span>
                    <span className="leaf-field">amount</span>
                    <span className="leaf-op">GT</span>
                    <span className="leaf-value">10000</span>
                    <button className="leaf-remove" aria-label="删除条件">{X_ICON}</button>
                  </div>
                  <div className="cond-container or" data-op="OR">
                    <div className="cond-leaf in">
                      <span className="leaf-type">IN</span>
                      <span className="leaf-field">region</span>
                      <span className="leaf-op">IN</span>
                      <span className="leaf-value">[CN, US, EU]</span>
                      <button className="leaf-remove" aria-label="删除条件">{X_ICON}</button>
                    </div>
                    <div className="cond-leaf compare">
                      <span className="leaf-type">CMP</span>
                      <span className="leaf-field">user.tier</span>
                      <span className="leaf-op">EQ</span>
                      <span className="leaf-value">VIP</span>
                      <button className="leaf-remove" aria-label="删除条件">{X_ICON}</button>
                    </div>
                    <button className="cond-add">{PLUS_ICON}叶子</button>
                  </div>
                  <button className="cond-add">{PLUS_ICON}叶子 / 容器</button>
                </div>
              </div>
            </div>
          </section>

          {/* ④ ActionType */}
          <section className="form-section">
            <div className="section-head">
              <span className="section-num">4</span>
              <h3 className="section-title">动作类型</h3>
              <span className="section-hint">命中条件时对绑定的 Pipeline 执行的动作</span>
            </div>
            <div className="action-types">
              <div className={`action-card run${action === 'RUN' ? ' active' : ''}`} onClick={() => setAction('RUN')}>
                <div className="ac-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></div>
                <div className="ac-label">RUN</div>
                <div className="ac-desc">立即触发</div>
              </div>
              <div className={`action-card schedule${action === 'SCHEDULE' ? ' active' : ''}`} onClick={() => setAction('SCHEDULE')}>
                <div className="ac-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></div>
                <div className="ac-label">SCHEDULE</div>
                <div className="ac-desc">延时执行</div>
              </div>
              <div className={`action-card cancel${action === 'CANCEL' ? ' active' : ''}`} onClick={() => setAction('CANCEL')}>
                <div className="ac-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="1" /></svg></div>
                <div className="ac-label">CANCEL</div>
                <div className="ac-desc">取消订阅</div>
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
                分叉链路预览
              </h3>
              <span className="preview-live"><span className="dot" />实时</span>
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

                {/* Source node */}
                <g transform="translate(40, 95)">
                  <circle r="32" fill="rgba(30, 64, 175, 0.08)" stroke="#1E40AF" strokeWidth="1.5" />
                  <circle r="22" fill="#1E40AF" opacity="0.18" />
                  <g transform="translate(-10, -10)" stroke="#1E40AF" strokeWidth="1.8" fill="none">
                    <path d="M3 12c3-4 9-4 12 0c3-4 9-4 12 0" transform="translate(-3 0)" />
                  </g>
                  <text x="0" y="52" textAnchor="middle" className="node-label">Source</text>
                  <text x="0" y="66" textAnchor="middle" className="node-sub">CDC · kafka</text>
                </g>

                <path d="M 75 110 C 130 110, 150 110, 195 110" stroke="url(#flowGrad)" strokeWidth="2.5" fill="none" className="fork-energized" />
                <circle r="4" className="particle">
                  <animateMotion dur="2.4s" repeatCount="indefinite" path="M 75 110 C 130 110, 150 110, 195 110" />
                </circle>

                {/* Subscription node */}
                <g transform="translate(240, 95)">
                  <rect x="-45" y="-40" width="90" height="80" rx="14" fill="rgba(217, 119, 6, 0.10)" stroke="#D97706" strokeWidth="1.5" />
                  <rect x="-35" y="-32" width="70" height="64" rx="10" fill="#fff" opacity="0.5" />
                  <g transform="translate(-12, -12)" stroke="#D97706" strokeWidth="1.8" fill="none">
                    <path d="M2 6h20M2 12h20M2 18h13" />
                  </g>
                  <text x="0" y="14" textAnchor="middle" className="node-label">Subscription</text>
                  <text x="0" y="28" textAnchor="middle" className="node-sub">amount &gt; 10000</text>
                  <text x="0" y="58" textAnchor="middle" className="node-sub" style={{ fill: '#D97706', fontWeight: 600 }}>OR · region IN [CN,US,EU]</text>
                </g>

                <path d="M 285 110 L 330 110" stroke="url(#branchGrad)" strokeWidth="2.5" fill="none" className="fork-energized" />

                {/* Fork node (junction) */}
                <circle cx="335" cy="110" r="6" fill="#D97706" filter="url(#glow)">
                  <animate attributeName="r" values="5;7;5" dur="1.6s" repeatCount="indefinite" />
                </circle>
                <text x="335" y="92" textAnchor="middle" className="node-sub" style={{ fill: '#D97706', fontWeight: 700 }}>FORK</text>

                <BranchPaths bindings={bindings} />
              </svg>
            </div>

            <div className="fork-nodes">
              {bindings.length === 0 ? (
                <div className="fork-empty">未绑定任何 Pipeline · 左侧添加后将在此分叉</div>
              ) : (
                bindings.map((b, idx) => (
                  <ForkPipeline key={b.id} b={b} index={idx} />
                ))
              )}
            </div>

            <div className="preview-footer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
              左侧加 / 减 Pipeline 时，右侧分叉实时同步。
            </div>
          </div>
        </aside>
      </main>
    </>
  )
}

export default SubscriptionEditor
