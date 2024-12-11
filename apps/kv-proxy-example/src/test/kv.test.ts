// test/index.spec.ts
import { createExecutionContext, env, SELF, waitOnExecutionContext } from 'cloudflare:test'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { handler as worker } from '../index'

import type { Bindings } from '../types'

declare module 'cloudflare:test' {
	interface ProvidedEnv extends Bindings {}
}

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>

describe('kv-proxy Worker', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('404 for non-existent key (unit style)', async () => {
		const req = new IncomingRequest('https://example.com/v1/key1?key=password')
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext()
		const res = await worker.fetch(req, env, ctx)
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx)
		expect(res.status).toBe(404)
		expect(await res.json()).toMatchInlineSnapshot(`
			{
			  "error": {
			    "message": "not found",
			  },
			  "success": false,
			}
		`)
	})

	it('404 for non-existent key (unit style with mocks)', async () => {
		const spy = vi.spyOn(env.KV, 'get')
		expect(spy.getMockName()).toBe('get')
		spy.mockImplementationOnce(async () => Promise.resolve(null))
		const req = new IncomingRequest('https://example.com/v1/key1?key=password')
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext()
		const res = await worker.fetch(req, env, ctx)
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx)
		// expect(res.status).toBe(404)
		expect(await res.json()).toMatchInlineSnapshot(`
			{
			  "error": {
			    "message": "not found",
			  },
			  "success": false,
			}
		`)
		expect(spy).toHaveBeenCalledTimes(1)
	})

	it('404 for non-existent key (integration style)', async () => {
		const res = await SELF.fetch('https://example.com/v1/key1?key=password')
		expect(res.status).toBe(404)
		expect(await res.json()).toMatchInlineSnapshot(`
			{
			  "error": {
			    "message": "not found",
			  },
			  "success": false,
			}
		`)
	})

	it('Stores key in kv', async () => {
		let res = await SELF.fetch('https://example.com/v1/key1?key=password', {
			method: 'PUT',
			body: 'value1',
		})
		expect(res.status).toBe(200)
		expect(await res.text()).toMatchInlineSnapshot(`""`)
		expect(await env.KV.get('key1')).toBe('value1')

		await env.KV.put('key1', 'value1')
		res = await SELF.fetch('https://example.com/v1/key1?key=password')
		expect(res.status).toBe(200)
		expect(await res.text()).toMatchInlineSnapshot(`"value1"`)
	})

	it('Retrieves key from kv', async () => {
		await env.KV.put('key1', 'value1')
		const res = await SELF.fetch('https://example.com/v1/key1?key=password')
		expect(res.status).toBe(200)
		expect(await res.text()).toMatchInlineSnapshot(`"value1"`)
	})
})
