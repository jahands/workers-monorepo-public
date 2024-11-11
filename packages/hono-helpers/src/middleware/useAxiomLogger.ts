import { withLogTags } from 'workers-tagged-logger'

import { AxiomLogger, logger } from '@repo/logging'

import { validateEnv } from '../helpers/env'
import { getRequestLogData } from '../helpers/request'

import type { Context, Next } from 'hono'
import type { HonoApp } from '../types'

/** Adds logger for environment 'production' only */
export async function useAxiomLogger<T extends HonoApp>(c: Context<T>, next: Next): Promise<void> {
	if (c.env.ENVIRONMENT === 'production') {
		validateEnv([
			[c.env.AXIOM_DATASET, 'stringMin1', 'AXIOM_DATASET'],
			[c.env.AXIOM_DATASET_OTEL, 'stringMin1', 'AXIOM_DATASET_OTEL'],
			[c.env.AXIOM_API_KEY, 'stringMin1', 'AXIOM_API_KEY (optional)'],
		])

		const cfTrace = c.get('cfTrace')
		const axiomLogger = new AxiomLogger({
			cfTrace,
			ctx: c.executionCtx,
			dataset: c.env.AXIOM_DATASET,
			axiomApiKey: c.env.AXIOM_API_KEY,
			sentry: c.get('sentry'),
			tx: c.get('tx'),
			flushAfterMs: 60_000,
			tags: {
				server: 'workers',
				source: c.env.NAME,
				handler: 'fetch',
				invocationId: c.get('invocationId'),
				env: c.env.ENVIRONMENT ?? 'development',
				release: c.env.SENTRY_RELEASE,
				cf: {
					colo: cfTrace?.colo,
					loc: cfTrace?.loc,
				},
			},
		})
		c.set('logger', axiomLogger)
	}

	await withLogTags({ source: c.env.NAME }, async () => {
		logger.setTags({
			handler: 'fetch',
			env: c.env.ENVIRONMENT,
			release: c.env.SENTRY_RELEASE,
		})
		await next()

		const axiomLogger = c.get('logger')
		if (axiomLogger) {
			// Log the request
			const end = Date.now()
			const duration = end - c.var.requestStartTime
			const logRequest = async () => {
				axiomLogger.info(`HTTP ${c.req.method} ${c.req.path}`, {
					request: getRequestLogData(c, c.var.requestStartTime),

					response: {
						status: c.res.status,
						timestamp: new Date(end).toISOString(),
					},
					duration,
					type: 'http_request',
				})
			}
			c.var.txWaitUntil.push(logRequest()) // do it in the background

			// Slight hack to wait for all other background tasks
			// to finish before flushing logs
			const existingWaitUntil = c.var.txWaitUntil
			const waitUntilDone = Promise.allSettled(existingWaitUntil)
			const waitAndFlush = async (): Promise<void> => {
				await waitUntilDone
				await axiomLogger.flushAndStop()
			}
			// This gets waitUntil()'d in Sentry middleware
			c.var.txWaitUntil.push(waitAndFlush())
		}
	})
}
