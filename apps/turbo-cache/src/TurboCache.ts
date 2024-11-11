import { DurableObject } from 'cloudflare:workers'
import { datePlus } from 'itty-time'
import pQueue from 'p-queue'
import pRetry from 'p-retry'
import { z } from 'zod'

import { newLogger } from './helpers/logging'
import { initDOSentry } from './helpers/sentry'
import { getArtifactPath } from './path'

import type { Options as RetryOptions } from 'p-retry'
import type { SharedAppContext } from '@repo/hono-helpers'
import type { AxiomLogger } from '@repo/logging'
import type { Bindings } from './types'

export class TurboCache extends DurableObject<Bindings> {
	sql: SqlStorage
	logger: SharedAppContext['var']['logger']
	sentry: SharedAppContext['var']['sentry']

	nextAlarm: number | null = null
	/** Queue to make sure we don't try to purge concurrently */
	purgeQueue = new pQueue({
		concurrency: 1,
	})

	constructor(ctx: DurableObjectState, env: Bindings) {
		super(ctx, env)
		this.sql = ctx.storage.sql
		void this.ctx.blockConcurrencyWhile(async () => {
			// Set context
			const c: SharedAppContext = {
				env: this.env,
				executionCtx: this.ctx,
				var: {
					sentry: initDOSentry(this.env, this.ctx),
					logger: undefined,
				},
			}
			c.var.logger = newLogger(c, 'durable_object') // Disabling DO logging for now.
			this.sentry = c.var.sentry
			this.logger = c.var.logger
			void c.var.logger.addCFTraceTags(10)

			// Run migrations
			const nextMigration = z
				.number()
				.optional()
				.default(0)
				.parse(await this.ctx.storage.get('next_migration'))

			for (const migration of migrations.slice(nextMigration)) {
				for (const query of migration.queries) {
					this.sql.exec(query)
				}
			}
			void this.ctx.storage.put('next_migration', migrations.length)

			void this.updateAlarm()
			this.autoPurge()
		})
	}

	/** Tear down the DO (for use in tests) */
	async teardown(): Promise<void> {
		await this.ctx.storage.deleteAlarm()
		await this.ctx.storage.deleteAll()
	}

	/** Helper to only await things in tests */
	async waitUntil(p: Promise<unknown>): Promise<void> {
		if (this.env.ENVIRONMENT === 'VITEST') {
			await p
		} else {
			this.ctx.waitUntil(p)
		}
	}

	autoPurge(): void {
		if (this.purgeQueue.size > 0) {
			return // Only ever queue up one purge at a time
		}
		void this.purgeQueue.add(async () => {
			await sleep(10_000) // Only purge every 10 seconds
			this.logger?.info('auto purging')
			const start = Date.now()
			await this.purgeArtifacts()
			this.logger?.info(`auto purged after ${Date.now() - start}ms`)
		})
	}

	async updateAlarm(): Promise<void> {
		return // alarms aren't implemented yet :(
		/*
		if (this.nextAlarm === null || this.nextAlarm <= Date.now()) {
			const alarm = await this.ctx.storage.getAlarm()
			if (alarm === null) {
				if (this.getStats().total_artifacts > 0) {
					this.logger?.info('updating alarm')
					this.nextAlarm = datePlus('1 hour').getTime()
					await this.ctx.storage.setAlarm(this.nextAlarm)
				} else {
					this.logger?.info('no artifacts, skipping alarm')
				}
			}
		}
		*/
	}

	// async alarm(): Promise<void> {
	// 	this.logger?.info('alarm running')
	// 	await this.updateAlarm()

	// 	const res = this.purgeArtifacts()
	// 	this.logger?.info(`purged ${res} artifacts`)
	// }

	async upsertArtifact(artifact: UpsertArtifact): Promise<void> {
		await this.countStat('artifacts', 1)
		await this.countStat('size', artifact.size)

		this.sql.exec(
			/* sql */ `
			insert or replace into artifacts (
				team_id,
				artifact_id,
				tag,
				size,
				expires_on
			) values (?,?,?,?,?)
		`,
			artifact.team_id,
			artifact.artifact_id,
			artifact.tag,
			artifact.size,
			artifact.expires_on
		)
	}

