import type { Request as IttyRequest } from 'itty-router'

export type IttyRequest = IttyRequest

export type MethodType = string

export interface IRequest extends IttyRequest {
	method: MethodType // method is required to be on the interface
	url: string // url is required to be on the interface
	optional?: string
}

export interface IMethods extends IHTTPMethods {
	get: Route
	post: Route
	put: Route
	delete: Route
	patch: Route
	head: Route
	options: Route
}

export type Handler = (req: IttyRequest, env: Env, ctx: ExecutionContext) => Promise<Response>

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	D1: D1Database
	API_KEYS: string
}
