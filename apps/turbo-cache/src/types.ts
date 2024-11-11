import type { Redis } from '@upstash/redis/cloudflare'
import type { HonoApp, SharedHonoBindings, SharedHonoVariables } from '@repo/hono-helpers'
import type { Tracer } from '@repo/otel'
import type { TurboCache } from './TurboCache'

export type Bindings = SharedHonoBindings & {
	// axiom: workers-general 1P-72dx8

	/** Same as SRH_TOKEN in 1P-5bpza
	 * Used to connect to Serverless Redis HTTP on Mini server
	 */
	UPSTASH_REDIS_REST_TOKEN: string
	UPSTASH_REDIS_REST_URL: string

	R2: R2Bucket
	KV: KVNamespace
	TURBOCACHE: DurableObjectNamespace<TurboCache>

	/** 1P-cue6u */
	TURBO_TOKEN: string
}

declare module 'cloudflare:test' {
	interface ProvidedEnv extends Bindings {}
}

export type Variables = SharedHonoVariables & {
	tracer: Tracer
	redis: Redis
}
export interface App extends HonoApp {
	Bindings: Bindings
	Variables: Variables
}
