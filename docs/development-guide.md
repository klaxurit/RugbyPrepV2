# RugbyForge — Guide de développement

**Date :** 2026-03-09

---

## Prérequis

| Outil | Version | Notes |
|-------|---------|-------|
| Node.js | ≥ 20.x | Testé avec v20.19.6 |
| npm | ≥ 10.x | Testé avec v10.8.2 |
| Supabase CLI | ≥ 2.76 | Pour migrations et Edge Functions |
| Git | ≥ 2.x | — |

---

## Installation

```bash
git clone <repo-url>
cd RugbyPrepV2
npm install
```

## Configuration environnement

```bash
cp .env.example .env.local
```

Variables requises dans `.env.local` :

| Variable | Rôle | Où la trouver |
|----------|------|---------------|
| `VITE_SUPABASE_URL` | URL projet Supabase | Dashboard Supabase > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (JWT eyJ...) | Dashboard Supabase > Settings > API |
| `VITE_VAPID_PUBLIC_KEY` | Clé publique Web Push | `npx web-push generate-vapid-keys` |
| `VITE_POSTHOG_KEY` | Clé PostHog (optionnel en dev) | Dashboard PostHog |

**Secrets Supabase Edge Functions** (configurés via Dashboard, pas dans .env.local) :
- `ANTHROPIC_API_KEY` — Pour ai-coach
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Pour billing
- `STRIPE_PRICE_PREMIUM_MONTHLY`, `STRIPE_PRICE_PREMIUM_YEARLY` — Mapping prix
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT` — Web Push
- `CRON_SHARED_SECRET` — Scheduler rappels

---

## Commandes de développement

| Commande | Action |
|----------|--------|
| `npm run dev` | Serveur dev Vite (HMR) |
| `npm run build` | Build production (`tsc -b && vite build`) |
| `npm run preview` | Preview du build de production |
| `npm run lint` | ESLint (flat config + Prettier) |
| `npm run test` | Tests Vitest (run once) |
| `npm run test:watch` | Tests Vitest (watch mode) |

### Scripts utilitaires

| Commande | Action |
|----------|--------|
| `npm run parse:ffr-clubs` | Parse données clubs FFR |
| `npm run fetch:club-logos` | Fetch logos clubs |
| `npm run fetch:ffr-ids:ligue` | Fetch IDs FFR par ligue |
| `npm run validate:club-logos:manual` | Validation logos manuels |
| `npm run validate:club-logos:manual:remote` | Validation logos (remote check) |

---

## Supabase

### Migrations

```bash
# Lier au projet (déjà fait)
supabase link

# Appliquer les migrations
supabase db push

# Créer une nouvelle migration
supabase migration new nom_de_la_migration
```

12 migrations existantes (2026-02-25 → 2026-03-06).

### Edge Functions

```bash
# Déployer toutes les fonctions
supabase functions deploy

# Déployer une fonction spécifique
supabase functions deploy ai-coach

# Tester localement (requiert Docker)
supabase functions serve
```

8 Edge Functions déployées (voir `docs/api-contracts.md`).

---

## Déploiement

### Frontend — Cloudflare Pages

- Build command : `npm run build`
- Output directory : `dist`
- Redirect SPA : `public/_redirects` → `/* /index.html 200`
- Variables d'environnement : configurer dans Cloudflare Pages dashboard

### Backend — Supabase Cloud

- Migrations : `supabase db push`
- Edge Functions : `supabase functions deploy`
- Secrets : configurer via Dashboard Supabase > Edge Functions > Secrets

### Push Notifications

- Fonctionnent **uniquement en production** (`npm run build && npm run preview`)
- En dev : `pushManager.subscribe` échoue (module SW incompatible Chrome)
- Cron pour envoi quotidien à 7h : **pas encore câblé** (pg_cron ou cron-job.org)

---

## Tests

### Configuration

- Framework : **Vitest** v4.0
- Environment : `node`
- Pattern : `src/**/*.test.ts`
- Config : `vitest.config.ts`

### Tests existants

| Fichier | Contenu |
|---------|---------|
| `src/services/program/buildWeekProgram.test.ts` | Tests moteur programme |
| `src/services/program/programDataIntegrity.test.ts` | Intégrité données blocs/exercices |

**Résultat actuel :** 6/6 tests au vert.

### Couverture manquante

- Pas de tests E2E
- Pas de golden master / snapshot testing
- Pas de tests pour hooks, pages, ou Edge Functions
- Pas de CI pipeline (lint + test + build automatisé sur PR)

---

## Conventions de code

| Convention | Détail |
|-----------|--------|
| Langage code | TypeScript strict |
| Langage UI/docs | Français |
| CSS | Tailwind CSS v4 utility-first (pas de CSS custom) |
| State | React Context (global) + hooks custom (local) — pas de Redux |
| Services | Fonctions pures, pas de side effects |
| Données statiques | JSON/TS dans `src/data/` |
| Connaissances | Markdown dans `src/knowledge/` |
| Hooks | `src/hooks/` (sync localStorage ↔ Supabase) |
| Naming | camelCase (variables), PascalCase (composants/types) |
| Commits | Messages concis en français ou anglais |

---

## Architecture clé à connaître

1. **`buildWeekProgram()`** est la seule entrée du moteur de programme — ne jamais appeler `buildSessionFromRecipe` directement dans les pages
2. **Local-first** : lecture immédiate localStorage, sync Supabase en arrière-plan
3. **RLS Supabase** : toutes les tables user-scoped ont des policies `auth.uid() = user_id`
4. **Edge Functions** : pattern `_shared/supabase.ts` pour dual client (user + service role)
5. **PWA** : `vite-plugin-pwa` avec `injectManifest` strategy, service worker dans `src/sw.ts`

---

## Bundle

- Build principal : ~1.68 MB minifié (~470 kB gzip)
- Warning CSS minify autour de `"[file:line]"` (cosmétique, à investiguer)
- Code-splitting non encore optimisé
