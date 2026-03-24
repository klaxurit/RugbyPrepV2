---
title: 'Exercise logging V1 — mother-session flow'
slug: 'exercise-logging-ms-v1'
created: '2026-03-23'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
adversarial_review: '2026-03-23 — 18 findings, 8 fixes integrated (F1-F9, F11-F14), 4 accepted/low'
tech_stack: ['React 19', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Vitest']
files_to_modify:
  - src/data/exercices.v1.json
  - src/data/exerciseMetricOverrides.v1.ts
  - src/services/motherSession/motherSessionExerciseMap.ts (new)
  - src/types/training.ts
  - src/types/motherSession.ts
  - src/hooks/useBlockLogs.ts
  - src/services/ui/suggestions.ts
  - src/services/ui/exerciseMetrics.ts
  - src/components/motherSession/MotherSessionBlock.tsx
  - src/components/motherSession/MotherSessionExerciseLogger.tsx (new)
  - src/pages/SessionDetailPage.tsx
  - supabase/migrations/20260324120000_block_logs_ms_context.sql (new)
  - src/services/motherSession/__tests__/motherSessionExerciseMap.test.ts (new)
  - src/services/ui/__tests__/suggestions.family.test.ts (new)
  - src/components/motherSession/__tests__/MotherSessionExerciseLogger.test.tsx (new)
code_patterns:
  - 'Dual storage localStorage + Supabase (useBlockLogs pattern)'
  - 'JSONB entries[] dans block_logs — pas de table exercise_logs séparée'
  - 'Metric detection 3-tier: override → exercise.metricType → heuristic'
  - 'Suggestion engine RER-aware (3 seuils: ≥3, ==2, ≤1)'
  - 'ExerciseId structuré: pattern__movement__equipment'
test_patterns:
  - 'Vitest + jsdom pour integration tests'
  - '@testing-library/react pour composants'
  - 'Tests purs pour services (suggestions, mapping, progression)'
---

# Tech-Spec: Exercise logging V1 — mother-session flow

**Created:** 2026-03-23

## Overview

### Problem Statement

1. Les mother sessions utilisent des noms d'exercices libres ("Bench Press") qui ne correspondent pas aux `exerciseId` du catalogue (`push_horizontal__bench_press__barbell`). 197/200 noms non-mappés → impossible de relier les exercices MS à l'historique détaillé.
2. `SessionDetailPage` n'offre plus de saisie détaillée par exercice depuis le passage au flow mother-session.
3. La logique de progression est trop générique (`+2.5 kg` partout) — pas de règles par famille.
4. `ExerciseLogEntry` manque de signal pour la progression (pas de `setsCompleted`, pas de `rir`).
5. Les gros lifts ne remontent pas vers `athletic_tests`.

### Solution

- Enrichir `exercices.v1.json` avec ~30 exercices MS manquants
- Créer `motherSessionExerciseMap.ts` : mapping explicite MS name → exerciseId
- Enrichir `ExerciseLogEntry` avec `setsCompleted` et `rir`
- Nouveau composant `MotherSessionExerciseLogger` intégré dans `MotherSessionBlock`
- Règles de progression par famille d'exercice (4 familles)
- Préparer (documenter) le pont `block_logs` → `athletic_tests`

### Scope

**In Scope :**
- Enrichissement catalogue exercices (passe exhaustive sur toutes les MS du scope V1)
- Mapping explicite MS exercise name → exerciseId (avec normalisation + alias)
- Extension `ExerciseLogEntry` (+setsCompleted, +rir) — JSONB, pas de migration colonne
- Migration DB : `block_logs` → colonnes contexte MS (`mother_session_id`, `program_source`)
- UI de log par exercice dans le flow mother-session
- Suggestions de charge par famille d'exercice
- Pré-remplissage depuis le dernier log
- Fallback non-loggable si exercice non mappé

**Out of Scope :**
- Auto-création `athletic_tests` depuis logs (V2)
- Dashboard staff complet
- Refonte moteur annual planning
- UI legacy côté joueur
- Ajout dépendances / modification `package.json`

## Context for Development

### Codebase Patterns

1. **Dual storage** : `useBlockLogs` → localStorage (`rugbyprep.blocklogs.v1`) + Supabase (`block_logs`). Supabase-first si authentifié.
2. **JSONB entries** : `block_logs.entries` JSONB = `ExerciseLogEntry[]`. Extension du type TS sans migration SQL.
3. **Metric detection 3-tier** : override (71 existants) → `exercise.metricType` → heuristic patterns.
4. **Suggestion RER-aware** : RER ≥ 3 → +2.5% charge. RER 2 → +1.25%. RER ≤ 1 → hold. Deload 85%. Fatigue hold.
5. **ExerciseId structuré** : `pattern__movement__equipment` (155 exercices). Double index `id` + `exerciseId` dans `exercises.ts`.
6. **Legacy SessionView** : pattern `EntryDraft` (Record<blockId, Record<exerciseId, draft>>), `saveBlockLog()`, pré-remplissage depuis last entry/suggestion. À réutiliser.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/data/exercices.v1.json` | Catalogue 155 exercices (source de vérité) |
| `src/data/exercises.ts` | Index Map + getExerciseById/getExerciseName |
| `src/data/exerciseMetricOverrides.v1.ts` | 71 overrides metricType + progressionHint + suggestionTemplate |
| `src/types/training.ts:353-370` | ExerciseLogEntry + BlockLog |
| `src/types/motherSession.ts` | Exercise = `{name, prescription?, role?, slotLabel?}` |
| `src/hooks/useBlockLogs.ts` | Dual-layer persistence + lecture API |
| `src/services/ui/suggestions.ts` | getExerciseSuggestion() RER-aware |
| `src/services/ui/exerciseMetrics.ts` | getExerciseMetricType() 3-tier |
| `src/services/ui/progression.ts` | getBestByWeek, getDelta, getRecentHistory |
| `src/components/SessionView.tsx` | Legacy logging UI (référence pattern, pas réimporté) |
| `src/components/motherSession/MotherSessionBlock.tsx` | Bloc MS actuel |
| `src/pages/SessionDetailPage.tsx` | Page séance MS |
| `src/knowledge/strength-methods.md` | KB règles progression |

### Technical Decisions

1. **Source de vérité exercices** : `exercices.v1.json` enrichi. Pas d'IDs ad hoc.
2. **Mapping MS → catalogue (FIX F2/F9)** : `motherSessionExerciseMap.ts` avec normalisation canonique. Le lookup se fait via `normalizeExerciseName(name)` — lowercase, trim, collapse whitespace, normaliser tirets/apostrophes. Le map stocke toutes les clés en forme normalisée. Les alias (ex: `db incline bench press` = `incline db bench press`) pointent vers le même `exerciseId`. Pas de matching texte heuristique runtime.
3. **Enrichissement ExerciseLogEntry** : +`setsCompleted?: number` +`rir?: number` (0-5). Pas de `completedAsWritten`, pas de `qualityScore`.
4. **Exercice non mappé** : non-loggable en V1. Pas de ligne de log individuelle rendue — note discrète au niveau du bloc : "Certains exercices de ce bloc ne sont pas encore loggables". Pas de crash, pas de badge par exercice.
5. **Persistance** : `block_logs` existant avec JSONB étendu. Pas de nouvelle table.
6. **BlockId pour MS** : `{motherSessionId}_B{blockNumber}` (ex: `LOWER_IN_SEASON_FRONT_ROW_V1_B1`). Déterministe.
7. **SessionType mapping (FIX F1)** : `upper→UPPER, lower→LOWER, full/full_light_primer→FULL, speed_power→CONDITIONING`. **Le type `RECOVERY` n'est PAS ajouté** à la contrainte SQL de `block_logs` ni de `session_logs`. Les MS recovery (`FULL_OFFSEASON_RECOVERY_A/B_V1`) ont `metadata.sessionType: 'full'` → loguées comme `FULL`. Le contexte recovery est identifié par le `motherSessionId`. **Aucun code ne doit jamais écrire `sessionType: 'RECOVERY'` dans `block_logs`** — si le TS type `SessionType` le contient, ajouter un runtime guard dans `addBlockLog` qui remaps `RECOVERY → FULL`.
8. **Pont athletic_tests** : V1 = helper d'estimation 1RM exposé (`estimate1RMFromLog`), pas d'auto-écriture. V2 = prompt de confirmation joueur. Mouvements éligibles : bench press barbell, back squat barbell, front squat barbell. Trap bar deadlift = éligible sous réserve (formule Brzycki acceptable si ≥ 3 reps, mais décote 5% vs barbell conventionnel — à documenter).
9. **Colonnes staff-ready dans `block_logs`** : `mother_session_id TEXT` + `program_source TEXT DEFAULT 'legacy'` ajoutées en V1 (migration). `session_logs` a déjà ces colonnes (migration 20260321140000). Non exposées UI joueur, prêtes pour le staff.

## Implementation Plan

### Tasks

- [x] **Task 1 : Migration DB — block_logs colonnes contexte MS**
  - File: `supabase/migrations/20260324120000_block_logs_ms_context.sql` (nouveau)
  - Action :
    - `ALTER TABLE block_logs ADD COLUMN IF NOT EXISTS mother_session_id TEXT`
    - `ALTER TABLE block_logs ADD COLUMN IF NOT EXISTS program_source TEXT DEFAULT 'legacy'`
    - `ALTER TABLE block_logs ADD CONSTRAINT block_logs_program_source_check CHECK (program_source IS NULL OR program_source IN ('legacy', 'mother_session'))`
    - `CREATE INDEX block_logs_ms_id ON block_logs(user_id, mother_session_id)` pour futures queries staff
  - Notes :
    - `session_logs` a **déjà** `mother_session_id` et `program_source` (migration 20260321140000). Pas besoin de les toucher.
    - Pas d'ajout de `RECOVERY` à la contrainte `session_type` — les MS recovery sont `sessionType: 'full'` → se loguent comme `FULL`. Le contexte recovery est identifié par le `motherSessionId` (ex: `FULL_OFFSEASON_RECOVERY_A_V1`).

- [x] **Task 2 : Enrichir le catalogue exercices (FIX F3)**
  - File: `src/data/exercices.v1.json`
  - Action : **passe exhaustive** sur tous les noms d'exercices uniques dans `motherSessions.generated.ts`. Pour chaque nom :
    - S'il existe déjà dans le catalogue → pas d'ajout (mais vérifier que le mapping l'inclut)
    - S'il n'existe pas → l'ajouter au catalogue avec le format existant
    - S'il est une variante mineure d'un existant (ex: `Weighted Calf Raise` vs `calf__standing_raise__bodyweight`) → créer une entrée distincte si le `metricType` ou l'équipement diffère
  - L'agent qui implémente cette tâche **doit** :
    1. Extraire programmatiquement tous les noms uniques de `blocks[].exercises[].name` dans `motherSessions.generated.ts`
    2. Comparer chaque nom (normalisé lowercase) au catalogue existant
    3. Ajouter les manquants
    4. Reporter le compte exact : N ajoutés / N déjà existants / N alias
  - Exemples de manquants confirmés (liste non exhaustive — la passe exhaustive peut en trouver plus) :
    - `hinge__deadlift__trap_bar`, `push_horizontal__bench_press__football_bar`, `core_rotation__landmine_rotation`, `pull_horizontal__landmine_row`, `arm_curl__hammer_curl__dumbbell`, `arm_extension__french_press__ez_bar`, `arm_extension__skull_crusher__ez_bar`, `arm_extension__pressdown__cable_rope`, `arm_curl__alternating_curl__dumbbell`, `hinge__rdl__single_leg__dumbbell`, `core_rotation__cable_chop`, `shoulder_isolation__lateral_raise__dumbbell`, `knee_extension__leg_extension__machine`, `squat__leg_press__machine`, `mobility__ankle_rocks`, `power__pogo_hops__low`, `mobility__adductor_rock_back`, `locomotion__bear_crawl`, `squat__anderson_box_squat__banded`, `hinge__kb_swing__banded`, `neck__extension__band`, `pull_horizontal__cable_row__half_kneeling`, `calf__seated_raise__machine`, `push_horizontal__bench_press__incline__dumbbell`, `squat__pin_squat__barbell`
  - **metricType pour exercices bandés (FIX F15)** : `squat__anderson_box_squat__banded` → `metricType: 'reps'` (pas `load_reps` — la charge est la tension de bande, non mesurable en kg)

- [x] **Task 3 : Créer le mapping MS → exerciseId (FIX F2/F4/F9)**
  - File: `src/services/motherSession/motherSessionExerciseMap.ts` (nouveau)
  - Action : créer le mapping avec **normalisation canonique** et gestion des alias/variantes.
  - Structure :
    ```ts
    /**
     * Normalise un nom d'exercice MS vers une forme canonique pour le lookup.
     * lowercase → trim → collapse whitespace → normaliser tirets.
     */
    export function normalizeExerciseName(name: string): string {
      return name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/['']/g, "'")
    }

    /**
     * Mapping explicite : nom normalisé → exerciseId canonique du catalogue.
     * TOUTES les clés sont en forme normalisée (lowercase, trimmed).
     * Les alias pointent vers le même exerciseId.
     *
     * Seuls les exercices présents ici sont loggables en V1.
     */
    const MS_EXERCISE_MAP: Record<string, string> = {
      'bench press': 'push_horizontal__bench_press__barbell',
      'back squat': 'squat__back_squat__barbell',
      'front squat': 'squat__front_squat__barbell',
      'trap bar deadlift': 'hinge__deadlift__trap_bar',
      // Alias : même exercice, noms différents dans le dataset
      'db incline bench press': 'push_horizontal__bench_press__incline__dumbbell',
      'incline db bench press': 'push_horizontal__bench_press__incline__dumbbell',
      'single-leg rdl': 'hinge__rdl__single_leg__dumbbell',
      'single-leg romanian deadlift': 'hinge__rdl__single_leg__dumbbell',
      'copenhagen hold': 'groin_adductors__copenhagen_plank__weighted',
      'copenhagen plank': 'groin_adductors__copenhagen_plank__weighted',
      'short copenhagen hold': 'groin_adductors__copenhagen_plank__short',
      'tibialis raise': 'tibialis__raise__bodyweight',
      'wall tibialis raise': 'tibialis__raise__bodyweight',
      'banded kb swing': 'hinge__kb_swing__banded',
      'banded kettlebell swing': 'hinge__kb_swing__banded',
      // Warm-up (lowercase dans le dataset)
      'ankle rocks': 'mobility__ankle_rocks',
      'adductor rock-back': 'mobility__adductor_rock_back',
      'scap push-up': 'prehab_shoulder__scap_pushup__bodyweight',
      // ... exhaustif, généré par la passe de Task 2
    }

    /** Résout un nom d'exercice MS vers un exerciseId. Normalise avant lookup. */
    export function resolveExerciseId(msExerciseName: string): string | undefined {
      return MS_EXERCISE_MAP[normalizeExerciseName(msExerciseName)]
    }
    ```
  - **Exercices "or" (FIX F4)** : les noms contenant " or " (ex: `'Chest-Supported Row or T-Bar Row'`) sont **non-loggables en V1**. Pas de mapping. Pas de fausse continuité de données. La note de bloc indiquera "Certains exercices de ce bloc ne sont pas encore loggables". En V2 : ajouter un sélecteur de variante dans le logger.
  - **Couverture** : la passe exhaustive de Task 2 génère la liste complète. Le mapping couvre tous les exercices ayant un exerciseId catalogue unique. Les directives textuelles ("2 progressive prep sets", "Shoulder Prehab Micro-Block") et les exercices "or" sont exclus.
  - **Test d'exhaustivité** : un test automatisé vérifie que chaque exercice unique du dataset MS (hors directives et "or") a une entrée dans le map. Si un nom manque, le test échoue avec le nom exact à ajouter.

- [x] **Task 4 : Enrichir ExerciseLogEntry**
  - File: `src/types/training.ts`
  - Action : ajouter 2 champs optionnels à `ExerciseLogEntry` :
    ```ts
    export interface ExerciseLogEntry {
      exerciseId: string;
      loadKg?: number;
      reps?: number;
      seconds?: number;
      meters?: number;
      note?: string;
      setsCompleted?: number;  // NEW — nombre de séries faites (vs prescrites)
      rir?: number;            // NEW — 0-5, reps in reserve estimé
    }
    ```
  - Notes : JSONB dans `block_logs.entries` → rétrocompatible sans migration SQL. Les anciens logs sont toujours lisibles (champs undefined).

- [x] **Task 5 : Adapter useBlockLogs pour le flow MS (FIX F7/F8)**
  - File: `src/hooks/useBlockLogs.ts` + `src/types/training.ts`
  - Action — round-trip complet documenté :
    1. **Type BlockLog** (`training.ts`) : ajouter `motherSessionId?: string` et `programSource?: 'legacy' | 'mother_session'`
    2. **Type BlockLogRow** (`useBlockLogs.ts`) : ajouter `mother_session_id?: string | null` et `program_source?: string | null`
    3. **`logToRow`** : mapper explicitement les nouveaux champs :
       ```ts
       const logToRow = (log: BlockLog, userId: string): BlockLogRow => ({
         ...existingMapping,
         mother_session_id: log.motherSessionId ?? null,
         program_source: log.programSource ?? 'legacy',
       })
       ```
    4. **`rowToLog`** : lire les nouveaux champs :
       ```ts
       const rowToLog = (row: BlockLogRow): BlockLog => ({
         ...existingMapping,
         motherSessionId: row.mother_session_id ?? undefined,
         programSource: (row.program_source as BlockLog['programSource']) ?? undefined,
       })
       ```
    5. **SELECT clause** : mettre à jour le `.select()` Supabase pour inclure `mother_session_id, program_source` :
       ```ts
       .select('id, date_iso, week, session_type, block_id, block_name, entries, mother_session_id, program_source')
       ```
    6. **Guard RECOVERY (FIX F1)** : dans `addBlockLog`, si `log.sessionType === 'RECOVERY'`, remapper silencieusement à `'FULL'` avant l'insert pour éviter la violation de contrainte SQL.

- [x] **Task 6 : Ajouter les metric overrides pour les nouveaux exercices**
  - File: `src/data/exerciseMetricOverrides.v1.ts`
  - Action : ajouter overrides pour les ~22 nouveaux exercices du catalogue. Exemples :
    ```ts
    'hinge__deadlift__trap_bar': { metricType: 'load_reps', progressionHint: 'load', suggestionTemplate: 'Charge nette, pas de grind. +2.5-5 kg si toutes séries propres.' },
    'arm_curl__hammer_curl__dumbbell': { metricType: 'load_reps', progressionHint: 'load', suggestionTemplate: 'Progresse par reps d\'abord, puis charge.' },
    'core_rotation__landmine_rotation': { metricType: 'load_reps', progressionHint: 'quality', suggestionTemplate: 'Contrôle et amplitude, pas charge.' },
    'locomotion__bear_crawl': { metricType: 'meters', progressionHint: 'distance', suggestionTemplate: 'Distance propre, pas de vitesse forcée.' },
    'neck__extension__band': { metricType: 'seconds', progressionHint: 'quality', suggestionTemplate: 'Isométrique contrôlé, augmente le temps si stable.' },
    ```

- [x] **Task 7 : Implémenter les règles de progression par famille**
  - File: `src/services/ui/suggestions.ts`
  - Action : remplacer la logique flat de progression par un dispatch par famille. Ajouter `progressionFamily` comme champ explicite dans les overrides **(FIX F6)**.
  - **Approche** : PAS d'inférence heuristique ambiguë. La famille est définie explicitement dans `exerciseMetricOverrides.v1.ts` pour chaque exercice qui en a besoin. Fallback `assistance` pour les exercices sans override.
    ```ts
    // Dans exerciseMetricOverrides.v1.ts — type étendu :
    export type ProgressionFamily = 'upper_compound' | 'lower_compound' | 'assistance' | 'ballistic_iso'

    export interface ExerciseMetricOverride {
      metricType: ExerciseMetricType
      progressionHint: string
      suggestionTemplate: string
      progressionFamily?: ProgressionFamily  // NEW — explicite, pas inféré
    }

    // Exemples d'overrides avec famille explicite :
    'push_horizontal__bench_press__barbell': { ..., progressionFamily: 'upper_compound' },
    'squat__back_squat__barbell': { ..., progressionFamily: 'lower_compound' },
    'hinge__hip_thrust__barbell': { ..., progressionFamily: 'lower_compound' },  // FIX F6: pas assistance
    'power__push_press__barbell': { ..., progressionFamily: 'upper_compound' },  // FIX F6: pas assistance
    'power__landmine_press__speed': { ..., progressionFamily: 'assistance' },     // FIX F6: pas upper_compound
    'arm_curl__hammer_curl__dumbbell': { ..., progressionFamily: 'assistance' },
    'power__jump__broad_jump': { ..., progressionFamily: 'ballistic_iso' },
    ```
  - `getProgressionFamily(exerciseId)` :
    ```ts
    export function getProgressionFamily(exerciseId: string): ProgressionFamily {
      return EXERCISE_METRIC_OVERRIDES[exerciseId]?.progressionFamily ?? 'assistance'
    }
    ```
  - **Tous les exercices ambigus** (landmine press, hip thrust, push press, single-arm DB row, nordic curl) doivent avoir une `progressionFamily` explicite dans leur override. Pas de déduction par tags/pattern.
  - Modifier `getExerciseSuggestion()` pour utiliser la famille :
    - **upper_compound** : incrément +1.25 à +2.5 kg. Condition : `rir >= 2 && setsCompleted >= prescrit`. Sinon hold.
    - **lower_compound** : incrément +2.5 à +5 kg (in-season: +2.5 max). Condition : `rir >= 2 && qualité`. Sinon hold.
    - **assistance** : progression par reps d'abord (si haut fourchette atteint → +1.25-2.5 kg et retour bas). Incrément charge uniquement si `rir >= 2`.
    - **ballistic_iso** : pas d'incrément charge. Progression distance (+2-5m) / durée (+5s) / reps (+1-2) si `rir >= 2`. Sinon hold.
  - Tenir compte de `fatigue` et `recovery override` : aucune progression si fatigue ou recovery.
  - **Backward compatibility (FIX F5)** : si `lastEntry.rir === undefined` ET `lastEntry.setsCompleted === undefined` (ancien log sans les nouveaux champs), **fallback sur la logique RER-based existante** (basée sur `targetRer` prescrit, pas sur le RIR reporté). La logique par famille ne s'active QUE quand `rir` est défini dans le `lastEntry`. Ceci garantit zéro régression pour les utilisateurs existants.
  - **Priorité des signaux (FIX F12)** : RIR (user-reported) prime sur RER (prescribed) quand disponible. Si `rir` est présent → utiliser la logique par famille. Si `rir` est absent → fallback logique RER actuelle. Pas de conflit entre les deux.

- [x] **Task 8 : Créer le composant MotherSessionExerciseLogger**
  - File: `src/components/motherSession/MotherSessionExerciseLogger.tsx` (nouveau)
  - Action : composant de saisie par exercice, inspiré du pattern legacy `SessionView.tsx` mais adapté au design MS.
  - Props :
    ```ts
    type Props = {
      exerciseId: string | undefined  // undefined = non mappé
      exerciseName: string            // nom affiché
      metricType: ExerciseMetricType
      lastEntry?: ExerciseLogEntry
      suggestion?: Suggestion
      draft: EntryDraft
      onDraftChange: (patch: Partial<EntryDraft>) => void
      lang?: AppLang
    }
    ```
  - Rendu :
    - Seuls les exercices avec un `exerciseId` résolu sont rendus (les non-mappés sont omis du logger)
    - Si `metricType === 'load_reps'` : inputs Charge (kg) + Reps + RIR (select 0-5) + Séries (number)
    - Si `metricType === 'reps'` : input Reps + Séries
    - Si `metricType === 'seconds'` : input Durée (s) + Séries
    - Si `metricType === 'meters'` : input Distance (m) + Séries
    - Tous : input Note (optionnel, collapsé)
    - Pré-remplissage : depuis `lastEntry` ou `suggestion` (priorité lastEntry)
    - Design : compact, fond `bg-white/5`, border `border-white/10`, cohérent avec le style MotherSessionBlock

- [x] **Task 9 : Intégrer le logger dans MotherSessionBlock**
  - File: `src/components/motherSession/MotherSessionBlock.tsx`
  - Action :
    - **Le toggle "Logger mes perfs" n'est rendu QUE si au moins 1 exercice du bloc a un exerciseId résolu (FIX F11)**. Les blocs prehab, warm-up purs, et blocs sans aucun exercice mappé n'affichent pas le toggle.
    - Quand ouvert : pour chaque exercice du bloc **dont `resolveExerciseId(name)` retourne un exerciseId**, rendre un `MotherSessionExerciseLogger`
    - Si certains exercices du bloc ne sont pas mappés (mais d'autres le sont) : note discrète `text-white/30 text-[10px]` : "Certains exercices de ce bloc ne sont pas encore loggables"
    - Passer `getExerciseMetricType({ exerciseId })`, `getLastEntryForExercise(exerciseId)`, `getExerciseSuggestion(...)` pour chaque exercice résolu
    - Bouton "Enregistrer le bloc" en bas → appelle `onSaveBlock(blockLog)`
  - Nouvelles props sur `MotherSessionBlock` :
    ```ts
    type MotherSessionBlockProps = {
      block: Block
      lang?: AppLang
      frBlock?: SessionContentFr['blocks'][0]
      // NEW — logging
      motherSessionId?: string
      sessionType?: SessionType
      week?: CycleWeek
      fatigue?: FatigueStatus
      onSaveBlock?: (log: Omit<BlockLog, 'id'>) => void
      getLastEntryForExercise?: (exerciseId: string) => ExerciseLogEntry | undefined
    }
    ```

- [x] **Task 10 : Brancher le logging dans SessionDetailPage**
  - File: `src/pages/SessionDetailPage.tsx`
  - Action :
    - Importer `useBlockLogs`
    - Passer les props de logging à chaque `MotherSessionBlock` via `MotherSessionView`
    - Adapter `MotherSessionView` pour transmettre les props logging aux blocs
    - Le `blockId` pour un bloc MS = `${motherSessionId}_B${block.number}`
    - Le `sessionType` = mapping `MotherSessionType → SessionType` :
      - `upper→UPPER, lower→LOWER, full→FULL, full_light_primer→FULL, speed_power→CONDITIONING`
    - Quand `onSaveBlock` est appelé, écrire via `addBlockLog()` avec `motherSessionId` et `programSource: 'mother_session'`

- [x] **Task 11 : Tests mapping + normalisation + exhaustivité (FIX F2/F3/F4/F9)**
  - File: `src/services/motherSession/__tests__/motherSessionExerciseMap.test.ts` (nouveau)
  - Tests :
    - **Normalisation** : `resolveExerciseId('BENCH PRESS')` === `resolveExerciseId('bench press')` === `resolveExerciseId('Bench Press')`
    - **Alias** : `resolveExerciseId('DB Incline Bench Press')` === `resolveExerciseId('Incline DB Bench Press')`
    - **Alias warm-up** : `resolveExerciseId('ankle rocks')` === `resolveExerciseId('Ankle Rocks')`
    - **Inconnu** : `resolveExerciseId('UNKNOWN_EXERCISE')` → `undefined`
    - **Exercices "or"** : `resolveExerciseId('Chest-Supported Row or T-Bar Row')` → `undefined` (non-loggable en V1)
    - **Intégrité catalogue** : pour chaque entrée du map, `getExerciseById(exerciseId)` !== undefined
    - **Exhaustivité** : extraire tous les `blocks[].exercises[].name` uniques du dataset MS généré. Pour chaque nom (hors directives textuelles et exercices "or"), vérifier qu'il a une entrée dans le map. Si un nom manque → le test échoue avec le nom exact à ajouter.

- [x] **Task 12 : Tests suggestions par famille + backward compat (FIX F5/F13)**
  - File: `src/services/ui/__tests__/suggestions.family.test.ts` (nouveau)
  - Tests :
    - **Famille explicite** : `getProgressionFamily('push_horizontal__bench_press__barbell')` → `'upper_compound'`
    - `getProgressionFamily('squat__back_squat__barbell')` → `'lower_compound'`
    - `getProgressionFamily('hinge__hip_thrust__barbell')` → `'lower_compound'` (pas assistance)
    - `getProgressionFamily('power__push_press__barbell')` → `'upper_compound'` (pas assistance)
    - `getProgressionFamily('power__landmine_press__speed')` → `'assistance'` (pas upper_compound)
    - `getProgressionFamily('arm_curl__hammer_curl__dumbbell')` → `'assistance'`
    - `getProgressionFamily('power__jump__broad_jump')` → `'ballistic_iso'`
    - **Famille fallback** : exercice sans override → `'assistance'`
    - **Progression par famille** : upper_compound +1.25-2.5 kg, lower_compound +2.5-5 kg, assistance reps-first, ballistic pas de charge
    - **Fatigue** → hold pour toutes les familles
    - **Deload** → réduction pour toutes les familles
    - **Backward compat (FIX F5/F13)** : `getExerciseSuggestion({ lastEntry: { loadKg: 80, reps: 5 } })` (sans `rir` ni `setsCompleted`) → **fallback sur logique RER existante**, PAS sur la logique famille "hold". Doit retourner un incrément de progression identique à l'ancien comportement.
    - **Transition** : `getExerciseSuggestion({ lastEntry: { loadKg: 80, reps: 5, rir: 2, setsCompleted: 4 } })` → utilise la logique par famille

- [x] **Task 13 : Tests composant MotherSessionExerciseLogger**
  - File: `src/components/motherSession/__tests__/MotherSessionExerciseLogger.test.tsx` (nouveau)
  - Tests :
    - Bloc sans aucun exercice mappé → **pas de toggle "Logger mes perfs"** (FIX F11)
    - Bloc avec exercices partiellement mappés → toggle visible, note discrète, lignes uniquement pour les mappés
    - load_reps → inputs charge + reps + rir + séries visibles
    - seconds → input durée + séries visibles, pas de charge
    - Pré-remplissage depuis lastEntry → inputs pré-remplis
    - Modification d'un input → onDraftChange appelé avec le bon patch

- [x] **Task 14 : Test intégration SessionDetailPage + round-trip block_logs (FIX F14)**
  - File: `src/pages/__tests__/SessionDetailPage.convergence.integration.test.tsx` (mise à jour)
  - Tests :
    - Le toggle "Logger mes perfs" est visible sur les blocs avec exercices mappés
    - Le toggle **n'est PAS visible** sur les blocs prehab/warm-up sans exercices mappés
    - Flow annual-first non régressé (les tests existants passent toujours)
    - Exercice non mappé ne casse pas le rendu
    - **Round-trip block_logs (FIX F14)** : mock Supabase, écrire un BlockLog avec `motherSessionId` + `programSource`, relire → les champs sont présents. Le SELECT inclut les nouvelles colonnes.

### Acceptance Criteria

- [x] **AC 1**: Given un exercice MS "Bench Press" (ou "BENCH PRESS" ou "bench press"), when `resolveExerciseId()` est appelé, then retourne `'push_horizontal__bench_press__barbell'` et `getExerciseById()` sur cet ID retourne un exercice valide. (FIX F2 — normalisation)
- [x] **AC 2**: Given un bloc MS contenant des exercices non mappés mais au moins 1 mappé, when le logger est ouvert, then les exercices non mappés ne génèrent pas de ligne de log, une note discrète indique "Certains exercices de ce bloc ne sont pas encore loggables", et aucun crash ne se produit.
- [x] **AC 3**: Given un exercice load_reps (Bench Press) avec un lastEntry de 80kg × 5 reps, when le logger est ouvert, then les inputs sont pré-remplis avec 80kg et 5 reps.
- [x] **AC 4**: Given un exercice load_reps upper_compound avec RIR = 3, when la suggestion est calculée, then elle propose +1.25 ou +2.5 kg (pas +5 kg).
- [x] **AC 5**: Given un exercice lower_compound (Back Squat) avec RIR = 2, when la suggestion est calculée, then elle propose +2.5 à +5 kg.
- [x] **AC 6**: Given un exercice assistance (Hammer Curl) au haut de sa fourchette reps avec RIR = 2, when la suggestion est calculée, then elle propose +charge et retour au bas de la fourchette reps.
- [x] **AC 7**: Given un exercice ballistic (Broad Jump), when la suggestion est calculée, then elle ne propose PAS d'incrément de charge mais une progression par qualité/distance.
- [x] **AC 8**: Given fatigue = 'FATIGUE', when n'importe quelle suggestion est calculée, then elle propose de maintenir (hold), quelle que soit la famille.
- [x] **AC 9**: Given le joueur clique "Enregistrer le bloc" avec des entrées valides, when `addBlockLog` est appelé, then le `blockId` est `{motherSessionId}_B{blockNumber}`, `motherSessionId` et `programSource: 'mother_session'` sont écrits en Supabase ET lisibles via le SELECT. (FIX F7/F8)
- [x] **AC 10**: Given un `ExerciseLogEntry` avec `setsCompleted: 3` et `rir: 2`, when il est persisté dans `block_logs.entries` JSONB, then il est relisible intégralement via `useBlockLogs`.
- [x] **AC 11**: Given le flow SessionDetailPage avec mother-session, when le joueur navigue vers une séance, then les blocs avec exercices mappés affichent le toggle "Logger mes perfs", les blocs sans exercice mappé ne l'affichent pas, et la complétion existante fonctionne toujours. (FIX F11)
- [x] **AC 12 (NEW)**: Given un ancien `ExerciseLogEntry` sans `rir` ni `setsCompleted` (log pré-V1), when la suggestion est calculée, then elle utilise la logique RER-based existante (pas de régression "hold"). (FIX F5)
- [x] **AC 13 (NEW)**: Given un exercice MS dont le nom contient " or " (ex: "Chest-Supported Row or T-Bar Row"), when `resolveExerciseId()` est appelé, then il retourne `undefined` (non-loggable V1, pas de fausse continuité). (FIX F4)
- [x] **AC 14 (NEW)**: Given `'DB Incline Bench Press'` et `'Incline DB Bench Press'`, when `resolveExerciseId()` est appelé sur les deux, then les deux retournent le même `exerciseId`. (FIX F9)

## Additional Context

### Dependencies

- Aucune dépendance externe à ajouter
- Dépend du catalogue `exercices.v1.json` enrichi (Task 2) avant le mapping (Task 3)
- Dépend de la migration DB (Task 1) avant le write path (Task 5/10)
- Dépend du mapping (Task 3) avant l'UI (Task 8/9)

### Testing Strategy

**Tests unitaires (services purs) :**
- `motherSessionExerciseMap.test.ts` : normalisation casse, alias, exercices "or", intégrité catalogue, exhaustivité dataset
- `suggestions.family.test.ts` : 4 familles × conditions (normal, fatigue, deload) + backward compat (old logs sans rir/setsCompleted → fallback RER)
- Tests existants `suggestions.ts` / `progression.ts` : vérifier non-régression

**Tests composant (jsdom) :**
- `MotherSessionExerciseLogger.test.tsx` : rendu conditionnel par metricType, blocs sans exercice mappé → pas de toggle, blocs partiels → note discrète
- Intégration `SessionDetailPage` : toggle visible/invisible selon blocs, round-trip block_logs avec mock Supabase (FIX F14), non-régression flow existant

**Tests manuels :**
- Vérifier que la saisie sur un bloc mother-session persiste en localStorage + Supabase
- Vérifier que le pré-remplissage fonctionne sur une 2e séance de même type
- Vérifier que les blocs prehab/warm-up n'affichent pas le toggle logger
- Vérifier que les exercices "or" n'affichent pas d'inputs de log

### Notes

**Risques identifiés et mitigations :**
- **Maintenance du mapping** : `MS_EXERCISE_MAP` doit être mis à jour à chaque nouvelle mother session. Mitigé par un test d'exhaustivité qui échoue si un exercice MS n'a pas d'entrée dans le map.
- **Exercices "or" (F4 — mitigé)** : non-loggables en V1. Pas de fausse continuité de données. V2 = sélecteur de variante.
- **JSONB schema drift** : `block_logs.entries` JSONB sans validation DB. Mitigé par TypeScript strict + tests round-trip.
- **Colonnes staff-ready** : `mother_session_id` + `program_source` ajoutées avec round-trip complet (FIX F7/F8). Coût = 0 si non utilisées.
- **RECOVERY landmine (F1 — mitigé)** : guard runtime dans `addBlockLog` qui remaps `RECOVERY → FULL`. Le TS type reste inchangé mais la DB ne reçoit jamais `RECOVERY`.
- **Backward compat (F5 — mitigé)** : old logs sans `rir`/`setsCompleted` → fallback sur logique RER existante. Zéro régression pour users existants. Testé explicitement.
- **Blocs partiellement loggables (F10 — accepté V1)** : un BlockLog peut contenir moins d'entries que d'exercices dans le bloc. Pas de champ `completeness` en V1 — le consumer sait que les entries sont par exerciseId, pas par position. Acceptable pour le use case V1.
- **blockId discontinuité legacy→MS (F17 — accepté)** : les blockIds MS (`LOWER_IN_SEASON_FRONT_ROW_V1_B1`) sont distincts des legacy (`BLK_STR_LOWER_01`). Pas de continuité bloc-level, mais la continuité exercice-level est assurée via `exerciseId`.

**Pont athletic_tests — V1 (helper d'estimation) + V2 (prompt joueur) :**

En V1, un helper pur `estimate1RMFromLog(entry: ExerciseLogEntry): number | null` est exposé dans `src/services/athleticTesting/estimateOneRM.ts` (existe déjà : Brzycki/Epley). Il n'écrit rien. Il sera appelé par le futur V2.

En V2, quand un log load_reps sur un lift éligible avec ≥ 3 reps produit un 1RM estimé supérieur au dernier `athletic_tests.one_rm_*`, afficher un prompt : "Nouveau record estimé ! Enregistrer ?". Le joueur confirme explicitement. Pas d'auto-écriture.

**Mouvements éligibles :**
| exerciseId | Test type | Formule | Notes |
|---|---|---|---|
| `push_horizontal__bench_press__barbell` | `one_rm_bench` | Brzycki (≥ 3 reps) | Standard, pas de décote |
| `squat__back_squat__barbell` | `one_rm_squat` | Brzycki (≥ 3 reps) | Standard |
| `squat__front_squat__barbell` | `one_rm_squat` | Brzycki (≥ 3 reps) | ~85% du back squat théorique, acceptable pour estimation |
| `hinge__deadlift__trap_bar` | `one_rm_deadlift` | Brzycki (≥ 3 reps) | Décote 5% vs barbell conventionnel — le trap bar sur-estime légèrement. À documenter dans l'UI V2. |

**Non éligibles V1** : football bar bench (trop spécifique), hex bar RDL (pas un deadlift max), landmine press (profil de force différent).

**En V1 concrètement** : aucun test n'est créé automatiquement. Le helper existe mais n'est pas appelé. La liste d'éligibilité est documentée et testée (mapping exerciseId → testType).

**Règles de progression par famille (résumé) :**

| Famille | Incrément charge | Condition montée | Hold | Fatigue/Recovery |
|---------|-----------------|-----------------|------|------------------|
| Upper compound | +1.25 à +2.5 kg | RIR ≥ 2, séries complètes | RIR ≤ 1 | Hold |
| Lower compound | +2.5 à +5 kg (in-season: +2.5 max) | RIR ≥ 2, vitesse maintenue | RIR ≤ 1 | Hold |
| Assistance | Reps d'abord, puis +1.25-2.5 kg | Haut de fourchette + RIR ≥ 2 | RIR ≤ 1 | Hold |
| Ballistic/iso | Pas de charge | Reps/distance/durée si RIR ≥ 2 | RIR ≤ 1 | Réduire volume |
