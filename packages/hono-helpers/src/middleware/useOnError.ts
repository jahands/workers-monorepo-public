import { HTTPException } from 'hono/http-exception'
import { httpStatus } from 'http-codex/status'

import type { Context } from 'hono'
import type { StatusCode } from 'hono/utils/http-status'
import type { APIError } from '../helpers/errors'
import type { HonoApp } from '../types'

/** Handles typical onError hooks */
export function useOnError<T extends HonoApp>() {
	return async (err: Error, c: Context<T>): Promise<Response> => {
		if (err instanceof HTTPException) {
			const status = err.getResponse().status as StatusCode
			const body: APIError = { success: false, error: { message: err.message } }
			if (status >= 500) {
				// Log to Sentry
				c.get('sentry')?.withScope(async (scope) => {
					scope.setContext('HTTP Exception', {
						status: status,
						body,
					})
					c.get('sentry')?.captureException(err)
				})
			} else if (status === httpStatus.Unauthorized) {
				body.error.message = 'unauthorized'
			}

			return c.json(body, status)
		}

		// Log all other error types to Sentry
		c.get('sentry')?.captureException(err)
		console.error(err)
		return c.json(
			{
				success: false,
				error: { message: 'internal server error' },
			} satisfies APIError,
			500
		)
	}
}
