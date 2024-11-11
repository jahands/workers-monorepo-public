import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import pRetry from 'p-retry'
import { z } from 'zod'

import {
	getTracingConfig,
	newHTTPException,
	useAxiomLogger,
	useMeta,
	useNotFound,
	useOnError,
	useSentry,
} from '@repo/hono-helpers'
import { instrument } from '@repo/otel'

import { getAboutPage } from './about'
import { initSentry } from './helpers/sentry'
import { PyMirrorDB, Sha256 } from './types'

import type { Context } from 'hono'
import type { App, Bindings } from './types'

const app = new Hono<App>()
	.use(
		'*', // Middleware
		useMeta,
		useSentry(initSentry, 'http.server'),
		useAxiomLogger
	)

	// Hooks
	.onError(useOnError())
	.notFound(useNotFound())

	.get('/', async (c) => getAboutPage(c))

	.get('/favicon.ico', async (c) => {
		const res = await pRetry(async () => {
			return await c.env.R2.get('api/favicon.ico')
		})
		if (!res) throw newHTTPException(500, 'unable to fetch favicon')
		c.header('Cache-Control', 'public, max-age=3600')
		c.header('Content-Type', 'image/x-icon')
		c.header('Content-Length', res.size.toString())
		return c.body(res.body)
	})

	.get('/dist/python/:sha2', zValidator('param', z.object({ sha2: Sha256 })), async (c) => {
		const { sha2 } = c.req.valid('param')
		const db = await getPyMirrorDB(c)
		const urlRaw = db[sha2]
		if (!urlRaw) {
			return c.notFound()
		}

		const url = new URL(urlRaw)
		const pathWithFragment = url.pathname.slice(1) + url.hash
		// Redirect to dl endpoint
		return c.redirect(`/dl/python/${sha2}/${pathWithFragment}`, 302)
	})

	.get(
		'/dl/python/:sha2/:filePath{.+}',
		zValidator('param', z.object({ sha2: Sha256, filePath: z.string() })),
		async (c) => {
			const { sha2 } = c.req.valid('param')
			const db = await getPyMirrorDB(c)
			const url = db[sha2]
			if (!url) {
				return c.notFound()
			}
			const res = await fetch(url, {
				cf: {
					cacheEverything: true,
					cacheTtlByStatus: {
						'200-299': 31536000, // 1 year
					},
				},
			})
			if (res.ok) {
				c.header('Cache-Control', 'public, max-age=31536000') // 1 year
				return c.body(res.body, res)
			}
			c.var.logger?.error(`Failed to fetch: ${res.status}`, {
				msc: {
					resText: await res.text(),
				},
			})
			throw newHTTPException(500, `Failed to fetch: ${res.status}`)
		}
	)

	.get('/node/:filePath{.+}', async (c) => {
		const filePath = c.req.param('filePath')
		const url = `https://nodejs.org/dist/${filePath}`
		const res = await fetch(url, {
			cf: {
				cacheEverything: true,
				cacheTtlByStatus: {
					'200-299': 2629746, // 1 month
				},
			},
		})
		return c.body(res.body, res)
	})

async function getPyMirrorDB(c: Context<App>): Promise<PyMirrorDB> {
	const res = await pRetry(() => c.env.R2.get('api/database.json'), {
		retries: 3,
		minTimeout: 100,
		randomize: true,
	})
	if (!res) throw new Error('Failed to get database')
	return PyMirrorDB.parse(await res.json())
}

const handler = {
	fetch: app.fetch,
} satisfies ExportedHandler<Bindings>

export default instrument(handler, getTracingConfig<App>())
