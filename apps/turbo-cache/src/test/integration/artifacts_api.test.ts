import { env } from 'cloudflare:test'
import { httpStatus } from 'http-codex'
import { assert, describe, expect } from 'vitest'

import { getArtifactPath } from '../../path'
import { testSuite } from './suite'

const { it } = testSuite()

describe('POST /artifacts/:team_id/manual-cache-bust', () => {
	it('purges all artifacts regardless of expiration', async ({ h }) => {
		const a1 = await h.upsertArtifactInDB()
		const a2 = await h.upsertArtifactInDB({ expired: true })

		expect((await h.listArtifacts()).length).toBe(2)
		expect(await h.artifactExists(a1)).toBe(true)
		expect(await h.artifactExists(a2)).toBe(true)

		expect(await h.manualCacheBust()).toStrictEqual({
			success: true,
			num_purged: 2,
		})
		expect((await h.listArtifacts()).length).toBe(0)
	})
})

describe('GET /artifacts/:team_id/stats', () => {
	it('returns stats', async ({ h }) => {
		await h.upsertArtifactInDB()
		await h.upsertArtifactInDB()
		expect(await h.getArtifactStats()).toMatchInlineSnapshot(`
			{
			  "all_time": {
			    "artifacts": 2,
			    "event_hits": 0,
			    "event_misses": 0,
			    "hits": 0,
			    "misses": 0,
			    "size": 34,
			  },
			  "db_size": 24576,
			  "max_size": 17,
			  "total_artifacts": 2,
			  "total_hits": 0,
			  "total_size": 34,
			  "total_teams": 1,
			}
		`)
	})
})

describe('GET /v8/artifacts/list', () => {
	it('lists artifacts', async ({ h }) => {
		const a1 = await h.upsertArtifactInDB()
		const a2 = await h.upsertArtifactInDB()
		const keys = await h.listArtifacts()
		expect(keys.length).toBe(2)
		expect(keys.includes(getArtifactPath(a1.team_id, a1.artifact_id)))
		expect(keys.includes(getArtifactPath(a2.team_id, a2.artifact_id)))
	})
})

describe('GET /v8/artifacts/:artifactID', () => {
	it('gets the artifact value', async ({ h }) => {
		const a1 = await h.upsertArtifactInDB({ value: 'some_artifact' })
		const { status, body } = await h.getArtifact(a1.artifact_id)
		expect(status).toBe(200)
		expect(body).toBe('some_artifact')
	})
})

describe('PUT /v8/artifacts/:artifactID', () => {
	it('adds artifact to both kv and db', async ({ h }) => {
		// Should start with no KV keys
		expect(await env.R2.list()).toMatchInlineSnapshot(`
			{
			  "delimitedPrefixes": [],
			  "objects": [],
			  "truncated": false,
			}
		`)
		// and no values in DB
		expect(await h.listArtifacts()).toStrictEqual([])

		const a1 = h.randomArtifact()
		const res = await h.upsertArtifact(a1, 'some_artifact')
		expect(res.teamID).toBe(a1.team_id)
		expect(res.artifactID).toBe(a1.artifact_id)
		expect(res.size).toBe(13) // byte length
		expect(res.storagePath).toBe(getArtifactPath(res.teamID, res.artifactID))

		// ensure it wrote to kv
		const { status, body } = await h.getArtifact(a1.artifact_id)
		expect(status).toBe(200)
		expect(body).toBe('some_artifact')

		// ensure it wrote to db
		expect(await h.listArtifacts()).toStrictEqual([res.storagePath])
		const dbRes = await h.getDB().listArtifacts()
		expect(dbRes.length).toBe(1)
		expect(dbRes[0].team_id).toBe(a1.team_id)
		expect(dbRes[0].artifact_id).toBe(a1.artifact_id)
	})

	it('records hit to all time stats', async ({ h }) => {
		const a1 = h.randomArtifact()
		const res = await h.upsertArtifact(a1, 'some_artifact')

		// No stats yet
		const stats = await h.getArtifactStats()
		expect(stats.all_time.event_hits).toBe(0)
		expect(stats.all_time.hits).toBe(0)

		// Read the artifact
		const res2 = await h.getArtifact(res.artifactID)
		expect(res2.status).toBe(httpStatus.OK)

		// We have stats!
		const stats2 = await h.getArtifactStats()
		expect(stats2.all_time.hits).toBe(1)

		expect(stats2.all_time.event_hits).toBe(0) // set later in /events endpoint
		expect(stats2.all_time.misses).toBe(0)
		expect(stats2.total_hits).toBe(0) // set later via /events endpoint
	})

	it('records miss to all time stats for 404', async ({ h }) => {
		const a1 = h.randomArtifact()

		// No stats yet
		const stats = await h.getArtifactStats()
		expect(stats.all_time.event_hits).toBe(0)
		expect(stats.all_time.hits).toBe(0)

		// Try to read non-existent artifact
		const res2 = await h.getArtifact(a1.artifact_id)
		expect(res2.status).toBe(httpStatus.NotFound)

		// We have stats!
		const stats2 = await h.getArtifactStats()
		expect(stats2.all_time.misses).toBe(1)

		expect(stats2.all_time.event_hits).toBe(0)
		expect(stats2.all_time.hits).toBe(0)
		expect(stats2.total_hits).toBe(null)
	})

	it('overwrites existing artifact with same name', async ({ h }) => {
		const a1 = h.randomArtifact()
		const res = await h.upsertArtifact(a1, 'some_artifact')
		const expectedPath = getArtifactPath(res.teamID, res.artifactID)
		expect(res.teamID).toBe(a1.team_id)
		expect(res.artifactID).toBe(a1.artifact_id)
		expect(res.size).toBe(13) // byte length
		expect(res.storagePath).toBe(expectedPath)
		expect((await h.getArtifact(a1.artifact_id)).body).toBe('some_artifact')
		const expires_on = (await h.getDB().getArtifact(a1))?.expires_on
		assert(expires_on !== undefined, 'artifact should exist')

		// Updated it and make sure it updates DB and KV
		const res2 = await h.upsertArtifact(a1, 'some_artifact_updated')
		expect(res2.teamID).toBe(a1.team_id)
		expect(res2.artifactID).toBe(a1.artifact_id)
		expect((await h.getArtifact(a1.artifact_id)).body).toBe('some_artifact_updated')
		expect(res2.size).toBe(21) // byte length
		expect(res2.storagePath).toBe(expectedPath)
		const new_expires_on = (await h.getDB().getArtifact(a1))?.expires_on
		assert(new_expires_on !== undefined)
		expect(new_expires_on).toBeGreaterThan(expires_on)
	})
})
