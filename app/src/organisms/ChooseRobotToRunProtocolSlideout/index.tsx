import * as React from 'react'
import first from 'lodash/first'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import {
  Icon,
  Flex,
  DIRECTION_COLUMN,
  PrimaryButton,
  DIRECTION_ROW,
  SecondaryButton,
  SPACING,
} from '@opentrons/components'

import { getRobotUpdateDisplayInfo } from '../../redux/robot-update'
import { OPENTRONS_USB } from '../../redux/discovery'
import { appShellRequestor } from '../../redux/shell/remote'
import { useTrackCreateProtocolRunEvent } from '../Devices/hooks'
import { ApplyHistoricOffsets } from '../ApplyHistoricOffsets'
import { useOffsetCandidatesForAnalysis } from '../ApplyHistoricOffsets/hooks/useOffsetCandidatesForAnalysis'
import { ChooseRobotSlideout } from '../ChooseRobotSlideout'
import { useCreateRunFromProtocol } from './useCreateRunFromProtocol'
import type { StyleProps } from '@opentrons/components'
import type { State } from '../../redux/types'
import type { Robot } from '../../redux/discovery/types'
import type { StoredProtocolData } from '../../redux/protocol-storage'
import type { RunTimeParameter } from '@opentrons/shared-data'

const _getFileBaseName = (filePath: string): string => {
  return filePath.split('/').reverse()[0]
}
interface ChooseRobotToRunProtocolSlideoutProps extends StyleProps {
  storedProtocolData: StoredProtocolData
  onCloseClick: () => void
  showSlideout: boolean
}

