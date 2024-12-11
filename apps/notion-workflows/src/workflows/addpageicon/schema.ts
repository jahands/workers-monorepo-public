import { z } from 'zod'

export type NotionPayload = z.infer<typeof NotionPayload>
export const NotionPayload = z.object({
	source: z.object({
		type: z.string(),
		automation_id: z.string(),
		action_id: z.string(),
		event_id: z.string(),
		attempt: z.number(),
	}),
	data: z.object({
		object: z.string(),
		id: z.string(),
		created_time: z.string(),
		last_edited_time: z.string(),
		created_by: z.object({ object: z.string(), id: z.string() }),
		last_edited_by: z.object({ object: z.string(), id: z.string() }),
		cover: z.any().nullable(),
		icon: z.any().nullable(),
		parent: z.object({ type: z.string(), database_id: z.string() }),
		archived: z.boolean(),
		in_trash: z.boolean(),
		properties: z.object({
			Name: z.object({
				id: z.string(),
				type: z.string(),
				title: z.array(
					z.object({
						type: z.string(),
						text: z.object({ content: z.string(), link: z.any().nullable() }),
						annotations: z.object({
							bold: z.boolean(),
							italic: z.boolean(),
							strikethrough: z.boolean(),
							underline: z.boolean(),
							code: z.boolean(),
							color: z.string(),
						}),
						plain_text: z.string(),
						href: z.any().nullable(),
					})
				),
			}),
		}),
		url: z.string(),
		public_url: z.any().nullable(),
		request_id: z.string(),
	}),
})
