import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
	new Response(
		`# Cette page ne t'est pas destinée, essaie plutôt /humans.txt
# This page isn't meant for you, try /humans.txt instead

User-agent: *
Allow: /

Sitemap: ${new URL('sitemap-index.xml', site)}
`,
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
	);
