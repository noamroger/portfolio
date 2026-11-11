/**
 * Easter egg for the browser console. In French on every page, by design.
 * The greeting points at a small `noam` object to play with.
 */
const mono = 'font-family: monospace; font-size: 12px;';
const say = (text: string) => console.log(`%c${text}`, `${mono} color: #a1a1aa;`);

console.log(
	'%c[!] Tiens, un curieux dans les DevTools.',
	'color: #22c55e; font-family: monospace; font-size: 14px; font-weight: bold;',
);
say("Tu ne trouveras pas de secrets ou de tokens qui traînent ici, mais le réflexe d'ouvrir la console fait plaisir à voir. Bonne visite !");
console.log('%cPour la suite : %cnoam.help()', `${mono} color: #a1a1aa;`, `${mono} color: #22c55e; font-weight: bold;`);

const noam = {
	help() {
		say(
			[
				'noam.contact()   comment me joindre',
				'noam.stack()     ce que j\'utilise',
				'noam.source()    le code de ce site',
				'noam.hunt()      trois flags sont cachés sur le site',
			].join('\n'),
		);
	},
	contact() {
		say('contact@noamroger.fr - alternance Master DevOps / Cloud, rentrée 2027.');
		return 'contact@noamroger.fr';
	},
	stack() {
		console.table({
			Backend: 'Node.js, TypeScript, C',
			DevOps: 'Docker, Linux, CI/CD',
			'En apprentissage': 'Kubernetes',
			'Ce site': 'Astro, Cloudflare Workers',
		});
	},
	source() {
		say('https://github.com/noamroger/portfolio');
		return 'https://github.com/noamroger/portfolio';
	},
	hunt() {
		say("Le point de départ est dans /humans.txt. Les flags se valident dans le terminal de la page d'accueil : unlock flag{...}");
	},
};

Object.defineProperty(window, 'noam', { value: Object.freeze(noam), configurable: true });
