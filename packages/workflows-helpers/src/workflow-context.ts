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

class WorkflowContextBase<Bindings extends SharedHonoBindings, Params = unknown> {
	readonly ctx: ExecutionContext
	readonly env: Bindings
	readonly event: WorkflowEvent<Params>
	/** Original WorkflowStep - prefer using step instead. */
	readonly _step: WorkflowStep
	readonly logger: AxiomLogger
	readonly sentry: Toucan
	readonly workflowName: string

	constructor(c: WorkflowContextOptions<Bindings, Params>) {
		this.ctx = c.ctx
		this.env = c.env
		this.event = c.event
		this._step = c.step
		this.sentry = initWorkflowSentry(c.env, c.ctx)
		this.workflowName = c.workflow

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
	 * Adds Sentry tags and adds params as an
	 * attachment to the current Sentry scope
	 */
	setSentryMetadata(): void {
		this.sentry.setTags({
			workflow: this.workflowName,
		})
		this.sentry.configureScope((scope) => {
			scope.addAttachment({
				filename: 'workflow_params.json',
				data: JSON.stringify(this.event.payload),
			})
		})
	}

	/**
	 * Runs a callback and captures errors as long as they are not
	 * already recorded within c.step.do()
	 * @param callback The function to run and record errors from
	 */
	async run(callback: () => Promise<void>): Promise<void> {
		await this.withLogger(async () => {
			try {
				this.sentry.pushScope()
				this.setSentryMetadata()
				this.logger.info(
					`running workflow ${this.workflowName} with params: ${JSON.stringify(this.event.payload)}`,
					{
						msc: { params: this.event.payload },
					}
				)

				await callback()
			} catch (e) {
				// This may be a duplicate of an error already captured within
				// step.do(), but we still need to capture it here as well so
				// that we get a stack trace for where the step was called.
				// Also may capture errors calling step.do() that Workflows
				// throws internally.
				this.sentry.captureException(e)
				throw e
			} finally {
				this.sentry.popScope()
				await this.logger.flushAndStop()
			}
		})
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
		this.sleep = c.step.sleep
		this.sleepUntil = c.step.sleepUntil
	}

	/**
	 * Run a Workflows Step.
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
		return await this.withLogger(async () => {
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
			let didErr = false
			try {
				return await pRetry(
					async () =>
						await this._step.do(name, config, async () => {
							try {
								this.sentry.pushScope()
								this.setSentryMetadata()
								return await cb()
							} catch (e) {
								// Capture inside the step so that we get a good stack trace.
								this.sentry.captureException(e)
								throw e
							} finally {
								this.sentry.popScope()
							}
						}),
					{
						retries: 3,
						randomize: true,
						shouldRetry: (e) => {
							// Only retry errors that appear to be internal Workflows errors
							if (
								// Workflows is built on Durable Objects, which sometimes throws this error
								e.message
									.toLowerCase()
									.startsWith('durable object reset because its code was updated')
							) {
								return true
							}
							return false
						},
						onFailedAttempt: (e) => {
							this.sentry.captureException(e)
						},
					}
				)
			} catch (e) {
				this.logger.error(`workflow step failed: ${name}`)
				didErr = true
				throw e
			} finally {
				if (!didErr) {
					this.logger.info(`workflow step succeeded: ${name}`)
				}
			}
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
