# Portfolio

Code source du portfolio de Noam Roger, servi par un Cloudflare Worker sur
https://www.noamroger.fr.

## Bilinguisme

Chaque langue a son domaine : le français sur `www.noamroger.fr`, l'anglais sur
`www.noamroger.dev`, aux mêmes chemins. Les pages sont générées au build dans les
deux langues (l'anglais dans `dist/en/`) et servies par le même Worker, voir
« Deux domaines ».

- Tous les textes vivent dans `src/i18n/en.ts` et `src/i18n/fr.ts`.
  `en.ts` fait foi : son type `Translations` contraint `fr.ts`, donc oublier une
  clé en français est signalé dans l'éditeur (le build Astro, lui, ne
  typecheck pas).
- `src/views/` contient le contenu des pages. `src/pages/` et `src/pages/en/`
  ne font que les afficher, une fois par langue.
- Dans une page ou un composant, `getI18n(Astro.url.pathname)` donne le
  dictionnaire (`t`), la langue (`locale`) et `path()`, qui préfixe les liens
  internes.
- Le bouton de langue de la barre de navigation enregistre le choix dans
  `localStorage["lang"]`. Un script placé en tête de `Layout.astro` applique ce
  choix avant l'affichage, y compris à la visite suivante. Sans choix enregistré,
  la langue suit simplement l'URL.
- L'adresse de contact suit le domaine : `contact@noamroger.fr` en français,
  `contact@noamroger.dev` en anglais.
- `Layout.astro` pose `<html lang>`, la `<meta name="description">`, le
  `<link rel="canonical">` de la page et les `hreflang` croisés. La page 404 est
  en `noindex` et sans canonical.

### Ajouter ou modifier un texte

1. Ajouter la clé dans `src/i18n/en.ts`.
2. Ajouter la traduction correspondante dans `src/i18n/fr.ts`.
3. L'utiliser dans un composant via `const { t } = getI18n(Astro.url.pathname)`.

Pour un texte utilisé par un script client (donc pas rendu au build), le passer
en attribut `data-*` sur l'élément et le relire depuis le script — voir le
bouton de thème de `src/components/Navbar.astro` et le formulaire de
`src/views/Contact.astro`.

## Thème clair / sombre

Le site est en sombre par défaut. Le bouton soleil/lune de la barre de
navigation bascule en clair et enregistre le choix dans
`localStorage["theme"]`. Un script en tête de `Layout.astro` pose
`data-theme` sur `<html>` avant l'affichage, et le réapplique après chaque
navigation du routeur client. Toutes les couleurs sont des variables CSS
définies dans `Layout.astro` (`:root` pour le sombre,
`:root[data-theme='light']` pour le clair).

## SEO et performance

- **Sitemap** : `@astrojs/sitemap` génère `sitemap-index.xml` avec les pages des
  deux langues (les 404 sont exclues).
- **robots.txt** : généré par `src/pages/robots.txt.ts`, il pointe vers le
  sitemap du site.
- **Métadonnées** : chaque page porte son `<title>` complet (clé
  `metaTitle`, 50-60 caractères) et sa propre `description`
  (`metaDescription`), plus Open Graph et Twitter Card avec dimensions et
  texte alternatif d'image.
- **Données structurées** : `Layout.astro` émet un `@graph` schema.org sur
  chaque page indexable — `Person`, `ProfessionalService`, `WebSite`, un
  noeud de page typé (`AboutPage`, `ContactPage`, `CollectionPage`) et un
  `BreadcrumbList`. La page projets y ajoute une `ItemList` de
  `SoftwareSourceCode`. Une page peut enrichir le graphe via la prop
  `schema`, et son type via `pageType`.
- **llms.txt** : `src/pages/llms.txt.ts` publie une carte du site en texte
  brut pour les modèles de langage, sur le modèle de llmstxt.org.
- **Sources partagées** : l'ordre et les dépôts des projets vivent dans
  `src/data/projects.ts`, le texte dans `src/i18n`, associés par la même
  clé. La page projets, le graphe schema.org et `llms.txt` lisent les mêmes
  données.
- **Images** : les visuels de projets vivent dans `src/assets/projects/` et
  passent par `<Image>` d'`astro:assets`, qui produit un `srcset` (380 à
  1024 px) et les dimensions intrinsèques. Ne pas les remettre dans `public/`,
  ce qui désactiverait l'optimisation.
