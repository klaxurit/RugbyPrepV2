---
title: 'Onboarding coherence + first-run polish'
slug: 'onboarding-coherence-first-run-polish'
created: '2026-03-22'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
adversarial_review: '2026-03-22 — 7 findings, 5 fixed (F7/F1/F3/F4/F5), 1 accepted (F6), 1 retracted (F2→fixed by F7)'
tech_stack: ['React 19', 'TypeScript', 'Tailwind CSS', 'Vitest', 'React Testing Library']
files_to_modify:
  - src/types/annualPlanning.ts
  - src/services/season/detectAnnualPlanningContext.ts
  - src/services/annualPlanning/buildAthletePlanningInputs.ts
  - src/pages/OnboardingPage.tsx
  - src/components/motherSession/AnnualPlanningSummaryCard.tsx
  - src/components/motherSession/MotherSessionWeekPanel.tsx
  - src/services/season/__tests__/detectAnnualPlanningContext.onboardingHint.test.ts (new)
  - src/pages/__tests__/OnboardingPage.firstRun.integration.test.tsx (update)
  - src/pages/__tests__/ProgramPage.annualPlanning.integration.test.tsx (update)
code_patterns:
  - 'planningAnchors = overrides manuels dans AthletePlanningInputs (L26-35 annualPlanning.ts)'
  - 'detectAnnualPlanningContext = TraceAcc rank 1-4, fallback L405-417 = off_season backfill'
  - 'buildAthletePlanningInputs L205 = pas de planningAnchors → ajouter hint conditionnel'
  - 'OnboardingPage Step 2 L749-807 = checklist 14 items → question binaire + preset'
  - 'OnboardingPage Step 1 L568-602 = performanceFocus pour performance → supprimer'
  - 'AnnualPlanningSummaryCard L18 = POSITION_FR labels → Avants / Ligne arrière'
  - 'AnnualPlanningSummaryCard L84-100 = trace rule IDs bruts font-mono → humaniser'
  - 'MotherSessionWeekPanel L65-73 = warnings pouvant dupliquer ceux de SummaryCard'
test_patterns:
  - 'Vitest + RTL, mocks vi.mock pour hooks/services'
  - 'renderWithRouter pour pages avec routing'
  - 'Tests purs pour detectAnnualPlanningContext (pas de DOM)'
  - 'Tests existants dans src/services/annualPlanning/__tests__/ et src/pages/__tests__/'
---

# Tech-Spec: Onboarding coherence + first-run polish

**Created:** 2026-03-22

## Overview

### Problem Statement

Le flow signup → onboarding → /program est fonctionnel, mais la première impression est incohérente :
1. **Incohérence saison** : l'utilisateur choisit `in_season` à l'onboarding mais le moteur annuel backfill en `off_season` (aucun calendrier → fallback déterministe). Le premier rendu montre "Hors-saison / Off-season Recovery S1".
2. **Onboarding trop chargé** : 14 items matériel à cocher, question performanceFocus inutile au first-run, tunnel lourd pour une première valeur.
3. **Rendu post-onboarding technique** : IDs techniques exposés, trace brute, warnings dupliqués, labels peu naturels côté rugby.

### Solution

Lot ciblé en 3 axes :
- **Bootstrap saison** : ajouter `onboardingCycleHint` dans `planningAnchors` pour que le first-run respecte le choix onboarding quand aucune ancre réelle n'existe. Limité au first-run (pas de calendrier ET pas de logs).
- **Simplification onboarding** : question binaire "accès salle ?", presets matériel, retrait performanceFocus, question genre légère (Joueur/Joueuse), résumé allégé.
- **Harmonisation UI** : labels naturels (Avants / Ligne arrière), trace humanisée ("Pourquoi ce plan ?"), warnings dédupliqués, polish visuel.

### Scope

**In Scope :**
- Bootstrap saison first-run via `onboardingCycleHint` (scoped au first-run)
- Simplification tunnel onboarding (matériel, performanceFocus, population, résumé)
- Harmonisation labels position group
- Humanisation trace technique
- Déduplication warnings annual/mother-session
- Tests service + intégration

