import type { APIRoute } from 'astro';
import { locales, publicUrl, sitePages } from '../../i18n';

/**
 * The sitemap of noamroger.dev. @astrojs/sitemap writes a single sitemap for
 * the `site` of astro.config.mjs, which is the French domain: the English one
 * is written here, at the same address, with the same alternates.
 */
export const GET: APIRoute = () => {
	const urls = sitePages.map((page) => {
		const alternates = [...locales.map((code) => [code, publicUrl(page, code)]), ['x-default', publicUrl(page, 'fr')]];
		return `<url><loc>${publicUrl(page, 'en')}</loc>${alternates.map(([lang, href]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${href}"/>`).join('')}</url>`;
	});
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`,
		{ headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
	);
};
