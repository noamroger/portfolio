// Headers of the responses built by the Worker itself.
//
// public/_headers only reaches the responses that come from the assets
// binding. The ones built here (redirects, API, plain-text endpoints) get the
// essentials by hand.

/** Keep in sync with public/_headers. */
const HSTS = 'max-age=31536000';

/** For whoever runs curl -I. Keep in sync with public/_headers. */
const hiring = (site) => `Work-study wanted, DevOps / Cloud, September 2027 - ${site.email}`;
const FLAG = 'flag{curl_dash_i_is_a_reflex}';

/** `site` (hosts.js) gives the contact address of the domain that answers. */
export function withSecurityHeaders(response, site) {
	const secured = new Response(response.body, response);
	secured.headers.set('Strict-Transport-Security', HSTS);
	secured.headers.set('X-Content-Type-Options', 'nosniff');
	secured.headers.set('X-Hiring', hiring(site));
	secured.headers.set('X-Flag', FLAG);
	return secured;
}

/**
 * public/_headers is one file for both domains and carries the French
 * address: an asset served on another domain gets its own.
 */
export function withSiteHeaders(response, site) {
	const headers = new Headers(response.headers);
	headers.set('X-Hiring', hiring(site));
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
