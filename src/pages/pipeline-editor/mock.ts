/* Pipeline editor mock data — 1:1 from a2-pipeline-editor.html. */

export const groovyScript = `// High-amount order alert · GroovyScriptEngine sandbox (5s timeout)
def amount = event.getAt("after.amount") ?: event.getAt("amount")
def threshold = 10000

if (amount as BigDecimal > threshold) {
  alerts.emit(
    "high-amount-order",            // fingerprint
    "CRITICAL",                     // severity
    [app: "order-service", team: "payment"],
    [summary: "amount \${amount} > \${threshold}"]
  )
  return true   // matched
}
return false   // SHORT_CIRCUITED`

export const initialLabels: { key: string; value: string }[] = [
  { key: 'app', value: 'order-service' },
  { key: 'line', value: 'commerce' },
  { key: 'team', value: 'payment' },
  { key: 'domain', value: 'risk-control' },
]

export const ctxChips = [
  { k: 'event', type: 'Event', title: 'Current event, supports getAt(path) for path-based access' },
  { k: 'alerts', type: 'AlertsApi', title: 'AlertsApi: emit(fingerprint, severity, labels, annotations)' },
  { k: 'db', type: 'DbApi', title: 'DbApi: query(sql, args) — read-only SQL access' },
  { k: 'ctx', type: 'ScriptContext', title: 'ctx — shared context, passes values across nodes' },
  { k: 'now', type: 'Supplier<Instant>', title: 'now() — Supplier of current time' },
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
      { stage: 'Input', cls: '', node: 'input' },
      { stage: 'Script', cls: 'success', node: 'script' },
      { stage: 'Output', cls: 'alert', node: 'output' },
    ],
  },
  miss: {
    event: { type: 'CDC', after: { amount: 890, orderId: '20260719-X8741' }, op: 'INSERT', meta: { db: 'commerce', table: 'orders' } },
    steps: [
      { stage: 'Input', cls: '', node: 'input' },
      { stage: 'Script', cls: '', node: 'script-miss' },
      { stage: 'Output', cls: '', node: 'output-miss' },
    ],
  },
}

/**
 * Inject module — goes through the production runner, real DB writes (alerts + execution records),
 * unlike dry-run (trial run / rollback).
 * Backend: POST /api/v1/namespaces/{namespace}/pipelines/{name}/inject
 * Body: { "eventJson": "<JSON string with @type discriminator>" }
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
  // Full eventJson (editable). @type is the backend deserialization discriminator.
  eventJson: string
}

export const injectTemplates: InjectTemplate[] = [
  {
    type: 'CdcEvent',
    label: 'CDC · Match (High Amount)',
    description: 'after.amount=58200 > threshold 10000 → should trigger CRITICAL',
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
    label: 'CDC · Miss (Low Amount)',
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
    label: 'Tick · Scheduled Check',
    description: 'Tick event from scheduled timer',
    eventJson: `{
  "@type": "TickEvent",
  "firedAt": "2026-07-19T14:28:00Z",
  "meta": { "source": "scheduler", "job": "hourly-check" }
}`,
  },
  {
    type: 'ApiEvent',
    label: 'API · External Callback',
    description: 'Callback event from a third-party system',
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
    label: 'Delayed · Deferred Event',
    description: 'Event delivered from a delay queue',
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
  // Simulated associated resource IDs (for frontend navigation)
  executionId?: string
  alertFingerprint?: string
  durationMs?: number
}

/**
 * Simulated inject call. Conventions:
 * - eventJson parse failure / missing @type → BAD_REQUEST
 * - Random probability of FAILED from backend (simulating runner exception)
 * - Otherwise infer whether alert is generated based on amount > 10000
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
          message: 'eventJson is not valid JSON',
          durationMs: Math.round(performance.now() - started),
        })
        return
      }
      const t = parsed['@type']
      if (t !== 'CdcEvent' && t !== 'TickEvent' && t !== 'ApiEvent' && t !== 'DelayedEvent') {
        resolve({
          outcome: 'BAD_REQUEST',
          message: 'eventJson must contain "@type":"CdcEvent"|"TickEvent"|"ApiEvent"|"DelayedEvent"',
          durationMs: Math.round(performance.now() - started),
        })
        return
      }
      // 5% chance: simulate pipeline not loaded
      if (Math.random() < 0.05) {
        resolve({
          outcome: 'PIPELINE_NOT_FOUND',
          message: `pipeline ${pipeline.namespace}/${pipeline.name} not loaded in registry (not published or not hot-reloaded)`,
          durationMs: Math.round(performance.now() - started),
        })
        return
      }
      // 10% chance: simulate runner exception
      if (Math.random() < 0.10) {
        resolve({
          outcome: 'FAILED',
          message: 'Runner threw RuntimeException (simulated)',
          durationMs: Math.round(performance.now() - started),
        })
        return
      }
      // Success: infer whether alert was generated (only CdcEvent with amount can match)
      const after = parsed['after'] as { amount?: number } | undefined
      const hit = t === 'CdcEvent' && typeof after?.amount === 'number' && after.amount > 10000
      resolve({
        outcome: 'SUCCESS',
        message: hit
          ? 'Pipeline executed · 1 alert generated'
          : 'Pipeline executed · Alert condition not matched (SHORT_CIRCUITED)',
        executionId: 'exec-' + Math.random().toString(36).slice(2, 10),
        alertFingerprint: hit ? 'high-amount-order' : undefined,
        durationMs: Math.round(performance.now() - started),
      })
    }, delay)
  })
}
