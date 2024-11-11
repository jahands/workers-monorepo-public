import { Hono } from 'hono'

import {
	getTracingConfig,
	useAxiomLogger,
	useMeta,
	useNotFound,
	useOnError,
	useSentry,
} from '@repo/hono-helpers'
import { instrument } from '@repo/otel'

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

	.all('*', async (c) => {
		let body: string | undefined
		if (['PUT', 'POST'].includes(c.req.method)) {
			body = await c.req.text()
		}
		const url = new URL(c.req.url)
		const data = {
			method: c.req.method,
			url: c.req.url,
			path: url.pathname,
			host: url.host,
			headers: Object.fromEntries(c.req.raw.headers.entries()),
			body,
		}
		c.get('logger')?.info(`echoback request: ${url}`, {
			msc: data,
		})
		return c.json(data)
	})

const handler = {
	fetch: app.fetch,
} satisfies ExportedHandler<Bindings>

export default instrument(handler, getTracingConfig<App>())
