import { client } from './client'
import type {
  ValidatePipelineRequest,
  ValidationResultDto,
  DryRunRequest,
  DryRunResultDto,
} from './types'

export const validateApi = {
  validatePipeline(req: ValidatePipelineRequest) {
    return client
      .post<ValidationResultDto>('/api/v1/validate/pipeline', req)
      .then((r) => r.data)
  },

  dryRun(req: DryRunRequest) {
    return client
      .post<DryRunResultDto>('/api/v1/validate/dry-run', req)
      .then((r) => r.data)
  },
}