**Out of Scope :**
- WeekPage, SessionDetailPage, HistoryPage, ProgressPage
- Pages staff / sandbox
- Schéma Supabase
- Parser mother-session
- Internals de `resolveWeeklyProgramSurface`
- `package.json` / dépendances
- Refactor opportuniste

## Context for Development

### Codebase Patterns

- `detectAnnualPlanningContext` utilise un `TraceAcc` avec résolution hiérarchique (rank 1-4). Le fallback est à L405-417 : si pas de `firstMatchDate`, bump `backfilled` et retourne `off_season` week 1.
- **ATTENTION `TraceAcc.bump()` utilise `>` strict** (L34) : `if (MODE_RANK[mode] > this.rank)`. Et `freeze()` (L50) retourne `'calendar_inferred'` quand `this.rank === 0`. Donc `backfilled` DOIT garder rank ≥ 1 pour que `bump('backfilled')` fonctionne.
- `buildAthletePlanningInputs` est un adaptateur pur. L205 : commentaire explicite `// Pas de planningAnchors ici`. C'est ici qu'on injecte le hint.
- `planningAnchors` est optionnel dans `AthletePlanningInputs` (L26-35), contient `manualCycleOverride`, `offSeasonStartAt`, etc.
- `useAthleteAnnualPlan` (L63) appelle `buildAthletePlanningInputs` sans passer `planningAnchors` — pas de changement nécessaire si le hint est ajouté dans l'adaptateur.
- OnboardingPage collecte `seasonMode` (L198) et le persiste dans le profil (L280). 7 steps : Position, Profil, Équipement, Planning, Inconforts, Morphologie, Résumé.
- `performanceFocus` n'est affiché que pour `trainingLevel === 'performance'` (L568-602), default `balanced`.
- `AnnualPlanningSummaryCard` : trace brute en `font-mono` (L84-100), labels position L18 à changer.
- `MotherSessionWeekPanel` : reçoit `msResolution.warnings` (L65-73), les mêmes que `resolutionWarnings` passés à `AnnualPlanningSummaryCard` — c'est la source de duplication.
- `populationSegment` est lu par `resolvePopulationContext` dans `src/services/program/policies/populationRules.ts` — il y a des règles différentes pour `female_senior` vs `male_senior` (ACL prehab, volume caps).

### Files to Reference

| File | Purpose | Anchor Lines |
| ---- | ------- | ------------ |
| `src/types/annualPlanning.ts` | Types `planningAnchors` | L26-35 (champ à étendre) |
| `src/services/season/detectAnnualPlanningContext.ts` | Résolution hiérarchique | L19-24 (MODE_RANK), L34 (bump `>`), L50 (freeze default), L405-417 (backfill) |
| `src/services/annualPlanning/buildAthletePlanningInputs.ts` | Adaptateur profile → inputs | L197-206 (construction inputs, hint à ajouter) |
| `src/pages/OnboardingPage.tsx` | Tunnel onboarding | L568-602 (performanceFocus), L678-704 (population), L749-807 (matériel), L1076-1153 (résumé) |
| `src/components/motherSession/AnnualPlanningSummaryCard.tsx` | Carte plan annuel | L17-19 (POSITION_FR), L40 (merge warnings), L84-100 (trace) |
| `src/components/motherSession/MotherSessionWeekPanel.tsx` | Panel semaine | L62-63 (titre), L65-73 (warnings = msResolution.warnings) |
| `src/pages/ProgramPage.tsx` | Surface orchestration | Passe `msResolution.warnings` aux DEUX composants |

### Technical Decisions

1. **`onboardingCycleHint` dans `planningAnchors`** — cohérent avec la structure existante, pas de nouveau concept racine.
2. **Hiérarchie de résolution (FIX F7)** — `MODE_RANK` passe à 5 niveaux en décalant VERS LE HAUT, `backfilled` reste à rank 1 :
   ```
   manual_override: 5 > explicit_anchors: 4 > calendar_inferred: 3 > onboarding_hint: 2 > backfilled: 1
   ```
   `freeze()` default (rank 0) reste `'calendar_inferred'` — jamais atteint car tout path fait au moins un `bump`.
