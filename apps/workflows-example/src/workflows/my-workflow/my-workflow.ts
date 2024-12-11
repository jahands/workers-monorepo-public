import { WorkflowEntrypoint } from 'cloudflare:workers'
import { z } from 'zod'

import { WorkflowContext } from '../../types'

import type { WorkflowEvent, WorkflowStep } from 'cloudflare:workers'
import type { Bindings } from '../../types'

export type MyWorkflowParams = z.infer<typeof MyWorkflowParams>
export const MyWorkflowParams = z.object({})

export class MyWorkflow extends WorkflowEntrypoint<Bindings, MyWorkflowParams> {
	async run(event: WorkflowEvent<MyWorkflowParams>, step: WorkflowStep) {
		const c = new WorkflowContext({
			ctx: this.ctx,
			env: this.env,
			event,
			step,
			workflow: 'MyWorkflow',
		})

		await c.run(async () => {
			const params = MyWorkflowParams.parse(event.payload)
			await handleMyWorkflow(c, params)
		})
	}
}

async function handleMyWorkflow(c: WorkflowContext, params: MyWorkflowParams): Promise<void> {
	c.logger.info(`params: ${JSON.stringify(params)}`, { msc: { params } })

	const uuid = await c.step.do('get a uuid', async () => {
		const res = await fetch('https://uuid.rocks/plain')
		if (!res.ok) {
			throw new Error('failed to fetch uuid')
		}
		return await res.text()
	})

	c.logger.debug(`uuid: ${uuid}`)
}
