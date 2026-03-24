---
title: 'In-season recovery override + seasonMode durable'
slug: 'in-season-recovery-override'
created: '2026-03-22'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
adversarial_review: '2026-03-22 — 9 findings, 8 fixed (F1-F8), 1 noise (F9)'
tech_stack: ['React 19', 'TypeScript', 'Tailwind CSS', 'Vitest']
files_to_modify:
  - src/types/annualPlanning.ts
  - src/services/annualPlanning/buildAthletePlanningInputs.ts
  - src/services/motherSession/resolveMotherSessionsForWeek.ts
  - src/services/motherSession/motherSessionLabels.ts
  - src/components/motherSession/formatMotherSessionTitle.ts
  - src/components/motherSession/AnnualPlanningSummaryCard.tsx
  - src/components/motherSession/MotherSessionHeader.tsx
  - src/components/motherSession/MotherSessionWeekPanel.tsx
  - src/pages/ProgramPage.tsx (FIX F5 — remove resolvedPositionGroup prop)
  - src/pages/WeekPage.tsx (FIX F5 — remove resolvedPositionGroup prop)
  - src/data/weeklyTemplates.ts (FIX F3 — document very_high intercept)
  - src/services/annualPlanning/__tests__/buildAthletePlanningInputs.test.ts (update)
  - src/services/season/__tests__/detectAnnualPlanningContext.onboardingHint.test.ts (update)
  - src/services/motherSession/__tests__/resolveMotherSessionsForWeek.recovery.test.ts (new)
  - src/pages/__tests__/ProgramPage.annualPlanning.integration.test.tsx (FIX F7+F8 — update+add)
---

# Tech-Spec: In-season recovery override + seasonMode durable

**Created:** 2026-03-22

## Overview

### Problem Statement

1. **Cycle trompeur** : un joueur déclaré `in_season` qui a logué des séances mais n'a pas de match dans son calendrier voit "Hors-saison / Off-season Recovery S1". Cause racine : le `onboardingCycleHint` disparaît dès que `logs.length > 0`, et le backfill reprend → `off_season`.
2. **Pas de recovery in-season** : quand `fatigueLevel === 'very_high'` (ACWR danger/critical), le moteur allège la séance mais aucun concept séparé de "semaine de récupération" n'existe.
3. **UI technique** : IDs bruts sous le titre, "Fatigue (métier)", "Groupe", séances "A" / "B" sans explication.

### Solution

**Volet A — seasonMode durable** : `profile.seasonMode` injecté comme hint rank 2 tant qu'aucun match réel ne contredit, **indépendamment des logs**.

**Volet B — recovery override** : `loadManagementOverride?: 'recovery'` dans `AnnualPlanningContext`. Quand `in_season + very_high`, templates de récupération, `cycle` reste `'in_season'`, UI montre "En saison" + "Récupération prioritaire".

**Volet C — UI cleanup** : suppression "Groupe", fatigue subtile, ID brut masqué, séances day-labeled, labels FR.

### Scope

**In Scope :** seasonMode durable, loadManagementOverride, recovery override, UI cleanup, tests service + intégration

**Out of Scope :** traduction exhaustive dataset, equipment-aware, refonte annual planning, sélecteur EN

## Context for Development

### Cause racine — seasonMode éphémère

`buildAthletePlanningInputs.ts` : `logs.length === 0` fait disparaître le hint dès le premier log → backfill `off_season`.

**Fix** : retirer `logs.length === 0`. `profile.seasonMode` injecté tant que `!hasMatchInCalendar`.

### Règles d'entrée/sortie

- **Entrée** : `cycle === 'in_season'` AND `fatigueLevel === 'very_high'` (ACWR danger/critical)
- **Sortie** : automatique quand `fatigueLevel` < `very_high`
- **Niveaux** : danger/critical → recovery override · high/caution → allégé · normal → normal

### Technical Decisions

1. `profile.seasonMode` injecté sans condition sur logs
2. `loadManagementOverride?: 'recovery'` set par resolver MS (pas par detectAnnualPlanningContext)
3. Templates T1 : réutiliser `FULL_OFFSEASON_RECOVERY_A/B_V1`, affichage contextuel
4. **Titres recovery = globaux (FIX F1)** : "Récupération · Début de semaine" est correct pour les deux contextes (off-season ET recovery in-season). Documenté.
5. **`resolvedPositionGroup` prop supprimée (FIX F5+F6)** : retirée du composant ET des callers (ProgramPage, WeekPage). `fatigueLevel` prop gardée pour le chip.
6. **`very_high` intercept documenté (FIX F3)** : commentaire dans `weeklyTemplates.ts` FATIGUE_OVERRIDES

