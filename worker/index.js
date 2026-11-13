// Entry point of the Worker: decides who answers a request, nothing more.
//
// - admin.noamroger.fr: the private dashboard of the statistics (admin.js).
// - Redirects between the domains (hosts.js): noamroger.fr to www, the former
//   noamroger.fr/en/… addresses to noamroger.dev. Decided here, before
//   anything of the site is looked at.
// - /api/github: neutral GitHub totals for the pages (github.js).
// - /api/hit: anonymous visit statistics, reported by the pages (stats.js).
// - A few endpoints for visitors who come with curl (ops.js).
// - Everything else: the static Astro build, French on www.noamroger.fr and
//   English on noamroger.dev (site.js).
//
// A cron purges the old statistics (wrangler.jsonc `triggers`).

import { ADMIN_HOST, handleAdmin } from './admin.js';
import { handleGitHubStats } from './github.js';
import { withSecurityHeaders } from './headers.js';
import { FRENCH, redirectOf, siteOf } from './hosts.js';
import { handleOps } from './ops.js';
import { serveSite } from './site.js';
import { handleHit, handleIgnore, IGNORE_PATH, purge, STATS_PATH } from './stats.js';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// The dashboard has its own host and its own, stricter, headers.
		if (url.hostname === ADMIN_HOST) return handleAdmin(request, env, url);

		const redirect = redirectOf(url);
		if (redirect) return withSecurityHeaders(Response.redirect(redirect.href, 301), siteOf(redirect.hostname));

		// Null on a preview (workers.dev, localhost): served like the French
		// site, with the English pages left under /en, and never counted.
		const site = siteOf(url.hostname);
		const secured = (response) => withSecurityHeaders(response, site ?? FRENCH);

		if (url.pathname === '/api/github') return secured(await handleGitHubStats(request, env, ctx));
		if (url.pathname === STATS_PATH) return secured(await handleHit(request, env, ctx, url, site));
		if (url.pathname === IGNORE_PATH) return secured(handleIgnore(request));

		const ops = await handleOps(request, env, url, site ?? FRENCH);
		if (ops) return secured(ops);

		return serveSite(request, env, url, site);
	},

	async scheduled(controller, env, ctx) {
		ctx.waitUntil(purge(env));
	},
};
