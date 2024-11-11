import { Redis } from '@upstash/redis/cloudflare'
import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { z } from 'zod'

import {
	getTracingConfig,
	useAxiomLogger,
	useDefaultCors,
	useMeta,
	useNotFound,
	useOnError,
	useSentry,
	validateEnv,
} from '@repo/hono-helpers'
import { instrument, trace } from '@repo/otel'

import { artifactApp } from './artifacts'
import { initSentry } from './helpers/sentry'

import type { App, Bindings } from './types'

export { TurboCache } from './TurboCache'

const app = new Hono<App>()
	.use(
		'*', // Middleware
		useMeta,
		useDefaultCors(),
		useSentry(initSentry, 'http.server'),
		useAxiomLogger
	)

	// validate env
	.use('*', async (c, next) => {
		const APIToken = z.string().startsWith('wrkr_')
		validateEnv([
			[c.env.TURBO_TOKEN, APIToken, 'TURBO_TOKEN'],
			[c.env.UPSTASH_REDIS_REST_TOKEN, z.string().startsWith('srh_'), 'UPSTASH_REDIS_REST_TOKEN'],
			[c.env.UPSTASH_REDIS_REST_URL, 'url', 'UPSTASH_REDIS_REST_URL'],
			[c.env.R2, 'r2Bucket', 'R2 bucket'],
		])
		await next()
	})

	// Set globals
	.use('*', async (c, next) => {
		c.set('tracer', trace.getTracer('default'))

		const redis = new Redis({
			url: 'https://redis-mini.uuid.rocks',
			token: c.env.UPSTASH_REDIS_REST_TOKEN,
		})
		c.set('redis', redis)
		await next()
	})

	// Hooks
	.onError(useOnError())
	.notFound(useNotFound())

	// Routes
	.get('/test', async (c) => {
		return c.json({ message: 'hello world!!!1' })
	})

	// Auth remaining routes
	.use('*', (c, next) => {
		const bearer = bearerAuth({ token: c.env.TURBO_TOKEN })
		return bearer(c, next)
	})

	.route('/', artifactApp)

export const handler = {
	fetch: app.fetch,
} satisfies ExportedHandler<Bindings>

export default instrument(handler, getTracingConfig<App>())
