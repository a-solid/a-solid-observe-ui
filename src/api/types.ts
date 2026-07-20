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
  id: number
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
  pipelineIds: number[]
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
  pipelineIds: number[]
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
