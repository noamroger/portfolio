// Anonymous visit statistics, kept in D1 (binding STATS, see wrangler.jsonc
// and migrations/0001_stats.sql). Read by the dashboard of worker/admin.js.
//
// Why a beacon and not the page requests themselves: every page is prefetched
// on load and then kept by the browser (astro.config.mjs, public/_headers), so
// the requests the Worker sees do not match what a visitor actually opens.
// src/scripts/stats.ts posts one line per page really displayed instead.
//
// What is kept for a view: path, time, country (from Cloudflare), kind of
// device, host name of the referring site, and a visitor hash.
// What is not: the IP address and the user agent. Both only go through the
// hash, salted with a random value that changes every day and is deleted when
// the day is over. The same visitor gets another hash the next day, and a past
// hash cannot be traced back to an address.
//
// Nothing is stored in the browser of a visitor: no cookie, no localStorage.

export const STATS_PATH = '/api/hit';
export const RETENTION_DAYS = 90;
/** Set on the owner's browsers by the dashboard login: their views are skipped. */
export const IGNORE_COOKIE = 'stats_ignore';

const MAX_VIEWS_PER_VISITOR = 300;
const MAX_VIEWS_PER_DAY = 5000;

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|uptime|curl|wget|python|httpie|scrapy|phantom|puppeteer|playwright|selenium|facebookexternalhit|whatsapp|embedly|gpt|claude|perplexity|bytedance/i;

const PARIS_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' });
/** YYYY-MM-DD in Paris, where the site is read from the most. */
export const parisDay = (date = new Date()) => PARIS_DAY.format(date);
/** The Paris day `days` days before today. */
export const daysAgo = (days) => parisDay(new Date(Date.now() - days * 86_400_000));

const hex = (bytes) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

// The salt of the day, kept for the life of the isolate to save a query.
let known = { day: '', salt: '' };

async function saltOf(db, day) {
	if (known.day === day) return known.salt;
	const fresh = hex(crypto.getRandomValues(new Uint8Array(32)));
	// The first view of a day creates its salt and drops the previous ones.
	const [, , row] = await db.batch([
		db.prepare('INSERT OR IGNORE INTO salts (day, salt) VALUES (?1, ?2)').bind(day, fresh),
		db.prepare('DELETE FROM salts WHERE day < ?1').bind(day),
		db.prepare('SELECT salt FROM salts WHERE day = ?1').bind(day),
	]);
	known = { day, salt: row.results[0].salt };
	return known.salt;
}

/** Same visitor, same day: same hash. 64 bits are plenty to count people. */
export async function visitorHash(db, request, day = parisDay()) {
	const salt = await saltOf(db, day);
	const ip = request.headers.get('CF-Connecting-IP') ?? '';
	const agent = request.headers.get('User-Agent') ?? '';
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}|${ip}|${agent}`));
	return hex(digest).slice(0, 16);
}

function deviceOf(agent) {
	if (/ipad|tablet|kindle|silk|android(?!.*mobi)/i.test(agent)) return 'tablet';
	if (/mobi|iphone|ipod|android/i.test(agent)) return 'mobile';
	return 'desktop';
}

/** Host name of the referring site, or null for none or for the site itself. */
function referrerOf(value) {
	if (typeof value !== 'string' || !value) return null;
	try {
		const { protocol, hostname } = new URL(value.slice(0, 500));
		if (!['http:', 'https:', 'android-app:'].includes(protocol)) return null;
		const host = hostname.toLowerCase().replace(/^www\./, '');
		if (!/^[a-z0-9.-]{1,100}$/.test(host)) return null;
		if (host === 'noamroger.fr' || host.endsWith('.noamroger.fr')) return null;
		return host;
	} catch {
		return null;
	}
}

/** '/about/' and '/about' are one page. Null for what cannot be a path. */
function pathOf(value) {
	if (typeof value !== 'string' || value.length > 200) return null;
	if (!/^\/[\w\-./~%@+]*$/.test(value)) return null;
	return value.length > 1 ? value.replace(/\/+$/, '') || '/' : value;
}

const hasCookie = (request, name) => (request.headers.get('Cookie') ?? '').split(';').some((part) => part.trim().startsWith(`${name}=`));

async function record(request, env, url, hit, path) {
	const agent = request.headers.get('User-Agent') ?? '';

	// The path comes from the browser: ask the assets whether it exists rather
	// than trusting it.
	const asset = await env.ASSETS.fetch(new Request(new URL(hit.p, url), { method: 'HEAD' }));
	const notFound = asset.status === 404 ? 1 : 0;
	const entry = hit.e ? 1 : 0;

	const db = env.STATS;
	const day = parisDay();
	const visitor = await visitorHash(db, request, day);
	const country = /^[A-Z]{2}$/.test(request.cf?.country ?? '') ? request.cf.country : null;

	await db.batch([
		db.prepare('INSERT INTO counters (day, views) VALUES (?1, 1) ON CONFLICT (day) DO UPDATE SET views = views + 1').bind(day),
		db
			.prepare(
				`INSERT INTO views (ts, day, path, not_found, entry, country, device, referrer, visitor)
				 SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9
				 WHERE (SELECT views FROM counters WHERE day = ?2) <= ?10
				   AND (SELECT COUNT(*) FROM views WHERE day = ?2 AND visitor = ?9) < ?11`,
			)
			.bind(Math.floor(Date.now() / 1000), day, path.slice(0, 120), notFound, entry, country, deviceOf(agent), entry ? referrerOf(hit.r) : null, visitor, MAX_VIEWS_PER_DAY, MAX_VIEWS_PER_VISITOR),
	]);
}

/** POST /api/hit: always answers 204, the view is written after the answer. */
export async function handleHit(request, env, ctx, url) {
	if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
	const done = new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

	if (!env.STATS) return done;
	// Browsers say where a request comes from: only the pages of the site count.
	const site = request.headers.get('Sec-Fetch-Site');
	if (site && site !== 'same-origin') return done;
	if (Number(request.headers.get('Content-Length') ?? 0) > 2048) return done;
	if (hasCookie(request, IGNORE_COOKIE)) return done;
	const agent = request.headers.get('User-Agent') ?? '';
	if (!agent || BOT.test(agent)) return done;

	// The body has to be read before answering: it is gone afterwards.
	let hit;
	try {
		hit = JSON.parse((await request.text()).slice(0, 2048));
	} catch {
		return done;
	}
	const path = pathOf(hit?.p);
	if (!path) return done;

	ctx.waitUntil(record(request, env, url, hit, path).catch((error) => console.error('stats: view not recorded', error)));
	return done;
}

/** Cron (wrangler.jsonc): nothing older than RETENTION_DAYS survives. */
export async function purge(env) {
	if (!env.STATS) return;
	const today = parisDay();
	const oldest = daysAgo(RETENTION_DAYS - 1);
	const db = env.STATS;
	await db.batch([
		db.prepare('DELETE FROM views WHERE day < ?1').bind(oldest),
		db.prepare('DELETE FROM counters WHERE day < ?1').bind(oldest),
		db.prepare('DELETE FROM salts WHERE day < ?1').bind(today),
		db.prepare('DELETE FROM login_failures WHERE ts < ?1').bind(Math.floor(Date.now() / 1000) - 86_400),
	]);
}
