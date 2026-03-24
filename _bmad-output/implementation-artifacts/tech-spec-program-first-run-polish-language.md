---
title: 'Program first-run polish + language foundation'
slug: 'program-first-run-polish-language'
created: '2026-03-22'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
adversarial_review: '2026-03-22 — 9 findings, 7 fixed (F1/F2/F4/F5/F6/F7/F8), 1 noise (F3), 1 noise (F9)'
tech_stack: ['React 19', 'TypeScript', 'Tailwind CSS', 'Vitest', 'React Testing Library']
files_to_modify:
  - src/pages/ProgramPage.tsx
  - src/pages/WeekPage.tsx (titre fallback only)
  - src/pages/SessionDetailPage.tsx (titre fallback only)
  - src/components/motherSession/formatMotherSessionTitle.ts
  - src/components/motherSession/MotherSessionHeader.tsx
  - src/components/motherSession/MotherSessionView.tsx
  - src/components/motherSession/MotherSessionBlock.tsx
  - src/components/motherSession/MotherSessionWarmUp.tsx
  - src/components/motherSession/MotherSessionInjurySubs.tsx
  - src/components/motherSession/MotherSessionWeekPanel.tsx
  - src/components/motherSession/AnnualPlanningSummaryCard.tsx
  - src/services/motherSession/motherSessionLabels.ts (new)
  - src/types/training.ts
  - src/hooks/useProfile.ts
  - src/pages/ProfilePage.tsx
  - src/pages/OnboardingPage.tsx
  - supabase/migrations/20260322120000_profiles_preferred_language.sql (new)
  - src/pages/__tests__/ProgramPage.annualPlanning.integration.test.tsx (update)
  - src/components/motherSession/__tests__/formatMotherSessionTitle.test.ts (new)
  - src/pages/__tests__/OnboardingPage.firstRun.integration.test.tsx (update)
test_patterns:
  - 'Vitest + RTL, mocks vi.mock pour hooks/services'
  - 'renderWithRouter pour pages avec routing'
  - 'Tests purs pour helpers (pas de DOM)'
  - 'RTL treats collapsed <details> content as hidden — test on <summary> only'
---

# Tech-Spec: Program first-run polish + language foundation

**Created:** 2026-03-22

## Overview

### Problem Statement

1. **Double affichage** : quand legacy est primaire, `/program` empile le programme legacy + le plan annuel mother-session complet en dessous.
2. **IDs techniques visibles** : `LOWER_IN_SEASON_FRONT_ROW_V1` apparaît comme titre dans les tabs sur `/program`, `/week`, `/session`.
3. **Surface hybride FR/EN** : les headings, badges, labels mother-session sont en anglais dur. Les backticks dans `format`, `progressionRules`, `positionAccent` sont rendus littéralement.
4. **Pas de préférence langue** dans le profil.
5. **Skip silencieux matériel** : on peut passer le step 2 sans répondre à "Accès salle ?".

### Solution

- **Surface unique** : section secondaire → résumé compact `<details>` collapsed par défaut
- **Titres humanisés** : `formatTitleFromMotherSessionId(id, lang)` avec mapping tokens FR/EN + override dict — appliqué sur `/program`, `/week`, `/session`
- **Labels FR** : dictionnaire centralisé `motherSessionLabels.ts` avec helpers `msLabel()`, `msCycleLabel()`, `msSessionTypeLabel()`
- **Strip backticks** : sur `format`, `coachingNotes`, `fallbackOptions`, `progressionRules`, `positionAccent`
- **Préférence langue** : `preferredLanguage: 'fr' | 'en'` dans UserProfile + migration (2 statements séparés) + ProfilePage
- **Companion recommendations** : uniquement dans SummaryCard ; WeekPanel garde la prop mais reçoit `[]` depuis ProgramPage (pas supprimée globalement — WeekPage en a besoin)
- **Fix onboarding** : `canNext()` bloque step 2 tant que `hasGymAccess === null`
- **Supprimer duplication** : `CYCLE_FR` dans AnnualPlanningSummaryCard → remplacé par `msCycleLabel()`

### Scope

**In Scope :**
- Surface `/program` : un moteur principal, secondaire compact
- Titres mother-session humanisés FR/EN sur toutes les pages (program, week, session)
- Labels/headings/badges FR par défaut
- Strip backticks dans format/notes/rules/accent
- `preferredLanguage` dans UserProfile + ProfilePage
- Migration Supabase additive (2 statements)
- Fix skip matériel onboarding
- Companion recommendations : dedup dans ProgramPage, gardé dans WeekPanel
- Supprimer duplication CYCLE_FR
- Tests

**Out of Scope :**
- HistoryPage, ProgressPage
- Traduction du contenu textuel des blocs (exercices, notes, rules)
- i18n globale de l'app
- Refonte du parser/dataset mother-session
- Pages staff / sandbox