	getArtifacts(): ArtifactRecord[] {
		const res = this.sql
			.exec(
				/* sql */ `
				select * from artifacts
			`
			)
			.toArray()
		return ArtifactRecord.strict().array().parse(res)
	}

	listArtifacts(): ListArtifacts[] {
		const res = this.sql
			.exec(
				/* sql */ `
				select team_id, artifact_id
				from artifacts
			`
			)
			.toArray()
		return ListArtifacts.strict().array().parse(res)
	}

	getArtifact({
		team_id,
		artifact_id,
	}: Pick<ArtifactRecord, 'team_id' | 'artifact_id'>): ArtifactRecord | null {
		const res = this.sql.exec(
			/* sql */ `
			select * from artifacts
			where team_id = ?1
				and artifact_id = ?2
			`,
			team_id,
			artifact_id
		)
		if (res.rowsRead === 0) {
			return null
		}
		if (res.rowsRead > 1) {
			throw new Error('read more than one row which should not be possible')
		}
		return ArtifactRecord.strict().parse(res.one())
	}

	async updateArtifactExpiration({
		team_id,
		artifact_id,
		expires_on,
	}: Pick<ArtifactRecord, 'team_id' | 'artifact_id' | 'expires_on'>): Promise<number> {
		const hits = (this.getArtifact({ team_id, artifact_id })?.hits ?? 0) + 1
		await this.countStat('event_hits', 1)

		const res = this.sql.exec(
			/* sql */ `
			update artifacts
			set expires_on = ?1,
				hits = ?2
			where team_id = ?3
				and artifact_id = ?4
		`,
			expires_on,
			hits,
			team_id,
			artifact_id
		)
		return res.rowsWritten
	}

	async purgeArtifacts(opts?: { purgeAll: boolean }): Promise<number> {
		const res = this.sql.exec(
			/* sql */ `
		delete from artifacts
		where expires_on < ?1
		returning team_id, artifact_id
		`,
			opts?.purgeAll ? datePlus('100 years').getTime() : Date.now()
		)
		const queue = new pQueue({
			concurrency: 6,
		})

		const keys: string[] = []
		for (const row of res) {
			const artifact = ArtifactRecord.pick({
				team_id: true,
				artifact_id: true,
			})
				.strict()
				.parse(row)

			const artifactPath = getArtifactPath(artifact.team_id, artifact.artifact_id)
			keys.push(artifactPath)
		}

		for (let i = 0; i < keys.length; i += 500) {
			const keysToDelete = keys.splice(0, i + 500)
			void queue.add(async () =>
				pRetry(async () => this.env.R2.delete(keysToDelete), this.retryOpts())
			)
		}
		await queue.onIdle()

		this.logger?.info(`success! purged ${res.rowsWritten} artifacts`)
		return res.rowsWritten
	}

	statPath(stat: AllTimeStat): string {
		return `stats/${stat}`
	}

	// Count totals of things
	async countStat(stat: AllTimeStat, val: number): Promise<void> {
		await this.waitUntil(
			(async () => {
				const statPath = this.statPath(stat)
				const cur = (await this.ctx.storage.get<number>(statPath)) ?? 0
				void this.ctx.storage.put(statPath, cur + val)
			})()
		)
	}

	async getStat(s: AllTimeStat): Promise<number> {
		return (await this.ctx.storage.get<number>(this.statPath(s))) ?? 0
	}

	async getAllTimeStats(): Promise<AllTimeStats> {
		const stats: AllTimeStats = {
			artifacts: await this.getStat('artifacts'),
			size: await this.getStat('size'),
			event_hits: await this.getStat('event_hits'),
			event_misses: await this.getStat('event_misses'),
			hits: await this.getStat('hits'),
			misses: await this.getStat('misses'),
		}
		return AllTimeStats.parse(stats)
	}

	async getStats(): Promise<ArtifactsStats> {
		const res = this.sql.exec(/* sql */ `
				select
					count(*) as total_artifacts,
					count(distinct(team_id)) as total_teams,
					sum(hits) as total_hits,
					sum(size) as total_size,
					max(size) as max_size
				from artifacts
			`)
		const stats = ArtifactsStats.omit({ db_size: true, all_time: true }).strict().parse(res.one())

		return {
			...stats,
			// Stats not coming from the query:
			db_size: this.sql.databaseSize,
			all_time: await this.getAllTimeStats(),
		}
	}

