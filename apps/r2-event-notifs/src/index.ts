import { withLogTags } from 'workers-tagged-logger'

import { CF } from '@repo/schema'

import { initAppContext } from './appContext'

import type { Bindings } from './types'

export default {
	queue: handleQueue,
} satisfies ExportedHandler<Bindings>

async function handleQueue(batch: MessageBatch, env: Bindings, ctx: ExecutionContext) {
	await withLogTags({ source: env.NAME, tags: { handler: 'queue' } }, async () => {
		const c = await initAppContext({ env, ctx, transactionName: 'queue' })
		c.logger?.info(`handling queue batch of ${batch.messages.length} messages`, {
			type: 'queue-batch',
			count: batch.messages.length,
		})

		try {
			for (const message of batch.messages) {
				try {
					c.sentry?.pushScope()
					c.sentry?.configureScope((scope) => {
						scope.addAttachment({
							filename: 'r2-event.json',
							data: JSON.stringify(message.body),
						})
					})

					const event = CF.R2EventPayload.passthrough().parse(message.body)
					c.logger?.info(`r2 event notification ${event.bucket}:${event.action}`, {
						timestamp: event.eventTime.toISOString(),
						type: 'r2-event',
						event,
					})
				} catch (e) {
					c.sentry?.captureException(e)
				} finally {
					c.sentry?.popScope()
					message.ack() // Never retry these
				}
			}
		} catch (e) {
			c.sentry?.captureException(e)
		} finally {
			await c.logger?.flush()
			c.tx?.finish()
		}
	})
}
