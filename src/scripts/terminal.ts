/**
 * Interactive prompt under the home page YAML block.
 *
 * A tiny fake shell: a closed list of hard-coded commands, a history recalled
 * with the arrow keys, Tab completion, no dependency. Everything it prints is
 * English, whatever the page language. Output is always written with
 * textContent, never as HTML.
 *
 * `help` only lists part of it: the rest is there for whoever tries. Finding
 * the three flags of the hunt makes `sudo` work: the root shell has a few
 * commands and files of its own.
 *
 * The client router swaps <body> on navigation, so the prompt is wired again on
 * every astro:page-load.
 */
import { navigate } from 'astro:transitions/client';
import { COFFEE_KEY, FLAGS_DONE_KEY, FLAGS_KEY, FLAGS_START_KEY, LANGUAGE_KEY, ROOT_KEY } from '../i18n/preference';
import { setSnow } from './snow';

const PROMPT = 'guest@noamroger.fr:~$';
const ROOT_PROMPT = 'root@noamroger.fr:~#';

const HELP = `Available commands:
  kubectl get pods        Inspect running cluster pods
  kubectl logs <pod>      Print the logs of a pod
  kubectl describe pod <pod>
  ls, cat <file>          Look around
  cd <page>               Go to about, projects or contact
  theme <dark|light>      Switch the colour theme
  lang <fr|en>            Switch the language
  whoami                  Print current session context
  clear                   Clear terminal buffer
  ruinthefun              Give up and read the answers

Not everything is listed here.`;

const ROOT_HELP = `

Root only:
  ls, cat <file>          There is more in here now
  kubectl get secrets     What guests cannot read
  make coffee             Fix the coffee maker, at last
  certificate             Print your certificate again
  exit                    Back to guest`;

// --- Storage (can be blocked: everything falls back to the page) -------------

function read(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function write(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Storage blocked: the value holds for this page only.
	}
}

// --- Pods --------------------------------------------------------------------