	retryOpts(): RetryOptions {
		return {
			retries: 3,
			minTimeout: 100,
			randomize: true,
			onFailedAttempt: (error) => {
				this.sentry?.captureException(error)
			},
		}
	}
}

export function getTurboCache(
	c: {
		env: Bindings
		var: { logger?: AxiomLogger }
	},
	team_id: string
): DurableObjectStub<TurboCache> {
	const id = c.env.TURBOCACHE.idFromName(team_id)
	return c.env.TURBOCACHE.get(id)
}

export type AllTimeStat = z.infer<typeof AllTimeStat>
export const AllTimeStat = z.enum([
	'artifacts',
	'size',
	'event_hits',
	'event_misses',
	'hits',
	'misses',
])

/**
 * Similar to ArtifactStats, but we track these outside the DB
 * so that we don't lose data when artifacts get purged.
 */
export type AllTimeStats = z.infer<typeof AllTimeStats>
export const AllTimeStats = z
	.object({
		artifacts: z.number(),
		size: z.number().describe('size in bytes'),
		event_hits: z
			.number()
			.describe('hits based on what Turbo told us was a hit via /events endpoint'),
		event_misses: z
			.number()
			.describe('misses based on what Turbo told us was a hit via /events endpoint'),
		hits: z.number().describe('actual successful KV reads'),
		misses: z.number(),
	})
	.describe('AllTimeStats')

export type ArtifactsStats = z.infer<typeof ArtifactsStats>
export const ArtifactsStats = z
	.object({
		total_artifacts: z.number(),
		total_teams: z.number(),
		total_hits: z.number().nullable(),
		total_size: z.number().nullable().describe('total size of all artifact values'),
		max_size: z.number().nullable(),
		db_size: z.number(),
		all_time: AllTimeStats,
	})
	.describe('ArtifactsStats')

// Schema
export type ArtifactRecord = z.infer<typeof ArtifactRecord>
export const ArtifactRecord = z
	.object({
		_id: z.number(),
		team_id: z.string().min(1),
		artifact_id: z.string().min(1),
		tag: z.string().nullable(),
		hits: z.number(),
		size: z.number().describe('size of the artifact stored in KV'),
		expires_on: z.number().min(1),
	})
	.describe('ArtifactRecord')

export type UpsertArtifact = z.infer<typeof UpsertArtifact>
export const UpsertArtifact = ArtifactRecord.pick({
	team_id: true,
	artifact_id: true,
	tag: true,
	size: true,
	expires_on: true,
}).describe('UpsertArtifact')

export type ListArtifacts = z.infer<typeof ListArtifacts>
export const ListArtifacts = ArtifactRecord.pick({
	team_id: true,
	artifact_id: true,
}).describe('ListArtifacts')

// Migrations
const migrations: Migration[] = [
	{
		name: 'add artifacts table',
		queries: [
			/* sql */ `
		create table if not exists artifacts (
			_id integer primary key,
			team_id text not null,
			artifact_id text not null,
			artifact_tag text,
			artifact_value text not null,
			hits int not null default 0,
			expires_on int not null,
			constraint uniq_team_artifact unique (team_id, artifact_id)
		)`,
		],
	},
	{
		name: 'add index',
		queries: [
			/* sql */ `
			create index if not exists idx_team_artifact_id
			on artifacts (team_id, artifact_id)
		`,
		],
	},
	{
		name: 'add index for expires_on',
		queries: [
			/* sql */ `
			create index if not exists idx_expires_on
			on artifacts (expires_on)
		`,
		],
	},
	{
		name: 'delete all data for move to KV',
		queries: [
			/* sql */ `
			delete from artifacts
		`,
			/* sql */ `
			alter table artifacts
			drop column artifact_value
		`,
		],
	},
	{
		name: 'rename artifact_tag -> tag',
		queries: [
			/* sql */ `
			alter table artifacts drop column artifact_tag
		`,
			/* sql */ `
			alter table artifacts add column tag
		`,
		],
	},
	{
		name: 'add artifact size',
		queries: [
			/* sql */ `
			alter table artifacts
			add column size not null
		`,
		],
	},
]

interface Migration {
	name: string
	queries: string[]
}

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