- **Icônes** : `favicon.ico` (16/32/48 px, frames PNG), `apple-touch-icon.png`
  et `og-image.png` sont dérivés du même monogramme.
- **Navigation** : les quatre pages sont préchargées au chargement
  (`prefetch.prefetchAll`, stratégie `load`) et le CSS est intégré au HTML
  (`build.inlineStylesheets: 'always'`). Un clic ne déclenche donc aucune
  requête réseau. Sans ça, chaque navigation coûtait deux allers-retours en
  série — le HTML, puis la feuille de style découverte dedans — soit ~560 ms
  mesurés en production.
- **En-têtes HTTP** : `public/_headers` (copié tel quel dans `dist/`) met `/_astro/*` en cache immuable (les
  noms de fichiers sont hashés), donne aux pages une courte fenêtre de
  fraîcheur pour que le préchargement ne soit pas annulé par une
  revalidation, et pose `Content-Security-Policy`,
  `X-Content-Type-Options`, `Referrer-Policy` et `Permissions-Policy`.
  Le `connect-src` et le `form-action` de la CSP autorisent
  `https://form.noam.ovh` pour le formulaire de contact : à mettre à jour si
  l'endpoint change.
- **Accessibilité** : lien d'évitement, contour de focus visible sur fond
  sombre, icônes décoratives en `aria-hidden`, et respect de
  `prefers-reduced-motion` (les particules et animations infinies sont
  désactivées).

## Développement

```bash
npm install
npm run dev
```

