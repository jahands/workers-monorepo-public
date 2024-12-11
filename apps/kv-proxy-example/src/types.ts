import type { HonoApp, SharedHonoBindings, SharedHonoVariables } from '@repo/hono-helpers'

export type Bindings = SharedHonoBindings & {
	// axiom: workers-general 1P-72dx8

	KV: KVNamespace

	/** API key for authing to kv-proxy */
	API_KEY: string
}

export type Variables = SharedHonoVariables

export interface App extends HonoApp {
	Bindings: Bindings
	Variables: Variables
}
