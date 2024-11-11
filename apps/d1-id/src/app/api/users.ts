import users from './users'
import { alreadyExists, hasResults, missingParams, notExists, now } from './util'

import type { Env, IttyRequest } from './types'

export interface User {
	user_id: number
	username: string
	created_on: number
}

/** Get user ID by username */
async function getUserID(db: D1Database, username: string): Promise<number | null> {
	const users = await db
		.prepare('SELECT user_id FROM users WHERE username = ?')
		.bind(username)
		.all()
	if (hasResults<User>(users)) {
		return users.results[0].user_id
	}
	return null
}

/** Get user list */
async function getUsers(_req: IttyRequest, env: Env, _ctx: ExecutionContext) {
	const { results } = await env.D1.prepare('SELECT * FROM users').all()
	return Response.json(results || [])
}

async function createUser(req: IttyRequest, env: Env, _ctx: ExecutionContext) {
	if (!req.params) {
		return missingParams()
	}
	// Check if the user already exists
	const userID = await users.getUserID(env.D1, req.params.user)
	if (userID) {
		return alreadyExists('user')
	}

	const res = await env.D1.prepare('INSERT INTO users (username,created_on) VALUES (?,?)')
		.bind(req.params.user, now())
		.run()
	return Response.json(res)
}

/** Delete user */
async function deleteUser(req: IttyRequest, env: Env, _ctx: ExecutionContext) {
	if (!req.params) {
		return missingParams()
	}
	const userID = await users.getUserID(env.D1, req.params.user)
	if (!userID) {
		return notExists('user')
	}
	const data = await env.D1.prepare('DELETE FROM users WHERE username = ?')
		.bind(req.params.user)
		.run()
	return Response.json(data)
}

export default {
	getUserID,
	getUsers,
	createUser,
	deleteUser,
}
