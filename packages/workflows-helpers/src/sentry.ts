import { Toucan } from 'toucan-js'

import type { SharedHonoBindings } from '@repo/hono-helpers/src/types'

/**
 * Initializes Sentry for use in Workflows. If we need custom
 * things later, we can add ability to pass in options or something.
 */
export function initWorkflowSentry(
	env: Pick<SharedHonoBindings, 'SENTRY_DSN' | 'SENTRY_RELEASE' | 'ENVIRONMENT'>,
	ctx: Pick<ExecutionContext, 'waitUntil'>
): Toucan {
	return new Toucan({
		dsn: env.SENTRY_DSN,
		context: ctx,
		environment: env.ENVIRONMENT,
		release: env.SENTRY_RELEASE,
		tracesSampleRate: 0.02,
		requestDataOptions: {
			// Don't allow the `key` param to be logged
			allowedSearchParams: /^(?!(key)$).+$/,
		},
	})
}
