# Portfolio - Noam Roger

Portfolio personnel de développeur backend, construit avec Astro.

## 🚀 Caractéristiques

- **Thème sombre** avec accents bleus
- **4 pages** : Accueil, À propos, Projets, Contact
- **100% statique** - Serverless, prêt pour Netlify
- **Responsive** - Adapté mobile, tablette et desktop
- **Facilement éditable** - Structure claire et commentaires

## 📁 Structure du projet

```
portfolio/
├── src/
│   ├── components/      # Composants réutilisables
│   │   ├── Navbar.astro    # Navigation
│   │   └── Footer.astro    # Pied de page
│   ├── layouts/         # Mises en page
│   │   └── Layout.astro    # Layout principal + styles globaux
│   └── pages/           # Pages du site
│       ├── index.astro     # Page d'accueil
│       ├── a-propos.astro  # Page À propos
│       ├── projets.astro   # Page Projets
│       └── contact.astro   # Page Contact
├── public/             # Assets statiques
├── astro.config.mjs    # Configuration Astro
└── netlify.toml        # Configuration Netlify
```

## 🎨 Personnalisation

### Couleurs

Les couleurs sont définies dans `src/layouts/Layout.astro` dans les variables CSS :

```css
:root {
	--bg-primary: #0a0e17;      /* Fond principal */
	--bg-secondary: #111827;    /* Fond secondaire */
	--bg-tertiary: #1f2937;     /* Fond tertiaire */
	--text-primary: #f9fafb;   /* Texte principal */
	--text-secondary: #9ca3af; /* Texte secondaire */
	--text-muted: #6b7280;      /* Texte muted */
	--accent-blue: #3b82f6;     /* Bleu accent */
	--accent-blue-light: #60a5fa; /* Bleu clair */
	--accent-blue-dark: #2563eb;  /* Bleu foncé */
	--border-color: #374151;    /* Bordures */
}
```

### Contenu

#### Informations personnelles (`src/pages/a-propos.astro`)
- Modifier le paragraphe "Mon parcours"
- Modifier la liste "Ma philosophie"
- Mettre à jour les informations (localisation, disponibilité)
- Adapter la stack technique

#### Projets (`src/pages/projets.astro`)
Les projets sont définis dans un tableau en haut du fichier :

```javascript
const projects = [
	{
		title: "Titre du projet",
		description: "Description du projet",
		tech: ["Tech1", "Tech2", "Tech3"],
		link: "#",      // Lien vers la démo
		github: "#"      // Lien vers le code
	},
	// ... autres projets
];
```

#### Contact (`src/pages/contact.astro`)
- Mettre à jour l'email dans `mailto:`
- Mettre à jour les liens GitHub et LinkedIn
- Configurer Formspree pour le formulaire (remplacer `your-form-id`)

#### Liens sociaux (`src/components/Footer.astro`)
- Mettre à jour les liens GitHub et LinkedIn

## 🛠️ Développement local

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Construire pour la production
npm run build

# Prévisualiser le build de production
npm run preview
```

Le site sera accessible sur `http://localhost:4321`

## 🌐 Déploiement sur Netlify

### Option 1 : Via Git (recommandé)

1. Poussez votre code sur GitHub/GitLab/Bitbucket
2. Connectez votre repo sur Netlify
3. Netlify détectera automatiquement la configuration via `netlify.toml`

### Option 2 : Via CLI Netlify

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Déployer
netlify deploy --prod
```

### Option 3 : Drag & Drop

1. Construisez le projet : `npm run build`
2. Glissez-déposez le dossier `dist` sur le dashboard Netlify

## 📧 Configuration du formulaire de contact

Le formulaire utilise [Formspree](https://formspree.io/) pour gérer les soumissions sans backend :

1. Créez un compte sur [formspree.io](https://formspree.io/)
2. Créez un nouveau formulaire
3. Copiez l'ID du formulaire
4. Remplacez `your-form-id` dans `src/pages/contact.astro` :

```html
<form action="https://formspree.io/f/VOTRE_FORM_ID" method="POST">
```

## 🎯 Prochaines améliorations possibles

- Ajouter des animations avec CSS ou une librairie légère
- Intégrer un blog avec Astro Content Collections
- Ajouter des icônes personnalisées
- Optimiser le SEO avec meta tags
- Ajouter un mode clair/sombre toggle

## 📝 Licence

Ce portfolio est libre d'utilisation et de modification.

---

Créé avec ❤️ et [Astro](https://astro.build)
