import { Command } from '@commander-js/extra-typings'
import { z } from 'zod'

import { cliError } from '../../errors'

export const astroblogCmd = new Command('astroblog').description('astroblog scripts')

astroblogCmd
	.command('fix-routes-json')
	.description('Removes entries from _routes.json that should not have been added')
	.action(async () => {
		const routesJsonPath = './dist/_routes.json'
		if (!(await fs.exists(routesJsonPath))) {
			throw cliError(`${routesJsonPath} does not exist!`)
		}

		const routesJson = (await fs.readFile(routesJsonPath)).toString()
		const routes = RoutesJson.parse(JSON.parse(routesJson))
		const invalid: string[] = [
			'/.assetsignore', // should not ever be uploaded
		]
		routes.exclude = routes.exclude.filter((r) => !invalid.includes(r))
		await fs.writeFile(routesJsonPath, JSON.stringify(routes))
	})

const RoutesJson = z
	.object({
		version: z.literal(1),
		include: z.string().array(),
		exclude: z.string().array(),
	})
	.passthrough()