export function ChooseRobotToRunProtocolSlideoutComponent(
  props: ChooseRobotToRunProtocolSlideoutProps
): JSX.Element | null {
  const { t } = useTranslation(['protocol_details', 'shared', 'app_settings'])
  const { storedProtocolData, showSlideout, onCloseClick } = props
  const history = useHistory()
  const [shouldApplyOffsets, setShouldApplyOffsets] = React.useState<boolean>(
    true
  )
  const {
    protocolKey,
    srcFileNames,
    srcFiles,
    mostRecentAnalysis,
  } = storedProtocolData
  const [currentPage, setCurrentPage] = React.useState<number>(1)
  const [selectedRobot, setSelectedRobot] = React.useState<Robot | null>(null)
  const { trackCreateProtocolRunEvent } = useTrackCreateProtocolRunEvent(
    storedProtocolData,
    selectedRobot?.name ?? ''
  )
  const runTimeParameters =
    storedProtocolData.mostRecentAnalysis?.runTimeParameters ?? []
  const [
    runTimeParametersOverrides,
    setRunTimeParametersOverrides,
  ] = React.useState<RunTimeParameter[]>(runTimeParameters)
  const [hasParamError, setHasParamError] = React.useState<boolean>(false)

  const offsetCandidates = useOffsetCandidatesForAnalysis(
    mostRecentAnalysis,
    selectedRobot?.ip ?? null
  )
  const {
    createRunFromProtocolSource,
    runCreationError,
    reset: resetCreateRun,
    isCreatingRun,
    runCreationErrorCode,
  } = useCreateRunFromProtocol(
    {
      onSuccess: ({ data: runData }) => {
        if (selectedRobot != null) {
          trackCreateProtocolRunEvent({
            name: 'createProtocolRecordResponse',
            properties: { success: true },
          })
          history.push(
            `/devices/${selectedRobot.name}/protocol-runs/${runData.id}`
          )
        }
      },
      onError: (error: Error) => {
        trackCreateProtocolRunEvent({
          name: 'createProtocolRecordResponse',
          properties: { success: false, error: error.message },
        })
      },
    },
    selectedRobot != null
      ? {
          hostname: selectedRobot.ip,
          requestor:
            selectedRobot?.ip === OPENTRONS_USB ? appShellRequestor : undefined,
        }
      : null,
    shouldApplyOffsets
      ? offsetCandidates.map(({ vector, location, definitionUri }) => ({
          vector,
          location,
          definitionUri,
        }))
      : [],
    runTimeParametersOverrides.reduce(
      (acc, param) =>
        param.value !== param.default
          ? { ...acc, [param.variableName]: param.value }
          : acc,
      {}
    )
  )
  const handleProceed: React.MouseEventHandler<HTMLButtonElement> = () => {
    trackCreateProtocolRunEvent({ name: 'createProtocolRecordRequest' })
    createRunFromProtocolSource({ files: srcFileObjects, protocolKey })
  }

  const { autoUpdateAction } = useSelector((state: State) =>
    getRobotUpdateDisplayInfo(state, selectedRobot?.name ?? '')
  )

  const isSelectedRobotOnDifferentSoftwareVersion = [
    'upgrade',
    'downgrade',
  ].includes(autoUpdateAction)

  if (
    protocolKey == null ||
    srcFileNames == null ||
    srcFiles == null ||
    mostRecentAnalysis == null
  ) {
    // TODO: do more robust corrupt file catching and handling here
    return null
  }
  const srcFileObjects = srcFiles.map((srcFileBuffer, index) => {
    const srcFilePath = srcFileNames[index]
    return new File([srcFileBuffer], _getFileBaseName(srcFilePath))
  })
  const protocolDisplayName =
    mostRecentAnalysis?.metadata?.protocolName ??
    first(srcFileNames) ??
    protocolKey

  // intentionally show both robot types if analysis has any error
  const robotType =
    mostRecentAnalysis != null && mostRecentAnalysis.errors.length === 0
      ? mostRecentAnalysis?.robotType ?? null
      : null

  const SinglePageButtonWithoutFF = (
    <PrimaryButton
      disabled={
        isCreatingRun ||
        selectedRobot == null ||
        isSelectedRobotOnDifferentSoftwareVersion
      }
      width="100%"
      onClick={handleProceed}
    >
      {isCreatingRun ? (
        <Icon name="ot-spinner" spin size="1rem" />
      ) : (
        t('shared:proceed_to_setup')
      )}
    </PrimaryButton>
  )

  const hasRunTimeParameters = runTimeParameters.length > 0

  return (
    <ChooseRobotSlideout
      multiSlideout={hasRunTimeParameters ? { currentPage } : null}
      isExpanded={showSlideout}
      isSelectedRobotOnDifferentSoftwareVersion={
        isSelectedRobotOnDifferentSoftwareVersion
      }
      onCloseClick={onCloseClick}
      title={
        hasRunTimeParameters && currentPage === 2
          ? t('select_parameters_for_robot', {
              robot_name: selectedRobot?.name,
            })
          : t('choose_robot_to_run', {
              protocol_name: protocolDisplayName,
            })
      }
      runTimeParametersOverrides={runTimeParametersOverrides}
      setRunTimeParametersOverrides={setRunTimeParametersOverrides}
      footer={
        <Flex flexDirection={DIRECTION_COLUMN}>
          {hasRunTimeParameters ? (
            currentPage === 1 ? (
              <>
                <ApplyHistoricOffsets
                  offsetCandidates={offsetCandidates}
                  shouldApplyOffsets={shouldApplyOffsets}
                  setShouldApplyOffsets={setShouldApplyOffsets}
                  commands={mostRecentAnalysis?.commands ?? []}
                  labware={mostRecentAnalysis?.labware ?? []}
                  modules={mostRecentAnalysis?.modules ?? []}
                />
                <PrimaryButton
                  onClick={() => setCurrentPage(2)}
                  width="100%"
                  disabled={
                    isCreatingRun ||
                    selectedRobot == null ||
                    isSelectedRobotOnDifferentSoftwareVersion
                  }
                >
                  {t('shared:continue_to_param')}
                </PrimaryButton>
              </>
            ) : (
              <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_ROW}>
                <SecondaryButton onClick={() => setCurrentPage(1)} width="50%">
                  {t('shared:change_robot')}
                </SecondaryButton>
                <PrimaryButton
                  width="50%"
                  onClick={handleProceed}
                  disabled={hasParamError}
                >
                  {isCreatingRun ? (
                    <Icon name="ot-spinner" spin size="1rem" />
                  ) : (
                    t('shared:confirm_values')
                  )}
                </PrimaryButton>
              </Flex>
            )
          ) : (
            SinglePageButtonWithoutFF
          )}
        </Flex>
      }
      selectedRobot={selectedRobot}
      setSelectedRobot={setSelectedRobot}
      robotType={robotType}
      isCreatingRun={isCreatingRun}
      reset={resetCreateRun}
      runCreationError={runCreationError}
      runCreationErrorCode={runCreationErrorCode}
      showIdleOnly={true}
      setHasParamError={setHasParamError}
    />
  )
}

export function ChooseRobotToRunProtocolSlideout(
  props: ChooseRobotToRunProtocolSlideoutProps
): JSX.Element | null {
  return <ChooseRobotToRunProtocolSlideoutComponent {...props} />
}
