import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { describe, expect, it, test } from 'vitest'
import { z } from 'zod'

import type { Env } from 'hono'

interface TestHarness<T extends Env> {
	app: Hono<T>
	getResponse: (path: string, init?: RequestInit) => Promise<Response>
}

function setupHonoTest<T extends Env>(): TestHarness<T> {
	const app = new Hono<T>()
	return {
		app,
		getResponse: async (path: string, init?: RequestInit) =>
			app.fetch(new Request(`http://localhost${path}`, init)),
	}
}

describe('handlers', () => {
	describe('c.text()', () => {
		test('existing route', async () => {
			const { app, getResponse } = setupHonoTest()
			app.get('/foo', async (c) => c.text('bar'))
			const res = await getResponse('/foo')
			expect(await res.text()).toBe('bar')
			expect(res.status).toBe(200)
		})

		test('non-existent route', async () => {
			const { app, getResponse } = setupHonoTest()
			app.get('/', async (c) => c.text('ok'))
			const res = await getResponse('/foo')
			expect(await res.text()).toBe('404 Not Found')
			expect(res.status).toBe(404)
		})
	})

	describe('c.json()', () => {
		test('existing route', async () => {
			const { app, getResponse } = setupHonoTest()
			app.get('/foo', async (c) => c.json({ foo: 'bar' }))
			const res = await getResponse('/foo')
			expect(await res.json()).toMatchInlineSnapshot(`
				{
				  "foo": "bar",
				}
			`)
			expect(res.status).toBe(200)
		})
	})
})

