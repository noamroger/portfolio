// Serves the static Astro build from ./dist (see wrangler.jsonc).
//
// What static assets can't do on their own:
// - noamroger.fr must redirect to www.noamroger.fr, the canonical origin
//   declared in astro.config.mjs (Netlify used to do this as primary domain).
// - Videos need byte ranges, which static assets don't serve (worker/range.js).
// - English pages need the English 404. `not_found_handling: "404-page"` looks
//   for a 404.html file, and Astro emits the English one as /en/404/index.html,
//   so every miss would otherwise get the French page.
// - A few endpoints for visitors who come with curl (worker/ops.js).

import { handleGitHubStats } from './github.js';
import { EXTRA_HEADERS, handleOps } from './ops.js';
import { isVideo, withRange } from './range.js';

const CANONICAL_HOST = 'www.noamroger.fr';
const APEX_HOST = 'noamroger.fr';

// public/_headers only reaches the responses that come from the assets
// binding. The ones built here (redirect, API) get the essentials by hand.
// Keep HSTS in sync with public/_headers.
const HSTS = 'max-age=31536000';

function withSecurityHeaders(response) {
	const secured = new Response(response.body, response);
	secured.headers.set('Strict-Transport-Security', HSTS);
	secured.headers.set('X-Content-Type-Options', 'nosniff');
	for (const [name, value] of Object.entries(EXTRA_HEADERS)) secured.headers.set(name, value);
	return secured;
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (url.hostname === APEX_HOST) {
			url.hostname = CANONICAL_HOST;
			return withSecurityHeaders(Response.redirect(url.toString(), 301));
		}

		if (url.pathname === '/api/github') {
			return withSecurityHeaders(await handleGitHubStats(request, env, ctx));
		}

		const ops = await handleOps(request, env, url);
		if (ops) return withSecurityHeaders(ops);

		if (isVideo(url.pathname)) {
			// Ask for the whole file, always with GET: the slice is cut in
			// withRange, which needs the length (a HEAD answer has none).
			const headers = new Headers(request.headers);
			headers.delete('Range');
			headers.delete('If-Range');
			const assetRequest = new Request(request.url, { method: 'GET', headers });
			return withRange(request, await env.ASSETS.fetch(assetRequest));
		}

		const response = await env.ASSETS.fetch(request);

		if (response.status === 404 && (url.pathname === '/en' || url.pathname.startsWith('/en/'))) {
			const englishNotFound = await env.ASSETS.fetch(new URL('/en/404/', url));
			if (englishNotFound.ok) {
				return new Response(englishNotFound.body, {
					status: 404,
					headers: englishNotFound.headers,
				});
			}
		}

		return response;
	},
};
