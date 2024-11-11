import { ulid } from 'ulidx'

import { AxiomLogger } from '@repo/logging'

import type { SharedAppContext } from '@repo/hono-helpers'
import type { LogTagsHandler } from '@repo/logging'

/** Creates a new logger for non-hono use. Call addCFTraceTags to add colo info. */
export function newLogger(
	c: SharedAppContext,
	handler: LogTagsHandler,
	state?: DurableObjectState
): AxiomLogger {
	return new AxiomLogger({
		// @ts-expect-error Hono is missing a method in executionCtx
		ctx: c.executionCtx,
		dataset: c.env.AXIOM_DATASET,
		axiomApiKey: c.env.AXIOM_API_KEY,
		sentry: c.var.sentry,
		flushAfterMs: 1000,
		state,
		tags: {
			server: 'workers',
			source: c.env.NAME,
			handler,
			invocationId: ulid(),
			env: c.env.ENVIRONMENT ?? 'development',
			release: c.env.SENTRY_RELEASE,
		},
	})
}
