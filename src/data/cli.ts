import { projects } from './projects';
import { contactEmail, getI18n, siteOrigin, stackGroups, type Locale } from '../i18n';

/**
 * The home page as plain text with ANSI colours: what `curl noamroger.fr`
 * prints (the Worker swaps it in for command-line clients, worker/ops.js).
 * Built from the same dictionaries as the pages, so it cannot drift.
 */
const ESC = '\x1b[';
const paint = (code: string) => (text: string) => `${ESC}${code}m${text}${ESC}0m`;
const bold = paint('1');
const dim = paint('2');
const green = paint('32');
const cyan = paint('36');
const yellow = paint('33');

const WIDTH = 72;

/** Wraps a paragraph to the terminal width, with an optional indent. */
function wrap(text: string, indent = ''): string {
	const lines: string[] = [];
	let line = '';
	for (const word of text.split(/\s+/)) {
		if (line && indent.length + line.length + 1 + word.length > WIDTH) {
			lines.push(indent + line);
			line = word;
		} else {
			line = line ? `${line} ${word}` : word;
		}
	}
	if (line) lines.push(indent + line);
	return lines.join('\n');
}

export function cliPage(locale: Locale): string {
	const { t } = getI18n(locale === 'en' ? '/en/' : '/');
	const other = locale === 'en' ? `${siteOrigin}/` : `${siteOrigin}/en/`;
	const labelWidth = Math.max(...t.home.profile.rows.map((row) => row.label.length));
	const groupWidth = Math.max(...stackGroups.map((group) => t.stack.groups[group.key].length));

	return [
		'',
		`${green('$')} kubectl get developer noam-roger`,
		'',
		`${bold('Noam Roger')}  ${dim('·')}  ${t.meta.jobTitle}`,
		'',
		wrap(t.home.description),
		'',
		...t.home.profile.rows.map((row) => `  ${cyan(row.label.padEnd(labelWidth))}  ${row.value}`),
		'',
		`${green('●')} ${t.home.profile.status}`,
		'',
		bold(t.home.stackTitle),
		...stackGroups.map((group) => {
			const items = [...group.items, ...('learning' in group ? group.learning.map((item) => `${item} (${t.stack.learning})`) : [])];
			return `  ${cyan(t.stack.groups[group.key].padEnd(groupWidth))}  ${items.join(', ')}`;
		}),
		'',
		bold(t.nav.projects),
		...projects.flatMap((project) => {
			const item = t.projects.items[project.key];
			return [`  ${yellow(item.title)}  ${dim(item.tech.join(', '))}`, wrap(item.description, '    '), ...(project.github ? [dim(`    ${project.github}`)] : [])];
		}),
		'',
		bold(t.nav.contact),
		`  ${contactEmail}`,
		'  https://github.com/noamroger',
		'  https://linkedin.com/in/noamroger',
		'',
		dim(`# ${locale === 'en' ? 'En français' : 'In English'}: curl ${other}`),
		dim(`# ${locale === 'en' ? 'The HTML page' : 'La page HTML'}: curl -H 'Accept: text/html' ${siteOrigin}${locale === 'en' ? '/en/' : '/'}`),
		dim(`# ${locale === 'en' ? 'Still curious?' : 'Encore curieux ?'} curl ${siteOrigin}/humans.txt`),
		'',
		'',
	].join('\n');
}
