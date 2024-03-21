import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface ResetValuesModalProps {
  handleGoBack: () => void
}

export function ResetValuesModal({
  handleGoBack,
}: ResetValuesModalProps): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'shared'])

  const modalHeader: ModalHeaderBaseProps = {
    title: t('reset_parameter_values'),
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }

  // ToDo (kk:03/18/2024) reset values function will be implemented
  const handleResetValues = (): void => {
    console.log('todo add reset values function')
  }

  const modalProps = {
    header: { ...modalHeader },
  }

  return (
    <Modal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <StyledText as="p">{t('reset_parameter_values_body')}</StyledText>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing8}
        >
          <SmallButton
            onClick={handleGoBack}
            buttonText={t('shared:go_back')}
            width="100%"
          />
          <SmallButton
            buttonType="alert"
            onClick={handleResetValues}
            buttonText={t('reset_values')}
            width="100%"
          />
        </Flex>
      </Flex>
    </Modal>
  )
}