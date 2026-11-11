/**
 * Interactive prompt under the home page YAML block.
 *
 * A tiny fake shell: a handful of hard-coded commands, a history recalled with
 * the arrow keys, no dependency. Everything it prints is English, whatever the
 * page language. Output is always written with textContent, never as HTML.
 *
 * The client router swaps <body> on navigation, so the prompt is wired again on
 * every astro:page-load.
 */
const PROMPT = 'guest@noamroger.fr:~$';

const HELP = `Available commands:
  kubectl get pods    Inspect running cluster pods
  whoami              Print current session context
  clear               Clear terminal buffer`;

const PODS = `NAME                                   READY   STATUS             RESTARTS   AGE
portfolio-frontend-7f9b8c6d4-2x9la     1/1     Running            0          42d
homelab-sync-daemon-5d8f7b9c1-k8v2z    1/1     Running            0          12d
coffee-maker-api-0                     0/1     CrashLoopBackOff   1337       2h`;

// Kept across page navigations, like a shell session.
const history: string[] = [];

/** Returns the text to print, or null when the buffer must be cleared. */
function run(raw: string): string | null {
	const command = raw.trim().toLowerCase().replace(/\s+/g, ' ');

	if (command === 'sudo' || command.startsWith('sudo ')) {
		return 'guest is not in the sudoers file. This incident will be reported.';
	}

	switch (command) {
		case 'help':
			return HELP;
		case 'kubectl get pods':
			return PODS;
		case 'whoami':
			return 'guest - feel free to reach out at contact@noamroger.fr';
		case 'clear':
			return null;
		default:
			return `zsh: command not found: ${raw.trim()}. Type 'help' for available commands.`;
	}
}

function initTerminal(): void {
	const body = document.querySelector<HTMLElement>('[data-terminal]');
	if (!body || body.dataset.ready) return;

	const form = body.querySelector<HTMLFormElement>('[data-terminal-form]');
	const input = body.querySelector<HTMLInputElement>('[data-terminal-input]');
	const output = body.querySelector<HTMLElement>('[data-terminal-output]');
	if (!form || !input || !output) return;
	body.dataset.ready = 'true';

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

	const scrollToEnd = () => {
		body.scrollTop = body.scrollHeight;
	};

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const raw = input.value;
		input.value = '';
		draft = '';

		// From the first command on, the block keeps its size and scrolls
		// instead of pushing the page down.
		if (!body.style.maxHeight) body.style.maxHeight = `${body.offsetHeight}px`;

		const echo = print('terminal-echo', '');
		const prompt = document.createElement('span');
		prompt.className = 't-prompt';
		prompt.textContent = PROMPT;
		echo.append(prompt, ` ${raw}`);

		if (raw.trim()) {
			if (history[history.length - 1] !== raw.trim()) history.push(raw.trim());
			const result = run(raw);
			if (result === null) {
				output.replaceChildren();
				body.style.maxHeight = '';
			} else {
				// Tables keep their columns and scroll sideways; sentences wrap.
				print(result.includes('\n') ? 'terminal-out' : 'terminal-out terminal-wrap', result);
			}
		}

		cursor = history.length;
		scrollToEnd();
	});

	input.addEventListener('keydown', (event) => {
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
}

document.addEventListener('astro:page-load', initTerminal);
