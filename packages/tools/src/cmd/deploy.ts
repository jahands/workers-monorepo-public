import { Command } from '@commander-js/extra-typings'

import { getConfig } from '../config'

export const deployCmd = new Command('deploy').description('Deploy Workers/Pages/etc.')

deployCmd
	.command('wrangler')
	.description('Deploy a Workers project with Wrangler')
	.option(
		'--no-output',
		`Don't output to ./dist directory (useful for frameworks with their own build.) `
	)
	.action(async ({ output }) => {
		const cfg = await getConfig()
		echo(chalk.blue(`Sentry version: ${cfg.version}`))
		$.verbose = true
		if (output) {
			await fs.remove('./dist')
		}
		const args: string[] = ['--minify']
		if (output) {
			args.push(...'--outdir ./dist'.split(' '))
		}
		await retry(3, '1s', () => $`wrangler deploy --var SENTRY_RELEASE:${cfg.version} ${args}`)
	})

deployCmd
	.command('pages')
	.description(
		'Deploy a Pages project using Wrangler. Note: may need tweeking to work with non-Remix projects.'
	)
	.argument('<project>', 'Pages project name to deploy', (p) => p)
	.action(async (project) => {
		const cfg = await getConfig()
		echo(chalk.blue(`Sentry version: ${cfg.version}`))
		$.verbose = true
		await retry(
			3,
			'1s',
			() => $`wrangler pages deploy ./build/client --commit-dirty=true --project-name ${project}`
		)
	})