## Implementation Plan

### Tasks

- [ ] **Task 1 : Type — `loadManagementOverride`**
  - File: `src/types/annualPlanning.ts`
  - Action: `loadManagementOverride?: 'recovery'` dans `AnnualPlanningContext` (après `fatigueLevel`)

- [ ] **Task 2 : seasonMode durable**
  - File: `src/services/annualPlanning/buildAthletePlanningInputs.ts`
  - Action: Remplacer :
    ```ts
    // AVANT
    const isFirstRunLikely = !hasMatchInCalendar && logs.length === 0 && profile.seasonMode != null

    // APRÈS — seasonMode = base durable tant qu'aucun match réel ne contredit.
    const shouldInjectSeasonHint = !hasMatchInCalendar && profile.seasonMode != null
    ```
  - Action 2: Renommer variable + commentaire

- [ ] **Task 3 : Recovery override dans resolver MS**
  - File: `src/services/motherSession/resolveMotherSessionsForWeek.ts`
  - Action: Dans le chemin `in_season`, **avant** l'appel `getWeeklyTemplate`, intercepter :
    ```ts
    if (planningContext.cycle === 'in_season' && planningContext.fatigueLevel === 'very_high') {
      const recoverySlots = makeRecoveryOffSeasonSlots()
      const resolvedSessions = resolveSlots(recoverySlots, ...)
      return {
        status: 'resolved',
        planningContext: { ...planningContext, loadManagementOverride: 'recovery' },
        sessions: resolvedSessions,
        warnings: [],
        companionRecommendations: ['2x 20-30 min zone 2 (marche, vélo, jogging léger)'],
      }
    }
    ```
  - Notes: `cycle` reste `'in_season'`. Seul `loadManagementOverride` change.

- [ ] **Task 4 : Labels recovery FR**
  - File: `src/services/motherSession/motherSessionLabels.ts`
  - Action: Ajouter : `recovery_priority`, `light_week`, `recovery_explanation`, `session_early_week`, `session_late_week`

- [ ] **Task 5 : Titres recovery humanisés (FIX F1)**
  - File: `src/components/motherSession/formatMotherSessionTitle.ts`
  - Action: Ajouter overrides globaux :
    ```ts
    FULL_OFFSEASON_RECOVERY_A_V1: { fr: 'Récupération · Début de semaine', en: 'Recovery · Early week' },
    FULL_OFFSEASON_RECOVERY_B_V1: { fr: 'Récupération · Fin de semaine',   en: 'Recovery · Late week' },
    ```
  - Notes: Correct pour les deux contextes (recovery in-season ET off-season phase 1). Documenté dans le code.

- [ ] **Task 6 : SummaryCard — cleanup + recovery banner (FIX F5+F6)**
  - File: `src/components/motherSession/AnnualPlanningSummaryCard.tsx`
  - Action 1: Supprimer la card "Groupe" et la grille 2 colonnes
  - Action 2: Remplacer "Fatigue (métier)" par un chip discret amber (visible seulement si `!== 'normal'`)
  - Action 3: Ajouter banner recovery si `loadManagementOverride === 'recovery'`
  - Action 4: **Supprimer la prop `resolvedPositionGroup`** du type et du composant. **Garder `fatigueLevel`** (nécessaire pour le chip).
  - File: `src/pages/ProgramPage.tsx` — retirer `resolvedPositionGroup={...}` de l'appel
  - File: `src/pages/WeekPage.tsx` — retirer `resolvedPositionGroup={...}` de l'appel

- [ ] **Task 7 : Header — masquer ID brut**
  - File: `src/components/motherSession/MotherSessionHeader.tsx`
  - Action: Supprimer la ligne `<p>` qui affiche `metadata.id` sous le titre

- [ ] **Task 8 : WeekPanel — clarifier A/B avec dayPreference**
  - File: `src/components/motherSession/MotherSessionWeekPanel.tsx`
  - Action: Ajouter sous-label `dayPreference` dans les tabs ("Début de semaine" / "Fin de semaine")

- [ ] **Task 9 : Document very_high intercept (FIX F3)**
  - File: `src/data/weeklyTemplates.ts`
  - Action: Ajouter commentaire dans FATIGUE_OVERRIDES : "very_high pour in_season est intercepté par le recovery override dans resolveMotherSessionsForWeek — ne passe plus ici"

