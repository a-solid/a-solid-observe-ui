/* Subscriptions mock data — 1:1 from a4-subscriptions.html.
 *
 * Fields aligned with backend DTO (observe-config SubscriptionDefinition):
 *   source/sourceTag kept for visual display (used by UI cards), sourceType is the backend enum name CDC/CRON/API
 *   action → actionType (uppercase 'RUN'|'SCHEDULE'|'CANCEL' aligned with backend enum names, original lowercase value kept as action for current rendering)
 *   status active/paused → ACTIVE/INACTIVE (aligned with backend status enum; original lowercase CSS class derived from visualCls)
 *   Adds scheduleDelayMs / scheduleCorrelationKeyPath (SCHEDULE-specific, not enforced for every SCHEDULE in this mock)
 *   Adds db / table / opTypes (CDC-specific) / cronExpression / concurrent (CRON-specific)
 *   pipelineIds: bindings[].name is the pipeline name for rendering, pipelineIds is the backend numeric id reference
 */

export type SourceKind = 'CDC' | 'CRON' | 'API'
export type ActionType = 'RUN' | 'SCHEDULE' | 'CANCEL'
export type StatusKind = 'ACTIVE' | 'INACTIVE'

export interface Binding {
  name: string
  chevron?: boolean
}

export interface Subscription {
  source: SourceKind
  namespace: string
  name: string
  sourceTag: string
  sourceType: SourceKind
  actionType: ActionType
  action: ActionType
  status: StatusKind
  config: { k: string; v: string }[]
  forkTo?: number
  bindings: Binding[]
  pipelineIds: number[]
  // SCHEDULE-specific
  scheduleDelayMs?: number
  scheduleCorrelationKeyPath?: string
  // CDC-specific
  db?: string
  table?: string
  opTypes?: string[]
  // CRON-specific
  cronExpression?: string
  concurrent?: 'SKIP' | 'ALLOW'
  foot: { icon?: 'clock'; label: string; strong?: string }[]
}

// CSS visual class token — kept lowercase to be compatible with legacy CSS (status-active / status-paused, etc.).
export const STATUS_VISUAL_CLASS: Record<StatusKind, string> = { ACTIVE: 'active', INACTIVE: 'paused' }

