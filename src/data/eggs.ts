import type { Locale } from '../i18n';

/**
 * Every easter egg of the site, spelled out: the content of /ruinthefun, the
 * page the `ruinthefun` command of the home page terminal links to. Flags
 * included, on purpose. Update it when an easter egg is added or changed.
 */
export interface EggSection {
	/** Shown in the title bar of the card, like a file name. */
	file: string;
	title: string;
	intro?: string;
	/** What to type or do, and what happens. */
	rows: [string, string][];
	notes?: string[];
}

interface EggPage {
	metaTitle: string;
	metaDescription: string;
	eyebrow: string;
	heading: string;
	subtitle: string;
	columns: [string, string];
	sections: EggSection[];
}

const fr: EggPage = {
	metaTitle: 'Liste des easter eggs | Noam Roger',
	metaDescription: 'Tous les easter eggs du site noamroger.fr, pour ceux qui n’aiment pas jouer.',
	eyebrow: 'ruinthefun',
	heading: 'Liste des easter eggs pour ceux qui n’aiment pas jouer.',
	subtitle: 'Tout ce qui est caché sur ce site, flags compris. Dernier avertissement : chercher soi-même est plus drôle.',
	columns: ['Quoi', 'Ce qui se passe'],
	sections: [
		{
			file: 'terminal.md',
			title: 'Le terminal de l’accueil',
			intro: 'Le terminal de la page d’accueil est un vrai prompt. Il répond en anglais, et help ne liste qu’une partie des commandes.',
			rows: [
				['kubectl get pods', 'Liste les pods. L’âge de portfolio-frontend est celui du dernier déploiement, et le compteur RESTARTS de coffee-maker-api-0 monte de 1 à chaque visite.'],
				['kubectl logs <pod>', 'Logs du pod. Ceux du frontend citent /wp-admin et /.env, ceux du coffee-maker renvoient vers /coffee.'],
				['kubectl describe pod <pod>', 'Détail du pod, avec Exit Code 418 pour le coffee-maker.'],
				['kubectl delete pod <pod>', 'Le pod renaît avec un nouveau suffixe, comme avec un ReplicaSet. Le coffee-maker garde son nom et repart à 0 restart.'],
				['k …', 'Alias de kubectl.'],
				['kubectl get developer', 'Une ligne sur moi.'],
				['kubectl get nodes, apply, exec…', 'Refus Forbidden pour l’utilisateur guest.'],
				['ls, ls -a', 'Liste les pages et les fichiers. Avec -a, un .env apparaît.'],
				['cat humans.txt, cat robots.txt', 'Lit les vrais fichiers du site.'],
				['cat .env', 'Permission denied.'],
				['cd about, cd projects, cd contact', 'Ouvre la page.'],
				['theme dark, theme light', 'Change le thème.'],
				['lang fr, lang en', 'Change la langue.'],
				['snow on, snow off', 'Fait neiger, même hors décembre.'],
				['shortcuts on, shortcuts off', 'Active ou coupe les raccourcis clavier du site. Le choix est gardé dans le navigateur.'],
				['neofetch', 'Fiche du site : hébergement, commit, temps depuis le dernier déploiement, thème.'],
				['git log', 'Le commit en ligne et un lien vers l’historique.'],
				['vim, vi, nvim', 'On reste coincé en -- INSERT -- jusqu’à :q, :q!, :wq ou Ctrl+C.'],
				['nano, emacs', 'Non installés.'],
				['rm -rf /', 'Read-only file system.'],
				['sudo …, su', 'Refusé tant que les trois flags ne sont pas trouvés.'],
				['coffee, brew, make coffee', 'Erreur 418.'],
				['curl, wget', 'Invite à lancer curl depuis un vrai terminal.'],
				['exit, logout', 'Ferme la fenêtre du terminal.'],
				['history, pwd, echo, date, uname, man, ping, whoami', 'Réponses courtes.'],
				['ruinthefun', 'Le lien vers cette page.'],
				['reset, reset confirm', 'Efface ce que le site garde dans le navigateur : thème, neige, raccourcis, flags, certificat et accès root. reset explique, reset confirm exécute.'],
			],
		},
		{
			file: 'keys.md',
			title: 'Clavier et fenêtre du terminal',
			rows: [
				['Tab', 'Complète la commande.'],
				['Ctrl+L', 'Vide l’écran.'],
				['Ctrl+C', 'Annule la ligne en affichant ^C, et sort de vim.'],
				['↑ / ↓', 'Parcourt l’historique.'],
				['Pastille rouge', 'Ferme le terminal : [Process completed] et un bouton pour le relancer.'],
				['Pastille jaune', 'Réduit la fenêtre à sa barre de titre.'],
				['Pastille verte', 'Agrandit le terminal en plein écran. Échap le restaure.'],
			],
		},
		{
			file: '404.md',
			title: 'Les 404 piégées',
			intro: 'Les adresses que testent les scanners affichent « Bien tenté. » et un terminal adapté. Le statut reste 404.',
			rows: [
				['/.env', 'cat .env, puis Permission denied.'],
				['/.git, /.git/config', 'Un git clone du dépôt, qui est public.'],
				['/wp-admin, /wp-login.php, /xmlrpc.php', 'systemctl status wordpress : service introuvable.'],
				['/phpmyadmin, /pma, /adminer, /mysql', 'Rien n’écoute sur le port 3306.'],
				['/admin, /login, /dashboard, /cpanel', 'sudo -i refusé.'],
				['/etc/passwd, /.ssh, /.aws, /id_rsa, /.htaccess, /backup…', 'Permission denied.'],
			],
		},
		{
			file: 'shortcuts.md',
			title: 'Raccourcis clavier',
			intro: 'Sur toutes les pages, hors saisie dans un champ.',
			rows: [
				['?', 'Ouvre l’aide des raccourcis.'],
				['g puis h, a, p, c', 'Accueil, à propos, projets, contact.'],
				['/', 'Met le curseur dans le terminal de l’accueil.'],
				['t', 'Change le thème.'],
				['l', 'Change de langue.'],
				['shortcuts off (terminal)', 'Coupe tous ces raccourcis. shortcuts on les rétablit.'],
			],
		},
		{
			file: 'details.md',
			title: 'Détails dans les pages',
			rows: [
				['Onglet en arrière-plan', 'Le titre devient « [1]+ Stopped noamroger.fr ».'],
				['Footer', 'Le SHA du commit en ligne, lié au commit sur GitHub.'],
				['Afficher la source', 'Un commentaire en tête de chaque page, avec un flag.'],
				['Console des DevTools', 'Un message d’accueil, puis noam.help(), noam.contact(), noam.stack(), noam.source() et noam.hunt().'],
				['Bouton Démo de la carte « Ce portfolio »', 'Un message moqueur pendant quelques secondes, puis le bouton reste désactivé jusqu’au rechargement de la page.'],
				['Pastilles des fenêtres', 'Leurs symboles apparaissent au survol, comme sur macOS.'],
				['Décembre', 'Il neige, avec un bouton pour couper.'],
			],
		},
		{
			file: 'curl.md',
			title: 'Depuis un terminal',
			rows: [
				['curl https://www.noamroger.fr', 'Mon profil en texte coloré au lieu du HTML. noamroger.dev pour l’anglais.'],
				['curl -sI https://www.noamroger.fr', 'Les en-têtes X-Hiring et X-Flag.'],
				['curl https://www.noamroger.fr/healthz', 'ok'],
				['curl https://www.noamroger.fr/version', 'Le commit en ligne et ses dates, en JSON.'],
				['curl https://www.noamroger.fr/metrics', 'Des métriques au format Prometheus.'],
				['curl -i https://www.noamroger.fr/coffee', '418 I’m a teapot, avec un flag.'],
				['/robots.txt', 'Renvoie vers /humans.txt.'],
				['/humans.txt', 'Annonce la chasse aux flags et donne le premier indice.'],
				['/.well-known/security.txt', 'Comment signaler un problème de sécurité.'],
				['dig TXT noamroger.fr +short', 'Le flag bonus.'],
			],
		},
		{
			file: 'flags.md',
			title: 'La chasse aux flags',
			intro: 'Le départ est dans /humans.txt. Chaque flag se valide dans le terminal avec unlock flag{…}, et flags affiche la progression.',
			rows: [
				['flag{curl_dash_i_is_a_reflex}', 'Flag 1 : dans l’en-tête HTTP X-Flag de toutes les réponses.'],
				['flag{view_source_never_dies}', 'Flag 2 : dans le commentaire en tête du code source.'],
				['flag{rfc_2324_compliant}', 'Flag 3 : dans la réponse de /coffee.'],
				['flag{dig_txt_and_you_shall_find}', 'Bonus : dans un enregistrement DNS TXT de noamroger.fr.'],
			],
		},
		{
			file: 'root.md',
			title: 'La récompense : le shell root',
			intro: 'Les trois flags trouvés, le terminal affiche un certificat « Certified curious » et sudo se met à fonctionner.',
			rows: [
				['sudo -i, sudo su, su', 'Ouvre un shell root : le prompt devient root@noamroger.fr:~#.'],
				['sudo <commande>', 'Lance une seule commande en root.'],
				['ls', 'Trois fichiers de plus : certificate.txt, cv.txt et private-key.pem.'],
				['cat private-key.pem', 'Une clé privée RSA dont le contenu est 4.'],
				['cat cv.txt', 'Mon profil complet en texte.'],
				['certificate', 'Réaffiche le certificat.'],
				['cat .env', 'COFFEE_MAKER_MODE=teapot, ce qui explique le pod en panne.'],
				['kubectl get secrets', 'Un secret recruiter-note, à lire avec kubectl get secret recruiter-note.'],
				['make coffee', 'Répare enfin le pod : coffee-maker-api-0 passe en Running.'],
				['rm -rf /', 'Même root n’a pas le droit.'],
				['exit', 'Revient en guest.'],
				['Flag bonus', 'Le rang du certificat passe de root à cluster-admin.'],
			],
		},
	],
};

