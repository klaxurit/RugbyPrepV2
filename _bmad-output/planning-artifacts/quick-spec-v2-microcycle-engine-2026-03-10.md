---
title: 'Quick Spec V2 — Moteur orienté microcycle réel'
slug: 'quick-spec-v2-microcycle-engine'
created: '2026-03-10'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['TypeScript', 'React', 'Vite', 'Vitest']
sources:
  - _bmad-output/planning-artifacts/research/gold-standard-rugby-microcycles-2026-03-10.md
  - _bmad-output/planning-artifacts/adversarial-review-engine-2026-03-10.md
  - _bmad-output/planning-artifacts/edge-case-review-engine-2026-03-10.md
  - _bmad-output/planning-artifacts/diagnostic-moteur-synthese-2026-03-10.md
  - _bmad-output/planning-artifacts/research/domain-feminine-u18-rugby-research-2026-03-10.md
---

# Quick Spec V2 — Moteur orienté microcycle réel

## 1. Executive Decision

- **Plan incrémental confirmé: OUI.** Le pipeline actuel reste exploitable, mais doit passer d’un mode “assemblage de blocs” à un mode “microcycle-first” avec invariants explicites (`C-1`, `M-5`, `EC-01`, `EC-07`, verdict diagnostic).
- **Architecture minimale “pro”:** ajouter 3 couches au-dessus du pipeline existant:
- `microcycle archetype` (ordre et intention hebdo),
- `session identity` (pourquoi aujourd’hui + intensité + rôle),
- `quality gates` (hard contracts bloquants + score qualité).
- **Hard constraints vs soft rules:** safety/rehab/U18/contrats d’entrée = hard; modulation intensité/position/cycle = soft (`EC-05`, `EC-06`, `FEM-U18-S10`, `FEM-U18-S13`, `GS-MC-01`).
- **Data model:** P0 = schéma minimal microcycle + identité + gates; P1 = enrichissement progression/segment.
- **Mesure qualité objective:** livrer avec scorecard hebdo versionnée et seuil release (`dangerous=0`, `broken=0`, score >= 85/100).

---

## 2. Architecture cible (avant/après)

### 2.1 Avant (état actuel)

| Couche | État actuel | Limite |
|---|---|---|
| Routing semaine | `buildWeekProgram.ts` route des recettes par phase/level + policies safety | Pas de contrat microcycle explicite “ordre + rôle + match proximity” (`M-2`, `EC-11`) |
| Construction séance | `buildSessionFromRecipe.ts` remplit des slots via intents/tags/fallbacks | Peut livrer des séances dégradées si slots requis manquants (`EC-07`, `M-5`) |
| Validation | `validateSession.ts` contrôle structure locale | Pas de gate hebdo ni score qualité global |
| UX | `WeekPage` + `SessionDetailPage` affichent sessions | Identité de séance faible (titre générique, pourquoi du jour insuffisant) (`m-1`) |

### 2.2 Après (cible V2)

| Couche ajoutée | Rôle | Fichiers |
|---|---|---|
| `MicrocycleArchetype` | Définir la semaine avant les blocs: ordre, rôle de chaque séance, intensité, règles MD± | `src/data/microcycleArchetypes.v1.ts` (new), `src/services/program/resolveMicrocycleArchetype.ts` (new) |
| `SessionIdentity` | Porter une identité explicite (objectif, raison du jour, match offset, intensité cible) dans chaque session | `src/types/training.ts`, `src/services/program/buildWeekProgram.ts`, `src/pages/WeekPage.tsx`, `src/pages/SessionDetailPage.tsx` |
| `QualityGates` | Bloquer/signaliser les sorties incohérentes (hard), scorer la qualité hebdo (soft) | `src/services/program/qualityGates.ts` (new), `src/services/program/validateSession.ts`, `src/services/program/buildWeekProgram.ts` |

### 2.3 Flux cible

