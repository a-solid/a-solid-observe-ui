/* Failed executions mock data — 1:1 from b4-failed.html <script>. */

export type FailStatus = 'pending' | 'resolved' | 'ignored'
export type FailStage = 'input' | 'process' | 'output'

export interface FailCardData {
  id: string
  status: FailStatus
  errorTypeShort: string
  nodeName: string
  pipelineTitle: string
  pipeline: string
  createdAt: string
  rel: string
}

export interface Failure extends FailCardData {
  errorType: string
  failStage: FailStage
  errorMessage: string
  failedAt: string
  isoCreatedAt: string
  inputPreview: Record<string, unknown>
  stack: string[]
}

export const errorGroups: { type: string; count: number; cards: FailCardData[] }[] = [
  {
    type: 'NullPointerException',
    count: 2,
    cards: [
      { id: 'f1', status: 'pending', errorTypeShort: 'NPE @ check', nodeName: 'check', pipelineTitle: 'High-Amount Alert', pipeline: 'high-amount-order-alert v3', createdAt: '14:31:48', rel: '2 min ago' },
      { id: 'f2', status: 'resolved', errorTypeShort: 'NPE @ check', nodeName: 'check', pipelineTitle: 'Inventory Alert', pipeline: 'inventory-alert v2', createdAt: '13:42:11', rel: 'Resolved' },
    ],
  },
  {
    type: 'EmitError',
    count: 1,
    cards: [
      { id: 'f3', status: 'pending', errorTypeShort: 'EmitError @ emit', nodeName: 'emit', pipelineTitle: 'Risk Score Monitor', pipeline: 'risk-score-monitor v2', createdAt: '14:28:33', rel: '5 min ago' },
    ],
  },
  {
    type: 'SchemaMismatch',
    count: 2,
    cards: [
      { id: 'f4', status: 'pending', errorTypeShort: 'SchemaMismatch @ map', nodeName: 'map', pipelineTitle: 'Payment Callback Monitor', pipeline: 'payment-callback-monitor v2', createdAt: '14:15:02', rel: '18 min ago' },
      { id: 'f5', status: 'ignored', errorTypeShort: 'SchemaMismatch @ map', nodeName: 'map', pipelineTitle: 'Gateway Latency Alert', pipeline: 'gateway-latency-alert v2', createdAt: '09:11:48', rel: 'Ignored' },
    ],
  },
  {
    type: 'TimeoutError',
    count: 2,
    cards: [
      { id: 'f6', status: 'pending', errorTypeShort: 'TimeoutError @ http', nodeName: 'http', pipelineTitle: 'External API Probe', pipeline: 'external-probe v1', createdAt: '14:02:21', rel: '30 min ago' },
      { id: 'f7', status: 'resolved', errorTypeShort: 'TimeoutError @ http', nodeName: 'http', pipelineTitle: 'Redis Probe', pipeline: 'redis-probe v1', createdAt: '12:18:54', rel: 'Recovered' },
    ],
  },
]

export const failures: Record<string, Failure> = {
  f1: {
    id: 'f1', status: 'pending', errorTypeShort: 'NPE @ check', nodeName: 'check',
    pipelineTitle: 'High-Amount Alert', pipeline: 'high-amount-order-alert v3', createdAt: '14:31:48', rel: '2 min ago',
    errorType: 'NullPointerException', failStage: 'process',
    errorMessage: 'Cannot invoke "Object.compareTo(Object)" because "value" is null',
    isoCreatedAt: '2026-07-19T14:31:48Z', failedAt: 'check.value.compareTo',
    inputPreview: { entity: 'orders', op: 'INSERT', amount: null, orderId: '20260719-X8740' },
    stack: [
      'at com.asolid.observe.pipeline.nodes.CheckNode.evaluate(CheckNode.java:84)',
      'at com.asolid.observe.pipeline.PipelineRunner.run(PipelineRunner.java:42)',
      'at com.asolid.observe.dispatcher.Dispatcher.dispatch(Dispatcher.java:128)',
      'at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1144)',
    ],
  },
  f3: {
    id: 'f3', status: 'pending', errorTypeShort: 'EmitError @ emit', nodeName: 'emit',
    pipelineTitle: 'Risk Score Monitor', pipeline: 'risk-score-monitor v2', createdAt: '14:28:33', rel: '5 min ago',
    errorType: 'EmitError', failStage: 'output',
    errorMessage: 'Alert emit failed: downstream alertmanager timeout (3s) while sending alert risk-score-anomaly',
    isoCreatedAt: '2026-07-19T14:28:33Z', failedAt: 'emit.alertmanager.send',
    inputPreview: { entity: 'user-risk-score', op: 'UPDATE', userId: 'user_88210', score: 92 },
    stack: [
      'at com.asolid.observe.pipeline.nodes.EmitNode.send(EmitNode.java:117)',
      'at com.asolid.observe.pipeline.PipelineRunner.run(PipelineRunner.java:58)',
      'at com.asolid.observe.dispatcher.Dispatcher.dispatch(Dispatcher.java:128)',
      'Caused by: java.net.SocketTimeoutException: read timed out',
    ],
  },
  f4: {
    id: 'f4', status: 'pending', errorTypeShort: 'SchemaMismatch @ map', nodeName: 'map',
    pipelineTitle: 'Payment Callback Monitor', pipeline: 'payment-callback-monitor v2', createdAt: '14:15:02', rel: '18 min ago',
    errorType: 'SchemaMismatch', failStage: 'input',
    errorMessage: 'Field "callbackStatus" missing from event schema (expected: enum, actual: missing)',
    isoCreatedAt: '2026-07-19T14:15:02Z', failedAt: 'map.field.callbackStatus',
    inputPreview: { entity: 'payment-callback', op: 'INSERT', transactionId: 'tx_88210_X' },
    stack: [
      'at com.asolid.observe.pipeline.nodes.MapNode.apply(MapNode.java:62)',
      'at com.asolid.observe.pipeline.PipelineRunner.run(PipelineRunner.java:38)',
      'at com.asolid.observe.dispatcher.Dispatcher.dispatch(Dispatcher.java:128)',
      'Caused by: com.asolid.observe.schema.MissingFieldException: callbackStatus',
    ],
  },
  f6: {
    id: 'f6', status: 'pending', errorTypeShort: 'TimeoutError @ http', nodeName: 'http',
    pipelineTitle: 'External API Probe', pipeline: 'external-probe v1', createdAt: '14:02:21', rel: '30 min ago',
    errorType: 'TimeoutError', failStage: 'process',
    errorMessage: 'HTTP request to https://api.partner.internal/sync timed out after 5000ms',
    isoCreatedAt: '2026-07-19T14:02:21Z', failedAt: 'http.request.partner',
    inputPreview: { entity: 'cron', op: 'CRON', cron: '*/2 * * * *' },
    stack: [
      'at com.asolid.observe.pipeline.nodes.HttpNode.execute(HttpNode.java:142)',
      'at com.asolid.observe.pipeline.PipelineRunner.run(PipelineRunner.java:42)',
      'at com.asolid.observe.dispatcher.Dispatcher.dispatch(Dispatcher.java:128)',
      'Caused by: java.net.http.HttpTimeoutException: request timed out',
    ],
  },
}
