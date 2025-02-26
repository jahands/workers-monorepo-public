import type { HonoApp } from '@repo/hono-helpers'
import type { SharedHonoBindings, SharedHonoVariables } from '@repo/hono-helpers/src/types'

export type Bindings = SharedHonoBindings & {
	// axiom: workers-general 1P-72dx8

	D1: D1Database
	API_KEYS: string
}

/** Variables can be extended */
export type Variables = SharedHonoVariables

export interface App extends HonoApp {
	Bindings: Bindings
	Variables: Variables
}
