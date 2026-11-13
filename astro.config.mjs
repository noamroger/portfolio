// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';
import { parse } from 'jsonc-parser';

// The Turnstile site key lives in wrangler.jsonc `vars`, which only the running
// Worker sees. The site is static, so inline it at build time. A build
// variable of the same name, if set, takes precedence.
const wranglerVars = parse(readFileSync(new URL('./wrangler.jsonc', import.meta.url), 'utf8')).vars ?? {};
const turnstileSiteKey = process.env.PUBLIC_TURNSTILE_SITE_KEY ?? wranglerVars.PUBLIC_TURNSTILE_SITE_KEY ?? '';

// French lives on noamroger.fr, English on noamroger.dev: keep in sync with
// `siteOrigins` in src/i18n/index.ts.
const site = 'https://www.noamroger.fr';
const englishSite = 'https://www.noamroger.dev';

// https://astro.build/config
export default defineConfig({
	site,
	base: '/',
	vite: {
		build: {
			// Vite inlines files under 4 kB as data: URIs, which caught one tiny
			// font subset; the CSP (font-src 'self') then blocked it. Keep fonts
			// as files, everything else follows the default.
			assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
		},
		define: {
			'import.meta.env.PUBLIC_TURNSTILE_SITE_KEY': JSON.stringify(turnstileSiteKey),
		},
	},
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
			// /ruinthefun spoils every easter egg: reachable, but not advertised.
			// The English pages are built under /en but served by noamroger.dev,
			// which has its own sitemap (src/pages/en/sitemap-index.xml.ts).
			filter: (page) => !page.includes('/404') && !page.includes('/ruinthefun') && !new URL(page).pathname.startsWith('/en/'),
			// Declare the alternates by hand, mirroring the <link rel="alternate">
			// tags in the page head.
			serialize(item) {
				const path = new URL(item.url).pathname;
				item.links = [
					{ lang: 'fr', url: site + path },
					{ lang: 'en', url: englishSite + path },
					{ lang: 'x-default', url: site + path },
				];
				return item;
			},
		}),
	],
});
