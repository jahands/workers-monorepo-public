import { Command } from '@commander-js/extra-typings'

import { astroblogCmd } from './astroblog'
import { renamePkgsCmd } from './rename-pkgs'
import { runCmd } from './run'
import { wciTrackerCmd } from './wci'

export const pkgCmd = new Command('package')
	.alias('pkg')
	.description('Package-specific commands')

	.addCommand(wciTrackerCmd)
	.addCommand(astroblogCmd)
	.addCommand(runCmd)
	.addCommand(renamePkgsCmd)
