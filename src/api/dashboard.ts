import { client } from './client'
import type { DashboardStatsDto, TimeseriesPointDto, ExecutionTimeseriesPointDto } from './types'

export interface DashboardParams {
  namespace: string
  from?: string
  to?: string
  limit?: number
}

export interface TimeseriesParams {
  namespace: string
  from: string
  to: string
  bucket?: string
  severity?: string
  status?: string
}

export interface ExecutionTimeseriesParams {
  namespace: string
  from: string
  to: string
  bucket?: string
  pipeline_id?: number
  trigger_type?: string
}

function buildQs(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, String(v))
  })
  return qs.toString()
}

export const dashboardApi = {
  get(params: DashboardParams) {
    return client
      .get<DashboardStatsDto>(`/api/v1/stats/dashboard?${buildQs(params)}`)
      .then((r) => r.data)
  },

  alertTimeseries(params: TimeseriesParams) {
    return client
      .get<TimeseriesPointDto[]>(`/api/v1/stats/alerts/timeseries?${buildQs(params)}`)
      .then((r) => r.data)
  },

  executionTimeseries(params: ExecutionTimeseriesParams) {
    return client
      .get<ExecutionTimeseriesPointDto[]>(`/api/v1/stats/executions/timeseries?${buildQs(params)}`)
      .then((r) => r.data)
  },
}
