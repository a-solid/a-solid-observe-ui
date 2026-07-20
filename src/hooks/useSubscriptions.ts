import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionApi } from '../api/subscription'
import type { CreateSubscriptionRequest, UpdateSubscriptionRequest } from '../api/types'

export function useSubscriptions(namespace: string) {
  return useQuery({
    queryKey: ['subscriptions', namespace],
    queryFn: () => subscriptionApi.list(namespace),
    enabled: !!namespace,
  })
}

export function useSubscription(namespace: string, name: string) {
  return useQuery({
    queryKey: ['subscriptions', namespace, name],
    queryFn: () => subscriptionApi.get(namespace, name),
    enabled: !!namespace && !!name,
  })
}

export function useCreateSubscription(namespace: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateSubscriptionRequest) => subscriptionApi.create(namespace, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions', namespace] })
    },
  })
}

export function useUpdateSubscription(namespace: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, ...req }: UpdateSubscriptionRequest & { name: string }) =>
      subscriptionApi.update(namespace, name, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions', namespace] })
    },
  })
}

export function useDeleteSubscription(namespace: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => subscriptionApi.delete(namespace, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions', namespace] })
    },
  })
}

export function useActivateSubscription(namespace: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => subscriptionApi.activate(namespace, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions', namespace] })
    },
  })
}

export function useDeactivateSubscription(namespace: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => subscriptionApi.deactivate(namespace, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions', namespace] })
    },
  })
}
