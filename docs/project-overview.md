# RugbyForge — Vue d'ensemble projet

**Date :** 2026-03-09

---

## Qu'est-ce que RugbyForge ?

RugbyForge est une **PWA de préparation physique** conçue pour les joueurs de rugby. L'application génère automatiquement des programmes d'entraînement personnalisés en fonction du profil du joueur, de son matériel disponible, de ses blessures, et de sa charge de travail réelle.

**Proposition de valeur :** un préparateur physique dans la poche, adapté au rugby, avec un moteur algorithmique scientifiquement fondé.

---

## Statut actuel

**Stade : produit fonctionnel déployé** — pas encore release industrialisée.

| Domaine | État |
|---------|------|
| App principale | En production (Cloudflare Pages) |
| Moteur de programme | Opérationnel (déterministe, 88 blocs, 192+ exercices) |
| Auth + profils | En place (Supabase Auth) |
| Billing Stripe | Validé de bout en bout (checkout, webhook, sync) |
| Free vs Premium | Partiellement produitisé |
| Coach IA | Opérationnel (Claude Haiku, multi-turn) |
| ACWR + monitoring | Opérationnel (sessions + matchs) |
| Tests physiques | Opérationnel (CMJ, sprint, 1RM, YYIR1, Hooper) |
| Mobilité & réhab | Opérationnel (8 exercices, 3 phases réhab) |
| Push notifications | Infrastructure en place, transport non câblé |
| Landing page | À faire |
| CI/CD | Absent |
| E2E | Absent |

---

## Stack technique résumée

| Couche | Technologie |
|--------|------------|
| Frontend | React 19 + TypeScript + Vite 7 + Tailwind CSS 4 |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions Deno) |
| Paiement | Stripe (Checkout, Webhooks, Subscriptions) |
| IA | Claude Haiku via Edge Function ai-coach |
| Analytics | PostHog |
| PWA | vite-plugin-pwa + Workbox |
| Tests | Vitest (6 tests unitaires) |
| Déploiement | Cloudflare Pages (frontend) + Supabase Cloud (backend) |

---

## Architecture en un coup d'œil

```
Cloudflare Pages (SPA React PWA)
    ↕ supabase-js (ANON_KEY, RLS)
Supabase Cloud (Auth + PostgreSQL + Edge Functions)
    ↕
Stripe API + Anthropic API (Claude)
```

**Pattern clé :** moteur de programme déterministe côté client, local-first (localStorage + Supabase sync), entitlements-based feature gating.

---

## Fonctionnalités principales

### Cœur métier
- Programme personnalisé par niveau (Starter / Builder / Performance)
- Cycle périodisation : H1-H4 → W1-W4 → W5-W8 → DELOAD
- Mode saison (in / off / pre-season) avec routing phase adapté
- Monitoring charge ACWR (acute/chronic, zones, réduction automatique)
- Protocoles réhab (upper/lower, phases P1→P2→P3)
- Sessions mobilité et conditionnement
- Tests physiques avec baselines par poste

### Expérience utilisateur
- 14 pages : dashboard, programme semaine, détail session, progression, historique, calendrier, chat IA, mobilité, profil, onboarding
- Saisie exercices (charge, reps, durée, RPE)
- Calendrier matchs avec input charge (RPE × durée → ACWR)
- Coach IA conversationnel (deload, pré-session, chat libre)

### Monétisation
- Modèle freemium : programme/logs/historique gratuits
- Premium : analytics détaillées, suggestions automatiques, coaching avancé
- 3 plans : free, premium_monthly (9.99€), premium_yearly (99.90€)

---

## Documentation générée

| Document | Contenu |
|----------|---------|
| [Architecture](./architecture.md) | Diagramme, patterns, décisions, limites |
| [Contrats API](./api-contracts.md) | 8 Edge Functions documentées |
| [Modèle de données](./data-models.md) | 13 tables, types TS, données statiques |
| [Inventaire composants](./component-inventory.md) | State management, pages, composants, services |
| [Arbre source](./source-tree-analysis.md) | 110+ fichiers annotés |
| [Guide développement](./development-guide.md) | Setup, commandes, déploiement, conventions |

---

## Risques principaux

1. **Pas de CI/CD** — aucun pipeline automatisé lint/test/build sur PR
2. **Pas d'E2E** — aucun scénario automatisé de bout en bout
3. **Push non live** — infrastructure prête mais transport non câblé au cron
4. **Bundle lourd** — ~1.68 MB minifié (470 kB gzip), code-splitting à optimiser
5. **Couverture tests** — 6 tests unitaires seulement, pas de golden master
6. **Landing page** — acquisition non démarrée

---

## Milestones

1. **M1** — Base documentaire BMAD propre + project-context.md
2. **M2** — Landing page + copywriting + analytics conversion
3. **M3** — Tests moteur étendus + golden master + non-régression
4. **M4** — Push notifications réellement productisées
5. **M5** — CI sur lint+tests+build, premiers E2E, perf bundle
