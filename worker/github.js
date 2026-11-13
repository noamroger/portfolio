// GET /api/github: neutral, aggregated GitHub activity for the site.
//
// The GitHub token (GITHUB_TOKEN, a Worker secret) never leaves the server and
// private repositories are only ever counted: their name, URL and description
// are dropped before anything is returned. The answer is cached at the edge
// for five minutes, so GitHub sees at most twelve requests per hour per data
// centre and per host, far below the quota of the token. Browsers keep it one
// minute only: with a longer life there, the two delays would add up and a
// push could take twice the edge delay to show.

const CACHE_SECONDS = 300;
const BROWSER_SECONDS = 60;
// A failure is cached too, briefly: otherwise every visit during a GitHub
// outage (or a bad token) would call GitHub again and burn the token's quota.
const ERROR_CACHE_SECONDS = 60;
const RECENT_COUNT = 5;
const TOP_LANGUAGES = 5;

const QUERY = `
query {
	viewer {
		contributionsCollection {
			contributionCalendar { totalContributions }
		}
		repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: { field: PUSHED_AT, direction: DESC }) {
			totalCount
			nodes {
				name
				url
				isPrivate
				isArchived
				pushedAt
				primaryLanguage { name }
				languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
					edges { size node { name } }
				}
			}
		}
	}
}`;

async function fetchStats(token) {
	const response = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			'User-Agent': 'noamroger.fr portfolio',
		},
		body: JSON.stringify({ query: QUERY }),
	});
	if (!response.ok) {
		// 401: wrong or expired token. 403: token without access, or rate limit.
		throw new Error(`GitHub answered HTTP ${response.status}`);
	}
	const { data, errors } = await response.json();
	// GraphQL can answer with partial data and a list of errors (for example a
	// field the token may not read): use what came back as long as it is usable.
	if (!data?.viewer?.repositories) throw new Error(errors?.[0]?.message ?? 'Empty GitHub answer');
	if (errors?.length) console.warn('GitHub partial answer:', errors.map((error) => error.message).join('; '));

	const { repositories, contributionsCollection } = data.viewer;
	const repos = repositories.nodes;

	// Bytes of code per language, across every repository.
	const bytes = new Map();
	for (const repo of repos) {
		for (const { size, node } of repo.languages?.edges ?? []) {
			bytes.set(node.name, (bytes.get(node.name) ?? 0) + size);
		}
	}
	const totalBytes = [...bytes.values()].reduce((sum, size) => sum + size, 0) || 1;
	const languages = [...bytes.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, TOP_LANGUAGES)
		.map(([name, size]) => ({ name, percent: Math.round((size / totalBytes) * 1000) / 10 }));

	const privateCount = repos.filter((repo) => repo.isPrivate).length;

	return {
		updatedAt: new Date().toISOString(),
		repos: {
			total: repositories.totalCount,
			public: repositories.totalCount - privateCount,
			private: privateCount,
		},
		languageCount: bytes.size,
		languages,
		lastPushAt: repos[0]?.pushedAt ?? null,
		contributionsYear: contributionsCollection?.contributionCalendar?.totalContributions ?? 0,
		recent: repos.slice(0, RECENT_COUNT).map((repo) => ({
			// Private repositories stay anonymous.
			name: repo.isPrivate ? null : repo.name,
			url: repo.isPrivate ? null : repo.url,
			private: repo.isPrivate,
			language: repo.primaryLanguage?.name ?? null,
			pushedAt: repo.pushedAt,
		})),
	};
}

export async function handleGitHubStats(request, env, ctx) {
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
	}

	const cache = caches.default;
	const cacheKey = new Request(new URL('/api/github', request.url).toString());

	// What the edge stores says how long the edge keeps it (s-maxage); what
	// leaves for the browser only carries the short browser life.
	const forBrowser = (stored) => {
		const response = new Response(stored.body, stored);
		response.headers.set('Cache-Control', `public, max-age=${BROWSER_SECONDS}`);
		return response;
	};

	const cached = await cache.match(cacheKey);
	if (cached) return forBrowser(cached);

	// The details (missing secret, GitHub's own error) only go to the Worker
	// logs: visitors get a neutral answer, and the page hides the blocks.
	// The answer is a 200 on purpose: a browser logs every 4xx/5xx fetch in
	// the visitor's console, and this failure is not theirs to see.
	const fail = (detail) => {
		console.error('GitHub stats failed:', detail);
		const response = Response.json(
			{ error: 'unavailable' },
			{ headers: { 'Cache-Control': `public, s-maxage=${ERROR_CACHE_SECONDS}` } },
		);
		ctx.waitUntil(cache.put(cacheKey, response.clone()));
		return forBrowser(response);
	};

	if (!env.GITHUB_TOKEN) {
		return fail('GITHUB_TOKEN is not set as a runtime secret of this Worker');
	}

	try {
		const stats = await fetchStats(env.GITHUB_TOKEN);
		const response = Response.json(stats, {
			headers: { 'Cache-Control': `public, s-maxage=${CACHE_SECONDS}` },
		});
		ctx.waitUntil(cache.put(cacheKey, response.clone()));
		return forBrowser(response);
	} catch (error) {
		// The message never contains the token: it is the HTTP status or
		// GitHub's own error text.
		return fail(String(error?.message ?? error));
	}
}
