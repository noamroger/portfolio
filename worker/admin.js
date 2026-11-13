// The private dashboard of the visit statistics, served on admin.noamroger.fr
// (see wrangler.jsonc). Everything is rendered here, on the server: the page
// has no script at all, so its CSP can forbid them outright.
//
// Access: the ADMIN_PASSWORD secret of the Worker. Without it the dashboard
// stays closed (503), it never falls back to being open. A successful login
// sets a signed session cookie, valid 30 days and tied to the password:
// changing the secret signs everybody out.
//
// The login also marks the browser as the owner's (IGNORE_COOKIE, readable by
// www): its page views are no longer counted.

import { daysAgo, IGNORE_COOKIE, parisDay, RETENTION_DAYS, visitorHash } from './stats.js';

export const ADMIN_HOST = 'admin.noamroger.fr';

const SESSION_COOKIE = '__Host-session';
const THEME_COOKIE = 'theme';
const SESSION_SECONDS = 30 * 86_400;
const PERIODS = [1, 7, 30, 90];

// Password guessing: tries allowed per visitor and in total, per window.
const LOGIN_WINDOW_SECONDS = 15 * 60;
const MAX_FAILURES_PER_VISITOR = 5;
const MAX_FAILURES = 30;

const encoder = new TextEncoder();
const hex = (bytes) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const now = () => Math.floor(Date.now() / 1000);

const escapeHtml = (value) =>
	String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = new Intl.NumberFormat('fr-FR');
const fmt = (value) => number.format(value ?? 0);

function cookie(request, name) {
	for (const part of (request.headers.get('Cookie') ?? '').split(';')) {
		const [key, ...value] = part.trim().split('=');
		if (key === name) return value.join('=');
	}
	return null;
}

// ---------------------------------------------------------------- session --

async function sign(password, message) {
	const key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

/** Compares two strings without leaking, through timing, where they differ. */
async function same(a, b) {
	const [left, right] = await Promise.all([a, b].map((value) => crypto.subtle.digest('SHA-256', encoder.encode(value))));
	return crypto.subtle.timingSafeEqual(left, right);
}

async function newSession(password) {
	const expires = now() + SESSION_SECONDS;
	return `${expires}.${await sign(password, `session.${expires}`)}`;
}

async function hasSession(request, password) {
	const [expires, signature] = (cookie(request, SESSION_COOKIE) ?? '').split('.');
	if (!/^\d{1,12}$/.test(expires ?? '') || !signature) return false;
	if (Number(expires) < now()) return false;
	return same(signature, await sign(password, `session.${expires}`));
}

// --------------------------------------------------------------- response --

function page(body, { status = 200, title, theme, fonts, headers = {} }) {
	const nonce = hex(crypto.getRandomValues(new Uint8Array(16)));
	const html = `<!doctype html>
<html lang="fr"${theme === 'light' ? ' data-theme="light"' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="${theme === 'light' ? 'light' : 'dark'}">
<title>${escapeHtml(title)}</title>
<link rel="icon" href="/favicon.ico" sizes="48x48">
<style nonce="${nonce}">${fontFaces(fonts)}${STYLES}</style>
</head>
<body>
${body}
</body>
</html>
`;
	return new Response(html, {
		status,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Content-Security-Policy': `default-src 'none'; style-src 'nonce-${nonce}'; font-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
			...headers,
		},
	});
}

/** Headers of every answer of this host: private, never cached, never framed. */
function sealed(response) {
	const secured = new Response(response.body, response);
	secured.headers.set('Strict-Transport-Security', 'max-age=31536000');
	secured.headers.set('X-Content-Type-Options', 'nosniff');
	secured.headers.set('X-Frame-Options', 'DENY');
	secured.headers.set('Referrer-Policy', 'no-referrer');
	secured.headers.set('X-Robots-Tag', 'noindex, nofollow');
	secured.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	if (!secured.headers.has('Cache-Control')) secured.headers.set('Cache-Control', 'no-store');
	return secured;
}

const redirect = (location, cookies = []) => {
	const headers = new Headers({ Location: location });
	for (const value of cookies) headers.append('Set-Cookie', value);
	return new Response(null, { status: 303, headers });
};

