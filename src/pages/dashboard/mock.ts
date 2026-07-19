/* Dashboard mock data — 1:1 from c1-dashboard.html <script>. */

export const stats = {
  // GET /api/v1/stats/alerts
  bySeverity: { CRITICAL: 12, WARNING: 47, INFO: 5 },
  byStatus: { FIRING: 8, RESOLVED: 56 },
  total: 64,
  // GET /api/v1/stats/executions
  executions: { success: 1204, failed: 21, short_circuited: 87, successRate: 98.4 },
  // hero
  eventsToday: 1284,
  alertsToday: 47,
}

// trend timeseries mock (today, hourly, 0~14h)
export const hours = Array.from({ length: 15 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

export const trend = {
  CRITICAL: [0, 0, 1, 0, 0, 0, 1, 2, 1, 0, 1, 3, 2, 1, 0],
  WARNING: [1, 0, 2, 1, 0, 1, 3, 5, 4, 3, 6, 8, 5, 4, 4],
  INFO: [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0],
}

export const throughput = {
  success: [12, 18, 22, 30, 28, 35, 60, 88, 110, 125, 132, 140, 138, 128, 118],
  failed: [0, 1, 0, 0, 2, 0, 1, 2, 1, 3, 2, 4, 2, 1, 2],
}

export const teamDist = [
  { name: 'payment', value: 24 },
  { name: 'risk', value: 18 },
  { name: 'order', value: 12 },
  { name: 'infra', value: 7 },
  { name: 'others', value: 3 },
]

export const topPipelines = [
  { name: '高额订单告警', count: 28 },
  { name: '支付失败监控', count: 18 },
  { name: '风控规则引擎', count: 12 },
  { name: '库存同步检测', count: 8 },
  { name: '登录异常告警', count: 5 },
]

export const topFingerprints = [
  { name: 'amount_gt_10k', count: 14 },
  { name: 'payment_timeout', count: 9 },
  { name: 'risk_score_high', count: 7 },
  { name: 'inventory_drift', count: 5 },
  { name: 'login_burst', count: 3 },
]

// Sparkline data
export const sparkData = {
  total: trend.CRITICAL.map((_, i) => trend.CRITICAL[i] + trend.WARNING[i] + trend.INFO[i]),
  firing: [3, 4, 5, 6, 5, 7, 6, 8, 7, 8, 9, 8, 9, 8, 8],
  critical: trend.CRITICAL,
  success: [97.8, 98.1, 98.3, 98.5, 98.6, 98.7, 98.5, 98.6, 98.4, 98.3, 98.4, 98.5, 98.4, 98.4, 98.4],
}