## Context for Development

### Codebase Patterns

- `ProgramPage` L668-694 : section secondaire complète quand legacy primaire
- `MotherSessionWeekPanel` L87 : `slot.session.title ?? slot.session.metadata.id` — fallback brut
- `ProgramPage` L304, L313 : `slot.session.title ?? slot.sessionId` — fallback brut
- `SessionDetailPage` : utilise `MotherSessionView` — héritera du `lang` default `'fr'`
- `WeekPage` : utilise `MotherSessionWeekPanel` — héritera du `lang` default, mais fallback titre non humanisé
- `MotherSessionHeader` L5-44 : switch statements EN dur → remplacer par helpers centralisés
- `MotherSessionBlock` L41,44,54,69,82 : labels EN durs
- `MotherSessionView` L26,38,56 : collapsible titles EN
- `MotherSessionWarmUp` L13,28 : labels EN
- `MotherSessionInjurySubs` L6-10,39-41,56 : labels EN
- `AnnualPlanningSummaryCard` L4-9 : `CYCLE_FR` local → doublon avec le dict centralisé
- `canNext()` dans OnboardingPage L236-245 : pas de check step 2
- Backticks dans `format`, `progressionRules` (27 arrays), `positionAccent` (8 arrays)

### Technical Decisions

1. **Surface secondaire compact** : `<details>` collapsed avec `<summary>` montrant cycle + semaine. `data-testid="annual-plan-section"` reste sur le `<details>`.
2. **Titres hybride** : `formatTitleFromMotherSessionId(id, lang='en')` — default EN pour compat, appelé avec `'fr'` depuis les composants. Token mapping FR + override dict pour cas ambigus.
3. **Labels centralisés avec helpers explicites (FIX F5)** :
   - `msLabel(key, lang)` pour les labels génériques
   - `msCycleLabel(cycle, lang)` — bridge `'in_season'` → label sans concat implicite
   - `msSessionTypeLabel(type, lang)` — bridge `'upper'` → label
   - `msTargetLevelLabel(level, lang)` — bridge `'starter'` → label
4. **Strip backticks étendu (FIX F1)** : sur `format`, `coachingNotes`, `fallbackOptions` (Task 5) + `progressionRules`, `positionAccent` (Task 4)
5. **Migration 2 statements (FIX F6)** : `ADD COLUMN IF NOT EXISTS` séparé de `ADD CONSTRAINT`
6. **Companion dans WeekPanel gardé (FIX F8)** : ne pas supprimer le bloc du composant — ProgramPage passe `[]`, WeekPage passe les vraies recommendations
7. **Titres sur WeekPage/SessionDetailPage (FIX F2)** : remplacer les fallback `title ?? id` par `formatTitleFromMotherSessionId(id, lang)` — quelques lignes seulement
8. **CYCLE_FR supprimé de SummaryCard (FIX F4)** : remplacé par `msCycleLabel(cycle, lang)` depuis le dict centralisé
9. **Tests sur `<details>` collapsed (FIX F7)** : assertions sur `<summary>` visible, pas sur le contenu collapsed

## Implementation Plan

### Tasks

- [ ] **Task 1 : Labels centralisés + helpers + stripBackticks**
  - File: `src/services/motherSession/motherSessionLabels.ts` (nouveau)
  - Action: Créer avec :
    - Type `AppLang = 'fr' | 'en'`
    - Dictionnaire `MS_LABELS` couvrant tous les labels (warm_up, format, coaching_notes, alternatives, block, optional, progression_rules, position_accent, coaching_warnings, injury_substitutions, notes, remove, replace, rehab, shoulder, knee, low_back, companion_conditioning, see_annual_plan, annual_plan, sessions_of_week)
    - Dictionnaires séparés pour les bridges :
      - `CYCLE_LABELS: Record<string, Record<AppLang, string>>` — keys = `'in_season'|'off_season'|'pre_season'|'playoffs'`
      - `SESSION_TYPE_LABELS` — keys = `'upper'|'lower'|'full'|'full_light_primer'|'speed_power'`
      - `TARGET_LEVEL_LABELS` — keys = `'starter'|'builder'|'performance'`
      - `POSITION_GROUP_LABELS` — keys = `'front_row'|'back_three'`
      - `EQUIPMENT_LABELS` — keys = `'full_gym'|'minimal'`
    - Fonctions exports :
      - `msLabel(key: string, lang: AppLang): string`
      - `msCycleLabel(cycle: string, lang: AppLang): string`
      - `msSessionTypeLabel(type: string, lang: AppLang): string`
      - `msTargetLevelLabel(level: string, lang: AppLang): string`
      - `msPositionGroupLabel(group: string, lang: AppLang): string`
      - `msEquipmentLabel(eq: string, lang: AppLang): string`
      - `stripBackticks(s: string): string`

