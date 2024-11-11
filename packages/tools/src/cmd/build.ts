import { Command } from '@commander-js/extra-typings'
import { z } from 'zod'

import { validateArg } from '../args'

export const buildCmd = new Command('build').description('Build Workers/etc.')

buildCmd
	.command('wrangler')
	.description('Build a Workers project with Wrangler')
	.action(async () => {
		$.verbose = true
		await fs.remove('./dist')
		await $`wrangler deploy --minify --outdir ./dist --dry-run`
	})

buildCmd
	.command('bun-compile')
	.description('build a bun app in compiled mode')

	.argument('<entrypoint>', 'e.g. ./src/index.ts')
	.argument('<out-file>', 'e.g. ./dist/cronjobs')
	.option('--version <version>', 'Release version of the app', validateArg(z.string()))

	.action(async (entrypoint, outFile, { version }) => {
		const args: string[] = [
			'--compile',
			'--minify',
			'--sourcemap',
			'--target=bun',
			entrypoint,
			'--outfile',
			outFile,
		]

		if (version && version.length > 0) {
			args.push(`--define=process.env.SENTRY_RELEASE='${version}'`)
		}

		$.verbose = true
		await fs.remove('./dist')
		await $`bun build ${args}`
	})
