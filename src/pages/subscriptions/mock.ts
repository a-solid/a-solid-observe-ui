/* Subscriptions mock data — 1:1 from a4-subscriptions.html. */

export type SourceKind = 'cdc' | 'cron' | 'api'
export type ActionType = 'run' | 'schedule' | 'cancel'
export type StatusKind = 'active' | 'paused'

export interface Binding {
  name: string
  chevron?: boolean
}
export interface Subscription {
  source: SourceKind
  name: string
  sourceTag: string
  action: ActionType
  status: StatusKind
  config: { k: string; v: string }[]
  forkTo?: number
  bindings: Binding[]
  foot: { icon?: 'clock'; label: string; strong?: string }[]
}

export const sourceGroups: { source: SourceKind; title: string; count: string; desc: string; items: Subscription[] }[] = [
  {
    source: 'cdc',
    title: 'CDC',
    count: '4 个订阅',
    desc: '变更数据捕获 · 实时事件流',
    items: [
      {
        source: 'cdc', name: '订单事件中心订阅', sourceTag: 'CDC · mq=kafka', action: 'run', status: 'active',
        config: [
          { k: 'mq', v: 'kafka://orders-cluster' },
          { k: 'topic', v: 'cdc.orders.all' },
          { k: 'table', v: 'orders' },
          { k: 'opTypes', v: '[INSERT, UPDATE, DELETE]' },
        ],
        forkTo: 3,
        bindings: [
          { name: 'high-amount-order-alert', chevron: true },
          { name: 'risk-score-monitor', chevron: true },
          { name: 'inventory-mismatch-warn', chevron: true },
        ],
        foot: [{ icon: 'clock', label: '3h 前' }, { label: 'throughput', strong: '320/min' }],
      },
      {
        source: 'cdc', name: '用户行为订阅', sourceTag: 'CDC · mq=kafka', action: 'schedule', status: 'active',
        config: [
          { k: 'mq', v: 'kafka://users-cluster' },
          { k: 'topic', v: 'cdc.users' },
          { k: 'table', v: 'users' },
          { k: 'opTypes', v: '[UPDATE]' },
        ],
        forkTo: 2,
        bindings: [{ name: 'fraud-detection-v2' }, { name: 'user-profile-warn' }],
        foot: [{ icon: 'clock', label: '昨天' }, { label: 'throughput', strong: '85/min' }],
      },
      {
        source: 'cdc', name: '库存对账订阅', sourceTag: 'CDC · mq=kafka', action: 'cancel', status: 'paused',
        config: [
          { k: 'mq', v: 'kafka://inventory-cluster' },
          { k: 'topic', v: 'cdc.inventory' },
          { k: 'table', v: 'inventory' },
          { k: 'opTypes', v: '[INSERT, UPDATE]' },
        ],
        bindings: [{ name: 'inventory-mismatch-warn' }],
        foot: [{ icon: 'clock', label: '暂停中' }],
      },
      {
        source: 'cdc', name: '高额订单监控', sourceTag: 'CDC · mq=kafka', action: 'run', status: 'active',
        config: [
          { k: 'mq', v: 'kafka://orders-cluster' },
          { k: 'topic', v: 'cdc.orders' },
          { k: 'table', v: 'orders' },
          { k: 'opTypes', v: '[INSERT, UPDATE]' },
        ],
        bindings: [{ name: 'high-amount-order-alert', chevron: true }],
        foot: [{ icon: 'clock', label: '2h 前' }, { label: 'throughput', strong: '142/min' }],
      },
    ],
  },
  {
    source: 'cron',
    title: 'CRON',
    count: '2 个订阅',
    desc: '定时触发执行',
    items: [
      {
        source: 'cron', name: 'DB 健康检查', sourceTag: 'CRON', action: 'run', status: 'active',
        config: [
          { k: 'cron', v: '*/10 * * * *' },
          { k: 'timezone', v: 'Asia/Shanghai' },
          { k: 'lastRun', v: '2026-07-19 14:30:00' },
        ],
        bindings: [{ name: 'db-health-monitor' }],
        foot: [{ label: '下次执行', strong: '14:40' }, { label: 'runs', strong: '288' }],
      },
      {
        source: 'cron', name: '日报任务', sourceTag: 'CRON', action: 'run', status: 'active',
        config: [
          { k: 'cron', v: '0 2 * * *' },
          { k: 'timezone', v: 'Asia/Shanghai' },
          { k: 'lastRun', v: '2026-07-19 02:00:00' },
        ],
        forkTo: 2,
        bindings: [{ name: 'daily-report-job' }, { name: 'metrics-aggregation' }],
        foot: [{ label: '下次执行', strong: '明天 02:00' }, { label: 'runs', strong: '42' }],
      },
    ],
  },
  {
    source: 'api',
    title: 'API',
    count: '2 个订阅',
    desc: '通过 HTTP POST 触发',
    items: [
      {
        source: 'api', name: '手动批次检查', sourceTag: 'API', action: 'run', status: 'active',
        config: [
          { k: 'apiName', v: 'manual-batch-check' },
          { k: 'method', v: 'POST' },
          { k: 'path', v: '/events/batch' },
        ],
        bindings: [{ name: 'manual-batch-check' }],
        foot: [{ label: 'calls', strong: '1,402' }, { label: 'avg', strong: '86ms' }],
      },
      {
        source: 'api', name: '外部接口探测', sourceTag: 'API', action: 'schedule', status: 'active',
        config: [
          { k: 'apiName', v: 'external-probe' },
          { k: 'method', v: 'POST' },
          { k: 'path', v: '/events/probe' },
        ],
        forkTo: 2,
        bindings: [{ name: 'external-probe' }, { name: 'redis-probe' }],
        foot: [{ label: 'calls', strong: '312' }, { label: 'avg', strong: '124ms' }],
      },
    ],
  },
]
