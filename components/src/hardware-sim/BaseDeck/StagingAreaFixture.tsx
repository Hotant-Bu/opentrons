import * as React from 'react'

import { SlotBase } from './SlotBase'
import { SlotClip } from './SlotClip'

import type { DeckDefinition, ModuleType } from '@opentrons/shared-data'

export type StagingAreaLocation = 'A3' | 'B3' | 'C3' | 'D3'

interface StagingAreaFixtureProps extends React.SVGProps<SVGGElement> {
  cutoutLocation: StagingAreaLocation
  deckDefinition: DeckDefinition
  moduleType?: ModuleType
  fixtureBaseColor?: React.SVGProps<SVGPathElement>['fill']
  slotClipColor?: React.SVGProps<SVGPathElement>['stroke']
  showExtensions?: boolean
}

export function StagingAreaFixture(
  props: StagingAreaFixtureProps
): JSX.Element | null {
  const {
    cutoutLocation,
    deckDefinition,
    fixtureBaseColor,
    slotClipColor,
    ...restProps
  } = props

  // TODO(bh, 2023-10-09): migrate from "orderedSlots" to v4 "cutouts" key
  const cutoutDef = deckDefinition?.locations.orderedSlots.find(
    s => s.id === cutoutLocation
  )
  if (cutoutDef == null) {
    console.warn(
      `cannot render StagingAreaFixture, no cutout named: ${cutoutDef} in deck def ${deckDefinition?.otId}`
    )
    return null
  }

  // TODO(bh, 2023-10-10): adjust base and clip d values if needed to fit v4 deck definition
  const contentsByCutoutLocation: {
    [cutoutLocation in StagingAreaLocation]: JSX.Element
  } = {
    A3: (
      <>
        <SlotBase
          d="M314.8,417.1h329.9c2.4,0,4.3-1.9,4.3-4.3v-97.4c0-2.4-1.9-4.3-4.3-4.3H314.8c-2.4,0-4.3,1.9-4.3,4.3v97.4C310.5,415.1,312.4,417.1,314.8,417.1z"
          fill={fixtureBaseColor}
        />
        <SlotClip d="M326,398.9V409h10.8" stroke={slotClipColor} />,
        <SlotClip d="M326,329.8v-10.5h10.6" stroke={slotClipColor} />,
        <SlotClip d="M457.8,398.9V409H447" stroke={slotClipColor} />,
        <SlotClip d="M457.8,329.8v-10.7H447" stroke={slotClipColor} />
        <SlotClip d="M488,398.9v10.1h10.8" stroke={slotClipColor} />,
        <SlotClip d="M488,329.8v-10.5h10.6" stroke={slotClipColor} />,
        <SlotClip d="M619.8,398.9v10.1H609" stroke={slotClipColor} />,
        <SlotClip d="M619.8,329.8v-10.7H609" stroke={slotClipColor} />
      </>
    ),
    B3: (
      <>
        <SlotBase
          d="M314.8,310h329.9c2.4,0,4.3-1.9,4.3-4.3v-97.2c0-2.4-1.9-4.3-4.3-4.3H314.8c-2.4,0-4.3,1.9-4.3,4.3v97.2C310.5,308.1,312.4,310,314.8,310z"
          fill={fixtureBaseColor}
        />
        <SlotClip d="M326,291.9V302h10.8" stroke={slotClipColor} />,
        <SlotClip d="M326,222.8v-10.5h10.6" stroke={slotClipColor} />,
        <SlotClip d="M457.8,291.9V302H447" stroke={slotClipColor} />,
        <SlotClip d="M457.8,222.8v-10.7H447" stroke={slotClipColor} />
        <SlotClip d="M488,291.9v10.1h10.8" stroke={slotClipColor} />,
        <SlotClip d="M488,222.8v-10.5h10.6" stroke={slotClipColor} />,
        <SlotClip d="M619.8,291.9v10.1H609" stroke={slotClipColor} />,
        <SlotClip d="M619.8,222.8v-10.7H609" stroke={slotClipColor} />
      </>
    ),
    C3: (
      <>
        <SlotBase
          d="M314.8,203.1h329.9c2.4,0,4.3-1.9,4.3-4.3v-97.4c0-2.4-1.9-4.3-4.3-4.3H314.8c-2.4,0-4.3,1.9-4.3,4.3v97.4C310.5,201.2,312.4,203.1,314.8,203.1z"
          fill={fixtureBaseColor}
        />
        <SlotClip d="M326,185v10.1h10.8" stroke={slotClipColor} />,
        <SlotClip d="M326,115.8v-10.5h10.6" stroke={slotClipColor} />,
        <SlotClip d="M457.8,185v10.1H447" stroke={slotClipColor} />,
        <SlotClip d="M457.8,115.8v-10.7H447" stroke={slotClipColor} />
        <SlotClip d="M488,185v10.1h10.8" stroke={slotClipColor} />,
        <SlotClip d="M488,115.8v-10.5h10.6" stroke={slotClipColor} />,
        <SlotClip d="M619.8,185v10.1H609" stroke={slotClipColor} />,
        <SlotClip d="M619.8,115.8v-10.7H609" stroke={slotClipColor} />
      </>
    ),
    D3: (
      <>
        <SlotBase
          d="M314.8,96.1h329.9c2.4,0,4.3-1.9,4.3-4.3V-5.6c0-2.4-1.9-4.3-4.3-4.3H314.8c-2.4,0-4.3,1.9-4.3,4.3v97.4C310.5,94.2,312.4,96.1,314.8,96.1z"
          fill={fixtureBaseColor}
        />
        <SlotClip d="M326,77.9V88h10.8" stroke={slotClipColor} />
        <SlotClip d="M326,8.8V-1.7h10.6" stroke={slotClipColor} />
        <SlotClip d="M457.8,77.9V88H447" stroke={slotClipColor} />
        <SlotClip d="M457.8,8.8V-1.9H447" stroke={slotClipColor} />
        <SlotClip d="M488,77.9v10.1h10.8" stroke={slotClipColor} />,
        <SlotClip d="M488,8.8v-10.5h10.6" stroke={slotClipColor} />,
        <SlotClip d="M619.8,77.9v10.1H609" stroke={slotClipColor} />,
        <SlotClip d="M619.8,8.8v-10.7H609" stroke={slotClipColor} />
      </>
    ),
  }

  return <g {...restProps}>{contentsByCutoutLocation[cutoutLocation]}</g>
}
