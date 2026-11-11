import type { APIRoute } from 'astro';
import { execSync } from 'node:child_process';
import { contactEmail } from '../i18n';

/**
 * Date of the last change to the site, as YYYY/MM/DD (the humanstxt.org
 * format). Every push to main triggers a build, so the date of the commit
 * being built is the real "last update". Falls back to the build date when
 * git is not available (a tarball, a build image without git).
 */
function lastUpdate(): string {
	let date = new Date();
	try {
		const iso = execSync('git log -1 --format=%cI', {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim();
		if (iso && !Number.isNaN(Date.parse(iso))) date = new Date(iso);
	} catch {
		// keep the build date
	}
	// en-CA formats as YYYY-MM-DD; Paris time so a late-evening commit is not
	// dated the day before or after.
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(date).replaceAll('-', '/');
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

/* SITE */
Last update: ${lastUpdate()}
Standards: HTML5, CSS3
Components: Astro, TypeScript
Hosting: Cloudflare Worker
Reverse Proxy & CDN: Cloudflare
`,
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
	);