- [ ] **Task 2 : Formatter titre FR/EN + overrides**
  - File: `src/components/motherSession/formatMotherSessionTitle.ts`
  - Action: Ajouter param `lang: 'fr' | 'en' = 'en'`. TOKEN_FR mapping. Override dict. Override first, then algo.

- [ ] **Task 3 : MotherSessionHeader — labels FR via helpers**
  - File: `src/components/motherSession/MotherSessionHeader.tsx`
  - Action: Prop `lang`. Supprimer `formatCycleLabel`, `formatSessionTypeLabel`, `formatTargetLevelLabel`. Utiliser `msCycleLabel`, `msSessionTypeLabel`, `msTargetLevelLabel`, `msPositionGroupLabel`, `msEquipmentLabel`. Titre via `formatTitleFromMotherSessionId(id, lang)`.

- [ ] **Task 4 : MotherSessionView — headings FR + strip backticks sur rules/accent**
  - File: `src/components/motherSession/MotherSessionView.tsx`
  - Action: Prop `lang`. Passer aux enfants. Remplacer collapsible titles par `msLabel()`. Appliquer `stripBackticks()` sur `progressionRules[i]` et `positionAccent[i]` à l'affichage.

- [ ] **Task 5 : MotherSessionBlock — labels FR + strip backticks**
  - File: `src/components/motherSession/MotherSessionBlock.tsx`
  - Action: Prop `lang`. Labels via `msLabel()`. `stripBackticks()` sur `format`, `coachingNotes[i]`, `fallbackOptions[i]`.

- [ ] **Task 6 : MotherSessionWarmUp — labels FR**
  - File: `src/components/motherSession/MotherSessionWarmUp.tsx`
  - Action: Prop `lang`. Labels via `msLabel()`.

- [ ] **Task 7 : MotherSessionInjurySubs — labels FR**
  - File: `src/components/motherSession/MotherSessionInjurySubs.tsx`
  - Action: Prop `lang`. Labels via `msLabel()` pour area titles, sub-labels, collapsible title.

- [ ] **Task 8 : MotherSessionWeekPanel — titres humanisés + companion gardé**
  - File: `src/components/motherSession/MotherSessionWeekPanel.tsx`
  - Action: Prop `lang`. Titre tab : `formatTitleFromMotherSessionId(slot.session.metadata.id, lang)`. Passer `lang` à `MotherSessionView`. **Garder le bloc companion** (ne pas le supprimer — ProgramPage passera `[]`, WeekPage passera les vraies valeurs).

- [ ] **Task 9 : AnnualPlanningSummaryCard — supprimer CYCLE_FR, utiliser helpers**
  - File: `src/components/motherSession/AnnualPlanningSummaryCard.tsx`
  - Action: Prop `lang` (default `'fr'`). Supprimer `CYCLE_FR` local. Utiliser `msCycleLabel(cycle, lang)`. Supprimer `POSITION_FR` local, utiliser `msPositionGroupLabel(group, lang)`.

- [ ] **Task 10 : ProgramPage — surface compact + titres + companion + lang**
  - File: `src/pages/ProgramPage.tsx`
  - Action 1: `const lang = profile.preferredLanguage ?? 'fr'`
  - Action 2: Remplacer L304, L313 fallback par `formatTitleFromMotherSessionId(id, lang)`
  - Action 3: Passer `lang` à tous les composants mother-session
  - Action 4: Passer `companionRecommendations={[]}` au WeekPanel (primary + secondary)
  - Action 5: Passer `lang` au SummaryCard
  - Action 6: Remplacer section secondaire L668-694 par `<details>` compact :
    - `<summary>` avec `msCycleLabel(cycle, lang)` + weekLabel (toujours visible)
    - Contenu : SummaryCard + WeekPanel dans le `<details>` (collapsed)

- [ ] **Task 11 : WeekPage + SessionDetailPage — titres humanisés (FIX F2)**
  - Files: `src/pages/WeekPage.tsx`, `src/pages/SessionDetailPage.tsx`
  - Action: Remplacer les fallback `title ?? id` / `title ?? sessionId` par `formatTitleFromMotherSessionId(id, lang)` là où des titres mother-session sont affichés. Le `lang` vient de `profile.preferredLanguage ?? 'fr'` (déjà lu via `useProfile`). Ne toucher que les lignes de titre, pas le reste de la page.

- [ ] **Task 12 : Type + hook + migration — preferredLanguage**
  - File: `src/types/training.ts` — ajouter `preferredLanguage?: 'fr' | 'en'`
  - File: `src/hooks/useProfile.ts` — DEFAULT_PROFILE, rowToProfile, profileToRow, SELECT
  - File: `supabase/migrations/20260322120000_profiles_preferred_language.sql` :
    ```sql
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'fr';
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_preferred_language_check CHECK (preferred_language IN ('fr', 'en'));
    ```