3. **Nouveau `resolutionMode`: `'onboarding_hint'`** dans le type union de `planningTrace.resolutionMode`.
4. **Point d'insertion** dans `detectAnnualPlanningContext` : juste avant le bloc fallback `!firstMatchDate`. Si `!firstMatchDate && onboardingCycleHint`, on utilise le hint au lieu du backfill off_season.
5. **Scoping first-run (FIX F1)** — Le hint n'est injecté que si `events.length === 0 && logs.length === 0` dans `buildAthletePlanningInputs`. Dès qu'un log ou un événement calendrier existe, le hint disparaît.
6. **Presets matériel** : salle standard = `['barbell','dumbbell','bench','pullup_bar','band','box']` ; pas de salle = checklist `['dumbbell','bench','pullup_bar','band','box','med_ball','ab_wheel','sprint_track']`.
7. **performanceFocus** retiré du tunnel, default `balanced` persisté silencieusement.
8. **Labels** : `front_row` → `'Avants'`, `back_three` → `'Ligne arrière'`.
9. **Trace humanisée** : collapsible "Pourquoi ce plan ?" avec 1-3 phrases générées depuis `resolutionMode`, sans rule IDs bruts.
10. **Warnings (FIX F3)** : la duplication vient de `msResolution.warnings` passé aux DEUX composants dans ProgramPage. Fix : ne plus passer `msResolution.warnings` au `MotherSessionWeekPanel` quand `AnnualPlanningSummaryCard` est rendu au-dessus (il les inclut déjà via `resolutionWarnings`). Le WeekPanel garde ses propres warnings uniquement s'ils sont distincts.
11. **Population (FIX F5)** : question légère "Joueur / Joueuse" dans le tunnel, dérive `populationSegment` depuis `ageBand` + `gender`.

## Implementation Plan

### Tasks

- [ ] **Task 1 : Type — ajouter `onboardingCycleHint` et `'onboarding_hint'` resolution mode**
  - File: `src/types/annualPlanning.ts`
  - Action 1: Ajouter `onboardingCycleHint?: AnnualCycle` dans l'interface `planningAnchors` (après `manualPlayoffs`, L34)
  - Action 2: Ajouter `'onboarding_hint'` dans l'union `planningTrace.resolutionMode` (L73-77)
  - Notes: Commentaire JSDoc sur `onboardingCycleHint` : "Bootstrap first-run : cycle suggéré par l'onboarding. Utilisé uniquement quand events=0 et logs=0. Priorité inférieure au calendrier et aux ancres explicites."

- [ ] **Task 2 : Détection — intercaler `onboarding_hint` dans `detectAnnualPlanningContext`**
  - File: `src/services/season/detectAnnualPlanningContext.ts`
  - Action 1: Mettre à jour `MODE_RANK` (L19-24) — décalage vers le haut, backfilled reste à 1 :
    ```ts
    const MODE_RANK: Record<TraceMode, number> = {
      manual_override: 5,
      explicit_anchors: 4,
      calendar_inferred: 3,
      onboarding_hint: 2,
      backfilled: 1,
    }
    ```
  - Action 2: Mettre à jour le type `TraceMode` (L11) pour inclure `'onboarding_hint'`
  - Action 3: Insérer un nouveau bloc **avant** le fallback `!firstMatchDate` (avant L405). Logique :
    ```ts
    // Bootstrap first-run : si aucun match et hint onboarding présent, utiliser le hint.
    // Ce hint est injecté uniquement quand events=0 et logs=0 (voir buildAthletePlanningInputs).
    if (!firstMatchDate && anchors.onboardingCycleHint) {
      acc.bump('onboarding_hint')
      acc.rule('rule:onboarding_cycle_hint')
      const hintCycle = anchors.onboardingCycleHint

      if (hintCycle === 'in_season') {
        const trace = acc.freeze()
        return {
          cycle: 'in_season',
          weekNumber: 1,
          weekLabel: 'En saison - S1',
          isDeloadWeek: false,
          offSeasonStartAt: null,
          ...baseContextFields(inputs, todayDate, todayIso, matchDates, null, trace),
        }
      }

      if (hintCycle === 'pre_season') {
        const trace = acc.freeze()
        return {
          cycle: 'pre_season',
          preSeasonPhase: 1,
          weekNumber: 1,
          weekLabel: preSeasonWeekLabel(1, 1),
          isDeloadWeek: false,
          offSeasonStartAt: null,
          ...baseContextFields(inputs, todayDate, todayIso, matchDates, null, trace),
        }
      }

      if (hintCycle === 'off_season') {
        // Off-season hint : même résultat que backfill (week 1, todayWeekMonday)
        // mais resolutionMode = onboarding_hint pour une copy distincte.
        const trace = acc.freeze()
        return buildOffSeasonContext(
          1,
          toIsoDate(todayWeekMonday),
          baseContextFields(inputs, todayDate, todayIso, matchDates, null, trace)
        )
      }

      // playoffs hint ignoré (pas de sens sans calendrier) → tombe dans le backfill.
    }
    ```
  - Notes: Le hint `off_season` est maintenant traité explicitement (FIX F2) — il ne tombe plus dans le backfill. Le hint `playoffs` est le seul qui fall-through vers le backfill (acceptable, cas extrême).