Le français est sur `http://localhost:4321/`, l'anglais sur
`http://localhost:4321/en/` (en développement seulement : en production
l'anglais a son propre domaine, voir « Deux domaines »).

## Déploiement Cloudflare Workers

Le site est un Worker `portfolio` avec des assets statiques (`wrangler.jsonc`) :
Astro génère `dist/`, que Cloudflare sert directement.

- **Rebuild automatique** : le Worker est relié au dépôt GitHub par Workers
  Builds. Chaque push sur `main` lance `npm run build` puis
  `npx wrangler deploy`. Les autres branches produisent une version de preview
  sur `*.workers.dev` sans toucher à la production.
- **Domaines** : `routes` dans `wrangler.jsonc` rattache `noamroger.fr`,
  `www.noamroger.fr`, `noamroger.dev` et `www.noamroger.dev` au Worker et crée
  leurs enregistrements DNS. Les deux zones doivent être dans le compte
  Cloudflare, sans règle de redirection (elle passerait avant le Worker).
- **`worker/`** : `index.js` aiguille les requêtes, `hosts.js` connaît les
  domaines et leurs redirections, `site.js` sert le build, `headers.js` pose les
  en-têtes des réponses fabriquées par le Worker, `ops.js` répond aux visiteurs
  en ligne de commande, `stats.js` et `admin.js` gèrent les statistiques.
- **En-têtes** : `public/_headers`, voir « SEO et performance ».

Déployer à la main ou tester le Worker en local :

```bash
npm run deploy          # build + wrangler deploy (demande un login Cloudflare)
npm run preview:worker  # build + wrangler dev
```

### Deux domaines

Un seul Worker et un seul build servent les deux langues : le français sur
`https://www.noamroger.fr`, l'anglais sur `https://www.noamroger.dev`. Le Worker
choisit selon le nom d'hôte (`worker/hosts.js`).

- Astro émet toujours les pages anglaises sous `dist/en/`. Sur `noamroger.dev`,
  `worker/site.js` sert ce dossier à la racine (`/about/` lit `dist/en/about/`)
  et retombe sur les fichiers communs (`/_astro/`, images, `/fonts.json`).
  `/en` n'apparaît donc dans aucune adresse ni aucun lien.
- Les anciennes adresses `noamroger.fr/en/…` sont redirigées en 301 vers
  `www.noamroger.dev/…`, tout comme `noamroger.fr` et `noamroger.dev` vers leur
  `www`, en un seul saut.
- Origines, domaines et adresses de contact par langue sont dans
  `src/i18n/index.ts` (`siteOrigins`, `contactEmails`), à garder alignés avec
  `worker/hosts.js`. Canonical, hreflang, sélecteur de langue, `robots.txt`,
  `security.txt`, `llms.txt` et sitemap en découlent. Le sitemap anglais est
  écrit par `src/pages/en/sitemap-index.xml.ts`.
- Sur un autre hôte (preview `*.workers.dev`), l'anglais reste sous `/en/`, mais
  ses liens internes n'ont pas de préfixe : pour le parcourir en local, lancer
  `npx wrangler dev --host www.noamroger.dev`.

## Statistiques GitHub

`worker/github.js` sert `/api/github` : des totaux neutres (dépôts, langages,
contributions sur 12 mois, dernier push, 5 derniers dépôts poussés). Il
interroge l'API GraphQL de GitHub avec le secret `GITHUB_TOKEN` du Worker
(token fine-grained, tous les dépôts, permission Metadata en lecture seule) et
met la réponse en cache une heure. Les dépôts privés ne sont que comptés : ni
nom ni lien ne sortent du Worker. Sans token, la route répond 503 et
`src/scripts/github-stats.ts` laisse les blocs `[data-gh-block]` masqués.
Une erreur (token absent, GitHub en panne) est mise en cache 60 secondes pour
ne pas épuiser le quota du token ; sa cause n'apparaît que dans les logs du
Worker, la réponse publique reste `{"error":"unavailable"}`.

## Statistiques de visite

Mesure d'audience maison, anonyme et sans cookie. Rien n'est stocké dans le
navigateur des visiteurs.

- **Collecte** : `src/scripts/stats.ts` envoie le chemin de chaque page
  réellement affichée à `/api/hit` (les pages étant préchargées et mises en
  cache, les requêtes vues par le Worker ne reflètent pas les visites).
  `worker/stats.js` enregistre dans D1 (binding `STATS`, base
  `portfolio-stats`) : chemin, date, pays donné par Cloudflare, type
  d'appareil, domaine référent et une empreinte de visiteur.
- **Anonymat** : ni l'adresse IP ni le user agent ne sont enregistrés. Ils ne
  servent qu'à calculer l'empreinte `hash(sel du jour + IP + user agent)`. Le
  sel est aléatoire, change chaque jour et est supprimé à la fin de la journée :
  un visiteur n'est pas reconnu d'un jour à l'autre, et une empreinte passée ne
  peut plus être rapprochée d'une adresse.
- **Deux domaines** : les vues de `noamroger.dev` sont enregistrées avec le
  préfixe `/en` (`noamroger.dev/about` devient `/en/about`), ce qui sépare les
  langues et prolonge l'historique d'avant le changement de domaine.
- **Exclusions** : robots connus (user agent), requêtes qui ne viennent pas des
  pages du site, previews `*.workers.dev`, et les navigateurs où l'on s'est
  connecté au tableau de bord (cookie `stats_ignore`, posé à la connexion, le
  seul cookie du système et il ne concerne que l'administrateur). Ce cookie ne
  vaut que pour `noamroger.fr` : ouvrir une fois
  `https://www.noamroger.dev/api/hit/ignore` le pose aussi pour le site anglais.
- **Rétention** : 90 jours. Un cron (`triggers` dans `wrangler.jsonc`) purge
  chaque nuit ce qui est plus ancien.
- **Tableau de bord** : `worker/admin.js`, sur `https://admin.noamroger.fr`,
  rendu côté serveur et sans aucun script. Il est protégé par le secret
  `ADMIN_PASSWORD` du Worker (`npx wrangler secret put ADMIN_PASSWORD`, ou
  Settings > Variables and Secrets). Sans ce secret il reste fermé (503). Cinq
  mots de passe faux en un quart d'heure bloquent les essais suivants.
- **Schéma** : `migrations/0001_stats.sql`, appliqué avec
  `npx wrangler d1 migrations apply portfolio-stats --remote`.

En local :

```bash
npx wrangler d1 migrations apply portfolio-stats --local
npx wrangler dev --host www.noamroger.fr                                  # le site français
npx wrangler dev --host www.noamroger.dev --port 8788                     # le site anglais
npx wrangler dev --host admin.noamroger.fr --var ADMIN_PASSWORD:test      # le tableau de bord
```
