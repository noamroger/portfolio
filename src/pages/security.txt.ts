import type { APIRoute } from 'astro';
import { contactEmail, siteOrigin } from '../i18n';

/**
 * https://www.rfc-editor.org/rfc/rfc9116 - where to report a security issue.
 * Expires is required and must stay in the future: it is pushed a year ahead
 * on every build.
 *
 * Built as /security.txt and not under src/pages/.well-known/: .gitignore
 * leaves dot directories out of the repository. The Worker answers
 * /.well-known/security.txt, the canonical address, with this file
 * (worker/ops.js).
 */
export const GET: APIRoute = () => {
	const expires = new Date();
	expires.setUTCFullYear(expires.getUTCFullYear() + 1);
	expires.setUTCHours(0, 0, 0, 0);

	return new Response(
		`# Found something? Thank you for telling me before telling the world.
# Un problème de sécurité ? Merci de me prévenir en premier.

Contact: mailto:${contactEmail}
Expires: ${expires.toISOString()}
Preferred-Languages: fr, en
Canonical: ${siteOrigin}/.well-known/security.txt

# Scope: this site is static files behind a Cloudflare Worker, and its code is
# public (https://github.com/noamroger/portfolio). No bounty, but a sincere
# thank-you and a mention in /humans.txt if you want one.
`,
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
	);
};
