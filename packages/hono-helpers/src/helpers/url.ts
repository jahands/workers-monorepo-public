/** Redacts keys from a url */
export function redactUrl(_url: URL | string): URL {
	let url: URL
	if (typeof _url === 'string') {
		url = new URL(_url)
	} else {
		url = new URL(_url.toString()) // clone
	}
	for (const [key, _] of Array.from(url.searchParams)) {
		if (['key', 'apiKey', 'api_key'].includes(key.toLowerCase())) {
			url.searchParams.set(key, 'REDACTED')
		}
	}
	return url
}
