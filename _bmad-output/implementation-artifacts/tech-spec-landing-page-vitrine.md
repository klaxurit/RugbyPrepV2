---
title: 'Landing Page vitrine RugbyForge'
slug: 'landing-page-vitrine'
created: '2026-03-10'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 19', 'TypeScript ~5.9', 'Tailwind CSS 4.1 (@tailwindcss/vite)', 'framer-motion ^12.34.2', 'lucide-react 0.574', 'react-router-dom ^7.13']
files_to_modify: ['src/pages/LandingPage.tsx (new)', 'src/App.tsx']
code_patterns: ['named exports (jamais export default)', 'import type pour types', 'hex colors inline (bg-[#ff6b35])', 'framer-motion whileHover/whileTap', 'Link from react-router-dom', 'RugbyForgeLogo component (hero|md|sm)', 'rounded-[24px] cards', 'bg-white/5 border-white/10 glass pattern']
test_patterns: ['pas de tests pour pages/composants — uniquement services purs']
---

# Tech-Spec: Landing Page vitrine RugbyForge

**Created:** 2026-03-10

## Overview

### Problem Statement

RugbyForge n'a pas de page marketing/vitrine pour présenter l'application aux visiteurs. Les utilisateurs arrivent directement sur la page de login sans comprendre la valeur du produit. Il faut une landing page professionnelle qui convertit les visiteurs en inscriptions.

### Solution

Créer un composant `LandingPage.tsx` sur une route `/landing` dédiée, avec les sections Hero, Features, Progression, Science, Pricing, CTA et Footer. Le design reprend exactement les couleurs de l'app (`#ff6b35` orange, `#1a5f3f` vert, `#1a100c` dark). Les CTA redirigent vers `/auth/signup`. Les screenshots de l'app sont intégrés dans les sections Hero et Progression.

### Scope

**In Scope:**
- Composant React `LandingPage` avec toutes les sections (Hero, Stats, Features, Progression, Science, Pricing, CTA, Footer)
- Route publique `/landing` dans `App.tsx` (hors `RequireAuth`)
- Correction de toutes les erreurs de syntaxe du code source AI Studio
- Adaptation aux conventions projet (named exports, `framer-motion`, hex inline, `import type`)
- Intégration des screenshots existants depuis `public/images/landing/`
- Responsive mobile/desktop
- Navigation interne : CTA → `/auth/signup`, liens légal → `/legal`
- Prix définitifs : 0 / 5,99 /mois / 47,99 /an

**Out of Scope:**
- Redirection automatique `/` → `/landing` pour visiteurs non connectés
- Pages légales supplémentaires (Confidentialité, CGU/CGV)
- Liens réseaux sociaux fonctionnels
- Lien "Parler à un expert" fonctionnel
- SEO / meta tags / Open Graph

## Context for Development

### Codebase Patterns