1. `normalizeProfileInput` (contrat d’entrée).
2. Résolution `PopulationContext` + `SafetyContracts`.
3. Sélection d’un `MicrocycleArchetype` selon `week`, `trainingLevel`, `seasonMode`, contexte match.
4. Résolution des `session slots` (ordre + intensité + rôle).
5. Build session par slot via `buildSessionFromRecipe`.
6. Application `QualityGates` hard (bloquant) puis soft (score).
7. Retour `WeekProgramResult` enrichi (`selectedArchetypeId`, `qualityScorecard`, `sessionIdentity`).
8. UI affiche identité de séance + raison + statut qualité.

---

## 3. Table `Règle terrain -> Règle moteur -> Hard/Soft -> Données`

| Règle terrain | Règle moteur | Type | Données | Source |
|---|---|---|---|---|
| Microcycle in-season ordonné autour du match | Archetype hebdo obligatoire (ordre slots + match offset) | Hard | `week`, `clubSchedule`, `upcomingMatchDates`, `weeklySessions` | `GS-MC-01`, `GS-MC-05`, `M-2` |
| Pas de séance lourde en MD-1 | `forbidHeavyOnMD1=true` dans QualityGates | Hard | `matchDayOffset`, `sessionIntensity` | `GS-MC-01`, `P-01`, `M-2` |
| Ondulation intra-semaine heavy/medium/light | Pattern intensité imposé par archetype | Hard | `trainingLevel`, `weeklySessions`, `seasonMode` | `M-2`, `EC-09`, `GS-MC-09` |
| Deload = réduction réelle | Archetype `DELOAD_RECOVERY` dédié, pas fallback implicite FORCE | Hard | `week`, `fatigueLevel` | `C-1`, `GS-MC-02` |
| Rehab active doit neutraliser FULL/COND | Filtrage recettes non rehab-compatibles à l’étape archetype | Hard | `rehabInjury`, `recipeId` | `EC-02`, `EC-01` |
| Fatigue critical + rehab ne doit pas supprimer rehab | Réduction de volume avec priorité slot rehab | Hard | `fatigueLevel`, `rehabInjury` | `EC-01` |
| Aucun slot requis ne peut disparaître silencieusement | `requiredSlotsSatisfied=true` sinon fallback contrôlé ou session fallback explicite | Hard | `recipe.sequence`, `builtSession.blocks` | `EC-07`, `M-5` |
| Entrées corrompues ne doivent pas casser la génération | Validation/clamp stricte `week`, `equipment`, `injuries`, `weeklySessions` | Hard | `UserProfile`, `CycleWeek` | `EC-05`, `EC-06`, `EC-03` |
| U18: limites match/contact/récupération | Caps bloquants avant build | Hard | `weeklyLoadContext.*`, `ageBand` | `FEM-U18-S10`, `FEM-U18-S11`, `FEM-U18-S12` |
| U18: consentement données santé | Gate d’accès aux règles santé et à certaines adaptations | Hard | `parentalConsentHealthData`, `ageBand` | `FEM-U18-S13`, `FEM-U18-S14`, `FEM-U18-S15` |
| Prévention neuromusculaire U18 prioritaire | Quota mini de blocs prévention/semaine | Soft (P1->Hard optionnel) | `preventionSessionsWeek`, tags blocs | `FEM-U18-S11`, `FEM-U18-S12` |
| Femmes: cycle menstruel symptom-driven | Ajustement charge par symptômes uniquement (opt-in) | Soft | `cycleTrackingOptIn`, `cycleSymptomScoreToday` | `FEM-U18-S5`, `FEM-U18-S6` |
| Différenciation poste visible | Pondération tags poste par archetype/rôle | Soft | `rugbyPosition`, tags | `M-4`, `GS-MC-01` |
| Séance vitesse terrain explicite | Archetype/rôle `SPEED_FIELD` distinct de `CONDITIONING` | Hard (P1) | `sessionRole`, `recipeId` | `GS-MC-01`, `GS-COACH-01` |
| Qualité hebdo mesurable | Scorecard calculée après build | Hard (reporting) | warnings, gates, identité, structure | Diagnostic §8, `EC-07` |