const en: EggPage = {
	metaTitle: 'List of easter eggs | Noam Roger',
	metaDescription: 'Every easter egg of noamroger.dev, for those who do not like to play.',
	eyebrow: 'ruinthefun',
	heading: 'List of easter eggs for those who do not like to play.',
	subtitle: 'Everything hidden on this site, flags included. Last warning: finding them yourself is more fun.',
	columns: ['What', 'What happens'],
	sections: [
		{
			file: 'terminal.md',
			title: 'The home page terminal',
			intro: 'The terminal on the home page is a real prompt, and help only lists part of its commands.',
			rows: [
				['kubectl get pods', 'Lists the pods. The age of portfolio-frontend is the age of the last deployment, and the RESTARTS counter of coffee-maker-api-0 goes up by one on every visit.'],
				['kubectl logs <pod>', 'Logs of the pod. The frontend ones mention /wp-admin and /.env, the coffee maker ones point to /coffee.'],
				['kubectl describe pod <pod>', 'Details of the pod, with Exit Code 418 for the coffee maker.'],
				['kubectl delete pod <pod>', 'The pod comes back under a new suffix, as with a ReplicaSet. The coffee maker keeps its name and restarts from 0.'],
				['k …', 'Alias of kubectl.'],
				['kubectl get developer', 'One line about me.'],
				['kubectl get nodes, apply, exec…', 'Forbidden for the guest user.'],
				['ls, ls -a', 'Lists the pages and files. With -a, a .env shows up.'],
				['cat humans.txt, cat robots.txt', 'Reads the real files of the site.'],
				['cat .env', 'Permission denied.'],
				['cd about, cd projects, cd contact', 'Opens the page.'],
				['theme dark, theme light', 'Switches the theme.'],
				['lang fr, lang en', 'Switches the language.'],
				['snow on, snow off', 'Makes it snow, even outside December.'],
				['shortcuts on, shortcuts off', 'Turns the keyboard shortcuts of the site on or off. The choice is kept in the browser.'],
				['neofetch', 'A card about the site: hosting, commit, time since the last deployment, theme.'],
				['git log', 'The commit that is live and a link to the history.'],
				['vim, vi, nvim', 'You are stuck in -- INSERT -- until :q, :q!, :wq or Ctrl+C.'],
				['nano, emacs', 'Not installed.'],
				['rm -rf /', 'Read-only file system.'],
				['sudo …, su', 'Denied until the three flags are found.'],
				['coffee, brew, make coffee', 'Error 418.'],
				['curl, wget', 'Tells you to run curl from a real terminal.'],
				['exit, logout', 'Closes the terminal window.'],
				['history, pwd, echo, date, uname, man, ping, whoami', 'Short answers.'],
				['ruinthefun', 'The link to this page.'],
				['reset, reset confirm', 'Erases what the site keeps in the browser: theme, snow, shortcuts, flags, certificate and root access. reset explains, reset confirm does it.'],
			],
		},
		{
			file: 'keys.md',
			title: 'Terminal keys and window',
			rows: [
				['Tab', 'Completes the command.'],
				['Ctrl+L', 'Clears the screen.'],
				['Ctrl+C', 'Cancels the line with ^C, and gets you out of vim.'],
				['↑ / ↓', 'Browses the history.'],
				['Red light', 'Closes the terminal: [Process completed] and a button to restart it.'],
				['Yellow light', 'Minimises the window to its title bar.'],
				['Green light', 'Makes the terminal full screen. Esc restores it.'],
			],
		},
		{
			file: '404.md',
			title: 'The trapped 404s',
			intro: 'The addresses scanners try answer “Nice try.” with a matching terminal. The status stays 404.',
			rows: [
				['/.env', 'cat .env, then Permission denied.'],
				['/.git, /.git/config', 'A git clone of the repository, which is public.'],
				['/wp-admin, /wp-login.php, /xmlrpc.php', 'systemctl status wordpress: unit not found.'],
				['/phpmyadmin, /pma, /adminer, /mysql', 'Nothing is listening on port 3306.'],
				['/admin, /login, /dashboard, /cpanel', 'sudo -i denied.'],
				['/etc/passwd, /.ssh, /.aws, /id_rsa, /.htaccess, /backup…', 'Permission denied.'],
			],
		},
		{
			file: 'shortcuts.md',
			title: 'Keyboard shortcuts',
			intro: 'On every page, except while typing in a field.',
			rows: [
				['?', 'Opens the shortcut help.'],
				['g then h, a, p, c', 'Home, about, projects, contact.'],
				['/', 'Puts the cursor in the home page terminal.'],
				['t', 'Toggles the theme.'],
				['l', 'Switches the language.'],
				['shortcuts off (terminal)', 'Turns all of these off. shortcuts on brings them back.'],
			],
		},
		{
			file: 'details.md',
			title: 'Details in the pages',
			rows: [
				['Tab in the background', 'The title becomes “[1]+ Stopped noamroger.dev”.'],
				['Footer', 'The SHA of the commit that is live, linked to the commit on GitHub.'],
				['View source', 'A comment at the top of every page, with a flag.'],
				['DevTools console', 'A greeting, then noam.help(), noam.contact(), noam.stack(), noam.source() and noam.hunt().'],
				['Demo button of the “This portfolio” card', 'A teasing message for a few seconds, then the button stays disabled until the page is reloaded.'],
				['Window lights', 'Their glyphs show up on hover, as on macOS.'],
				['December', 'It snows, with a button to turn it off.'],
			],
		},
		{
			file: 'curl.md',
			title: 'From a terminal',
			rows: [
				['curl https://noamroger.dev', 'My profile as coloured text instead of HTML.'],
				['curl -sI https://noamroger.dev', 'The X-Hiring and X-Flag headers.'],
				['curl https://noamroger.dev/healthz', 'ok'],
				['curl https://noamroger.dev/version', 'The commit that is live and its dates, as JSON.'],
				['curl https://noamroger.dev/metrics', 'Metrics in the Prometheus format.'],
				['curl -i https://noamroger.dev/coffee', '418 I’m a teapot, with a flag.'],
				['/robots.txt', 'Points to /humans.txt.'],
				['/humans.txt', 'Announces the flag hunt and gives the first hint.'],
				['/.well-known/security.txt', 'How to report a security issue.'],
				['dig TXT noamroger.fr +short', 'The bonus flag.'],
			],
		},
		{
			file: 'flags.md',
			title: 'The flag hunt',
			intro: 'It starts in /humans.txt. Each flag is checked in the terminal with unlock flag{…}, and flags shows the progress.',
			rows: [
				['flag{curl_dash_i_is_a_reflex}', 'Flag 1: in the X-Flag HTTP header of every response.'],
				['flag{view_source_never_dies}', 'Flag 2: in the comment at the top of the page source.'],
				['flag{rfc_2324_compliant}', 'Flag 3: in the response of /coffee.'],
				['flag{dig_txt_and_you_shall_find}', 'Bonus: in a DNS TXT record of noamroger.fr.'],
			],
		},
		{
			file: 'root.md',
			title: 'The reward: a root shell',
			intro: 'Once the three flags are found, the terminal prints a “Certified curious” certificate and sudo starts working.',
			rows: [
				['sudo -i, sudo su, su', 'Opens a root shell: the prompt becomes root@noamroger.dev:~#.'],
				['sudo <command>', 'Runs a single command as root.'],
				['ls', 'Three more files: certificate.txt, cv.txt and private-key.pem.'],
				['cat private-key.pem', 'An RSA private key whose content is 4.'],
				['cat cv.txt', 'My full profile as text.'],
				['certificate', 'Prints the certificate again.'],
				['cat .env', 'COFFEE_MAKER_MODE=teapot, which explains the crashing pod.'],
				['kubectl get secrets', 'A recruiter-note secret, read with kubectl get secret recruiter-note.'],
				['make coffee', 'Fixes the pod at last: coffee-maker-api-0 goes Running.'],
				['rm -rf /', 'Not even root may.'],
				['exit', 'Back to guest.'],
				['Bonus flag', 'The rank on the certificate goes from root to cluster-admin.'],
			],
		},
	],
};

export const eggs: Record<Locale, EggPage> = { fr, en };
