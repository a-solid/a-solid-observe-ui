import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pipelineApi } from '../api/pipeline'
import type { CreatePipelineRequest } from '../api/types'

export function usePipelines(namespace: string) {
  return useQuery({
    queryKey: ['pipelines', namespace],
    queryFn: () => pipelineApi.list(namespace),
    enabled: !!namespace,
  })
}

export function usePipeline(namespace: string, name: string) {
  return useQuery({
    queryKey: ['pipelines', namespace, name],
    queryFn: () => pipelineApi.get(namespace, name),
    enabled: !!namespace && !!name,
  })
}

export function useCreatePipeline(namespace: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreatePipelineRequest) => pipelineApi.create(namespace, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines', namespace] })
    },
  })
}

export function useUpdatePipeline(namespace: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, ...req }: CreatePipelineRequest & { name: string }) =>
      pipelineApi.update(namespace, name, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines', namespace] })
    },
  })
}

export function useArchivePipeline(namespace: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => pipelineApi.archive(namespace, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines', namespace] })
    },
  })
}
