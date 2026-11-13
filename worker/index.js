// Entry point of the Worker: decides who answers a request, nothing more.
//
// - admin.noamroger.fr: the private dashboard of the statistics (admin.js).
// - noamroger.fr: redirected to www.noamroger.fr, the canonical origin
//   declared in astro.config.mjs.
// - /api/github: neutral GitHub totals for the pages (github.js).
// - /api/hit: anonymous visit statistics, reported by the pages (stats.js).
// - A few endpoints for visitors who come with curl (ops.js).
// - Everything else: the static Astro build (site.js).
//
// A cron purges the old statistics (wrangler.jsonc `triggers`).

import { ADMIN_HOST, handleAdmin } from './admin.js';
import { handleGitHubStats } from './github.js';
import { withSecurityHeaders } from './headers.js';
import { handleOps } from './ops.js';
import { serveSite } from './site.js';
import { handleHit, purge, STATS_PATH } from './stats.js';

const CANONICAL_HOST = 'www.noamroger.fr';
const APEX_HOST = 'noamroger.fr';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// The dashboard has its own host and its own, stricter, headers.
		if (url.hostname === ADMIN_HOST) return handleAdmin(request, env, url);

		if (url.hostname === APEX_HOST) {
			url.hostname = CANONICAL_HOST;
			return withSecurityHeaders(Response.redirect(url.toString(), 301));
		}

		if (url.pathname === '/api/github') {
			return withSecurityHeaders(await handleGitHubStats(request, env, ctx));
		}

		if (url.pathname === STATS_PATH) {
			// Only the real site counts, not a preview on workers.dev.
			const counted = url.hostname === CANONICAL_HOST ? env : { ...env, STATS: undefined };
			return withSecurityHeaders(await handleHit(request, counted, ctx, url));
		}

		const ops = await handleOps(request, env, url);
		if (ops) return withSecurityHeaders(ops);

		return serveSite(request, env, url);
	},

	async scheduled(controller, env, ctx) {
		ctx.waitUntil(purge(env));
	},
};
