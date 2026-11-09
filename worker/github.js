// GET /api/github: neutral, aggregated GitHub activity for the site.
//
// The GitHub token (GITHUB_TOKEN, a Worker secret) never leaves the server and
// private repositories are only ever counted: their name, URL and description
// are dropped before anything is returned. The answer is cached at the edge
// for an hour, so GitHub sees at most one request per hour per data centre.

const CACHE_SECONDS = 3600;
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
	if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
	const { data, errors } = await response.json();
	if (errors?.length || !data) throw new Error(errors?.[0]?.message ?? 'Empty GitHub answer');

	const { repositories, contributionsCollection } = data.viewer;
	const repos = repositories.nodes;

	// Bytes of code per language, across every repository.
	const bytes = new Map();
	for (const repo of repos) {
		for (const { size, node } of repo.languages.edges) {
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
		contributionsYear: contributionsCollection.contributionCalendar.totalContributions,
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
	const cache = caches.default;
	const cacheKey = new Request(new URL('/api/github', request.url).toString());

	const cached = await cache.match(cacheKey);
	if (cached) return cached;

	if (!env.GITHUB_TOKEN) {
		return Response.json({ error: 'not configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
	}

	try {
		const stats = await fetchStats(env.GITHUB_TOKEN);
		const response = Response.json(stats, {
			headers: { 'Cache-Control': `public, max-age=${CACHE_SECONDS}` },
		});
		ctx.waitUntil(cache.put(cacheKey, response.clone()));
		return response;
	} catch (error) {
		console.error('GitHub stats failed:', error);
		return Response.json({ error: 'unavailable' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
	}
}
