import { SELF } from 'cloudflare:test'
import { describe, expect, test } from 'vitest'

import '..'

describe('auth', () => {
	const unauthorized = { error: { message: 'unauthorized' } }
	const notFound = { error: { message: 'not found' } }
	describe('401 for incorrect api key', async () => {
		test('query key', async () => {
			const res = await SELF.fetch('https://example.com/v1/eemailme-kv/key1?key=asdf')
			expect(res.status).toBe(401)
			expect(await res.json()).toMatchObject(unauthorized)
		})

		test('header', async () => {
			const res = await SELF.fetch('https://example.com/v1/eemailme-kv/key1', {
				headers: { 'x-api-key': 'asdf' },
			})
			expect(res.status).toBe(401)
			expect(await res.json()).toMatchObject(unauthorized)
		})
	})

	describe('401 for no api key', async () => {
		// empty key
		test('empty key', async () => {
			const res = await SELF.fetch('https://example.com/v1/eemailme-kv/key1?key=')
			expect(res.status).toBe(401)
			expect(await res.json()).toMatchObject(unauthorized)
		})

		// no key
		test('no key', async () => {
			const res = await SELF.fetch('https://example.com/v1/eemailme-kv/key1')
			expect(res.status).toBe(401)
			expect(await res.json()).toMatchObject(unauthorized)
		})

		// empty header
		test('empty header', async () => {
			const res = await SELF.fetch('https://example.com/v1/eemailme-kv/key1', {
				headers: { 'x-api-key': '' },
			})
			expect(res.status).toBe(401)
			expect(await res.json()).toMatchObject(unauthorized)
		})

		// no header
		test('no header', async () => {
			const res = await SELF.fetch('https://example.com/v1/eemailme-kv/key1')
			expect(res.status).toBe(401)
			expect(await res.json()).toMatchObject(unauthorized)
		})
	})

	describe('404 for correct api key (invalid route)', async () => {
		test('query key', async () => {
			const res = await SELF.fetch('https://example.com/non-existent-path?key=password')
			expect(res.status).toBe(404)
			expect(await res.json()).toMatchObject(notFound)
		})

		test('header', async () => {
			const res = await SELF.fetch('https://example.com/non-existent-path', {
				headers: { 'x-api-key': 'password' },
			})
			expect(res.status).toBe(404)
			expect(await res.json()).toMatchObject(notFound)
		})
	})
})
