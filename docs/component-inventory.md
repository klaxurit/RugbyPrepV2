# RugbyForge — Inventaire composants & state management

**Date :** 2026-03-09

---

## Architecture état (State Management)

### Contextes globaux

| Contexte | State | Portée | Persistence |
|----------|-------|--------|-------------|
| **AuthContext** | `AuthState` (authenticated \| anonymous), user info | Root (App.tsx) | Supabase session auto |
| **WeekContext** | `CycleWeek`, `lastNonDeloadWeek` | Root | localStorage `rugbyprep.week.v1` |

### Hooks custom — données persistantes (localStorage + Supabase)

| Hook | State | localStorage key | Table Supabase | Pattern |
|------|-------|-----------------|----------------|---------|
| useProfile | `UserProfile` | `rugbyprep.profile.v1` | profiles | Sync sur userId change |
| useHistory | `SessionLog[]` | `rugbyprep.history.v1` | session_logs | Lazy load Supabase |
| useBlockLogs | `BlockLog[]` | `rugbyprep.blocklogs.v1` | block_logs | Lazy load Supabase |
| useAthleteTests | `PhysicalTest[]` | `rugbyprep.athletictests.v1` | athletic_tests | Lazy load Supabase |
| useCalendar | `CalendarEvent[]` | `rugbyprep.calendar.v1` | match_calendar | Lazy load Supabase |

### Hooks custom — état dérivé/calculé

| Hook | Input | Output | Calcul |
|------|-------|--------|--------|
| useACWR | logs, matchEvents | acwr, zone, acuteLoad, chronicLoad | ACWR = acute 7j / chronic 4sem |
| useFatigue | — | 'OK' \| 'FATIGUE' | localStorage `rugbyprep.fatigue.v1` |
| useViewMode | — | 'compact' \| 'detail' | localStorage `rugbyprep.viewmode.v1` |
| useAcwrOverride | — | boolean | localStorage `rugbyprep.acwr.override.v1` |

### Hooks custom — abonnements/permissions

| Hook | Rôle |
|------|------|
| useEntitlements | Lecture user_entitlements + user_subscriptions |
| useFeatureAccess | Wrapper boolean (programBasic, premiumAnalytics, coachMode...) |
| useNotifications | Web Push setup (subscribe/unsubscribe via Edge Function) |
| usePremiumCheckout | Flow Stripe checkout |

### Hooks custom — IA/analytics

| Hook | Rôle |
|------|------|
| useAICoach | Appel Edge Function ai-coach (3 use cases) |
| useAnalytics | PostHog event tracking |

---

## Pages (src/pages/)

| Page | Route | Auth | Hooks principaux | Rôle |
|------|-------|------|-----------------|------|
| HomePage | `/` | Oui | useProfile, useHistory, useCalendar, useACWR | Dashboard principal |
| WeekPage | `/week` | Oui | useProfile, useWeek, useHistory, useACWR, useFatigue, useBlockLogs | **Vue cœur** : sessions + ACWR |
| SessionDetailPage | `/session/:idx` | Oui | useHistory, useBlockLogs, useProfile | Détail session + logging |
| ProgressPage | `/progress` | Oui | useBlockLogs, useAthleteTests, useProfile | 2 onglets (Sessions, Tests) + charts |
| HistoryPage | `/history` | Oui | useHistory | Timeline sessions |
| CalendarPage | `/calendar` | Oui | useCalendar, useHistory | Calendrier matchs + RPE |
| ChatPage | `/chat` | Oui | useAICoach, useHistory, useProfile, useACWR | Coach IA multi-turn |
| MobilityPage | `/mobility` | Oui | useProfile, useBlockLogs | Sessions récupération |
| ProfilePage | `/profile` | Oui | useProfile, useNotifications, useEntitlements | Paramètres complets |
| OnboardingPage | `/onboarding` | Oui | useProfile | Setup première connexion |
| ProgramPage | `/program` | Oui | useProfile, useWeek, useHistory | Vue cycle 12 semaines |
| LoginPage | `/auth/login` | Non | — | Connexion email/password |
| SignupPage | `/auth/signup` | Non | — | Inscription |
| CallbackPage | `/auth/callback` | Non | — | OAuth redirect |
| LegalPage | `/legal` | Non | — | CGU + Politique confidentialité |