// The site's two fonts, under the hashed names Astro gave them (/fonts.json,
// src/pages/fonts.json.ts). Without them the page falls back to system fonts.
let fontFiles;
async function fontsOf(env, url) {
	if (fontFiles) return fontFiles;
	try {
		const response = await env.ASSETS.fetch(new URL('/fonts.json', url));
		if (response.ok) fontFiles = await response.json();
	} catch {
		// fall through
	}
	return fontFiles ?? {};
}

function fontFaces(fonts = {}) {
	const face = (family, file) =>
		/^\/_astro\/[\w.-]+\.woff2$/.test(file ?? '') ? `@font-face{font-family:'${family}';font-style:normal;font-display:swap;font-weight:100 900;src:url(${file}) format('woff2-variations')}` : '';
	return face('Inter Variable', fonts.sans) + face('JetBrains Mono Variable', fonts.mono);
}

// ------------------------------------------------------------------ pages --

const WINDOW_BAR = (title, extra = '') => `<div class="window-bar">
<span class="window-controls" aria-hidden="true"><i class="wc-close"></i><i class="wc-min"></i><i class="wc-max"></i></span>
<span class="window-title">${escapeHtml(title)}</span>${extra}
</div>`;

const shell = (content) => `<main class="wrap">${content}</main>`;

function loginPage(view, { error, status = 200 } = {}) {
	const body = shell(`<section class="card login" aria-labelledby="login-title">
${WINDOW_BAR('ssh admin@noamroger.fr')}
<div class="term">
<h1 id="login-title" class="sr-only">Statistiques du portfolio : connexion</h1>
<p><span class="t-prompt">$</span> ssh admin@noamroger.fr</p>
${error ? `<p class="t-err" role="alert">${escapeHtml(error)}</p>` : ''}
<form method="post" action="/login">
<input type="text" name="username" value="admin" autocomplete="username" hidden>
<label for="password">admin@noamroger.fr's password:</label>
<input id="password" name="password" type="password" autocomplete="current-password" required autofocus maxlength="256">
<button type="submit" class="btn">Connexion</button>
</form>
</div>
</section>
<p class="note">Zone privée. Le site est par ici : <a href="https://www.noamroger.fr/">www.noamroger.fr</a></p>`);
	return page(body, { ...view, status, title: 'Connexion · stats' });
}

function closedPage(view) {
	const body = shell(`<section class="card login">
${WINDOW_BAR('bash')}
<div class="term">
<h1 class="sr-only">Statistiques du portfolio : non configuré</h1>
<p><span class="t-prompt">$</span> echo $ADMIN_PASSWORD</p>
<p>&nbsp;</p>
<p class="t-err">Le secret ADMIN_PASSWORD n'est pas défini sur le Worker : le tableau de bord reste fermé.</p>
<p class="t-muted">Cloudflare &gt; Workers &gt; portfolio &gt; Settings &gt; Variables and Secrets, ou <code>npx wrangler secret put ADMIN_PASSWORD</code>.</p>
</div>
</section>`);
	return page(body, { ...view, status: 503, title: 'Non configuré · stats' });
}

function errorPage(view, message) {
	const body = shell(`<section class="card login">
${WINDOW_BAR('bash')}
<div class="term">
<h1 class="sr-only">Statistiques du portfolio : erreur</h1>
<p><span class="t-prompt">$</span> stats</p>
<p class="t-err">${escapeHtml(message)}</p>
<form method="post" action="/logout"><button type="submit" class="btn">Déconnexion</button></form>
</div>
</section>`);
	return page(body, { ...view, status: 500, title: 'Erreur · stats' });
}

// -------------------------------------------------------------- dashboard --

const regionNames = new Intl.DisplayNames(['fr'], { type: 'region' });
function countryName(code) {
	if (!code) return 'Inconnu';
	try {
		return regionNames.of(code) ?? code;
	} catch {
		return code;
	}
}

const DEVICES = { desktop: 'Ordinateur', mobile: 'Téléphone', tablet: 'Tablette' };
const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const longDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const dateOf = (day) => new Date(`${day}T12:00:00Z`);

/** 1, 2 or 5 times a power of ten, at least 5: a top of axis easy to read. */
function niceMax(value) {
	if (value <= 5) return 5;
	const power = 10 ** Math.floor(Math.log10(value));
	for (const step of [1, 2, 5, 10]) if (value <= step * power) return step * power;
	return 10 * power;
}

/** Views (bars) and visitors (line) per day, on one axis. No script: the
 *  value of a day shows up in the native tooltip of its column. */