- [ ] **Task 3 : Adaptateur — injecter le hint depuis `profile.seasonMode` (first-run only)**
  - File: `src/services/annualPlanning/buildAthletePlanningInputs.ts`
  - Action: Remplacer le bloc L197-206 pour ajouter `planningAnchors` conditionnel, scopé au first-run :
    ```ts
    // Bootstrap first-run : transmet le seasonMode comme hint bas-priorité.
    // Le moteur annuel l'utilise uniquement si aucune ancre plus fiable n'existe.
    // Scoped au first-run probable : pas de calendrier ET pas de logs → profil vierge.
    const isFirstRunLikely =
      events.length === 0 &&
      logs.length === 0 &&
      profile.seasonMode != null

    const inputs: AthletePlanningInputs = {
      events: events.map((e) => ({ date: e.date, type: e.type })),
      today,
      weeklyFrequency,
      positionGroup: resolvedPositionGroup,
      fatigueLevel,
      identity,
      monitoringSnapshot,
      planningAnchors: isFirstRunLikely
        ? { onboardingCycleHint: profile.seasonMode }
        : undefined,
    }
    ```
  - Notes: Dès qu'un événement calendrier ou un log session existe, le hint disparaît et le moteur reprend ses heuristiques normales. `SeasonMode` est assignable à `AnnualCycle` (sous-ensemble TypeScript).

- [ ] **Task 4 : Onboarding — supprimer `performanceFocus` du tunnel**
  - File: `src/pages/OnboardingPage.tsx`
  - Action 1: Supprimer le bloc conditionnel `performanceFocus` (L568-602) — toute la section `{trainingLevel === 'performance' && ( ... PERFORMANCE_FOCUS_OPTIONS ... )}`
  - Action 2: Dans `handleFinish` (L281), simplifier en `performanceFocus: 'balanced'` (retirer le conditionnel)
  - Action 3: Dans la capture posthog (L303), simplifier : `performanceFocus: 'balanced'`
  - Action 4: Dans le résumé Step 6 (L1087-1091), supprimer le bloc `SummaryRow` conditionnel pour `performanceFocus`
  - Action 5: Supprimer l'import `PerformanceFocus` des types (L23)
  - Action 6: Supprimer le state `performanceFocus` / `setPerformanceFocus` (L194) et la constante `PERFORMANCE_FOCUS_OPTIONS` (L128-132)
  - Action 7: Nettoyer le setter `setPerformanceFocus('balanced')` dans le onClick de starter (L506)

