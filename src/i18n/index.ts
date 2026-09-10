import en, { type Translations } from './en';
import fr from './fr';

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

const dictionaries: Record<Locale, Translations> = { en, fr };

/**
 * The locale is frozen at build time by the SITE_LOCALE environment variable.
 * Each domain is its own Netlify site built from this repo:
 *   noamroger.dev -> SITE_LOCALE=en   (default)
 *   noamroger.fr  -> SITE_LOCALE=fr
 */
function resolveLocale(): Locale {
	const raw =
		import.meta.env.SITE_LOCALE ??
		(globalThis as any).process?.env?.SITE_LOCALE ??
		'en';
	return (locales as readonly string[]).includes(raw) ? (raw as Locale) : 'en';
}

export const locale = resolveLocale();
export const t = dictionaries[locale];

/** Canonical origin of each language version, used for hreflang alternates. */
export const origins: Record<Locale, string> = {
	en: 'https://www.noamroger.dev',
	fr: 'https://www.noamroger.fr',
};

/** Contact address stays on the .fr domain regardless of the site language. */
export const contactEmail = 'contact@noamroger.fr';

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