---

## 4. Data Model Changes (compat backward)

### 4.1 P0 — Schéma minimal obligatoire

| Fichier | Changement | Détail |
|---|---|---|
| `src/types/training.ts` | Add `MicrocycleArchetypeId` | `'LEGACY_V1' | 'IN_SEASON_3X_STD' | 'IN_SEASON_2X_STD' | 'DELOAD_RECOVERY' | 'REHAB_UPPER' | 'REHAB_LOWER'` |
| `src/types/training.ts` | Add `SessionRole` | `'lower_strength' | 'upper_strength' | 'full_neural' | 'speed_field' | 'conditioning' | 'rehab' | 'recovery'` |
| `src/types/training.ts` | Add `SessionIdentity` | `{ archetypeId, sessionRole, sessionIntensity, matchDayOffset, objectiveLabel, whyTodayLabel }` |
| `src/types/training.ts` | Extend `BuiltSession` | champ `identity?: SessionIdentity` |
| `src/types/training.ts` | Extend `WeekProgramResult` | `selectedArchetypeId`, `qualityScorecard`, `qualityGateEvents` |
| `src/data/sessionRecipes.v1.ts` | Extend `SessionRecipe` metadata | `sessionRole`, `allowedIntensities`, `allowedMatchOffsets`, `qualityProfile` |
| `src/data/microcycleArchetypes.v1.ts` | New | mapping archetype -> ordered slots + constraints |

### 4.2 P1 — Enrichissement crédibilité sportive

| Fichier | Changement | Détail |
|---|---|---|
| `src/types/training.ts` | Extend `WeeklyLoadContext` | `upcomingMatchDates?: string[]`, `externalSessionsLoad?: number` |
| `src/types/training.ts` | Extend profile progression | `readinessScoreToday?: number`, `lastWeekQualityScore?: number` |
| `src/data/sessionRecipes.v1.ts` | Speed-field family | recettes dédiées `SPEED_FIELD_*` |
| `src/data/blocks.v1.json` | Tags microcycle | `speed_field`, `md_minus`, `contact_prep`, `cod`, `neuromuscular` |

### 4.3 Compatibilité backward

- Tous les nouveaux champs sont optionnels en lecture.
- Default runtime:
- `archetypeId='LEGACY_V1'` si pas de match context.
- `sessionRole` dérivé de `recipeId` si absent.
- `qualityProfile='legacy'` si absent.
- Migration locale:
- conserver `rugbyprep.profile.v1`, ajouter normaliseur non destructif dans `useProfile.ts`.
- Migration DB:
- colonnes ajoutées nullable; pas de blocage onboarding existant.

---

## 5. Plan d’implémentation par vagues (P0/P1/P2)

### Vague P0 (sécurité/cohérence)

- Construire le modèle archetype + resolver sans casser le legacy (`feature flag`).
- Introduire `SessionIdentity` minimale et l’afficher en UI.
- Ajouter `QualityGates` hard (contrats bloquants) et arrêter les sessions silencieusement dégradées.
- Unifier les contrats rehab/fatigue/microcycle au même niveau (avant build slots).
- Livrer scorecard hebdo de base + telemetry.

**Critère de sortie P0**
- `Dangerous=0` et `Broken=0` sur la matrice edge-cases (`EC-01..EC-12`).
- Aucun “Séance introuvable” issu d’un contrat moteur.
- Flags désactivables avec rollback immédiat.

### Vague P1 (crédibilité sportive)

- Ajouter rôle `SPEED_FIELD` et patterns MD± complets.
- Renforcer différenciation poste et adaptation segment population.
- Durcir les règles soft les plus critiques (ex: prévention U18 minimale).
- Étendre scorecard avec métriques progression/variété.

