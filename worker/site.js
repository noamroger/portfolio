// The static Astro build, served from the assets binding (./dist).
//
// What the binding cannot do on its own:
// - Videos need byte ranges, which static assets don't serve (worker/range.js).
// - noamroger.dev serves at its root what the build emits under /en
//   (dist/en/about/ is noamroger.dev/about/). What has no English twin is
//   shared by both domains: /_astro/, the images, /fonts.json…
// - English pages need the English 404. `not_found_handling: "404-page"` looks
//   for a 404.html file, and Astro emits the English one as /en/404/index.html,
//   so every miss would otherwise get the French page.

import { withSecurityHeaders, withSiteHeaders } from './headers.js';
import { ENGLISH_PREFIX, FRENCH } from './hosts.js';
import { isVideo, withRange } from './range.js';

async function serveVideo(request, env, site) {
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return withSecurityHeaders(new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } }), site ?? FRENCH);
	}
	// Ask for the whole file, always with GET: the slice is cut in
	// withRange, which needs the length (a HEAD answer has none).
	const headers = new Headers(request.headers);
	headers.delete('Range');
	headers.delete('If-Range');
	const assetRequest = new Request(request.url, { method: 'GET', headers });
	return withRange(request, await env.ASSETS.fetch(assetRequest));
}

async function englishNotFound(env, url, fallback) {
	const page = await env.ASSETS.fetch(new URL(`${ENGLISH_PREFIX}/404/`, url));
	if (!page.ok) return fallback;
	// The /en* rule of public/_headers would let browsers keep this 404 for a
	// day: a missing page must be asked for again.
	const headers = new Headers(page.headers);
	headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
	return new Response(page.body, { status: 404, headers });
}

/** noamroger.dev: the English twin of the path first, the shared files next. */
async function serveEnglish(request, env, url, site) {
	const shared = url.pathname.startsWith('/_astro/');
	if (!shared) {
		const twin = new URL(url);
		twin.pathname = ENGLISH_PREFIX + url.pathname;
		const response = await env.ASSETS.fetch(new Request(twin, request));
		if (response.status !== 404) return withSiteHeaders(withoutPrefix(response), site);
	}
	const response = await env.ASSETS.fetch(request);
	return withSiteHeaders(response.status === 404 ? await englishNotFound(env, url, response) : response, site);
}

/** The binding redirects /en/about to /en/about/: the visitor asked for /about. */
function withoutPrefix(response) {
	const location = response.headers.get('Location');
	if (!location?.startsWith(`${ENGLISH_PREFIX}/`)) return response;
	const headers = new Headers(response.headers);
	headers.set('Location', location.slice(ENGLISH_PREFIX.length));
	return new Response(response.body, { status: response.status, headers });
}

/** `site` is the one of hosts.js, or null on a preview. */
export async function serveSite(request, env, url, site) {
	if (isVideo(url.pathname)) return serveVideo(request, env, site);
	if (site?.locale === 'en') return serveEnglish(request, env, url, site);

	const response = await env.ASSETS.fetch(request);

	// Only a preview still has addresses under /en.
	if (response.status === 404 && (url.pathname === ENGLISH_PREFIX || url.pathname.startsWith(`${ENGLISH_PREFIX}/`))) {
		return englishNotFound(env, url, response);
	}
	return response;
}
