import { client } from './client'
import type { InjectRequest, InjectResultDto } from './types'

export const injectApi = {
  inject(namespace: string, pipelineName: string, req: InjectRequest) {
    return client
      .post<InjectResultDto>(`/api/v1/namespaces/${namespace}/pipelines/${pipelineName}/inject`, req)
      .then((r) => r.data)
  },
}
