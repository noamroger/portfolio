const en = {
	htmlLang: 'en',
	meta: {
		description: "Noam Roger's portfolio - Backend Developer",
		jobTitle: 'Backend Developer',
		ogLocale: 'en_US',
	},
	a11y: {
		skipToContent: 'Skip to content',
	},
	nav: {
		switchLanguage: 'View this page in French',
		home: 'Home',
		about: 'About',
		projects: 'Projects',
		contact: 'Contact',
	},
	footer: {
		rights: 'All rights reserved.',
	},
	home: {
		pageTitle: 'Home',
		metaDescription:
			'Noam Roger, backend developer based in Le Mans, France. Robust APIs, scalable systems and clean architectures.',
		greeting: "Hi, I'm",
		typingTexts: ['Backend Developer', 'API Architect', 'System Designer', 'Problem Solver'],
		description:
			'Specialized in designing robust and performant architectures. I transform complex ideas into elegant solutions.',
		ctaProjects: 'View My Projects',
		ctaContact: 'Get In Touch',
		code: {
			role: 'Backend Dev',
			passion: 'Clean Code',
			returns: 'Awesome stuff',
		},
		skillsTitle: 'Skills',
		skills: [
			{ title: 'Performance', description: 'Query optimization, caching, and scalability' },
			{ title: 'Security', description: 'Authentication, authorization, and data protection' },
			{ title: 'Architecture', description: 'Design patterns, microservices, and distributed systems' },
			{ title: 'Testing', description: 'Unit tests, integration, and TDD' },
		],
	},
	about: {
		pageTitle: 'About',
		metaDescription:
			'Get to know Noam Roger: backend developer - his journey, his engineering philosophy and the technologies he works with.',
		heading: 'About Me',
		subtitle: 'Backend developer passionate about clean code and solid architectures',
		journeyTitle: 'My Journey',
		journey: [
			'Backend developer with several years of experience, I specialize in creating robust APIs and scalable systems. My passion for clean code and best practices drives me to constantly improve my skills.',
			'I enjoy tackling complex technical challenges and transforming problems into elegant solutions. My approach combines technical rigor with the creativity needed to innovate.',
		],
		philosophyTitle: 'My Philosophy',
		philosophy: [
			'Code should be readable and maintainable',
			'Simplicity over complexity',
			'Tests are essential for quality',
			'Continuous learning is indispensable',
		],
		infoTitle: 'Information',
		infoName: 'Name',
		infoLocation: 'Location',
		infoLocationValue: 'Le Mans (France)',
		infoAvailability: 'Availability',
		infoAvailabilityValue: 'Open to opportunities',
		techTitle: 'Tech Stack',
	},
	projects: {
		pageTitle: 'Projects',
		metaDescription:
			"A selection of Noam Roger's backend projects: AI agents, Discord bots, web server foundations and multiplayer C programming.",
		heading: 'My Projects',
		subtitle: 'A selection of my work and contributions',
		codeLink: 'Code',
		demoLink: 'Demo',
		items: {
			californyan: {
				title: 'Californyan',
				description:
					'An AI-powered hotel receptionist created for the 24 Hours of Code 2025 (organized by the Le Mans Chamber of Commerce and Industry). A great introduction to agents in the age of AI.',
				tech: ['Node.js', 'AI', 'LangChain', 'API'],
			},
			webserver: {
				title: 'Webserver base',
				description:
					'The foundation of the 2024 24h of Code project (organized by Lycée Réaumur in Laval). It served as a base for my various projects over the course of about a year.',
				tech: ['Node.js', 'Express', 'JavaScript'],
			},
			romaybot: {
				title: 'Romaybot',
				description:
					'A fictional card collection system (Pokémon parody). Created as part of a paid commission that includes a Twitch bot, Discord, and a website featuring these cards.',
				tech: ['Node.js', 'Discord.js', 'Twitch', 'MySQL'],
			},
			codenames: {
				title: 'Codenames',
				description:
					'A multiplayer adaptation of the board game Codenames in C programming language, created as part of a university project. With a group of four.',
				tech: ['C', 'Socket', 'Network Programming', 'Multiplayer'],
			},
			webserverTs: {
				title: 'Enhanced Web Server Base',
				description:
					'An advanced base with a separate frontend and backend, both developed in TypeScript. A solid foundation with my skills from 2026 still in development for my future projects.',
				tech: ['TypeScript', 'React', 'Node.js', 'Express'],
			},
			gaulia: {
				title: 'Gaulia Musique',
				description:
					'A Discord bot that allows playing music in Discord voice channels. It has been added to over 800 servers, but is no longer maintained today.',
				tech: ['Node.js', 'Discord.js', 'FFmpeg', 'Music'],
			},
		},
	},
	contact: {
		pageTitle: 'Contact',
		metaDescription:
			'Get in touch with Noam Roger to discuss a backend project, a collaboration or an opportunity.',
		heading: 'Contact',
		subtitle: 'Feel free to reach out to discuss your projects',
		infoTitle: "Let's Talk About Your Project",
		infoText:
			"I'm always interested in new opportunities and collaborations. Feel free to contact me if you have a project in mind or just want to chat about backend development.",
		emailLabel: 'Email',
		githubLabel: 'GitHub',
		linkedinLabel: 'LinkedIn',
		form: {
			name: 'Name',
			namePlaceholder: 'Your name',
			email: 'Email',
			emailPlaceholder: 'your@email.com',
			subject: 'Subject',
			subjectPlaceholder: 'Subject of your message',
			message: 'Message',
			messagePlaceholder: 'Your message...',
			submit: 'Send Message',
			sending: 'Sending...',
			success: 'Success! Your message has been sent.',
			error: 'Error: ',
			failure: 'Something went wrong. Please try again.',
		},
	},
	notFound: {
		pageTitle: '404 - Page Not Found',
		title: "Oops! You're lost in space.",
		message: "The page you are looking for doesn't exist or has been moved. Let's get you back to safety.",
		back: 'Back to Home',
	},
};

export type Translations = typeof en;
export default en;
