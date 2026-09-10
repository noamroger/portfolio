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
	// `prefetch: true` alone only arms links that opt in with
	// data-astro-prefetch, so nothing was actually being prefetched. With four
	// pages, fetching every internal link at idle right after load costs a few
	// kB and makes each navigation hit the network zero times.
	prefetch: {
		prefetchAll: true,
		defaultStrategy: 'load',
	},
	build: {
		// Otherwise each navigation is two serial round trips: fetch the HTML,
		// discover its stylesheet, fetch that too. Inlining puts the CSS inside
		// the (already prefetched) document, so a click hits the network zero
		// times. Costs ~3 kB gzipped per page.
		inlineStylesheets: 'always',
	},
	integrations: [
		sitemap({
			filter: (page) => !page.includes('/404'),
			// The two languages live on separate domains, so the built-in i18n
			// option (which expects locale-prefixed paths) does not apply. Declare
			// the alternates by hand instead, mirroring the <link rel="alternate">
			// tags in the page head.
			serialize(item) {
				const { pathname } = new URL(item.url);
				item.links = [
					{ lang: 'en', url: origins.en + pathname },
					{ lang: 'fr', url: origins.fr + pathname },
					{ lang: 'x-default', url: origins.en + pathname },
				];
				return item;
			},
		}),
	],
});
