---
title: 'Weekly player UX + targeted FR session translation'
slug: 'weekly-player-ux-fr-translation'
created: '2026-03-23'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
adversarial_review: '2026-03-23 — 17 findings, 12 fixed, 5 accepted/low'
tech_stack: ['React 19', 'TypeScript', 'Tailwind CSS', 'Vitest']
files_to_modify:
  - src/services/ui/mapSlotsToScheduleDays.ts (new)
  - src/services/motherSession/motherSessionContentFr.ts (new)
  - src/services/motherSession/motherSessionLabels.ts
  - src/components/motherSession/AnnualPlanningSummaryCard.tsx
  - src/components/motherSession/MotherSessionWeekPanel.tsx
  - src/components/motherSession/MotherSessionView.tsx
  - src/components/motherSession/MotherSessionBlock.tsx
  - src/components/motherSession/MotherSessionWarmUp.tsx
  - src/components/motherSession/MotherSessionInjurySubs.tsx
  - src/components/motherSession/MotherSessionHeader.tsx
  - src/pages/ProgramPage.tsx
  - src/pages/WeekPage.tsx
  - src/pages/SessionDetailPage.tsx
  - src/services/ui/__tests__/mapSlotsToScheduleDays.test.ts (new)
  - src/services/motherSession/__tests__/motherSessionContentFr.test.ts (new)
  - src/pages/__tests__/ProgramPage.annualPlanning.integration.test.tsx (update)
  - src/pages/__tests__/WeekPage.integration.test.tsx (update)
  - src/pages/__tests__/SessionDetailPage.convergence.integration.test.tsx (update)
---

# Tech-Spec: Weekly player UX + targeted FR session translation

**Created:** 2026-03-23

## Overview

### Problem Statement

1. Labels abstraits ("Début de semaine") au lieu de vrais jours joueur
2. Jargon "Plan annuel" exposé côté joueur
3. Recovery bloc trop verbeux / empilé
4. Contenu séances partiellement en anglais
5. Densité excessive (coaching notes, warm-up ouverts)

### Solution

- Placement jours réels via `mapSlotsToScheduleDays` (avec `mid_week` + `pre_match` linéaire)
- "Plan annuel" → "Cette semaine"
- Recovery simplifié (chip + phrase + disclosure)
- Traduction FR ciblée : **10 sessions complètes ou rien** (pas de mix FR/EN)
- Densité réduite : coaching notes repliées, "Comprendre cette séance" collapsible
- `decisionReason` supprimé de l'UI joueur
- "Mother sessions indisponibles" → "Séances indisponibles"

### Scope

**In Scope :** placement jours, suppression jargon, recovery concis, traduction FR 10 sessions, densité réduite, cleanup debug leaks

**Out of Scope :** traduction dataset complet, home gym, refonte annual planning, sélecteur EN

## Technical Decisions

1. **Mapper `mid_week` (FIX F1-1)** : pour 3 sessions triées, `early_week` → 1er jour, `mid_week` → 2e, `late_week` → 3e. Label : `session_mid_week: { fr: 'Milieu de semaine', en: 'Mid week' }`
2. **`pre_match` linéaire (FIX F1-2)** : chercher le dernier jour de `scSchedule.sessions` dont `day < matchDay` (pas de wrap-around). Si aucun ne précède → fallback dernier jour planifié.
3. **Slots < scSchedule (F1-3)** : si `slots.length < scSchedule.sessions.length`, prendre seulement les `slots.length` premiers jours triés (early → late)
4. **`dayPreference` undefined (F1-4)** : slots sans préférence → assignation positionnelle (1er slot → 1er jour, etc.)
5. **Traduction complète par session (FIX F2-2)** : le helper vérifie que TOUS les blocs d'une session ont une traduction FR. Si un bloc manque → toute la session reste en EN. Pas de mix.
6. **Dette dictionnaire (F2-1)** : acceptée V1, commentaire SYNC dans le fichier
7. **`decisionReason` supprimé de l'UI (FIX F3-2)** : le bloc info `orchestrator-fallback-reason` dans SessionDetailPage est supprimé
8. **"Comprendre cette séance" conditionnel (FIX F4-2)** : non rendu si `progressionRules.length === 0 && positionAccent.length === 0`
9. **"Mother sessions indisponibles" → "Séances indisponibles" (F3-3)**

## Implementation Plan

### Tasks

- [x] **Task 1 : Helper placement jours (FIX F1-1/F1-2/F1-3/F1-4)**
  - File: `src/services/ui/mapSlotsToScheduleDays.ts` (nouveau)
  - Logique :
    - Trier `scSchedule.sessions` chronologiquement
    - Mapping preferences → positions : `early_week` → 1er, `mid_week` → 2e (3x), `late_week` → dernier
    - `pre_match` : dernier jour de scSchedule dont `day < matchDay` (linéaire), fallback dernier jour
    - Si `slots.length < scSchedule.length` : prendre le sous-ensemble `early → late`
    - Si `dayPreference === undefined` : assignation positionnelle
    - Si pas de scSchedule : defaults `{2: [2,4], 3: [1,3,5]}`
    - Labels FR : `['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']`

