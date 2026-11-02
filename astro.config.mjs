// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Keep in sync with `siteOrigin` in src/i18n/index.ts
const site = 'https://www.noamroger.fr';

// https://astro.build/config
export default defineConfig({
	site,
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
			// Declare the alternates by hand, mirroring the <link rel="alternate">
			// tags in the page head. French has no prefix, English lives under /en.
			serialize(item) {
				const french = new URL(item.url).pathname.replace(/^\/en(?=\/|$)/, '') || '/';
				item.links = [
					{ lang: 'fr', url: site + french },
					{ lang: 'en', url: `${site}/en${french}` },
					{ lang: 'x-default', url: site + french },
				];
				return item;
			},
		}),
	],
});
