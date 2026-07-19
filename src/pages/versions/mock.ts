/* Versions mock data — 1:1 from a3-versions.html. */

export const OLD_SCRIPT = `// 高额订单判定
def amount = event.getAt("amount")
def threshold = 5000

if (amount as BigDecimal > threshold) {
  alerts.emit("high-amount", "WARNING")
  return true
}
return false`

export const NEW_SCRIPT = `// 高额订单判定 · 收紧阈值 + 携带业务标签
def amount = event.getAt("after.amount") ?: event.getAt("amount")
def threshold = 10000

if (amount as BigDecimal > threshold) {
  alerts.emit(
    "high-amount-order",
    "CRITICAL",
    ["app": "order-service", "team": "payment"],
    ["summary": "金额 ¥\${amount}"]
  )
  return true
}
return false`

export interface VersionItem {
  v: string
  status: 'draft' | 'published' | 'archived'
  current?: boolean
  label: string
  meta: string
  initialSelected?: boolean
}

export const versions: VersionItem[] = [
  { v: 'v4', status: 'draft', label: 'v4', meta: 'alice · 今天 14:08' },
  { v: 'v3', status: 'published', current: true, label: 'v3 · current', meta: 'bob · 5 天前 · hash 0x9a4f' },
  { v: 'v2', status: 'published', label: 'v2', meta: 'alice · 2 周前 · hash 0x7b22', initialSelected: true },
  { v: 'v1', status: 'archived', label: 'v1', meta: 'carol · 1 个月前 · hash 0x4f10' },
  { v: 'v0', status: 'archived', label: 'v0', meta: 'carol · 2 个月前 · hash 0x12ab' },
]