export const sourceGroups: { source: SourceKind; title: string; count: string; desc: string; items: Subscription[] }[] = [
  {
    source: 'CDC',
    title: 'CDC',
    count: '4 subscriptions',
    desc: 'Change Data Capture · real-time event streams',
    items: [
      {
        source: 'CDC', namespace: 'billing', name: 'Order Event Hub Subscription', sourceTag: 'CDC · mq=kafka', sourceType: 'CDC', actionType: 'RUN', action: 'RUN', status: 'ACTIVE',
        config: [
          { k: 'mq', v: 'kafka://orders-cluster' },
          { k: 'topic', v: 'cdc.orders.all' },
          { k: 'table', v: 'orders' },
          { k: 'opTypes', v: '[INSERT, UPDATE, DELETE]' },
        ],
        db: 'orders_db', table: 'orders', opTypes: ['INSERT', 'UPDATE', 'DELETE'],
        forkTo: 3,
        bindings: [
          { name: 'high-amount-order-alert', chevron: true },
          { name: 'risk-score-monitor', chevron: true },
          { name: 'inventory-mismatch-warn', chevron: true },
        ],
        pipelineIds: [101, 102, 104],
        foot: [{ icon: 'clock', label: '3h ago' }, { label: 'throughput', strong: '320/min' }],
      },
      {
        source: 'CDC', namespace: 'risk', name: 'User Behavior Subscription', sourceTag: 'CDC · mq=kafka', sourceType: 'CDC', actionType: 'SCHEDULE', action: 'SCHEDULE', status: 'ACTIVE',
        config: [
          { k: 'mq', v: 'kafka://users-cluster' },
          { k: 'topic', v: 'cdc.users' },
          { k: 'table', v: 'users' },
          { k: 'opTypes', v: '[UPDATE]' },
        ],
        db: 'users_db', table: 'users', opTypes: ['UPDATE'],
        scheduleDelayMs: 30000, scheduleCorrelationKeyPath: '$.after.user_id',
        forkTo: 2,
        bindings: [{ name: 'fraud-detection-v2' }, { name: 'user-profile-warn' }],
        pipelineIds: [201, 202],
        foot: [{ icon: 'clock', label: 'Yesterday' }, { label: 'throughput', strong: '85/min' }],
      },
      {
        source: 'CDC', namespace: 'order', name: 'Inventory Reconciliation Subscription', sourceTag: 'CDC · mq=kafka', sourceType: 'CDC', actionType: 'CANCEL', action: 'CANCEL', status: 'INACTIVE',
        config: [
          { k: 'mq', v: 'kafka://inventory-cluster' },
          { k: 'topic', v: 'cdc.inventory' },
          { k: 'table', v: 'inventory' },
          { k: 'opTypes', v: '[INSERT, UPDATE]' },
        ],
        db: 'inventory_db', table: 'inventory', opTypes: ['INSERT', 'UPDATE'],
        bindings: [{ name: 'inventory-mismatch-warn' }],
        pipelineIds: [104],
        foot: [{ icon: 'clock', label: 'Paused' }],
      },
      {
        source: 'CDC', namespace: 'billing', name: 'High-Amount Order Monitor', sourceTag: 'CDC · mq=kafka', sourceType: 'CDC', actionType: 'RUN', action: 'RUN', status: 'ACTIVE',
        config: [
          { k: 'mq', v: 'kafka://orders-cluster' },
          { k: 'topic', v: 'cdc.orders' },
          { k: 'table', v: 'orders' },
          { k: 'opTypes', v: '[INSERT, UPDATE]' },
        ],
        db: 'orders_db', table: 'orders', opTypes: ['INSERT', 'UPDATE'],
        bindings: [{ name: 'high-amount-order-alert', chevron: true }],
        pipelineIds: [101],
        foot: [{ icon: 'clock', label: '2h ago' }, { label: 'throughput', strong: '142/min' }],
      },
    ],
  },
  {
    source: 'CRON',
    title: 'CRON',
    count: '2 subscriptions',
    desc: 'Scheduled triggers',
    items: [
      {
        source: 'CRON', namespace: 'ops', name: 'DB Health Check', sourceTag: 'CRON', sourceType: 'CRON', actionType: 'RUN', action: 'RUN', status: 'ACTIVE',
        config: [
          { k: 'cron', v: '*/10 * * * *' },
          { k: 'timezone', v: 'Asia/Shanghai' },
          { k: 'lastRun', v: '2026-07-19 14:30:00' },
        ],
        cronExpression: '*/10 * * * *', concurrent: 'SKIP',
        bindings: [{ name: 'db-health-monitor' }],
        pipelineIds: [108],
        foot: [{ label: 'Next run', strong: '14:40' }, { label: 'runs', strong: '288' }],
      },
      {
        source: 'CRON', namespace: 'billing', name: 'Daily Report Job', sourceTag: 'CRON', sourceType: 'CRON', actionType: 'RUN', action: 'RUN', status: 'ACTIVE',
        config: [
          { k: 'cron', v: '0 2 * * *' },
          { k: 'timezone', v: 'Asia/Shanghai' },
          { k: 'lastRun', v: '2026-07-19 02:00:00' },
        ],
        cronExpression: '0 2 * * *', concurrent: 'SKIP',
        forkTo: 2,
        bindings: [{ name: 'daily-report-job' }, { name: 'metrics-aggregation' }],
        pipelineIds: [103, 112],
        foot: [{ label: 'Next run', strong: 'Tomorrow 02:00' }, { label: 'runs', strong: '42' }],
      },
    ],
  },
  {
    source: 'API',
    title: 'API',
    count: '2 subscriptions',
    desc: 'Triggered via HTTP POST',
    items: [
      {
        source: 'API', namespace: 'billing', name: 'Manual Batch Check', sourceTag: 'API', sourceType: 'API', actionType: 'RUN', action: 'RUN', status: 'ACTIVE',
        config: [
          { k: 'apiName', v: 'manual-batch-check' },
          { k: 'method', v: 'POST' },
          { k: 'path', v: '/events/batch' },
        ],
        bindings: [{ name: 'manual-batch-check' }],
        pipelineIds: [105],
        foot: [{ label: 'calls', strong: '1,402' }, { label: 'avg', strong: '86ms' }],
      },
      {
        source: 'API', namespace: 'ops', name: 'External API Probe', sourceTag: 'API', sourceType: 'API', actionType: 'SCHEDULE', action: 'SCHEDULE', status: 'ACTIVE',
        config: [
          { k: 'apiName', v: 'external-probe' },
          { k: 'method', v: 'POST' },
          { k: 'path', v: '/events/probe' },
        ],
        scheduleDelayMs: 60000, scheduleCorrelationKeyPath: '$.request_id',
        forkTo: 2,
        bindings: [{ name: 'external-probe' }, { name: 'redis-probe' }],
        pipelineIds: [113, 114],
        foot: [{ label: 'calls', strong: '312' }, { label: 'avg', strong: '124ms' }],
      },
    ],
  },
]
