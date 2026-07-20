import { useQuery } from '@tanstack/react-query'
import { dashboardApi, type DashboardParams, type TimeseriesParams, type ExecutionTimeseriesParams } from '../api/dashboard'

export function useDashboard(params: DashboardParams) {
  return useQuery({
    queryKey: ['dashboard', params],
    queryFn: () => dashboardApi.get(params),
    enabled: !!params.namespace,
  })
}

export function useAlertTimeseries(params: TimeseriesParams) {
  return useQuery({
    queryKey: ['dashboard', 'alertTimeseries', params],
    queryFn: () => dashboardApi.alertTimeseries(params),
    enabled: !!params.namespace && !!params.from && !!params.to,
  })
}

export function useExecutionTimeseries(params: ExecutionTimeseriesParams) {
  return useQuery({
    queryKey: ['dashboard', 'executionTimeseries', params],
    queryFn: () => dashboardApi.executionTimeseries(params),
    enabled: !!params.namespace && !!params.from && !!params.to,
  })
}
