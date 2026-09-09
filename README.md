# Portfolio

Code source du portfolio de Noam Roger, déployé depuis Netlify sur deux domaines :

| Domaine                | Langue   | `SITE_LOCALE` |
| ---------------------- | -------- | ------------- |
| https://www.noamroger.dev | anglais  | `en` (défaut) |
| https://www.noamroger.fr  | français | `fr`          |

## Bilinguisme

La langue est **figée au moment du build** : il n'y a ni préfixe d'URL, ni
détection côté navigateur, ni sélecteur de langue. Les deux domaines exposent
exactement les mêmes chemins (`/`, `/about`, `/projects`, `/contact`).

- Tous les textes vivent dans `src/i18n/en.ts` et `src/i18n/fr.ts`.
  `en.ts` fait foi : son type `Translations` contraint `fr.ts`, donc oublier une
  clé en français est signalé dans l'éditeur (le build Astro, lui, ne
  typecheck pas).
- `src/i18n/index.ts` lit `SITE_LOCALE` et exporte le dictionnaire actif (`t`),
  la locale (`locale`), les origines des deux domaines (`origins`) et l'adresse
  de contact (`contactEmail`).
- L'adresse de contact reste `contact@noamroger.fr` dans les deux langues.
- `Layout.astro` pose `<html lang>`, la `<meta name="description">`, le
  `<link rel="canonical">` du domaine courant et les `hreflang` croisés vers
  l'autre domaine. La page 404 est en `noindex` et sans canonical.

### Ajouter ou modifier un texte

1. Ajouter la clé dans `src/i18n/en.ts`.
2. Ajouter la traduction correspondante dans `src/i18n/fr.ts`.
3. L'utiliser dans un composant via `import { t } from '../i18n'`.

Pour un texte utilisé par un script client (donc pas rendu au build), le passer
en attribut `data-*` sur l'élément et le relire depuis le script — voir
`#typing-text` dans `src/pages/index.astro` et le formulaire de
`src/pages/contact.astro`.

## SEO et performance

- **Sitemap** : `@astrojs/sitemap` génère `sitemap-index.xml` par domaine (la
  404 est exclue).
- **robots.txt** : généré par `src/pages/robots.txt.ts`, il pointe vers le
  sitemap du domaine courant.
- **Métadonnées** : chaque page a sa propre `description` (clé
  `metaDescription` dans les dictionnaires), plus Open Graph, Twitter Card et
  un JSON-LD `Person` sur la page d'accueil.
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
- **En-têtes HTTP** : `netlify.toml` met `/_astro/*` en cache immuable (les
  noms de fichiers sont hashés), donne aux pages une courte fenêtre de
  fraîcheur pour que le préchargement ne soit pas annulé par une
  revalidation, et pose `Content-Security-Policy`,
  `X-Content-Type-Options`, `Referrer-Policy` et `Permissions-Policy`.
  Le `connect-src` de la CSP autorise `https://forms.noam.ovh` pour le
  formulaire de contact : à mettre à jour si l'endpoint change.
- **Accessibilité** : lien d'évitement, contour de focus visible sur fond
  sombre, icônes décoratives en `aria-hidden`, et respect de
  `prefers-reduced-motion` (les particules et animations infinies sont
  désactivées).

## Développement

```bash
npm install
npm run dev
```

Par défaut le site est en anglais. Pour travailler sur la version française,
créer un fichier `.env` à la racine (voir `.env.example`) :

```
SITE_LOCALE=fr
```

## Déploiement Netlify

Deux sites Netlify pointent sur ce même dépôt et la même branche :

- **Site anglais** (`noamroger.dev`) : aucune variable à définir, `en` est la
  valeur par défaut.
- **Site français** (`noamroger.fr`) : ajouter la variable d'environnement
  `SITE_LOCALE=fr` dans _Site configuration > Environment variables_.

La commande de build et le dossier publié sont communs et viennent de
`netlify.toml`. Ne pas déclarer `SITE_LOCALE` dans `netlify.toml` : ce fichier
est prioritaire sur les variables définies dans l'interface, ce qui forcerait la
même langue sur les deux sites.

Un `git push` déclenche donc deux déploiements, un par domaine.