- [ ] **Task 5 : Onboarding — simplifier la sélection matériel**
  - File: `src/pages/OnboardingPage.tsx`
  - Action 1: Ajouter un état `hasGymAccess` :
    ```ts
    const [hasGymAccess, setHasGymAccess] = useState<boolean | null>(null)
    ```
  - Action 2: Définir les presets comme constantes :
    ```ts
    const GYM_PRESET: Equipment[] = ['barbell', 'dumbbell', 'bench', 'pullup_bar', 'band', 'box']
    const HOME_EQUIPMENT_OPTIONS: { value: Equipment; label: string; emoji: string }[] = [
      { value: 'dumbbell',     label: 'Haltères',        emoji: '💪' },
      { value: 'bench',        label: 'Banc',            emoji: '🪑' },
      { value: 'pullup_bar',   label: 'Barre de traction', emoji: '🔝' },
      { value: 'band',         label: 'Élastiques',      emoji: '🔴' },
      { value: 'box',          label: 'Box pliométrique', emoji: '📦' },
      { value: 'med_ball',     label: 'Médecine Ball',   emoji: '🔵' },
      { value: 'ab_wheel',     label: 'Ab Wheel',        emoji: '⭕' },
      { value: 'sprint_track', label: 'Piste / Gazon',   emoji: '🏃' },
    ]
    ```
  - Action 3: Remplacer le Step 2 (L749-807) par un nouveau flow :
    - Question binaire : "As-tu accès à une salle de sport ?" → 2 boutons Oui/Non
    - Si `oui` : afficher message "Salle standard sélectionnée (barre, haltères, banc, traction, élastiques, box). Tu pourras affiner dans ton profil." + hydrate `equipment` avec `GYM_PRESET`
    - Si `non` : afficher la checklist `HOME_EQUIPMENT_OPTIONS` (8 items au lieu de 14)
    - Garder le bouton "Aucun — poids du corps" en fallback
  - Action 4: Quand `hasGymAccess` passe à `true`, appeler `setEquipment(new Set(GYM_PRESET))`. Quand il passe à `false`, reset `setEquipment(new Set())`.
  - Notes: `handleFinish` L274 gère déjà le cas `equipment.size === 0 → ['none']`, pas de changement nécessaire.

- [ ] **Task 6 : Onboarding — simplifier population avec question genre légère (FIX F5)**
  - File: `src/pages/OnboardingPage.tsx`
  - Action 1: Ajouter un état `gender` :
    ```ts
    const [gender, setGender] = useState<'male' | 'female'>('male')
    ```
  - Action 2: Supprimer la section "Population ciblée" (L678-704) — les 4 boutons `male_senior` / `female_senior` / `u18_male` / `u18_female`.
  - Action 3: Ajouter une question légère "Joueur / Joueuse" dans le Step 1 (Profil), après la catégorie d'âge et avant le consentement U18 :
    ```tsx
    <div className="space-y-3">
      <SectionLabel>Profil</SectionLabel>
      <div className="grid grid-cols-2 gap-2.5">
        {([
          { value: 'male' as const, label: 'Joueur' },
          { value: 'female' as const, label: 'Joueuse' },
        ]).map((opt) => {
          const selected = gender === opt.value
          return (
            <button key={opt.value} type="button" onClick={() => setGender(opt.value)}
              className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.97] ${
                selected ? 'border-[#ff6b35] bg-[#ff6b35]/10' : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}>
              <p className={`text-sm font-black ${selected ? 'text-[#ff6b35]' : 'text-white'}`}>{opt.label}</p>
            </button>
          )
        })}
      </div>
    </div>
    ```
  - Action 4: Dériver `populationSegment` depuis `ageBand` + `gender` dans `handleFinish` au lieu de lire l'état :
    ```ts
    const derivedPopulationSegment =
      ageBand === 'u18'
        ? (gender === 'female' ? 'u18_female' : 'u18_male')
        : (gender === 'female' ? 'female_senior' : 'male_senior')
    ```
    Et utiliser `derivedPopulationSegment` dans le payload profil.
  - Action 5: Supprimer l'état `populationSegment` / `setPopulationSegment` et les auto-updates dans les onClick de ageBand (L650-659). Garder la constante `POPULATION_OPTIONS` si elle sert au profil, sinon la supprimer.
  - Action 6: Garder intact le bloc consentement parental U18 (L707-745).
  - Notes: Le modèle `UserProfile.populationSegment` ne change pas. La dérivation `ageBand + gender → populationSegment` garantit que les joueuses obtiennent `female_senior` (et donc les règles ACL/volume féminines). Le guard U18 reste intact.

- [ ] **Task 7 : Onboarding — alléger le résumé (Step 6)**
  - File: `src/pages/OnboardingPage.tsx`
  - Action 1: Réorganiser le résumé Step 6 (L1076-1153) :
    - **Garder** : Poste, Niveau, Période, Séances, Équipement (reformulé), Zones sensibles (si présentes), Jours muscu (si définis)
    - **Supprimer** : ligne performanceFocus, ligne Population
    - **Rendre discret** : Morphologie — la garder mais en texte secondaire `text-white/40` au lieu de `text-white/80`
    - Reformuler la valeur Équipement : si `hasGymAccess === true` → "Salle standard" ; si `hasGymAccess === false` et items sélectionnés → liste des items ; sinon "Poids du corps"
  - Action 2: Revoir le bloc non-éligible (L1136-1141) :
    - Changer le titre `"Ton plan annuel prendra le relais"` → `"Programme adapté à ta période"`
    - Changer le texte : `"Le planificateur annuel te propose un programme adapté à ta période et ton poste."`
    - Retirer la mention "moteur historique" (jargon technique)

