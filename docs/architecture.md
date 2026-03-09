# RugbyForge — Architecture

**Date :** 2026-03-09
**Type :** Monolithe SPA + Backend-as-a-Service

---

## Résumé exécutif

RugbyForge est une PWA de préparation physique pour joueurs de rugby. L'application génère des programmes d'entraînement personnalisés via un moteur déterministe, avec suivi de charge (ACWR), tests physiques, coaching IA, et modèle freemium via Stripe.

L'architecture sépare strictement :
- **Frontend** : SPA React 19 déployée sur Cloudflare Pages (edge)
- **Backend** : Supabase Cloud (Auth, PostgreSQL, Edge Functions Deno)
- **Moteur programme** : logique pure côté client, déterministe, sans dépendance réseau

---

## Stack technologique

| Couche | Technologie | Version |
|--------|------------|---------|
| UI Framework | React | 19.2 |
| Langage | TypeScript | ~5.9 |
| Bundler | Vite | 7.2 |
| CSS | Tailwind CSS | 4.1 |
| Routing | react-router-dom | 7.13 |
| Charting | Recharts | 3.7 |
| Animation | Framer Motion | 12.34 |
| Icônes | Lucide React | 0.574 |
| Analytics | PostHog | 1.357 |
| Backend | Supabase JS SDK | 2.97 |
| Paiement | Stripe (via Edge Functions) | — |
| PWA | vite-plugin-pwa + Workbox | 1.2 / 7.4 |
| Tests | Vitest | 4.0 |
| Lint | ESLint 9 + Prettier | 9.39 / 3.8 |

---

## Diagramme d'architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLOUDFLARE PAGES                    │
│  ┌───────────────────────────────────────────────┐   │
│  │              SPA React 19 (PWA)                │   │
│  │                                                │   │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────┐  │   │
│  │  │  Pages   │  │Components│  │   Contexts   │  │   │
│  │  │  (14)    │  │  (10+)   │  │ Auth + Week  │  │   │
│  │  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │   │
│  │       │              │               │          │   │
│  │  ┌────▼──────────────▼───────────────▼──────┐  │   │
│  │  │              Hooks (18+)                  │  │   │
│  │  │  useProfile, useHistory, useACWR, ...     │  │   │
│  │  │  (localStorage ↔ Supabase sync)           │  │   │
│  │  └────┬──────────────────────────────┬──────┘  │   │
│  │       │                              │          │   │
│  │  ┌────▼────────────┐  ┌──────────────▼──────┐  │   │
│  │  │  Services purs   │  │  Données statiques  │  │   │
│  │  │  buildWeekProgram│  │  88 blocs, 192 exos │  │   │
│  │  │  estimateOneRM   │  │  24 recettes        │  │   │
│  │  │  (déterministe)  │  │  18 fichiers KB     │  │   │
│  │  └─────────────────┘  └─────────────────────┘  │   │
│  └───────────────────────────────────────────────┘   │
│           │ supabase-js (ANON_KEY)                    │
└───────────┼──────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────┐
│                  SUPABASE CLOUD                       │
│                                                       │
│  ┌────────────┐  ┌─────────────────────────────┐    │
│  │    Auth     │  │     PostgreSQL + RLS         │    │
│  │  (email,    │  │                              │    │
│  │   OAuth)    │  │  profiles, session_logs,     │    │
│  └────────────┘  │  block_logs, match_calendar,  │    │
│                   │  athletic_tests, plans,       │    │
│                   │  user_subscriptions,          │    │
│                   │  user_entitlements,           │    │
│                   │  push_subscriptions, ...      │    │
│                   │  (13 tables, RLS enforced)    │    │
│                   └─────────────────────────────┘    │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │          Edge Functions (Deno)               │    │
│  │                                              │    │
│  │  ai-coach ──────────────→ Claude API         │    │
│  │  create-checkout-session ─→ Stripe API       │    │
│  │  billing-webhook ←──────── Stripe Webhooks   │    │
│  │  sync-checkout-session ──→ Stripe API        │    │
│  │  register-push-subscription                  │    │
│  │  unsubscribe-push                            │    │
│  │  send-training-reminders (queue, pas live)   │    │
│  │  notify-training (VAPID push, pas câblé)     │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
            │                        │
            ▼                        ▼
┌────────────────┐       ┌──────────────────┐
│  Anthropic API  │       │   Stripe API      │
│  (Claude Haiku) │       │  (Checkout,       │
│  max 800 tokens │       │   Webhooks,       │
│                 │       │   Subscriptions)  │
└────────────────┘       └──────────────────┘
```

---

## Patterns architecturaux

### 1. Moteur de programme déterministe

Le cœur de l'application est `buildWeekProgram()` — une fonction pure qui prend un profil et une semaine et retourne des sessions.

```
Entrée: UserProfile × CycleWeek × Options(fatigueLevel, ACWR)
  │
  ├─ Routing trainingLevel → recettes (starter/builder/performance)
  ├─ Routing seasonMode → phase (off→HYPER, pre→FORCE, in→cycle normal)
  ├─ Override rehabInjury → recettes REHAB_*_P#_V1
  ├─ Budget ACWR → réduction sessions (danger: -1, critical: 1 max)
  └─ Cross-session exclusion → pas de doublon d'intent dans la semaine
  │
