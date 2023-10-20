import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  getFixtureDisplayName,
  STAGING_AREA_LOAD_NAME,
  TRASH_BIN_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'

import { StyledText } from '../../atoms/text'
import { ODD_FOCUS_VISIBLE } from '../../atoms/buttons/constants'
import { TertiaryButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'
import { LegacyModal } from '../../molecules/LegacyModal'

import type { Cutout, FixtureLoadName } from '@opentrons/shared-data'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'
import type { LegacyModalProps } from '../../molecules/LegacyModal'

interface AddDeckConfigurationModalProps {
  fixtureLocation: Cutout
  setShowAddFixtureModal: (showAddFixtureModal: boolean) => void
  isOnDevice?: boolean
}

export function AddDeckConfigurationModal({
  fixtureLocation,
  setShowAddFixtureModal,
  isOnDevice = false,
}: AddDeckConfigurationModalProps): JSX.Element {
  const { t } = useTranslation('device_details')

  const modalHeader: ModalHeaderBaseProps = {
    title: t('add_to_slot', { slotName: fixtureLocation }),
    hasExitIcon: true,
    onClick: () => setShowAddFixtureModal(false),
  }

  const modalProps: LegacyModalProps = {
    title: t('add_to_slot', { slotName: fixtureLocation }),
    onClose: () => setShowAddFixtureModal(false),
    closeOnOutsideClick: true,
    childrenPadding: SPACING.spacing24,
    width: '23.125rem',
  }

  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()

  const availableFixtures: FixtureLoadName[] = [TRASH_BIN_LOAD_NAME]
  if (
    fixtureLocation === 'A3' ||
    fixtureLocation === 'B3' ||
    fixtureLocation === 'C3'
  ) {
    availableFixtures.push(STAGING_AREA_LOAD_NAME)
  }
  if (fixtureLocation === 'D3') {
    availableFixtures.push(STAGING_AREA_LOAD_NAME, WASTE_CHUTE_LOAD_NAME)
  }

  const handleClickAdd = (fixtureLoadName: FixtureLoadName): void => {
    updateDeckConfiguration({
      fixtureLocation,
      loadName: fixtureLoadName,
    })
    setShowAddFixtureModal(false)
  }

  return (
    <>
      {isOnDevice ? (
        <Modal
          header={modalHeader}
          onOutsideClick={() => setShowAddFixtureModal(false)}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
            <StyledText as="p">{t('add_to_slot_description')}</StyledText>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              {availableFixtures.map(fixture => (
                <React.Fragment key={fixture}>
                  <AddFixtureButton
                    fixtureLoadName={fixture}
                    handleClickAdd={handleClickAdd}
                  />
                </React.Fragment>
              ))}
            </Flex>
          </Flex>
        </Modal>
      ) : (
        <LegacyModal {...modalProps}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
            <StyledText as="p">{t('add_fixture_description')}</StyledText>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              {availableFixtures.map(fixture => (
                <React.Fragment key={fixture}>
                  <Flex
                    flexDirection={DIRECTION_ROW}
                    alignItems={ALIGN_CENTER}
                    justifyContent={JUSTIFY_SPACE_BETWEEN}
                    padding={`${SPACING.spacing8} ${SPACING.spacing16}`}
                    backgroundColor={COLORS.medGreyEnabled}
                    borderRadius={BORDERS.borderRadiusSize1}
                  >
                    <StyledText css={TYPOGRAPHY.pSemiBold}>
                      {getFixtureDisplayName(fixture)}
                    </StyledText>
                    <TertiaryButton onClick={() => handleClickAdd(fixture)}>
                      {t('add')}
                    </TertiaryButton>
                  </Flex>
                </React.Fragment>
              ))}
            </Flex>
          </Flex>
        </LegacyModal>
      )}
    </>
  )
}

interface AddFixtureButtonProps {
  fixtureLoadName: FixtureLoadName
  handleClickAdd: (fixtureLoadName: FixtureLoadName) => void
}
function AddFixtureButton({
  fixtureLoadName,
  handleClickAdd,
}: AddFixtureButtonProps): JSX.Element {
  const { t } = useTranslation('device_details')

  return (
    <Btn
      onClick={() => handleClickAdd(fixtureLoadName)}
      display="flex"
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
      css={FIXTURE_BUTTON_STYLE}
    >
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {getFixtureDisplayName(fixtureLoadName)}
      </StyledText>
      <StyledText as="p">{t('add')}</StyledText>
    </Btn>
  )
}

const FIXTURE_BUTTON_STYLE = css`
  background-color: ${COLORS.light1};
  cursor: default;
  border-radius: ${BORDERS.borderRadiusSize3};
  box-shadow: none;

  &:focus {
    background-color: ${COLORS.light1Pressed};
    box-shadow: none;
  }

  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.light1};
  }

  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.light1};
  }

  &:active {
    background-color: ${COLORS.light1Pressed};
  }

  &:disabled {
    background-color: ${COLORS.light1};
    color: ${COLORS.darkBlack60};
  }
`