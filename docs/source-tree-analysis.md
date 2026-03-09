# RugbyForge — Arbre source annoté

**Date :** 2026-03-09

---

```
RugbyPrepV2/
├── index.html                          # Point d'entrée HTML (SPA)
├── package.json                        # Manifeste npm (React 19, Vite 7, Tailwind 4)
├── vite.config.ts                      # Config Vite + PWA (injectManifest) + Tailwind plugin
├── vitest.config.ts                    # Config tests (env: node, src/**/*.test.ts)
├── tsconfig.json                       # TS project references (app + node)
├── eslint.config.js                    # ESLint 9 flat config + Prettier
│
├── src/                                # ====== CODE SOURCE FRONTEND ======
│   ├── main.tsx                        # ★ ENTRY POINT: React root + PostHog init
│   ├── App.tsx                         # ★ ROUTING: BrowserRouter + AuthProvider + Routes
│   ├── sw.ts                           # Service Worker (Workbox injectManifest)
│   ├── index.css                       # Styles globaux
│   ├── styles/global.css               # Tailwind imports
│   │
│   ├── types/                          # === TYPES TYPESCRIPT ===
│   │   ├── training.ts                 # ★ Types cœur: Equipment, Contra, CycleWeek, UserProfile, SessionLog, BlockLog, etc.
│   │   ├── athleticTesting.ts          # PhysicalTestType, PhysicalTest, PositionBaseline
│   │   ├── auth.ts                     # AuthUser, AuthState, AuthError
│   │   └── result.ts                   # Result<T,E> type
│   │
│   ├── contexts/                       # === CONTEXTES REACT GLOBAUX ===
│   │   ├── AuthContext.tsx              # ★ Provider auth global (signUp, signIn, signOut, avatar)
│   │   ├── authContextValue.ts         # Logique AuthContext extraite
│   │   ├── WeekProvider.tsx            # Provider semaine (CycleWeek + lastNonDeloadWeek)
│   │   ├── weekContext.ts              # Définition context Week
│   │   └── weekStorage.ts             # Persistence localStorage semaine
│   │
│   ├── hooks/                          # === HOOKS CUSTOM ===
│   │   ├── useProfile.ts              # ★ Profil utilisateur (localStorage + Supabase sync)
│   │   ├── useHistory.ts              # ★ Historique sessions (session_logs)
│   │   ├── useBlockLogs.ts            # Logs exercices par bloc (block_logs)
│   │   ├── useCalendar.ts             # Calendrier matchs (match_calendar)
│   │   ├── useAthleteTests.ts         # Tests physiques (athletic_tests)
│   │   ├── useACWR.ts                 # ★ Monitoring charge ACWR (calcul acute/chronic)
│   │   ├── useFatigue.ts              # État fatigue (OK/FATIGUE)
│   │   ├── useWeek.ts                 # Wrapper WeekContext
│   │   ├── useAuth.ts                 # Wrapper AuthContext
│   │   ├── useAICoach.ts              # Appel Edge Function ai-coach
│   │   ├── useEntitlements.ts         # Droits premium (user_entitlements)
│   │   ├── useFeatureAccess.ts        # Wrapper boolean features
│   │   ├── usePremiumCheckout.ts      # Flow Stripe checkout
│   │   ├── useNotifications.ts        # Web Push subscribe/unsubscribe
│   │   ├── useAnalytics.ts            # PostHog tracking
│   │   ├── useViewMode.ts             # Compact/detail toggle
│   │   ├── useAcwrOverride.ts         # Override ACWR danger/critical
│   │   └── useAcwrBlockCollapsed.ts   # UI collapse widget ACWR
│   │
│   ├── pages/                          # === PAGES (14 routes) ===
│   │   ├── HomePage.tsx               # Dashboard principal
│   │   ├── WeekPage.tsx               # ★ VUE CŒUR: sessions générées + ACWR + deload
│   │   ├── SessionDetailPage.tsx      # Détail session + logging exercices
│   │   ├── ProgramPage.tsx            # Vue cycle 12 semaines (H1→W8→DELOAD)
│   │   ├── ProgressPage.tsx           # 2 onglets: progression sessions + tests physiques
│   │   ├── HistoryPage.tsx            # Timeline sessions complétées
│   │   ├── CalendarPage.tsx           # Calendrier matchs + RPE/durée
│   │   ├── ChatPage.tsx               # Coach IA multi-turn + sync Stripe post-paiement
│   │   ├── MobilityPage.tsx           # Sessions mobilité/récupération
│   │   ├── ProfilePage.tsx            # Paramètres complets (equipment, injuries, level, season, rehab, notifs)
│   │   ├── OnboardingPage.tsx         # Setup première connexion
│   │   ├── LegalPage.tsx              # CGU + Politique confidentialité
│   │   └── auth/
│   │       ├── LoginPage.tsx          # Connexion email/password
│   │       ├── SignupPage.tsx         # Inscription
│   │       └── CallbackPage.tsx       # OAuth redirect
│   │
│   ├── components/                     # === COMPOSANTS RÉUTILISABLES ===
│   │   ├── BottomNav.tsx              # Nav fixe 5 items (Home, Week, Chat, Calendar, Profile)
│   │   ├── PageHeader.tsx             # Bannière titre + retour
│   │   ├── SessionView.tsx            # ★ Rendu session complet (blocs, exercices, métriques)
│   │   ├── Modal.tsx                  # Wrapper modal générique
│   │   ├── GymDaySelector.tsx         # Sélection multi-jours
│   │   ├── ViewModeToggle.tsx         # Toggle compact/detail
│   │   ├── PremiumUpsellCard.tsx      # Prompt upgrade premium
│   │   ├── RugbyForgeLogo.tsx         # Logo branding
│   │   ├── auth/
│   │   │   └── RequireAuth.tsx        # Route guard → redirect /auth/login
│   │   └── modals/
│   │       ├── ProfileModal.tsx       # Édition profil inline
│   │       ├── RPEModal.tsx           # Saisie effort 1-10
│   │       └── WeekObjectiveModal.tsx # Objectif hebdo
│   │
│   ├── services/                       # === SERVICES (logique pure, pas de side effects) ===
│   │   ├── program/                   # ★ MOTEUR DE PROGRAMME
│   │   │   ├── buildWeekProgram.ts    # ★★ ENTRÉE UNIQUE: profil × semaine → sessions
│   │   │   ├── buildWeekProgram.test.ts # Tests moteur (Vitest)
│   │   │   ├── buildSessionFromRecipe.ts # Recette → session construite
│   │   │   ├── buildSession.ts        # Construction session bas niveau
│   │   │   ├── selectEligibleBlocks.ts # Filtre blocs (equipment, contra, position)
│   │   │   ├── validateSession.ts     # Vérification post-build
│   │   │   ├── buildMobilitySession.ts # Session récupération/mobilité
│   │   │   ├── programPhases.v1.ts    # getPhaseForWeek(), getCycleWeekNumber()
│   │   │   ├── positionPreferences.v1.ts # Pondération exercices par poste rugby
│   │   │   ├── positionPreferences.ts # Legacy
│   │   │   ├── scheduleOptimizer.ts   # Recommandation jours SC
│   │   │   ├── programDataIntegrity.test.ts # Tests intégrité données
│   │   │   ├── index.ts              # Barrel export
│   │   │   ├── README.md             # Documentation moteur
│   │   │   └── __devChecks__/        # Utilitaires dev (cycle diff, rotation, position)
│   │   │       ├── cycleDiffCheck.ts
│   │   │       ├── positionDiffCheck.ts
│   │   │       └── rotationStabilityCheck.ts
│   │   ├── ui/                        # SERVICES UI
│   │   │   ├── suggestions.ts        # getExerciseSuggestion() (charge/reps)
│   │   │   ├── progression.ts        # Historique progression exercices
│   │   │   ├── coachCues.ts          # Messages coaching RER
│   │   │   ├── formatTraining.ts     # formatBlockVolume(), getEmomDisplay()
│   │   │   ├── recommendations.ts    # shouldRecommendDeload()
│   │   │   ├── exerciseMetrics.ts    # getExerciseMetricType()
│   │   │   ├── applyDeload.ts        # Réduction volume %
│   │   │   ├── getPrehab.ts          # Suggestions prehab
│   │   │   ├── clubLogos.ts          # getClubLogoUrl(), getClubMonogram()
│   │   │   ├── imageCrop.ts          # Crop avatar
│   │   │   └── __devChecks__/        # Vérifications dev UI
│   │   │       ├── emomDisplayCheck.ts
│   │   │       └── metricOverrideCheck.ts
│   │   ├── athleticTesting/           # TESTS PHYSIQUES
│   │   │   ├── estimateOneRM.ts      # Formules Brzycki/Epley
│   │   │   └── getPositionBaseline.ts # Baselines par poste × niveau
│   │   ├── auth/
│   │   │   └── authService.ts        # Wrapper Supabase Auth
│   │   ├── analytics/
│   │   │   └── posthog.ts            # PostHog init + events
│   │   └── supabase/
│   │       └── client.ts             # ★ Client Supabase initialisé (anon key)
│   │
│   ├── data/                           # === DONNÉES STATIQUES ===
│   │   ├── blocks.v1.json            # ★ 88 TrainingBlocks (7094 lignes)
│   │   ├── exercices.v1.json         # ★ 192+ exercices (2701 lignes)
│   │   ├── sessionRecipes.v1.ts      # ★ 24 recettes de session (routing programme)
│   │   ├── exercises.ts              # Index exercices (getExerciseName, getExerciseById)
│   │   ├── prehab.v1.json            # Exercices prehab
│   │   ├── weekGuidance.v1.ts        # Guidance par semaine (H1-H4, W1-W8, DELOAD)
│   │   ├── exerciseMetricOverrides.v1.ts # Overrides métriques par exercice
│   │   ├── fakeDataForProgress.ts    # Données demo + seedDemoData()
│   │   ├── ffrClubs.v2021.json       # Clubs FFR
│   │   ├── clubFfrIds.json           # IDs FFR clubs
│   │   ├── clubLogos.manual.json     # Logos manuels
│   │   ├── clubLogos.wikidata.json   # Logos Wikidata
│   │   └── README.md
│   │
│   └── knowledge/                      # === BASE DE CONNAISSANCE SCIENTIFIQUE (18 fichiers) ===
│       ├── README.md                  # Index KB
│       ├── periodization.md           # Périodisation
│       ├── strength-methods.md        # Méthodes de force
│       ├── recovery.md                # Récupération
│       ├── nutrition.md               # Nutrition
│       ├── injury-prevention.md       # Prévention blessures
│       ├── energy-systems.md          # Systèmes énergétiques
│       ├── athletic-testing.md        # Tests physiques (CMJ, sprint, YYIR1, 1RM)
│       ├── team-monitoring.md         # Monitoring équipe (ACWR collectif)
│       ├── load-budgeting.md          # Budgets de charge
│       ├── medical-red-flags.md       # Drapeaux rouges médicaux
│       ├── evidence-register.md       # Registre des seuils (ACWR, LSI, 1RM)
│       ├── return-to-play-criteria.md # Retour au jeu (P1→P2→P3)
│       ├── population-specific.md     # Femmes, U18, retour longue coupure
│       ├── off-season-periodization.md # Calendrier inter-saison
│       ├── beginner-programming.md    # Programmation débutant
│       ├── beginner-intermediate-training.md # Transition débutant→intermédiaire
│       └── double-match-weeks.md      # Semaines double match
│
├── supabase/                           # ====== BACKEND SUPABASE ======
│   ├── functions/                     # === EDGE FUNCTIONS DENO ===
│   │   ├── _shared/                   # Utilitaires partagés
│   │   │   ├── http.ts               # CORS headers + json helper
│   │   │   ├── supabase.ts           # createClients(), requireUser()
│   │   │   └── stripe.ts             # Price mapping, stripeRequest(), signature verification
│   │   ├── ai-coach/index.ts         # Chat coaching IA (Claude haiku)
│   │   ├── create-checkout-session/index.ts # Stripe Checkout
│   │   ├── billing-webhook/index.ts  # Webhook Stripe → sync abonnements
│   │   ├── sync-checkout-session/index.ts # Sync post-paiement
│   │   ├── register-push-subscription/index.ts # Enregistrement push
│   │   ├── unsubscribe-push/index.ts # Désinscription push
│   │   ├── send-training-reminders/index.ts # Scheduler rappels (queue, pas encore live)
│   │   └── notify-training/index.ts  # Envoi Web Push (VAPID, pas encore câblé cron)
│   │
│   └── migrations/                    # === MIGRATIONS SQL (12) ===
│       ├── 20260225_push_subscriptions.sql
│       ├── 20260226_user_data.sql             # profiles, session_logs, block_logs + RLS
│       ├── 20260226_profiles_morpho.sql       # height_cm, weight_kg
│       ├── 20260227_match_calendar.sql        # match_calendar + RLS
│       ├── 20260227_profiles_onboarding.sql   # onboarding_complete
│       ├── 20260228_profiles_schedule.sql     # club_schedule, sc_schedule (jsonb)
│       ├── 20260301_profiles_training_level.sql # training_level, season_mode
│       ├── 20260302_match_calendar_load.sql   # rpe, duration_min sur match_calendar
│       ├── 20260303_session_type_conditioning.sql # session_type CONDITIONING
│       ├── 20260304_profiles_rehab_injury.sql # rehab_injury (jsonb)
│       ├── 20260305_athletic_tests.sql        # athletic_tests + RLS
│       └── 20260306_backend_foundation.sql    # ★ plans, plan_entitlements, user_subscriptions, user_entitlements, notification_preferences, notification_delivery_logs, grant_default_free_entitlements()
│
├── public/                             # ====== ASSETS STATIQUES ======
│   ├── _redirects                     # Cloudflare Pages SPA redirect
│   ├── favicon.ico
│   ├── icons/icon-192.png, icon-512.png # PWA icons
│   ├── vite.svg
│   └── club-logos/                    # Logos clubs FFR (9 images)
│
├── scripts/                            # ====== SCRIPTS UTILITAIRES ======
│   ├── parseFfrClubs.mjs             # Parse clubs FFR
│   ├── fetchClubLogos.mjs            # Fetch logos clubs
│   ├── fetchLeagueClubFfrIds.mjs     # IDs FFR par ligue
│   └── validateClubLogosManual.mjs   # Validation logos manuels
│
├── docs/                               # ====== DOCUMENTATION PROJET ======
│   ├── index.md                       # ★ Index documentation principal
│   ├── PROJECT_STATUS.md              # ★ Statut projet canonique
│   ├── BMAD_HELP_CONTEXT.md           # Mémo BMAD help
│   ├── backend-roadmap.md             # Roadmap backend
│   ├── feature-access-matrix.md       # Matrice free/premium
│   ├── training/                      # Docs moteur de programme
│   ├── auth/                          # Docs auth Supabase
│   ├── game-design/                   # Vision gamification (futur)
│   └── data/                          # Docs données FFR/clubs
│
└── _bmad/                              # ====== BMAD FRAMEWORK ======
    ├── bmm/                           # Module méthode BMM
    ├── core/                          # Core BMAD (workflows, tasks)
    ├── bmb/                           # Module builder
    ├── cis/                           # Module innovation/créativité
    ├── gds/                           # Module game dev
    └── tea/                           # Module test architect
```