function chart(days) {
	const top = niceMax(Math.max(...days.map((day) => day.views)));
	const y = (value) => (100 - (value / top) * 100).toFixed(2);
	const bars = days.map((day, i) => (day.views ? `<rect class="bar-views" x="${i + 0.15}" y="${y(day.views)}" width="0.7" height="${((day.views / top) * 100).toFixed(2)}"/>` : '')).join('');
	const line = days.length > 1 ? `<polyline class="line-visitors" points="${days.map((day, i) => `${i + 0.5},${y(day.visitors)}`).join(' ')}"/>` : '';
	const hits = days
		.map((day, i) => `<rect class="hit" x="${i}" y="0" width="1" height="100"><title>${escapeHtml(longDate.format(dateOf(day.day)))} : ${fmt(day.views)} vues, ${fmt(day.visitors)} visiteurs</title></rect>`)
		.join('');
	const ticks = [days[0], days[Math.floor((days.length - 1) / 2)], days.at(-1)].filter((day, i, all) => all.indexOf(day) === i);
	const rows = days
		.filter((day) => day.views)
		.reverse()
		.map((day) => `<tr><th scope="row">${escapeHtml(longDate.format(dateOf(day.day)))}</th><td>${fmt(day.views)}</td><td>${fmt(day.visitors)}</td></tr>`)
		.join('');

	return `<div class="legend"><span><i class="key key-views"></i>Vues</span><span><i class="key key-visitors"></i>Visiteurs uniques</span></div>
<div class="plot">
<div class="y-axis" aria-hidden="true"><span>${fmt(top)}</span><span>${fmt(top / 2)}</span><span>0</span></div>
<svg viewBox="0 0 ${days.length} 100" preserveAspectRatio="none" role="img" aria-label="Vues et visiteurs uniques par jour. Le détail est dans le tableau qui suit.">
<line class="grid" x1="0" x2="${days.length}" y1="0" y2="0"/><line class="grid" x1="0" x2="${days.length}" y1="50" y2="50"/><line class="grid base" x1="0" x2="${days.length}" y1="100" y2="100"/>
${bars}${line}${hits}
</svg>
</div>
<div class="x-axis" aria-hidden="true">${ticks.map((day) => `<span>${escapeHtml(shortDate.format(dateOf(day.day)))}</span>`).join('')}</div>
<details><summary>Voir le tableau</summary>
${rows ? `<table><thead><tr><th scope="col">Jour</th><th scope="col">Vues</th><th scope="col">Visiteurs</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="empty">Aucune vue sur la période.</p>'}
</details>`;
}

/** A ranked list in its own little window: label, count, and a bar. */
function panel(title, unit, rows, empty = 'Rien sur la période.') {
	const top = Math.max(1, ...rows.map((row) => row.value));
	const items = rows
		.map(
			(row) => `<li><span class="k" title="${escapeHtml(row.label)}">${escapeHtml(row.label)}</span><span class="v">${fmt(row.value)}</span>
<svg class="meter" viewBox="0 0 100 1" preserveAspectRatio="none" aria-hidden="true"><rect width="${((row.value / top) * 100).toFixed(1)}" height="1"/></svg></li>`,
		)
		.join('');
	return `<section class="card panel">
${WINDOW_BAR(title)}
<div class="panel-body">
<p class="unit">${escapeHtml(unit)}</p>
${rows.length ? `<ol>${items}</ol>` : `<p class="empty">${escapeHtml(empty)}</p>`}
</div>
</section>`;
}

async function dashboard(env, view, period) {
	const db = env.STATS;
	const today = parisDay();
	const from = daysAgo(period - 1);
	const real = 'day >= ?1 AND not_found = 0';

	const [totals, perDay, pages, sources, countries, devices, missing, stored] = (
		await db.batch([
			db.prepare(`SELECT COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors, COALESCE(SUM(entry), 0) AS visits, COALESCE(SUM(path = '/en' OR path LIKE '/en/%'), 0) AS english FROM views WHERE ${real}`).bind(from),
			db.prepare(`SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM views WHERE ${real} GROUP BY day`).bind(from),
			db.prepare(`SELECT path AS label, COUNT(*) AS value FROM views WHERE ${real} GROUP BY path ORDER BY value DESC, label LIMIT 12`).bind(from),
			db.prepare(`SELECT COALESCE(referrer, '') AS label, COUNT(*) AS value FROM views WHERE ${real} AND entry = 1 GROUP BY label ORDER BY value DESC, label LIMIT 12`).bind(from),
			db.prepare(`SELECT COALESCE(country, '') AS label, COUNT(DISTINCT visitor) AS value FROM views WHERE ${real} GROUP BY label ORDER BY value DESC, label LIMIT 12`).bind(from),
			db.prepare(`SELECT device AS label, COUNT(DISTINCT visitor) AS value FROM views WHERE ${real} GROUP BY device ORDER BY value DESC`).bind(from),
			db.prepare('SELECT path AS label, COUNT(*) AS value FROM views WHERE day >= ?1 AND not_found = 1 GROUP BY path ORDER BY value DESC, label LIMIT 12').bind(from),
			db.prepare('SELECT COUNT(*) AS total, MIN(day) AS oldest FROM views'),
		])
	).map((result) => result.results);

	const byDay = new Map(perDay.map((row) => [row.day, row]));
	const days = Array.from({ length: period }, (_, i) => {
		const day = daysAgo(period - 1 - i);
		return { day, views: byDay.get(day)?.views ?? 0, visitors: byDay.get(day)?.visitors ?? 0 };
	});
	const { views, visitors, visits, english } = totals[0];
	const todayRow = byDay.get(today) ?? { views: 0, visitors: 0 };

	const tiles = [
		['Vues', fmt(views), period === 1 ? "aujourd'hui" : `sur ${period} jours`],
		['Visiteurs uniques', fmt(visitors), 'comptés par jour'],
		['Pages par visiteur', visitors ? (views / visitors).toFixed(1).replace('.', ',') : '0', `${fmt(visits)} visites`],
		period === 1 ? ['Version anglaise', views ? `${Math.round((english / views) * 100)} %` : '0 %', 'des vues'] : ["Aujourd'hui", fmt(todayRow.views), `${fmt(todayRow.visitors)} visiteurs`],
	];

	const periodLinks = PERIODS.map((value) => `<a href="/?days=${value}"${value === period ? ' aria-current="page"' : ''}>${value === 1 ? '24h' : `${value}d`}</a>`).join('');
	const other = view.theme === 'light' ? 'dark' : 'light';

	const body = `<header class="top">
<a class="brand" href="/"><span class="brand-prompt" aria-hidden="true">~/</span>noam<span class="brand-dot">.</span>roger<span class="brand-prompt">/stats</span></a>
<nav class="tools" aria-label="Outils">
<a href="/theme?to=${other}&amp;days=${period}">${other === 'light' ? 'Thème clair' : 'Thème sombre'}</a>
<a href="https://www.noamroger.fr/">Voir le site</a>
<form method="post" action="/logout"><button type="submit">Déconnexion</button></form>
</nav>
</header>
${shell(`<h1 class="sr-only">Statistiques de visite du portfolio</h1>
<section class="card">
${WINDOW_BAR('stats — admin@noamroger.fr')}
<div class="term">
<p class="cmd"><span class="t-prompt">admin@noamroger.fr:~$</span> stats --since <span class="periods" role="navigation" aria-label="Période">${periodLinks}</span></p>
<dl class="tiles">${tiles.map(([label, value, hint]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd><dd class="hint">${escapeHtml(hint)}</dd></div>`).join('')}</dl>
${period > 1 ? chart(days) : ''}
</div>
</section>
<div class="panels">
${panel('pages.log', 'Vues par page', pages)}
${panel('sources.log', "Visites par site d'origine", sources.map((row) => ({ ...row, label: row.label || 'Direct ou inconnu' })))}
${panel('pays.log', 'Visiteurs par pays', countries.map((row) => ({ ...row, label: countryName(row.label) })))}
${panel('appareils.log', "Visiteurs par type d'appareil", devices.map((row) => ({ ...row, label: DEVICES[row.label] ?? row.label })))}
${panel('404.log', 'Pages introuvables demandées', missing, 'Aucune page introuvable sur la période.')}
<section class="card panel">
${WINDOW_BAR('README')}
<div class="panel-body readme">
<p>Aucun cookie ni stockage chez les visiteurs. Ni adresse IP ni user agent en base : seulement une empreinte salée qui change chaque jour.</p>
<p>${fmt(stored[0].total)} vues en base${stored[0].oldest ? `, la plus ancienne du ${escapeHtml(shortDate.format(dateOf(stored[0].oldest)))}` : ''}. Purge automatique au-delà de ${RETENTION_DAYS} jours.</p>
<p>Les robots connus sont écartés, et ce navigateur aussi depuis que tu t'y es connecté.</p>
</div>
</section>
</div>`)}`;

	return page(body, { ...view, title: 'Statistiques · noam.roger' });
}

