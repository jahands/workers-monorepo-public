import { schema } from './schema'

import type { Env, IttyRequest } from './types'

async function updateSchema(_req: IttyRequest, env: Env, _ctx: ExecutionContext) {
	const data = await env.D1.batch([
		...['ids', 'namespaces', 'users'].map((t) => env.D1.prepare(`DROP TABLE IF EXISTS ${t}`)),
		...schema.map((s) => env.D1.prepare(s)),
	])
	return Response.json(data)
}

async function getAllData(_req: IttyRequest, env: Env, _ctx: ExecutionContext) {
	const users = await env.D1.prepare('SELECT user_id,username,created_on FROM users').all()
	const namespaces = await env.D1.prepare(
		'SELECT namespace_id,user_id,name,created_on FROM namespaces'
	).all()
	const ids = await env.D1.prepare('SELECT _id,user_id,namespace_id,name,created_on FROM ids').all()
	const data = {
		users: users.results,
		namespaces: namespaces.results,
		ids: ids.results,
	}
	return new Response(JSON.stringify(data, null, 2))
}

async function getStats(_req: IttyRequest, env: Env, _ctx: ExecutionContext) {
	const res = await env.D1.batch(
		['PRAGMA table_list', 'PRAGMA table_info', 'PRAGMA data_version'].map((s) => env.D1.prepare(s))
	)
	return new Response(JSON.stringify(res, null, 2))
}

export default {
	updateSchema,
	getAllData,
	getStats,
}
