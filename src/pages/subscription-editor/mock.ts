/* Subscription editor mock data — 1:1 from a5-subscription-editor.html. */

export interface PipelineBinding {
  id: string
  label: string
  cond: string
  severity: string
  groovy: string
  groovyLines: number
  labels: Record<string, string>
}

export const initialBindings: PipelineBinding[] = [
  { id: 'high-amount-order-alert', label: '高额订单告警', cond: 'amount > 10000', severity: 'CRITICAL', groovy: 'if (amount > 10000) alerts.emit(...)', groovyLines: 14, labels: { app: 'order-service', team: 'payment' } },
  { id: 'risk-score-monitor', label: '风控告警', cond: 'riskScore > 0.8', severity: 'WARNING', groovy: 'if (riskScore > 0.8) alerts.emit(...)', groovyLines: 31, labels: { app: 'risk-engine', team: 'risk' } },
  { id: 'inventory-mismatch-warn', label: '库存告警', cond: 'stockDelta ≠ orderQty', severity: 'WARNING', groovy: 'if (delta != qty) alerts.emit(...)', groovyLines: 33, labels: { app: 'inventory', team: 'payment' } },
]

export const pipelinePool: PipelineBinding[] = [
  { id: 'order-cancel-handler', label: '订单取消处理', cond: 'status = CANCELLED', severity: 'INFO', groovy: 'onCancel(event) { ... }', groovyLines: 18, labels: { app: 'order-service', team: 'payment' } },
  { id: 'refund-flow-trigger', label: '退款流程触发', cond: 'refundable = true', severity: 'WARNING', groovy: 'if (refundable) alerts.emit(...)', groovyLines: 22, labels: { app: 'payment-gateway', team: 'payment' } },
  { id: 'logistics-notify', label: '物流通知', cond: 'shipped = true', severity: 'INFO', groovy: 'notifyLogistics(event)', groovyLines: 9, labels: { app: 'logistics', team: 'ops' } },
  { id: 'user-tier-upgrade', label: '会员升级', cond: 'tier change', severity: 'INFO', groovy: 'onTierChange(event)', groovyLines: 15, labels: { app: 'user-service', team: 'growth' } },
]
