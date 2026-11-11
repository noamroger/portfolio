/**
 * Easter egg for the browser console, in the language of the page. The
 * greeting is printed once per visit, in the language of the page that was
 * loaded; the `noam` object it points at answers in the language of the page
 * being looked at when it is called.
 */
const mono = 'font-family: monospace; font-size: 12px;';
const say = (text: string) => console.log(`%c${text}`, `${mono} color: #a1a1aa;`);

const fr = {
	hello: '[!] Tiens, un curieux dans les DevTools.',
	intro: "Tu ne trouveras pas de secrets ou de tokens qui traînent ici, mais le réflexe d'ouvrir la console fait plaisir à voir. Bonne visite !",
	next: 'Pour la suite : ',
	help: ['noam.contact()   comment me joindre', "noam.stack()     ce que j'utilise", 'noam.source()    le code de ce site', 'noam.hunt()      trois flags sont cachés sur le site'],
	contact: 'contact@noamroger.fr - alternance Master DevOps / Cloud, rentrée 2027.',
	stack: { Backend: 'Node.js, TypeScript, C', DevOps: 'Docker, Linux, CI/CD', 'En apprentissage': 'Kubernetes', 'Ce site': 'Astro, Cloudflare Workers' } as Record<string, string>,
	hunt: "Le point de départ est dans /humans.txt. Les flags se valident dans le terminal de la page d'accueil : unlock flag{...}",
};

const en: typeof fr = {
	hello: '[!] Well, someone curious in the DevTools.',
	intro: 'You will not find secrets or stray tokens here, but the reflex of opening the console is nice to see. Enjoy the visit!',
	next: 'What next: ',
	help: ['noam.contact()   how to reach me', 'noam.stack()     what I use', 'noam.source()    the code of this site', 'noam.hunt()      three flags are hidden on the site'],
	contact: "contact@noamroger.fr - work-study, DevOps / Cloud Master's, September 2027.",
	stack: { Backend: 'Node.js, TypeScript, C', DevOps: 'Docker, Linux, CI/CD', Learning: 'Kubernetes', 'This site': 'Astro, Cloudflare Workers' },
	hunt: 'It starts in /humans.txt. Flags are checked in the home page terminal: unlock flag{...}',
};

/** The dictionary of the page on screen right now. */
const t = () => (document.documentElement.lang === 'en' ? en : fr);

console.log(`%c${t().hello}`, 'color: #22c55e; font-family: monospace; font-size: 14px; font-weight: bold;');
say(t().intro);
console.log(`%c${t().next}%cnoam.help()`, `${mono} color: #a1a1aa;`, `${mono} color: #22c55e; font-weight: bold;`);

const noam = {
	help() {
		say(t().help.join('\n'));
	},
	contact() {
		say(t().contact);
		return 'contact@noamroger.fr';
	},
	stack() {
		console.table(t().stack);
	},
	source() {
		say('https://github.com/noamroger/portfolio');
		return 'https://github.com/noamroger/portfolio';
	},
	hunt() {
		say(t().hunt);
	},
};

Object.defineProperty(window, 'noam', { value: Object.freeze(noam), configurable: true });
