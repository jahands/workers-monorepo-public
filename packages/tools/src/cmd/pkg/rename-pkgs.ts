import { Command } from '@commander-js/extra-typings'
import { z } from 'zod'

import { cliError } from '../../errors'
import { getRepoRoot } from '../../path'

export const renamePkgsCmd = new Command('rename-pkgs')
	.description('rename all packages to include @repo/ prefix')
	.action(async () => {
		throw cliError(`Can't use this until vitest supports tests with @repo/ in package.json`)
		const repoRoot = await getRepoRoot()
		cd(repoRoot)

		const pkgJsons = await glob('{apps,packages,docker}/*/package.json')
		pkgJsons.sort()
		console.log(pkgJsons.join('\n'))

		for (const pkgJsonPath of pkgJsons) {
			const content = z
				.object({ name: z.string() })
				.passthrough()
				.parse(await fs.readJson(pkgJsonPath))

			if (!content.name.startsWith('@')) {
				content.name = `@repo/${content.name}`
				await fs.writeFile(pkgJsonPath, JSON.stringify(content, null, 2))
			}
		}

		await $`just fix -f`.verbose()
	})
