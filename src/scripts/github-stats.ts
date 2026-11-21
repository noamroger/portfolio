/**
 * Fills every [data-gh] element from /api/github (see worker/github.js).
 * Blocks marked [data-gh-block] stay hidden until the data is there, so a
 * missing token or a GitHub outage simply leaves them out of the page.
 */

interface Stats {
	repos: { total: number; public: number; private: number };
	languageCount: number;
	languages: { name: string; percent: number }[];
	lastPushAt: string | null;
	contributionsYear: number;
	recent: { name: string | null; url: string | null; private: boolean; language: string | null; pushedAt: string }[];
}

// The answer is shared by the pages of one visit, but only for a minute: the
// site navigates without reloading (ClientRouter), and a phone can keep a tab
// alive for weeks, so a copy kept for the whole life of the page would show a
// "last push" frozen on the day the tab was opened.
const MAX_AGE_MS = 60_000;
let request: Promise<Stats | null> | null = null;
let requestedAt = 0;

function load(): Promise<Stats | null> {
	if (!request || Date.now() - requestedAt > MAX_AGE_MS) {
		requestedAt = Date.now();
		request = fetch('/api/github', { cache: 'no-store' })
			.then((response) => (response.ok ? (response.json() as Promise<Stats | { error: string }>) : null))
			// A failure comes back as a 200 carrying { error } (see worker/github.js).
			.then((data) => (data && !('error' in data) ? data : null))
			.catch(() => null);
	}
	return request;
}

function relative(iso: string, locale: string): string {
	const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		['year', 31536000], ['month', 2592000], ['week', 604800],
		['day', 86400], ['hour', 3600], ['minute', 60],
	];
	const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
	for (const [unit, size] of units) {
		if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
	}
	return format.format(0, 'minute');
}

const fill = (template: string, values: Record<string, string | number>) =>
	template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));

function render(stats: Stats) {
	const locale = document.documentElement.lang || 'fr';
	const number = new Intl.NumberFormat(locale);
	const when = stats.lastPushAt ? relative(stats.lastPushAt, locale) : '—';
	const values: Record<string, string | number> = {
		total: number.format(stats.repos.total),
		public: number.format(stats.repos.public),
		private: number.format(stats.repos.private),
		contributions: number.format(stats.contributionsYear),
		languageCount: number.format(stats.languageCount),
		topLanguages: stats.languages.slice(0, 3).map((language) => language.name).join(' · '),
		when,
	};

	// Text slots: data-gh="Template with {total} placeholders".
	document.querySelectorAll<HTMLElement>('[data-gh]').forEach((el) => {
		el.textContent = fill(el.dataset.gh ?? '', values);
	});

	// Language bars.
	document.querySelectorAll<HTMLElement>('[data-gh-languages]').forEach((list) => {
		const bar = list.querySelector<HTMLElement>('[data-gh-bar]');
		const legend = list.querySelector<HTMLElement>('[data-gh-legend]');
		if (!bar || !legend) return;
		bar.replaceChildren();
		legend.replaceChildren();
		stats.languages.forEach((language, i) => {
			const segment = document.createElement('span');
			segment.className = `lang-seg lang-${i}`;
			segment.style.width = `${language.percent}%`;
			bar.append(segment);

			const item = document.createElement('li');
			item.innerHTML = `<i class="lang-dot lang-${i}"></i><span></span><span class="lang-percent"></span>`;
			item.children[1].textContent = language.name;
			item.children[2].textContent = `${language.percent.toLocaleString(locale)} %`;
			legend.append(item);
		});
	});

	// Recent activity.
	document.querySelectorAll<HTMLElement>('[data-gh-recent]').forEach((list) => {
		const privateLabel = list.dataset.privateLabel ?? 'private';
		list.replaceChildren();
		for (const repo of stats.recent) {
			const item = document.createElement('li');
			const name = document.createElement(repo.url ? 'a' : 'span');
			name.className = 'recent-name';
			if (repo.url && name instanceof HTMLAnchorElement) {
				name.href = repo.url;
				name.target = '_blank';
				name.rel = 'noopener noreferrer';
			}
			name.textContent = repo.private ? privateLabel : (repo.name ?? '');
			if (repo.private) item.classList.add('is-private');

			const language = document.createElement('span');
			language.className = 'recent-lang';
			language.textContent = repo.language ?? '';

			const time = document.createElement('time');
			time.className = 'recent-time';
			time.dateTime = repo.pushedAt;
			time.textContent = relative(repo.pushedAt, locale);

			item.append(name, language, time);
			list.append(item);
		}
	});

	document.querySelectorAll<HTMLElement>('[data-gh-block]').forEach((el) => {
		el.hidden = false;
	});
}

async function refresh() {
	if (!document.querySelector('[data-gh-block]')) return;
	const stats = await load();
	if (stats) render(stats);
}

document.addEventListener('astro:page-load', refresh);
// A page restored from the back/forward cache, or a tab brought back to the
// front, still shows what it had when it was left: ask again.
window.addEventListener('pageshow', (event) => {
	if (event.persisted) refresh();
});
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'visible') refresh();
});
