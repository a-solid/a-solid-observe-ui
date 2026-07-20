/* Executions mock data — 1:1 from b3-executions.html <script>.
 *
 * Fields aligned with backend DTO (observe-pipeline ExecutionPo + ExecutionDto):
 *   trigger → triggerType (keeps SourceType enum names, adds DELAYED/UNKNOWN placeholders)
 *   result → status (merges SUCCESS/SHORT_CIRCUITED/FAILED — single-table query after merge, original failed_executions is deprecated)
 *   time → startedAt; duration → durationMs (durationPct is derived for display)
 *   Adds pipelineId / pipelineVersion / namespace / endedAt / traceId / executionId / FAILED-specific error fields
 *   triggerEvent is the JSON string form of event (backend stores as-is, frontend renders derived object)
 */

export type TriggerType = 'CDC' | 'CRON' | 'API' | 'DELAYED' | 'UNKNOWN'
export type ExecStatus = 'SUCCESS' | 'SHORT_CIRCUITED' | 'FAILED'

export interface Execution {
  id: string
  startedAt: string
  rel: string
  triggerType: TriggerType
  triggerEvent?: string
  pipeline: string
  pipelineMeta: string
  pipelineId: number
  pipelineVersion: number
  namespace: string
  durationMs: number
  durationPct: number
  status: ExecStatus
  endedAt?: string
  traceId?: string
  executionId?: string
  // FAILED-specific
  nodeName?: string
  errorType?: string
  errorMessage?: string
  stackTrace?: string
  event: Record<string, unknown>
}