interface Pod {
	name: string;
	ready: string;
	status: string;
	restarts: number;
	/** Creation time, in ms. */
	born: number;
	/** Recreated under the same name (StatefulSet) instead of a new suffix. */
	stateful?: boolean;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

// One more restart of the coffee maker on every visit.
const visits = (Number(read(COFFEE_KEY)) || 0) + 1;
write(COFFEE_KEY, String(visits));

const pods: Pod[] = [
	// `born` is replaced by the real deployment date once the page is known.
	{ name: 'portfolio-frontend-7f9b8c6d4-2x9la', ready: '1/1', status: 'Running', restarts: 0, born: Date.now() - 42 * DAY },
	{ name: 'homelab-sync-daemon-5d8f7b9c1-k8v2z', ready: '1/1', status: 'Running', restarts: 0, born: Date.now() - 12 * DAY },
	{ name: 'coffee-maker-api-0', ready: '0/1', status: 'CrashLoopBackOff', restarts: 1336 + visits, born: Date.now() - 2 * HOUR, stateful: true },
];

let deployed: number | null = null;
let commit = '';

/** Same rounding as kubectl: 45s, 4m12s, 95m, 5h30m, 30h, 3d4h, 42d. */
function age(since: number): string {
	const s = Math.max(0, Math.floor((Date.now() - since) / 1000));
	const m = Math.floor(s / 60);
	const h = Math.floor(m / 60);
	const d = Math.floor(h / 24);
	if (s < 120) return `${s}s`;
	if (m < 10) return `${m}m${s % 60}s`;
	if (h < 3) return `${m}m`;
	if (h < 8) return `${h}h${m % 60}m`;
	if (h < 48) return `${h}h`;
	if (d < 8) return `${d}d${h % 24}h`;
	return `${d}d`;
}

function table(rows: string[][]): string {
	const widths = rows[0].map((_, column) => Math.max(...rows.map((row) => row[column].length)));
	return rows
		.map((row) => row.map((cell, column) => (column === row.length - 1 ? cell : cell.padEnd(widths[column] + 3))).join(''))
		.join('\n');
}

function podTable(): string {
	return table([
		['NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE'],
		...pods.map((pod) => [pod.name, pod.ready, pod.status, String(pod.restarts), age(pod.born)]),
	]);
}

function findPod(name: string | undefined): Pod | undefined {
	const wanted = (name ?? '').replace(/^pods?\//, '');
	return pods.find((pod) => pod.name === wanted);
}

const notFound = (name: string | undefined) =>
	name ? `Error from server (NotFound): pods "${name}" not found` : 'error: you must specify the name of a pod';

const forbidden = (verb: string, resource: string) =>
	`Error from server (Forbidden): ${resource} is forbidden: User "guest" cannot ${verb} resource "${resource}" in the namespace "default"`;

function podLogs(pod: Pod): string {
	if (pod.name.startsWith('portfolio-frontend')) {
		return `GET /             200  2ms
GET /humans.txt   200  1ms
GET /wp-admin     404  1ms
GET /.env         404  1ms
GET /.git/config  404  1ms`;
	}
	if (pod.name.startsWith('homelab-sync')) {
		return `level=info msg="mesh peers reachable"
level=info msg="containers up to date"
level=info msg="next run in 15m"`;
	}
	if (pod.status === 'Running') {
		return `[boot]  coffee-maker-api listening on :8080
[info]  COFFEE_MAKER_MODE=coffee
[info]  POST /brew -> 201 Created
[info]  fresh pot ready`;
	}
	return `[boot]  coffee-maker-api listening on :8080
[warn]  water tank: empty
[info]  GET /coffee -> 418 I'm a teapot
[fatal] cannot brew: I'm a teapot (RFC 2324)
[hint]  this one answers for real: curl -i https://www.noamroger.fr/coffee`;
}

function describePod(pod: Pod): string {
	const crashing = pod.status !== 'Running';
	const lines = [
		`Name:         ${pod.name}`,
		'Namespace:    default',
		`Status:       ${crashing ? 'Running' : pod.status}`,
		'Containers:',
		`  ${pod.name.replace(/(-[a-z0-9]+){1,2}$/, '')}:`,
		`    State:          ${crashing ? 'Waiting' : 'Running'}`,
	];
	if (crashing) {
		lines.push(
			'      Reason:       CrashLoopBackOff',
			'    Last State:     Terminated',
			'      Reason:       Error',
			'      Exit Code:    418',
		);
	}
	lines.push(`    Ready:          ${crashing ? 'False' : 'True'}`, `    Restart Count:  ${pod.restarts}`, 'Events:');
	if (crashing) {
		lines.push(
			'  Type     Reason   Message',
			'  ----     ------   -------',
			'  Warning  BackOff  Back-off restarting failed container',
			"  Normal   Hint     kubectl logs coffee-maker-api-0",
		);
	} else {
		lines.push('  <none>');
	}
	return lines.join('\n');
}

function deletePod(pod: Pod): string {
	const old = pod.name;
	if (pod.stateful) {
		pod.restarts = 0;
	} else {
		// A ReplicaSet brings a replacement up under a new random suffix.
		const suffix = Array.from({ length: 5 }, () => 'bcdfghjklmnpqrstvwxz2456789'[Math.floor(Math.random() * 27)]).join('');
		pod.name = pod.name.replace(/[a-z0-9]+$/, suffix);
	}
	pod.born = Date.now();
	return `pod "${old}" deleted\n# ...and already replaced: run 'kubectl get pods'.`;
}

function kubectl(args: string[], elevated: boolean): string {
	const [verb, resource, name] = args;
	const isPods = /^(pods?|po)$/.test(resource ?? '');

	if (!verb) return "kubectl controls the cluster. Try 'kubectl get pods'.";
	if (verb === 'version') return 'Client Version: v1.34.0\nServer Version: v1.34.0 (pretend)';

	if (verb === 'get') {
		if (isPods) {
			if (!name || name.startsWith('-')) return podTable();
			const pod = findPod(name);
			return pod
				? table([['NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE'], [pod.name, pod.ready, pod.status, String(pod.restarts), age(pod.born)]])
				: notFound(name);
		}
		if (/^developers?$/.test(resource ?? '')) {
			return table([
				['NAME', 'STATUS', 'CODING SINCE'],
				['noam-roger', 'Available (work-study, Sept. 2027)', '2019'],
			]);
		}
		if (!resource) return 'You must specify the type of resource to get.';
		if (elevated && /^secrets?$/.test(resource)) {
			if (!name || name.startsWith('-')) {
				return `${table([
					['NAME', 'TYPE', 'DATA', 'AGE'],
					['recruiter-note', 'Opaque', '1', age(pods[0].born)],
				])}\n# kubectl get secret recruiter-note`;
			}
			if (name !== 'recruiter-note') return `Error from server (NotFound): secrets "${name}" not found`;
			return [
				'apiVersion: v1',
				'kind: Secret',
				'metadata:',
				'  name: recruiter-note',
				'stringData:',
				'  note: |',
				'    You read the headers, the source and the logs before getting here.',
				'    That is the kind of curiosity I would like to work with.',
				'    I am looking for a work-study position (DevOps / Cloud Master,',
				'    September 2027): contact@noamroger.fr',
			].join('\n');
		}
		return forbidden('list', resource);
	}

	if (verb === 'logs') {
		const pod = findPod(resource);
		return pod ? podLogs(pod) : notFound(resource);
	}

	if (verb === 'describe') {
		// `describe pod <name>` and `describe pod/<name>` both work.
		const pod = findPod(isPods ? name : resource);
		if (pod) return describePod(pod);
		return isPods || resource?.includes('/') ? notFound(isPods ? name : resource) : forbidden('get', resource ?? 'pods');
	}

	if (verb === 'delete') {
		const pod = findPod(isPods ? name : resource);
		if (pod) return deletePod(pod);
		return isPods || resource?.includes('/') ? notFound(isPods ? name : resource) : forbidden('delete', resource ?? 'pods');
	}

	if (['apply', 'create', 'edit', 'exec', 'scale', 'patch', 'rollout', 'drain', 'cordon'].includes(verb)) {
		return forbidden(verb === 'exec' ? 'create' : verb, verb === 'exec' ? 'pods/exec' : (resource ?? 'pods'));
	}
	return `error: unknown command "${verb}" for "kubectl"`;
}

// --- Flags (the hunt starts in /humans.txt) ----------------------------------

// SHA-256 of each flag: reading this file does not give them away.
const FLAGS = [
	{ hash: 'c02849b87dad2cda7f4943809dc050bd151cf67b77866f1064d91eb5d1e74504', hint: 'response headers are worth a look (curl -sI)' },
	{ hash: 'a8bab6cf2d84e81669938280ef5d142fb6fe09e2e16b610b7d032ce0db0639af', hint: 'some things only show up in the page source' },
	{ hash: 'daefd51658445ca17decd06f49266e7553d1301229cee33ce3554faaa798d67f', hint: 'one pod keeps crashing: read its logs' },
];
const BONUS = { hash: 'b5ccd7598824fbc9eca35966737ca37d25a670c27873d65d45e5a0742c5abd91', hint: 'dig TXT noamroger.fr' };

function foundFlags(): Set<string> {
	const known = [...FLAGS, BONUS].map((flag) => flag.hash);
	return new Set((read(FLAGS_KEY) ?? '').split(',').filter((hash) => known.includes(hash)));
}

const hasRoot = () => {
	const found = foundFlags();
	return FLAGS.every((flag) => found.has(flag.hash));
};

/** A root shell is earned with the flags, then entered with sudo. */
const isRoot = () => hasRoot() && read(ROOT_KEY) === '1';

function certificate(): string {
	const found = foundFlags();
	const bonus = found.has(BONUS.hash);
	const start = Number(read(FLAGS_START_KEY));
	const done = Number(read(FLAGS_DONE_KEY));
	const took = start && done >= start ? age(Date.now() - (done - start)) : 'unknown';
	const date = new Date(done || Date.now()).toISOString().slice(0, 10);
	const rows = [
		'',
		'CERTIFIED CURIOUS',
		'',
		`Flags   ${FLAGS.length}/${FLAGS.length}${bonus ? ' + bonus (DNS)' : ''}`,
		`Rank    ${bonus ? 'cluster-admin' : 'root'}`,
		`Date    ${date}`,
		`Time    ${took} from first to last flag`,
		`Build   ${commit || 'unknown'}`,
		'',
		'Issued by noamroger.fr to whoever reads headers,',
		'sources and logs before being asked to.',
		'',
	];
	const width = Math.max(...rows.map((row) => row.length));
	const line = `+${'-'.repeat(width + 4)}+`;
	return [line, ...rows.map((row, i) => `|  ${i === 1 ? row.padStart(Math.floor((width + row.length) / 2)).padEnd(width) : row.padEnd(width)}  |`), line].join('\n');
}

function flagStatus(): string {
	const found = foundFlags();
	const lines = FLAGS.map((flag, i) => `  [${found.has(flag.hash) ? 'x' : ' '}] flag ${i + 1}   ${found.has(flag.hash) ? 'found' : flag.hint}`);
	lines.push(`  [${found.has(BONUS.hash) ? 'x' : ' '}] bonus    ${found.has(BONUS.hash) ? 'found' : BONUS.hint}`);
	const count = FLAGS.filter((flag) => found.has(flag.hash)).length;
	return `Flags: ${count}/${FLAGS.length}\n${lines.join('\n')}\nSubmit one with: unlock flag{...}`;
}

async function unlock(candidate: string): Promise<string> {
	if (!candidate) return 'usage: unlock flag{...}';
	if (!globalThis.crypto?.subtle) return 'unlock: needs a secure context (https)';

	const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(candidate));
	const hash = Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
	if (![...FLAGS, BONUS].some((flag) => flag.hash === hash)) return 'Wrong flag. Keep digging.';

	const found = foundFlags();
	const already = found.has(hash);
	const hadRoot = hasRoot();
	found.add(hash);
	write(FLAGS_KEY, [...found].join(','));
	if (!read(FLAGS_START_KEY)) write(FLAGS_START_KEY, String(Date.now()));
	if (!hadRoot && hasRoot()) write(FLAGS_DONE_KEY, String(Date.now()));

	const count = FLAGS.filter((flag) => found.has(flag.hash)).length;
	const next = FLAGS.find((flag) => !found.has(flag.hash));
	const isBonus = hash === BONUS.hash;
	const head = already ? 'Already unlocked.' : isBonus ? 'Bonus flag unlocked. You even checked the DNS.' : `Flag unlocked (${count}/${FLAGS.length}).`;
	if (next) return `${head}\nNext: ${next.hint}.`;
	if (already) return `${head}\nType 'certificate' to see it again.`;
	if (isBonus) return `${head}\nRank raised to cluster-admin:\n${certificate()}`;
	return [
		head,
		`All ${FLAGS.length} flags found. You clearly have the reflexes: I would be glad to talk.`,
		certificate(),
		'-> contact@noamroger.fr',
		"One more thing: you are in the sudoers file now. Try 'sudo -i'.",
		...(found.has(BONUS.hash) ? [] : [`(bonus: ${BONUS.hint})`]),
	].join('\n');
}

// --- Files -------------------------------------------------------------------

const DIRECTORIES = ['about', 'contact', 'projects'];
const FILES = ['humans.txt', 'robots.txt'];
/** What only a root shell lists and reads. */
const ROOT_FILES = ['certificate.txt', 'cv.txt', 'private-key.pem'];

// Chosen by fair dice roll. Guaranteed to be random.
const PRIVATE_KEY = '-----BEGIN RSA PRIVATE KEY-----\n4\n-----END RSA PRIVATE KEY-----';

async function cat(file: string | undefined, elevated: boolean): Promise<string> {
	if (!file) return 'usage: cat <file>';
	const name = file.replace(/^(\.\/|\/root\/|~\/|\/)/, '').replace(/\/$/, '');
	if (elevated) {
		if (name === 'private-key.pem') return PRIVATE_KEY;
		if (name === 'certificate.txt') return certificate();
		if (name === '.env') return 'COFFEE_MAKER_MODE=teapot\n# That explains a lot. Try: make coffee';
		if (name === 'cv.txt') {
			try {
				const response = await fetch(localized('/cli.txt'));
				if (!response.ok) throw new Error(String(response.status));
				// The file is written for curl: drop its colour codes.
				return (await response.text()).replace(/\x1b\[[0-9;]*m/g, '').trim();
			} catch {
				return 'cat: cv.txt: Input/output error';
			}
		}
	}
	if (name === '.env') return 'cat: .env: Permission denied\n# Secrets live in the Worker environment, not in the repository.';
	if (DIRECTORIES.includes(name)) return `cat: ${name}/: Is a directory (try 'cd ${name}')`;
	if (!FILES.includes(name)) return `cat: ${file}: No such file or directory`;
	try {
		const response = await fetch(`/${name}`);
		if (!response.ok) throw new Error(String(response.status));
		return (await response.text()).trimEnd();
	} catch {
		return `cat: ${name}: Input/output error`;
	}
}

// --- The shell ---------------------------------------------------------------

// Kept across page navigations, like a shell session.
const history: string[] = [];
let inVim = false;

/** What Tab completes: whole commands, so the hidden ones stay hidden. */
function completions(): string[] {
	return [
		'help',
		'whoami',
		'clear',
		'ruinthefun',
		'ls',
		'cat humans.txt',
		'cat robots.txt',
		'cd about',
		'cd contact',
		'cd projects',
		'theme dark',
		'theme light',
		'lang en',
		'lang fr',
		'kubectl get pods',
		...(isRoot() ? [...ROOT_FILES.map((file) => `cat ${file}`), 'kubectl get secrets', 'kubectl get secret recruiter-note', 'make coffee', 'certificate', 'exit'] : []),
		...pods.flatMap((pod) => [`kubectl logs ${pod.name}`, `kubectl describe pod ${pod.name}`, `kubectl delete pod ${pod.name}`]),
	];
}

function complete(value: string): string {
	const typed = value.replace(/^\s+/, '').replace(/\s+/g, ' ');
	if (!typed) return value;
	const matches = completions().filter((candidate) => candidate.startsWith(typed.toLowerCase()));
	if (!matches.length) return value;
	// Longest prefix shared by every match, like a shell does.
	let prefix = matches[0];
	for (const match of matches) {
		while (!match.startsWith(prefix)) prefix = prefix.slice(0, -1);
	}
	return prefix.length > typed.length ? prefix : value;
}

interface Shell {
	/** Runs once the output has been printed (navigation, closing the window). */
	after(action: () => void): void;
	/** Prints a real link under the output. */
	link(href: string): void;
}

const isEnglish = () => /^\/en(\/|$)/.test(location.pathname);
const localized = (path: string) => (isEnglish() ? `/en${path}` : path);

/** Returns the text to print, or null when the buffer must be cleared. */
async function run(raw: string, shell: Shell, elevated = isRoot()): Promise<string | null> {
	const line = raw.trim();
	const command = line.toLowerCase().replace(/\s+/g, ' ');
	const [name, ...args] = command.split(' ');

	if (inVim) {
		if (/^:(q|q!|wq|wq!|x)$/.test(command) || command === 'zz') {
			inVim = false;
			return 'You made it out of vim. Not everyone does.';
		}
		return "-- INSERT --   (type ':q' to exit)";
	}

	if (name === 'sudo' || name === 'su') {
		if (!hasRoot()) {
			return name === 'su' ? 'su: Authentication failure' : 'guest is not in the sudoers file. This incident will be reported.';
		}
		// A root shell: `su`, `sudo -i`, `sudo su`, or sudo on its own.
		if (name === 'su' || !args.length || ['-i', '-s', 'su', 'bash', 'zsh'].includes(args[0])) {
			if (isRoot()) return 'Already root.';
			write(ROOT_KEY, '1');
			return "Welcome, root. You earned it.\nType 'help' to see what changed, 'exit' to go back to guest.";
		}
		// Anything else runs once as root.
		return run(line.replace(/^sudo\s+/i, ''), shell, true);
	}

	switch (name) {
		case 'help':
			return elevated ? HELP + ROOT_HELP : HELP;
		case 'clear':
			return null;
		case 'ruinthefun':
			shell.link(localized('/ruinthefun/'));
			return 'List of easter eggs for those who do not like to play:';
		case 'whoami':
			return elevated ? 'root - you found every flag. Feel free to reach out at contact@noamroger.fr' : 'guest - feel free to reach out at contact@noamroger.fr';
		case 'kubectl':
		case 'k':
			return kubectl(args, elevated);
		case 'certificate':
		case 'cert':
			return hasRoot() ? certificate() : "No certificate yet. Type 'flags'.";

		case 'ls': {
			const entries = [...DIRECTORIES.map((directory) => `${directory}/`), ...(elevated ? [...FILES, ...ROOT_FILES].sort() : FILES)];
			const all = args.some((arg) => /^-\w*a/.test(arg));
			return (all ? ['.env', ...entries] : entries).join('  ');
		}
		case 'cat':
			// The original spelling: file names are case-sensitive.
			return cat(line.replace(/^sudo\s+/i, '').split(/\s+/)[1], elevated);
		case 'cd': {
			const target = (args[0] ?? '~').replace(/^(\.\/|\/)/, '').replace(/\/$/, '');
			if (['', '~', '.', '..'].includes(target)) return 'Already home.';
			if (!DIRECTORIES.includes(target)) return `cd: no such file or directory: ${args[0]}`;
			shell.after(() => navigate(localized(`/${target}/`)));
			return `Opening /${target}/ ...`;
		}
		case 'pwd':
			return '/home/guest';
		case 'echo':
			return line.slice(4).trim();
		case 'date':
			return new Date().toString();
		case 'uname':
			return args.length ? 'Linux noamroger.fr 6.12.0 x86_64 GNU/Linux (allegedly)' : 'Linux';
		case 'history':
			return history.map((entry, i) => `${String(i + 1).padStart(4)}  ${entry}`).join('\n');
		case 'man':
			return `No manual entry${args[0] ? ` for ${args[0]}` : ''}. Try 'help'.`;
		case 'ping':
			return 'pong';

		case 'theme': {
			const wanted = args[0];
			if (wanted !== 'dark' && wanted !== 'light') return 'usage: theme <dark|light>';
			if (document.documentElement.dataset.theme === wanted) return `Already ${wanted}.`;
			document.querySelector<HTMLElement>('[data-theme-toggle]')?.click();
			return `Theme set to ${wanted}.`;
		}
		case 'lang': {
			const wanted = args[0];
			if (wanted !== 'fr' && wanted !== 'en') return 'usage: lang <fr|en>';
			if ((isEnglish() ? 'en' : 'fr') === wanted) return `Already in ${wanted === 'en' ? 'English' : 'French'}.`;
			write(LANGUAGE_KEY, wanted);
			shell.after(() => navigate(wanted === 'en' ? '/en/' : '/'));
			return `Switching to ${wanted === 'en' ? 'English' : 'French'} ...`;
		}
		case 'snow': {
			const wanted = args[0];
			if (wanted !== 'on' && wanted !== 'off') return 'usage: snow <on|off>';
			if (!setSnow(wanted === 'on')) return 'snow: no canvas available';
			return wanted === 'on' ? 'Let it snow. (Whatever the month.)' : 'Snow stopped.';
		}

		case 'neofetch':
			return [
				'guest@noamroger.fr',
				'------------------',
				'OS:       Astro (static build)',
				'Host:     Cloudflare Workers',
				'Kernel:   V8 isolate',
				`Uptime:   ${deployed ? `${age(deployed)} since last deploy` : 'unknown'}`,
				`Commit:   ${commit || 'unknown'}`,
				'Shell:    fake-zsh 0.2',
				`Theme:    ${document.documentElement.dataset.theme ?? 'dark'}`,
				'Homelab:  Proxmox, Docker, mesh VPN',
			].join('\n');
		case 'git':
			return `commit ${commit || 'unknown'} (HEAD -> main, origin/main)\nThe full log is public: https://github.com/noamroger/portfolio/commits/main`;
		case 'curl':
		case 'wget':
			return 'No network from this sandbox. From a real terminal: curl https://www.noamroger.fr';
		case 'coffee':
		case 'brew':
			return elevated ? brew() : "418 I'm a teapot";
		case 'make':
			if (args[0] !== 'coffee') return 'make: *** No targets specified and no makefile found.  Stop.';
			return elevated ? brew() : "make: *** [coffee] Error 418 (I'm a teapot)";
		case 'rm':
			if (elevated) return 'rm: even root does not get to delete a static site. It would be back on the next push anyway.';
			return args.some((arg) => arg.startsWith('-') && arg.includes('r'))
				? "rm: cannot remove '/': Read-only file system (it is a static site, but nice try)"
				: 'rm: Read-only file system';
		case 'vim':
		case 'vi':
		case 'nvim':
			inVim = true;
			return "-- INSERT --   (good luck. type ':q' to exit)";
		case 'nano':
		case 'emacs':
			return `${name}: not installed. There is vim, if you dare.`;
		case ':q':
		case ':q!':
		case ':wq':
			return 'Not in vim. For once.';
		case 'exit':
		case 'logout':
			// Out of the root shell first, out of the window next.
			if (isRoot()) {
				write(ROOT_KEY, '0');
				return 'logout\nBack to guest. sudo still works.';
			}
			shell.after(() => setWindow('closed'));
			return 'logout';

		case 'flags':
		case 'flag':
			return flagStatus();
		case 'unlock':
			// The original spelling, minus the command name.
			return unlock(line.slice(6).trim());

		default:
			return `zsh: command not found: ${line}. Type 'help' for available commands.`;
	}
}

/** Root finally fixes the coffee maker (for this visit). */
function brew(): string {
	const pod = pods[pods.length - 1];
	if (pod.status === 'Running') return 'Coffee is already brewing.';
	pod.status = 'Running';
	pod.ready = '1/1';
	pod.restarts = 0;
	pod.born = Date.now();
	return "Set COFFEE_MAKER_MODE=coffee, restarted the pod.\ncoffee-maker-api-0 is Running. It only took root.\n(The real /coffee endpoint is still a teapot. Some things cannot be fixed.)";
}

// --- The window (red, yellow and green lights) -------------------------------

type WindowState = 'open' | 'closed' | 'min' | 'max';

function setWindow(state: WindowState): void {
	const win = document.querySelector<HTMLElement>('[data-terminal-window]');
	if (!win) return;
	win.classList.toggle('is-closed', state === 'closed');
	win.classList.toggle('is-min', state === 'min');
	win.classList.toggle('is-max', state === 'max');
	const closed = win.querySelector<HTMLElement>('[data-terminal-closed]');
	if (closed) closed.hidden = state !== 'closed';
	if (state === 'closed') win.querySelector<HTMLElement>('[data-terminal-restart]')?.focus({ preventScroll: true });
}

function initTerminal(): void {
	const body = document.querySelector<HTMLElement>('[data-terminal]');
	if (!body || body.dataset.ready) return;

	const form = body.querySelector<HTMLFormElement>('[data-terminal-form]');
	const input = body.querySelector<HTMLInputElement>('[data-terminal-input]');
	const output = body.querySelector<HTMLElement>('[data-terminal-output]');
	if (!form || !input || !output) return;
	body.dataset.ready = 'true';

	// Build facts, written into the page at build time.
	commit = body.dataset.commit ?? '';
	const deployedAt = Date.parse(body.dataset.deployed ?? '');
	if (!Number.isNaN(deployedAt) && deployed === null) {
		deployed = deployedAt;
		pods[0].born = deployedAt;
	}

	// Position in the history while browsing it with the arrows; history.length
	// means "the line being typed", saved in draft.
	let cursor = history.length;
	let draft = '';

	const print = (className: string, text: string): HTMLElement => {
		const line = document.createElement('pre');
		line.className = className;
		line.textContent = text;
		output.append(line);
		return line;
	};

	const promptLabel = form.querySelector<HTMLElement>('label');
	const syncPrompt = () => {
		if (promptLabel) promptLabel.textContent = isRoot() ? ROOT_PROMPT : PROMPT;
	};
	syncPrompt();

	const echo = (text: string) => {
		const line = print('terminal-echo', '');
		const prompt = document.createElement('span');
		prompt.className = 't-prompt';
		prompt.textContent = isRoot() ? ROOT_PROMPT : PROMPT;
		line.append(prompt, ` ${text}`);
	};

	const scrollToEnd = () => {
		body.scrollTop = body.scrollHeight;
	};

	// From the first command on, the block keeps its size and scrolls instead
	// of pushing the page down.
	const freeze = () => {
		if (!body.style.maxHeight) body.style.maxHeight = `${body.offsetHeight}px`;
	};

	const clear = () => {
		output.replaceChildren();
		body.style.maxHeight = '';
	};

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		const raw = input.value;
		input.value = '';
		draft = '';

		freeze();
		echo(raw);

		if (raw.trim()) {
			if (history[history.length - 1] !== raw.trim()) history.push(raw.trim());
			let after: (() => void) | undefined;
			let link = '';
			const result = await run(raw, { after: (action) => (after = action), link: (href) => (link = href) });
			if (result === null) {
				clear();
			} else if (result) {
				// Tables keep their columns and scroll sideways; sentences wrap.
				print(result.includes('\n') ? 'terminal-out' : 'terminal-out terminal-wrap', result);
			}
			if (link) {
				const anchor = document.createElement('a');
				anchor.href = link;
				anchor.textContent = new URL(link, location.href).href;
				print('terminal-out terminal-wrap', '').append(anchor);
			}
			// Leave a beat to read the line before the page or the window goes.
			if (after) setTimeout(after, 350);
		}

		syncPrompt();
		cursor = history.length;
		scrollToEnd();
	});

