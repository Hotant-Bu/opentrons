import { useQueryClient } from 'react-query'

import { useHost, useCreateRunMutation } from '@opentrons/react-api-client'

import { useNotifyRunQuery } from '../../../resources/runs'

import type { Run } from '@opentrons/api-client'

interface UseCloneRunResult {
  cloneRun: () => void
  isLoading: boolean
}

export function useCloneRun(
  runId: string | null,
  onSuccessCallback?: (createRunResponse: Run) => unknown
): UseCloneRunResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const { data: runRecord } = useNotifyRunQuery(runId)
  const { createRun, isLoading } = useCreateRunMutation({
    onSuccess: response => {
      queryClient
        .invalidateQueries([host, 'runs'])
        .catch((e: Error) =>
          console.error(`error invalidating runs query: ${e.message}`)
        )
      if (onSuccessCallback != null) onSuccessCallback(response)
    },
  })
  const cloneRun = (): void => {
    if (runRecord != null) {
      const {
        protocolId,
        labwareOffsets,
        runTimeParameterValues,
      } = runRecord.data
      createRun({ protocolId, labwareOffsets, runTimeParameterValues })
    } else {
      console.info('failed to clone run record, source run record not found')
    }
  }

  return { cloneRun, isLoading }
}