---

## Composants réutilisables (src/components/)

### Layout
- `PageHeader.tsx` — Bannière titre + bouton retour
- `BottomNav.tsx` — Nav fixe (Home, Week, Chat, Calendar, Profile)
- `RugbyForgeLogo.tsx` — Branding

### Modals
- `Modal.tsx` — Wrapper modal générique
- `ProfileModal.tsx` — Édition profil inline
- `WeekObjectiveModal.tsx` — Objectif hebdo
- `RPEModal.tsx` — Saisie effort (1-10)

### Formulaires
- `GymDaySelector.tsx` — Sélection multi-jours

### Display
- `SessionView.tsx` — Rendu session complet (blocs, exercices, métriques, logging)
- `ViewModeToggle.tsx` — Switch compact ↔ détail

### Premium
- `PremiumUpsellCard.tsx` — Prompt upgrade premium

### Auth
- `RequireAuth.tsx` — Route guard (redirect /auth/login)

---

## Services (src/services/)

### Moteur de programme (src/services/program/)

| Service | Rôle |
|---------|------|
| `buildWeekProgram.ts` | **Entrée unique** : profil × semaine × options → sessions |
| `buildSessionFromRecipe.ts` | Recette → session (blocs sélectionnés) |
| `selectEligibleBlocks.ts` | Filtre blocs (equipment, contra, position) |
| `buildMobilitySession.ts` | Session récupération/mobilité |
| `validateSession.ts` | Vérification qualité post-build |
| `positionPreferences.v1.ts` | Pondération exercices par poste |
| `programPhases.v1.ts` | getPhaseForWeek(), getCycleWeekNumber() |
| `scheduleOptimizer.ts` | Recommandation jours entraînement |

### UI (src/services/ui/)

| Service | Rôle |
|---------|------|
| `suggestions.ts` | getExerciseSuggestion() — charge/reps |
| `progression.ts` | getExerciseRecentHistory(), getDeltaW1W4() |
| `coachCues.ts` | Messages coaching (RER) |
| `formatTraining.ts` | formatBlockVolume(), getEmomDisplay() |
| `recommendations.ts` | shouldRecommendDeload() |
| `applyDeload.ts` | Réduction volume % |
| `clubLogos.ts` | getClubLogoUrl(), getClubMonogram() |

### Athletic Testing (src/services/athleticTesting/)

| Service | Rôle |
|---------|------|
| `estimateOneRM.ts` | Brzycki/Epley formulas |
| `getPositionBaseline.ts` | Baselines CMJ/sprint/YYIR1/1RM par poste |

### Autres

| Service | Rôle |
|---------|------|
| `auth/authService.ts` | Wrapper Supabase Auth |
| `analytics/posthog.ts` | PostHog tracking |
| `supabase/client.ts` | Client Supabase initialisé |

---

## Design system (Tailwind CSS custom)

### Couleurs session

| Type | Background | Text |
|------|-----------|------|
| UPPER | `bg-blue-900/20` | `text-blue-400` |
| LOWER | `bg-emerald-900/20` | `text-emerald-400` |
| FULL | `bg-amber-900/20` | `text-amber-400` |
| CONDITIONING | `bg-violet-900/20` | `text-violet-400` |
| RECOVERY | `bg-teal-900/20` | `text-teal-400` |

### Couleurs ACWR

| Zone | Couleur |
|------|---------|
| underload | slate |
| optimal | emerald |
| caution | amber |
| danger | rose |
| critical | red |

### Palette principale
- Primary : `#ff6b35` (orange)
- Dark bg : `#1a100c`
- Text light : `text-white/50` → `text-slate-300`
