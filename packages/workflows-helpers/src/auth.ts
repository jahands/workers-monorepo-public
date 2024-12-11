import { z } from 'zod'

import { newHTTPException } from '@repo/hono-helpers'

import type { Context, Next } from 'hono'

/**
 * Middleware to extract API tokens and add them to context
 */
export async function useApiTokens<App extends WorkflowsApp>(
	c: Context<App>,
	next: Next
): Promise<void> {
	const tokens = ApiTokens.safeParse(JSON.parse(c.env.API_TOKENS))
	if (!tokens.success) {
		throw newHTTPException(500, 'missing API_TOKENS in env')
	}
	c.set('ApiTokens', tokens.data)
	await next()
}

export interface WorkflowsApp {
	Bindings: SharedWorkflowsBindings
	Variables: SharedWorkflowsVariables
}

export type SharedWorkflowsBindings = {
	/**
	 * API tokens for auth'ing to Workflows Workers
	 * Update with `pnpm write-api-tokens`
	 *
	 * 1P-2ufft
	 */
	API_TOKENS: string
}

export type SharedWorkflowsVariables = {
	ApiTokens: ApiTokens
}

export type ApiToken = z.infer<typeof ApiToken>
export const ApiToken = z.string().min(1)

/**
 * ApiTokens stored in Workers Secrets as JSON
 *
 * 1P-2ufft
 */
export type ApiTokens = z.infer<typeof ApiTokens>
export const ApiTokens = z
	.object({
		/** Shared read/write token to use as default */
		admin_rw: ApiToken,

		/** ==== apps/workflows ==== */
		pages_deployment_cleaner_rw: ApiToken,

		/** ==== apps/notion-workflows ==== */
		notion_rw: ApiToken,
		notion_hooks_w: ApiToken,
	})
	// Partial because updating each worker is a manual process for now
	.partial()
