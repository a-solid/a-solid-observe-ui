# API Integration: Pipeline, Subscription, Inject

**Date:** 2026-07-20
**Status:** Approved
**Scope:** Replace mock data with real API calls for Pipeline, Subscription, and Inject features.

## Overview

Current UI pages use hardcoded mock data. The backend provides a REST API (OpenAPI 3.1, `api.json`). This spec covers integrating the pipeline, subscription, and inject endpoints while keeping the existing UI structure intact. Backend will later supplement missing display fields (sparkline data, execution counts, etc.); the frontend gracefully degrades where those fields are absent.

## Architecture

```
src/
  api/
    client.ts            # Axios instance, interceptors, ApiResponse unwrapping
    types.ts             # DTO type definitions (hand-written from api.json)
    namespace.ts         # Namespace CRUD
    pipeline.ts          # Pipeline CRUD + archive
    subscription.ts      # Subscription CRUD + activate/deactivate
    inject.ts            # Inject endpoint
    validate.ts          # Validate pipeline + dry-run
    version.ts           # Version list, save, publish, archive
  hooks/
    usePipelines.ts      # React Query hooks for pipelines
    useSubscriptions.ts  # React Query hooks for subscriptions
    useNamespace.ts      # Alias to context hook
    ...
  context/
    NamespaceContext.tsx  # Current namespace state + provider
```

## Components

### 1. API Client (`src/api/client.ts`)

- Axios instance with `baseURL`: dev uses `/` (Vite proxy), prod uses `VITE_API_BASE` env var
- Response interceptor unwraps `ApiResponse<T>` → `T` and `PageResponse<T>` → `{ data: T[], page: Page }`
- Error interceptor: toast via sonner, throw standardized error for React Query
- Headers: `Content-Type: application/json`

### 2. Types (`src/api/types.ts`)

Hand-written TypeScript interfaces matching the DTOs in `api.json`:

- `NamespaceDto` — id, name, displayName
- `PipelineDto` — id, namespace, labels, name, description, status, currentVersion, createdBy, createdAt, updatedAt
- `CreatePipelineRequest` — labels?, name*, description?, createdBy?
- `SubscriptionDto` / `SubscriptionFields` — pipelineIds*, sourceType, db, table, opTypes, fieldFilter, actionType, scheduleDelayMs, scheduleCorrelationKeyPath, cronExpression, concurrent, name, description, status
- `CreateSubscriptionRequest` / `UpdateSubscriptionRequest` — subscription*
- `InjectRequest` — eventJson*
- `InjectResultDto` — outcome
- `VersionDto` — namespace, pipelineId, version, definitionHash, status, publishedBy, createdAt, publishedAt
- `SaveVersionRequest` — pipelineJson*, publishedBy?
- `PublishRequest` — publishedBy?
- `ValidatePipelineRequest` — pipelineJson*
- `ValidationResultDto` — ok, errors[]
- `DryRunRequest` — pipelineJson*, eventJson*
- `DryRunResultDto` — outcome, alerts[]
- `Page` — page, size, total

### 3. API Services (per module)

Each module exports an object with async functions returning typed promises:

- **namespace.ts**: list, get, create, update, delete
- **pipeline.ts**: list, get, create, update, archive
- **subscription.ts**: list, get, create, update, delete, deactivate, activate
- **inject.ts**: inject
- **validate.ts**: validatePipeline, dryRun
- **version.ts**: list, saveVersion, publish, archiveVersion

### 4. React Query Hooks

- Each GET endpoint gets a `useQuery` hook (e.g., `usePipelines(namespace)`)
- Each mutation gets a `useMutation` hook with cache invalidation (e.g., `useCreatePipeline(namespace)`)
- Query keys follow `[resource, namespace, ...params]` pattern

### 5. Namespace Context (`src/context/NamespaceContext.tsx`)

- Fetches namespace list on mount via `GET /api/v1/namespaces`
- Stores selected namespace in state + `localStorage`
- Defaults to first namespace if none saved
- `useNamespace()` hook returns `{ namespace, setNamespace, namespaces }`
- Topbar renders a compact `<select>` dropdown for switching

### 6. Page Changes

#### Pipelines List (`src/pages/pipelines/index.tsx`)
- Replace `import { pipelines } from './mock'` with `usePipelines(namespace)`
- Fields missing from API (spark, execCount, groovyLines): hide/show placeholder until backend adds them
- Filtering: client-side on the returned array
- Archive button: call `pipelineApi.archive(namespace, name)`, invalidate list
- "New Rule" button: call `pipelineApi.create()`, navigate to editor

#### Pipeline Editor (`src/pages/pipeline-editor/index.tsx`)
- Validate: `POST /api/v1/validate/pipeline` → show `{ ok, errors[] }`
- Dry Run: `POST /api/v1/validate/dry-run` → show `{ outcome, alerts[] }`
- Save Version: `POST .../versions` with `{ pipelineJson, publishedBy }`
- Publish: `POST .../versions/{v}/publish` with `{ publishedBy }`
- Load pipeline meta on mount: `GET .../pipelines/{name}`

#### Versions (`src/pages/versions/index.tsx`)
- Version list: `GET .../versions`
- Publish: `POST .../versions/{v}/publish`
- Archive: `POST .../versions/{v}/archive`
- Rollback: create new version from old definition, then publish

#### Subscriptions List (`src/pages/subscriptions/index.tsx`)
- Replace mock with `useSubscriptions(namespace)`
- Group by `sourceType` (preserves current UI)
- "New Subscription" → create + navigate to editor

#### Subscription Editor (`src/pages/subscription-editor/index.tsx`)
- Form fields align with `SubscriptionFields` DTO
- `pipelineIds: number[]` replaces current `bindings` objects
- Save: `POST create` or `PUT update`

#### Inject (in Pipeline Editor right pane)
- "Run Inject": `POST .../inject` with `{ eventJson }`
- Response: `{ outcome }` — display result badge
- Navigation links (executionId, alertFingerprint) removed until backend provides them

## Data Flow

1. User selects namespace in Topbar → Context updates → all queries refetch with new namespace key
2. List pages: `useQuery` fetches on mount + when namespace changes
3. Editor pages: `useQuery` fetches single resource on mount
4. Mutations: `useMutation` → onSuccess invalidates relevant query keys
5. Errors: axios interceptor toasts, React Query exposes `isError`/`error` for inline error states

## Error Handling

- Network errors: axios interceptor → sonner toast + re-throw
- API errors (non-2xx): toast with message from response body if available
- React Query: retry 1 time for GET, no retry for mutations
- UI: loading skeletons during fetch, error state with retry button on failure

## Testing Strategy

- API service functions are pure — test with mocked axios
- React Query hooks: test with `@tanstack/react-query` testing utils + msw or mock service worker
- Components: integration tests with mocked API responses

## Graceful Degradation

Fields not yet in API response but used in current UI:
| Field | Fallback |
|-------|----------|
| spark (sparkline data) | Hide sparkline section |
| execCount | Hide run count |
| groovyLines | Hide Groovy line count tag |
| team / application | Derive from `labels.team` / `labels.app` |
| foot (throughput, next run) | Hide until backend provides |

## Out of Scope

- Alert pages (alerts, alert-detail) — separate integration
- Execution pages (executions, failed) — separate integration
- Dashboard / Stats pages — separate integration
- Event submission endpoint — not needed for current UI
- Backend API changes — only frontend integration
