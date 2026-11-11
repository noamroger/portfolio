import type { APIRoute } from 'astro';
import { contactEmail } from '../i18n';
import { commitDate } from '../data/build';

/**
 * Date of the last change to the site, as YYYY/MM/DD (the humanstxt.org
 * format): the date of the commit being built (see src/data/build.ts).
 */
function lastUpdate(): string {
	// en-CA formats as YYYY-MM-DD; Paris time so a late-evening commit is not
	// dated the day before or after.
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(commitDate).replaceAll('-', '/');
}

/** https://humanstxt.org/ - who is behind the site, for the humans who look. */
export const GET: APIRoute = () =>
	new Response(
		`/* TEAM */
Developer: Noam Roger
Site: https://noamroger.fr
Contact: ${contactEmail}
Role: Étudiant L3 Informatique / Recherche alternance Master DevOps & Cloud (Rentrée 2027)
Location: Le Mans, France

/* THANKS */
To everyone curious enough to read plaintext files in /

/* HUNT */
Three flags are hidden around this site, each one a reflex away.
They look like flag{...} and are checked in the home page terminal: unlock flag{...}
First hint: curl -sI https://www.noamroger.fr
Lost? Type 'flags' in that terminal.

/* SITE */
Last update: ${lastUpdate()}
Standards: HTML5, CSS3
Components: Astro, TypeScript
Hosting: Cloudflare Worker
Reverse Proxy & CDN: Cloudflare
`,
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
	);