- [ ] **Task 8 : SummaryCard — labels position + trace humanisée**
  - File: `src/components/motherSession/AnnualPlanningSummaryCard.tsx`
  - Action 1: Changer `POSITION_FR` (L17-19) :
    ```ts
    const POSITION_FR: Record<'front_row' | 'back_three', string> = {
      front_row: 'Avants',
      back_three: 'Ligne arrière',
    }
    ```
  - Action 2: Remplacer le bloc trace (L84-100) par une version humanisée :
    ```tsx
    {/* Trace humanisée — Pourquoi ce plan ? */}
    <details className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
      <summary className="text-[10px] font-black uppercase tracking-wide text-white/40 cursor-pointer select-none">
        Pourquoi ce plan ?
      </summary>
      <p className="mt-2 text-xs text-white/55 leading-relaxed">
        {humanizeTrace(trace)}
      </p>
    </details>
    ```
  - Action 3: Ajouter la fonction `humanizeTrace` dans le même fichier (avant le composant) :
    ```ts
    function humanizeTrace(trace: AnnualPlanningContext['planningTrace']): string {
      switch (trace.resolutionMode) {
        case 'onboarding_hint':
          return 'Aucun match n\'est encore renseigné. Le plan démarre avec la période choisie à l\'inscription.'
        case 'backfilled':
          return 'Aucun calendrier disponible. Un plan de reprise générique est proposé en attendant tes premières données.'
        case 'calendar_inferred':
          return 'Le plan s\'aligne automatiquement sur les matchs détectés dans ton calendrier.'
        case 'explicit_anchors':
          return 'Le plan suit les dates clés renseignées (début de saison, fin de saison).'
        case 'manual_override':
          return 'Le plan a été ajusté manuellement par un encadrant ou via les réglages avancés.'
      }
    }
    ```
  - Notes: Pas de rule IDs, pas de font-mono, pas de liste technique. Une seule phrase claire par mode.

- [ ] **Task 9 : WeekPanel — déduplication warnings + titre (FIX F3)**
  - File: `src/components/motherSession/MotherSessionWeekPanel.tsx` + `src/pages/ProgramPage.tsx`
  - Action 1: Changer le titre (L63 de WeekPanel) de `"Mother sessions · semaine"` → `"Séances de la semaine"`
  - Action 2: **Dans ProgramPage**, ne plus passer `msResolution.warnings` au `MotherSessionWeekPanel` quand `AnnualPlanningSummaryCard` est déjà rendu au-dessus. Passer un tableau vide `[]` à la place. La source de duplication est `msResolution.warnings` passé aux DEUX composants — le SummaryCard les inclut déjà via sa prop `resolutionWarnings`.
  - Notes: C'est le fix côté parent (ProgramPage), pas côté enfant. Le WeekPanel garde sa prop `warnings` inchangée — il reçoit simplement `[]` quand le SummaryCard est présent.

- [ ] **Task 10 : Tests — detectAnnualPlanningContext avec onboardingCycleHint**
  - File: `src/services/season/__tests__/detectAnnualPlanningContext.onboardingHint.test.ts` (nouveau)
  - Action: Créer un test pur avec 5 cas :
    ```ts
    describe('onboardingCycleHint bootstrap', () => {
      it('in_season hint + no matches → cycle in_season, resolutionMode onboarding_hint', ...)
      it('pre_season hint + no matches → cycle pre_season, resolutionMode onboarding_hint', ...)
      it('off_season hint + no matches → cycle off_season, resolutionMode onboarding_hint', ...)
      it('in_season hint + real match calendar → calendar_inferred wins (hint ignored)', ...)
      it('no hint + no matches → backfilled (existing behavior unchanged)', ...)
    })
    ```
  - Notes: 5e cas ajouté pour vérifier la non-régression du backfill existant (F7). Chaque test construit un `AthletePlanningInputs` minimal et appelle `detectAnnualPlanningContext` directement. Pas de mock, pas de DOM.