**Critère de sortie P1**
- Scorecard >= 85/100 sur 4 semaines simulées par segment (H senior / F senior / U18 F/M).

### Vague P2 (optimisation continue)

- Externaliser davantage de règles en constantes versionnées issues KB/data.
- Ajouter boucle d’évaluation coach (qualité perçue vs score objectif).
- Introduire E2E automatisé de cohérence programme.

---

## 6. Backlog tickets détaillés

### P0

**[QSV2-001] Créer le schéma `MicrocycleArchetype`**
- Priorité: P0
- Type: refactor
- Effort: S
- Dépendances: []
- Fichiers: `src/types/training.ts`, `src/data/microcycleArchetypes.v1.ts`
- AC (Given/When/Then): Given un profil/semaines valides, when resolver lit les archetypes, then chaque semaine reçoit un archetype valide avec slots ordonnés.
- Source: `GS-MC-01`, `GS-MC-05`, `M-2`

**[QSV2-002] Implémenter `resolveMicrocycleArchetype`**
- Priorité: P0
- Type: feature
- Effort: M
- Dépendances: [QSV2-001]
- Fichiers: `src/services/program/resolveMicrocycleArchetype.ts` (new), `src/services/program/buildWeekProgram.ts`
- AC (Given/When/Then): Given `performance + in_season + 3`, when buildWeekProgram, then ordre slots respecte archetype (lower -> upper -> full/light) et match proximity.
- Source: `GS-MC-01`, `P-01`, `M-2`, `EC-11`

**[QSV2-003] Ajouter `SessionIdentity` au résultat moteur**
- Priorité: P0
- Type: feature
- Effort: S
- Dépendances: [QSV2-002]
- Fichiers: `src/types/training.ts`, `src/services/program/buildWeekProgram.ts`, `src/pages/WeekPage.tsx`, `src/pages/SessionDetailPage.tsx`
- AC (Given/When/Then): Given une semaine générée, when UI charge semaine/séance, then chaque séance affiche objectif + intensité + pourquoi aujourd’hui.
- Source: `m-1`, Diagnostic §4i, `GS-MC-01`

**[QSV2-004] Introduire `qualityGates.ts` (hard contracts)**
- Priorité: P0
- Type: feature
- Effort: M
- Dépendances: [QSV2-002]
- Fichiers: `src/services/program/qualityGates.ts` (new), `src/services/program/validateSession.ts`, `src/services/program/buildWeekProgram.ts`
- AC (Given/When/Then): Given une session sans slot requis, when gate hard s’exécute, then session n’est jamais livrée silencieusement et un événement explicite est produit.
- Source: `EC-07`, `M-5`

**[QSV2-005] Unifier rehab + fatigue critical au niveau archetype**
- Priorité: P0
- Type: bug-fix
- Effort: S
- Dépendances: [QSV2-002, QSV2-004]
- Fichiers: `src/services/program/policies/safetyContracts.ts`, `src/services/program/buildWeekProgram.ts`
- AC (Given/When/Then): Given `rehab lower P3 + critical`, when génération, then au moins une séance rehab-compatible est conservée et FULL/COND non compatibles sont neutralisées.
- Source: `EC-01`, `EC-02`

**[QSV2-006] Durcir contrat d’entrée moteur**
- Priorité: P0
- Type: bug-fix
- Effort: S
- Dépendances: []
- Fichiers: `src/services/program/policies/normalizeProfile.ts`, `src/services/program/buildWeekProgram.ts`, `src/services/program/selectEligibleBlocks.ts`
- AC (Given/When/Then): Given `week` invalide ou `equipment/injuries` corrompus, when génération, then retour contrôlé (erreur explicite ou clamp), jamais crash.
- Source: `EC-05`, `EC-06`

