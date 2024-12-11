import { Hono } from 'hono'
import pRetry from 'p-retry'

import {
	useAuth,
	useAxiomLogger,
	useDefaultCors,
	useMeta,
	useNotFound,
	useOnError,
	useSentry,
} from '@repo/hono-helpers'

import { initSentry } from './helpers/sentry'

import type { Options as RetryOptions } from 'p-retry'
import type { App, Bindings } from './types'

const retryOpts: RetryOptions = {
	retries: 3,
	randomize: true,
}

const app = new Hono<App>()
	.use(
		'*',
		// add some metadata used in traces
		useMeta,
		useDefaultCors(),
		useSentry(initSentry, 'http.server'),
		useAxiomLogger
	)

	// Hooks
	.onError(useOnError())
	.notFound(useNotFound())

	// Auth all routes
	.use('*', async (c, next) =>
		useAuth({
			token: c.env.API_KEY,
			queryKey: true,
			headers: ['x-api-key'],
		})(c, next)
	)

	.get('/v1/:key{.*}', async (c) => {
		const key = c.req.param('key')
		const kvRes = await pRetry(async () => {
			return await c.env.KV.get(key, {
				// Allow KV to cache at edge for up to 1 hour for faster reads.
				// I don't write the same key often so don't need to worry about
				// stale data.
				cacheTtl: 60 * 60,
			})
		}, retryOpts)

		if (!kvRes) {
			return c.notFound()
		}

		// Tell clients not to cache it
		c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
		const response = c.text(kvRes)

		return response
	})

	.put(async (c) => {
		const key = c.req.param('key')

		const body = await c.req.arrayBuffer()

		await pRetry(async () => {
			await c.env.KV.put(key, body, {
				expirationTtl: 60 * 60 * 24, // 24 hours
			})
		}, retryOpts)
		return c.body(null, 200)
	})

	.delete(async (c) => {
		const key = c.req.param('key')

		await pRetry(async () => {
			await c.env.KV.delete(key)
		}, retryOpts)
		return c.body(null, 200)
	})

export const handler = {
	fetch: app.fetch,
} satisfies ExportedHandler<Bindings>

export default handler
