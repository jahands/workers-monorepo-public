export interface CFTrace {
	/** Cloudflare colo we're in */
	colo: string
	/** Cloudflare location we're in (two letter country code)*/
	loc: string
	/** Raw output from /cdn-cgi/trace */
	raw: string
}

/** Gets trace from /cdn-cgi/trace
 * Throws if there is an error getting the trace
 */
export async function getCFTrace(timeoutMs = 200): Promise<CFTrace> {
	const traceURL = 'https://cloudflare.com/cdn-cgi/trace'
	const res = await fetch(traceURL, {
		signal: AbortSignal.timeout(timeoutMs),
	})
	if (!res.ok) {
		throw new Error(`Failed to get trace from ${traceURL}`)
	}

	const raw = await res.text()
	// Parse out the colo, falling back on 'UNKNOWN' if it's not found
	const colo = getValueFromTrace(raw, 'colo')
	const loc = getValueFromTrace(raw, 'loc')

	return { colo, loc, raw }
}

/** Gets a value from a trace string.
 * @param defaultVal the default value to return if the key isn't found
 * (or if the key has no value).
 * @returns The value or default, always in uppercase.
 */
function getValueFromTrace(trace: string, key: string, defaultVal = 'UNKNOWN'): string {
	const val =
		trace
			.split('\n')
			.find((line) => line.toLowerCase().startsWith(`${key.toLowerCase()}=`))
			?.split('=')[1]
			.trim()
			.toUpperCase() || defaultVal.toUpperCase()

	return val
}

/** Example output:
	fl=641f104
	h=cloudflare.com
	ip=2a06:98c0:3600::103
	ts=1689602096.309
	visit_scheme=https
	uag=
	colo=DFW
	sliver=010-dfw07
	http=http/1.1
	loc=US
	tls=off
	sni=off
	warp=off
	gateway=off
	rbi=off
	kex=none
*/
