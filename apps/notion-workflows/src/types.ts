import { WorkflowContext as WorkflowBaseContext } from '@repo/workflows-helpers/context'

import type { HonoApp } from '@repo/hono-helpers'
import type { SharedHonoBindings, SharedHonoVariables } from '@repo/hono-helpers/src/types'
import type { ApiTokens, WorkflowsApp } from '@repo/workflows-helpers/auth'
import type { Workflow } from '@repo/workflows-helpers/workflow'
import type { AddPageIconParams } from './workflows/addpageicon/addpageicon'

export type Bindings = SharedHonoBindings & {
	// axiom: workers-general 1P-72dx8

	/**
	 * API tokens for auth'ing to this Worker 1P-2ufft
	 * Update with `pnpm write-api-tokens`
	 */
	API_TOKENS: string
	/**
	 * Notion API token - same as cronjobs 1P-qqim5
	 */
	NOTION_API_TOKEN: string
	/**
	 * KV namespace "workflows" shared across all Workflows
	 */
	KV: KVNamespace

	// ============================= //
	// ========= Workflows ========= //
	// ============================= //

	AddPageIcon: Workflow<AddPageIconParams>
}

/** Variables can be extended */
export type Variables = SharedHonoVariables & {
	ApiTokens: ApiTokens
}

export interface App extends HonoApp, WorkflowsApp {
	Bindings: Bindings
	Variables: Variables
}

export class WorkflowContext<Params = unknown> extends WorkflowBaseContext<Bindings, Params> {}
