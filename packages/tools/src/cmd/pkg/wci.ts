import { createHash } from 'node:crypto'
import { Command } from '@commander-js/extra-typings'
import Table from 'cli-table3'
import * as find from 'empathic/find'
import * as pkg from 'empathic/package'
import { DateTime } from 'luxon'
import memoizeOne from 'memoize-one'
import { z } from 'zod'

import { cliError } from '../../errors'
import { getRepoRoot } from '../../path'

export const wciTrackerCmd = new Command('wci-tracker').description('apps/wci-tracker commands')

wciTrackerCmd
	.command('new-migration')
	.description('Create a new migration (if there are changes)')
	.action(async () => {
		await cdToWCITracker()

		const migrationsDir = './migrations'
		if (!(await fs.exists('./migrations'))) {
			throw cliError(`No migrations folder found at ${migrationsDir}`)
		}

		const now = DateTime.now().toFormat('yyyyMMddHHmmss')
		const tempPath = `./migrations/temp_${now}.sql`
		await $`pnpm prisma migrate diff \
			--from-local-d1 \
			--to-schema-datamodel ./prisma/schema.prisma \
			--script \
			--output ${tempPath}`

		const migration = (await fs.readFile(tempPath)).toString().trim()
		if (migration.includes('This is an empty migration.')) {
			echo(chalk.blue('No new changes, skipping migration...'))
			await fs.remove(tempPath)
			return
		}

		const table = new Table({
			head: [chalk.green('New Migration Created!')],
		})
		table.push([chalk.blue(tempPath)])
		echo(table.toString())
		echo(chalk.grey('--- >>>> migration start >>>>'))
		echo(chalk.grey(migration))
		echo(chalk.grey('--- <<<< migration end <<<<'))

		const name = await question(chalk.white('Enter migration name: '))
		if (
			!z
				.string()
				.regex(/^[a-z\d_ ]+$/i)
				.safeParse(name).success
		) {
			throw cliError('Invalid migration name')
		}

		// migration format: 20240907172154_create_builds_table.sql
		const nameFmt = name.toLowerCase().replaceAll(' ', '_').replaceAll('-', '_')
		const newPath = `${migrationsDir}/${now}_${nameFmt}.sql`
		await fs.move(tempPath, newPath)

		echo(chalk.green(`Successfully created migration: ${newPath}`))

		echo(chalk.blue('Running prisma generate to update client...'))
		await $`pnpm prisma generate`

		const answer = await question(
			chalk.white('Do you want to apply this migration to the local DB? (y/N) '),
			{
				choices: ['y', 'n'],
			}
		)
		if (answer.toLowerCase().startsWith('y')) {
			await $`pnpm db:migrate:local`
		}
	})

