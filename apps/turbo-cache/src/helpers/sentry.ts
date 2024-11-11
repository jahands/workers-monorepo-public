import { Toucan } from 'toucan-js'

import type { Bindings } from '../types'

export function initSentry(
	request: Request,
	env: Pick<Bindings, 'SENTRY_DSN' | 'SENTRY_RELEASE' | 'ENVIRONMENT'>,
	ctx: ExecutionContext
): Toucan | undefined {
	if (env.ENVIRONMENT === 'VITEST') return

	return new Toucan({
		dsn: env.SENTRY_DSN,
		context: ctx,
		environment: env.ENVIRONMENT,
		release: env.SENTRY_RELEASE,
		request,
		tracesSampleRate: 0.1,
		requestDataOptions: {
			// Don't allow the `key` param to be logged
			allowedSearchParams: /^(?!(key)$).+$/,
		},
	})
}

export function initDOSentry(
	env: Pick<Bindings, 'SENTRY_DSN' | 'SENTRY_RELEASE' | 'ENVIRONMENT'>,
	ctx: Pick<ExecutionContext, 'waitUntil'>
): Toucan | undefined {
	if (env.ENVIRONMENT === 'VITEST') return

	return new Toucan({
		dsn: env.SENTRY_DSN,
		context: ctx,
		environment: env.ENVIRONMENT,
		release: env.SENTRY_RELEASE,
		tracesSampleRate: 0.05,
		requestDataOptions: {
			// Don't allow the `key` param to be logged
			allowedSearchParams: /^(?!(key)$).+$/,
		},
	})
}
