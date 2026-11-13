import { commitDate } from './build';
import { contactEmail, siteOrigin, type Locale } from '../i18n';

/**
 * The plain-text files of the site, in both languages. French is served at
 * the usual address (/humans.txt, /robots.txt, /security.txt) and English
 * under /en/; the Worker picks one from the Accept-Language header of the
 * visitor (worker/ops.js), since these addresses cannot carry a language.
 */

/** Date of the commit being built, as YYYY/MM/DD (the humanstxt.org format). */
function lastUpdate(): string {
	// en-CA formats as YYYY-MM-DD; Paris time so a late-evening commit is not
	// dated the day before or after.
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(commitDate).replaceAll('-', '/');
}

/** https://humanstxt.org/ - who is behind the site, for the humans who look. */
export function humans(locale: Locale): string {
	if (locale === 'en') {
		return `/* TEAM */
Developer: Noam Roger
Site: https://noamroger.fr
Contact: ${contactEmail}
Role: Third-year computer science student / Looking for a work-study position, DevOps & Cloud Master's (September 2027)
Location: Le Mans, France

/* THANKS */
To everyone curious enough to read plaintext files in /

/* HUNT */
Three flags are hidden around this site, each one a reflex away.
They look like flag{...} and are checked in the home page terminal: unlock flag{...}
First hint: curl -sI https://www.noamroger.fr
Lost? Type 'flags' in that terminal.

/* PRIVACY */
Home-made visit statistics, without any cookie: they store nothing in your browser.
The data is anonymous (page, day, country, kind of device, referring site): your IP address is never recorded.
Everything is deleted after 90 days.

/* SITE */
Last update: ${lastUpdate()}
Standards: HTML5, CSS3
Components: Astro, TypeScript
Hosting: Cloudflare Worker
Reverse Proxy & CDN: Cloudflare
`;
	}
	return `/* ÉQUIPE */
Développeur : Noam Roger
Site : https://noamroger.fr
Contact : ${contactEmail}
Rôle : Étudiant L3 Informatique / Recherche alternance Master DevOps & Cloud (Rentrée 2027)
Lieu : Le Mans, France

/* MERCI */
À toutes celles et ceux assez curieux pour lire les fichiers texte à la racine du site

/* CHASSE */
Trois flags sont cachés sur ce site, chacun à un réflexe de distance.
Ils ressemblent à flag{...} et se valident dans le terminal de la page d'accueil : unlock flag{...}
Premier indice : curl -sI https://www.noamroger.fr
Perdu ? Tape 'flags' dans ce terminal.

/* VIE PRIVÉE */
Statistiques de visite maison, sans aucun cookie : elles ne stockent rien dans ton navigateur.
Les données sont anonymes (page, jour, pays, type d'appareil, site d'origine) : ton adresse IP n'est jamais enregistrée.
Tout est effacé au bout de 90 jours.

/* SITE */
Dernière mise à jour : ${lastUpdate()}
Standards : HTML5, CSS3
Composants : Astro, TypeScript
Hébergement : Cloudflare Worker
Reverse proxy et CDN : Cloudflare
`;
}

export function robots(locale: Locale): string {
	const wink = locale === 'en' ? "# This page isn't meant for you, try /humans.txt instead" : "# Cette page ne t'est pas destinée, essaie plutôt /humans.txt";
	return `${wink}

User-agent: *
Allow: /

Sitemap: ${siteOrigin}/sitemap-index.xml
`;
}

/**
 * https://www.rfc-editor.org/rfc/rfc9116 - where to report a security issue.
 * Expires is required and must stay in the future: it is pushed a year ahead
 * on every build.
 */
export function security(locale: Locale): string {
	const expires = new Date();
	expires.setUTCFullYear(expires.getUTCFullYear() + 1);
	expires.setUTCHours(0, 0, 0, 0);

	const head = locale === 'en' ? '# Found something? Thank you for telling me before telling the world.' : "# Tu as trouvé une faille ? Merci de me prévenir avant d'en parler au monde entier.";
	const scope =
		locale === 'en'
			? `# Scope: this site is static files behind a Cloudflare Worker, and its code is
# public (https://github.com/noamroger/portfolio). No bounty, but a sincere
# thank-you and a mention in /humans.txt if you want one.`
			: `# Périmètre : ce site, ce sont des fichiers statiques derrière un Worker
# Cloudflare, et son code est public (https://github.com/noamroger/portfolio).
# Pas de prime, mais un merci sincère et une mention dans /humans.txt si tu veux.`;

	return `${head}

Contact: mailto:${contactEmail}
Expires: ${expires.toISOString()}
Preferred-Languages: fr, en
Canonical: ${siteOrigin}/.well-known/security.txt

${scope}
`;
}

export const plain = (body: string) => new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
