import { client } from './client'
import type { NamespaceDto, CreateNamespaceRequest, UpdateNamespaceRequest } from './types'

export const namespaceApi = {
  list() {
    return client.get<NamespaceDto[]>('/api/v1/namespaces').then((r) => r.data)
  },

  get(name: string) {
    return client.get<NamespaceDto>(`/api/v1/namespaces/${name}`).then((r) => r.data)
  },

  create(req: CreateNamespaceRequest) {
    return client.post<NamespaceDto>('/api/v1/namespaces', req).then((r) => r.data)
  },

  update(name: string, req: UpdateNamespaceRequest) {
    return client.put<NamespaceDto>(`/api/v1/namespaces/${name}`, req).then((r) => r.data)
  },

  delete(name: string) {
    return client.delete<void>(`/api/v1/namespaces/${name}`)
  },
}
