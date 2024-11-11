/** Helper to wrap response in new rewponse to make headers mutable */
export function newResponse(res: Response): Response {
	return new Response(res.body, res)
}
