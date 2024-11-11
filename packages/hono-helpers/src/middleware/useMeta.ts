import { ulid } from 'ulidx'

import { trace } from '@repo/otel'

import type { Context, Next } from 'hono'
import type { HonoApp } from '../types'

/** Sets basic metadata in variables. Should always be the first middleware */
export async function useMeta<T extends HonoApp>(c: Context<T>, next: Next) {
	c.set('invocationId', ulid())
	c.set('requestStartTime', Date.now())
	trace.getActiveSpan()?.setAttribute('invocationId', c.get('invocationId'))
	await next()
}