export const executions: Execution[] = [
  { id: 'e1', startedAt: '14:32:18', rel: 'Just now', triggerType: 'CDC', pipeline: 'high-amount-order-alert', pipelineMeta: 'v3 · PUBLISHED', pipelineId: 101, pipelineVersion: 3, namespace: 'billing', durationMs: 38, durationPct: 19, status: 'SUCCESS', event: { entity: 'orders', op: 'INSERT', amount: 58200, orderId: '20260719-X8742' } },
  { id: 'e2', startedAt: '14:32:11', rel: '7s ago', triggerType: 'CDC', pipeline: 'high-amount-order-alert', pipelineMeta: 'v3 · PUBLISHED', pipelineId: 101, pipelineVersion: 3, namespace: 'billing', durationMs: 22, durationPct: 11, status: 'SHORT_CIRCUITED', event: { entity: 'orders', op: 'INSERT', amount: 890, orderId: '20260719-X8741' } },
  { id: 'e3', startedAt: '14:31:54', rel: '24s ago', triggerType: 'CDC', pipeline: 'risk-score-monitor', pipelineMeta: 'v2 · PUBLISHED', pipelineId: 102, pipelineVersion: 2, namespace: 'risk', durationMs: 142, durationPct: 71, status: 'SUCCESS', event: { entity: 'user-risk-score', op: 'UPDATE', userId: 'user_88210', score: 92 } },
  { id: 'e4', startedAt: '14:31:32', rel: '46s ago', triggerType: 'CRON', pipeline: 'daily-report-job', pipelineMeta: 'v1 · PUBLISHED', pipelineId: 103, pipelineVersion: 1, namespace: 'billing', durationMs: 138, durationPct: 69, status: 'SUCCESS', event: { entity: 'cron', cron: '*/5 * * * *', job: 'metrics-aggregation' } },
  { id: 'e5', startedAt: '14:31:18', rel: '1 min ago', triggerType: 'CDC', pipeline: 'inventory-mismatch-warn', pipelineMeta: 'v4 · PUBLISHED', pipelineId: 104, pipelineVersion: 4, namespace: 'order', durationMs: 56, durationPct: 28, status: 'SHORT_CIRCUITED', event: { entity: 'inventory', op: 'UPDATE', sku: '2241', diff: 0 } },
  { id: 'e6', startedAt: '14:30:48', rel: '1 min ago', triggerType: 'API', pipeline: 'manual-batch-check', pipelineMeta: 'v1 · DRAFT', pipelineId: 105, pipelineVersion: 1, namespace: 'billing', durationMs: 186, durationPct: 93, status: 'SUCCESS', event: { entity: 'batch', op: 'API', count: 1242 } },
  { id: 'e7', startedAt: '14:30:22', rel: '2 min ago', triggerType: 'CDC', pipeline: 'order-failure-rate-warn', pipelineMeta: 'v5 · PUBLISHED', pipelineId: 106, pipelineVersion: 5, namespace: 'order', durationMs: 88, durationPct: 44, status: 'SUCCESS', event: { entity: 'order-service', op: 'INSERT', failureRate: 0.038 } },
  { id: 'e8', startedAt: '14:30:01', rel: '2 min ago', triggerType: 'CRON', pipeline: 'gateway-latency-alert', pipelineMeta: 'v2 · PUBLISHED', pipelineId: 107, pipelineVersion: 2, namespace: 'ops', durationMs: 42, durationPct: 21, status: 'SUCCESS', event: { entity: 'cron', cron: '*/10 * * * *', p99Latency: 4200 } },
  { id: 'e9', startedAt: '14:29:38', rel: '3 min ago', triggerType: 'CDC', pipeline: 'high-amount-order-alert', pipelineMeta: 'v3 · PUBLISHED', pipelineId: 101, pipelineVersion: 3, namespace: 'billing', durationMs: 32, durationPct: 16, status: 'SHORT_CIRCUITED', event: { entity: 'orders', op: 'INSERT', amount: 3200, orderId: '20260719-X8738' } },
  { id: 'e10', startedAt: '14:29:11', rel: '3 min ago', triggerType: 'CDC', pipeline: 'db-health-monitor', pipelineMeta: 'v6 · PUBLISHED', pipelineId: 108, pipelineVersion: 6, namespace: 'ops', durationMs: 64, durationPct: 32, status: 'SUCCESS', event: { entity: 'pg-primary', op: 'METRIC', connUsage: 0.97 } },
  { id: 'e11', startedAt: '14:28:54', rel: '4 min ago', triggerType: 'CDC', pipeline: 'kafka-lag-monitor', pipelineMeta: 'v3 · PUBLISHED', pipelineId: 109, pipelineVersion: 3, namespace: 'ops', durationMs: 24, durationPct: 12, status: 'SUCCESS', event: { entity: 'kafka-orders-topic', op: 'METRIC', lag: 24000 } },
  { id: 'e12', startedAt: '14:28:30', rel: '4 min ago', triggerType: 'CDC', pipeline: 'payment-callback-monitor', pipelineMeta: 'v2 · PUBLISHED', pipelineId: 110, pipelineVersion: 2, namespace: 'billing', durationMs: 112, durationPct: 56, status: 'SUCCESS', event: { entity: 'payment-callback', op: 'INSERT', successRate: 0.87 } },
  { id: 'e13', startedAt: '14:28:09', rel: '4 min ago', triggerType: 'CDC', pipeline: 'high-amount-order-alert', pipelineMeta: 'v3 · PUBLISHED', pipelineId: 101, pipelineVersion: 3, namespace: 'billing', durationMs: 28, durationPct: 14, status: 'SUCCESS', event: { entity: 'orders', op: 'INSERT', amount: 18200, orderId: '20260719-X8735' } },
  { id: 'e14', startedAt: '14:27:48', rel: '5 min ago', triggerType: 'CRON', pipeline: 'redis-memory-monitor', pipelineMeta: 'v4 · PUBLISHED', pipelineId: 111, pipelineVersion: 4, namespace: 'ops', durationMs: 38, durationPct: 19, status: 'SHORT_CIRCUITED', event: { entity: 'redis-cluster', op: 'METRIC', memUsage: 0.74 } },
]

export const liveTemplates: Omit<Execution, 'id' | 'startedAt' | 'rel'>[] = [
  { triggerType: 'CDC', pipeline: 'high-amount-order-alert', pipelineMeta: 'v3 · PUBLISHED', pipelineId: 101, pipelineVersion: 3, namespace: 'billing', durationMs: 34, durationPct: 17, status: 'SUCCESS', event: { entity: 'orders', op: 'INSERT', amount: 12500, orderId: '20260719-X8801' } },
  { triggerType: 'CDC', pipeline: 'order-failure-rate-warn', pipelineMeta: 'v5 · PUBLISHED', pipelineId: 106, pipelineVersion: 5, namespace: 'order', durationMs: 18, durationPct: 9, status: 'SHORT_CIRCUITED', event: { entity: 'order-service', op: 'INSERT', failureRate: 0.012 } },
  { triggerType: 'CRON', pipeline: 'kafka-lag-monitor', pipelineMeta: 'v3 · PUBLISHED', pipelineId: 109, pipelineVersion: 3, namespace: 'ops', durationMs: 46, durationPct: 23, status: 'SUCCESS', event: { entity: 'kafka-orders-topic', op: 'METRIC', lag: 4200 } },
]
