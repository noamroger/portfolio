/**
 * Tells the Worker which page is being displayed (worker/stats.js), once per
 * page, client-side navigations included. The Worker cannot count on its own:
 * pages are prefetched and cached, so the requests it sees are not the views.
 *
 * No cookie, nothing written in the browser, and nothing sent but the path
 * and, on arrival, the address of the site the visitor comes from.
 */
import { siteOrigins } from '../i18n';

let arrived = false;

function report() {
	const first = !arrived;
	arrived = true;

	// The first page of a visit: a real navigation (not a reload, not the back
	// button) that does not come from the site itself.
	const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
	// Switching language changes domain: still the same visit.
	const own = [location.origin, ...Object.values(siteOrigins)];
	const external = !own.some((origin) => document.referrer.startsWith(`${origin}/`));
	const entry = first && external && (navigation?.type ?? 'navigate') === 'navigate';

	fetch('/api/hit', {
		method: 'POST',
		keepalive: true,
		headers: { 'Content-Type': 'text/plain' },
		body: JSON.stringify({ p: location.pathname, e: entry ? 1 : 0, r: entry ? document.referrer : '' }),
	}).catch(() => {
		// Statistics are a nice-to-have: never an error in the console.
	});
}

if (!import.meta.env.DEV) document.addEventListener('astro:page-load', report);
