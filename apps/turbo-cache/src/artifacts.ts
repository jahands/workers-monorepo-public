import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { datePlus } from 'itty-time'
import PQueue from 'p-queue'
import pRetry, { AbortError } from 'p-retry'
import { z } from 'zod'

import { newHTTPException } from '@repo/hono-helpers'

import { getArtifactPath } from './path'
import { ArtifactsStats, getTurboCache } from './TurboCache'

import type { Context } from 'hono'
import type { Options as RetryOptions } from 'p-retry'
import type { App } from './types'

const ArtifactParams = z.object({
	teamID: z.string().optional(),
	artifactID: z.string(),
})
const ArtifactQuery = z.object({
	teamId: z.string().optional(),
	slug: z.string().optional(),
})

const ArtifactEvent = z.object({
	sessionId: z.string(),
	source: z.enum(['LOCAL', 'REMOTE']),
	event: z.enum(['HIT', 'MISS']),
	hash: z.string(),
	duration: z.number(),
})

const EventRequest = z.array(ArtifactEvent)

export type ListArtifactsResponse = z.infer<typeof ListArtifactsResponse>
export const ListArtifactsResponse = z
	.array(z.string().min(1).describe('artifact path'))
	.describe('ListArtifactsResponse')

export type ManualCacheBustResponse = z.infer<typeof ManualCacheBustResponse>
export const ManualCacheBustResponse = z
	.object({
		success: z.boolean(),
		num_purged: z.number(),
	})
	.describe('ManualCacheBustResponse')

export type ArtifactsStatsResponse = z.infer<typeof ArtifactsStatsResponse>
export const ArtifactsStatsResponse = ArtifactsStats.describe('ArtifactsStatsResponse')

export type UpsertArtifactResponse = z.infer<typeof UpsertArtifactResponse>
export const UpsertArtifactResponse = z
	.object({
		teamID: z.string().min(1),
		artifactID: z.string(),
		storagePath: z.string().min(1),
		size: z.number().min(1),
	})
	.describe('UpsertArtifactResponse')

/** Artifact expiration epoch timestamp */
function getExpiration(): number {
	return datePlus('3 months').getTime()
}

type ArtifactKVMetadata = z.infer<typeof ArtifactKVMetadata>
const ArtifactKVMetadata = z
	.object({
		artifactTag: z.string().optional(),
	})
	.nullable()

const retryOpts = (c: Context<App>) =>
	({
		retries: 3,
		minTimeout: 100,
		randomize: true,
		onFailedAttempt: (error) => {
			c.var.sentry?.captureException(error)
		},
	}) satisfies RetryOptions

const TeamIdParam = z.object({ team_id: z.string().min(1) })

