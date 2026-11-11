// Small endpoints for whoever pokes at the site from a terminal.
//
// - /healthz, /version, /metrics: what a service usually exposes. The commit
//   comes from /version.json, written at build time (src/pages/version.json.ts).
// - /.well-known/security.txt: answered with the file built at /security.txt.
// - /robots.txt, /humans.txt, security.txt and /coffee follow the language of
//   the visitor: these addresses cannot carry it, so Accept-Language decides
//   between the French file and its English twin under /en/.
// - /coffee: 418, the pod of the home page terminal answering for real.
// - `curl noamroger.fr`: command-line clients get the home page as plain text
//   (src/data/cli.ts) instead of HTML they would have to read through.

/** Sent with every response. Keep in sync with public/_headers. */
export const EXTRA_HEADERS = {
	'X-Hiring': 'Work-study wanted, DevOps / Cloud, September 2027 - contact@noamroger.fr',
	'X-Flag': 'flag{curl_dash_i_is_a_reflex}',
};

const CLI_AGENT = /^(curl|wget|httpie)\//i;
const TEXT = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' };

const text = (body, status = 200, headers = {}) => new Response(body, { status, headers: { ...TEXT, ...headers } });

/**
 * 'en' when the visitor prefers English over French, 'fr' otherwise (the
 * default language of the site, and what a client sending no header gets).
 */
function preferredLocale(request) {
	const wanted = (request.headers.get('Accept-Language') ?? '')
		.split(',')
		.map((part) => {
			const [tag, ...params] = part.trim().toLowerCase().split(';');
			const q = params.map((param) => param.trim()).find((param) => param.startsWith('q='));
			return { lang: tag.split('-')[0], q: q ? Number(q.slice(2)) || 0 : 1 };
		})
		.filter((entry) => entry.lang === 'fr' || entry.lang === 'en')
		.sort((a, b) => b.q - a.q);
	return wanted[0]?.lang ?? 'fr';
}

/** One of the plain-text files, in the language of the visitor. */
async function localizedFile(request, env, url, file) {
	const locale = preferredLocale(request);
	const response = await env.ASSETS.fetch(new URL(locale === 'en' ? `/en${file}` : file, url));
	if (!response.ok) return null;
	return text(response.body, 200, { 'Cache-Control': 'public, max-age=3600', 'Content-Language': locale, Vary: 'Accept-Language' });
}

async function version(env, url) {
	try {
		const response = await env.ASSETS.fetch(new URL('/version.json', url));
		if (response.ok) return await response.json();
	} catch {
		// fall through
	}
	return { commit: null, short: null, committed_at: null };
}

function metrics(build, colo) {
	const deployed = Date.parse(build.committed_at ?? '');
	const label = (value) => String(value ?? 'unknown').replace(/[\\"\n]/g, '');
	return `# HELP portfolio_up Whether the site answers. If you can read this, it does.
# TYPE portfolio_up gauge
portfolio_up 1
# HELP portfolio_build_info The commit this Worker is serving, and the data centre that answered.
# TYPE portfolio_build_info gauge
portfolio_build_info{commit="${label(build.short)}",colo="${label(colo)}"} 1
# HELP portfolio_last_deploy_timestamp_seconds Date of that commit, as a Unix timestamp.
# TYPE portfolio_last_deploy_timestamp_seconds gauge
portfolio_last_deploy_timestamp_seconds ${Number.isNaN(deployed) ? 0 : Math.floor(deployed / 1000)}
# HELP coffee_maker_restarts_total Restarts of coffee-maker-api-0. Not a real metric: the pod is not real either.
# TYPE coffee_maker_restarts_total counter
coffee_maker_restarts_total 1337
# HELP work_study_position_wanted 1 while Noam is looking for a work-study position (DevOps / Cloud, September 2027).
# TYPE work_study_position_wanted gauge
work_study_position_wanted{contact="contact@noamroger.fr"} 1
`;
}

/** Answers the request, or returns null when it is not one of these. */
export async function handleOps(request, env, url) {
	if (request.method !== 'GET' && request.method !== 'HEAD') return null;
	const path = url.pathname.replace(/(.)\/$/, '$1');

	switch (path) {
		case '/healthz':
			return text('ok\n');
		case '/version':
			return new Response(JSON.stringify(await version(env, url), null, 2) + '\n', {
				headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
			});
		case '/metrics':
			return text(metrics(await version(env, url), request.cf?.colo), 200, {
				'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
			});
		case '/.well-known/security.txt':
			// The canonical address (RFC 9116), served from the file built at /security.txt.
			return localizedFile(request, env, url, '/security.txt');
		case '/robots.txt':
		case '/humans.txt':
			return localizedFile(request, env, url, path);
		case '/coffee': {
			const english = preferredLocale(request) === 'en';
			return text(
				`418 I'm a teapot

${
	english
		? `coffee-maker-api-0 cannot brew coffee: it is, and has always been, a teapot.
See RFC 2324, section 2.3.2.`
		: `coffee-maker-api-0 ne peut pas faire de café : c'est, et ça a toujours été, une théière.
Voir la RFC 2324, section 2.3.2.`
}

flag{rfc_2324_compliant}
`,
				418,
				{ 'Content-Language': english ? 'en' : 'fr', Vary: 'Accept-Language' },
			);
		}
	}

	// curl sends "Accept: */*": asking for text/html explicitly gets the page.
	const isHome = path === '/' || path === '/en';
	const wantsHtml = (request.headers.get('Accept') ?? '').includes('text/html');
	if (isHome && !wantsHtml && CLI_AGENT.test(request.headers.get('User-Agent') ?? '')) {
		const page = await env.ASSETS.fetch(new URL(path === '/en' ? '/en/cli.txt' : '/cli.txt', url));
		if (page.ok) return text(page.body, 200, { Vary: 'User-Agent, Accept' });
	}

	return null;
}
