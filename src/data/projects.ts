/**
 * Order and links of the project cards. Language-independent on purpose: the
 * title, description, tech tags and alt text live in src/i18n, keyed by the
 * same `key`. Shared by the Projects page and by /llms.txt.
 */
export const projects = [
	{
		key: 'homelab',
		github: null,
		demo: null,
	},
	{
		key: 'californyan',
		github: 'https://github.com/noamroger/llm-hotel-24h',
		demo: null,
	},
	{
		key: 'romaybot',
		github: 'https://github.com/noamroger/romaybot',
		demo: null,
	},
	{
		key: 'codenames',
		github: 'https://github.com/noamroger/codenames-c',
		// The demo video is hosted on the site and plays in a modal: see Projects.astro.
		demo: null,
	},
	{
		key: 'webserverTs',
		github: 'https://github.com/noamroger/webserver-ts',
		demo: null,
	},
	{
		key: 'gaulia',
		github: 'https://github.com/noamroger/GauliaMusique',
		demo: null,
	},
] as const satisfies readonly { key: string; github: string | null; demo: string | null }[];

export type ProjectKey = (typeof projects)[number]['key'];
