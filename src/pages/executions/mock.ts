/* Executions mock data — 1:1 from b3-executions.html <script>. */

export type TriggerType = 'CDC' | 'CRON' | 'API'
export type ExecResult = 'SUCCESS' | 'SHORT_CIRCUITED'

export interface Execution {
  id: string
  time: string
  rel: string
  trigger: TriggerType
  pipeline: string
  pipelineMeta: string
  duration: number
  durationPct: number
  result: ExecResult
  event: Record<string, unknown>
}

export const executions: Execution[] = [
  { id: 'e1', time: '14:32:18', rel: '刚刚', trigger: 'CDC', pipeline: 'high-amount-order-alert', pipelineMeta: 'v3 · PUBLISHED', duration: 38, durationPct: 19, result: 'SUCCESS', event: { entity: 'orders', op: 'INSERT', amount: 58200, orderId: '20260719-X8742' } },
  { id: 'e2', time: '14:32:11', rel: '7秒前', trigger: 'CDC', pipeline: 'high-amount-order-alert', pipelineMeta: 'v3 · PUBLISHED', duration: 22, durationPct: 11, result: 'SHORT_CIRCUITED', event: { entity: 'orders', op: 'INSERT', amount: 890, orderId: '20260719-X8741' } },
  { id: 'e3', time: '14:31:54', rel: '24秒前', trigger: 'CDC', pipeline: 'risk-score-monitor', pipelineMeta: 'v2 · PUBLISHED', duration: 142, durationPct: 71, result: 'SUCCESS', event: { entity: 'user-risk-score', op: 'UPDATE', userId: 'user_88210', score: 92 } },
  { id: 'e4', time: '14:31:32', rel: '46秒前', trigger: 'CRON', pipeline: 'daily-report-job', pipelineMeta: 'v1 · PUBLISHED', duration: 138, durationPct: 69, result: 'SUCCESS', event: { entity: 'cron', cron: '*/5 * * * *', job: 'metrics-aggregation' } },
  { id: 'e5', time: '14:31:18', rel: '1分钟前', trigger: 'CDC', pipeline: 'inventory-mismatch-warn', pipelineMeta: 'v4 · PUBLISHED', duration: 56, durationPct: 28, result: 'SHORT_CIRCUITED', event: { entity: 'inventory', op: 'UPDATE', sku: '2241', diff: 0 } },
  { id: 'e6', time: '14:30:48', rel: '1分钟前', trigger: 'API', pipeline: 'manual-batch-check', pipelineMeta: 'v1 · DRAFT', duration: 186, durationPct: 93, result: 'SUCCESS', event: { entity: 'batch', op: 'API', count: 1242 } },
  { id: 'e7', time: '14:30:22', rel: '2分钟前', trigger: 'CDC', pipeline: 'order-failure-rate-warn', pipelineMeta: 'v5 · PUBLISHED', duration: 88, durationPct: 44, result: 'SUCCESS', event: { entity: 'order-service', op: 'INSERT', failureRate: 0.038 } },
  { id: 'e8', time: '14:30:01', rel: '2分钟前', trigger: 'CRON', pipeline: 'gateway-latency-alert', pipelineMeta: 'v2 · PUBLISHED', duration: 42, durationPct: 21, result: 'SUCCESS', event: { entity: 'cron', cron: '*/10 * * * *', p99Latency: 4200 } },
  { id: 'e9', time: '14:29:38', rel: '3分钟前', trigger: 'CDC', pipeline: 'high-amount-order-alert', pipelineMeta: 'v3 · PUBLISHED', duration: 32, durationPct: 16, result: 'SHORT_CIRCUITED', event: { entity: 'orders', op: 'INSERT', amount: 3200, orderId: '20260719-X8738' } },
  { id: 'e10', time: '14:29:11', rel: '3分钟前', trigger: 'CDC', pipeline: 'db-health-monitor', pipelineMeta: 'v6 · PUBLISHED', duration: 64, durationPct: 32, result: 'SUCCESS', event: { entity: 'pg-primary', op: 'METRIC', connUsage: 0.97 } },
  { id: 'e11', time: '14:28:54', rel: '4分钟前', trigger: 'CDC', pipeline: 'kafka-lag-monitor', pipelineMeta: 'v3 · PUBLISHED', duration: 24, durationPct: 12, result: 'SUCCESS', event: { entity: 'kafka-orders-topic', op: 'METRIC', lag: 24000 } },
  { id: 'e12', time: '14:28:30', rel: '4分钟前', trigger: 'CDC', pipeline: 'payment-callback-monitor', pipelineMeta: 'v2 · PUBLISHED', duration: 112, durationPct: 56, result: 'SUCCESS', event: { entity: 'payment-callback', op: 'INSERT', successRate: 0.87 } },
  { id: 'e13', time: '14:28:09', rel: '4分钟前', trigger: 'CDC', pipeline: 'high-amount-order-alert', pipelineMeta: 'v3 · PUBLISHED', duration: 28, durationPct: 14, result: 'SUCCESS', event: { entity: 'orders', op: 'INSERT', amount: 18200, orderId: '20260719-X8735' } },
  { id: 'e14', time: '14:27:48', rel: '5分钟前', trigger: 'CRON', pipeline: 'redis-memory-monitor', pipelineMeta: 'v4 · PUBLISHED', duration: 38, durationPct: 19, result: 'SHORT_CIRCUITED', event: { entity: 'redis-cluster', op: 'METRIC', memUsage: 0.74 } },
]

export const liveTemplates: Omit<Execution, 'id' | 'time' | 'rel'>[] = [
  { trigger: 'CDC', pipeline: 'high-amount-order-alert', pipelineMeta: 'v3 · PUBLISHED', duration: 34, durationPct: 17, result: 'SUCCESS', event: { entity: 'orders', op: 'INSERT', amount: 12500, orderId: '20260719-X8801' } },
  { trigger: 'CDC', pipeline: 'order-failure-rate-warn', pipelineMeta: 'v5 · PUBLISHED', duration: 18, durationPct: 9, result: 'SHORT_CIRCUITED', event: { entity: 'order-service', op: 'INSERT', failureRate: 0.012 } },
  { trigger: 'CRON', pipeline: 'kafka-lag-monitor', pipelineMeta: 'v3 · PUBLISHED', duration: 46, durationPct: 23, result: 'SUCCESS', event: { entity: 'kafka-orders-topic', op: 'METRIC', lag: 4200 } },
]
