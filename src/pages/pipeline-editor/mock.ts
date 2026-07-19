/* Pipeline editor mock data — 1:1 from a2-pipeline-editor.html. */

export const groovyScript = `// 高额订单告警 · GroovyScriptEngine 沙箱（5s 超时）
def amount = event.getAt("after.amount") ?: event.getAt("amount")
def threshold = 10000

if (amount as BigDecimal > threshold) {
  alerts.emit(
    "high-amount-order",            // fingerprint
    "CRITICAL",                     // severity
    [app: "order-service", team: "payment"],
    [summary: "金额 \${amount} > \${threshold}"]
  )
  return true   // 命中
}
return false   // SHORT_CIRCUITED`

export const initialLabels: { key: string; value: string }[] = [
  { key: 'app', value: 'order-service' },
  { key: 'line', value: 'commerce' },
  { key: 'team', value: 'payment' },
  { key: 'domain', value: 'risk-control' },
]

export const ctxChips = [
  { k: 'event', type: 'Event', title: '当前事件，支持 getAt(path) 路径解析' },
  { k: 'alerts', type: 'AlertsApi', title: 'AlertsApi: emit(fingerprint, severity, labels, annotations)' },
  { k: 'db', type: 'DbApi', title: 'DbApi: query(sql, args) 只读 SQL 访问' },
  { k: 'ctx', type: 'ScriptContext', title: 'ctx 共享上下文，跨节点传值' },
  { k: 'now', type: 'Supplier<Instant>', title: 'now() 当前时间 Supplier' },
]

export type DryRunEvent = 'match' | 'miss'

export interface DryRunStep {
  stage: string
  cls: '' | 'success' | 'alert'
  node: 'input' | 'script' | 'script-miss' | 'output' | 'output-miss'
}

export const dryRunEvents: Record<DryRunEvent, { event: Record<string, unknown>; steps: DryRunStep[] }> = {
  match: {
    event: { type: 'CDC', after: { amount: 58200, orderId: '20260719-X8742' }, op: 'INSERT', meta: { db: 'commerce', table: 'orders' } },
    steps: [
      { stage: '输入', cls: '', node: 'input' },
      { stage: '脚本', cls: 'success', node: 'script' },
      { stage: '输出', cls: 'alert', node: 'output' },
    ],
  },
  miss: {
    event: { type: 'CDC', after: { amount: 890, orderId: '20260719-X8741' }, op: 'INSERT', meta: { db: 'commerce', table: 'orders' } },
    steps: [
      { stage: '输入', cls: '', node: 'input' },
      { stage: '脚本', cls: '', node: 'script-miss' },
      { stage: '输出', cls: '', node: 'output-miss' },
    ],
  },
}
