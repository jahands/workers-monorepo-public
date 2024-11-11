import { httpStatus } from 'http-codex/status'
import { z } from 'zod'

import { newHTTPException } from '../helpers/errors'

import type { Context, Next } from 'hono'

export interface useAuthOptions {
	/**
	 * Token(s) allowed to access the route.
	 * Accepts undefined for simplicity, but all values must
	 * be strings at runtime for this to work.
	 */
	token: string | undefined | string[] | undefined[]
	/** Headers to check for the token */
	headers?: string[]
	/** Whether or not to check query. E.g. ?key=xyz */
	queryKey?: boolean
	/** Allow bearer auth */
	bearerAuth?: boolean
}

/** Auth middleware to combine multiple types of auth */
export function useAuth(options: useAuthOptions) {
	return async (c: Context, next: Next) => {
		const token = options.token
		// Ensure it's an array
		const tokensRaw: Array<string | undefined> = Array.isArray(token) ? token : [token]

		// Ensure they are all strings
		const tokens = z
			.array(
				z
					.string()
					.min(1, { message: 'token must be at least 1 character' })
					.describe('useAuth token')
			)
			.describe('array of useAuth tokens')
			.parse(tokensRaw)

		const checkers: Array<() => boolean> = []
		if (options.queryKey) {
			const checkQuery = () => {
				const { key } = c.req.query()
				return tokens.some((t) => t === key)
			}
			checkers.push(checkQuery)
		}

		if (options.headers && options.headers.length > 0) {
			const checkHeader = (h: string) => tokens.some((t) => t === c.req.header(h))
			for (const headerName of options.headers) {
				checkers.push(() => checkHeader(headerName))
			}
		}

		if (options.bearerAuth) {
			const checkBearer = () => {
				const bearer = 'Bearer '
				const authHeader = c.req.header('Authorization')
				if (!authHeader || !authHeader.startsWith(bearer)) {
					return false
				}
				const parts = authHeader.split(bearer)
				if (parts.length !== 2) {
					return false
				}
				const bearerToken = authHeader.substring(bearer.length).trim()
				return tokens.some((t) => t === bearerToken)
			}
			checkers.push(checkBearer)
		}

		if (!checkers.length) {
			throw newHTTPException(httpStatus.InternalServerError, 'no auth methods enabled')
		}

		if (!checkers.some((checkAuth) => checkAuth())) {
			throw newHTTPException(httpStatus.Unauthorized, 'unauthorized')
		}

		await next()
	}
}