describe('middleware', () => {
	describe('zValidator', () => {
		describe('json', () => {
			const JsonSchema = z.object({ foo: z.string() })
			test('happy path', async () => {
				const { app, getResponse } = setupHonoTest()
				app.post('/foo', zValidator('json', JsonSchema), async (c) => {
					const { foo } = c.req.valid('json')
					return c.json({ foo })
				})
				const res = await getResponse('/foo', {
					method: 'POST',
					body: JSON.stringify({ foo: 'foo1' }),
					headers: { 'Content-Type': 'application/json' },
				})
				expect(await res.json()).toMatchInlineSnapshot(`
					{
					  "foo": "foo1",
					}
				`)
				expect(res.status).toBe(200)
			})

			test('non-json content-type', async () => {
				const { app, getResponse } = setupHonoTest()
				app.post('/foo', zValidator('json', JsonSchema), async (c) => {
					const { foo } = c.req.valid('json')
					return c.json(foo)
				})
				const res = await getResponse('/foo', {
					method: 'POST',
					body: JSON.stringify({ foo: 'foo1' }),
				})
				expect(await res.text()).toMatchInlineSnapshot(
					`"Invalid HTTP header: Content-Type=text/plain;charset=UTF-8"`
				)
				expect(res.status).toBe(400)
			})

			test('non-json body', async () => {
				const { app, getResponse } = setupHonoTest()
				app.post('/foo', zValidator('json', JsonSchema), async (c) => {
					const { foo } = c.req.valid('json')
					return c.json(foo)
				})
				const res = await getResponse('/foo', {
					method: 'POST',
					body: '{"foo": foo1"', // invalid json
					headers: { 'Content-Type': 'application/json' },
				})
				expect(await res.text()).toMatchInlineSnapshot(`"Malformed JSON in request body"`)
				expect(res.status).toBe(400)
			})

			test('invalid json value type', async () => {
				const { app, getResponse } = setupHonoTest()
				app.post('/foo', zValidator('json', JsonSchema), async (c) => {
					const { foo } = c.req.valid('json')
					return c.json({ foo })
				})
				const res = await getResponse('/foo', {
					method: 'POST',
					body: JSON.stringify({ foo: 123 }),
					headers: { 'Content-Type': 'application/json' },
				})
				expect(await res.json()).toMatchInlineSnapshot(`
					{
					  "error": {
					    "issues": [
					      {
					        "code": "invalid_type",
					        "expected": "string",
					        "message": "Expected string, received number",
					        "path": [
					          "foo",
					        ],
					        "received": "number",
					      },
					    ],
					    "name": "ZodError",
					  },
					  "success": false,
					}
				`)
				expect(res.status).toBe(400)
			})
		})

		describe('param', () => {
			test('happy path', async () => {
				const { app, getResponse } = setupHonoTest()
				app.get('/foo/:bar', zValidator('param', z.object({ bar: z.string() })), async (c) => {
					const { bar } = c.req.valid('param')
					return c.text(bar)
				})
				const res = await getResponse('/foo/bar1')
				expect(await res.text()).toBe('bar1')
				expect(res.status).toBe(200)
			})

			test('happy path (multiple params)', async () => {
				const { app, getResponse } = setupHonoTest()
				app.get(
					'/foo/:bar/:baz',
					zValidator('param', z.object({ bar: z.string(), baz: z.string() })),
					async (c) => {
						const { bar, baz } = c.req.valid('param')
						return c.text(`${bar}, ${baz}`)
					}
				)
				const res = await getResponse('/foo/bar/baz')
				expect(await res.text()).toBe('bar, baz')
				expect(res.status).toBe(200)
			})

			test('happy path (multiple params, mixed types)', async () => {
				const { app, getResponse } = setupHonoTest()
				app.get(
					'/foo/:bar/:baz/:qux',
					zValidator('param', z.object({ bar: z.string(), baz: z.string(), qux: z.string() })),
					async (c) => {
						const { bar, baz, qux } = c.req.valid('param')
						return c.text(`${bar}, ${baz}, ${qux}`)
					}
				)
				const res = await getResponse('/foo/bar1/true/123')
				expect(await res.text()).toBe('bar1, true, 123')
				expect(res.status).toBe(200)
			})

			test('happy path (coerce)', async () => {
				const { app, getResponse } = setupHonoTest()
				app.get(
					'/foo/:bar',
					zValidator('param', z.object({ bar: z.coerce.number() })),
					async (c) => {
						const { bar } = c.req.valid('param')
						expect(typeof bar).toBe('number')
						return c.text(bar.toString())
					}
				)
				const res = await getResponse('/foo/123')
				expect(await res.text()).toBe('123')
				expect(res.status).toBe(200)
			})

			test('missmatched param names', async () => {
				const { app, getResponse } = setupHonoTest()
				app.get('/foo/:bar', zValidator('param', z.object({ baz: z.string() })), async (c) => {
					const { baz } = c.req.valid('param')
					return c.text(baz)
				})
				const res = await getResponse('/foo/bar1')
				expect(await res.json()).toMatchInlineSnapshot(`
					{
					  "error": {
					    "issues": [
					      {
					        "code": "invalid_type",
					        "expected": "string",
					        "message": "Required",
					        "path": [
					          "baz",
					        ],
					        "received": "undefined",
					      },
					    ],
					    "name": "ZodError",
					  },
					  "success": false,
					}
				`)
				// Wish this could be a 500 :(
				expect(res.status).toBe(400)
			})
		})

		describe('query', () => {
			const QuerySchema = z.object({ foo: z.string() })
			test('happy path', async () => {
				const { app, getResponse } = setupHonoTest()
				app.get('/foo', zValidator('query', QuerySchema), async (c) => {
					const { foo } = c.req.valid('query')
					return c.json({ foo })
				})
				let res = await getResponse('/foo?foo=bar')
				expect(await res.json()).toMatchInlineSnapshot(`
					{
					  "foo": "bar",
					}
				`)
				expect(res.status).toBe(200)

				res = await getResponse('/foo?foo=123')
				expect(await res.json(), 'numbers are strings').toMatchInlineSnapshot(`
					{
					  "foo": "123",
					}
				`)
				expect(res.status).toBe(200)

				res = await getResponse('/foo?foo=123')
				expect(await res.json(), 'booleans are strings').toMatchInlineSnapshot(`
					{
					  "foo": "123",
					}
				`)
				expect(res.status).toBe(200)
			})

			test('invalid query', async () => {
				const { app, getResponse } = setupHonoTest()
				app.get('/foo', zValidator('query', QuerySchema), async (c) => {
					const { foo } = c.req.valid('query')
					return c.json({ foo })
				})
				const res = await getResponse('/foo?baz=qux')
				expect(await res.json()).toMatchInlineSnapshot(`
					{
					  "error": {
					    "issues": [
					      {
					        "code": "invalid_type",
					        "expected": "string",
					        "message": "Required",
					        "path": [
					          "foo",
					        ],
					        "received": "undefined",
					      },
					    ],
					    "name": "ZodError",
					  },
					  "success": false,
					}
				`)
				expect(res.status).toBe(400)
			})
		})

		describe('multiple zValidators', () => {
			test('happy path', async () => {
				const { app, getResponse } = setupHonoTest()
				app.get(
					'/foo/:bar',
					zValidator('param', z.object({ bar: z.string() })),
					zValidator('query', z.object({ baz: z.string() })),
					async (c) => {
						const { bar } = c.req.valid('param')
						const { baz } = c.req.valid('query')
						return c.text(`${bar}, ${baz}`)
					}
				)
				const res = await getResponse('/foo/bar1?baz=baz1')
				expect(await res.text()).toBe('bar1, baz1')
				expect(res.status).toBe(200)
			})
		})
	})

	describe('use() middleware', () => {
		const requestPaths = [
			['/', 404],
			['/foo', 200],
			['/foo/bar', 404],
			['/foo123', 404],
			['/444', 404],
			['/true', 404],
		] as const
		const expectedRes = { 200: 'ok', 404: '404 Not Found' }

		describe(`always runs if no path is given`, () => {
			for (const [path, expectedStatus] of requestPaths) {
				test(`GET ${path}`, async () => {
					const { app, getResponse } = setupHonoTest()
					let ran = false
					app
						.use(async (_c, next) => {
							ran = true
							await next()
						})
						.get('/foo', async (c) => c.text('ok'))

					const res = await getResponse(path)
					expect(ran).toBe(true)
					expect(await res.text()).toBe(expectedRes[expectedStatus])
					expect(res.status).toBe(expectedStatus)
				})
			}
		})

		describe(`always runs with wildcard path`, () => {
			for (const wildcardPath of ['*', '/*']) {
				describe(`use('${wildcardPath}')`, () => {
					for (const [path, expectedStatus] of requestPaths) {
						test(`GET ${path}`, async () => {
							const { app, getResponse } = setupHonoTest()
							let ran = false
							app
								.use(wildcardPath, async (_c, next) => {
									ran = true
									await next()
								})
								.get('/foo', async (c) => c.text('ok'))

							const res = await getResponse(path)
							expect(ran).toBe(true)
							expect(await res.text()).toBe(expectedRes[expectedStatus])
							expect(res.status).toBe(expectedStatus)
						})
					}
				})
			}
		})

		it(`doesn't run if middleware returns response`, async () => {
			const { app, getResponse } = setupHonoTest()
			let ranMiddleware = ''
			app
				.use('*', async (c, _next) => {
					ranMiddleware += 'a'
					return c.text('middleware a')
				})
				.use('*', async (c, _next) => {
					ranMiddleware += 'b'
					return c.text('middleware b')
				})
				.get('/foo', async (c) => {
					ranMiddleware += 'c'
					return c.text('foo1')
				})
			const res = await getResponse('/foo')
			expect(await res.text()).toBe('middleware a')
			expect(res.status).toBe(200)
			expect(ranMiddleware).toBe('a')
		})

		it(`doesn't run if middleware throws error`, async () => {
			const { app, getResponse } = setupHonoTest()
			let ranMiddleware = ''
			app
				.use('*', async (_c, next) => {
					ranMiddleware += 'a'
					await next()
				})
				.use('*', async (_c, _next) => {
					ranMiddleware += 'b'
					throw new Error('middleware b error')
				})
				.get('/foo', async (c) => {
					ranMiddleware += 'c'
					return c.text('foo1')
				})
			const res = await getResponse('/foo')
			expect(await res.text()).toBe('Internal Server Error')
			expect(res.status).toBe(500)
			expect(ranMiddleware).toBe('ab')
		})
	})

	describe('get() middleware', () => {
		test('only runs for get requests', async () => {
			const { app, getResponse } = setupHonoTest()
			let ran = false
			app
				.get('*', async (_c, next) => {
					ran = true
					await next()
				})
				.get('/foo', async (c) => c.text('ok'))

			const res = await getResponse('/foo')
			expect(ran).toBe(true)
			expect(await res.text()).toBe('ok')
			expect(res.status).toBe(200)

			// Make sure it doesn't run for POST requests
			ran = false
			const res2 = await getResponse('/foo', {
				method: 'POST',
			})
			expect(ran).toBe(false)
			expect(await res2.text()).toBe('404 Not Found')
			expect(res2.status).toBe(404)
		})
	})

	describe('Variables', () => {
		test('pass vars between handlers', async () => {
			type App = {
				Variables: {
					foo?: string
					middlewareCount?: number
				}
			}
			const { app, getResponse } = setupHonoTest<App>()

			let middlewareCount = 0
			app
				.use('*', async (c, next) => {
					expect(c.var.middlewareCount).toBe(undefined)
					expect(c.get('middlewareCount')).toBe(undefined)

					expect(c.var.foo).toBe(undefined)
					expect(c.get('foo')).toBe(undefined)

					c.set('middlewareCount', 1)
					expect(c.var.middlewareCount).toBe(1)
					expect(c.get('middlewareCount')).toBe(1)
					c.set('foo', 'bar')
					await next()
				})

				.use('*', async (c, next) => {
					const current = c.var.middlewareCount ?? 0
					expect(current).toBe(1)
					expect(c.get('middlewareCount')).toBe(1)
					c.set('middlewareCount', current + 1)

					expect(c.var.middlewareCount).toBe(2)
					expect(c.get('middlewareCount')).toBe(2)

					expect(c.var.foo).toBe('bar')
					await next()
				})

				.get('/foo', async (c) => {
					const current = c.var.middlewareCount ?? 0
					expect(current).toBe(2)
					expect(c.get('middlewareCount')).toBe(2)
					c.set('middlewareCount', current + 1)

					expect(c.var.middlewareCount).toBe(3)
					expect(c.get('middlewareCount')).toBe(3)

					expect(c.var.foo).toBe('bar')
					middlewareCount = c.var.middlewareCount ?? 0
					return c.text('ok')
				})

			const res = await getResponse('/foo')
			expect(await res.text()).toBe('ok')
			expect(res.status).toBe(200)
			expect(middlewareCount).toBe(3)
		})
	})
})
