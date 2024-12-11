import { z } from 'zod'

/**
 * Workflows that use KV. Add all Workflows here to use KV.
 *
 * Note: Doesn't have to be exact name - just trying to make
 * sure we don't accidently overwrite stuff.
 */
export type WorkflowName = z.infer<typeof WorkflowName>
export const WorkflowName = z.enum(['pages-deployment-cleaner', 'Notion_AddPageIcon'])

/**
 * Path in Workflows KV namespace. This type ensures
 * that we don't accidently overwrite keys from other workflows.
 */
export type KVPath = `workflows/${WorkflowName}/${string}`

/**
 * Path in Workflows KV namespace. This type ensures
 * that we don't accidently overwrite keys from other workflows.
 *
 * @example
 * ```ts
 * const getKVPath = workflowsKV('myWorkflow')
 * const kvPath = getKVPath('config.json')
 * await c.env.KV.put(kvPath, config)
 * ```
 */
export function workflowsKV(name: WorkflowName): (path: string) => KVPath {
	return (path: string) => `workflows/${name}/${path}`
}
