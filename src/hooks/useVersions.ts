import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { versionApi } from '../api/version'
import type { SaveVersionRequest, PublishRequest } from '../api/types'

export function useVersions(namespace: string, pipelineName: string) {
  return useQuery({
    queryKey: ['versions', namespace, pipelineName],
    queryFn: () => versionApi.list(namespace, pipelineName),
    enabled: !!namespace && !!pipelineName,
  })
}

export function useSaveVersion(namespace: string, pipelineName: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: SaveVersionRequest) => versionApi.saveVersion(namespace, pipelineName, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['versions', namespace, pipelineName] })
    },
  })
}

export function usePublishVersion(namespace: string, pipelineName: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ version, ...req }: PublishRequest & { version: number }) =>
      versionApi.publish(namespace, pipelineName, version, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['versions', namespace, pipelineName] })
      qc.invalidateQueries({ queryKey: ['pipelines', namespace] })
    },
  })
}

export function useArchiveVersion(namespace: string, pipelineName: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (version: number) => versionApi.archiveVersion(namespace, pipelineName, version),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['versions', namespace, pipelineName] })
    },
  })
}
