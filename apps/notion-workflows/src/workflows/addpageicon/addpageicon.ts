import { Client as NotionClient } from '@notionhq/client'
import { WorkflowEntrypoint } from 'cloudflare:workers'
import { NonRetryableError } from 'cloudflare:workflows'
import { z } from 'zod'

import { shuffleArray } from '@repo/workflows-helpers/random'

import { WorkflowContext } from '../../types'
import { getIconsListPath, IconsList, notionDBIcons } from './icons'
import { NotionPayload } from './schema'

import type { WorkflowEvent, WorkflowStep } from 'cloudflare:workers'
import type { Bindings } from '../../types'

export type AddPageIconParams = z.infer<typeof AddPageIconParams>
export const AddPageIconParams = z.object({
	notionPayload: NotionPayload,
})

export class AddPageIcon extends WorkflowEntrypoint<Bindings, AddPageIconParams> {
	async run(event: WorkflowEvent<AddPageIconParams>, step: WorkflowStep) {
		const c = new WorkflowContext({
			ctx: this.ctx,
			env: this.env,
			event,
			step,
			workflow: 'Notion_AddPageIcon',
		})

		await c.run(async () => {
			const params = AddPageIconParams.parse(event.payload)
			await handleAddPageIcon(c, params)
		})
	}
}

async function handleAddPageIcon(c: WorkflowContext, params: AddPageIconParams): Promise<void> {
	c.logger.info(`params: ${JSON.stringify(params)}`, { msc: { params } })

	c.sentry.getScope().addAttachment({
		filename: 'workflow_params.json',
		data: JSON.stringify(params),
	})

	const notion = new NotionClient({
		auth: c.env.NOTION_API_TOKEN,
	})

	const { pageID, dbID } = await c.step.do('validate notion payload', async () => {
		const { notionPayload } = params
		const parent = notionPayload.data.parent

		if (parent.type !== 'database_id') {
			throw new NonRetryableError(`invalid notion payload parent type: ${parent.type}`)
		}
		const dbID = parent.database_id.replaceAll('-', '')
		if (!notionDBIcons.some((n) => n.dbs.includes(dbID))) {
			throw new NonRetryableError(`invalid notion payload database_id: ${dbID}`)
		}
		if (notionPayload.data.icon !== null) {
			throw new NonRetryableError('page already contains an icon')
		}
		return { pageID: notionPayload.data.id, dbID }
	})

	const iconURL = await c.step.do('get random icon from KV', async () => {
		const iconsPath = getIconsListPath(dbID)
		if (iconsPath == null) {
			throw new NonRetryableError(`no icons found for dbID: ${dbID}`)
		}

		const res = await c.env.KV.get(iconsPath, 'json')
		const iconsList = IconsList.parse(res)

		shuffleArray(iconsList)
		return iconsList[0]
	})

	await c.step.do('update page icon', async () => {
		// Give it a new icon!
		const res = await notion.pages.update({
			page_id: pageID,
			icon: {
				type: 'external',
				external: {
					url: iconURL, // Next randomized icon from shuffled array
				},
			},
		})

		c.logger.info(`updated notion page: ${res.id}`, { msc: res })
	})
}