- [ ] **Task 11 : Tests — OnboardingPage.firstRun mise à jour (FIX F4)**
  - File: `src/pages/__tests__/OnboardingPage.firstRun.integration.test.tsx`
  - Action 1: **Mettre à jour le test existant** `'profil non legacy-eligible → onboarding termine'` — changer l'assertion `screen.getByText(/plan annuel prendra le relais/)` → `screen.getByText(/Programme adapté à ta période/)` (Task 7 change cette copy)
  - Action 2: Ajouter les tests suivants :
    - `it('ne montre pas performanceFocus dans le tunnel')` — naviguer jusqu'au step Profil, sélectionner `performance`, vérifier que "Orientation performance" n'apparaît plus
    - `it('question binaire matériel : oui → preset salle affiché')` — naviguer au step Équipement, cliquer "Oui", vérifier message "Salle standard"
    - `it('question binaire matériel : non → checklist maison')` — cliquer "Non", vérifier que la checklist réduite apparaît (8 items au lieu de 14)
    - `it('résumé n'affiche pas performanceFocus ni Population')` — compléter jusqu'au résumé, vérifier absence des lignes "Orientation" et "Population"
    - `it('question genre visible et dérive le bon populationSegment')` — sélectionner "Joueuse", vérifier que `updateProfile` reçoit `populationSegment: 'female_senior'`
  - Notes: Utiliser le pattern de test existant (renderOnboarding + fireEvent navigation).

- [ ] **Task 12 : Tests — ProgramPage.annualPlanning mise à jour**
  - File: `src/pages/__tests__/ProgramPage.annualPlanning.integration.test.tsx`
  - Action: Ajouter/mettre à jour :
    - `it('labels position lisibles (Avants / Ligne arrière)')` — vérifier `screen.getByText('Avants')` ou `screen.getByText('Ligne arrière')` selon le mock
    - `it('trace affiche "Pourquoi ce plan ?" au lieu de rule IDs')` — vérifier `screen.getByText('Pourquoi ce plan ?')`, vérifier absence de `font-mono` rule IDs
    - `it('titre WeekPanel = "Séances de la semaine"')` — vérifier le nouveau titre
    - Mettre à jour les tests existants si certaines assertions matchent l'ancien label position ou l'ancien titre
  - Notes: Les mocks `makeMotherSessionSurface` existants restent fonctionnels.

### Acceptance Criteria

- [ ] **AC 1**: Given un profil first-run avec `seasonMode: 'in_season'`, aucun match et aucun log, when le moteur annuel résout le contexte, then `cycle === 'in_season'` et `planningTrace.resolutionMode === 'onboarding_hint'`

- [ ] **AC 2**: Given un profil first-run avec `seasonMode: 'pre_season'` et aucun match, when le moteur résout, then `cycle === 'pre_season'` et `weekLabel` contient "Pre-season"

- [ ] **AC 3**: Given un profil avec `seasonMode: 'in_season'` et un vrai calendrier de matchs, when le moteur résout, then `planningTrace.resolutionMode !== 'onboarding_hint'` (le calendrier prend la main)

- [ ] **AC 3b**: Given un profil avec `seasonMode: 'in_season'`, aucun match mais des logs existants, when le moteur résout, then `planningTrace.resolutionMode === 'backfilled'` (hint non injecté, first-run dépassé)

- [ ] **AC 4**: Given un utilisateur dans le tunnel onboarding, when il arrive au step Profil et sélectionne "Avancé", then aucune question "Orientation performance" n'apparaît

- [ ] **AC 5**: Given un utilisateur au step Équipement, when il clique "Oui" à "As-tu accès à une salle ?", then le preset salle standard est appliqué et un message de confirmation s'affiche

- [ ] **AC 6**: Given un utilisateur au step Équipement, when il clique "Non", then une checklist réduite (8 items maison/terrain) s'affiche

- [ ] **AC 7**: Given le résumé onboarding (step 6), when l'utilisateur le consulte, then les lignes "Orientation" et "Population" ne sont pas affichées

