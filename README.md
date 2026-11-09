# Portfolio

Code source du portfolio de Noam Roger, servi par un Cloudflare Worker sur
https://www.noamroger.fr.

## Bilinguisme

Le site vit sur un seul domaine. Le français est à la racine et l'anglais sous
`/en` : `/about/` et `/en/about/` sont la même page, générée au build dans les
deux langues. Les deux versions restent donc indexables.

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
- `contact@noamroger.fr` est l'adresse de contact dans les deux langues.
- `Layout.astro` pose `<html lang>`, la `<meta name="description">`, le
  `<link rel="canonical">` de la page et les `hreflang` croisés. La page 404 est
  en `noindex` et sans canonical.

### Ajouter ou modifier un texte

1. Ajouter la clé dans `src/i18n/en.ts`.
2. Ajouter la traduction correspondante dans `src/i18n/fr.ts`.
3. L'utiliser dans un composant via `const { t } = getI18n(Astro.url.pathname)`.

Pour un texte utilisé par un script client (donc pas rendu au build), le passer
en attribut `data-*` sur l'élément et le relire depuis le script — voir
`#typing-text` dans `src/views/Home.astro` et le formulaire de
`src/views/Contact.astro`.

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
`http://localhost:4321/en/`.

## Déploiement Cloudflare Workers

Le site est un Worker `portfolio` avec des assets statiques (`wrangler.jsonc`) :
Astro génère `dist/`, que Cloudflare sert directement.

- **Rebuild automatique** : le Worker est relié au dépôt GitHub par Workers
  Builds. Chaque push sur `main` lance `npm run build` puis
  `npx wrangler deploy`. Les autres branches produisent une version de preview
  sur `*.workers.dev` sans toucher à la production.
- **Domaines** : `routes` dans `wrangler.jsonc` rattache `noamroger.fr` et
  `www.noamroger.fr` au Worker et crée leurs enregistrements DNS. Le déploiement
  échoue si un de ces noms a encore un autre enregistrement A, AAAA ou CNAME.
- **`worker/index.js`** redirige `noamroger.fr` vers `www.noamroger.fr` (301)
  et sert la 404 anglaise sous `/en/`, puisque Astro l'émet en
  `/en/404/index.html` et que la gestion des 404 des assets ne cherche que des
  fichiers `404.html`.
- **En-têtes** : `public/_headers`, voir « SEO et performance ».

Déployer à la main ou tester le Worker en local :

```bash
npm run deploy          # build + wrangler deploy (demande un login Cloudflare)
npm run preview:worker  # build + wrangler dev
```

`noamroger.dev` est destiné à rediriger vers `noamroger.fr`, en envoyant chaque
chemin vers sa version sous `/en`.