**[QSV2-007] Contract `starter` explicite bout-en-bout**
- Priorité: P0
- Type: bug-fix
- Effort: XS
- Dépendances: [QSV2-006]
- Fichiers: `src/hooks/useProfile.ts`, `src/pages/ProfilePage.tsx`, `src/pages/WeekPage.tsx`, `src/services/program/buildWeekProgram.ts`
- AC (Given/When/Then): Given `starter` avec tentative `weeklySessions=3`, when sauvegarde/génération, then contrat est cohérent (clamp 2 + UI alignée, aucun jour fantôme).
- Source: `EC-03`

**[QSV2-008] Ajouter scorecard hebdo minimale**
- Priorité: P0
- Type: feature
- Effort: S
- Dépendances: [QSV2-004]
- Fichiers: `src/services/program/qualityScorecard.ts` (new), `src/services/program/buildWeekProgram.ts`
- AC (Given/When/Then): Given une semaine générée, when calcul scorecard, then scores structure/safety/microcycle sont présents et tracés.
- Source: Diagnostic §8, `EC-07`, `M-2`

**[QSV2-009] Feature flags V2 + rollback**
- Priorité: P0
- Type: feature
- Effort: XS
- Dépendances: [QSV2-001..QSV2-008]
- Fichiers: `src/services/program/policies/featureFlags.ts`, `src/services/program/buildWeekProgram.ts`
- AC (Given/When/Then): Given flags V2 off, when génération, then comportement legacy identique; Given flags on, then nouveau pipeline actif.
- Source: Diagnostic décision incrémentale, risques rollout

### P1

**[QSV2-010] Ajouter archetype/rôle `SPEED_FIELD`**
- Priorité: P1
- Type: content
- Effort: M
- Dépendances: [QSV2-002]
- Fichiers: `src/data/sessionRecipes.v1.ts`, `src/data/blocks.v1.json`, `src/data/exercices.v1.json`, `src/data/microcycleArchetypes.v1.ts`
- AC (Given/When/Then): Given semaine in-season 3x avec match connu, when génération, then une séance vitesse terrain dédiée peut être sélectionnée selon archetype.
- Source: `GS-MC-01`, `GS-COACH-01`, `M-2`

**[QSV2-011] Coupler `scheduleOptimizer` au resolver microcycle**
- Priorité: P1
- Type: feature
- Effort: M
- Dépendances: [QSV2-002, QSV2-010]
- Fichiers: `src/services/program/scheduleOptimizer.ts`, `src/services/program/resolveMicrocycleArchetype.ts`, `src/services/program/buildWeekProgram.ts`
- AC (Given/When/Then): Given dates match valides, when génération, then offsets MD± pilotent l’intensité/ordre; Given date invalide, then warning explicite et fallback sûr.
- Source: `EC-11`, `GS-MC-05`, `P-01`

**[QSV2-012] Renforcer différenciation poste et segment**
- Priorité: P1
- Type: refactor
- Effort: S
- Dépendances: [QSV2-002]
- Fichiers: `src/services/program/positionPreferences.v1.ts`, `src/services/program/buildSessionFromRecipe.ts`, `src/services/program/policies/populationRules.ts`
- AC (Given/When/Then): Given `prop` vs `wing` même contexte, when génération, then au moins 2 blocs majeurs diffèrent selon priorités poste.
- Source: `M-4`, `GS-MC-01`, `FEM-U18-S1..S4`

**[QSV2-013] Remplacer “known limitations” par contrats testables**
- Priorité: P1
- Type: test
- Effort: S
- Dépendances: [QSV2-004, QSV2-005, QSV2-006]
- Fichiers: `src/services/program/buildWeekProgramEdgeCases.test.ts`, `src/services/program/validateSession.contract.test.ts`
- AC (Given/When/Then): Given anciens cas S4/S5/B3, when tests, then ils échouent si contrat qualité/safety n’est pas respecté.
- Source: `EC-07`, `EC-08`, tests edge-case actuels

### P2

