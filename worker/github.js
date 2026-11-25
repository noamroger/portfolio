// GET /api/github: neutral, aggregated GitHub activity for the site.
//
// The GitHub token (GITHUB_TOKEN, a Worker secret) never leaves the server and
// private repositories are only ever counted: their name, URL and description
// are dropped before anything is returned. The answer is kept one minute at
// the edge, so GitHub sees at most sixty requests per hour per data centre
// and per host, far below the quota of the token. Browsers never keep it
// (no-store): a phone tab reopened days later must not show an old date.

const CACHE_SECONDS = 60;
// A failure is cached too, briefly: otherwise every visit during a GitHub
// outage (or a bad token) would call GitHub again and burn the token's quota.
const ERROR_CACHE_SECONDS = 60;
const RECENT_COUNT = 5;
const TOP_LANGUAGES = 5;

// Repositories Noam owns: counts, languages and the date of their last push.
// Plus every repository he committed to over the last year, owned or not
// (a contribution to someone else's project, a fork): without them, a week
// of work on another person's repository leaves "last push" days behind.
// The date of his own latest commit there needs his node id, hence $id.
const QUERY = `
query($id: ID!) {
	viewer {
		contributionsCollection {
			contributionCalendar { totalContributions }
			commitContributionsByRepository(maxRepositories: 25) {
				repository {
					nameWithOwner
					url
					isPrivate
					owner { login }
					primaryLanguage { name }
					defaultBranchRef {
						target {
							... on Commit {
								history(first: 1, author: { id: $id }) { nodes { committedDate } }
							}
						}
					}
				}
				contributions(first: 1, orderBy: { field: OCCURRED_AT, direction: DESC }) { nodes { occurredAt } }
			}
		}
		repositories(first: 100, ownerAffiliations: OWNER, orderBy: { field: PUSHED_AT, direction: DESC }) {
			totalCount
			nodes {
				name
				nameWithOwner
				url
				isPrivate
				isFork
				parent { nameWithOwner }
				pushedAt
				primaryLanguage { name }
				languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
					edges { size node { name } }
				}
			}
		}
	}
}`;

async function graphql(token, query, variables) {
	const response = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			'User-Agent': 'noamroger.fr portfolio',
		},
		body: JSON.stringify({ query, variables }),
	});
	if (!response.ok) {
		// 401: wrong or expired token. 403: token without access, or rate limit.
		throw new Error(`GitHub answered HTTP ${response.status}`);
	}
	return response.json();
}

const latest = (...dates) => dates.filter(Boolean).sort().at(-1) ?? null;

async function fetchStats(token) {
	const me = await graphql(token, 'query { viewer { id login } }');
	const id = me.data?.viewer?.id;
	if (!id) throw new Error(me.errors?.[0]?.message ?? 'Empty GitHub answer');
	const login = me.data.viewer.login;

	const { data, errors } = await graphql(token, QUERY, { id });
	// GraphQL can answer with partial data and a list of errors (for example a
	// field the token may not read): use what came back as long as it is usable.
	if (!data?.viewer?.repositories) throw new Error(errors?.[0]?.message ?? 'Empty GitHub answer');
	if (errors?.length) console.warn('GitHub partial answer:', errors.map((error) => error.message).join('; '));

	const { repositories, contributionsCollection } = data.viewer;
	const owned = repositories.nodes;
	// Forks carry the code of their upstream: they count as activity, never
	// in the repository totals or the languages.
	const sources = owned.filter((repo) => !repo.isFork);

	// Bytes of code per language, across every repository.
	const bytes = new Map();
	for (const repo of sources) {
		for (const { size, node } of repo.languages?.edges ?? []) {
			bytes.set(node.name, (bytes.get(node.name) ?? 0) + size);
		}
	}
	const totalBytes = [...bytes.values()].reduce((sum, size) => sum + size, 0) || 1;
	const languages = [...bytes.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, TOP_LANGUAGES)
		.map(([name, size]) => ({ name, percent: Math.round((size / totalBytes) * 1000) / 10 }));

	const privateCount = sources.filter((repo) => repo.isPrivate).length;

	// Last activity per repository: the last push for his own, his own last
	// commit for the others (the push date of someone else's repository says
	// nothing about him). Without read access to the commits, the day of the
	// contribution is the fallback.
	const activity = new Map();
	for (const repo of owned) {
		activity.set(repo.nameWithOwner, {
			name: repo.name,
			url: repo.url,
			private: repo.isPrivate,
			language: repo.primaryLanguage?.name ?? null,
			pushedAt: repo.pushedAt,
		});
	}
	for (const { repository: repo, contributions } of contributionsCollection?.commitContributionsByRepository ?? []) {
		if (!repo) continue;
		// occurredAt only gives the day (GitHub sets it to midnight, Pacific
		// time, so 08:00 UTC): a made-up hour that can land after the real
		// commit. It is only used when the exact commit date is out of reach.
		const exact = repo.defaultBranchRef?.target?.history?.nodes?.[0]?.committedDate ?? null;
		const known = activity.get(repo.nameWithOwner);
		if (known) {
			// His own repository: its push date is exact already.
			known.pushedAt = latest(known.pushedAt, exact);
			continue;
		}
		const committedAt = exact ?? contributions?.nodes?.[0]?.occurredAt ?? null;
		activity.set(repo.nameWithOwner, {
			name: repo.owner?.login === login ? repo.nameWithOwner.split('/')[1] : repo.nameWithOwner,
			url: repo.url,
			private: repo.isPrivate,
			language: repo.primaryLanguage?.name ?? null,
			pushedAt: committedAt,
		});
	}
	// A fork and the project it was made for are one piece of work: keep the
	// project, with the latest of the two dates.
	for (const repo of owned) {
		const parent = repo.isFork && activity.get(repo.parent?.nameWithOwner);
		const fork = activity.get(repo.nameWithOwner);
		if (!parent || !fork) continue;
		parent.pushedAt = latest(parent.pushedAt, fork.pushedAt);
		activity.delete(repo.nameWithOwner);
	}
	const recent = [...activity.values()]
		.filter((repo) => repo.pushedAt)
		.sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));

	return {
		updatedAt: new Date().toISOString(),
		repos: {
			total: sources.length,
			public: sources.length - privateCount,
			private: privateCount,
		},
		languageCount: bytes.size,
		languages,
		lastPushAt: recent[0]?.pushedAt ?? null,
		contributionsYear: contributionsCollection?.contributionCalendar?.totalContributions ?? 0,
		recent: recent.slice(0, RECENT_COUNT).map((repo) => ({
			// Private repositories stay anonymous.
			name: repo.private ? null : repo.name,
			url: repo.private ? null : repo.url,
			private: repo.private,
			language: repo.language,
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
	// leaves for the browser is never stored there.
	const forBrowser = (stored) => {
		const response = new Response(stored.body, stored);
		response.headers.set('Cache-Control', 'no-store');
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