// ----------------------------------------------------------------- routes --

async function login(request, env, view, url) {
	const password = (await request.formData().catch(() => null))?.get('password');
	const db = env.STATS;
	const since = now() - LOGIN_WINDOW_SECONDS;

	let visitor = null;
	if (db) {
		try {
			visitor = await visitorHash(db, request);
			const [mine, all] = await db.batch([
				db.prepare('SELECT COUNT(*) AS n FROM login_failures WHERE ts >= ?1 AND visitor = ?2').bind(since, visitor),
				db.prepare('SELECT COUNT(*) AS n FROM login_failures WHERE ts >= ?1').bind(since),
			]);
			if (mine.results[0].n >= MAX_FAILURES_PER_VISITOR || all.results[0].n >= MAX_FAILURES) {
				const response = loginPage(view, { error: 'Too many authentication failures. Réessaie dans un quart d’heure.', status: 429 });
				response.headers.set('Retry-After', String(LOGIN_WINDOW_SECONDS));
				return response;
			}
		} catch (error) {
			console.error('admin: login throttle unavailable', error);
		}
	}

	if (typeof password === 'string' && password.length <= 256 && (await same(password, env.ADMIN_PASSWORD))) {
		const host = url.hostname === ADMIN_HOST ? '; Domain=noamroger.fr' : '';
		return redirect('/', [
			`${SESSION_COOKIE}=${await newSession(env.ADMIN_PASSWORD)}; Path=/; Max-Age=${SESSION_SECONDS}; Secure; HttpOnly; SameSite=Lax`,
			`${IGNORE_COOKIE}=1${host}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax`,
		]);
	}

	if (db && visitor) {
		await db
			.prepare('INSERT INTO login_failures (ts, visitor) VALUES (?1, ?2)')
			.bind(now(), visitor)
			.run()
			.catch((error) => console.error('admin: failure not recorded', error));
	}
	return loginPage(view, { error: 'Permission denied, please try again.', status: 401 });
}

