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
    eyebrow: 'Source · 数据源',
    title: 'CDC · orders 表',
    desc: '订阅业务库 orders 表的变更事件（INSERT/UPDATE），实时捕获流入。',
    sections: [
      { h: '配置', kvs: [['sourceType', 'CDC'], ['mq', 'kafka://prod-bus'], ['topic', 'db.orders'], ['opTypes', 'INSERT, UPDATE']] },
      { h: '今日', kvs: [['事件数', '1,284'], ['平均延迟', '120 ms']] },
    ],
  },
  subscription: {
    eyebrow: 'Subscription · 订阅',
    title: '高额订单监控',
    desc: '从 orders 流中筛出金额超过 10,000 的订单事件，分发给绑定的 pipeline。',
    sections: [
      { h: '绑定 Pipeline', kvs: [['pipelineIds[0]', '高额订单告警 v3'], ['pipelineIds[1]', '风控规则引擎 v1']] },
      {
        h: '条件 (fieldFilter)',
        code: (
          <>
            {'{\n  "type": "AND",\n  "children": [\n    { "type": "Compare",\n      "field": "amount",\n      "op": "GT",\n      "value": '}<span className="n">10000</span>{' },\n    { "type": "Compare",\n      "field": "status",\n      "op": "IN",\n      "value": ['}<span className="s">"PAID"</span>{'] }\n  ]\n}'}
          </>
        ),
      },
      { h: '今日', kvs: [['命中数', '312'], ['过滤掉', '972']] },
    ],
  },
  pipeline: {
    eyebrow: 'Pipeline · 处理',
    title: 'check: 高额订单告警 v3',
    desc: '单节点 check pipeline，比较订单金额是否超过阈值，命中即触发 CRITICAL 告警。',
    sections: [
      { h: '版本', kvs: [['currentVersion', 'v3'], ['status', 'PUBLISHED'], ['definitionHash', '9f2a...c1e7']] },
      {
        h: '定义 (definition)',
        code: (
          <>
            {'{\n  "nodes": [\n    { "type": '}<span className="s">"check"</span>{',\n      "name": '}<span className="s">"check-amount"</span>{',\n      "params": {\n        "field": '}<span className="s">"amount"</span>{',\n        "op": '}<span className="s">"GT"</span>{',\n        "threshold": '}<span className="n">10000</span>{' } }\n  ],\n  "emit": '}<span className="s">"alert"</span>{'\n}'}
          </>
        ),
      },
      { h: '今日', kvs: [['执行次数', '312'], ['成功率', '99.4%']] },
    ],
  },
  alert: {
    eyebrow: 'Alert · 触发的告警',
    title: '高额订单告警',
    desc: '订单 ¥58,200 命中规则，触发 CRITICAL 告警，进入值班处理队列。',
    sections: [
      { h: '元信息', kvs: [['severity', 'CRITICAL'], ['status', 'FIRING'], ['fingerprint', 'a1b2c3d4e5f6'], ['startsAt', '2026-07-19 14:28:01'], ['dedupCount', '5']] },
      { h: 'labels', kvs: [['entity', 'orders'], ['team', 'payment'], ['pipeline', '高额订单告警 v3']] },
      {
        h: 'annotations',
        code: (
          <>
            <span className="k">summary</span>{': 高额订单告警\n'}<span className="k">description</span>{': 订单 #ORD-88210\n  金额 '}<span className="n">¥58,200</span>{' 超阈值\n'}<span className="k">runbook</span>{': /runbooks/high-amount'}
          </>
        ),
      },
    ],
  },
}

// Narration text per step.
export const NARRATIONS: Record<number, ReactNode> = {
  0: (<><span className="current">① 事件注入</span> · 一个 CDC 事件从 orders 表流入 Source</>),
  1: (<><span className="current">② 流向 Subscription</span> · 事件沿管道流向条件过滤器</>),
  2: (<><span className="current">③ Pipeline 判定</span> · check 节点比较 amount &gt; 10000，命中</>),
  3: (<><span className="current">④ 产出告警</span> · 事件到达末端，炸开成一条 CRITICAL 告警</>),
  4: (<><span className="current">✓ 完成</span> · 一条 CRITICAL 告警已产出并进入值班队列</>),
}

export const PATH_START = 125
export const PATH_END = 875
export const NODE_X = { source: 125, subscription: 375, pipeline: 625, alert: 875 }
