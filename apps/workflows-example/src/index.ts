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

import type { App, Bindings } from './types'

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

	// Auth all routes with admin key by default. If needed, switch to per-route auth, etc.
	.use('*', async (c, next) =>
		useAuth({
			token: c.var.ApiTokens.admin_rw,
			bearerAuth: true,
			queryKey: true,
		})(c, next)
	)

	// Admin API to get instance from any workflow in this Worker
	.get(
		'/workflows/:workflowName/instances/:id',
		zValidator(
			'param',
			z.object({
				workflowName: z.enum(['my-workflow']),
				id: z.string().uuid(),
			})
		),
		async (c) => {
			const { id, workflowName } = c.req.valid('param')
			const workflow = match(workflowName)
				.with('my-workflow', () => c.env.MyWorkflow)
				.exhaustive()

			const instance = await workflow.get(id)
			return Response.json({
				id: instance.id,
				status: await instance.status(),
			})
		}
	)

	.post('/workflows/my-workflow', async (c) => {
		const instance = await c.env.MyWorkflow.create({
			params: {
				// Add params here
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