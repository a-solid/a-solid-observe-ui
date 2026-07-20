# API Integration: Alerts & Execution History

**Date:** 2026-07-20
**Status:** Approved
**Scope:** Replace mock data with real API calls for Alerts, Alert Detail, Execution History, and Failed Executions pages.

## Overview

Following the same pattern established for pipeline/subscription/inject integration: API service layer → React Query hooks → page updates. Server-side pagination for list endpoints. Alert detail page partially dynamic (metadata, labels, annotations, evidence, ack/ignore from API; trace SVG and timeline remain mock).

## API Endpoints

### Alerts
- `GET /api/v1/alerts` — paginated list (`PageResponseAlertDto`)
  - Params: arg0 (namespace), status, severity, team, pipeline_id, from, to, page, size
- `GET /api/v1/alerts/{id}` — single alert
- `GET /api/v1/alerts/{id}/evidence` — evidence list
- `POST /api/v1/alerts/{id}/ack` — acknowledge (body: `DispositionRequest`)
- `POST /api/v1/alerts/{id}/ignore` — ignore (body: `DispositionRequest`)

### Executions
- `GET /api/v1/executions` — paginated list (`PageResponseExecutionDto`)
  - Params: arg0 (namespace), pipeline_id, status, error_type, from, to, page, size
- `GET /api/v1/executions/{id}` — single execution

## New Files

- `src/api/alert.ts` — alert CRUD + evidence + ack/ignore
- `src/api/execution.ts` — execution list + get
- `src/hooks/useAlerts.ts` — React Query hooks for alerts
- `src/hooks/useExecutions.ts` — React Query hooks for executions
- `src/api/types.ts` — additions: AlertDto, EvidenceDto, ExecutionDto, DispositionRequest, Page, page response types

## Field Mapping

| UI Field | API Source | Fallback |
|---|---|---|
| entity | `labels.app` | `"--"` |
| pipeline name | `pipelineId` | show as `"#{pipelineId}"` |
| teamLabel | `labelTeam` | `"--"` |
| description | `annotations.summary` or `annotations.description` | `"No description"` |
| severity | `severity` | n/a |
| status | `status` | n/a |
| fingerprint | `fingerprint` | n/a |
| dedupCount | `dedupCount` | n/a |
| disposition | `disposition` | n/a |
| ackBy/ackNote/ackAt | `ackBy`/`ackNote`/`ackAt` | n/a |
| startsAt/endsAt | `startsAt`/`endsAt` | n/a |

## Page Changes

### Alerts List
- Replace mock with `useAlerts` hook (server-side pagination)
- Severity overview cards: counts from `alertStats` or derived from page totals
- Filters: severity/status/team → API query params; search → client-side
- Remove live incoming simulation
- Pagination controls at bottom

### Alert Detail
- Metadata section: fully dynamic from `AlertDto`
- Labels/Annotations: dynamic from `AlertDto.labels` / `AlertDto.annotations`
- Evidence: from `useEvidence` hook, JSON/Table view
- Ack/Ignore buttons: wired to API
- Trace SVG + Status Timeline: keep mock (backend doesn't provide lineage data yet)

### Executions List
- Replace mock with `useExecutions` hook (server-side pagination)
- Stat cards: from `executionStats` API or simplified
- Filters: pipeline dropdown / result / time range → API query params
- Remove live simulation
- Pagination

### Failed Executions
- Use `useExecutions(namespace, { status: 'FAILED' })` 
- Left panel: group by `errorType`
- Right diagnostic panel: render `errorMessage`/`stackTrace`/`nodeName`/`triggerEvent` from `ExecutionDto`
- Oscilloscope: keep mock logic

## Out of Scope
- Alert stats (severity counts from `/api/v1/stats/alerts`) — optional, may add
- Dashboard stats integration
- Alert silence management
