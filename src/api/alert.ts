import { client } from './client'
import type { AlertDto, EvidenceDto, DispositionRequest, PageResponse } from './types'

export interface AlertListParams {
  namespace: string
  status?: string
  severity?: string
  team?: string
  pipeline_id?: number
  from?: string
  to?: string
  page?: number
  size?: number
}

export const alertApi = {
  list(params: AlertListParams) {
    const qs = new URLSearchParams()
    qs.set('arg0', params.namespace)
    if (params.status) qs.set('status', params.status)
    if (params.severity) qs.set('severity', params.severity)
    if (params.team) qs.set('team', params.team)
    if (params.pipeline_id != null) qs.set('pipeline_id', String(params.pipeline_id))
    if (params.from) qs.set('from', params.from)
    if (params.to) qs.set('to', params.to)
    if (params.page != null) qs.set('page', String(params.page))
    if (params.size != null) qs.set('size', String(params.size))
    return client
      .get<PageResponse<AlertDto>>(`/api/v1/alerts?${qs.toString()}`)
      .then((r) => r.data)
  },

  get(namespace: string, id: number | string) {
    return client
      .get<AlertDto>(`/api/v1/alerts/${id}?arg1=${namespace}`)
      .then((r) => r.data)
  },

  getEvidence(namespace: string, alertId: number | string) {
    return client
      .get<EvidenceDto[]>(`/api/v1/alerts/${alertId}/evidence?arg1=${namespace}`)
      .then((r) => r.data)
  },

  ack(namespace: string, id: number | string, req: DispositionRequest) {
    return client
      .post<AlertDto>(`/api/v1/alerts/${id}/ack?arg1=${namespace}`, req)
      .then((r) => r.data)
  },

  ignore(namespace: string, id: number | string, req: DispositionRequest) {
    return client
      .post<AlertDto>(`/api/v1/alerts/${id}/ignore?arg1=${namespace}`, req)
      .then((r) => r.data)
  },
}