- [ ] **Task 13 : ProfilePage — sélecteur langue**
  - File: `src/pages/ProfilePage.tsx`
  - Action: Section "Langue" avec 2 boutons FR/EN.

- [ ] **Task 14 : OnboardingPage — fix skip matériel**
  - File: `src/pages/OnboardingPage.tsx`
  - Action: `canNext()` : `if (step === 2) return hasGymAccess !== null`

- [ ] **Task 15 : Tests**
  - `src/components/motherSession/__tests__/formatMotherSessionTitle.test.ts` (nouveau) :
    - FR vs EN pour `LOWER_PRESEASON_FORCE_V1`, `FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1`, etc.
    - Override dict fonctionne
  - `src/pages/__tests__/ProgramPage.annualPlanning.integration.test.tsx` :
    - `legacy primary → <details> avec summary visible, contenu collapsed`
    - `mother_session primary → pas d'ID brut _V1 dans les titres`
    - `labels FR par défaut` (vérifier "Séances de la semaine", "Pourquoi ce plan ?")
    - Tests existants : vérifier que `getByTestId('annual-plan-section')` fonctionne toujours (details est dans le DOM)
  - `src/pages/__tests__/OnboardingPage.firstRun.integration.test.tsx` :
    - `step 2 bloqué tant que hasGymAccess === null` (Suivant disabled)

### Acceptance Criteria

- [ ] **AC 1**: Given `primarySource === 'legacy'`, when `/program` se charge, then la section plan annuel est un `<details>` collapsed avec summary visible, pas un double programme complet
- [ ] **AC 2**: Given `primarySource === 'mother_session'`, when les tabs séances s'affichent, then les titres sont humanisés FR (pas d'ID brut `_V1`)
- [ ] **AC 3**: Given un profil avec `preferredLanguage: 'fr'`, when la surface mother-session se rend, then tous les headings/badges/labels sont en français
- [ ] **AC 4**: Given un champ `format` ou `progressionRules` avec backticks, when affiché, then les backticks ne sont pas rendus
- [ ] **AC 5**: Given SummaryCard et WeekPanel rendus ensemble sur ProgramPage, when companion recommendations existent, then elles apparaissent uniquement dans le SummaryCard
- [ ] **AC 6**: Given la ProfilePage, when l'utilisateur change la langue, then la préférence est persistée
- [ ] **AC 7**: Given OnboardingPage step 2, when `hasGymAccess === null`, then Suivant est disabled
- [ ] **AC 8**: Given un profil sans `preferredLanguage`, then `'fr'` est utilisé par défaut
- [ ] **AC 9**: Given `/week` ou `/session/:id`, when des titres mother-session sont affichés, then ils sont humanisés (pas d'ID brut) — cohérence avec `/program`

## Additional Context

### Dependencies

- Aucune nouvelle dépendance npm
- Migration Supabase additive (2 statements séparés)

### Testing Strategy

**Tests purs :** `formatMotherSessionTitle` (FR vs EN, overrides)
**Tests intégration :** ProgramPage (4 cas), OnboardingPage (1 cas)
**RTL note :** `<details>` collapsed → contenu hidden pour RTL. Tester sur `<summary>` visible.

### Adversarial Review Log

| ID | Sev | Status | Description |
|----|-----|--------|-------------|
| F2 | High | FIXED | WeekPage/SessionDetailPage titres bruts → étendre formatTitle avec lang |
| F1 | Medium | FIXED | stripBackticks étendu à progressionRules (27) + positionAccent (8) |
| F7 | Medium | FIXED | Tests sur summary visible, pas contenu collapsed |
| F6 | Medium | FIXED | Migration en 2 statements séparés |
| F4 | Low | FIXED | CYCLE_FR dupliqué → supprimé, remplacé par msCycleLabel() |
| F5 | Low | FIXED | Helpers explicites msCycleLabel/msSessionTypeLabel au lieu de concat implicite |
| F8 | Low | FIXED | Companion gardé dans WeekPanel, ProgramPage passe [] |
| F3 | — | Noise | Bouton "Aucun" n'apparaît qu'après hasGymAccess=false |
| F9 | — | Noise | Champ .title mort = tech debt mineur |

### Notes

- Contenu textuel des blocs reste en anglais — seul l'enrobage UI est francisé
- Le dictionnaire de labels est extensible : ajouter une langue = ajouter une colonne
- Les default `lang='fr'` sur tous les composants garantissent que WeekPage et SessionDetailPage héritent du FR sans changement lourd
- `preferredLanguage` est local au domaine programme/mother-session, pas un système i18n global
