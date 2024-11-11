import type { Transaction } from '@sentry/types'
import type { Toucan } from 'toucan-js'
import type { CFTrace } from '@repo/cftrace'
import type { AxiomLogger } from '@repo/logging'

/** Global bindings */
export type SharedHonoBindings = {
	/** Name of the worker used in logging/etc specified in wrangler.toml vars */
	NAME: string
	// All workers should specify env in wrangler.toml vars
	ENVIRONMENT: 'production' | 'VITEST'

	// All Workers should wire up Sentry
	SENTRY_DSN: string
	SENTRY_RELEASE: string

	// Most workers use workers-general (1P-72dx8)
	AXIOM_API_KEY: string
	AXIOM_DATASET: string
	AXIOM_DATASET_OTEL: string
}
/** Global Hono variables */
export type SharedHonoVariables = {
	sentry: Toucan | undefined
	tx: Transaction | undefined
	// TX will wait for these promises before calling finish()
	// Note: Must use useSentry to initialize txWaitUntil
	txWaitUntil: Array<Promise<any>>
	/** Probably not set due to deprecation of useCFTrace() */
	cfTrace: CFTrace | undefined
	logger: AxiomLogger | undefined

	// Metadata set by useMeta

	/** Invocation UUID of the request. Useful for grouping logs */
	invocationId: string
	/** Start time (in ms) of the request */
	requestStartTime: number
}

/** Top-level Hono app */
export interface HonoApp {
	Variables: SharedHonoVariables
	Bindings: SharedHonoBindings
}

/** Context used for non-Hono things like Durable Objects */
export type SharedAppContext = {
	var: Pick<SharedHonoVariables, 'logger' | 'sentry'>
	env: SharedHonoBindings
	executionCtx: Pick<ExecutionContext, 'waitUntil'>
}