**[QSV2-014] Externaliser règles moteur dans policies versionnées**
- Priorité: P2
- Type: refactor
- Effort: M
- Dépendances: [QSV2-004, QSV2-008]
- Fichiers: `src/services/program/policies/ruleConstants.v1.ts`, `src/services/program/policies/qualityProfiles.v1.ts` (new)
- AC (Given/When/Then): Given un changement de seuil, when update constants, then comportement change sans modification d’algorithme.
- Source: `C-3`, Diagnostic §4f/§4g

**[QSV2-015] Mettre en place E2E qualité programme**
- Priorité: P2
- Type: test
- Effort: M
- Dépendances: [QSV2-011, QSV2-013]
- Fichiers: `e2e/program-microcycle-quality.spec.ts` (new), config E2E
- AC (Given/When/Then): Given profils nominaux et edge cases, when parcours semaine->séance, then aucune incohérence contractuelle/UX n’est observée.
- Source: Diagnostic §8, `EC-03`, `EC-07`

---

## 7. Plan de tests (unit/integration/E2E + edge cases)

### 7.1 Unit

| Test | Fichier | Priorité | Source |
|---|---|---|---|
| Resolver archetype choisit un plan valide par contexte | `src/services/program/resolveMicrocycleArchetype.test.ts` (new) | P0 | `GS-MC-01`, `M-2` |
| Quality gates hard bloquent session incomplète | `src/services/program/qualityGates.test.ts` (new) | P0 | `EC-07`, `M-5` |
| Contrat entrée refuse/corrige valeurs invalides | `src/services/program/buildWeekProgram.contract.test.ts` | P0 | `EC-05`, `EC-06` |
| Rehab+critical conserve rehab-compatible | `src/services/program/safetyContracts.test.ts` | P0 | `EC-01` |
| Neutralisation FULL/COND en rehab active | `src/services/program/safetyContracts.test.ts` | P0 | `EC-02` |
| SessionIdentity complète pour chaque session | `src/services/program/buildWeekProgram.test.ts` | P0 | `m-1` |

### 7.2 Integration

| Test | Fichier | Priorité | Source |
|---|---|---|---|
| `starter` ne peut pas produire de jour fantôme | `src/services/program/buildWeekProgramEdgeCases.test.ts` + `src/pages/__tests__/WeekPage.integration.test.tsx` (new) | P0 | `EC-03` |
| MD± influence l’intensité et l’ordre des sessions | `src/services/program/buildWeekProgram.test.ts` | P1 | `M-2`, `EC-11` |
| Différenciation poste mesurable | `src/services/program/buildWeekProgramEdgeCases.test.ts` | P1 | `M-4` |
| U18 hard caps déclenchent fallback sécurité | `src/services/program/safetyContracts.test.ts` | P0 | `FEM-U18-S10` |
| Parité build/validate sur règles full/finishers | `src/services/program/validateSession.contract.test.ts` | P0 | `EC-08` |

### 7.3 E2E

| Test | Fichier | Priorité | Source |
|---|---|---|---|
| Parcours semaine -> séance -> log -> retour semaine sans incohérence | `e2e/program-microcycle-quality.spec.ts` (new) | P2 | Diagnostic §8 |
| Profil U18 sans consentement santé: adaptation explicite visible | `e2e/u18-safety-consent.spec.ts` (new) | P2 | `FEM-U18-S13..S16` |

---

## 8. Scorecard qualité hebdo (critères mesurables)

### 8.1 Métriques et seuils

| Axe | Mesure | Formule | Seuil cible |
|---|---|---|---|
| Safety contract | Violations hard | `count(hard_violation_events)` | `0` |
| Cohérence microcycle | Respect ordre archetype | `slots_valides / slots_total` | `>= 95%` |
| Match proximity | Heavy interdit MD-1 | `1 - (heavy_md1 / total_sessions)` | `100%` |
| Structure séance | Phases attendues présentes | `sessions_with_required_phases / total_sessions` | `>= 95%` |
| Identité séance | Objectif + pourquoi + intensité affichés | `sessions_with_identity / total_sessions` | `100%` |
| Qualité fallback | Sessions dégradées | `degraded_sessions / total_sessions` | `<= 5%` |
| Différenciation poste | Similarité avants/arrières | `1 - overlap_index` | `>= 0.25` |
| Compliance population | Règles segment respectées | `population_rule_pass / population_rule_total` | `100%` |

