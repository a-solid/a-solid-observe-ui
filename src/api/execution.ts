import { client } from './client'
import type { ExecutionDto, PageResponse } from './types'

export interface ExecutionListParams {
  namespace: string
  pipeline_id?: number
  status?: string
  error_type?: string
  from?: string
  to?: string
  page?: number
  size?: number
}

export const executionApi = {
  list(params: ExecutionListParams) {
    const qs = new URLSearchParams()
    qs.set('arg0', params.namespace)
    if (params.pipeline_id != null) qs.set('pipeline_id', String(params.pipeline_id))
    if (params.status) qs.set('status', params.status)
    if (params.error_type) qs.set('error_type', params.error_type)
    if (params.from) qs.set('from', params.from)
    if (params.to) qs.set('to', params.to)
    if (params.page != null) qs.set('page', String(params.page))
    if (params.size != null) qs.set('size', String(params.size))
    return client
      .get<PageResponse<ExecutionDto>>(`/api/v1/executions?${qs.toString()}`)
      .then((r) => r.data)
  },

  get(namespace: string, id: number | string) {
    return client
      .get<ExecutionDto>(`/api/v1/executions/${id}?arg1=${namespace}`)
      .then((r) => r.data)
  },
}
