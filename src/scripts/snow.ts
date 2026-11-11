/**
 * December snowfall: a tiny canvas engine and an on/off button.
 *
 * Only runs in December (local date, read once on load): the rest of the year
 * nothing is created. Works in both themes; only the flake colour changes, set
 * in CSS on the canvas and re-read on every theme change. No inline styles, so it stays within
 * a strict CSP: JS only sets the canvas width/height attributes, everything else
 * is a class styled in src/styles/snow.css.
 *
 * The client router replaces <body> on every navigation, so the canvas and the
 * button are re-attached after each swap and the animation keeps running.
 */
import { SNOW_KEY, SNOW_PREVIEW_KEY } from '../i18n/preference';

const labels = {
	fr: { turnOff: 'Désactiver la neige', turnOn: 'Activer la neige' },
	en: { turnOff: 'Turn off the snow', turnOn: 'Turn on the snow' },
} as const;

const FADE_MS = 400;

interface Flake {
	x: number;
	y: number;
	r: number;
	speed: number;
	sway: number;
	freq: number;
	phase: number;
	alpha: number;
}

// TEMPORARY: preview outside December. ?snow=true keeps the snow on for the rest
// of the tab session (even after navigating), ?snow=false clears it. Remove this
// function and its call once the feature has been checked.
function isPreviewEnabled(): boolean {
	try {
		const param = new URLSearchParams(location.search).get('snow');
		if (param === 'true') sessionStorage.setItem(SNOW_PREVIEW_KEY, '1');
		if (param === 'false') sessionStorage.removeItem(SNOW_PREVIEW_KEY);
		return sessionStorage.getItem(SNOW_PREVIEW_KEY) === '1';
	} catch {
		return false;
	}
}

const inSeason = new Date().getMonth() === 11 || isPreviewEnabled();

if (inSeason) initSnow();

function initSnow() {
	const root = document.documentElement;
	const darkQuery = matchMedia('(prefers-color-scheme: dark)');
	const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

	// --- Preference -----------------------------------------------------------

	// Kept for the page too, in case localStorage is blocked (private browsing).
	let memoryChoice: 'on' | 'off' | null = null;

	const readChoice = (): 'on' | 'off' | null => {
		try {
			const stored = localStorage.getItem(SNOW_KEY);
			if (stored === 'on' || stored === 'off') return stored;
		} catch {
			// Storage blocked: fall back to the in-page choice.
		}
		return memoryChoice;
	};

	const writeChoice = (choice: 'on' | 'off') => {
		memoryChoice = choice;
		try {
			localStorage.setItem(SNOW_KEY, choice);
		} catch {
			// Storage blocked: the choice holds for this page.
		}
	};

	const wantsSnow = () => {
		const choice = readChoice();
		if (choice) return choice === 'on';
		return !reducedMotionQuery.matches;
	};

	// --- Elements -------------------------------------------------------------

	const canvas = document.createElement('canvas');
	canvas.className = 'snow-canvas';
	canvas.setAttribute('aria-hidden', 'true');
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'snow-toggle';
	button.innerHTML =
		'<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
		'<line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/>' +
		'<path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>' +
		'</svg><span class="snow-toggle-slash" aria-hidden="true"></span>';

	const attach = () => {
		document.body.append(canvas, button);
	};

	// --- Engine ---------------------------------------------------------------

	let flakes: Flake[] = [];
	let width = 0;
	let height = 0;
	let color = '#ffffff';
	let frame = 0;
	let last = 0;
	let running = false;

	const makeFlake = (spread: boolean): Flake => {
		const r = 0.8 + Math.random() ** 2.2 * 2.6;
		return {
			x: Math.random() * width,
			y: spread ? Math.random() * height : -r - Math.random() * 40,
			r,
			speed: 18 + r * 16 + Math.random() * 10,
			sway: 8 + Math.random() * 18,
			freq: 0.4 + Math.random() * 0.8,
			phase: Math.random() * Math.PI * 2,
			alpha: 0.45 + Math.random() * 0.5,
		};
	};

	const resize = () => {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const count = Math.min(140, Math.max(24, Math.round((width * height) / 12000)));
		while (flakes.length < count) flakes.push(makeFlake(true));
		if (flakes.length > count) flakes.length = count;
	};

	const tick = (now: number) => {
		const dt = Math.min((now - last) / 1000, 0.05);
		last = now;
		const t = now / 1000;

		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = color;
		for (const flake of flakes) {
			flake.y += flake.speed * dt;
			flake.x += Math.cos(t * flake.freq + flake.phase) * flake.sway * dt;

			if (flake.y - flake.r > height) {
				flake.y = -flake.r - Math.random() * 40;
				flake.x = Math.random() * width;
			}
			if (flake.x < -flake.r) flake.x += width + 2 * flake.r;
			else if (flake.x > width + flake.r) flake.x -= width + 2 * flake.r;

			ctx.globalAlpha = flake.alpha;
			ctx.beginPath();
			ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;

		frame = requestAnimationFrame(tick);
	};

	const readColor = () => {
		color = getComputedStyle(canvas).color || '#ffffff';
	};

	const start = () => {
		if (running) return;
		running = true;
		resize();
		readColor();
		last = performance.now();
		frame = requestAnimationFrame(tick);
	};

	const stop = () => {
		running = false;
		cancelAnimationFrame(frame);
		ctx.clearRect(0, 0, width, height);
	};

	// --- On / off with a fade -------------------------------------------------

	let stopTimer = 0;
	let showFrame = 0;

	const turnOn = () => {
		clearTimeout(stopTimer);
		start();
		// Next frame, so the opacity transition actually plays.
		cancelAnimationFrame(showFrame);
		showFrame = requestAnimationFrame(() => canvas.classList.add('is-on'));
	};

	const turnOff = () => {
		cancelAnimationFrame(showFrame);
		if (!running) return;
		canvas.classList.remove('is-on');
		clearTimeout(stopTimer);
		stopTimer = window.setTimeout(stop, FADE_MS);
	};

	const syncButton = (on: boolean) => {
		const locale = root.lang === 'en' ? 'en' : 'fr';
		const label = on ? labels[locale].turnOff : labels[locale].turnOn;
		button.setAttribute('aria-pressed', String(on));
		button.setAttribute('aria-label', label);
		button.title = label;
	};

	let snowing: boolean | null = null;

	const update = () => {
		const on = wantsSnow();
		syncButton(on);
		if (on === snowing) return;
		snowing = on;
		if (on) turnOn();
		else turnOff();
	};

	button.addEventListener('click', () => {
		writeChoice(wantsSnow() ? 'off' : 'on');
		update();
	});

	window.addEventListener('resize', () => {
		if (running) resize();
	});

	// Theme change: new flake colour, the animation keeps running.
	new MutationObserver(readColor).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
	darkQuery.addEventListener('change', readColor);
	reducedMotionQuery.addEventListener('change', update);

	// New <body>, and maybe a new language: re-attach and relabel.
	document.addEventListener('astro:after-swap', () => {
		attach();
		update();
	});

	attach();
	update();
}
