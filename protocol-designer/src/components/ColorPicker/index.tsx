import * as React from 'react'
import cx from 'classnames'
import { ColorResult, TwitterPicker } from 'react-color'
import { DEFAULT_LIQUID_COLORS } from '@opentrons/shared-data'

import styles from './ColorPicker.module.css'

interface ColorPickerProps {
  value: string
  onChange: (hex: ColorResult['hex']) => void
}

export function ColorPicker(props: ColorPickerProps): JSX.Element {
  const [showColorPicker, setShowColorPicker] = React.useState<boolean>(false)

  return (
    <>
      <div>
        <div
          className={cx(styles.swatch, {
            [styles.swatch_enabled]: showColorPicker,
          })}
          onClick={() =>
            setShowColorPicker(showColorPicker => !showColorPicker)
          }
        >
          <div
            className={styles.color}
            style={{
              backgroundColor: props.value,
            }}
          />
        </div>
        {showColorPicker ? (
          <div className={styles.popover}>
            <div
              className={styles.cover}
              onClick={() => setShowColorPicker(false)}
            />
            <TwitterPicker
              colors={DEFAULT_LIQUID_COLORS}
              color={props.value}
              onChange={(color, event) => {
                props.onChange(color.hex)
              }}
            />
          </div>
        ) : null}
      </div>
    </>
  )
}
