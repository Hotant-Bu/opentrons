import type { ModuleOnlyParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type { CommandCreator } from '../../types'
export const heaterShakerStopShake: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'heaterShakerModule/stopShake',
        params: {
          moduleId: args.moduleId,
        },
      },
    ],
  }
}