- [ ] **AC 8**: Given le composant `AnnualPlanningSummaryCard`, when il rend un contexte `front_row`, then le label affiché est "Avants" (pas "Avants / 2e–3e ligne")

- [ ] **AC 9**: Given le composant `AnnualPlanningSummaryCard`, when il rend un contexte avec `resolutionMode: 'onboarding_hint'`, then la trace affiche "Pourquoi ce plan ?" en label et un texte humanisé (pas de rule IDs)

- [ ] **AC 10**: Given les composants `AnnualPlanningSummaryCard` et `MotherSessionWeekPanel` rendus ensemble, when des warnings `msResolution.warnings` existent, then ils n'apparaissent que dans le SummaryCard (WeekPanel reçoit `[]`)

- [ ] **AC 11**: Given le composant `MotherSessionWeekPanel`, when il est rendu, then son titre est "Séances de la semaine" (pas "Mother sessions · semaine")

- [ ] **AC 12**: Given une joueuse qui sélectionne "Joueuse" dans l'onboarding, when le profil est sauvegardé, then `populationSegment === 'female_senior'` (pas `male_senior`)

- [ ] **AC 13**: Given un profil sans calendrier et sans logs, when le backfill standard s'applique (pas de hint), then `resolutionMode === 'backfilled'` (non-régression F7)

## Additional Context

### Dependencies

- Aucune nouvelle dépendance npm
- Aucune migration Supabase
- Pas de changement dans `resolveWeeklyProgramSurface` ni dans le parser mother-session
- `profile.seasonMode` existe déjà dans `UserProfile` (type `SeasonMode`)

### Testing Strategy

**Tests purs (service) :**
- `detectAnnualPlanningContext.onboardingHint.test.ts` : 5 cas ciblés (in/pre/off + calendrier prioritaire + non-régression backfill)
- Pas de mock nécessaire (fonction pure)

**Tests intégration (pages) :**
- `OnboardingPage.firstRun.integration.test.tsx` : 1 test existant mis à jour (copy non-éligible) + 5 nouveaux cas
- `ProgramPage.annualPlanning.integration.test.tsx` : 3 nouveaux cas (labels, trace, titre) + mises à jour éventuelles des assertions existantes
- Mocks existants suffisants, pas de nouveau mock à créer

**Vérification manuelle :**
- Compléter le tunnel onboarding avec `in_season` → vérifier que `/program` affiche "En saison" (pas "Hors-saison")
- Compléter avec `off_season` → vérifier cohérence
- Compléter en tant que "Joueuse" → vérifier que `populationSegment` est correct
- Vérifier que le preset matériel salle se propage correctement au profil

### Notes

- Le hint `onboardingCycleHint` est un bootstrap de première expérience, pas une source de vérité durable. Il est scoped au first-run (events=0, logs=0).
- Si un vrai calendrier ou un log session est ajouté ensuite, le hint disparaît automatiquement de `planningAnchors`.
- Le preset matériel salle standard est modifiable ensuite dans le profil.
- `performanceFocus` reste dans le type `UserProfile` pour un usage futur dans le profil avancé — on ne casse pas le modèle.
- La question genre (Joueur/Joueuse) garantit que les joueuses obtiennent `female_senior` et les règles de sécurité associées (ACL prehab, volume caps).

### Adversarial Review Log

| ID | Sévérité | Status | Description |
|----|----------|--------|-------------|
| F7 | Critical | FIXED | `backfilled` rank 0 cassait `bump()` et `freeze()` → backfilled reste rank 1, décalage vers le haut |
| F1 | High | FIXED | hint permanent → scoped au first-run (events=0, logs=0) |
| F2 | High | FIXED | off_season fall-through → traité explicitement dans le bloc hint |
| F5 | Medium | FIXED | female users → question Joueur/Joueuse + dérivation `populationSegment` |
| F3 | Medium | FIXED | déduplication sous-spécifiée → fix côté ProgramPage, ne plus passer `msResolution.warnings` au WeekPanel |
| F4 | Medium | FIXED | test existant `plan annuel prendra le relais` → assertion mise à jour dans Task 11 |
| F6 | Low | ACCEPTED | toggle matériel Oui/Non reset — fonctionnel, pas de bug |