Sortie: WeekProgramResult { sessions[], warnings[] }
```

**Règle critique :** l'IA ne contrôle jamais la structure du programme. L'algorithme garde le contrôle structurel, l'IA ajoute uniquement explication/conseil.

### 2. Local-first avec sync

```
Écriture: localStorage (immédiat) + Supabase (fire-and-forget)
Lecture: localStorage (immédiat) → Supabase lazy-load sur userId change
Offline: app fonctionne sur localStorage seul
```

Chaque hook data (useProfile, useHistory, useCalendar, etc.) suit ce pattern avec un STORAGE_KEY dédié et une table Supabase correspondante.

### 3. Entitlements-based feature gating

```
Plans (3) → Plan Entitlements → User Subscriptions → User Entitlements
  free        program_basic       stripe/manual         active/revoked
  monthly     premium_analytics   active/canceled
  yearly      coach_mode
```

- Trigger SQL : nouveau profil → `grant_default_free_entitlements()`
- Webhook Stripe → billing-webhook → UPSERT subscriptions + entitlements
- Frontend : `useEntitlements()` → `useFeatureAccess()` → boolean flags

### 4. Edge Functions comme API layer

Pattern uniforme :
1. CORS via `_shared/http.ts`
2. Auth via `_shared/supabase.ts` (dual client: user RLS + service role)
3. Stripe via `_shared/stripe.ts` (price mapping, signature verification)
4. Réponse toujours JSON `{ ok, error?, ... }`

---

## Cycle de périodisation

```
Phase HYPERTROPHY: H1 → H2 → H3 → H4 (deload)
Phase FORCE:       W1 → W2 → W3 → W4 (deload)
Phase POWER:       W5 → W6 → W7 → W8 (deload)
DELOAD
```

- Starter : toujours 2 sessions/semaine (UPPER_STARTER + LOWER_STARTER), pas affecté par seasonMode
- Builder : suit cycle H1-H4 avec blocs supersets
- Performance : cycle complet avec conditioning off/pré-saison

---

## Monitoring charge (ACWR)

Basé sur Hulin et al. 2016 :
- Acute load = somme RPE × durée sur 7 jours (sessions + matchs)
- Chronic load = moyenne hebdo sur 4 semaines
- ACWR = acute / chronic

| Zone | Seuil | Action moteur |
|------|-------|---------------|
| underload | < 0.8 | — |
| optimal | 0.8–1.3 | — |
| caution | 1.3–1.5 | — |
| danger | > 1.5 | -1 session |
| critical | > 2.0 | 1 session max (mobilité) |

---

## Sécurité

| Couche | Mécanisme |
|--------|-----------|
| Auth | Supabase Auth (email/password, OAuth) |
| DB | RLS sur toutes les tables (`auth.uid() = user_id`) |
| Edge Functions | JWT Bearer (user-initiated) ou secrets partagés (webhooks/cron) |
| Stripe | Signature HMAC-SHA256 avec tolérance 5min |
| Push | VAPID (RFC 8292) + AES-128-GCM (RFC 8188) |
| Frontend | Clé anon (publique), pas de secret côté client |

**Principe :** la sécurité n'est jamais derrière le paywall. Le premium débloque analytics, suggestions, coaching avancé — pas la protection des données.

---

## Données scientifiques embarquées

18 fichiers Markdown dans `src/knowledge/` (~3700+ lignes, 186+ références) couvrant :
- Périodisation, force, puissance, récupération, nutrition
- Prévention blessures, systèmes énergétiques, tests physiques
- Monitoring équipe, budgets de charge, retour au jeu
- Red flags médicaux, registre de seuils, populations spécifiques

Utilisées par le system prompt ai-coach et comme référence pour les décisions du moteur.

---

## Limites connues

| Domaine | Limite | Impact |
|---------|--------|--------|
| CI/CD | Aucun pipeline automatisé | Risque régression |
| E2E | Aucun scénario automatisé | Pas de validation parcours complet |
| Push | Transport non câblé au cron | Notifications non envoyées |
| Bundle | ~1.68 MB minifié (470 kB gzip) | Chargement initial lent |
| Tests | 6 tests unitaires seulement | Couverture faible |
| Chat IA | Pas de quota visible dans le code | Risque coût API non maîtrisé |
| Blocs BW | Edge cases starter+shoulder_pain+BW | Slot upper toujours en [SAFETY] |

---

## Décisions architecturales

| Décision | Justification |
|----------|---------------|
| Moteur déterministe côté client | Fonctionne offline, testable, pas de latence réseau |
| Supabase vs API custom | Rapidité de mise en marché, Auth + DB + Edge Functions intégrés |
| localStorage + Supabase sync | UX immédiate + persistance multi-device |
| Pas de Redux/Zustand | Complexité non justifiée — 2 contextes + hooks suffisent |
| Tailwind sans component library | Flexibilité totale, pas de dépendance UI tierce |
| KB en Markdown | Lisible par les agents IA, versionné avec le code |
| Edge Functions Deno | Léger, déploiement Supabase natif, TypeScript |