async function route(request, env, url) {
	const { pathname } = url;
	const read = request.method === 'GET' || request.method === 'HEAD';

	// The only files of the site this host hands out: the fonts and the icon.
	if (read && (/^\/_astro\/[\w.-]+\.woff2$/.test(pathname) || pathname === '/favicon.ico')) {
		const asset = await env.ASSETS.fetch(new Request(new URL(pathname, url), { method: request.method }));
		const response = new Response(asset.body, asset);
		for (const name of ['Content-Security-Policy', 'X-Hiring', 'X-Flag']) response.headers.delete(name);
		return response;
	}
	if (read && pathname === '/robots.txt') {
		return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
	}

	const view = { theme: cookie(request, THEME_COOKIE) === 'light' ? 'light' : 'dark', fonts: await fontsOf(env, url) };

	if (read && pathname === '/theme') {
		const theme = url.searchParams.get('to') === 'light' ? 'light' : 'dark';
		const days = Number(url.searchParams.get('days'));
		return redirect(PERIODS.includes(days) ? `/?days=${days}` : '/', [`${THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax`]);
	}

	if (request.method === 'POST' && (pathname === '/login' || pathname === '/logout')) {
		// A form of this page, not of another site.
		const site = request.headers.get('Sec-Fetch-Site');
		if (site && site !== 'same-origin') return new Response('Forbidden\n', { status: 403 });
		if (pathname === '/logout') return redirect('/', [`${SESSION_COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`]);
		if (!env.ADMIN_PASSWORD) return closedPage(view);
		return login(request, env, view, url);
	}

	if (!read) return new Response('Method Not Allowed\n', { status: 405, headers: { Allow: 'GET, HEAD, POST' } });
	if (pathname !== '/') return new Response('Not Found\n', { status: 404 });

	if (!env.ADMIN_PASSWORD) return closedPage(view);
	if (!(await hasSession(request, env.ADMIN_PASSWORD))) return loginPage(view);
	if (!env.STATS) return errorPage(view, "La base D1 n'est pas liée au Worker (binding STATS, voir wrangler.jsonc).");

	const days = Number(url.searchParams.get('days'));
	try {
		return await dashboard(env, view, PERIODS.includes(days) ? days : 30);
	} catch (error) {
		console.error('admin: dashboard failed', error);
		return errorPage(view, 'La base ne répond pas comme prévu. Le détail est dans les logs du Worker.');
	}
}

