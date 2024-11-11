import { z } from 'zod'

/**
 * Workflows that use KV. Add all Workflows here to use KV.
 *
 * Note: Doesn't have to be exact name - just trying to make
 * sure we don't accidently overwrite stuff.
 */
export type WorkflowName = z.infer<typeof WorkflowName>
export const WorkflowName = z.enum(['pages-deployment-cleaner'])

/**
 * Path in Workflows KV namespace. This type ensures
 * that we don't accidently overwrite keys from other workflows.
 */
export type KVPath = `workflows/${WorkflowName}/${string}`

/**
 * Path in Workflows KV namespace. This type ensures
 * that we don't accidently overwrite keys from other workflows.
 */
export function kvPath(path: string, name: WorkflowName): KVPath {
	return `workflows/${name}/${path}`
}
