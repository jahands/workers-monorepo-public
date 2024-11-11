import { Hono } from 'hono'

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

import { router } from './app'
import { now } from './app/api/util'
import { initSentry } from './helpers/sentry'

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

	// Routes

	// Healthcheck / keepalive
	.get('/_health/ladle-indorse-anathema', async (c) => {
		let start = Date.now()
		const res = await c.env.D1.prepare(/* sql */ `insert into healthcheck (created_on) values (?)`)
			.bind(now())
			.run()
		let duration = Date.now() - start
		c.var.logger?.log(`d1 healthcheck insert: ${duration}ms`, { duration })
		if (!res.success) {
			throw newHTTPException(500, `Failed to insert healthcheck: ${JSON.stringify(res)}`)
		}

		start = Date.now()
		const res2 = await c.env.D1.prepare(/* sql */ `delete from healthcheck`).run()
		duration = Date.now() - start
		c.var.logger?.log(`d1 healthcheck delete: ${duration}ms`, { duration })
		if (!res2.success) {
			throw newHTTPException(500, `Failed to delete healthcheck: ${JSON.stringify(res2)}`)
		}

		return c.text('ok')
	})

	.mount('/', router.handle)

const handler = {
	fetch: app.fetch,
} satisfies ExportedHandler<Bindings>

export default instrument(handler, getTracingConfig<App>())
