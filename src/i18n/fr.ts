import type { Translations } from './en';

const fr: Translations = {
	htmlLang: 'fr',
	meta: {
		description: 'Portfolio de Noam Roger - Développeur backend',
		jobTitle: 'Développeur backend',
		ogLocale: 'fr_FR',
		ogLocaleAlternate: 'en_US',
		ogImageAlt: 'Noam Roger, développeur backend - logo du site',
	},
	a11y: {
		skipToContent: 'Aller au contenu',
	},
	nav: {
		logoLabel: "Noam Roger - retour à l'accueil",
		switchLanguage: 'Voir cette page en anglais',
		home: 'Accueil',
		about: 'À propos',
		projects: 'Projets',
		contact: 'Contact',
	},
	footer: {
		rights: 'Tous droits réservés.',
	},
	home: {
		metaTitle: 'Noam Roger | Développeur backend - API et systèmes fiables',
		metaDescription:
			'Noam Roger, développeur backend basé au Mans. API robustes, systèmes capables de monter en charge et architectures propres.',
		greeting: 'Bonjour, je suis',
		typingTexts: ['Développeur backend', "Architecte d'API", 'Concepteur de systèmes', 'Résolveur de problèmes'],
		description:
			"Spécialisé dans la conception d'architectures robustes et performantes. Je transforme les idées complexes en solutions élégantes.",
		ctaProjects: 'Voir mes projets',
		ctaContact: 'Me contacter',
		code: {
			role: 'Dev Backend',
			passion: 'Code propre',
			returns: 'Des trucs cool',
		},
		featuredTitle: 'Projets à la une',
		featuredIntro:
			"Quelques réalisations, de l'agent IA au jeu multijoueur écrit en C. Chacune est open source et le code est sur GitHub.",
		featuredCta: 'Voir tous les projets',
		featuredStackTitle: 'Ce avec quoi je construis',
		featuredStackIntro:
			"Les langages, bases de données et outils que j'utilise au quotidien, côté serveur comme autour.",
		skillsTitle: 'Compétences en développement backend',
		skills: [
			{ title: 'Performance', description: "Optimisation des requêtes, mise en cache et passage à l'échelle" },
			{ title: 'Sécurité', description: 'Authentification, autorisation et protection des données' },
			{ title: 'Architecture', description: 'Design patterns, microservices et systèmes distribués' },
			{ title: 'Tests', description: "Tests unitaires, tests d'intégration et TDD" },
		],
	},
	about: {
		metaTitle: 'À propos de Noam Roger | Développeur backend au Mans',
		metaDescription:
			"Découvrez Noam Roger, développeur backend : son parcours, sa philosophie d'ingénierie et les technologies qu'il utilise.",
		heading: 'À propos de Noam Roger, développeur backend',
		subtitle: 'Développeur backend passionné par le code propre et les architectures solides',
		journeyTitle: 'Mon parcours de développeur backend',
		journey: [
			"Développeur backend avec plusieurs années d'expérience, je suis spécialisé dans la création d'API robustes et de systèmes capables de monter en charge. Ma passion pour le code propre et les bonnes pratiques me pousse à progresser en permanence.",
			"J'aime m'attaquer aux défis techniques complexes et transformer les problèmes en solutions élégantes. Mon approche allie rigueur technique et créativité pour innover.",
		],
		philosophyTitle: 'Ma philosophie',
		philosophy: [
			'Le code doit être lisible et maintenable',
			'La simplicité avant la complexité',
			'Les tests sont essentiels à la qualité',
			"L'apprentissage continu est indispensable",
		],
		infoTitle: 'Informations',
		infoName: 'Nom',
		infoLocation: 'Localisation',
		infoLocationValue: 'Le Mans (France)',
		infoAvailability: 'Disponibilité',
		infoAvailabilityValue: 'Ouvert aux opportunités',
		techTitle: 'Technologies et outils',
	},
	projects: {
		metaTitle: 'Projets | API, bots Discord et systèmes backend - Noam Roger',
		metaDescription:
			'Une sélection des projets backend de Noam Roger : agents IA, bots Discord, bases de serveur web et programmation multijoueur en C.',
		heading: 'Mes projets de développement backend',
		subtitle: 'Une sélection de mes travaux et contributions',
		codeLink: 'Code',
		demoLink: 'Démo',
		items: {
			californyan: {
				imageAlt: "Interface de Californyan : un réceptionniste d'hôtel propulsé par l'IA répondant à un client",
				title: 'Californyan',
				description:
					"Un réceptionniste d'hôtel propulsé par l'IA, réalisé pour les 24 Heures du Code 2025 (organisées par la CCI du Mans). Une belle introduction aux agents à l'ère de l'IA.",
				tech: ['Node.js', 'IA', 'LangChain', 'API'],
			},
			webserver: {
				imageAlt: "Base de serveur web Node.js et Express, code source du projet de départ",
				title: 'Base de serveur web',
				description:
					"La fondation du projet des 24h du Code 2024 (organisées par le lycée Réaumur à Laval). Elle m'a servi de base pour mes différents projets pendant près d'un an.",
				tech: ['Node.js', 'Express', 'JavaScript'],
			},
			romaybot: {
				imageAlt: "Romaybot : fiche de carte à collectionner du bot Twitch et Discord",
				title: 'Romaybot',
				description:
					"Un système de collection de cartes fictives (parodie de Pokémon). Réalisé dans le cadre d'une commande rémunérée comprenant un bot Twitch, un bot Discord et un site web présentant ces cartes.",
				tech: ['Node.js', 'Discord.js', 'Twitch', 'MySQL'],
			},
			codenames: {
				imageAlt: "Codenames multijoueur écrit en C, plateau de jeu vu par un joueur",
				title: 'Codenames',
				description:
					"Une adaptation multijoueur du jeu de société Codenames en langage C, réalisée dans le cadre d'un projet universitaire, à quatre.",
				tech: ['C', 'Socket', 'Réseau', 'Multijoueur'],
			},
			webserverTs: {
				imageAlt: "Base de serveur web TypeScript avec frontend et backend séparés",
				title: 'Base de serveur web avancée',
				description:
					"Une base avancée avec un frontend et un backend séparés, tous deux développés en TypeScript. Une fondation solide reflétant mes compétences de 2026, encore en développement pour mes futurs projets.",
				tech: ['TypeScript', 'React', 'Node.js', 'Express'],
			},
			gaulia: {
				imageAlt: "Gaulia Musique, un bot Discord jouant de la musique dans un salon vocal",
				title: 'Gaulia Musique',
				description:
					"Un bot Discord permettant d'écouter de la musique dans les salons vocaux. Il a été ajouté à plus de 800 serveurs, mais n'est plus maintenu aujourd'hui.",
				tech: ['Node.js', 'Discord.js', 'FFmpeg', 'Musique'],
			},
		},
	},
	contact: {
		metaTitle: 'Contacter Noam Roger | Parlons de votre projet backend',
		metaDescription:
			"Contactez Noam Roger pour discuter d'un projet backend, d'une collaboration ou d'une opportunité.",
		heading: 'Contacter Noam Roger',
		subtitle: "N'hésitez pas à me contacter pour discuter de vos projets",
		infoTitle: 'Parlons de votre projet',
		infoText:
			"Je suis toujours intéressé par de nouvelles opportunités et collaborations. Contactez-moi si vous avez un projet en tête ou simplement envie d'échanger autour du développement backend.",
		emailLabel: 'E-mail',
		githubLabel: 'GitHub',
		linkedinLabel: 'LinkedIn',
		form: {
			name: 'Nom',
			namePlaceholder: 'Votre nom',
			email: 'E-mail',
			emailPlaceholder: 'votre@email.com',
			subject: 'Sujet',
			subjectPlaceholder: 'Sujet de votre message',
			message: 'Message',
			messagePlaceholder: 'Votre message...',
			submit: 'Envoyer le message',
			sending: 'Envoi en cours...',
			success: 'Message envoyé avec succès !',
			error: 'Erreur : ',
			failure: 'Une erreur est survenue. Merci de réessayer.',
		},
	},
	notFound: {
		metaTitle: 'Page introuvable (404) | Noam Roger',
		title: "Oups ! Vous êtes perdu dans l'espace.",
		message:
			"La page que vous cherchez n'existe pas ou a été déplacée. Retournons en terrain connu.",
		back: "Retour à l'accueil",
	},
};

export default fr;
