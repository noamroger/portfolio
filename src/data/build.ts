import { execSync } from 'node:child_process';

/**
 * The commit being built and its date, read once at build time. Every push to
 * main triggers a build, so this is also "what is live and since when".
 *
 * Workers Builds exposes the commit as WORKERS_CI_COMMIT_SHA; git is asked
 * otherwise. Without either (a tarball, an image without git) the commit is
 * null and the date falls back to the build date.
 */
function git(args: string): string {
	try {
		return execSync(`git ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		return '';
	}
}

const sha = (process.env.WORKERS_CI_COMMIT_SHA || git('rev-parse HEAD')).toLowerCase();
const iso = git('log -1 --format=%cI');

/** Full commit hash, or null when it cannot be known. */
export const commit: string | null = /^[0-9a-f]{40}$/.test(sha) ? sha : null;
/** The seven-character form shown to humans. */
export const shortCommit: string | null = commit ? commit.slice(0, 7) : null;
/** Date of that commit, or of the build when git is not available. */
export const commitDate: Date = iso && !Number.isNaN(Date.parse(iso)) ? new Date(iso) : new Date();
export const repository = 'https://github.com/noamroger/portfolio';
