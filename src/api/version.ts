import { client } from './client'
import type { VersionDto, SaveVersionRequest, PublishRequest } from './types'

export const versionApi = {
  list(namespace: string, pipelineName: string) {
    return client
      .get<VersionDto[]>(`/api/v1/namespaces/${namespace}/pipelines/${pipelineName}/versions`)
      .then((r) => r.data)
  },

  saveVersion(namespace: string, pipelineName: string, req: SaveVersionRequest) {
    return client
      .post<VersionDto>(`/api/v1/namespaces/${namespace}/pipelines/${pipelineName}/versions`, req)
      .then((r) => r.data)
  },

  publish(namespace: string, pipelineName: string, version: number, req?: PublishRequest) {
    return client
      .post<VersionDto>(`/api/v1/namespaces/${namespace}/pipelines/${pipelineName}/versions/${version}/publish`, req ?? {})
      .then((r) => r.data)
  },

  archiveVersion(namespace: string, pipelineName: string, version: number) {
    return client
      .post<VersionDto>(`/api/v1/namespaces/${namespace}/pipelines/${pipelineName}/versions/${version}/archive`)
      .then((r) => r.data)
  },
}