	input.addEventListener('keydown', (event) => {
		if (event.key === 'Tab' && !event.shiftKey && input.value.trim()) {
			// An empty prompt lets Tab move on, so the keyboard is never trapped.
			event.preventDefault();
			input.value = complete(input.value);
			return;
		}

		if (event.ctrlKey && !event.metaKey && !event.altKey) {
			const key = event.key.toLowerCase();
			if (key === 'l') {
				event.preventDefault();
				clear();
				return;
			}
			// Ctrl+C with a selection stays a copy.
			if (key === 'c' && input.selectionStart === input.selectionEnd) {
				event.preventDefault();
				freeze();
				echo(`${input.value}^C`);
				input.value = '';
				inVim = false;
				cursor = history.length;
				scrollToEnd();
				return;
			}
		}

		if (event.key === 'Escape' && document.querySelector('[data-terminal-window].is-max')) {
			setWindow('open');
			return;
		}

		if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
		if (!history.length) return;
		event.preventDefault();

		if (cursor === history.length) draft = input.value;
		cursor = Math.max(0, Math.min(history.length, cursor + (event.key === 'ArrowUp' ? -1 : 1)));
		input.value = cursor === history.length ? draft : history[cursor];
		input.setSelectionRange(input.value.length, input.value.length);
	});

	// A click anywhere in the block lands in the prompt, unless it ends a text
	// selection (so the output can still be copied).
	body.addEventListener('click', () => {
		if (window.getSelection()?.isCollapsed === false) return;
		input.focus({ preventScroll: true });
	});

	// The three lights of the title bar do what they say, on this window only.
	const win = body.closest<HTMLElement>('[data-terminal-window]');
	win?.querySelector('.window-controls')?.addEventListener('click', (event) => {
		const light = (event.target as Element).closest('i');
		if (!light) return;
		const is = (state: string) => win.classList.contains(`is-${state}`);
		if (light.classList.contains('wc-close')) setWindow('closed');
		else if (light.classList.contains('wc-min')) setWindow(is('min') ? 'open' : 'min');
		else if (light.classList.contains('wc-max')) {
			setWindow(is('max') ? 'open' : 'max');
			if (is('max')) input.focus({ preventScroll: true });
		}
		scrollToEnd();
	});

	win?.querySelector('[data-terminal-restart]')?.addEventListener('click', () => {
		clear();
		inVim = false;
		setWindow('open');
		input.focus({ preventScroll: true });
	});
}

document.addEventListener('astro:page-load', initTerminal);
