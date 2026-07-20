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
  { id: 'high-amount-order-alert', label: 'High-Amount Order Alert', cond: 'amount > 10000', severity: 'CRITICAL', groovy: 'if (amount > 10000) alerts.emit(...)', groovyLines: 14, labels: { app: 'order-service', team: 'payment' } },
  { id: 'risk-score-monitor', label: 'Risk Score Alert', cond: 'riskScore > 0.8', severity: 'WARNING', groovy: 'if (riskScore > 0.8) alerts.emit(...)', groovyLines: 31, labels: { app: 'risk-engine', team: 'risk' } },
  { id: 'inventory-mismatch-warn', label: 'Inventory Alert', cond: 'stockDelta ≠ orderQty', severity: 'WARNING', groovy: 'if (delta != qty) alerts.emit(...)', groovyLines: 33, labels: { app: 'inventory', team: 'payment' } },
]

export const pipelinePool: PipelineBinding[] = [
  { id: 'order-cancel-handler', label: 'Order Cancellation Handler', cond: 'status = CANCELLED', severity: 'INFO', groovy: 'onCancel(event) { ... }', groovyLines: 18, labels: { app: 'order-service', team: 'payment' } },
  { id: 'refund-flow-trigger', label: 'Refund Flow Trigger', cond: 'refundable = true', severity: 'WARNING', groovy: 'if (refundable) alerts.emit(...)', groovyLines: 22, labels: { app: 'payment-gateway', team: 'payment' } },
  { id: 'logistics-notify', label: 'Logistics Notification', cond: 'shipped = true', severity: 'INFO', groovy: 'notifyLogistics(event)', groovyLines: 9, labels: { app: 'logistics', team: 'ops' } },
  { id: 'user-tier-upgrade', label: 'Member Tier Upgrade', cond: 'tier change', severity: 'INFO', groovy: 'onTierChange(event)', groovyLines: 15, labels: { app: 'user-service', team: 'growth' } },
]