### 8.2 Score global

`WeeklyQualityScore = 30*Safety + 20*Microcycle + 15*MatchProximity + 15*Structure + 10*Identity + 10*Population`

- Chaque sous-score est normalisé sur 100.
- **Release gate:** `WeeklyQualityScore >= 85` + `hard violations = 0`.

### 8.3 Baseline avant/après

| Indicateur | Baseline audit (10 mars) | Cible V2 |
|---|---|---|
| Dangerous edge cases | 2 (`EC-01`, `EC-02`) | 0 |
| Broken edge cases | 5 (`EC-03`, `EC-05`, `EC-06`, `EC-07`, `EC-08`) | 0 |
| Ondulation in-season | absente (`M-2`) | présente et testée |
| Identité de séance | faible (`m-1`) | 100% sessions identifiées |
| Deload cohérent | non garanti (`C-1`) | archetype deload dédié |

---

## 9. Risques + mitigations

| Risque | Type | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Over-contraindre -> semaines vides | Produit | UX dégradée | Fallback explicite vers `RECOVERY_MOBILITY_V1` + message clair | Eng |
| Régression legacy | Technique | comportement inattendu | Feature flags V2 + snapshot tests legacy | Eng |
| Données match incomplètes | Data | mauvais MD± | defaults sûrs + warning + possibilité override coach | Product/Eng |
| Données santé mineurs mal gérées | Compliance | risque juridique | gates consentement + minimisation + logs consent | Product/Legal |
| Score qualité contournable | Qualité | faux positif release | gate CI sur hard violations + seuil score | QA |
| Dette de tags/metadata | Data | sélection peu pertinente | backlog data integrity continu + tests de couverture tags | Eng/Data |

---

## 10. Plan rollout (feature flags + migration + monitoring)

### 10.1 Feature flags

Ajouter dans `src/services/program/policies/featureFlags.ts`:
- `microcycleArchetypesV2`
- `sessionIdentityV2`
- `qualityGatesV2`
- `speedFieldArchetypeV1`

Ordre d’activation:
1. `qualityGatesV2` (interne only).
2. `microcycleArchetypesV2` (canary 10% profils performance).
3. `sessionIdentityV2` (tous profils).
4. `speedFieldArchetypeV1` (P1, après validation data).

### 10.2 Migration data

- Local storage:
- conserver `rugbyprep.profile.v1`, appliquer migration non destructive à la lecture.
- Back-end profile:
- colonnes optionnelles ajoutées en nullable (pas de rupture onboarding).
- Recipes/data:
- migration additive (`sessionRole`, `qualityProfile`, `allowedMatchOffsets`), fallback legacy si absent.

### 10.3 Monitoring post-release

Événements à tracer:
- `program.hard_violation`
- `program.degraded_session_blocked`
- `program.archetype_selected`
- `program.quality_score`
- `program.session_not_found`

Dashboards:
- Taux `hard_violation` par segment.
- Distribution score qualité hebdo.
- Fréquence des fallbacks safety.
- Taux d’écrans “séance introuvable”.

### 10.4 Rollback

- Désactivation flags V2 -> retour immédiat pipeline legacy.
- Garder calcul scorecard actif même en legacy pour comparaison avant/après.

---

## Sources consolidées (IDs)

- Audit adversarial: `C-1..C-3`, `M-1..M-6`, `m-1..m-4`.
- Edge cases: `EC-01..EC-12`.
- Synthèse décision: section verdict + backlog + critères métier.
- Gold standard microcycles: `GS-MC-*`, `GS-COACH-*`, patterns `P-01..P-06`.
- Féminines/U18: `FEM-U18-S1..S22`.

