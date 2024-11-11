import '@sentry/tracing'

import { ulid } from 'ulidx'

import { getCFTrace } from '@repo/cftrace'
import { AxiomLogger } from '@repo/logging'

import { initQueueSentry } from './helpers/sentry'

import type { Transaction } from '@sentry/types'
import type { Toucan } from 'toucan-js'
import type { CFTrace } from '@repo/cftrace'
import type { LogTagsHandler } from '@repo/logging'
import type { Bindings } from './types'

/** App context that we pass everywhere so
 * that we aren't sending a bunch of vars all over the place
 */
export interface AppContext {
	sentry: Toucan | undefined
	env: Bindings
	ctx: ExecutionContext
	tx: Transaction | undefined
	cfTrace: CFTrace | null
	logger: AxiomLogger | undefined
}

export interface AppContextOptions {
	env: Bindings
	ctx: ExecutionContext
	transactionName: LogTagsHandler
}

export async function initAppContext({
	env,
	ctx,
	transactionName,
}: AppContextOptions): Promise<AppContext> {
	let sentry: Toucan | undefined
	let tx: Transaction | undefined
	let cfTrace: CFTrace | null = null
	let logger: AxiomLogger | undefined
	if (env.ENVIRONMENT === 'production') {
		sentry = initQueueSentry(env, ctx, 1)
		const tx = sentry.startTransaction({ name: transactionName })
		sentry.configureScope((scope) => {
			scope.setSpan(tx)
		})

		let cfTraceDuration: number | null = null
		try {
			const span = tx?.startChild({
				op: 'getCFTrace',
				description: 'Get Cloudflare trace',
			})
			const start = Date.now()
			const t = await getCFTrace()
			const end = Date.now()
			cfTraceDuration = end - start
			span?.finish()
			sentry?.configureScope((scope) => {
				scope.addAttachment({
					filename: 'cf.json',
					contentType: 'application/json',
					data: JSON.stringify({ cfTrace: t }),
				})
				scope.setTags({ colo: t.colo, loc: t.loc })
			})
			cfTrace = t
		} catch (e) {
			if (e instanceof Error) {
				if (e.name === 'TimeoutError') {
					sentry?.captureException(new Error(`getCFTrace timed out: ${e.name}:${e.message}`))
				} else {
					sentry?.captureException(e)
				}
			} else {
				sentry?.captureException(e)
			}
		}

		logger = new AxiomLogger({
			cfTrace,
			ctx,
			sentry,
			tx,
			flushAfterMs: 60_000,
			flushAfterLogs: 150, // Increased to prevent flushing twice
			axiomApiKey: env.AXIOM_API_KEY,
			dataset: env.AXIOM_DATASET,
			tags: {
				server: 'workers',
				source: env.NAME,
				handler: transactionName,
				env: env.ENVIRONMENT ?? 'development',
				sentryTraceId: tx?.sampled ? tx.traceId : null,
				invocationId: ulid(),
				release: env.SENTRY_RELEASE,
				cf: {
					colo: cfTrace?.colo,
					loc: cfTrace?.loc,
					traceDurationMs: cfTraceDuration,
					traceFailed: cfTrace === null,
				},
			},
		})
	}

	return {
		sentry,
		env,
		ctx,
		tx,
		cfTrace,
		logger,
	}
}