wciTrackerCmd
	.command('generate')
	.description('Generate Prisma client, zod schemas, and add custom types')
	.action(async () => {
		await cdToWCITracker()
		const pkgPath = await getWCITrackerPath()
		echo(chalk.blue('Running prisma generate...'))
		await $`pnpm prisma generate`
		const tablesDir = `${pkgPath}/src/db/tables`
		if (!(await fs.exists(tablesDir))) {
			throw cliError(`No tables dir found at ${tablesDir}`)
		}

		echo(chalk.blue('Adding Zod types...'))
		for (const filePath of await glob(`${tablesDir}/*.ts`)) {
			const file = await fs.readFile(filePath)
			let text = file.toString()

			// Example: export const BuildModel = z.object({
			const re = /(export const )([a-zA-Z]+Model)( = z\.object\({)/
			const lines = text.match(new RegExp(re, 'g'))
			if (!lines) continue
			for (const line of lines) {
				const match = line.match(re)
				if (!match) continue

				const name = match[2]
				const zodType = `export type ${name} = z.infer<typeof ${name}>`
				if (!text.includes(zodType)) {
					echo(chalk.blue(`Adding Zod type for ${name}...`))
					text = text.replace(line, `${zodType}\n${line}`)
				}
			}
			await fs.writeFile(filePath, text)
		}

		echo(chalk.blue('Formatting...'))
		await within(async () => {
			cd(await getRepoRoot())
			await $`pnpm fix:format`
		})

		echo(chalk.green(`Success!`))
	})

wciTrackerCmd
	.command('generate-prisma-client')
	.description('Generate Prisma client (for use in CI)')
	.action(async () => {
		await cdToWCITracker()
		const cacheDir = pkg.cache('wci-tracker-prisma-client', {
			// store in the root because sometimes I rm -rf node_modules,
			// which was not invalidating this cache check
			cwd: await getRepoRootViaPnpmLock(),
		})
		if (!cacheDir) {
			throw cliError('Unable to find cache dir')
		}
		const pkgPath = await getWCITrackerPath()
		const schemaDir = `${pkgPath}/prisma`

		const lastGeneratedSchemaHash = await fs
			.readFile(`${cacheDir}/schema-hash.txt`)
			.then((b) => b.toString().trim())
			.catch(() => null)

		const currentSchemaHash = await getMD5OfDir(schemaDir)
		if (lastGeneratedSchemaHash === currentSchemaHash) {
			echo(chalk.blue('Skipping Prisma client generation because it already exists'))
			return
		}

		echo(chalk.blue('Generating Prisma client...'))
		const tablesDir = `${pkgPath}/src/db/tables`
		const tablesHash = await getMD5OfDir(tablesDir)
		if (!(await fs.exists(tablesDir))) {
			throw cliError(`No tables dir found at ${tablesDir}`)
		}

		const tablesBackupDir = `${cacheDir}/tables`
		await fs.emptyDir(tablesBackupDir)
		if (await fs.exists(tablesBackupDir)) {
			await fs.rm(tablesBackupDir, { recursive: true })
		}
		await fs.copy(tablesDir, tablesBackupDir)
		await $`pnpm prisma generate`

		await fs.writeFile(`${cacheDir}/schema-hash.txt`, currentSchemaHash)

		// Copy back files if any of them changed
		if (tablesHash !== (await getMD5OfDir(tablesDir))) {
			echo(chalk.blue('Copying back tables dir'))
			await fs.rm(tablesDir, { recursive: true })
			await fs.move(tablesBackupDir, tablesDir)
		}
	})

/**
 * Finds the root of the repo by looking for the pnpm-lock.yaml file.
 * This is needed because we don't have a git repo sometimes.
 */
const getRepoRootViaPnpmLock = memoizeOne(async (): Promise<string> => {
	const pkgLock = find.up('pnpm-lock.yaml')
	if (!pkgLock) {
		throw cliError('unable to find pnpm-lock.yaml')
	}
	const pkgLockDir = path.dirname(pkgLock)
	const pkgJsonPath = path.join(pkgLockDir, 'package.json')
	if (!(await fs.exists(pkgJsonPath))) {
		throw cliError('package.json not found for pnpm-lock.yaml')
	}
	const pkgJson = z
		.object({ name: z.string() })
		.parse(JSON.parse((await fs.readFile(pkgJsonPath)).toString()))

	if (pkgJson.name !== 'workers-monorepo') {
		throw cliError('package.json name is not "workers-monorepo"')
	}

	// We should now know that this is the root of the repo
	return pkgLockDir
})

export async function getMD5OfDir(dir: string): Promise<string> {
	const files = await fs
		.readdir(dir, { recursive: true, withFileTypes: true })
		.then((fs) => fs.filter((f) => f.isFile()))

	files.sort((a, b) => `${a.name}`.localeCompare(`${b.name}`))
	const hash = createHash('md5')
	for (const file of files.map((f) => `${f.path}/${f.name}`)) {
		hash.update((await fs.readFile(file)).toString())
	}
	return hash.digest('hex')
}

export async function getMD5OfFile(path: string): Promise<string> {
	const file = (await fs.readFile(path)).toString()
	return getMD5OfString(file)
}

export async function getMD5OfString(str: string): Promise<string> {
	return createHash('md5').update(str).digest('hex')
}

export async function cmdExists(cmd: string): Promise<boolean> {
	try {
		await $`command -v ${cmd}`
		return true
	} catch {
		return false
	}
}

async function cdToWCITracker(): Promise<void> {
	cd(await getWCITrackerPath())
}

async function getWCITrackerPath(): Promise<string> {
	const repoRoot = await getRepoRootViaPnpmLock()
	return `${repoRoot}/apps/wci-tracker`
}
