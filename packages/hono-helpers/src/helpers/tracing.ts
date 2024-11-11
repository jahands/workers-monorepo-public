import type { ResolveConfigFn } from '@repo/otel'
import type { HonoApp } from '../types'

/**
 * Get the tracing configuration for the service.
 * Can be used for both standard handlers and Durable Objects.
 *
 * @param [tag=''] - Optional tag to append to the service name (useful for Durable Objects)
 */
export function getTracingConfig<T extends HonoApp>(tag = '') {
	const config: ResolveConfigFn = (env: T['Bindings'], _trigger) => {
		const hostname = env.ENVIRONMENT === 'VITEST' ? 'echoback.uuid.rocks' : 'api.axiom.co'
		let serviceName = env.NAME
		if (tag && tag.length > 0) {
			serviceName += `-${tag}`
		}
		return {
			exporter: {
				url: `https://${hostname}/v1/traces`,
				headers: {
					authorization: `Bearer ${env.AXIOM_API_KEY}`,
					'x-axiom-dataset': env.AXIOM_DATASET_OTEL,
				},
			},
			service: {
				name: serviceName,
				version: env.SENTRY_RELEASE,
			},
		}
	}
	return config
}