export async function handleAdmin(request, env, url) {
	return sealed(await route(request, env, url));
}

// ------------------------------------------------------------------ style --
// The palette, the fonts and the window chrome of the public site
// (src/layouts/Layout.astro). Kept by hand: this page is not built by Astro.

const STYLES = `
:root{color-scheme:dark;--bg:#0b0c0f;--bg-elevated:#121418;--bg-subtle:#181b20;--border:#23262d;--border-strong:#30343c;--text:#e9eaed;--text-secondary:#a1a6b0;--text-muted:#868b95;--accent:#5fd39a;--accent-strong:#8ae3b6;--accent-soft:rgba(95,211,154,.12);--series-2:#82aaff;--dot-grid:rgba(255,255,255,.07);--on-accent:#0b0c0f;--danger:#f07178;--shadow:0 1px 2px rgba(0,0,0,.4);--font-sans:'Inter Variable',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;--font-mono:'JetBrains Mono Variable',ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace;--radius:10px;--radius-sm:6px}
:root[data-theme='light']{color-scheme:light;--bg:#f4efe4;--bg-elevated:#faf6ee;--bg-subtle:#ebe4d5;--border:#e0d7c5;--border-strong:#cfc4ae;--text:#2b2721;--text-secondary:#5a5246;--text-muted:#6b6253;--accent:#0e7c50;--accent-strong:#095c3b;--accent-soft:rgba(14,124,80,.08);--series-2:#2453c2;--dot-grid:rgba(60,45,20,.1);--on-accent:#fff;--danger:#c4323a;--shadow:0 1px 2px rgba(60,45,20,.06)}
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{font-family:var(--font-sans);font-feature-settings:'cv11','ss01';background-color:var(--bg);background-image:radial-gradient(var(--dot-grid) 1px,transparent 1px);background-size:22px 22px;color:var(--text);line-height:1.6;min-height:100vh;-webkit-font-smoothing:antialiased}
a{color:var(--accent)}
a:hover{color:var(--accent-strong)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:2px}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.5rem 1.5rem;max-width:1120px;margin:0 auto;padding:1.1rem 1.25rem}
.brand{font-family:var(--font-mono);font-weight:600;font-size:.95rem;color:var(--text);text-decoration:none}
.brand:hover{color:var(--text)}
.brand-prompt,.brand-dot{color:var(--accent)}
.tools{display:flex;flex-wrap:wrap;align-items:center;gap:.25rem 1.25rem;font-family:var(--font-mono);font-size:.8rem}
.tools a,.tools button{color:var(--text-secondary);text-decoration:none;background:none;border:0;font:inherit;cursor:pointer;padding:.35rem 0}
.tools a:hover,.tools button:hover{color:var(--accent)}
.wrap{max-width:1120px;margin:0 auto;padding:.5rem 1.25rem 4rem}
.card{background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden;min-width:0}
.window-bar{display:grid;grid-template-columns:minmax(max-content,1fr) minmax(0,auto) minmax(max-content,1fr);align-items:center;gap:.75rem;padding:.75rem 1rem;border-bottom:1px solid var(--border);font-family:var(--font-mono);font-size:.75rem;color:var(--text-muted)}
.window-controls{grid-column:1;justify-self:start;display:flex;gap:8px}
.window-controls i{width:12px;height:12px;border-radius:50%;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.12)}
.wc-close{background:#ff5f56}.wc-min{background:#ffbd2e}.wc-max{background:#27c93f}
.window-title{grid-column:2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
.term{padding:1.25rem;font-family:var(--font-mono);font-size:.85rem}
.t-prompt{color:var(--accent);font-weight:600}
.t-err{color:var(--danger)}
.t-muted{color:var(--text-muted)}
.term code{color:var(--text-secondary)}
.cmd{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem .6rem}
.periods{display:inline-flex;gap:.35rem}
.periods a{padding:.2rem .6rem;border:1px solid var(--border-strong);border-radius:var(--radius-sm);color:var(--text-secondary);text-decoration:none}
.periods a:hover{border-color:var(--accent);color:var(--accent)}
.periods a[aria-current]{background:var(--accent);border-color:var(--accent);color:var(--on-accent);font-weight:600}
.tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.75rem;margin-top:1.25rem}
.tiles div{padding:.9rem 1rem;background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-sm);min-width:0}
.tiles dt{font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em}
.tiles dd{font-family:var(--font-sans);font-size:1.9rem;font-weight:650;letter-spacing:-.02em;line-height:1.25;font-variant-numeric:tabular-nums}
.tiles .hint{font-family:var(--font-mono);font-size:.72rem;font-weight:400;letter-spacing:0;color:var(--text-muted)}
.legend{display:flex;flex-wrap:wrap;gap:.25rem 1.25rem;margin-top:1.5rem;font-size:.75rem;color:var(--text-secondary)}
.legend span{display:inline-flex;align-items:center;gap:.45rem}
.key{display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--accent)}
.key-visitors{height:2px;width:14px;background:var(--series-2)}
.plot{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.6rem;margin-top:.6rem}
.plot svg{display:block;width:100%;height:210px;overflow:visible}
.y-axis{display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;font-size:.68rem;color:var(--text-muted);line-height:1;margin:-.34rem 0;font-variant-numeric:tabular-nums}
.x-axis{display:flex;justify-content:space-between;margin:.45rem 0 0 2rem;font-size:.68rem;color:var(--text-muted)}
.grid{stroke:var(--border);stroke-width:1;vector-effect:non-scaling-stroke}
.grid.base{stroke:var(--border-strong)}
.bar-views{fill:var(--accent)}
.line-visitors{fill:none;stroke:var(--series-2);stroke-width:2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}
.hit{fill:transparent}
.hit:hover{fill:var(--accent-soft)}
details{margin-top:1rem;font-size:.78rem}
summary{cursor:pointer;color:var(--text-secondary);width:max-content;max-width:100%}
summary:hover{color:var(--accent)}
table{width:100%;max-width:26rem;margin-top:.6rem;border-collapse:collapse;font-variant-numeric:tabular-nums}
th,td{padding:.3rem .5rem;border-bottom:1px solid var(--border);text-align:right;font-weight:400}
th:first-child{text-align:left}
thead th{color:var(--text-muted);font-size:.7rem;text-transform:uppercase;letter-spacing:.06em}
.panels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin-top:1rem}
.panel-body{padding:1rem 1.1rem 1.15rem;font-family:var(--font-mono);font-size:.8rem}
.unit{font-size:.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.7rem}
ol{list-style:none;display:grid;gap:.55rem}
li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.2rem .75rem;align-items:baseline}
.k{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.v{color:var(--text-secondary);font-variant-numeric:tabular-nums}
.meter{grid-column:1/-1;display:block;width:100%;height:4px;border-radius:2px;background:var(--bg-subtle)}
.meter rect{fill:var(--accent)}
.empty{color:var(--text-muted)}
.readme{display:grid;gap:.7rem;font-family:var(--font-sans);font-size:.85rem;color:var(--text-secondary)}
.login{max-width:34rem;margin:12vh auto 0}
.login form{display:grid;gap:.6rem;margin-top:.6rem}
.login label{color:var(--text-secondary)}
input[type=password]{width:100%;padding:.6rem .75rem;font:inherit;font-size:1rem;color:var(--text);background:var(--bg);border:1px solid var(--border-strong);border-radius:var(--radius-sm)}
input[type=password]:focus{outline:2px solid var(--accent);outline-offset:1px;border-color:var(--accent)}
.btn{justify-self:start;padding:.55rem 1.1rem;font:inherit;font-weight:600;color:var(--on-accent);background:var(--accent);border:0;border-radius:var(--radius-sm);cursor:pointer}
.btn:hover{background:var(--accent-strong)}
.note{max-width:34rem;margin:1rem auto 0;font-size:.8rem;color:var(--text-muted);text-align:center}
@media (max-width:900px){.panels{grid-template-columns:repeat(2,minmax(0,1fr))}.tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:600px){.panels{grid-template-columns:minmax(0,1fr)}.tiles dd{font-size:1.5rem}.plot svg{height:170px}.term{padding:1rem}}
`;
