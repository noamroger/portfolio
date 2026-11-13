// One domain per language, the same build behind both.
//
// - www.noamroger.fr serves French, noamroger.dev serves English. Keep the
//   hosts and addresses in sync with `siteOrigins` in src/i18n/index.ts.
// - The build emits the English pages under /en (dist/en/…): on noamroger.dev
//   the root is mapped onto that folder (site.js), so /en never shows.
// - Anything else (a preview on workers.dev, localhost) is not a site of its
//   own: the build is served as it is, English under /en.

const SITES = {
	'www.noamroger.fr': { locale: 'fr', host: 'www.noamroger.fr', email: 'contact@noamroger.fr' },
	'noamroger.dev': { locale: 'en', host: 'noamroger.dev', email: 'contact@noamroger.dev' },
};

/** The bare or www twin of each canonical host, redirected to it. */
const ALIASES = {
	'noamroger.fr': 'www.noamroger.fr',
	'www.noamroger.dev': 'noamroger.dev',
};

const FRENCH = SITES['www.noamroger.fr'];
const ENGLISH = SITES['noamroger.dev'];

/** Where the build keeps the English twin of a path. */
export const ENGLISH_PREFIX = '/en';
const hasEnglishPrefix = (pathname) => pathname === ENGLISH_PREFIX || pathname.startsWith(`${ENGLISH_PREFIX}/`);

/** The site a host name stands for, or null for a preview. */
export const siteOf = (hostname) => SITES[hostname] ?? null;

/** Own domains, for the statistics: a visitor coming from one is not a referral. */
export const isOwnDomain = (host) => ['noamroger.fr', 'noamroger.dev'].some((domain) => host === domain || host.endsWith(`.${domain}`));

/**
 * The address a request must be sent to instead, in a single hop, or null.
 * - noamroger.fr and www.noamroger.dev go to their canonical host.
 * - The former English addresses, noamroger.fr/en/…, go to noamroger.dev/….
 * - noamroger.dev/en/… loses its prefix.
 */
export function redirectOf(url) {
	const host = ALIASES[url.hostname] ?? url.hostname;
	const site = siteOf(host);
	if (!site) return null;

	const target = new URL(url);
	target.hostname = host;
	if (hasEnglishPrefix(url.pathname)) {
		target.hostname = ENGLISH.host;
		target.pathname = url.pathname.slice(ENGLISH_PREFIX.length) || '/';
	}
	return target.href === url.href ? null : target;
}

export { FRENCH };
