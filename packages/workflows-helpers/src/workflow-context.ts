import { NonRetryableError } from 'cloudflare:workflows'
import pRetry from 'p-retry'
import { ulid } from 'ulidx'
import { withLogTags } from 'workers-tagged-logger'

import { AxiomLogger } from '@repo/logging'

import { initWorkflowSentry } from './sentry'

import type { WorkflowEvent, WorkflowStep, WorkflowStepConfig } from 'cloudflare:workers'
import type { Toucan } from 'toucan-js'
import type { SharedHonoBindings } from '@repo/hono-helpers/src/types'

/**
 * Slightly stricter defaults than standard:
 *
 * ```ts
 * {
 * 	retries: {
 * 		limit: 5,
 * 		delay: 10000,
 * 		backoff: 'exponential',
 * 	},
 * 	timeout: '10 minutes',
 * }
	```
 */
const defaultStepConfig = {
	retries: {
		delay: '5 seconds',
		limit: 3,
		backoff: 'exponential',
	},
	timeout: '10 minutes',
} satisfies WorkflowStepConfig

export interface WorkflowContextOptions<Bindings extends SharedHonoBindings, Params = unknown> {
	ctx: ExecutionContext
	env: Bindings
	event: WorkflowEvent<Params>
	step: WorkflowStep
	/** Name of the Workflow (e.g. NewEmailWorkflow) */
	workflow: string
}

export function isNonRetryableError(err: unknown): err is NonRetryableError {
	return (
		// When reading the error across RPC boundaries, instanceof will never
		// return true. But I included it here just in case we use these elsewhere.
		err instanceof NonRetryableError ||
		(err instanceof Error && err.message.startsWith('NonRetryableError:'))
	)
}

export function isStepFailedError(err: unknown): err is StepFailedError {
	return (
		err instanceof StepFailedError ||
		(err instanceof Error && err.message.startsWith('StepFailedError:'))
	)
}

class WorkflowContextBase<Bindings extends SharedHonoBindings, Params = unknown> {
	readonly ctx: ExecutionContext
	readonly env: Bindings
	readonly event: WorkflowEvent<Params>
	/** Original WorkflowStep - prefer using step instead. */
	readonly _step: WorkflowStep
	readonly logger: AxiomLogger
	readonly sentry: Toucan

	constructor(c: WorkflowContextOptions<Bindings, Params>) {
		this.ctx = c.ctx
		this.env = c.env
		this.event = c.event
		this._step = c.step
		this.sentry = initWorkflowSentry(c.env, c.ctx)

		this.logger = new AxiomLogger({
			ctx: this.ctx,
			sentry: this.sentry,
			axiomApiKey: this.env.AXIOM_API_KEY,
			dataset: this.env.AXIOM_DATASET,
			tags: {
				server: 'workers',
				source: this.env.NAME,
				handler: 'workflows',
				handlerName: c.workflow,
				env: this.env.ENVIRONMENT,
				invocationId: ulid(),
				release: this.env.SENTRY_RELEASE,
			},
		})
	}

	/** Runs the callback within a tagged logger context */
	async withLogger<T>(callback: () => Promise<T>): Promise<T> {
		return await withLogTags(
			{
				source: this.env.NAME,
				tags: {
					environment: this.env.ENVIRONMENT,
					invocationId: ulid(),
				},
			},
			callback
		)
	}

	/**
	 * Runs a callback and captures errors as long as they are not
	 * already recorded within c.step.do()
	 * @param callback The function to run and record errors from
	 */
	async run(callback: () => Promise<void>): Promise<void> {
		try {
			await this.withLogger(callback)
		} catch (e) {
			// These errors already get captured within c.step.do()
			if (!isNonRetryableError(e) && !isStepFailedError(e)) {
				this.logger.warn(
					`not a StepFailedError or NonRetryableError: ${e instanceof Error ? e.name + ': ' + e.message : ''}`
				)
				this.sentry.captureException(e)
			} else {
				// Go ahead and record them for now
				// this.sentry.withScope((scope) => {
				// 	scope.setContext('Workflows Debug', {
				// 		note: 'this should already have been recorded in c.run()',
				// 	})
				// 	scope.setTags({
				// 		debug: true,
				// 	})
				// 	this.sentry.captureException(e)
				// })
			}

			throw e
		} finally {
			await this.logger.flushAndStop()
		}
	}
}

/** Workflow context (similar to Hono context) */
class WorkflowContextStep<
	Bindings extends SharedHonoBindings,
	Params = unknown,
> extends WorkflowContextBase<Bindings, Params> {
	readonly sleep
	readonly sleepUntil

	constructor(c: WorkflowContextOptions<Bindings, Params>) {
		super(c)
		// Expose the original sleep methods directly
		this.sleep = c.step.sleep.bind(this)
		this.sleepUntil = c.step.sleepUntil.bind(this)
	}

	/**
	 * Run a Workflows Step.
	 *
	 * Callers should avoid capturing `StepFailedError` and `NonRetryableError`
	 * because these errors are already captured to Sentry within this method.
	 */
	async do<T extends Rpc.Serializable<T>>(name: string, callback: () => Promise<T>): Promise<T>
	async do<T extends Rpc.Serializable<T>>(
		name: string,
		config: WorkflowStepConfig,
		callback: () => Promise<T>
	): Promise<T>
	async do<T extends Rpc.Serializable<T>>(
		name: string,
		configOrCallback: WorkflowStepConfig | (() => Promise<T>),
		callback?: () => Promise<T>
	): Promise<T> {
		return this.withLogger(async () => {
			let config: WorkflowStepConfig
			let cb: () => Promise<T>

			if (typeof configOrCallback === 'function') {
				cb = configOrCallback
				config = defaultStepConfig
			} else {
				if (!callback) {
					throw new Error('missing callback')
				}

				config = {
					...defaultStepConfig,
					...configOrCallback,
					retries: {
						...defaultStepConfig.retries,
						...configOrCallback.retries,
					},
				}

				cb = callback
			}

			this.logger.info(`running workflow step: ${name}`)

			return await pRetry(
				async () =>
					await this._step.do(name, config, async () => {
						try {
							return await cb()
						} catch (e) {
							this.sentry.captureException(e)
							if (e instanceof NonRetryableError) {
								throw e
							} else {
								throw new StepFailedError(
									e instanceof Error ? `${e.name}: ${e.message}` : 'unknown'
								)
							}
						}
					}),
				{
					retries: 3,
					randomize: true,
					shouldRetry: (e) => {
						if (
							e.message
								.toLowerCase()
								.startsWith('durable object reset because its code was updated')
						) {
							return true
						}
						return false
					},
				}
			)
		})
	}
}

export class WorkflowContext<
	Bindings extends SharedHonoBindings,
	Params = unknown,
> extends WorkflowContextBase<Bindings, Params> {
	readonly step: WorkflowContextStep<Bindings, Params>

	constructor(c: WorkflowContextOptions<Bindings, Params>) {
		super(c)
		this.step = new WorkflowContextStep(c)
	}
}

/**
 * StepFailedError that should be thrown within
 * do() when we don't want to capture to Sentry
 */
export class StepFailedError extends Error {}
