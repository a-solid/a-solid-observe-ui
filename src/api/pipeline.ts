import { client } from './client'
import type { PipelineDto, CreatePipelineRequest } from './types'

export const pipelineApi = {
  list(namespace: string) {
    return client
      .get<PipelineDto[]>(`/api/v1/namespaces/${namespace}/pipelines`)
      .then((r) => r.data)
  },

  get(namespace: string, name: string) {
    return client
      .get<PipelineDto>(`/api/v1/namespaces/${namespace}/pipelines/${name}`)
      .then((r) => r.data)
  },

  create(namespace: string, req: CreatePipelineRequest) {
    return client
      .post<PipelineDto>(`/api/v1/namespaces/${namespace}/pipelines`, req)
      .then((r) => r.data)
  },

  update(namespace: string, name: string, req: CreatePipelineRequest) {
    return client
      .put<PipelineDto>(`/api/v1/namespaces/${namespace}/pipelines/${name}`, req)
      .then((r) => r.data)
  },

  archive(namespace: string, name: string) {
    return client
      .post<void>(`/api/v1/namespaces/${namespace}/pipelines/${name}/archive`)
  },
}