- **Couleurs** : pas de config Tailwind custom, tout en hex inline — `#ff6b35` (orange), `#1a5f3f` (vert), `#1a100c` (dark bg), `#faf9f7` (light bg)
- **Transparences** : `bg-white/5` cards, `border-white/10` borders, `text-white/40` texte secondaire
- **Animations** : `import { motion } from 'framer-motion'` (PAS `motion/react`) — patterns `whileHover={{ y: -4 }}`, `whileTap={{ scale: 0.97 }}`
- **Exports** : `export function LandingPage()` — jamais `export default`
- **Logo** : `RugbyForgeLogo` dans `src/components/RugbyForgeLogo.tsx` avec sizes `hero|md|sm`
- **CSS** : Tailwind utility-first, `rounded-[24px]` pour cards, pas de CSS custom, pas de `style={{}}`
- **Navigation** : `Link` de `react-router-dom` pour liens internes, `useNavigate` pour programmatique
- **Images** : assets statiques dans `public/` référencés via chemin absolu `/images/landing/xxx.png`
- **Pages publiques** : pattern `min-h-screen bg-[#1a100c]` + grille décorative `radial-gradient(#ff6b35_1px,transparent_1px)`
- **Font** : Lexend (déjà configuré dans `@theme` de `global.css`)
- **Typo** : headers `font-black text-white tracking-tighter`, labels `text-xs font-bold uppercase tracking-wider`
- **Boutons** : primaire `bg-[#ff6b35] hover:bg-[#e55a2b]`, secondaire `bg-white/10 hover:bg-white/20`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/App.tsx` | Router — ajouter route `/landing` publique avant `RequireAuth` |
| `src/components/RugbyForgeLogo.tsx` | Logo component (hero/md/sm) |
| `src/pages/HomePage.tsx` | Design patterns de référence (dark theme, glass cards, gradients) |
| `src/pages/auth/LoginPage.tsx` | Pattern page publique (Link, Navigate, useNavigate) |
| `src/pages/auth/SignupPage.tsx` | Pattern page publique + auth redirect |
| `src/components/auth/RequireAuth.tsx` | Redirect vers `/auth/login` si non connecté |
| `src/styles/global.css` | Theme Tailwind (@theme font Lexend) |
| `public/images/landing/` | 7 screenshots app disponibles |

### Images disponibles

| Fichier | Usage landing |
| ------- | ------------- |
| `localhost_5173_week(iPhone 14 Pro Max) (2).png` | Hero — mockup téléphone (2.1 MB) |
| `tests-progression.png` | Section Progression — carte 1 (768 KB) |
| `acwr-monitoring.png` | Section Progression — carte 2 (768 KB) |
| `performance-monitoring.png` | Utilisable en section supplémentaire (512 KB) |
| `ai-chat.png` | Utilisable pour feature Coach IA (384 KB) |
| `calendar.png` | Utilisable pour feature Planning (448 KB) |
| `localhost_5173_legal(iPhone 14 Pro Max) (1).png` | Non utilisé |

### Technical Decisions

1. **Route séparée `/landing`** : pas de remplacement de `/` — la landing est un site vitrine indépendant
2. **Utilisateurs non connectés** : ne retombent jamais sur la landing après inscription — c'est un point d'entrée marketing uniquement
3. **Couleurs hex inline** : cohérent avec le reste du projet, pas de config Tailwind custom à ajouter
4. **Screenshots hero** : utiliser `localhost_5173_week(iPhone 14 Pro Max) (2).png` pour le phone mockup — renommer en nom propre recommandé
5. **Composant unique** : tout dans `LandingPage.tsx` avec sous-composants internes (Navbar, FeatureCard, PricingCard) — pas de fichiers séparés pour un composant vitrine
6. **Distribution** : actuellement PWA, destinée App Store / Google Play à terme — CTA "Commencer gratuitement" (pas "Installer l'app")
7. **Pas de tests** : convention projet = pas de tests pour pages/composants, uniquement services purs

## Implementation Plan

### Tasks

- [x] **Task 1 : Renommer le screenshot hero**
  - File : `public/images/landing/`
  - Action : Renommer `localhost_5173_week(iPhone 14 Pro Max) (2).png` → `app-week.png`
  - Notes : Nom propre, sans espaces ni parenthèses — facilite le référencement dans le code

- [x] **Task 2 : Créer `src/pages/LandingPage.tsx`**
  - File : `src/pages/LandingPage.tsx` (nouveau)
  - Action : Créer le composant complet avec les sous-composants internes suivants :
    - `LandingNavbar` — barre de navigation fixe avec logo (`RugbyForgeLogo size="sm"`), liens ancres (#features, #science, #pricing), bouton CTA → `/auth/signup`, menu mobile hamburger
    - `FeatureCard` — carte feature réutilisable (props : `icon`, `title`, `description`, `delay`)
    - `PricingCard` — carte pricing réutilisable (props : `title`, `price`, `period`, `features`, `highlighted`, `cta`)
    - `LandingPage` — composant principal exporté, assemblant toutes les sections
  - Notes — Corrections à appliquer par rapport au code AI Studio source :
    - `import { motion } from 'framer-motion'` (pas `motion/react`)
    - `export function LandingPage()` (pas `export default function App()`)
    - Remplacer toutes les couleurs custom Tailwind :
      - `forge-orange` → `[#ff6b35]`
      - `forge-dark` → `[#1a100c]`
      - `rugby-green` → `[#1a5f3f]`
      - `forge-orange/20` → `[#ff6b35]/20` (même pattern pour toutes les opacités)
    - Corriger les erreurs de syntaxe JSX :
      - `className="text-sm font-medium text-slate-300 hover:text-white transition-colors>` → ajouter guillemet fermant `"`
      - `className"bg-forge-orange` → ajouter `=`
      - `className="r` → compléter la classe (utiliser `relative`)
      - `py4` → `py-4`
      - `max--xl` → `max-w-xl`
      - `className="text-[10 text-slate-500` → `className="text-[10px] text-slate-500`
      - `className="text-[0px]` → `className="text-[10px]`
      - `className-8` → `className="mt-8 p-8`
      - `className="p-12-center` → `className="p-12 text-center`
      - `className` tronqués dans plusieurs `<div>` → compléter
    - Images : remplacer les src AI Studio par les chemins locaux :
      - Hero phone : `src="/images/landing/app-week.png"` (renommé Task 1)
      - Progression carte 1 : `src="/images/landing/tests-progression.png"`
      - Progression carte 2 : `src="/images/landing/acwr-monitoring.png"`
      - Retirer `referrerPolicy="no-referrer"` (inutile pour assets locaux)
    - Navigation : tous les boutons CTA ("Commencer gratuitement", "Commencer", "Créer mon compte Free", "Passer en Premium Mensuel", "Passer en Premium Annuel") → `<Link to="/auth/signup">` wrappé dans le bouton stylé
    - Lien "Voir une semaine type" → `<Link to="/auth/signup">` (pas de page dédiée pour l'instant)
    - Liens footer "Confidentialité", "Mentions Légales", "CGU / CGV" → `<Link to="/legal">`
    - Liens footer "Contact" → `<a href="mailto:contact@rugbyforge.com">` (ou placeholder `#`)
    - Liens réseaux sociaux → garder les icônes mais `href="#"` (out of scope)
    - "Parler à un expert" → `<Link to="/auth/signup">` (fallback)
    - Supprimer les imports inutilisés : `Users`, `Star` (icône — utilisée en fait dans Science), `ChevronRight`, `Smartphone`
    - Copyright footer : `© 2026 RugbyForge. v1.0 - beta` (retirer "Kit")

- [x] **Task 3 : Ajouter la route `/landing` dans `App.tsx`**
  - File : `src/App.tsx`
  - Action :
    1. Ajouter l'import : `import { LandingPage } from './pages/LandingPage'`
    2. Ajouter la route publique `<Route path="/landing" element={<LandingPage />} />` dans le bloc des routes publiques (après `/legal`, avant `<Route element={<RequireAuth />}>`)
  - Notes : Route publique, pas de guard auth — accessible à tous

- [x] **Task 4 : Vérification build + lint**
  - Action : Exécuter `npm run build` et `npm run lint` pour valider que le composant compile sans erreur
  - Notes : Le build inclut `tsc -b` — vérifie types, imports, exports. Corriger tout warning ESLint (imports inutilisés, etc.)

### Acceptance Criteria

- [ ] **AC 1** : Given un visiteur non connecté, when il accède à `/landing`, then la page s'affiche complètement avec toutes les sections (Hero, Stats, Features, Progression, Science, Pricing, CTA, Footer) sans erreur console.

- [ ] **AC 2** : Given un visiteur sur la landing, when il clique sur un bouton CTA ("Commencer gratuitement", "Créer mon compte Free", "Passer en Premium Mensuel", "Passer en Premium Annuel"), then il est redirigé vers `/auth/signup`.

- [ ] **AC 3** : Given un visiteur sur la landing, when il clique sur un lien de navigation (Fonctionnalités, La Science, Tarifs), then la page scrolle vers la section correspondante (#features, #science, #pricing).

- [ ] **AC 4** : Given un visiteur sur mobile (< 768px), when il clique sur le menu hamburger, then le menu mobile s'ouvre avec les liens de navigation et le bouton CTA. When il clique sur un lien ou le bouton X, then le menu se ferme.

- [ ] **AC 5** : Given un visiteur sur la landing, when il regarde la section Hero, then il voit le screenshot de l'app dans un cadre mockup téléphone avec les cercles décoratifs.

- [ ] **AC 6** : Given un visiteur sur la landing, when il regarde la section Progression, then il voit les 2 screenshots (tests-progression + acwr-monitoring) dans des cadres arrondis avec légendes.

- [ ] **AC 7** : Given un visiteur sur la landing, when il regarde la section Pricing, then les 3 plans affichent les prix définitifs (0€, 5,99€/mois, 47,99€/an) avec la carte "Mensuel" mise en avant (scale + badge "Recommandé").

- [ ] **AC 8** : Given le projet, when on exécute `npm run build && npm run lint`, then aucune erreur de compilation ni de lint n'est reportée.

- [ ] **AC 9** : Given un utilisateur connecté, when il accède à `/landing`, then la page s'affiche normalement (pas de redirect — c'est une page publique indépendante).

## Additional Context

### Dependencies

- Aucune nouvelle dépendance npm — tout est déjà installé (framer-motion, lucide-react, react-router-dom)
- Les screenshots doivent être présents dans `public/images/landing/` avant l'implémentation
- Le screenshot hero doit être renommé (Task 1) avant Task 2

### Testing Strategy

- **Pas de tests automatisés** : convention projet = pas de tests pour pages/composants
- **Tests manuels** :
  1. Ouvrir `/landing` en mode desktop (1440px+) — vérifier layout, images, animations
  2. Ouvrir `/landing` en mode mobile (375px) — vérifier responsive, menu hamburger
  3. Cliquer chaque CTA → doit rediriger vers `/auth/signup`
  4. Cliquer chaque lien ancre → scroll fluide vers la section
  5. Vérifier console — aucune erreur ni warning
  6. `npm run build` — compilation OK
  7. `npm run lint` — aucune erreur

### Notes

- **Risque principal** : le code source AI Studio contient ~15 erreurs de syntaxe JSX — la Task 2 doit toutes les corriger. Liste exhaustive fournie dans les notes de la task.
- **Images lourdes** : le screenshot hero fait 2.1 MB — envisager une compression future (hors scope) pour améliorer le temps de chargement
- **Future considération** : quand l'app sera sur les stores, ajouter des badges App Store / Google Play dans la section Hero et le CTA final
- **Future considération** : ajouter une redirection `/` → `/landing` pour les visiteurs non authentifiés (nécessite de modifier RequireAuth ou le routing)