- [x] **Task 2 : Labels + "Cette semaine" + recovery (F3-1)**
  - File: `src/services/motherSession/motherSessionLabels.ts`
  - Ajouter :
    ```
    this_week, session_mid_week, light_week_chip, recovery_why_title, recovery_why_body,
    understand_session, sessions_unavailable
    ```
  - Modifier : `annual_plan` reste dans le dict (pas de suppression) mais n'est plus utilisé côté joueur

- [x] **Task 3 : Dictionnaire FR sessions (FIX F2-2)**
  - File: `src/services/motherSession/motherSessionContentFr.ts` (nouveau)
  - Structure par `sessionId` :
    ```ts
    export interface SessionContentFr {
      goals: string[]
      sessionIdentity: string[]
      warmUpExercises: Array<{ name: string; prescription?: string }>
      warmUpNotes: string[]
      blocks: Array<{
        name: string
        format: string
        exercises: Array<{ name: string; prescription?: string }>
        coachingNotes: string[]
        fallbackOptions?: string[]
      }>
      progressionRules: string[]
      positionAccent: string[]
      coachingWarnings: string[]
      injurySubstitutions?: Array<{
        area: string
        remove: string[]
        replaceWith: string[]
        rehabFinisher: string[]
      }>
    }
    ```
  - Helper : `getSessionFr(sessionId): SessionContentFr | undefined` — retourne le contenu FR **seulement si la session est intégralement traduite** (tous les blocs présents et correspondants)
  - Commentaire SYNC en tête de fichier
  - 10 sessions traduites : RECOVERY_A/B, LOWER_IN_SEASON_FR/BT, UPPER_IN_SEASON_FR/BT, FULL_BODY_IN_SEASON_FR/BT, FULL_LIGHT_PRIMER_FR/BT

- [x] **Task 4 : SummaryCard — "Cette semaine" + recovery simplifié**
  - File: `src/components/motherSession/AnnualPlanningSummaryCard.tsx`
  - `msLabel('annual_plan')` → `msLabel('this_week')`
  - Recovery : fusionner chip fatigue + banner en 1 bloc :
    - Si `loadManagementOverride === 'recovery'` : chip "Semaine allégée" + phrase + `<details>` "Pourquoi ?" avec explication retour auto
    - Si `fatigueLevel === 'high'` seul : chip discret
    - Si `normal` : rien
  - Supprimer le warning technique "In-season recovery override" du rendu (filtrer `resolverWarnings` qui contiennent "recovery override")

- [x] **Task 5 : WeekPanel — jours réels + "Séances indisponibles" (F3-3)**
  - File: `src/components/motherSession/MotherSessionWeekPanel.tsx`
  - Props : `scSchedule`, `clubSchedule`
  - Appeler `mapSlotsToScheduleDays` → sous-labels jours FR réels
  - Remplacer "Mother sessions indisponibles" → `msLabel('sessions_unavailable', lang)`

- [x] **Task 6 : MotherSessionView — densité + "Comprendre cette séance" + FR**
  - File: `src/components/motherSession/MotherSessionView.tsx`
  - Props : `sessionId`, `injuries`
  - Utiliser `getSessionFr(sessionId)` — si dispo, passer le contenu FR aux enfants
  - Regrouper `progressionRules + positionAccent` dans un seul collapsible "Comprendre cette séance" — non rendu si les deux sont vides (FIX F4-2)
  - Injury subs : rendu seulement si `injuries && injuries.length > 0`

- [x] **Task 7 : MotherSessionBlock — coaching notes repliées + FR**
  - File: `src/components/motherSession/MotherSessionBlock.tsx`
  - Props optionnelles : `frBlock` (contenu FR si dispo)
  - Si `frBlock` présent : utiliser `frBlock.name`, `frBlock.format`, `frBlock.coachingNotes`, `frBlock.exercises[i].name`
  - Coaching notes dans `MotherSessionCollapsible` replié par défaut

- [x] **Task 8 : MotherSessionWarmUp — FR si dispo**
  - File: `src/components/motherSession/MotherSessionWarmUp.tsx`
  - Prop optionnelle `frWarmUp` — si dispo, noms d'exercices FR
  - Reste replié par défaut (déjà le cas)

- [x] **Task 9 : MotherSessionInjurySubs — conditionnel**
  - File: `src/components/motherSession/MotherSessionInjurySubs.tsx`
  - Pas de changement au composant — le conditionnel est dans `MotherSessionView` (Task 6)

- [x] **Task 10 : MotherSessionHeader — badges utiles**
  - File: `src/components/motherSession/MotherSessionHeader.tsx`
  - Supprimer badge `version` et `equipment`

- [x] **Task 11 : Pages — scSchedule + aria-labels + decisionReason (FIX F3-2)**
  - Files: `ProgramPage.tsx`, `WeekPage.tsx`, `SessionDetailPage.tsx`
  - Passer `profile.scSchedule` et `profile.clubSchedule` au WeekPanel
  - Passer `sessionId` et `profile.injuries` au MotherSessionView
  - Aria-labels : "Plan annuel mother sessions" → "Programme de la semaine"
  - **SessionDetailPage** : supprimer le bloc `orchestrator-fallback-reason` (decisionReason ne doit plus être visible au joueur)

