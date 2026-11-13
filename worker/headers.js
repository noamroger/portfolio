// Headers of the responses built by the Worker itself.
//
// public/_headers only reaches the responses that come from the assets
// binding. The ones built here (redirects, API, plain-text endpoints) get the
// essentials by hand.

/** Keep in sync with public/_headers. */
const HSTS = 'max-age=31536000';

/** For whoever runs curl -I. Keep in sync with public/_headers. */
const EXTRA_HEADERS = {
	'X-Hiring': 'Work-study wanted, DevOps / Cloud, September 2027 - contact@noamroger.fr',
	'X-Flag': 'flag{curl_dash_i_is_a_reflex}',
};

export function withSecurityHeaders(response) {
	const secured = new Response(response.body, response);
	secured.headers.set('Strict-Transport-Security', HSTS);
	secured.headers.set('X-Content-Type-Options', 'nosniff');
	for (const [name, value] of Object.entries(EXTRA_HEADERS)) secured.headers.set(name, value);
	return secured;
}