---

## Répertoires critiques

| Répertoire | Rôle | Criticité |
|-----------|------|-----------|
| `src/services/program/` | Moteur de génération de programme — cœur algorithmique | **Critique** |
| `src/types/` | Contrats de types partagés (training, auth, athletic) | **Critique** |
| `src/data/` | Données statiques (88 blocs, 192+ exercices, 24 recettes) | **Critique** |
| `src/hooks/` | Couche données React (18 hooks, sync localStorage↔Supabase) | **Élevé** |
| `supabase/functions/` | API backend (8 Edge Functions Deno) | **Élevé** |
| `supabase/migrations/` | Schéma DB source de vérité (12 migrations) | **Élevé** |
| `src/pages/` | 14 pages UI (WeekPage = vue principale) | **Moyen** |
| `src/knowledge/` | KB scientifique (18 fichiers, ~3700+ lignes, 186+ refs) | **Moyen** |
| `src/components/` | Composants réutilisables (10+) | **Moyen** |
| `docs/` | Documentation projet | **Support** |

## Points d'entrée

| Fichier | Rôle |
|---------|------|
| `src/main.tsx` | Bootstrap React + PostHog |
| `src/App.tsx` | Router + AuthProvider |
| `src/services/program/buildWeekProgram.ts` | Entrée unique moteur programme |
| `src/sw.ts` | Service Worker PWA |
| `supabase/functions/*/index.ts` | Points d'entrée Edge Functions |
