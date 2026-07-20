/* Alerts mock data — 1:1 from b1-alerts.html <script>.
 *
 * Fields aligned with backend DTO (observe-alerting AlertPo + ADR-0005):
 *   status: ACTIVE/EXPIRED (replaces FIRING/RESOLVED, auto-transitions to EXPIRED via TTL)
 *   disposition: NONE/ACKNOWLEDGED/IGNORED (orthogonal to status — any status can be ack/ignored)
 *   resolvedAt → endsAt (backend endsAt = auto-expiry time, resolvedAt field is deprecated)
 */

export type Severity = 'CRITICAL' | 'WARNING' | 'INFO'
export type AlertStatus = 'ACTIVE' | 'EXPIRED'
export type AlertDisposition = 'NONE' | 'ACKNOWLEDGED' | 'IGNORED'

export interface Alert {
  id: string
  severity: Severity
  status: AlertStatus
  disposition: AlertDisposition
  fingerprint: string
  entity: string
  description: string
  team: string
  teamLabel: string
  pipeline: string
  startedAt: string
  lastSeenAt?: string
  endsAt?: string
  dedupCount: number
  ackNote?: string
  ackBy?: string
  ackAt?: string
  new?: boolean
}

export const alerts: Alert[] = [
  { id: 'a1', severity: 'CRITICAL', status: 'ACTIVE', disposition: 'ACKNOWLEDGED', fingerprint: 'high-amount-order', entity: 'orders', description: 'Order amount ¥58,200 exceeds threshold 10,000 — high-amount order alert. Source: CDC events, order #20260719-X8742.', team: 'payment', teamLabel: 'Payment', pipeline: 'high-amount-order-alert', startedAt: '2 min ago', lastSeenAt: '30 sec ago', dedupCount: 3, ackBy: 'alice@a-solid', ackNote: 'On-call follow-up, suspected normal large order', ackAt: '1 min ago' },
  { id: 'a2', severity: 'CRITICAL', status: 'ACTIVE', disposition: 'NONE', fingerprint: 'payment-gateway-timeout', entity: 'payment-gateway', description: 'Payment gateway P99 latency 4.2s, breaching 1.5s threshold for 5 min. Downstream service may be degraded.', team: 'ops', teamLabel: 'Ops', pipeline: 'gateway-latency-alert', startedAt: '5 min ago', lastSeenAt: '30 sec ago', dedupCount: 8 },
  { id: 'a3', severity: 'CRITICAL', status: 'ACTIVE', disposition: 'IGNORED', fingerprint: 'risk-score-anomaly', entity: 'user-risk-score', description: 'User user_88210 risk score 92 (threshold 80), 3 high-risk transactions within 1 min — suspected fraud.', team: 'risk', teamLabel: 'Risk', pipeline: 'risk-score-monitor', startedAt: '8 min ago', lastSeenAt: '1 min ago', dedupCount: 3, ackBy: 'bob@a-solid', ackNote: 'Known false positive from risk rule, fix pending next release' },
  { id: 'a4', severity: 'CRITICAL', status: 'ACTIVE', disposition: 'NONE', fingerprint: 'db-conn-pool-exhausted', entity: 'pg-primary', description: 'Primary DB connection pool utilization 97% (threshold 90%), active connections 195/200.', team: 'ops', teamLabel: 'Ops', pipeline: 'db-health-monitor', startedAt: '12 min ago', lastSeenAt: '2 min ago', dedupCount: 2 },
  { id: 'a5', severity: 'WARNING', status: 'ACTIVE', disposition: 'NONE', fingerprint: 'order-failure-rate', entity: 'order-service', description: 'Order creation failure rate 3.8% (threshold 3%), steadily rising over the past 10 min.', team: 'payment', teamLabel: 'Payment', pipeline: 'order-failure-rate-warn', startedAt: '18 min ago', lastSeenAt: '3 min ago', dedupCount: 4 },
  { id: 'a6', severity: 'CRITICAL', status: 'EXPIRED', disposition: 'NONE', fingerprint: 'kafka-consumer-lag', entity: 'kafka-orders-topic', description: 'Orders topic consumer lag reached 24k (threshold 10k) — consumption can\'t keep up with production.', team: 'ops', teamLabel: 'Ops', pipeline: 'kafka-lag-monitor', startedAt: '32 min ago', lastSeenAt: '12 min ago', endsAt: 'Expired · 5 min ago', dedupCount: 6 },
  { id: 'a7', severity: 'WARNING', status: 'ACTIVE', disposition: 'NONE', fingerprint: 'inventory-mismatch', entity: 'inventory-sku-2241', description: 'SKU 2241 inventory mismatch with order system, delta -127 units.', team: 'payment', teamLabel: 'Payment', pipeline: 'inventory-mismatch-warn', startedAt: '40 min ago', lastSeenAt: '10 min ago', dedupCount: 1 },
  { id: 'a8', severity: 'CRITICAL', status: 'EXPIRED', disposition: 'NONE', fingerprint: 'redis-memory-pressure', entity: 'redis-cluster', description: 'Redis cluster memory usage 88% (threshold 85%) — early warning before master failover.', team: 'ops', teamLabel: 'Ops', pipeline: 'redis-memory-monitor', startedAt: '1 hour ago', lastSeenAt: '40 min ago', endsAt: 'Expired · 28 min ago', dedupCount: 5 },
  { id: 'a9', severity: 'WARNING', status: 'EXPIRED', disposition: 'NONE', fingerprint: 'slow-query-spike', entity: 'pg-replica-2', description: 'Slow queries 142/min (threshold 100/min), concentrated on orders table GROUP BY.', team: 'ops', teamLabel: 'Ops', pipeline: 'slow-query-monitor', startedAt: '2 hours ago', lastSeenAt: '1 hour ago', endsAt: 'Expired · 1 hour ago', dedupCount: 9 },
  { id: 'a10', severity: 'INFO', status: 'ACTIVE', disposition: 'NONE', fingerprint: 'deploy-notice', entity: 'order-service', description: 'order-service deployed v2.4.1 (canary 30%), observation window 15 min.', team: 'payment', teamLabel: 'Payment', pipeline: 'deploy-tracking', startedAt: '2 hours ago', lastSeenAt: '1 hour ago', dedupCount: 1 },
  { id: 'a11', severity: 'WARNING', status: 'EXPIRED', disposition: 'NONE', fingerprint: 'cpu-throttle', entity: 'node-app-3', description: 'CPU throttling triggered (78% sustained for 5 min), instance auto-scaled.', team: 'ops', teamLabel: 'Ops', pipeline: 'cpu-throttle-warn', startedAt: '3 hours ago', lastSeenAt: '2 hours ago', endsAt: 'Expired · 2 hours ago', dedupCount: 2 },
  { id: 'a12', severity: 'CRITICAL', status: 'EXPIRED', disposition: 'ACKNOWLEDGED', fingerprint: 'payment-cb-anomaly', entity: 'payment-callback', description: 'Callback success rate 87% (threshold 95%), suspected third-party API instability.', team: 'payment', teamLabel: 'Payment', pipeline: 'payment-callback-monitor', startedAt: '4 hours ago', lastSeenAt: '3 hours ago', endsAt: 'Expired · 3 hours ago', dedupCount: 12, ackBy: 'carol@a-solid', ackNote: 'Third-party confirmed instability, now recovered', ackAt: '3 hours ago' },
  { id: 'a13', severity: 'INFO', status: 'EXPIRED', disposition: 'NONE', fingerprint: 'cron-job-finished', entity: 'daily-report-job', description: 'Daily report cron job completed, processed 12,403 orders in 2m18s.', team: 'ops', teamLabel: 'Ops', pipeline: 'cron-job-tracker', startedAt: '5 hours ago', lastSeenAt: '5 hours ago', endsAt: 'Expired · 5 hours ago', dedupCount: 0 },
  { id: 'a14', severity: 'WARNING', status: 'EXPIRED', disposition: 'NONE', fingerprint: 'rate-limit-hit', entity: 'api-gateway', description: 'API gateway rate-limit triggered 1.2k times/min (threshold 800), from IP range 10.20.x.', team: 'risk', teamLabel: 'Risk', pipeline: 'rate-limit-warn', startedAt: '6 hours ago', lastSeenAt: '5 hours ago', endsAt: 'Expired · 5 hours ago', dedupCount: 7 },
]

// Live incoming alerts (simulated real-time feed).
export const incoming: Alert[] = [
  { id: 'live1', severity: 'CRITICAL', status: 'ACTIVE', disposition: 'NONE', fingerprint: 'order-burst-anomaly', entity: 'order-service', description: 'Order creation rate 8.2k/min (baseline 3k) — suspected traffic anomaly or burst abuse.', team: 'payment', teamLabel: 'Payment', pipeline: 'order-burst-detector', startedAt: 'Just now', dedupCount: 1 },
  { id: 'live2', severity: 'WARNING', status: 'ACTIVE', disposition: 'NONE', fingerprint: 'cdc-lag-spikes', entity: 'cdc-orders', description: 'CDC consumption lag spiked to 5.4k, 12s delay.', team: 'ops', teamLabel: 'Ops', pipeline: 'cdc-lag-monitor', startedAt: 'Just now', dedupCount: 1 },
]

export const severityCounts = {
  total: 64,
  active: 8,
  expired: 56,
  CRITICAL: 12,
  WARNING: 47,
  INFO: 5,
  criticalActive: 7,
  criticalExpired: 5,
  warningActive: 1,
  warningExpired: 46,
  infoActive: 0,
  infoExpired: 5,
}
