import { logger } from '@repo/logging'

import { getNamespaceID } from './namespaces'
import users from './users'
import { alreadyExists, hasResults, missingParams, notExists, now } from './util'

import type { Env, IttyRequest } from './types'

export interface ID {
	_id: number
	name: string
	created_on: number
	user_id: number
	namespace_id: number
}

const blocklist = ['fuk', 'sex', 'fuck', 'damn', 'shit', 'hell']

function makeID(length: number) {
	let result: string
	const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
	const charactersLength = characters.length
	do {
		result = ''
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength))
		}
	} while (blocklist.some((b) => result.includes(b)))
	return result
}

async function getIDs(req: IttyRequest, env: Env, _ctx: ExecutionContext) {
	if (!req.params) {
		return missingParams()
	}
	// get the user
	const userID = await users.getUserID(env.D1, req.params.user)
	if (!userID) {
		return notExists('user')
	}

	// get the namespace
	const namespaceID = await getNamespaceID(env.D1, userID, req.params.namespace)
	if (!namespaceID) {
		return notExists('namespace')
	}

	const ids = await env.D1.prepare(
		'SELECT name,created_on FROM ids WHERE user_id = ? AND namespace_id = ?'
	)
		.bind(userID, namespaceID)
		.all()
	if (!hasResults<ID>(ids)) {
		return Response.json([])
	}
	return Response.json(
		ids.results.map((r: any) => {
			return { id: r.name, created_on: new Date(r.created_on).toISOString() }
		})
	)
}

async function generateID(req: IttyRequest, env: Env, _ctx: ExecutionContext) {
	if (!req.params) {
		return missingParams()
	}

	// Make sure the user exists
	const userID = await users.getUserID(env.D1, req.params.user)
	if (!userID) {
		return notExists('user')
	}

	// make sure the namespace exists
	const namespaceID = await getNamespaceID(env.D1, userID, req.params.namespace)
	if (!namespaceID) {
		return notExists('namespace')
	}

	// Try up to 10 times to generate an ID
	const idLen = 5
	let id = makeID(idLen)
	for (let i = 0; i < 10; i++) {
		const exists = await getIDsID(env.D1, namespaceID, id)
		if (!exists) {
			logger.debug('trying 2')
			await env.D1.prepare(
				'INSERT INTO ids (user_id,namespace_id,name,created_on) VALUES (?,?,?,?)'
			)
				.bind(userID, namespaceID, id, now())
				.run()
			return Response.json({ id: id, tries: i + 1 })
		} else {
			id = makeID(idLen)
		}
	}
}

async function getIDsID(db: D1Database, namespaceID: number, name: string): Promise<number | null> {
	const ids = await db
		.prepare('SELECT * FROM ids WHERE namespace_id = ? AND name = ?')
		.bind(namespaceID, name)
		.all()
	if (hasResults<ID>(ids)) {
		return ids.results[0]._id
	}
	return null
}

async function addID(req: IttyRequest, env: Env, _ctx: ExecutionContext) {
	if (!req.params) {
		return missingParams()
	}

	// Make sure the user exists
	const userID = await users.getUserID(env.D1, req.params.user)
	if (!userID) {
		return notExists('user')
	}

	// make sure the namespace exists
	const namespaceID = await getNamespaceID(env.D1, userID, req.params.namespace)
	if (!namespaceID) {
		return notExists('namespace')
	}

	// Make sure the ID doesn't already exist
	const idID = await getIDsID(env.D1, namespaceID, req.params.id)
	if (idID) {
		return alreadyExists('id')
	}

	// Insert the ID
	const res = await env.D1.prepare(
		'INSERT INTO ids (user_id,namespace_id,name,created_on) VALUES (?,?,?,?)'
	)
		.bind(userID, namespaceID, req.params.id, now())
		.run()
	return Response.json(res)
}

async function deleteID(_req: IttyRequest, _env: Env, _ctx: ExecutionContext) {
	return new Response(`not implemented`, { status: 501 })
}

export default {
	getIDs,
	generateID,
	addID,
	deleteID,
}
