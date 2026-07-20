import { client } from './client'
import type { DashboardStatsDto } from './types'

export interface DashboardParams {
  namespace: string
  from?: string
  to?: string
  limit?: number
}

export const dashboardApi = {
  get(params: DashboardParams) {
    const qs = new URLSearchParams()
    qs.set('namespace', params.namespace)
    if (params.from) qs.set('from', params.from)
    if (params.to) qs.set('to', params.to)
    if (params.limit != null) qs.set('limit', String(params.limit))
    return client
      .get<DashboardStatsDto>(`/api/v1/stats/dashboard?${qs.toString()}`)
      .then((r) => r.data)
  },
}
