import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertApi, type AlertListParams } from '../api/alert'
import type { DispositionRequest } from '../api/types'

export function useAlerts(params: AlertListParams) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertApi.list(params),
    enabled: !!params.namespace,
  })
}

export function useAlert(namespace: string, id: number | string) {
  return useQuery({
    queryKey: ['alerts', namespace, id],
    queryFn: () => alertApi.get(namespace, id),
    enabled: !!namespace && !!id,
  })
}

export function useEvidence(namespace: string, alertId: number | string) {
  return useQuery({
    queryKey: ['alerts', namespace, alertId, 'evidence'],
    queryFn: () => alertApi.getEvidence(namespace, alertId),
    enabled: !!namespace && !!alertId,
  })
}

export function useAckAlert(namespace: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...req }: DispositionRequest & { id: number | string }) =>
      alertApi.ack(namespace, id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts', namespace] })
    },
  })
}

export function useIgnoreAlert(namespace: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...req }: DispositionRequest & { id: number | string }) =>
      alertApi.ignore(namespace, id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts', namespace] })
    },
  })
}
