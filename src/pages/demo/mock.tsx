/* Demo page drawer content — 1:1 from c2-demo.html nodes data. */
import type { ReactNode } from 'react'

export interface DrawerSection {
  h: string
  kvs?: [string, string][]
  code?: ReactNode
}
export interface DrawerNode {
  eyebrow: string
  title: string
  desc: string
  sections: DrawerSection[]
}

// React-renderable drawer definitions. Code blocks are returned as JSX with spans.
export const nodes: Record<'source' | 'subscription' | 'pipeline' | 'alert', DrawerNode> = {
  source: {
    eyebrow: 'Source · Data Source',
    title: 'CDC · orders table',
    desc: 'Subscribes to change events (INSERT/UPDATE) on the business orders table and captures them in real time as they flow in.',
    sections: [
      { h: 'Config', kvs: [['sourceType', 'CDC'], ['mq', 'kafka://prod-bus'], ['topic', 'db.orders'], ['opTypes', 'INSERT, UPDATE']] },
      { h: 'Today', kvs: [['Events', '1,284'], ['Avg Latency', '120 ms']] },
    ],
  },
  subscription: {
    eyebrow: 'Subscription · Subscribe',
    title: 'High-Amount Monitor',
    desc: 'Filters order events with amount > 10,000 from the orders stream and fans them out to the bound rules.',
    sections: [
      { h: 'Bound Rules', kvs: [['pipelineIds[0]', 'High-Amount Order Alert v3'], ['pipelineIds[1]', 'Risk Rule Engine v1']] },
      {
        h: 'Condition (fieldFilter)',
        code: (
          <>
            {'{\n  "type": "AND",\n  "children": [\n    { "type": "Compare",\n      "field": "amount",\n      "op": "GT",\n      "value": '}<span className="n">10000</span>{' },\n    { "type": "Compare",\n      "field": "status",\n      "op": "IN",\n      "value": ['}<span className="s">"PAID"</span>{'] }\n  ]\n}'}
          </>
        ),
      },
      { h: 'Today', kvs: [['Matched', '312'], ['Filtered Out', '972']] },
    ],
  },
  pipeline: {
    eyebrow: 'Rule · Processing',
    title: 'check: High-Amount Order Alert v3',
    desc: 'A single-node check rule that compares the order amount against a threshold and emits a CRITICAL alert when matched.',
    sections: [
      { h: 'Version', kvs: [['currentVersion', 'v3'], ['status', 'PUBLISHED'], ['definitionHash', '9f2a...c1e7']] },
      {
        h: 'Definition (definition)',
        code: (
          <>
            {'{\n  "nodes": [\n    { "type": '}<span className="s">"check"</span>{',\n      "name": '}<span className="s">"check-amount"</span>{',\n      "params": {\n        "field": '}<span className="s">"amount"</span>{',\n        "op": '}<span className="s">"GT"</span>{',\n        "threshold": '}<span className="n">10000</span>{' } }\n  ],\n  "emit": '}<span className="s">"alert"</span>{'\n}'}
          </>
        ),
      },
      { h: 'Today', kvs: [['Executions', '312'], ['Success Rate', '99.4%']] },
    ],
  },
  alert: {
    eyebrow: 'Alert · Triggered Alert',
    title: 'High-Amount Order Alert',
    desc: 'Order ¥58,200 matched the rule, triggering a CRITICAL alert that enters the on-call queue.',
    sections: [
      { h: 'Metadata', kvs: [['severity', 'CRITICAL'], ['status', 'ACTIVE'], ['disposition', 'ACKNOWLEDGED'], ['fingerprint', 'a1b2c3d4e5f6'], ['startsAt', '2026-07-19 14:28:01'], ['dedupCount', '5']] },
      { h: 'labels', kvs: [['entity', 'orders'], ['team', 'payment'], ['pipeline', 'High-Amount Order Alert v3']] },
      {
        h: 'annotations',
        code: (
          <>
            <span className="k">summary</span>{': High-Amount Order Alert\n'}<span className="k">description</span>{': Order #ORD-88210\n  Amount '}<span className="n">¥58,200</span>{' exceeds threshold\n'}<span className="k">runbook</span>{': /runbooks/high-amount'}
          </>
        ),
      },
    ],
  },
}

// Narration text per step.
export const NARRATIONS: Record<number, ReactNode> = {
  0: (<><span className="current">① Event Injection</span> · A CDC event flows from the orders table into the Source</>),
  1: (<><span className="current">② Flow to Subscription</span> · The event travels along the rule to the condition filter</>),
  2: (<><span className="current">③ Rule Judgment</span> · The check node compares amount &gt; 10000 — matched</>),
  3: (<><span className="current">④ Alert Emitted</span> · The event reaches the end and bursts into a CRITICAL alert</>),
  4: (<><span className="current">✓ Done</span> · A CRITICAL alert has been emitted and enters the on-call queue</>),
}

export const PATH_START = 125
export const PATH_END = 875
export const NODE_X = { source: 125, subscription: 375, pipeline: 625, alert: 875 }
