# RugbyForge — Index Documentation

**Dernière mise à jour :** 2026-03-09
**Type :** Monolithe SPA (React 19 + TypeScript + Supabase)
**Architecture :** SPA component-based, moteur déterministe, local-first sync

Ce dossier est la base de connaissance projet lue en priorité par les workflows BMAD et les agents IA.

---

## Référence rapide

- **Stack :** React 19 + Vite 7 + TypeScript 5.9 + Tailwind 4 + Supabase + Stripe + PostHog
- **Entrée moteur :** `buildWeekProgram()` — seule source de vérité programme
- **Cycle :** H1–H4 → W1–W4 → W5–W8 → DELOAD
- **Déploiement :** Cloudflare Pages (frontend) + Supabase Cloud (backend)

---

## Documentation générée (scan 2026-03-09)

- **[project-overview.md](./project-overview.md)** — Résumé exécutif, stack, statut, fonctionnalités, risques
- **[architecture.md](./architecture.md)** — Diagramme, patterns (moteur déterministe, local-first, entitlements), décisions
- **[api-contracts.md](./api-contracts.md)** — 8 Edge Functions Supabase documentées (ai-coach, Stripe, push)
- **[data-models.md](./data-models.md)** — 13 tables PostgreSQL, types TypeScript, données statiques
- **[component-inventory.md](./component-inventory.md)** — State management, 14 pages, 10+ composants, services
- **[source-tree-analysis.md](./source-tree-analysis.md)** — 110+ fichiers annotés, répertoires critiques
- **[development-guide.md](./development-guide.md)** — Prérequis, setup, commandes, déploiement, conventions, tests
- **[project-scan-report.json](./project-scan-report.json)** — Fichier d'état du scan (workflow BMAD)

---

## Documents canoniques (écrits manuellement)

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** — État actuel du produit, risques, milestones, écarts connus
- **[BMAD_HELP_CONTEXT.md](./BMAD_HELP_CONTEXT.md)** — Mémo projet pour `/bmad-help`
- **[backend-roadmap.md](./backend-roadmap.md)** — Source de vérité backend, entitlements, notifications, billing
- **[feature-access-matrix.md](./feature-access-matrix.md)** — Séparation free / premium validée côté produit

---

## Documentation domaine

### training/

- **[PROGRAM-ENGINE.md](./training/PROGRAM-ENGINE.md)** — Règles déterministes du moteur de génération
- **[PROGRAM-CYCLE.md](./training/PROGRAM-CYCLE.md)** — Cycle réel H1–H4 → W1–W8 → DELOAD
- **[GLOSSARY.md](./training/GLOSSARY.md)** — Glossaire termes d'entraînement (EMOM, RER, etc.)
- **[EXERCISE-METRICS-CHECKLIST.md](./training/EXERCISE-METRICS-CHECKLIST.md)** — Checklist métriques exercices par type
- **[METRIC-TYPES.md](./training/METRIC-TYPES.md)** — Types de métriques (load_reps, duration, distance, etc.)

### auth/

- **[AUTH-SUPABASE.md](./auth/AUTH-SUPABASE.md)** — Migration auth vers Supabase, session, routes protégées

### data/

- **[FFR_CLUB_LISTE_PARSE.md](./data/FFR_CLUB_LISTE_PARSE.md)** — Parsing 1471 clubs FFR depuis PDF
- **[CLUB-LOGOS.md](./data/CLUB-LOGOS.md)** — Sources logos clubs (Wikidata + manual overrides)
- **[CLUB-LOGOS-FETCH-REPORT.md](./data/CLUB-LOGOS-FETCH-REPORT.md)** — Rapport fetch IDs FFR par ligue
- **[rugby_exercices_bibliotheque.docx](./data/rugby_exercices_bibliotheque.docx)** — Bibliothèque exercices rugby (Word)

### game-design/ (futur)

- **[GAMIFICATION_VISION.md](./game-design/GAMIFICATION_VISION.md)** — Vision gamification RPG Lite
- **[RPG_SYSTEM_V1_1.md](./game-design/RPG_SYSTEM_V1_1.md)** — Système progression RPG (draft)
- **[AVATAR_SYSTEM.md](./game-design/AVATAR_SYSTEM.md)** — Système avatar visuel (feedback progression)

### illustrations/

- **[bench-press-pack/README.md](./illustrations/bench-press-pack/README.md)** — Prototype illustrations pédagogiques bench press
- **[bench-press-profile.svg](./illustrations/bench-press-pack/bench-press-profile.svg)** — Vue profil avec trajectoire
- **[bench-press-dual-view.svg](./illustrations/bench-press-pack/bench-press-dual-view.svg)** — Vue profil + inset face
- **[bench-press-steps.svg](./illustrations/bench-press-pack/bench-press-steps.svg)** — Fiche 3 étapes

---

## Documents secondaires / historiques

- **[GUIDES_PRE_DEPLOIEMENT.md](./GUIDES_PRE_DEPLOIEMENT.md)** — Guide pré-déploiement (Stripe, domaine, stores)
- **[ETAT_DES_LIEUX_V1.md](./ETAT_DES_LIEUX_V1.md)** — État des lieux historique (ne pas utiliser comme source de vérité)
- **[CALENDRIER_PROGRESSION.md](./CALENDRIER_PROGRESSION.md)** — Spec calendrier et suivi progression

---

## Base de connaissance scientifique

18 fichiers dans `src/knowledge/` (~3700+ lignes, 186+ références) :
- periodization, strength-methods, recovery, nutrition, injury-prevention
- energy-systems, athletic-testing, team-monitoring, load-budgeting
- medical-red-flags, evidence-register, return-to-play-criteria
- population-specific, off-season-periodization, beginner-programming
- beginner-intermediate-training, double-match-weeks

Voir `src/knowledge/README.md` pour l'index complet.

---

## Règles de lecture

1. Si deux documents se contredisent, privilégier :
   1. le **code source**
   2. `PROJECT_STATUS.md`
   3. les docs `training/*` et `backend-roadmap.md`
2. Les anciens états des lieux servent d'**historique**, pas de source de vérité
3. Les documents générés (scan 2026-03-09) reflètent l'état du code à cette date
