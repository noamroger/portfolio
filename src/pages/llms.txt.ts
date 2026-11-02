import type { APIRoute } from 'astro';
import { projects } from '../data/projects';
import { contactEmail, getI18n } from '../i18n';

const { t } = getI18n('/');

/**
 * https://llmstxt.org/ - a plain-text map of the site for language models,
 * in French, the default language of the site, with a pointer to the English pages.
 */
export const GET: APIRoute = ({ site }) => {
	const url = (path: string) => new URL(path, site).href;

	const pages = [
		[t.nav.home, url('/'), t.home.metaDescription],
		[t.nav.about, url('/about/'), t.about.metaDescription],
		[t.nav.projects, url('/projects/'), t.projects.metaDescription],
		[t.nav.contact, url('/contact/'), t.contact.metaDescription],
	];

	const body = [
		`# Noam Roger - ${t.meta.jobTitle}`,
		'',
		`> ${t.home.metaDescription}`,
		'',
		t.home.description,
		'',
		'## Pages',
		'',
		...pages.map(([name, href, summary]) => `- [${name}](${href}): ${summary}`),
		'- [English version](' + url('/en/') + '): the same pages, in English',
		'',
		`## ${t.nav.projects}`,
		'',
		...projects.map((project) => {
			const item = t.projects.items[project.key];
			return `- [${item.title}](${project.github}): ${item.description} (${item.tech.join(', ')})`;
		}),
		'',
		`## ${t.nav.contact}`,
		'',
		`- Email: ${contactEmail}`,
		'- GitHub: https://github.com/noamroger',
		'- LinkedIn: https://linkedin.com/in/noamroger',
		'',
	].join('\n');

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
