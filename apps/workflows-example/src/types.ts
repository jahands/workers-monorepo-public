import { WorkflowContext as WorkflowBaseContext } from '@repo/workflows-helpers/context'

import type { HonoApp } from '@repo/hono-helpers'
import type { SharedHonoBindings, SharedHonoVariables } from '@repo/hono-helpers/src/types'
import type { ApiTokens, WorkflowsApp } from '@repo/workflows-helpers/auth'
import type { Workflow } from '@repo/workflows-helpers/workflow'
import type { MyWorkflowParams } from './workflows/my-workflow/my-workflow'

export type Bindings = SharedHonoBindings & {
	// axiom: workers-general 1P-72dx8

	/**
	 * API tokens for auth'ing to this Worker 1P-2ufft
	 * Update with `pnpm write-api-tokens`
	 */
	API_TOKENS: string
	/**
	 * KV namespace "workflows" shared across all Workflows
	 */
	KV: KVNamespace

	// ============================= //
	// ========= Workflows ========= //
	// ============================= //

	MyWorkflow: Workflow<MyWorkflowParams>
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
