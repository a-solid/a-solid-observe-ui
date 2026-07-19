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

/**
 * Inject 模块 —— 走生产 runner,真落库(告警 + execution 记录),与 dry-run 的试跑/回滚不同。
 * 后端: POST /api/v1/namespaces/{namespace}/pipelines/{name}/inject
 * Body: { "eventJson": "<带 @type discriminator 的 JSON 字符串>" }
 * Response: { "code": 0, "data": { "outcome": "SUCCESS" | "FAILED" } }
 */

export interface InjectPipelineMeta {
  namespace: string
  name: string
}

export const injectPipelineMeta: InjectPipelineMeta = {
  namespace: 'ops',
  name: 'high-amount-order-alert',
}

export type InjectEventType = 'CdcEvent' | 'TickEvent' | 'ApiEvent' | 'DelayedEvent'

export interface InjectTemplate {
  type: InjectEventType
  label: string
  description: string
  // 完整 eventJson(用户可编辑)。@type 是后端反序列化的 discriminator。
  eventJson: string
}

export const injectTemplates: InjectTemplate[] = [
  {
    type: 'CdcEvent',
    label: 'CDC · 命中(高额)',
    description: 'after.amount=58200 > threshold 10000 → 应触发 CRITICAL',
    eventJson: `{
  "@type": "CdcEvent",
  "op": "INSERT",
  "after": {
    "orderId": "20260719-X8742",
    "amount": 58200,
    "userId": "u-9921"
  },
  "meta": { "db": "commerce", "table": "orders" }
}`,
  },
  {
    type: 'CdcEvent',
    label: 'CDC · 未命中(低额)',
    description: 'after.amount=890 < threshold → SHORT_CIRCUITED',
    eventJson: `{
  "@type": "CdcEvent",
  "op": "INSERT",
  "after": {
    "orderId": "20260719-X8741",
    "amount": 890,
    "userId": "u-2287"
  },
  "meta": { "db": "commerce", "table": "orders" }
}`,
  },
  {
    type: 'TickEvent',
    label: 'Tick · 定时巡检',
    description: '定时器触发的巡检事件',
    eventJson: `{
  "@type": "TickEvent",
  "firedAt": "2026-07-19T14:28:00Z",
  "meta": { "source": "scheduler", "job": "hourly-check" }
}`,
  },
  {
    type: 'ApiEvent',
    label: 'API · 外部回调',
    description: '第三方系统回调推送的事件',
    eventJson: `{
  "@type": "ApiEvent",
  "source": "payment-gateway",
  "payload": {
    "txId": "tx-001",
    "status": "FAILED",
    "amount": 12000
  },
  "meta": { "receivedAt": "2026-07-19T14:28:30Z" }
}`,
  },
  {
    type: 'DelayedEvent',
    label: 'Delayed · 延迟事件',
    description: '延迟队列投递的事件',
    eventJson: `{
  "@type": "DelayedEvent",
  "originalAt": "2026-07-19T14:00:00Z",
  "delayMs": 1680000,
  "payload": { "refId": "delay-8821" }
}`,
  },
]

export type InjectOutcome = 'SUCCESS' | 'FAILED' | 'PIPELINE_NOT_FOUND' | 'BAD_REQUEST'

export interface InjectResult {
  outcome: InjectOutcome
  message: string
  // 模拟返回的关联资源 ID(供前端跳转)
  executionId?: string
  alertFingerprint?: string
  durationMs?: number
}

/**
 * 模拟 inject 调用。约定:
 * - eventJson 解析失败 / 缺 @type  → BAD_REQUEST
 * - 后端随机概率返回 FAILED(模拟 runner 抛异常)
 * - 否则按 amount 是否 > 10000 推断是否生成告警
 */
export function mockInject(eventJson: string, pipeline: InjectPipelineMeta): Promise<InjectResult> {
  const started = performance.now()
  return new Promise((resolve) => {
    const delay = 500 + Math.random() * 600
    window.setTimeout(() => {
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(eventJson)
      } catch {
        resolve({
          outcome: 'BAD_REQUEST',
          message: 'eventJson 不是合法 JSON',
          durationMs: Math.round(performance.now() - started),
        })
        return
      }
      const t = parsed['@type']
      if (t !== 'CdcEvent' && t !== 'TickEvent' && t !== 'ApiEvent' && t !== 'DelayedEvent') {
        resolve({
          outcome: 'BAD_REQUEST',
          message: 'eventJson 必须包含 "@type":"CdcEvent"|"TickEvent"|"ApiEvent"|"DelayedEvent"',
          durationMs: Math.round(performance.now() - started),
        })
        return
      }
      // 5% 概率模拟 pipeline 未加载
      if (Math.random() < 0.05) {
        resolve({
          outcome: 'PIPELINE_NOT_FOUND',
          message: `pipeline ${pipeline.namespace}/${pipeline.name} 未在 registry 加载(未发布或未热加载)`,
          durationMs: Math.round(performance.now() - started),
        })
        return
      }
      // 10% 概率模拟 runner 抛异常
      if (Math.random() < 0.10) {
        resolve({
          outcome: 'FAILED',
          message: 'runner 抛出 RuntimeException(模拟)',
          durationMs: Math.round(performance.now() - started),
        })
        return
      }
      // 成功:推断告警是否生成(仅 CdcEvent with amount 才能命中)
      const after = parsed['after'] as { amount?: number } | undefined
      const hit = t === 'CdcEvent' && typeof after?.amount === 'number' && after.amount > 10000
      resolve({
        outcome: 'SUCCESS',
        message: hit
          ? 'pipeline 执行成功 · 已生成 1 条告警'
          : 'pipeline 执行成功 · 未命中告警条件(SHORT_CIRCUITED)',
        executionId: 'exec-' + Math.random().toString(36).slice(2, 10),
        alertFingerprint: hit ? 'high-amount-order' : undefined,
        durationMs: Math.round(performance.now() - started),
      })
    }, delay)
  })
}
