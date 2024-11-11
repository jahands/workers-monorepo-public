/* eslint-disable operator-linebreak */
import { WorkersLogger } from 'workers-tagged-logger'

import { getCFTrace } from '@repo/cftrace'

import type { SeverityLevel, Transaction } from '@sentry/types'
import type { Toucan } from 'toucan-js'
import type { CFTrace } from '@repo/cftrace'

export const logger = new WorkersLogger<LogTags & AxiomTags>()

interface AxiomLog {
	_time: string
	message: string
	tags?: LogTags & AxiomTags
	data?: LogData
}

// Additional tags internal to this package
type AxiomTags = {
	level: string
}

/** LogData adds types for standardized logging fields to
 * help reduce minor variants in how we log things.
 */
export type LogData = {
	/**
	 * If provided, will be JSON.stringify'd to
	 * save field counts in Axiom
	 */
	msc?: any

	/** An error that should be added to the log */
	error?: any

	/** What served the request (eg. R2/KV/B2/etc.) */
	servedBy?: string

	/** Duration of the thing we're measuring (usually response time) */
	duration?: number

	/** Count things */
	count?: number

	/** Type of log (useful for filtering) */
	type?: 'http_request' | 'raw-email' | 'b2-event' | 'r2-event'

	// Request/response logs should be standardized across all Workers
	/** Request info for the log */
	request?: LogDataRequest

	/** Response info for the log */
	response?: {
		status: number
		timestamp: string
	}

	/** Optional timestamp to use instead of the current timestamp
	 * for when this log occurred. Format with ISO8601:
	 * timestamp: new Date().toISOString()
	 */
	timestamp?: string

	// Don't care enough to not use any here
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, any>

/** Request info for the log */
export interface LogDataRequest {
	url: string
	method: string
	path: string
	headers: string
	/** Eyeball IP address of the request */
	ip?: string
	timestamp: string
}

/** Log tags help group together requests.
 * These are standardized across all logs using this type. */
export type LogTags = {
	server: 'workers'
	/** Typically the Worker name (c.env.NAME) */
	source: string
	/** Handler exported by the Worker */
	handler: LogTagsHandler
	/**
	 * Name of the handler (for named handlers like Workflows).
	 * i.e. the entrypoint name
	 */
	handlerName?: string
	/** Should be present on all requests where possible.
	 * Durable Objects using JRPC may share an "invocation"
	 * across multiple function calls.
	 */
	invocationId: string
	env: string
	sentryTraceId?: string | null
	/** Typically the Sentry release */
	release: string
	/** CF properties usually come from cftrace */
	cf?: {
		colo?: string
		loc?: string
		traceDurationMs?: number | null
		traceFailed?: boolean
	}
}

export type LogTagsHandler =
	| 'fetch'
	| 'queue'
	| 'email'
	| 'scheduled'
	| 'durable_object'
	| 'workflows'
export type LogLevel = SeverityLevel

export interface AxiomLoggerOptions {
	ctx: ExecutionContext
	sentry?: Toucan
	tx?: Transaction
	axiomApiKey: string
	tags: LogTags
	dataset: string
	/** Not used if state is set. */
	flushAfterMs?: number
	/** Not used if state is set. */
	flushAfterLogs?: number
	/** Optionally initialize with a cfTrace if we already have it */
	cfTrace?: CFTrace | null
	/** Optionally store logs in DO storage instead of in memory.
	 * Implicitly disables flushAfterMs and flushAfterLogs. Must
	 * manually call flush() (preferably in an alarm.)
	 *
	 * At some point, we could probably rip this out and use
	 * waitUntil() to ensure logs are flushed instead of setTimeout.
	 * But for now, this will be a nice test of DO storage.
	 */
	state?: DurableObjectState
}
export class AxiomLogger {
	private readonly ctx: ExecutionContext
	private readonly sentry?: Toucan
	private readonly tx?: Transaction
	private readonly axiomApiKey
	private readonly dataset
	private readonly tags: LogTags
	private cfTrace?: CFTrace | null

	// Axiom stuff
	private readonly logs: AxiomLog[] = []
	private flushTimeout: any | null = null
	private flushPromise: Promise<any> | null = null
	private flushAfterMs
	private flushAfterLogs
	private state

	constructor({
		ctx,
		sentry,
		tx,
		axiomApiKey,
		tags,
		dataset,
		flushAfterMs,
		flushAfterLogs,
		cfTrace,
		state,
	}: AxiomLoggerOptions) {
		this.ctx = ctx
		this.sentry = sentry
		this.tx = tx
		this.axiomApiKey = axiomApiKey
		this.dataset = dataset
		this.tags = tags
		this.flushAfterMs = flushAfterMs ?? 10000
		this.flushAfterLogs = flushAfterLogs ?? 100
		this.cfTrace = cfTrace
		this.state = state
	}

	private _log(message: string, level: LogLevel, data?: LogData) {
		let _time = new Date().toISOString()
		if (data) {
			if (data.level) {
				level = data.level
				delete data.level
			}

			// Convert errors cause I think they weren't stringifying correctly
			if (data.error && data.error && data.error.message) {
				data.error = {
					message: data.error.message,
					stack: data.error.stack,
				}
			}

			// Stringify msc to save field counts in Axiom
			if (data.msc && typeof data.msc !== 'string') {
				data.msc = JSON.stringify(data.msc)
			}

			// Optional date override
			if (data.timestamp && typeof data.timestamp === 'string') {
				_time = data.timestamp
			}
		}

		const log: AxiomLog = {
			_time,
			message,
			tags: {
				...this.tags,
				level,
			},
			data,
		}

		logger //
			.withTags(this.tags)
			.withFields({ time: _time, level, data })
			.log(message)

		if (this.state) {
			void this.state.storage.get<AxiomLog[]>('__AXIOM_LOGS__').then((existing) => {
				if (existing) {
					existing.push(log)
					void this.state?.storage.put('__AXIOM_LOGS__', existing)
				} else {
					void this.state?.storage.put('__AXIOM_LOGS__', [log])
				}
			})
		} else {
			this.logs.push(log)

			if (this.logs.length >= this.flushAfterLogs) {
				// Reset scheduled if there is one
				if (this.flushTimeout) {
					this.scheduleFlush(this.flushAfterMs, true)
				}
				this.ctx.waitUntil(this.flush({ skipIfInProgress: true }))
			} else {
				// Always schedule a flush (if there isn't one already)
				this.scheduleFlush(this.flushAfterMs)
			}
		}
	}

	/** Flush after X ms if there's not already
	 * a flush scheduled
	 * @param reset If true, cancel the current flush timeout
	 */
	scheduleFlush(timeout: number, reset = false) {
		if (this.state) return // Just in case lol

		if (reset && this.flushTimeout) {
			clearTimeout(this.flushTimeout)
			this.flushTimeout = null
		}

		if (!this.flushTimeout && !this.flushPromise) {
			this.flushTimeout = setTimeout(() => {
				const doFlush = async () => {
					await this.flush({ skipIfInProgress: true })
					this.flushTimeout = null
				}
				this.ctx.waitUntil(doFlush())
			}, timeout)
		}
	}

	/** Flush logs and stop the logger (clear flush setTimeout) */
	async flushAndStop(): Promise<void> {
		try {
			await this.flush()
		} finally {
			if (this.flushTimeout) {
				clearTimeout(this.flushTimeout)
			}
		}
	}

	async flush({ skipIfInProgress = false }: { skipIfInProgress?: boolean } = {}) {
		if (this.tags.env === 'VITEST') return

		if (skipIfInProgress && this.flushPromise) return

		const doFlush = async () => {
			let logs = this.logs
			if (this.state) {
				logs = (await this.state.storage.get<AxiomLog[]>('__AXIOM_LOGS__')) ?? []
			}
			if (logs.length === 0) return // Nothing to do
			await this.addCFTraceTags()

			// Axiom logging
			const span = this.tx
				?.startChild({
					op: 'AxiomLogger.flush',
					description: 'Send logs to Axiom',
				})
				.setTag('flushAfterMs', this.flushAfterMs)
				.setTag('flushAfterLogs', this.flushAfterLogs)
			const logsCount = logs.length
			span?.setTag('logsCount', logsCount)
			const logsBody = JSON.stringify(logs)

			try {
				const res = await fetch(`https://api.axiom.co/v1/datasets/${this.dataset}/ingest`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${this.axiomApiKey}`,
					},
					body: logsBody,
					signal: AbortSignal.timeout(25_000),
				})
				span?.setTag('status', res.status)
				if (res.ok) {
					const text = await res.text()
					this.sentry?.configureScope((scope) => {
						scope
							.setContext('Axiom Data', {
								responseText: text,
							})
							.addAttachment({
								filename: 'axiomLogsBody.json',
								data: logsBody,
							})
					})
					// Remove the logs we sent
					if (this.state) {
						const existing = (await this.state.storage.get<AxiomLog[]>('__AXIOM_LOGS__')) ?? []
						existing.splice(0, logsCount)
						if (existing.length > 0) {
							void this.state.storage.put('__AXIOM_LOGS__', existing)
						} else {
							void this.state.storage.delete('__AXIOM_LOGS__')
						}
					} else {
						this.logs.splice(0, logsCount)
					}
				} else {
					const text = await res.text()
					span?.setData('responseText', text)
					this.sentry?.withScope((scope) => {
						scope
							.setContext('Axiom Data', {
								responseText: text,
							})
							.addAttachment({
								filename: 'logsBody.json',
								data: logsBody,
							})
						this.sentry?.captureException(
							new Error(`Axiom failed to ingest logs: ${res.status} ${res.statusText}`)
						)
						if (this.state && res.status === 400) {
							// Must have goofed up something. Delete logs
							// to prevent filling up storage.
							void this.state.storage.delete('__AXIOM_LOGS__')
						}
					})
				}
			} catch (err) {
				this.sentry?.captureException(err)
			} finally {
				span?.finish()
			}
		}

		// Make sure the last one is done before starting a new one
		// this shouldn't happen, but just to be safe...
		await this.flushPromise

		this.flushPromise = doFlush()
		await this.flushPromise
		this.flushPromise = null
	}

	async addCFTraceTags(timeout = 200) {
		if (this.tags.env === 'VITEST') return

		if (!this.tags.cf?.colo) {
			if (!this.cfTrace) {
				try {
					this.cfTrace = await getCFTrace(timeout) // Try to get a trace
				} catch (err) {
					if (err instanceof Error) {
						this.error(`Failed to getCFTrace: ${err.name}: ${err.message}`)
					} else {
						this.error('Failed to getCFTrace')
					}
				}
			}
			if (this.cfTrace) {
				this.tags.cf = {
					...this.tags.cf,
					colo: this.cfTrace.colo,
					loc: this.cfTrace.loc,
				}
				// Add these to all logs
				for (const log of this.logs) {
					if (log.tags) {
						log.tags.cf = this.tags.cf
					}
				}
			}
		}
	}

	log(msg: string, data?: LogData) {
		this._log(msg, 'info', data)
	}

	logWithLevel(msg: string | Error, level: LogLevel, data?: LogData) {
		const m: string = msg instanceof Error ? msg.message + (msg.stack ? `\n${msg.stack}` : '') : msg
		this._log(m, level, data)
	}

	info(msg: string, data?: LogData) {
		this._log(msg, 'info', data)
	}

	warn(msg: string, data?: LogData) {
		this._log(msg, 'warning', data)
	}

	error(msg: string | Error, data?: LogData) {
		const m: string = msg instanceof Error ? msg.message + (msg.stack ? `\n${msg.stack}` : '') : msg
		this._log(m, 'error', data)
	}

	fatal(msg: string | Error, data?: LogData) {
		const m: string = msg instanceof Error ? msg.message + (msg.stack ? `\n${msg.stack}` : '') : msg
		this._log(m, 'fatal', data)
	}

	debug(msg: string, data?: LogData) {
		this._log(msg, 'debug', data)
	}
}
