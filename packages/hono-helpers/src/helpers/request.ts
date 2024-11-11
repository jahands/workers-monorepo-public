import { redactUrl } from './url'

import type { Context } from 'hono'
import type { LogDataRequest } from '@repo/logging'
import type { HonoApp } from '../types'

/** Get logdata from request
 * @param requestStartTimestamp The start of the request
 */
export function getRequestLogData<T extends HonoApp>(
	c: Context<T>,
	requestStartTimestamp: number
): LogDataRequest {
	return {
		url: redactUrl(c.req.url).toString(),
		method: c.req.method,
		path: c.req.path,
		headers: JSON.stringify(Array.from(c.req.raw.headers)),
		ip:
			c.req.header('cf-connecting-ip') ||
			c.req.header('x-real-ip') ||
			c.req.header('x-forwarded-for'),
		timestamp: new Date(requestStartTimestamp).toISOString(),
	}
}
