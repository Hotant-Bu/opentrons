import type { BlowOutInPlaceArgs } from '../commandCreators/atomic/blowOutInPlace'
import type { DispenseInPlaceArgs } from '../commandCreators/atomic/dispenseInPlace'
import type { DropTipInPlaceArgs } from '../commandCreators/atomic/dropTipInPlace'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export const forDispenseInPlace = (
  params: DispenseInPlaceArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  //   TODO(jr, 11/6/23): update state
}

export const forBlowOutInPlace = (
  params: BlowOutInPlaceArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  //   TODO(jr, 11/6/23): update state
}

export const forDropTipInPlace = (
  params: DropTipInPlaceArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  //   TODO(jr, 11/6/23): update state
}