- [ ] **Task 10 : Tests (FIX F4+F7+F8)**
  - File: `src/services/annualPlanning/__tests__/buildAthletePlanningInputs.test.ts`
  - Action 1: **Inverser** le test "non first-run (logs présents) : pas de planningAnchors" → "logs présents + pas de match + seasonMode → hint injecté" (FIX F4)
  - Action 2: Garder le test "match présent → pas de hint"
  - File: `src/services/motherSession/__tests__/resolveMotherSessionsForWeek.recovery.test.ts` (nouveau)
  - Action: 4 cas : in_season+very_high → recovery, in_season+high → pas recovery, off_season+very_high → pas recovery, in_season+normal → pas recovery
  - File: `src/services/season/__tests__/detectAnnualPlanningContext.onboardingHint.test.ts`
  - Action: Ajouter : hint + logs existants + pas de match → cycle in_season
  - File: `src/pages/__tests__/ProgramPage.annualPlanning.integration.test.tsx`
  - Action 1: **Supprimer** le test "labels position lisibles (Avants)" — Groupe card retirée (FIX F7)
  - Action 2: **Ajouter** test recovery override UI (FIX F8) :
    ```ts
    it('recovery override : affiche En saison + Récupération prioritaire, jamais Hors-saison', () => {
      // Mock avec loadManagementOverride: 'recovery' dans planningContext
      // Vérifier 'En saison', 'Récupération prioritaire' ou 'recovery_explanation'
      // Vérifier absence de 'Hors-saison'
    })
    ```

### Acceptance Criteria

- [ ] **AC 1**: Given `profile.seasonMode = 'in_season'`, logs existants, aucun match, when le moteur résout, then `cycle === 'in_season'` (pas `off_season`)
- [ ] **AC 2**: Given `cycle === 'in_season'` et `fatigueLevel === 'very_high'`, when le resolver MS s'exécute, then `loadManagementOverride === 'recovery'` et `cycle` reste `'in_season'`
- [ ] **AC 3**: Given recovery override actif, when `fatigueLevel` redescend à `'high'`, then recovery override désactivé
- [ ] **AC 4**: Given recovery override actif sur ProgramPage, then "En saison" + message recovery, jamais "Hors-saison"
- [ ] **AC 5**: Given `AnnualPlanningSummaryCard`, then "Groupe" n'est plus affiché, fatigue = chip discret
- [ ] **AC 6**: Given `MotherSessionHeader`, then ID brut `metadata.id` n'est plus visible
- [ ] **AC 7**: Given deux séances recovery A/B, then les tabs montrent "Début de semaine" / "Fin de semaine"
- [ ] **AC 8**: Given `FULL_OFFSEASON_RECOVERY_A_V1` dans un contexte in-season, then titre = "Récupération · Début de semaine"

## Additional Context

### Dependencies
- Aucune nouvelle dépendance npm
- Aucune migration Supabase

### Testing Strategy
**Tests purs :** buildAthletePlanningInputs (seasonMode durable), resolveMotherSessionsForWeek.recovery (4 cas), detectAnnualPlanningContext (hint persistant)
**Tests intégration :** ProgramPage (recovery override UI, suppression Avants test)
**Vérification manuelle :** onboarding in_season → log → toujours "En saison", fatigue haute → recovery

### Adversarial Review Log

| ID | Sev | Status | Description |
|----|-----|--------|-------------|
| F1 | High | FIXED | Titres recovery globaux acceptés pour les deux contextes — documenté |
| F4 | High | FIXED | Test "non first-run" inversé explicitement |
| F7 | High | FIXED | Test "Avants" supprimé (Groupe card retirée) |
| F5 | Medium | FIXED | ProgramPage + WeekPage ajoutés — retirer resolvedPositionGroup prop |
| F8 | Medium | FIXED | Test intégration recovery override UI ajouté |
| F2 | Medium | ACCEPTED V1 | Companions hardcodées dans resolver — acceptable |
| F3 | Medium | FIXED | Commentaire FATIGUE_OVERRIDES documenté |
| F6 | Low | FIXED | Clarification : garder fatigueLevel, supprimer resolvedPositionGroup |

### Notes
- Titres "Récupération · Début/Fin de semaine" valides pour off-season ET recovery in-season — la distinction se fait par le cycle affiché et le banner recovery, pas par le titre de séance
- `loadManagementOverride` est un champ UI/présentation, pas une modification du cycle annuel
- La décision recovery est figée par résolution (pas de réévaluation intra-semaine)
