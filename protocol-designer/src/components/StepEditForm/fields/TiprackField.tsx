import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  FormGroup,
  DropdownField,
  useHoverTooltip,
  Tooltip,
  Box,
} from '@opentrons/components'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { getPipetteEntities } from '../../../step-forms/selectors'
import type { FieldProps } from '../types'

import styles from '../StepEditForm.module.css'

interface TiprackFieldProps extends FieldProps {
  pipetteId?: unknown
}
export function TiprackField(props: TiprackFieldProps): JSX.Element {
  const {
    name,
    value,
    onFieldBlur,
    onFieldFocus,
    updateValue,
    pipetteId,
  } = props
  const { t } = useTranslation(['form', 'tooltip'])
  const [targetProps, tooltipProps] = useHoverTooltip()
  const pipetteEntities = useSelector(getPipetteEntities)
  const options = useSelector(uiLabwareSelectors.getTiprackOptions)
  const defaultTipracks =
    pipetteId != null ? pipetteEntities[pipetteId as string].tiprackDefURI : []
  const pipetteOptions = options.filter(option =>
    defaultTipracks.includes(option.defURI)
  )
  const hasMissingTiprack = defaultTipracks.length > pipetteOptions.length

  return (
    <Box {...targetProps}>
      <FormGroup
        label={t('step_edit_form.tipRack')}
        className={styles.large_field}
      >
        <DropdownField
          options={pipetteOptions}
          name={name}
          value={String(value) != null ? String(value) : null}
          onBlur={onFieldBlur}
          onFocus={onFieldFocus}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            updateValue(e.currentTarget.value)
          }}
        />
      </FormGroup>
      {hasMissingTiprack ? (
        <Tooltip {...tooltipProps}>{t('tooltip:missing_tiprack')}</Tooltip>
      ) : null}
    </Box>
  )
}
