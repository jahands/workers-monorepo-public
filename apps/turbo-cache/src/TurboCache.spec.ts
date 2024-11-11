import { env, runInDurableObject } from 'cloudflare:test'
import { ms } from 'itty-time'
import PQueue from 'p-queue'
import { describe, expect, it, test } from 'vitest'

import { getArtifactPath } from './path'
import { UpsertArtifact } from './TurboCache'

import type { TurboCache } from './TurboCache'

describe('TurboCache', () => {
	function getDO(name?: string): DurableObjectStub<TurboCache> {
		const id = name ? env.TURBOCACHE.idFromName(name) : env.TURBOCACHE.newUniqueId()
		return env.TURBOCACHE.get(id)
	}

	describe('upsertArtifact()', () => {
		it('writes artifact to sql db', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				await instance.upsertArtifact(
					UpsertArtifact.parse({
						team_id: 'foo',
						artifact_id: 'asdf',
						tag: null,
						size: 17,
						expires_on: new Date('2022-01-03').getTime(),
					} satisfies UpsertArtifact)
				)

				const artifacts = instance.getArtifacts()
				expect(artifacts).toMatchInlineSnapshot(`
					[
					  {
					    "_id": 1,
					    "artifact_id": "asdf",
					    "expires_on": 1641168000000,
					    "hits": 0,
					    "size": 17,
					    "tag": null,
					    "team_id": "foo",
					  },
					]
				`)
			})
		})

		it('overwrites existing artifact with same name', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				const a1 = UpsertArtifact.parse({
					team_id: 'foo',
					artifact_id: 'asdf',
					tag: null,
					size: 17,
					expires_on: new Date('2022-01-03').getTime(),
				} satisfies UpsertArtifact)
				await instance.upsertArtifact(a1)
				const stored = instance.getArtifact({ team_id: a1.team_id, artifact_id: a1.artifact_id })
				expect(stored).not.toBeNull()
				expect(stored?.team_id).toBe(a1.team_id)
				expect(stored?.artifact_id).toBe(a1.artifact_id)
				expect(stored?.size).toBe(a1.size)
				expect(stored?.expires_on).toBe(a1.expires_on)

				// Change size and expires_on
				a1.size = 64
				a1.expires_on = new Date('2023-06-20').getTime()

				await instance.upsertArtifact(a1)
				const stored2 = instance.getArtifact({ team_id: a1.team_id, artifact_id: a1.artifact_id })
				expect(stored2).not.toBeNull()
				expect(stored2?.team_id).toBe(a1.team_id)
				expect(stored2?.artifact_id).toBe(a1.artifact_id)
				expect(stored2?.size).toBe(a1.size)
				expect(stored2?.expires_on).toBe(a1.expires_on)
			})
		})
	})

	describe('getArtifacts()', () => {
		it('returns empty array if there are no artifacts', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				expect(instance.getArtifacts()).toStrictEqual([])
			})
		})
	})

	describe('getArtifact()', () => {
		it('only returns specified artifact', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				await instance.upsertArtifact(
					UpsertArtifact.parse({
						team_id: 'foo',
						artifact_id: 'asdf1',
						tag: null,
						size: 17,
						expires_on: new Date('2022-01-03').getTime(),
					} satisfies UpsertArtifact)
				)

				await instance.upsertArtifact(
					UpsertArtifact.parse({
						team_id: 'foo',
						artifact_id: 'asdf2',
						tag: null,
						size: 17,
						expires_on: new Date('2022-01-03').getTime(),
					} satisfies UpsertArtifact)
				)

				const artifacts = instance.getArtifacts()
				expect(artifacts.length).toBe(2)

				expect(instance.getArtifact({ team_id: 'foo', artifact_id: 'asdf1' }))
					.toMatchInlineSnapshot(`
						{
						  "_id": 1,
						  "artifact_id": "asdf1",
						  "expires_on": 1641168000000,
						  "hits": 0,
						  "size": 17,
						  "tag": null,
						  "team_id": "foo",
						}
					`)

				expect(instance.getArtifact({ team_id: 'foo', artifact_id: 'asdf2' }))
					.toMatchInlineSnapshot(`
						{
						  "_id": 2,
						  "artifact_id": "asdf2",
						  "expires_on": 1641168000000,
						  "hits": 0,
						  "size": 17,
						  "tag": null,
						  "team_id": "foo",
						}
					`)
			})
		})

		it('returns null if artifact does not exist', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				await instance.upsertArtifact(
					UpsertArtifact.parse({
						team_id: 'foo',
						artifact_id: 'asdf1',
						tag: null,
						size: 17,
						expires_on: new Date('2022-01-03').getTime(),
					} satisfies UpsertArtifact)
				)

				expect(
					instance.getArtifact({
						team_id: 'bar',
						artifact_id: 'asdf1',
					})
				).toBeNull()
			})
		})
	})

	describe('purgeArtifacts()', async () => {
		it('does not purge artifacts that expire in the future', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				await instance.upsertArtifact(
					UpsertArtifact.parse({
						team_id: 'foo',
						artifact_id: 'asdf1',
						tag: null,
						size: 17,
						expires_on: Date.now() + ms('1 day'),
					} satisfies UpsertArtifact)
				)

				expect(instance.getArtifacts().length).toBe(1)
			})
		})

		it('purges expired artifacts', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				await instance.upsertArtifact(
					UpsertArtifact.parse({
						team_id: 'foo',
						artifact_id: 'asdf1',
						tag: null,
						size: 17,
						expires_on: Date.now() + ms('1 day'),
					} satisfies UpsertArtifact)
				)
				await instance.upsertArtifact(
					UpsertArtifact.parse({
						team_id: 'foo',
						artifact_id: 'asdf2',
						tag: null,
						size: 17,
						expires_on: Date.now() - ms('1 day'),
					} satisfies UpsertArtifact)
				)

				const key = getArtifactPath('foo', 'asdf2')
				await env.R2.put(key, 'bar')

				expect(await (await env.R2.get(key))?.text()).toBe('bar')
				expect(instance.getArtifacts().length).toBe(2)

				expect(await instance.purgeArtifacts()).toBe(1) // one artifact deleted
				expect(instance.getArtifacts().length).toBe(1)
				expect(await env.R2.get(key)).toBeNull()
			})
		})

		it('purges > 1000 expired artifacts despite request limits', async () => {
			// todo: Will this actually work in prod? I'm not so sure...
			await runInDurableObject(getDO(), async (instance) => {
				const queue = new PQueue({ concurrency: 100 })
				for (let i = 0; i < 1050; i++) {
					void queue.add(async () => {
						await instance.upsertArtifact(
							UpsertArtifact.parse({
								team_id: 'foo',
								artifact_id: `asdf-${i}`,
								tag: null,
								size: 17,
								expires_on: Date.now() - ms('1 day'),
							} satisfies UpsertArtifact)
						)
						// note: Disabled KV puts to make this test faster
						// const key = getArtifactPath('foo', `asdf-${i}`)
						// await env.KV.put(key, `bar-${i}`)
						// expect(await env.KV.get(key)).toBe(`bar-${i}`)
					})
				}
				await queue.onIdle()
				expect(instance.getArtifacts().length).toBe(1050)

				expect(await instance.purgeArtifacts()).toBe(1050)
				expect(instance.getArtifacts().length).toBe(0)
			})
		})

		it('purges all artifacts when purgeAll=true', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				await instance.upsertArtifact(
					UpsertArtifact.parse({
						team_id: 'foo',
						artifact_id: 'asdf1',
						tag: null,
						size: 17,
						expires_on: Date.now() + ms('2 years'),
					} satisfies UpsertArtifact)
				)
				const key = getArtifactPath('foo', 'asdf1')
				await env.R2.put(key, 'bar')

				expect(await instance.purgeArtifacts(), 'should not delete non-expired artifact').toBe(0)
				expect(await (await env.R2.get(key))?.text()).toBe('bar')
				expect(instance.getArtifacts().length).toBe(1)

				expect(await instance.purgeArtifacts({ purgeAll: true })).toBe(1)
				expect(instance.getArtifacts().length).toBe(0)
				expect(await env.R2.get(key)).toBeNull()
			})
		})
	})

	describe('updateArtifactExpiration()', () => {
		it('does not update rows that do not match', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				await instance.upsertArtifact(
					UpsertArtifact.parse({
						team_id: 'foo',
						artifact_id: 'asdf1',
						tag: null,
						size: 17,
						expires_on: 50,
					} satisfies UpsertArtifact)
				)
				expect(
					await instance.updateArtifactExpiration({
						team_id: 'bar',
						artifact_id: 'asdf1',
						expires_on: 100,
					}),
					'should not write any rows'
				).toBe(0)
				expect(instance.getArtifacts().length).toBe(1)
				expect(instance.getArtifacts()[0].expires_on).toBe(50)
				expect(instance.getArtifacts()[0].hits).toBe(0)
			})
		})

		it('updates expiration', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				await instance.upsertArtifact(
					UpsertArtifact.parse({
						team_id: 'foo',
						artifact_id: 'asdf1',
						tag: null,
						size: 17,
						expires_on: 50,
					} satisfies UpsertArtifact)
				)
				expect(
					await instance.updateArtifactExpiration({
						team_id: 'foo',
						artifact_id: 'asdf1',
						expires_on: 100,
					}),
					'should write one row'
				).toBe(2) // I think it's 2 because it's updating the index
				expect(instance.getArtifacts().length).toBe(1)
				expect(instance.getArtifacts()[0].expires_on).toBe(100)
				expect(instance.getArtifacts()[0].hits).toBe(1)
			})
		})
	})

	describe('getStats()', () => {
		it('returns zeros when there are no artifacts', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				expect(await instance.getStats()).toMatchInlineSnapshot(`
					{
					  "all_time": {
					    "artifacts": 0,
					    "event_hits": 0,
					    "event_misses": 0,
					    "hits": 0,
					    "misses": 0,
					    "size": 0,
					  },
					  "db_size": 24576,
					  "max_size": null,
					  "total_artifacts": 0,
					  "total_hits": null,
					  "total_size": null,
					  "total_teams": 0,
					}
				`)
			})
		})

		it('returns stats for artifacts', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				await instance.upsertArtifact(
					UpsertArtifact.parse({
						team_id: 'foo',
						artifact_id: 'asdf1',
						tag: null,
						size: 17,
						expires_on: 50,
					} satisfies UpsertArtifact)
				)

				await instance.upsertArtifact(
					UpsertArtifact.parse({
						team_id: 'foo',
						artifact_id: 'asdf2',
						tag: null,
						size: 17,
						expires_on: 50,
					} satisfies UpsertArtifact)
				)

				await instance.updateArtifactExpiration({
					team_id: 'foo',
					artifact_id: 'asdf2',
					expires_on: 75,
				})
				// These don't get counted here so we need to set them manually
				await instance.countStat('hits', 2)
				await instance.countStat('misses', 3)

				expect(await instance.getStats()).toMatchInlineSnapshot(`
					{
					  "all_time": {
					    "artifacts": 2,
					    "event_hits": 1,
					    "event_misses": 0,
					    "hits": 2,
					    "misses": 3,
					    "size": 34,
					  },
					  "db_size": 24576,
					  "max_size": 17,
					  "total_artifacts": 2,
					  "total_hits": 1,
					  "total_size": 34,
					  "total_teams": 1,
					}
				`)
			})
		})
	})

	describe('getAllTimeStats()', () => {
		it('returns recorded stats', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				expect((await instance.getAllTimeStats()).hits).toBe(0)

				await instance.countStat('hits', 1)
				expect((await instance.getAllTimeStats()).hits).toBe(1)

				await instance.countStat('hits', 2)
				expect((await instance.getAllTimeStats()).hits).toBe(3)
			})
		})
	})

	describe('ListArtifacts()', () => {
		it('lists artifacts', async () => {
			await runInDurableObject(getDO(), async (instance) => {
				await instance.upsertArtifact(
					UpsertArtifact.parse({
						team_id: 'foo',
						artifact_id: 'asdf1',
						tag: null,
						size: 17,
						expires_on: 50,
					} satisfies UpsertArtifact)
				)
				expect(instance.listArtifacts()).toMatchInlineSnapshot(`
					[
					  {
					    "artifact_id": "asdf1",
					    "team_id": "foo",
					  },
					]
				`)
			})
		})
	})

	test('indexes snapshot', async () => {
		await runInDurableObject(getDO(), async (instance) => {
			expect(
				instance.sql
					.exec(
						`SELECT * 
FROM sqlite_master 
WHERE type = 'index';`
					)
					.toArray()
			).toMatchInlineSnapshot(`
				[
				  {
				    "name": "sqlite_autoindex_artifacts_1",
				    "rootpage": 3,
				    "sql": null,
				    "tbl_name": "artifacts",
				    "type": "index",
				  },
				  {
				    "name": "idx_team_artifact_id",
				    "rootpage": 4,
				    "sql": "CREATE INDEX idx_team_artifact_id
							on artifacts (team_id, artifact_id)
						",
				    "tbl_name": "artifacts",
				    "type": "index",
				  },
				  {
				    "name": "idx_expires_on",
				    "rootpage": 5,
				    "sql": "CREATE INDEX idx_expires_on
							on artifacts (expires_on)
						",
				    "tbl_name": "artifacts",
				    "type": "index",
				  },
				]
			`)
		})
	})
})
