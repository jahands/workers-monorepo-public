import { getCFTrace } from '@repo/cftrace'

import type { Context, Next } from 'hono'
import type { HonoApp } from '../types'

/** Adds cftrace in environment 'production' only
 * @deprecated Prefer using getCFTrace() directly as needed.
 */
export function useCFTrace<T extends HonoApp>(timeoutMs = 200) {
	return async (c: Context<T>, next: Next): Promise<void> => {
		if (c.env.ENVIRONMENT === 'production') {
			const span = c.var.tx?.startChild({
				op: 'getCFTrace',
				description: 'Get Cloudflare trace',
			})
			try {
				const trace = await getCFTrace(timeoutMs)
				c.set('cfTrace', trace)
				c.get('sentry')?.configureScope((scope) =>
					scope
						.setTags({
							'cf.colo': trace.colo,
							'cf.loc': trace.loc,
						})
						.addAttachment({
							filename: 'cfTrace.json',
							data: JSON.stringify(trace),
						})
				)
			} catch (e) {
				span?.setTag('error', true)
				if (e instanceof Error) {
					span?.setData('error', `${e.name}:${e.message}`)
					if (e.name === 'TimeoutError') {
						c
							.get('sentry')
							?.captureException(new Error(`getCFTrace timed out: ${e.name}:${e.message}`))
					} else {
						c.get('sentry')?.captureException(e)
					}
				} else {
					c.get('sentry')?.captureException(e)
				}
			} finally {
				span?.finish()
			}
		}
		await next()
	}
}
