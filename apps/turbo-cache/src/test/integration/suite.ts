import { inspect } from 'node:util'
import { env, runInDurableObject, SELF } from 'cloudflare:test'
import { datePlus } from 'itty-time'
import PQueue from 'p-queue'
import { ulid } from 'ulidx'
import { expect, test } from 'vitest'

import {
	ArtifactsStatsResponse,
	ListArtifactsResponse,
	ManualCacheBustResponse,
	UpsertArtifactResponse,
} from '../../artifacts'
import { getArtifactPath } from '../../path'
import { getTurboCache, UpsertArtifact } from '../../TurboCache'

import type { ArtifactRecord, TurboCache } from '../../TurboCache'

export function testSuite(): TestSuite {
	return new TestSuite()
}

class TestSuite {
	get test() {
		return test.extend<{ h: TestHarness }>({
			h: async ({ task: _task }, use) => {
				const team_id = `team_${ulid()}`
				const harness = new TestHarness(team_id)
				await use(harness)

				const queue = new PQueue({ concurrency: 10 })
				let hasMore = true
				while (hasMore) {
					const res = await env.R2.list({ prefix: `${team_id}/` })
					hasMore = res.truncated
					void queue.add(async () => res.objects.map((k) => env.R2.delete(k.key)))
				}
				await queue.onIdle()
				await harness.getDB().teardown()
			},
		})
	}

	get it() {
		return this.test
	}
}

interface RandomArtifactOptions {
	expired?: boolean
}

class TestHarness {
	constructor(readonly team_id: string) {}

	getDB(): DurableObjectStub<TurboCache> {
		return getTurboCache({ env, var: {} }, this.team_id)
	}

	randomArtifact(opts?: RandomArtifactOptions): UpsertArtifact {
		return UpsertArtifact.parse({
			team_id: this.team_id,
			artifact_id: `artifact_${ulid()}`,
			tag: null,
			size: 17,
			expires_on: opts?.expired ? new Date('2022-01-03').getTime() : datePlus('1 day').getTime(),
		} satisfies UpsertArtifact)
	}

	/**
	 * Insert a random artifact directly via DurableObject
	 * @param opts.expired Whether or not the artifact should be expired. @default false
	 * @returns The inserted artifact record
	 */
	async upsertArtifactInDB(
		opts?: RandomArtifactOptions & { value?: string }
	): Promise<ArtifactRecord> {
		const artifact = this.randomArtifact(opts)

		let gotArtifact: ArtifactRecord | null = null
		await runInDurableObject(getDO(this.team_id), async (instance) => {
			await instance.upsertArtifact(artifact)
			gotArtifact = instance.getArtifact(artifact)
			expect(gotArtifact).not.toBeNull()
			const key = getArtifactPath(this.team_id, artifact.artifact_id)
			await env.R2.put(key, opts?.value ?? `artifact_value_${ulid()}`)
			expect(await env.R2.get(key)).toBeTruthy()
		})
		if (gotArtifact === null) {
			throw new Error('failed to insert artifact')
		}
		return gotArtifact
	}

	async artifactExists(artifact: ArtifactRecord): Promise<boolean> {
		return (
			(await this.listArtifacts()).find(
				(a) => a == getArtifactPath(artifact.team_id, artifact.artifact_id)
			) !== undefined
		)
	}

	// ======================== //
	// ======== CLIENT ======== //
	// ======================== //

	private async doRequest(path: string, init?: RequestInit): Promise<Response> {
		const url = new URL(`https://example.com${path}`)
		if (!url.searchParams.has('teamId') && !url.searchParams.has('slug')) {
			url.searchParams.set('teamId', this.team_id)
		}
		const reqInit: RequestInit = init ?? {}
		const headers = new Headers()
		for (const [key, value] of Object.entries(reqInit.headers ?? {})) {
			headers.set(key, value)
		}
		if (!headers.has('authorization')) {
			headers.set('authorization', 'Bearer wrkr_password')
		}
		reqInit.headers = headers
		return await SELF.fetch(url.toString(), reqInit)
		// const ctx = createExecutionContext()
		// const res = await worker.fetch(new Request(url.toString(), reqInit), env, ctx)
		// await waitOnExecutionContext(ctx)
		// return res
	}

	/**
	 * POST /artifacts/:team_id/manual-cache-bust
	 */
	async manualCacheBust(): Promise<ManualCacheBustResponse> {
		const res = await this.doRequest(`/artifacts/${this.team_id}/manual-cache-bust`, {
			method: 'POST',
		})
		const body = ManualCacheBustResponse.parse(await res.json())
		assertOK(res, body)
		return body
	}

	/**
	 * GET /artifacts/:team_id/stats
	 */
	async getArtifactStats(): Promise<ArtifactsStatsResponse> {
		const res = await this.doRequest(`/artifacts/${this.team_id}/stats`)
		const body = ArtifactsStatsResponse.parse(await res.json())
		assertOK(res, body)
		return body
	}

	/**
	 * GET /v8/artifacts/list
	 */
	async listArtifacts(): Promise<ListArtifactsResponse> {
		const res = await this.doRequest(`/v8/artifacts/list`)
		const body = ListArtifactsResponse.parse(await res.json())
		assertOK(res, body)
		return body
	}

	/**
	 * put a random artifact
	 * PUT /v8/artifacts/:artifactID
	 */
	async upsertArtifact(
		artifact: Pick<UpsertArtifact, 'team_id' | 'artifact_id'>,
		artifactValue: string
	): Promise<UpsertArtifactResponse> {
		const res = await this.doRequest(
			`/v8/artifacts/${artifact.artifact_id}?teamId=${artifact.team_id}`,
			{
				method: 'PUT',
				body: artifactValue,
				headers: {
					'content-type': 'application/octet-stream',
				},
			}
		)
		const body = UpsertArtifactResponse.parse(await res.json())
		assertOK(res, body)
		return body
	}

	/**
	 * GET /v8/artifacts/:artifactID
	 */
	async getArtifact(artifact_id: string): Promise<{ status: number; body: string }> {
		const res = await this.doRequest(`/v8/artifacts/${artifact_id}?teamId=${this.team_id}`)
		const body = new TextDecoder().decode(await res.arrayBuffer())
		return { status: res.status, body }
	}
}

function assertOK(res: Response, body: any): void {
	if (res.ok) return
	throw new Error(`response not ok! got: ${res.status} with body: ${inspect(body)}`)
}

function getDO(name?: string): DurableObjectStub<TurboCache> {
	const id = name ? env.TURBOCACHE.idFromName(name) : env.TURBOCACHE.newUniqueId()
	return env.TURBOCACHE.get(id)
}
