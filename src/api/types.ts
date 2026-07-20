/* DTO types hand-written from api.json OpenAPI 3.1 spec. */

// ── Generic wrappers ──

export interface Page {
  page: number
  size: number
  total: number
}

// ── Namespace ──

export interface NamespaceDto {
  id: number
  name: string
  displayName: string
}

export interface CreateNamespaceRequest {
  name: string
  displayName?: string
}

export interface UpdateNamespaceRequest {
  displayName?: string
}

// ── Pipeline ──

export interface PipelineDto {
  id: number | string
  namespace: string
  labels: Record<string, string>
  name: string
  description: string
  status: string
  currentVersion: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreatePipelineRequest {
  labels?: Record<string, string>
  name: string
  description?: string
  createdBy?: string
}

// ── Subscription ──

export interface SubscriptionFields {
  pipelineIds: (number | string)[]
  db?: string
  table?: string
  opTypes?: ('INSERT' | 'UPDATE' | 'DELETE')[]
  sourceType?: 'CDC' | 'CRON' | 'API' | 'UNKNOWN'
  fieldFilter?: Condition
  actionType?: string
  scheduleDelayMs?: number
  scheduleCorrelationKeyPath?: string
  name?: string
  description?: string
  status?: string
  cronExpression?: string
  concurrent?: string
}

export interface Condition {
  [key: string]: unknown
}

export interface SubscriptionDto {
  id: number
  namespace: string
  pipelineIds: (number | string)[]
  db?: string
  table?: string
  opTypes?: string[]
  sourceType?: string
  fieldFilter?: Condition
  actionType?: string
  scheduleDelayMs?: number
  scheduleCorrelationKeyPath?: string
  name: string
  description?: string
  status?: string
  cronExpression?: string
  concurrent?: string
}

export interface CreateSubscriptionRequest {
  subscription: SubscriptionFields
}

export interface UpdateSubscriptionRequest {
  subscription: SubscriptionFields
}

// ── Inject ──

export interface InjectRequest {
  eventJson: string
}

export interface InjectResultDto {
  outcome: string
}

// ── Validate ──

export interface ValidatePipelineRequest {
  pipelineJson: string
}

export interface ValidationResultDto {
  ok: boolean
  errors: string[]
}

export interface DryRunRequest {
  pipelineJson: string
  eventJson: string
}

export interface DryRunResultDto {
  outcome: string
  alerts: Record<string, unknown>[]
}

// ── Version ──

export interface VersionDto {
  namespace: string
  pipelineId: number
  version: number
  definitionHash: string
  definitionJson?: string
  status: string
  publishedBy?: string
  createdAt: string
  publishedAt?: string
}

export interface SaveVersionRequest {
  pipelineJson: string
  publishedBy?: string
}

export interface PublishRequest {
  publishedBy?: string
}

// ── Page response ──

export interface PageResponse<T> {
  data: T[]
  page: Page
}

// ── Alert ──

export interface AlertDto {
  id: number
  namespace: string
  pipelineId: number
  pipelineVersion: number
  executionId: number
  fingerprint: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  labels: Record<string, string>
  annotations: Record<string, string>
  startsAt: string
  lastSeenAt?: string
  endsAt?: string
  resolvedAt?: string
  status: string
  disposition?: string
  dedupCount: number
  ackNote?: string
  ackBy?: string
  ackAt?: string
  traceId?: string
  labelTeam?: string
  labelApp?: string
  labelLine?: string
}

export interface DispositionRequest {
  note?: string
  by: string
}

// ── Evidence ──

export interface EvidenceDto {
  id: number
  alertId: number
  namespace: string
  pipelineId: number
  pipelineVersion: number
  executionId: number
  nodeName: string
  triggerEvent: string
  traceId?: string
  spanId?: string
  capturedAt: string
  truncated: boolean
  emitSeq: number
}

// ── Execution ──

export interface ExecutionDto {
  id: number
  namespace: string
  pipelineId: number
  pipelineVersion: number
  triggerType: string
  triggerEvent?: string
  subscriptionId?: number
  status: string
  startedAt: string
  endedAt?: string
  durationMs: number
  traceId?: string
  createdAt: string
  executionId?: number
  nodeName?: string
  errorType?: string
  errorMessage?: string
  stackTrace?: string
}

// ── Dashboard Stats ──

export interface DashboardStatsDto {
  namespace: string
  from?: string
  to?: string
  alertsBySeverity: Record<string, number>
  alertsByStatus: Record<string, number>
  alertsTotal: number
  executionsByStatus: Record<string, number>
  executionsTotal: number
  executionsFailed: number
  executionsSuccessRate: number
  eventsToday: number
  alertsToday: number
  teamDist: DimensionCountDto[]
  topPipelines: PipelineCountDto[]
  topFingerprints: DimensionCountDto[]
}

export interface DimensionCountDto {
  dimension: string
  count: number
}

export interface PipelineCountDto {
  pipelineId: number | string
  pipelineName: string
  count: number
}

export interface TimeseriesPointDto {
  bucketStart: string
  count: number
}
