/* Pipelines mock data — 1:1 from a1-pipelines.html <script>. */

export type PipeStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'

export interface Pipeline {
  name: string
  desc: string
  status: PipeStatus
  version: string
  updatedAt: string
  spark: number[]
  execCount: number
  groovyLines: number
  labels: Record<string, string>
  team: string
  teamLabel: string
  application: string
}

const TEAM_LABELS: Record<string, string> = { payment: '支付', ops: '运维', risk: '风控' }

const raw: Omit<Pipeline, 'team' | 'teamLabel' | 'application'>[] = [
  { name: 'high-amount-order-alert', desc: '监测 CDC 订单流，金额 > 10000 触发 CRITICAL 告警，主用例。', status: 'PUBLISHED', version: 'v3', updatedAt: '2 小时前', spark: [12, 8, 15, 10, 18, 14, 22, 16, 20, 28, 24, 32], execCount: 1842, groovyLines: 14, labels: { app: 'order-service', line: 'commerce', team: 'payment', domain: 'risk-control' } },
  { name: 'gateway-latency-alert', desc: 'API 网关 P99 延迟超 1.5s 触发 CRITICAL，1 分钟连续判定。', status: 'PUBLISHED', version: 'v2', updatedAt: '昨天', spark: [4, 6, 5, 7, 8, 6, 5, 9, 7, 8, 10, 8], execCount: 720, groovyLines: 22, labels: { app: 'api-gateway', line: 'infra', team: 'ops', tier: 'edge' } },
  { name: 'risk-score-monitor', desc: '风控评分超 80 触发告警，关联用户行为分析，多条件组合。', status: 'PUBLISHED', version: 'v2', updatedAt: '3 天前', spark: [3, 2, 4, 3, 5, 4, 6, 8, 5, 7, 6, 9], execCount: 412, groovyLines: 31, labels: { app: 'risk-engine', line: 'security', team: 'risk', model: 'v3' } },
  { name: 'db-health-monitor', desc: 'DB 连接池使用率 + 主从延迟 + 慢查询 三指标联合判定。', status: 'PUBLISHED', version: 'v6', updatedAt: '4 天前', spark: [2, 1, 2, 3, 2, 1, 2, 1, 3, 2, 2, 1], execCount: 288, groovyLines: 47, labels: { app: 'db', line: 'infra', team: 'ops', db: 'mysql-primary' } },
  { name: 'order-failure-rate-warn', desc: '订单创建失败率 5 分钟滑动窗口超 3% 触发 WARNING。', status: 'PUBLISHED', version: 'v5', updatedAt: '5 天前', spark: [8, 10, 12, 9, 11, 14, 13, 16, 12, 18, 15, 20], execCount: 588, groovyLines: 19, labels: { app: 'order-service', line: 'commerce', team: 'payment', window: '5m' } },
  { name: 'payment-callback-monitor', desc: '支付回调成功率低于 95% 触发告警，分租户维度。', status: 'PUBLISHED', version: 'v2', updatedAt: '1 周前', spark: [5, 7, 6, 8, 5, 7, 9, 6, 8, 10, 7, 9], execCount: 421, groovyLines: 26, labels: { app: 'payment-gateway', line: 'payment', team: 'payment', sla: 'critical' } },
  { name: 'fraud-detection-v2', desc: '新版本欺诈检测：增加 IP 信誉 + 设备指纹联合判定。', status: 'DRAFT', version: 'draft v2', updatedAt: '今天 10:24', spark: [0, 0, 0, 2, 1, 3, 2, 4, 3, 5, 4, 6], execCount: 0, groovyLines: 58, labels: { app: 'risk-engine', line: 'security', team: 'risk', feature: 'ip-rep' } },
  { name: 'inventory-mismatch-warn', desc: '库存对账差异检测：CDC 事件 + 定时全量对账双源校验。', status: 'DRAFT', version: 'draft v4', updatedAt: '今天 14:08', spark: [1, 0, 1, 2, 1, 0, 1, 2, 1, 3, 2, 1], execCount: 0, groovyLines: 33, labels: { app: 'inventory', line: 'commerce', team: 'payment', mode: 'dual-source' } },
  { name: 'legacy-slow-query', desc: '老版本慢查询监控，已迁移到 db-health-monitor。', status: 'ARCHIVED', version: 'v1', updatedAt: '2 个月前', spark: [2, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1], execCount: 142, groovyLines: 12, labels: { app: 'db', line: 'infra', team: 'ops', deprecated: 'true' } },
]

export const pipelines: Pipeline[] = raw.map((p) => {
  const team = p.labels.team || 'other'
  return {
    ...p,
    team,
    teamLabel: TEAM_LABELS[team] || team,
    application: p.labels.app || '',
  }
})
