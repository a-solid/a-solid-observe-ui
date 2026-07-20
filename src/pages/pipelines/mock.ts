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

const TEAM_LABELS: Record<string, string> = { payment: 'Payment', ops: 'Ops', risk: 'Risk' }

const raw: Omit<Pipeline, 'team' | 'teamLabel' | 'application'>[] = [
  { name: 'high-amount-order-alert', desc: 'Monitors CDC order stream, triggers CRITICAL alert when amount > 10000. Primary use case.', status: 'PUBLISHED', version: 'v3', updatedAt: '2 hours ago', spark: [12, 8, 15, 10, 18, 14, 22, 16, 20, 28, 24, 32], execCount: 1842, groovyLines: 14, labels: { app: 'order-service', line: 'commerce', team: 'payment', domain: 'risk-control' } },
  { name: 'gateway-latency-alert', desc: 'Triggers CRITICAL when API gateway P99 latency exceeds 1.5s, sustained for 1 min.', status: 'PUBLISHED', version: 'v2', updatedAt: 'Yesterday', spark: [4, 6, 5, 7, 8, 6, 5, 9, 7, 8, 10, 8], execCount: 720, groovyLines: 22, labels: { app: 'api-gateway', line: 'infra', team: 'ops', tier: 'edge' } },
  { name: 'risk-score-monitor', desc: 'Alerts when risk score exceeds 80, correlated with user behavior analysis, multi-condition combo.', status: 'PUBLISHED', version: 'v2', updatedAt: '3 days ago', spark: [3, 2, 4, 3, 5, 4, 6, 8, 5, 7, 6, 9], execCount: 412, groovyLines: 31, labels: { app: 'risk-engine', line: 'security', team: 'risk', model: 'v3' } },
  { name: 'db-health-monitor', desc: 'Combined evaluation of DB connection pool utilization, replication lag, and slow queries.', status: 'PUBLISHED', version: 'v6', updatedAt: '4 days ago', spark: [2, 1, 2, 3, 2, 1, 2, 1, 3, 2, 2, 1], execCount: 288, groovyLines: 47, labels: { app: 'db', line: 'infra', team: 'ops', db: 'mysql-primary' } },
  { name: 'order-failure-rate-warn', desc: 'Triggers WARNING when order creation failure rate exceeds 3% over a 5-minute sliding window.', status: 'PUBLISHED', version: 'v5', updatedAt: '5 days ago', spark: [8, 10, 12, 9, 11, 14, 13, 16, 12, 18, 15, 20], execCount: 588, groovyLines: 19, labels: { app: 'order-service', line: 'commerce', team: 'payment', window: '5m' } },
  { name: 'payment-callback-monitor', desc: 'Alerts when payment callback success rate drops below 95%, segmented by tenant.', status: 'PUBLISHED', version: 'v2', updatedAt: '1 week ago', spark: [5, 7, 6, 8, 5, 7, 9, 6, 8, 10, 7, 9], execCount: 421, groovyLines: 26, labels: { app: 'payment-gateway', line: 'payment', team: 'payment', sla: 'critical' } },
  { name: 'fraud-detection-v2', desc: 'New fraud detection version: combines IP reputation + device fingerprint.', status: 'DRAFT', version: 'draft v2', updatedAt: 'Today 10:24', spark: [0, 0, 0, 2, 1, 3, 2, 4, 3, 5, 4, 6], execCount: 0, groovyLines: 58, labels: { app: 'risk-engine', line: 'security', team: 'risk', feature: 'ip-rep' } },
  { name: 'inventory-mismatch-warn', desc: 'Inventory reconciliation diff detection: dual-source verification via CDC + scheduled full scan.', status: 'DRAFT', version: 'draft v4', updatedAt: 'Today 14:08', spark: [1, 0, 1, 2, 1, 0, 1, 2, 1, 3, 2, 1], execCount: 0, groovyLines: 33, labels: { app: 'inventory', line: 'commerce', team: 'payment', mode: 'dual-source' } },
  { name: 'legacy-slow-query', desc: 'Legacy slow-query monitor, superseded by db-health-monitor.', status: 'ARCHIVED', version: 'v1', updatedAt: '2 months ago', spark: [2, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1], execCount: 142, groovyLines: 12, labels: { app: 'db', line: 'infra', team: 'ops', deprecated: 'true' } },
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
