// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

// The language is frozen at build time: each domain is its own Netlify site
// built from this repo, with a different SITE_LOCALE.
//   noamroger.dev -> SITE_LOCALE=en (default)
//   noamroger.fr  -> SITE_LOCALE=fr
const { SITE_LOCALE } = loadEnv(process.env.NODE_ENV ?? '', process.cwd(), '');
const locale = SITE_LOCALE === 'fr' ? 'fr' : 'en';

// Keep in sync with `origins` in src/i18n/index.ts
const origins = {
	en: 'https://www.noamroger.dev',
	fr: 'https://www.noamroger.fr',
};

// https://astro.build/config
export default defineConfig({
	site: origins[locale],
	base: '/',
	prefetch: true,
	integrations: [
		sitemap({
			filter: (page) => !page.includes('/404'),
		}),
	],
});
