import { HTTPException } from 'hono/http-exception'
import { httpStatus } from 'http-codex/status'
import { Toucan } from 'toucan-js'

import { validateEnv } from '../helpers/env'

import type { Context, Next } from 'hono'
import type { HonoApp, SharedHonoBindings } from '../types'

/** Adds sentry for environment 'production'
 * Typically, this should be added early in the middleware chain
 */
export function useSentry<T extends HonoApp>(
	initSentry: (request: Request, env: T['Bindings'], ctx: ExecutionContext) => Toucan | undefined,
	transactionOp: string
) {
	return async (c: Context<T>, next: Next): Promise<void> => {
		if (c.env.ENVIRONMENT === 'production') {
			validateEnv([
				[c.env.SENTRY_DSN, 'stringMin1', 'SENTRY_DSN'],
				[c.env.SENTRY_RELEASE, 'stringMin1', 'SENTRY_RELEASE'],
			])

			const sentry = initSentry(c.req.raw, c.env, c.executionCtx)
			const tx = sentry?.startTransaction({ name: c.req.path, op: transactionOp })
			sentry?.configureScope((scope) => {
				scope.setSpan(tx)
				scope.setTag('invocationId', c.get('invocationId'))
			})
			tx?.setTag('invocationId', c.get('invocationId'))

			c.set('sentry', sentry)
			c.set('tx', tx)
		}
		c.set('txWaitUntil', [])

		await next()

		c.get('tx')?.setName(c.req.routePath)

		const skipTxStatuses = [
			httpStatus.Unauthorized,
			httpStatus.Forbidden,
			httpStatus.NotFound,
		] as number[]

		let recordTx = true
		if (c.error instanceof HTTPException && skipTxStatuses.includes(c.error.status)) {
			// Don't record transactions for auth errors or not found
			recordTx = false
		}
		if (skipTxStatuses.includes(c.res.status)) {
			recordTx = false
		}
		if (recordTx) {
			const waitAndCommitTX = async (): Promise<void> => {
				await Promise.allSettled(c.get('txWaitUntil') ?? [])
				c.get('tx')?.finish()
			}
			c.executionCtx.waitUntil(waitAndCommitTX())
		} else {
			c.executionCtx.waitUntil(Promise.allSettled(c.get('txWaitUntil') ?? []))
		}
	}
}

export interface InitSentryOptions {
	/**
	 * Sentry tracing sample rate. Defaults to 2%
	 */
	tracesSampleRate?: number
}

/**
 * Create a Sentry initializer with reasonable defaults
 * @param options.tracesSampleRate Sample rate for Sentry traces. Defaults to 2%
 * @returns initSentry function
 */
export function initSentry(options?: InitSentryOptions) {
	return (
		request: Request,
		env: Pick<SharedHonoBindings, 'SENTRY_DSN' | 'SENTRY_RELEASE' | 'ENVIRONMENT'>,
		ctx: ExecutionContext
	): Toucan => {
		return new Toucan({
			dsn: env.SENTRY_DSN,
			context: ctx,
			environment: env.ENVIRONMENT,
			release: env.SENTRY_RELEASE,
			request,
			tracesSampleRate: options?.tracesSampleRate ?? 0.02,
			requestDataOptions: {
				// Don't allow the `key` param to be logged
				allowedSearchParams: /^(?!(key)$).+$/,
			},
		})
	}
}