export const artifactApp = new Hono<App>()
	// Manual cache busting, it will bust the entire cache.
	.post('/artifacts/:team_id/manual-cache-bust', zValidator('param', TeamIdParam), async (c) => {
		const { team_id } = c.req.valid('param')
		const num_purged = await getTurboCache(c, team_id).purgeArtifacts({ purgeAll: true })

		// maybe this could return the keys that were busted?
		return c.json({ success: true, num_purged } satisfies ManualCacheBustResponse)
	})

	.get('/artifacts/:team_id/stats', zValidator('param', TeamIdParam), async (c) => {
		const { team_id } = c.req.valid('param')
		return c.json(await getTurboCache(c, team_id).getStats())
	})

	.put(
		'/v8/artifacts/:artifactID',
		zValidator('param', ArtifactParams),
		zValidator('query', ArtifactQuery),
		async (c) => {
			const { artifactID } = c.req.valid('param')
			const { teamId, slug } = c.req.valid('query')
			const teamID = teamId ?? slug

			if (teamID === undefined || teamID === '') {
				return c.json({ error: 'MISSING_TEAM_ID' }, 400)
			}

			if (c.req.header('Content-Type') !== 'application/octet-stream') {
				return c.json({ error: 'EXPECTED_OCTET_STREAM' }, 415)
			}

			const artifactTag = c.req.header('x-artifact-tag')
			const r2Key = getArtifactPath(teamID, artifactID)
			const size = z.coerce.number().optional().default(0).parse(c.req.header('content-length'))
			if (c.req.header('content-length') === undefined) {
				c.var.sentry?.captureMessage('artifact is missing content-length header')
			} else if (size === 0) {
				c.var.sentry?.captureMessage('content-length is 0')
			}

			// Speed up response a bit by reading objects up to 25 MiB and then returning right away
			const shouldReadInline = size > 0 && size < 1024 * 1024 * 25
			const body = shouldReadInline ? await c.req.arrayBuffer() : c.req.raw.body
			if (body === null) {
				throw newHTTPException(500, 'body is null')
			}

			const putArtifactKV = pRetry(
				async () =>
					c.get('tracer').startActiveSpan('R2.upsertArtifact()', async (span) => {
						span.setAttributes({
							teamID,
							artifactID,
							size,
						})
						try {
							await c.env.R2.put(getArtifactPath(teamID, artifactID), body, {
								customMetadata:
									ArtifactKVMetadata.parse({
										artifactTag: artifactTag,
									} satisfies ArtifactKVMetadata) ?? undefined,
							})
						} catch (e) {
							if (!shouldReadInline) {
								c.var.sentry?.addBreadcrumb({
									message: 'not retrying R2.put() because shouldReadInline=false',
								})
								// Cannot retry when reading body via stream
								throw new AbortError(e as Error)
							} else {
								throw e
							}
						} finally {
							span.end()
						}
					}),
				retryOpts(c)
			)

			const putArtifactDB = pRetry(
				async () =>
					c.get('tracer').startActiveSpan('TurboCache.upsertArtifact()', async (span) => {
						span.setAttributes({
							teamID,
							artifactID,
							size,
						})
						try {
							await getTurboCache(c, teamID).upsertArtifact({
								team_id: teamID,
								artifact_id: artifactID,
								tag: artifactTag ?? null,
								size,
								expires_on: getExpiration(),
							})
						} finally {
							span.end()
						}
					}),
				retryOpts(c)
			)

			if (!shouldReadInline) {
				// If we're streaming the body, we need to finish the put
				// first so that the client doesn't cancel the request.
				await putArtifactKV
			}

			// Write in background - cache is best effort and this speeds up builds
			await waitUntil(c, Promise.all([putArtifactKV, putArtifactDB]))

			return c.json(
				UpsertArtifactResponse.parse({
					teamID,
					artifactID,
					storagePath: r2Key,
					size,
				} satisfies UpsertArtifactResponse),
				201
			)
		}
	)

	.get('/v8/artifacts/list', zValidator('query', ArtifactQuery), async (c) => {
		// FYI: I don't think this endpoint is actually used
		const { teamId, slug } = c.req.valid('query')
		const teamID = teamId ?? slug

		if (!teamID) {
			return c.json({ error: 'MISSING_TEAM_ID & QUERY' }, 400)
		}
		const list: string[] = await pRetry(
			async () =>
				c.get('tracer').startActiveSpan('TurboCache.listArtifacts()', async (span) => {
					span.setAttributes({
						teamID,
					})
					try {
						return (await getTurboCache(c, teamID).listArtifacts()).map(
							(a) => `${a.team_id}/${a.artifact_id}`
						)
					} finally {
						span.end()
					}
				}),
			retryOpts(c)
		)

		return c.json(ListArtifactsResponse.parse(list))
	})

	.get(
		'/v8/artifacts/:artifactID',
		zValidator('param', ArtifactParams),
		zValidator('query', ArtifactQuery),
		async (c) => {
			const { artifactID } = c.req.valid('param')
			const { teamId, slug } = c.req.valid('query')
			const teamID = teamId ?? slug

			if (teamID === undefined || teamID === '') {
				return c.json({ error: 'MISSING_TEAM_ID & QUERY' }, 400)
			}

			const res = await pRetry(
				async () =>
					c.get('tracer').startActiveSpan('R2.getArtifact()', async (span) => {
						span.setAttributes({
							teamID,
							artifactID,
						})
						try {
							const res = await c.env.R2.get(getArtifactPath(teamID, artifactID))
							if (res === null) return null

							const meta = ArtifactKVMetadata.parse(res.customMetadata)
							return {
								artifact_tag: meta?.artifactTag,
								artifact_value: res.body,
							}
						} finally {
							span.end()
						}
					}),
				retryOpts(c)
			)
			if (!res) {
				await waitUntil(c, getTurboCache(c, teamID).countStat('misses', 1))
				return c.notFound()
			}
			await waitUntil(c, getTurboCache(c, teamID).countStat('hits', 1))

			c.header('Content-Type', 'application/octet-stream')
			if (res.artifact_tag) {
				c.header('x-artifact-tag', res.artifact_tag)
			}

			c.status(200)
			return c.body(res.artifact_value)
		}
	)

	.post(
		'/v8/artifacts/events',
		zValidator('query', ArtifactQuery),
		zValidator('json', EventRequest),
		async (c) => {
			const { teamId, slug } = c.req.valid('query')
			const teamID = teamId ?? slug

			if (teamID === undefined || teamID === '') {
				return c.json({ error: 'MISSING_TEAM_ID & QUERY' }, 400)
			}

			const events = c.req.valid('json')

			c.var.logger?.log('event body', {
				msc: events,
			})

			const queue = new PQueue({
				concurrency: 6,
			})

			for (const event of events) {
				if (event.source === 'REMOTE') {
					if (event.event === 'HIT') {
						void queue.add(async () => bumpExpirationTime(c, teamID, event.hash))
					} else if (event.event === 'MISS') {
						void queue.add(async () => getTurboCache(c, teamID).countStat('event_misses', 1))
					}
				}
			}

			// Wait for all expiration bumps to complete in background
			// so that we aren't blocking the request
			await waitUntil(c, queue.onIdle())

			c.status(200)
			return c.json({ result: 'success' })
		}
	)

async function bumpExpirationTime(
	c: Context<App>,
	teamID: string,
	artifactID: string
): Promise<void> {
	await pRetry(
		async () =>
			c.get('tracer').startActiveSpan('TurboCache.updateArtifactExpiration()', async (span) => {
				span.setAttributes({
					teamID,
					artifactID,
				})
				try {
					await getTurboCache(c, teamID).updateArtifactExpiration({
						team_id: teamID,
						artifact_id: artifactID,
						expires_on: getExpiration(),
					})
				} finally {
					span.end()
				}
			}),
		retryOpts(c)
	)
}

/**
 * Helper to await in tests, but run in background in prod
 */
async function waitUntil(c: Context<App>, p: Promise<unknown>): Promise<void> {
	if (c.env.ENVIRONMENT === 'VITEST') {
		await p
	} else {
		c.get('txWaitUntil').push(p)
	}
}
