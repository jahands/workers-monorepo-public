import { z } from 'zod'

export const R2NotifActions = [
	'PutObject',
	'CopyObject',
	'CompleteMultipartUpload',
	'DeleteObject',
	'LifecycleDeletion',
] as const satisfies string[]

export type R2NotifAction = z.infer<typeof R2NotifAction>
export const R2NotifAction = z.enum(R2NotifActions)

/** R2 Event Notifications */
export type R2EventPayload = z.infer<typeof R2EventPayload>
export const R2EventPayload = z.object({
	account: z.string(),
	action: R2NotifAction,
	bucket: z.string(),
	eventTime: z.coerce.date(),
	object: z.object({
		key: z.string(),
		// These are only present on certain event types
		eTag: z.string().optional(),
		size: z.number().optional(),
	}),
})
