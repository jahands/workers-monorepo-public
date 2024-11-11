import { httpStatus } from 'http-codex/status'

import type { Context } from 'hono'
import type { APIError } from '../helpers/errors'
import type { HonoApp } from '../types'

/** Handles typical notFound hooks */
export function useNotFound<T extends HonoApp>() {
	return async (c: Context<T>): Promise<Response> => {
		return c.json(notFoundResponse, httpStatus.NotFound)
	}
}

export const notFoundResponse = {
	success: false,
	error: { message: 'not found' },
} satisfies APIError