import { projects } from './projects';
import { contactEmails, getI18n, localizedPath, publicUrl, siteOrigins, type Locale } from '../i18n';

/**
 * https://llmstxt.org/ - a plain-text map of the site for language models,
 * one per language, each on its own domain.
 */
export function llms(locale: Locale): string {
	const { t } = getI18n(localizedPath('/', locale));
	const url = (path: string) => publicUrl(path, locale);
	const other = locale === 'en' ? 'fr' : 'en';

	const pages = [
		[t.nav.home, url('/'), t.home.metaDescription],
		[t.nav.about, url('/about/'), t.about.metaDescription],
		[t.nav.projects, url('/projects/'), t.projects.metaDescription],
		[t.nav.contact, url('/contact/'), t.contact.metaDescription],
	];

	return [
		`# Noam Roger - ${t.meta.jobTitle}`,
		'',
		`> ${t.home.metaDescription}`,
		'',
		t.home.description,
		'',
		'## Pages',
		'',
		...pages.map(([name, href, summary]) => `- [${name}](${href}): ${summary}`),
		locale === 'en'
			? `- [Version française](${siteOrigins[other]}/): les mêmes pages, en français`
			: `- [English version](${siteOrigins[other]}/): the same pages, in English`,
		'',
		`## ${t.nav.projects}`,
		'',
		...projects.map((project) => {
			const item = t.projects.items[project.key];
			const name = project.github ? `[${item.title}](${project.github})` : item.title;
			return `- ${name}: ${item.description} (${item.tech.join(', ')})`;
		}),
		'',
		`## ${t.nav.contact}`,
		'',
		`- Email: ${contactEmails[locale]}`,
		'- GitHub: https://github.com/noamroger',
		'- LinkedIn: https://linkedin.com/in/noamroger',
		'',
	].join('\n');
}
