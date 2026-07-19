/* Alerts mock data — 1:1 from b1-alerts.html <script>. */

export type Severity = 'CRITICAL' | 'WARNING' | 'INFO'
export type AlertStatus = 'FIRING' | 'RESOLVED'

export interface Alert {
  id: string
  severity: Severity
  status: AlertStatus
  fingerprint: string
  entity: string
  description: string
  team: string
  teamLabel: string
  pipeline: string
  startedAt: string
  dedupCount: number
  resolvedAt?: string
  new?: boolean
}

export const alerts: Alert[] = [
  { id: 'a1', severity: 'CRITICAL', status: 'FIRING', fingerprint: 'high-amount-order', entity: 'orders', description: '订单金额 ¥58,200 超过阈值 10,000，触发高额订单告警。来源：CDC events，订单 #20260719-X8742。', team: 'payment', teamLabel: '支付', pipeline: 'high-amount-order-alert', startedAt: '2 分钟前', dedupCount: 3 },
  { id: 'a2', severity: 'CRITICAL', status: 'FIRING', fingerprint: 'payment-gateway-timeout', entity: 'payment-gateway', description: '支付网关 P99 延迟 4.2s，连续 5 分钟超阈值 1.5s。下游服务疑似异常。', team: 'ops', teamLabel: '运维', pipeline: 'gateway-latency-alert', startedAt: '5 分钟前', dedupCount: 8 },
  { id: 'a3', severity: 'CRITICAL', status: 'FIRING', fingerprint: 'risk-score-anomaly', entity: 'user-risk-score', description: '用户 user_88210 风险分 92（阈值 80），3 笔交易 1 分钟内连续高风险，疑似欺诈。', team: 'risk', teamLabel: '风控', pipeline: 'risk-score-monitor', startedAt: '8 分钟前', dedupCount: 3 },
  { id: 'a4', severity: 'CRITICAL', status: 'FIRING', fingerprint: 'db-conn-pool-exhausted', entity: 'pg-primary', description: '主库连接池使用率 97%（阈值 90%），活动连接 195/200。', team: 'ops', teamLabel: '运维', pipeline: 'db-health-monitor', startedAt: '12 分钟前', dedupCount: 2 },
  { id: 'a5', severity: 'WARNING', status: 'FIRING', fingerprint: 'order-failure-rate', entity: 'order-service', description: '订单创建失败率 3.8%（阈值 3%），近 10 分钟持续上升。', team: 'payment', teamLabel: '支付', pipeline: 'order-failure-rate-warn', startedAt: '18 分钟前', dedupCount: 4 },
  { id: 'a6', severity: 'CRITICAL', status: 'RESOLVED', fingerprint: 'kafka-consumer-lag', entity: 'kafka-orders-topic', description: 'orders topic 消费者 lag 达 24k（阈值 10k），消费速度跟不上生产。', team: 'ops', teamLabel: '运维', pipeline: 'kafka-lag-monitor', startedAt: '32 分钟前', dedupCount: 6, resolvedAt: '已恢复 · 5 分钟前' },
  { id: 'a7', severity: 'WARNING', status: 'FIRING', fingerprint: 'inventory-mismatch', entity: 'inventory-sku-2241', description: 'SKU 2241 库存与订单系统不一致，差异 -127 件。', team: 'payment', teamLabel: '支付', pipeline: 'inventory-mismatch-warn', startedAt: '40 分钟前', dedupCount: 1 },
  { id: 'a8', severity: 'CRITICAL', status: 'RESOLVED', fingerprint: 'redis-memory-pressure', entity: 'redis-cluster', description: 'Redis 集群内存使用 88%（阈值 85%），触发主从切换前预警。', team: 'ops', teamLabel: '运维', pipeline: 'redis-memory-monitor', startedAt: '1 小时前', dedupCount: 5, resolvedAt: '已恢复 · 28 分钟前' },
  { id: 'a9', severity: 'WARNING', status: 'RESOLVED', fingerprint: 'slow-query-spike', entity: 'pg-replica-2', description: '慢查询数 142/min（阈值 100/min），集中在 orders 表 GROUP BY。', team: 'ops', teamLabel: '运维', pipeline: 'slow-query-monitor', startedAt: '2 小时前', dedupCount: 9, resolvedAt: '已恢复 · 1 小时前' },
  { id: 'a10', severity: 'INFO', status: 'FIRING', fingerprint: 'deploy-notice', entity: 'order-service', description: 'order-service 已部署 v2.4.1（灰度 30%），观察期 15 分钟。', team: 'payment', teamLabel: '支付', pipeline: 'deploy-tracking', startedAt: '2 小时前', dedupCount: 1 },
  { id: 'a11', severity: 'WARNING', status: 'RESOLVED', fingerprint: 'cpu-throttle', entity: 'node-app-3', description: 'CPU 节流触发（78% 持续 5 分钟），实例已自动扩容。', team: 'ops', teamLabel: '运维', pipeline: 'cpu-throttle-warn', startedAt: '3 小时前', dedupCount: 2, resolvedAt: '已恢复 · 2 小时前' },
  { id: 'a12', severity: 'CRITICAL', status: 'RESOLVED', fingerprint: 'payment-cb-anomaly', entity: 'payment-callback', description: '回调成功率 87%（阈值 95%），疑似三方接口抖动。', team: 'payment', teamLabel: '支付', pipeline: 'payment-callback-monitor', startedAt: '4 小时前', dedupCount: 12, resolvedAt: '已恢复 · 3 小时前' },
  { id: 'a13', severity: 'INFO', status: 'RESOLVED', fingerprint: 'cron-job-finished', entity: 'daily-report-job', description: '日报 cron 任务执行完成，处理 12,403 条订单，耗时 2m18s。', team: 'ops', teamLabel: '运维', pipeline: 'cron-job-tracker', startedAt: '5 小时前', dedupCount: 0, resolvedAt: '已恢复 · 5 小时前' },
  { id: 'a14', severity: 'WARNING', status: 'RESOLVED', fingerprint: 'rate-limit-hit', entity: 'api-gateway', description: 'API 网关 rate-limit 触发 1.2k 次/min（阈值 800），来自 IP 段 10.20.x。', team: 'risk', teamLabel: '风控', pipeline: 'rate-limit-warn', startedAt: '6 小时前', dedupCount: 7, resolvedAt: '已恢复 · 5 小时前' },
]

// Live incoming alerts (simulated real-time feed).
export const incoming: Alert[] = [
  { id: 'live1', severity: 'CRITICAL', status: 'FIRING', fingerprint: 'order-burst-anomaly', entity: 'order-service', description: '订单创建速率 8.2k/min（基线 3k），疑似流量异常或刷单。', team: 'payment', teamLabel: '支付', pipeline: 'order-burst-detector', startedAt: '刚刚', dedupCount: 1 },
  { id: 'live2', severity: 'WARNING', status: 'FIRING', fingerprint: 'cdc-lag-spikes', entity: 'cdc-orders', description: 'CDC 消费 lag 突增到 5.4k，延迟 12s。', team: 'ops', teamLabel: '运维', pipeline: 'cdc-lag-monitor', startedAt: '刚刚', dedupCount: 1 },
]

export const severityCounts = {
  total: 64,
  firing: 8,
  resolved: 56,
  CRITICAL: 12,
  WARNING: 47,
  INFO: 5,
  criticalFiring: 7,
  criticalResolved: 5,
  warningFiring: 1,
  warningResolved: 46,
  infoFiring: 0,
  infoResolved: 5,
}
