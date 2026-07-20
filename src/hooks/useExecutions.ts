import { useQuery } from '@tanstack/react-query'
import { executionApi, type ExecutionListParams } from '../api/execution'

export function useExecutions(params: ExecutionListParams) {
  return useQuery({
    queryKey: ['executions', params],
    queryFn: () => executionApi.list(params),
    enabled: !!params.namespace,
  })
}

export function useExecution(namespace: string, id: number | string) {
  return useQuery({
    queryKey: ['executions', namespace, id],
    queryFn: () => executionApi.get(namespace, id),
    enabled: !!namespace && !!id,
  })
}
