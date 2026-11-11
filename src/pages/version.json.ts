import type { APIRoute } from 'astro';
import { commit, commitDate, repository, shortCommit } from '../data/build';

/**
 * What is live: the commit this build comes from. The Worker serves it as
 * /version and reads it for /metrics (worker/ops.js).
 */
export const GET: APIRoute = () =>
	new Response(
		JSON.stringify(
			{
				commit,
				short: shortCommit,
				committed_at: commitDate.toISOString(),
				built_at: new Date().toISOString(),
				repository,
			},
			null,
			2,
		) + '\n',
		{ headers: { 'Content-Type': 'application/json; charset=utf-8' } },
	);
