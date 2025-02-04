export const CHOOSE_BLOWOUT_LOCATION = 'CHOOSE_BLOWOUT_LOCATION' as const
export const POSITION_AND_BLOWOUT = 'POSITION_AND_BLOWOUT' as const
export const BLOWOUT_SUCCESS = 'BLOWOUT_SUCCESS' as const
export const CHOOSE_DROP_TIP_LOCATION = 'CHOOSE_DROP_TIP_LOCATION' as const
export const POSITION_AND_DROP_TIP = 'POSITION_AND_DROP_TIP' as const
export const DROP_TIP_SUCCESS = 'DROP_TIP_SUCCESS' as const

export const BLOWOUT_STEPS = [
  CHOOSE_BLOWOUT_LOCATION,
  POSITION_AND_BLOWOUT,
  BLOWOUT_SUCCESS,
]

export const DROP_TIP_STEPS = [
  CHOOSE_DROP_TIP_LOCATION,
  POSITION_AND_DROP_TIP,
  DROP_TIP_SUCCESS,
]
