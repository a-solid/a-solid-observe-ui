/* Versions mock data — 1:1 from a3-versions.html. */

export const OLD_SCRIPT = `// High-amount order detection
def amount = event.getAt("amount")
def threshold = 5000

if (amount as BigDecimal > threshold) {
  alerts.emit("high-amount", "WARNING")
  return true
}
return false`

export const NEW_SCRIPT = `// High-amount order detection · tighter threshold + carries business labels
def amount = event.getAt("after.amount") ?: event.getAt("amount")
def threshold = 10000

if (amount as BigDecimal > threshold) {
  alerts.emit(
    "high-amount-order",
    "CRITICAL",
    ["app": "order-service", "team": "payment"],
    ["summary": "amount ¥\${amount}"]
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
  { v: 'v4', status: 'draft', label: 'v4', meta: 'alice · Today 14:08' },
  { v: 'v3', status: 'published', current: true, label: 'v3 · current', meta: 'bob · 5 days ago · hash 0x9a4f' },
  { v: 'v2', status: 'published', label: 'v2', meta: 'alice · 2 weeks ago · hash 0x7b22', initialSelected: true },
  { v: 'v1', status: 'archived', label: 'v1', meta: 'carol · 1 month ago · hash 0x4f10' },
  { v: 'v0', status: 'archived', label: 'v0', meta: 'carol · 2 months ago · hash 0x12ab' },
]
