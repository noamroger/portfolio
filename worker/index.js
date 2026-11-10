// Serves the static Astro build from ./dist (see wrangler.jsonc).
//
// What static assets can't do on their own:
// - noamroger.fr must redirect to www.noamroger.fr, the canonical origin
//   declared in astro.config.mjs (Netlify used to do this as primary domain).
// - Videos need byte ranges, which static assets don't serve (worker/range.js).
// - English pages need the English 404. `not_found_handling: "404-page"` looks
//   for a 404.html file, and Astro emits the English one as /en/404/index.html,
//   so every miss would otherwise get the French page.

import { handleGitHubStats } from './github.js';
import { isVideo, withRange } from './range.js';

const CANONICAL_HOST = 'www.noamroger.fr';
const APEX_HOST = 'noamroger.fr';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (url.hostname === APEX_HOST) {
			url.hostname = CANONICAL_HOST;
			return Response.redirect(url.toString(), 301);
		}

		if (url.pathname === '/api/github') {
			return handleGitHubStats(request, env, ctx);
		}

		if (isVideo(url.pathname)) {
			// Ask for the whole file: the slice is cut in withRange.
			const assetRequest = new Request(request, { headers: new Headers(request.headers) });
			assetRequest.headers.delete('Range');
			assetRequest.headers.delete('If-Range');
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
