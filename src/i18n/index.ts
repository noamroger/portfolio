import en, { type Translations } from './en';
import fr from './fr';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

const dictionaries: Record<Locale, Translations> = { en, fr };

/**
 * One domain per language, both served by the same Worker from the same
 * build: French on noamroger.fr, English on noamroger.dev. The build still
 * emits the English pages under /en; the Worker maps the root of noamroger.dev
 * onto that folder (worker/hosts.js, worker/site.js), so /en never shows in
 * an address. Keep the hosts in sync with worker/hosts.js.
 */
export const defaultLocale: Locale = 'fr';
export const siteOrigins: Record<Locale, string> = {
	fr: 'https://www.noamroger.fr',
	en: 'https://www.noamroger.dev',
};
/** The bare domain of each language, for what is displayed (prompts, titles). */
export const siteDomains: Record<Locale, string> = { fr: 'noamroger.fr', en: 'noamroger.dev' };
export const contactEmails: Record<Locale, string> = {
	fr: 'contact@noamroger.fr',
	en: 'contact@noamroger.dev',
};
/** The indexable pages, as paths without language. */
export const sitePages = ['/', '/about/', '/projects/', '/contact/'];

/**
 * `astro dev` has no Worker and a single host: there, English keeps its /en
 * prefix in links and the language switch stays on the same origin.
 */
const singleHost = import.meta.env.DEV;

export function localeFromPath(pathname: string): Locale {
	return /^\/en(\/|$)/.test(pathname) ? 'en' : defaultLocale;
}

/** Removes the language prefix: /en/about/ becomes /about/. */
export function stripLocale(pathname: string): string {
	return pathname.replace(/^\/en(?=\/|$)/, '') || '/';
}

/** Where the build emits a page: /about/ is /en/about/ in English. */
export function localizedPath(pathname: string, locale: Locale): string {
	const path = stripLocale(pathname);
	return locale === defaultLocale ? path : `/${locale}${path}`;
}

/** What an internal link points at: the path as the visitor's domain serves it. */
export function linkPath(pathname: string, locale: Locale): string {
	return singleHost ? localizedPath(pathname, locale) : stripLocale(pathname);
}

/** The public address of a page in a language, on the domain of that language. */
export function publicUrl(pathname: string, locale: Locale): string {
	return siteOrigins[locale] + stripLocale(pathname);
}

/** Where the language switch goes: the same page on the other domain. */
export function switchHref(pathname: string, locale: Locale): string {
	return singleHost ? localizedPath(pathname, locale) : publicUrl(pathname, locale);
}

/** Dictionary and link helper of the page being rendered. */
export function getI18n(pathname: string) {
	const locale = localeFromPath(pathname);
	return {
		locale,
		t: dictionaries[locale],
		path: (target: string) => linkPath(target, locale),
		origin: siteOrigins[locale],
		domain: siteDomains[locale],
		contactEmail: contactEmails[locale],
	};
}

/** Social profiles, used for schema.org sameAs and in the footer. */
export const socialProfiles = [
	'https://github.com/noamroger',
	'https://linkedin.com/in/noamroger',
];

/**
 * The stack, grouped. Group labels live in src/i18n (`stack.groups`), keyed by
 * the same `key`. `learning` marks what is being learned right now.
 */
export const stackGroups = [
	{ key: 'languages', items: ['TypeScript', 'Node.js', 'C', 'Java', 'PHP', 'Python'] },
	{ key: 'data', items: ['PostgreSQL', 'MariaDB', 'MySQL'] },
	{ key: 'infra', items: ['Docker', 'CI/CD', 'Linux', 'Proxmox', 'Cloudflare', 'Git'], learning: ['Kubernetes'] },
	{ key: 'web', items: ['Express', 'React', 'Astro'] },
] as const;

/** Flat list, reused as schema.org knowsAbout. */
export const techStack: string[] = stackGroups.flatMap((group) => [
	...group.items,
	...('learning' in group ? group.learning : []),
]);
