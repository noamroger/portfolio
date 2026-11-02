import en, { type Translations } from './en';
import fr from './fr';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

const dictionaries: Record<Locale, Translations> = { en, fr };

/** The site lives on a single domain: French at /, English under /en. */
export const defaultLocale: Locale = 'fr';
export const siteOrigin = 'https://www.noamroger.fr';
export const contactEmail = 'contact@noamroger.fr';

export function localeFromPath(pathname: string): Locale {
	return /^\/en(\/|$)/.test(pathname) ? 'en' : defaultLocale;
}

/** Removes the language prefix: /en/about/ becomes /about/. */
export function stripLocale(pathname: string): string {
	return pathname.replace(/^\/en(?=\/|$)/, '') || '/';
}

/** The same page in another language: /about/ becomes /en/about/. */
export function localizedPath(pathname: string, locale: Locale): string {
	const path = stripLocale(pathname);
	return locale === defaultLocale ? path : `/${locale}${path}`;
}

/** Dictionary and link helper of the page being rendered. */
export function getI18n(pathname: string) {
	const locale = localeFromPath(pathname);
	return {
		locale,
		t: dictionaries[locale],
		path: (target: string) => localizedPath(target, locale),
	};
}

/** Social profiles, used for schema.org sameAs and in the footer. */
export const socialProfiles = [
	'https://github.com/noamroger',
	'https://linkedin.com/in/noamroger',
];

/** Shown on the About page and reused as schema.org knowsAbout. */
export const techStack = [
	'Node.js', 'TypeScript', 'C', 'Java', 'PHP', 'Python', 'PostgreSQL',
	'MariaDB', 'MySQL', 'Docker', 'React', 'Astro', 'Cloudflare', 'Git', 'Proxmox',
];
