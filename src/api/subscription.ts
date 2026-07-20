import { client } from './client'
import type {
  SubscriptionDto,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from './types'

export const subscriptionApi = {
  list(namespace: string) {
    return client
      .get<SubscriptionDto[]>(`/api/v1/namespaces/${namespace}/subscriptions`)
      .then((r) => r.data)
  },

  get(namespace: string, name: string) {
    return client
      .get<SubscriptionDto>(`/api/v1/namespaces/${namespace}/subscriptions/${name}`)
      .then((r) => r.data)
  },

  create(namespace: string, req: CreateSubscriptionRequest) {
    return client
      .post<SubscriptionDto>(`/api/v1/namespaces/${namespace}/subscriptions`, req)
      .then((r) => r.data)
  },

  update(namespace: string, name: string, req: UpdateSubscriptionRequest) {
    return client
      .put<SubscriptionDto>(`/api/v1/namespaces/${namespace}/subscriptions/${name}`, req)
      .then((r) => r.data)
  },

  delete(namespace: string, name: string) {
    return client.delete<void>(`/api/v1/namespaces/${namespace}/subscriptions/${name}`)
  },

  activate(namespace: string, name: string) {
    return client
      .post<SubscriptionDto>(`/api/v1/namespaces/${namespace}/subscriptions/${name}/activate`)
      .then((r) => r.data)
  },

  deactivate(namespace: string, name: string) {
    return client
      .post<SubscriptionDto>(`/api/v1/namespaces/${namespace}/subscriptions/${name}/deactivate`)
      .then((r) => r.data)
  },
}
