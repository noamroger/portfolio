// The static Astro build, served from the assets binding (./dist).
//
// What the binding cannot do on its own:
// - Videos need byte ranges, which static assets don't serve (worker/range.js).
// - English pages need the English 404. `not_found_handling: "404-page"` looks
//   for a 404.html file, and Astro emits the English one as /en/404/index.html,
//   so every miss would otherwise get the French page.

import { withSecurityHeaders } from './headers.js';
import { isVideo, withRange } from './range.js';

async function serveVideo(request, env) {
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return withSecurityHeaders(new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } }));
	}
	// Ask for the whole file, always with GET: the slice is cut in
	// withRange, which needs the length (a HEAD answer has none).
	const headers = new Headers(request.headers);
	headers.delete('Range');
	headers.delete('If-Range');
	const assetRequest = new Request(request.url, { method: 'GET', headers });
	return withRange(request, await env.ASSETS.fetch(assetRequest));
}

export async function serveSite(request, env, url) {
	if (isVideo(url.pathname)) return serveVideo(request, env);

	const response = await env.ASSETS.fetch(request);

	if (response.status === 404 && (url.pathname === '/en' || url.pathname.startsWith('/en/'))) {
		const englishNotFound = await env.ASSETS.fetch(new URL('/en/404/', url));
		if (englishNotFound.ok) {
			// The /en* rule of public/_headers would let browsers keep this
			// 404 for a day: a missing page must be asked for again.
			const headers = new Headers(englishNotFound.headers);
			headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
			return new Response(englishNotFound.body, { status: 404, headers });
		}
	}

	return response;
}