- [x] **Task 12 : Écrire le dictionnaire FR — 10 sessions complètes**
  - File: `src/services/motherSession/motherSessionContentFr.ts`
  - Traduire intégralement les 10 sessions ciblées
  - Chaque session doit avoir TOUS les blocs traduits

- [x] **Task 13 : Tests (FIX F3-1/F5-1/F5-2/F5-3/F5-4/F5-5)**
  - File: `src/services/ui/__tests__/mapSlotsToScheduleDays.test.ts` (nouveau)
    - 2x avec scSchedule → jours corrects
    - 3x avec scSchedule + `mid_week` → 3 jours corrects
    - `pre_match` avec matchDay → bon jour
    - Fallback sans scSchedule → defaults
    - `pre_match` sans jour avant match → fallback dernier jour
  - File: `src/services/motherSession/__tests__/motherSessionContentFr.test.ts` (nouveau)
    - Pour chaque session du dict : nombre de blocs FR === nombre de blocs dans la session source
    - `getSessionFr` retourne undefined pour une session non traduite
  - File: `src/pages/__tests__/ProgramPage.annualPlanning.integration.test.tsx`
    - Remplacer `screen.getByText('Plan annuel')` → `screen.getByText('Cette semaine')` (F3-1/F5-2)
    - Vérifier absence de "Plan annuel" dans le rendu
  - File: `src/pages/__tests__/WeekPage.integration.test.tsx`
    - Mettre à jour si aria-label change (F5-5)
  - File: `src/pages/__tests__/SessionDetailPage.convergence.integration.test.tsx`
    - Vérifier absence de `orchestrator-fallback-reason` testid (F5-4)

### Acceptance Criteria

- [x] **AC 1**: Given `scSchedule = [{day:2},{day:4}]`, 2 slots, then tabs montrent "Mar" et "Jeu"
- [x] **AC 2**: Given 3 slots (early/mid/late) et scSchedule 3 jours, then les 3 jours FR corrects
- [x] **AC 3**: Given `pre_match` et `matchDay=6`, then le slot est placé sur le dernier jour muscu avant samedi
- [x] **AC 4**: Given le SummaryCard, then label = "Cette semaine" (pas "Plan annuel")
- [x] **AC 5**: Given recovery override, then 1 bloc : chip "Semaine allégée" + phrase + disclosure "Pourquoi ?"
- [x] **AC 6**: Given `FULL_OFFSEASON_RECOVERY_A_V1` avec traduction FR complète, then blocs/notes/formats en français
- [x] **AC 7**: Given une session NON traduite, then elle reste entièrement en EN (pas de mix)
- [x] **AC 8**: Given coaching notes dans un bloc, then repliées par défaut
- [x] **AC 9**: Given `profile.injuries = []`, then section adaptations blessures non rendue
- [x] **AC 10**: Given `progressionRules = [] && positionAccent = []`, then "Comprendre cette séance" non rendu
- [x] **AC 11**: Given SessionDetailPage, then `decisionReason` n'est plus visible au joueur

## Adversarial Review Log

| ID | Sev | Status | Description |
|----|-----|--------|-------------|
| F1-1 | HIGH | FIXED | `mid_week` ajouté au mapper + labels |
| F2-2 | HIGH | FIXED | Traduction complète par session ou rien |
| F3-1 | HIGH | FIXED | Test `Plan annuel` → `Cette semaine` |
| F5-1 | HIGH | FIXED | Test `mid_week` 3x ajouté |
| F5-2 | HIGH | FIXED | Assertion L324 explicitement listée |
| F1-2 | MED | FIXED | `pre_match` linéaire, pas circulaire |
| F3-2 | MED | FIXED | `decisionReason` supprimé de l'UI joueur |
| F4-2 | MED | FIXED | "Comprendre cette séance" non rendu si vide |
| F5-3 | MED | FIXED | Test bloc count FR vs source |
| F5-4 | MED | FIXED | SessionDetailPage tests ajoutés |
| F5-5 | MED | FIXED | WeekPage tests ajoutés |
| F2-1 | HIGH | ACCEPTED V1 | Dette sync documentée |
| F1-3 | LOW | FIXED | slots < scSchedule → sous-ensemble |
| F1-4 | LOW | FIXED | undefined dayPreference → positionnelle |
| F3-3 | LOW | FIXED | "Séances indisponibles" |
| F3-4 | LOW | ACCEPTED | "réglages avancés" mineur |
| F4-3 | LOW | ACCEPTED | "Comprendre" = grab-bag, acceptable |

### Notes
- Le dictionnaire FR est une dette de maintenance documentée — commentaire SYNC en tête de fichier
- Les sessions non traduites gardent leur contenu EN (dégradation gracieuse, pas de mix)
- Le gros du volume est Task 12 (traduction ~200-300 strings × 10 sessions)
