import type { Request as IttyRequest } from 'itty-router'
import type { Env } from './types'

const KEYS = (env: Env) => JSON.parse(env.API_KEYS) as { keys: Record<string, string> }

function authUser(req: IttyRequest, env: Env, _ctx: ExecutionContext): Response | undefined {
	const isAuthed = () => {
		const keys = KEYS(env).keys
		// Make sure required request data is present
		if (!req.query || !req.params || !req.params.user) return false

		// Get the API key
		const reqKey = req.query['key']
		if (!reqKey) return false

		// Make sure the API key is valid
		const user = req.params.user
		const userKey = keys[user]
		if (!userKey) return false
		return reqKey === userKey
	}

	if (!isAuthed()) {
		return Response.json(
			{ error: `forbidden` },
			{
				status: 403,
			}
		)
	}
}

function authAdmin(req: IttyRequest, env: Env, _ctx: ExecutionContext): Response | undefined {
	const isAuthed = () => {
		const keys = KEYS(env).keys
		// Make sure required request data is present
		if (!req.query) return false

		// Get the API key
		const reqKey = req.query['key']
		if (!reqKey) return false

		// Make sure the API key is valid
		const user = 'jacob' // hardcoded admin user
		const userKey = keys[user]
		if (!userKey) return false
		return reqKey === userKey
	}

	if (!isAuthed()) {
		return Response.json(
			{ error: `forbidden` },
			{
				status: 403,
			}
		)
	}
}

export default {
	user: authUser,
	admin: authAdmin,
}
