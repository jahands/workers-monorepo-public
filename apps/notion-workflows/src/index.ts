import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { match } from 'ts-pattern'
import { z } from 'zod'

import {
	getTracingConfig,
	initSentry,
	useAuth,
	useAxiomLogger,
	useMeta,
	useNotFound,
	useOnError,
	useSentry,
} from '@repo/hono-helpers'
import { instrument } from '@repo/otel'
import { useApiTokens } from '@repo/workflows-helpers/auth'

import { IconsList, mcIconsPath } from './workflows/addpageicon/icons'

import type { App, Bindings } from './types'

export { AddPageIcon } from './workflows/addpageicon/addpageicon'

const app = new Hono<App>()
	.use(
		'*', // Middleware
		useMeta,
		useSentry(initSentry(), 'http.server'),
		useAxiomLogger
	)

	// Hooks
	.onError(useOnError())
	.notFound(useNotFound())

	// Extract api tokens to context
	.use(useApiTokens)

	// Auth all APIs with notion read/write token
	.use('/api/*', async (c, next) =>
		useAuth({
			token: c.var.ApiTokens.notion_rw,
			bearerAuth: true,
			queryKey: true,
		})(c, next)
	)

	// Admin API to get instance from any workflow in this Worker
	.get(
		'/api/workflows/:workflowName/instances/:id',
		zValidator(
			'param',
			z.object({
				workflowName: z.enum(['addpageicon']),
				id: z.string().uuid(),
			})
		),
		async (c) => {
			const { id, workflowName } = c.req.valid('param')
			const workflow = match(workflowName)
				.with('addpageicon', () => c.env.AddPageIcon)
				.exhaustive()

			const instance = await workflow.get(id)
			return Response.json({
				id: instance.id,
				status: await instance.status(),
			})
		}
	)

	.post(
		'/api/icons/minecraft',
		zValidator(
			'json',
			z.object({
				icons: IconsList,
			})
		),
		async (c) => {
			const { icons } = c.req.valid('json')
			await c.env.KV.put(mcIconsPath, JSON.stringify(icons))
			c.var.logger?.info(`Notion_AddPageIcon: wrote ${icons.length} minecraft icons to KV`)
			return c.text(`Wrote ${icons.length} icons to KV`)
		}
	)

	// Auth all hooks with a write-only token
	.use('/hooks/*', async (c, next) =>
		useAuth({
			token: c.var.ApiTokens.notion_hooks_w,
			bearerAuth: true,
			queryKey: true,
		})(c, next)
	)

	// =========================== //
	// ===== Notion webhooks ===== //
	// =========================== //

	.post('/hooks/add_page_icon', async (c) => {
		const notionPayload = await c.req.json()
		const instance = await c.env.AddPageIcon.create({
			params: {
				notionPayload,
			},
		})

		return c.json({
			instance_id: instance.id,
			status: await instance.status(),
		})
	})

const handler = {
	fetch: app.fetch,
} satisfies ExportedHandler<Bindings>

export default instrument(handler, getTracingConfig<App>())
