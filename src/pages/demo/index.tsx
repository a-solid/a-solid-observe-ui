import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { nodes, NARRATIONS, PATH_START, NODE_X, type DrawerNode } from './mock'
import './demo.css'

type NodeKey = 'source' | 'subscription' | 'pipeline' | 'alert'

// imperative particle position helpers (refs avoid 60fps React renders)
function setAttr(el: SVGCircleElement | null, name: string, value: number) {
  if (el) el.setAttribute(name, String(value))
}

function Demo() {
  const particleMain = useRef<SVGCircleElement>(null)
  const particleTrail = useRef<SVGCircleElement>(null)
  const ghostRefs = [useRef<SVGCircleElement>(null), useRef<SVGCircleElement>(null), useRef<SVGCircleElement>(null)]
  const injectBurst = useRef<SVGCircleElement>(null)

  const [playing, setPlaying] = useState(false)
  const [loop, setLoop] = useState(false)
  const [step, setStep] = useState(-1)
  
  const [highlightNode, setHighlightNode] = useState<NodeKey | null>(null)
  const [rectState, setRectState] = useState<Record<NodeKey, 'active' | 'alert-active' | null>>({
    source: null, subscription: null, pipeline: null, alert: null,
  })
  const [pulsing, setPulsing] = useState(false)
  const [particleVisible, setParticleVisible] = useState(false)
  const [ghosts, setGhosts] = useState<{ x: number; y: number; opacity: number }[]>([
    { x: NODE_X.subscription, y: 110, opacity: 0 },
    { x: NODE_X.subscription, y: 110, opacity: 0 },
    { x: NODE_X.subscription, y: 110, opacity: 0 },
  ])
  const [burst, setBurst] = useState<{ cx: number; r: number; opacity: number; stroke: string }>({ cx: 125, r: 0, opacity: 0, stroke: 'var(--color-secondary)' })
  const [alertShow, setAlertShow] = useState(false)
  const [drawer, setDrawer] = useState<NodeKey | null>(null)
  const [narration, setNarration] = useState<ReactNode>(<>点击 <strong>「▶ 演示模式」</strong> 开始播放</>)

  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const playingRef = useRef(false)

  const resetStage = useCallback(() => {
    setParticleVisible(false)
    setAttr(particleMain.current, 'cx', PATH_START)
    setAttr(particleTrail.current, 'cx', PATH_START)
    setGhosts([0, 1, 2].map(() => ({ x: NODE_X.subscription, y: 110, opacity: 0 })))
    setRectState({ source: null, subscription: null, pipeline: null, alert: null })
    setPulsing(false)
    setBurst({ cx: 125, r: 0, opacity: 0, stroke: 'var(--color-secondary)' })
    setAlertShow(false)
    setStep(-1)
    setNarration(<>点击 <strong>「▶ 演示模式」</strong> 开始播放</>)
  }, [])

  const wait = useCallback((ms: number) => new Promise<void>((r) => { window.setTimeout(r, reduceMotion ? 0 : ms) }), [reduceMotion])

  const animateParticle = useCallback((fromX: number, toX: number, duration: number) =>
    new Promise<void>((resolve) => {
      if (reduceMotion) {
        setAttr(particleMain.current, 'cx', toX)
        setAttr(particleTrail.current, 'cx', toX - 8)
        resolve()
        return
      }
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        const x = fromX + (toX - fromX) * eased
        setAttr(particleMain.current, 'cx', x)
        setAttr(particleTrail.current, 'cx', x - 8)
        if (t < 1) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })
  , [reduceMotion])

  const play = useCallback(async () => {
    if (playingRef.current) return
    playingRef.current = true
    setPlaying(true)
    resetStage()
    await wait(200)

    // Step 0: injection
    setStep(0); setNarration(NARRATIONS[0])
    setRectState((s) => ({ ...s, source: 'active' }))
    setParticleVisible(true)
    if (!reduceMotion) {
      setBurst({ cx: NODE_X.source, r: 0, opacity: 1, stroke: 'var(--color-secondary)' })
      requestAnimationFrame(() => setBurst((b) => ({ ...b, r: 24 })))
      window.setTimeout(() => setBurst((b) => ({ ...b, opacity: 0 })), 400)
    }
    await wait(700)

    // Step 1: flow to subscription
    setStep(1); setNarration(NARRATIONS[1])
    await animateParticle(PATH_START, NODE_X.subscription, 800)
    setRectState((s) => ({ ...s, source: null, subscription: 'active' }))
    setNarration(<>② 条件过滤 · 2-3 个不满足条件的事件被剔除，主事件通过</>)
    // launch ghosts
    if (!reduceMotion) {
      setGhosts([0, 1, 2].map((i) => {
        const angle = -60 + i * 60
        const rad = (angle * Math.PI) / 180
        return { x: NODE_X.subscription + Math.cos(rad) * 30, y: 110 + Math.sin(rad) * 40, opacity: 0.6 }
      }))
      window.setTimeout(() => setGhosts((gs) => gs.map((g) => ({ ...g, opacity: 0 }))), 400)
    }
    await wait(700)
    await animateParticle(NODE_X.subscription, NODE_X.pipeline, 800)
    setRectState((s) => ({ ...s, subscription: null, pipeline: 'active' }))
    await wait(200)

    // Step 2: pipeline judges
    setStep(2); setNarration(NARRATIONS[2])
    if (!reduceMotion) {
      setPulsing(true)
      window.setTimeout(() => setPulsing(false), 800)
    }
    await wait(900)

    // Step 3: flow to alert
    setStep(3); setNarration(NARRATIONS[3])
    await animateParticle(NODE_X.pipeline, NODE_X.alert, 600)
    setParticleVisible(false)
    setRectState((s) => ({ ...s, pipeline: null, alert: 'alert-active' }))
    if (!reduceMotion) {
      setBurst({ cx: NODE_X.alert, r: 0, opacity: 1, stroke: '#DC2626' })
      requestAnimationFrame(() => setBurst((b) => ({ ...b, r: 40 })))
      window.setTimeout(() => setBurst((b) => ({ ...b, opacity: 0 })), 500)
    }
    setAlertShow(true)
    setStep(4); setNarration(NARRATIONS[4])
    await wait(800)

    setPlaying(false)
    playingRef.current = false

    if (loop && !reduceMotion) {
      await wait(1500)
      play()
    }
  }, [loop, reduceMotion, resetStage, animateParticle, wait])

  // keyboard: space to play
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !playingRef.current) {
        const tag = (document.activeElement?.tagName || '').toLowerCase()
        if (tag !== 'input') {
          e.preventDefault()
          play()
        }
      }
      if (e.key === 'Escape') setDrawer(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [play])

  const rectClass = (key: NodeKey) => {
    const st = rectState[key]
    const cls: string[] = ['node-rect']
    if (st) cls.push(st)
    if (highlightNode === key && !st) cls.push('highlight')
    if (key === 'pipeline' && pulsing) cls.push('pulsing')
    return cls.join(' ')
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark" />
            A-Solid Observe
          </div>
          <div className="nav-spacer" />
          <nav className="role-tabs" aria-label="角色导航">
            <button className="role-tab" type="button">配置</button>
            <button className="role-tab" type="button">告警</button>
            <button className="role-tab active" type="button">大盘</button>
          </nav>
          <Link className="nav-link" to="/">← 返回大盘</Link>
        </div>
      </header>

      <main className="page demo-page">
        <header className="page-header">
          <p className="eyebrow">Live Demo · 招牌演示</p>
          <h1>一个事件，如何变成一条精准告警</h1>
          <p>下面演示一条订单事件，从 CDC 源注入，经过 Subscription 条件过滤，被 Pipeline 判定命中，最终产出一条 CRITICAL 告警的完整旅程。</p>
        </header>

        <section className="stage">
          <div className="stage-inner">
            <svg className="pipeline-svg" viewBox="0 0 1000 220" preserveAspectRatio="xMidYMid meet" role="img" aria-label="事件从 Source 流经 Subscription、Pipeline 到 Alert 的可视化管道">
              <defs>
                <linearGradient id="flow-grad-demo" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1E40AF" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#DC2626" />
                </linearGradient>
                <path id="main-path-demo" d="M 125 110 L 875 110" fill="none" />
              </defs>

              {/* background pipes */}
              <line className="pipe-bg" x1="125" y1="110" x2="375" y2="110" />
              <line className="pipe-bg" x1="375" y1="110" x2="625" y2="110" />
              <line className="pipe-bg" x1="625" y1="110" x2="875" y2="110" />

              {/* flow lines (animated dashes) */}
              <line className={`pipe-flow${step === 1 ? ' active' : ''}`} x1="125" y1="110" x2="375" y2="110" />
              <line className={`pipe-flow${(step === 1 || step === 2) ? ' active' : ''}`} x1="375" y1="110" x2="625" y2="110" />
              <line className={`pipe-flow${step === 3 ? ' active' : ''}`} x1="625" y1="110" x2="875" y2="110" />

              {/* Nodes */}
              <g className="node-group" style={{ cursor: 'pointer' }} onClick={() => setDrawer('source')} onMouseEnter={() => setHighlightNode('source')} onMouseLeave={() => setHighlightNode(null)}>
                <rect className={rectClass('source')} x="40" y="60" width="170" height="100" rx="14" />
                <circle className="node-icon-bg" cx="125" cy="92" r="16" />
                <g transform="translate(115, 82)"><path className="node-icon" d="M10 3 a7 2.5 0 0 0 0 5 a7 2.5 0 0 0 0 -5 M3 5 v9 a7 2.5 0 0 0 14 0 v-9 M3 9.5 a7 2.5 0 0 0 14 0" /></g>
                <text className="node-label" x="125" y="128" textAnchor="middle">① Source</text>
                <text className="node-name" x="125" y="146" textAnchor="middle">CDC · orders 表</text>
              </g>

              <g className="node-group" style={{ cursor: 'pointer' }} onClick={() => setDrawer('subscription')} onMouseEnter={() => setHighlightNode('subscription')} onMouseLeave={() => setHighlightNode(null)}>
                <rect className={rectClass('subscription')} x="290" y="60" width="170" height="100" rx="14" />
                <circle className="node-icon-bg" cx="375" cy="92" r="16" />
                <g transform="translate(365, 82)"><path className="node-icon" d="M3 5 h14 M5 10 h10 M7 15 h6" /></g>
                <text className="node-label" x="375" y="128" textAnchor="middle">② Subscription</text>
                <text className="node-name" x="375" y="146" textAnchor="middle">高额订单监控</text>
              </g>

              <g className="node-group" style={{ cursor: 'pointer' }} onClick={() => setDrawer('pipeline')} onMouseEnter={() => setHighlightNode('pipeline')} onMouseLeave={() => setHighlightNode(null)}>
                <rect className={rectClass('pipeline')} x="540" y="60" width="170" height="100" rx="14" />
                <circle className="node-icon-bg" cx="625" cy="92" r="16" />
                <g transform="translate(615, 82)">
                  <circle className="node-icon" cx="10" cy="10" r="3" />
                  <path className="node-icon" d="M10 2 v3 M10 15 v3 M2 10 h3 M15 10 h3 M4.5 4.5 l2 2 M13.5 13.5 l2 2 M4.5 15.5 l2 -2 M13.5 6.5 l2 -2" />
                </g>
                <text className="node-label" x="625" y="128" textAnchor="middle">③ Pipeline</text>
                <text className="node-name" x="625" y="146" textAnchor="middle">check: 高额订单</text>
              </g>

              <g className="node-group" style={{ cursor: 'pointer' }} onClick={() => setDrawer('alert')} onMouseEnter={() => setHighlightNode('alert')} onMouseLeave={() => setHighlightNode(null)}>
                <rect className={rectClass('alert')} x="790" y="60" width="170" height="100" rx="14" />
                <circle className="node-icon-bg alert" cx="875" cy="92" r="16" />
                <g transform="translate(865, 82)">
                  <path className="node-icon alert" d="M10 2 L19 18 L1 18 Z" />
                  <path className="node-icon alert" d="M10 8 v5" />
                  <circle className="node-icon alert" cx="10" cy="16" r="0.5" fill="currentColor" />
                </g>
                <text className="node-label" x="875" y="128" textAnchor="middle" style={{ fill: 'var(--severity-critical)' }}>④ Alert</text>
                <text className="node-name" x="875" y="146" textAnchor="middle">触发告警</text>
              </g>

              <circle className="inject-burst" ref={injectBurst} cx={burst.cx} cy="110" r={burst.r} style={{ opacity: burst.opacity, stroke: burst.stroke, transition: 'r 600ms cubic-bezier(0.22,0.61,0.36,1), opacity 400ms var(--ease)' }} />

              {ghosts.map((g, i) => (
                <circle key={i} className="particle-ghost" ref={ghostRefs[i]} cx={g.x} cy={g.y} r="4" style={{ opacity: g.opacity, transition: 'all 600ms cubic-bezier(0.34,1.56,0.64,1)' }} />
              ))}

              <circle className="particle-trail" ref={particleTrail} cx={PATH_START} cy="110" r="3" style={{ opacity: particleVisible ? 0.5 : 0 }} />
              <circle className="particle-main" ref={particleMain} cx={PATH_START} cy="110" r="6" style={{ opacity: particleVisible ? 1 : 0 }} />
            </svg>

            {/* Alert card */}
            <div className={`alert-card-wrap${alertShow ? ' show' : ''}`}>
              <div className="alert-card">
                <div className="ac-head">
                  <span className="sev-badge">CRITICAL</span>
                  <p className="ac-title">高额订单告警</p>
                </div>
                <div className="ac-row"><span className="k">fingerprint</span><span className="v">a1b2c3d4e5f6</span></div>
                <div className="ac-row"><span className="k">labels.entity</span><span className="v">orders</span></div>
                <div className="ac-row"><span className="k">team</span><span className="v">payment</span></div>
                <div className="ac-row"><span className="k">startsAt</span><span className="v">14:28:01</span></div>
                <div className="ac-annotation">
                  金额 <strong style={{ color: 'var(--severity-critical)' }}>¥58,200</strong> 超过阈值 ¥10,000
                </div>
              </div>
            </div>
          </div>

          <div className="steps-narration">{narration}</div>

          <div className="step-indicator" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`step-dot${i < step ? ' done' : ''}${i === step ? ' active' : ''}`} />
            ))}
          </div>

          <div className="controls">
            <button className="btn-play" type="button" disabled={playing} onClick={play}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              演示模式
            </button>
            <label className="toggle-loop">
              <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
              <span className="track" />
              <span>自动循环</span>
            </label>
          </div>
        </section>
      </main>

      {/* Drawer */}
      <div className={`drawer-backdrop${drawer ? ' show' : ''}`} onClick={() => setDrawer(null)} />
      <aside className={`drawer${drawer ? ' show' : ''}`} aria-hidden={!drawer}>
        <button className="drawer-close" type="button" aria-label="关闭" onClick={() => setDrawer(null)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        {drawer && <DrawerContent node={nodes[drawer]} />}
      </aside>
    </>
  )
}

function DrawerContent({ node }: { node: DrawerNode }) {
  return (
    <>
      <p className="drawer-eyebrow">{node.eyebrow}</p>
      <h3>{node.title}</h3>
      <p className="desc">{node.desc}</p>
      {node.sections.map((s, i) => (
        <div className="drawer-section" key={i}>
          <h4>{s.h}</h4>
          {s.kvs?.map(([k, v]) => (
            <div className="kv" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
          ))}
          {s.code && <pre className="code-block">{s.code}</pre>}
        </div>
      ))}
    </>
  )
}

export default Demo
