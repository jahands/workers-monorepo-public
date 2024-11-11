import type { Env, IttyRequest } from './types'

export interface Results<Type> {
	results: Type[]
}
export function hasResults<Type>(data: any): data is Results<Type> {
	return data.results !== undefined && data.results.length > 0
}

// Get current timestamp in milliseconds
export const now = () => new Date().getTime()
export function missingParams() {
	return Response.json(
		{ error: `missing params` },
		{
			status: 400,
		}
	)
}
export function alreadyExists(name: string) {
	return Response.json(
		{ error: `${name} already exists` },
		{
			status: 400,
		}
	)
}
export function notExists(name: string) {
	return Response.json(
		{ error: `${name} does not exists` },
		{
			status: 400,
		}
	)
}

// Converts whitelisted params to lowercase
export function lowerParams(req: IttyRequest, _env: Env, _ctx: ExecutionContext) {
	const whitelist = ['user', 'namespace']
	const params = req.params
	if (!params) return
	for (const key in params) {
		if (whitelist.includes(key)) {
			params[key] = params[key].toLowerCase()
		}
	}
	req.params = params
}
