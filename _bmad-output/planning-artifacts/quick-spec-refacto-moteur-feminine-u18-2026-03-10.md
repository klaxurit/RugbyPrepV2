---
title: 'Quick Spec — Refacto incrémentale moteur RugbyPrepV2 (Féminines + U18)'
slug: 'refacto-moteur-feminine-u18'
created: '2026-03-10'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['TypeScript', 'React', 'Vite', 'Vitest']
files_to_modify:
  - src/services/program/buildWeekProgram.ts
  - src/services/program/programPhases.v1.ts
  - src/services/program/buildSessionFromRecipe.ts
  - src/services/program/selectEligibleBlocks.ts
  - src/services/program/validateSession.ts
  - src/services/program/scheduleOptimizer.ts
  - src/services/ui/suggestions.ts
  - src/types/training.ts
  - src/data/sessionRecipes.v1.ts
  - src/data/blocks.v1.json
  - src/data/exercices.v1.json
  - src/knowledge/*
test_patterns:
  - src/services/program/*.test.ts
  - src/services/program/*EdgeCases.test.ts
  - src/pages/__tests__/*.test.tsx
---

# Quick Spec: Refacto incrémentale moteur RugbyPrepV2 (Féminines + U18)

**Date:** 2026-03-10  
**Owner:** Product + Engineering  
**Statut:** Ready for Development

## Sources utilisées

- `domain-preparation-physique-rugby-research-2026-03-10.md` (référentiel terrain global)
- `adversarial-review-engine-2026-03-10.md` (C-1..O-4)
- `edge-case-review-engine-2026-03-10.md` (EC-01..EC-12)
- `diagnostic-moteur-synthese-2026-03-10.md` (verdict, backlog ENG-001..020)
- `domain-feminine-u18-rugby-research-2026-03-10.md` (règles FEM-U18)

## 1. Executive Decision

- **Décision 1 (incrémental): OUI, confirmé.** Le moteur actuel reste viable (`recette -> slots -> blocs`) si on ajoute des invariants de sécurité et des règles population (verdict diagnostic + adversarial).
- **Décision 2 (architecture minimale):** ajouter 3 couches sans refonte totale:
- `population profile` (normalisation profil + segment),
- `safety contracts` (hard constraints bloquantes),
- `rule constants` (constantes versionnées dérivées KB/data).
- **Décision 3 (hard vs soft):** U18 caps, rehab safety, validations d’entrée, consentement/health-data = **hard**; modulation charge/intensité/cycle/position = **soft**.
- **Décision 4 (data model P0/P1):** P0 = champs minimaux sécurité/segment; P1 = maturation PHV et cycle opt-in symptomatique.
- **Décision 5 (risque si non implémenté):** risque safety (prescriptions incohérentes), conformité (mineurs + données santé), et crédibilité produit (séances “adult male default”) élevé.

## 2. Architecture cible incrémentale

### 2.1 Avant / Après

| État | Description |
|---|---|
| Avant | `buildWeekProgram` route recettes puis `buildSessionFromRecipe` choisit blocs; règles safety partielles, population non modélisée, KB non exécutable (C-3). |
| Après | Même pipeline, précédé d’un **normalizer profil** et d’un **policy engine** hard constraints; constants versionnées centralisées; génération “population-aware” sans casser le flux existant. |

### 2.2 Composants à ajouter

| Composant | Rôle | Type |
|---|---|---|
| `src/services/program/profile/normalizeProfile.ts` | Normaliser entrées (`injuries null`, `equipment undefined`, garde valeurs par défaut) | P0 |
| `src/services/program/policies/populationRules.ts` | Mapper profil -> segment (`female_senior`, `u18_female`, `u18_male`, fallback legacy) | P0 |
| `src/services/program/policies/safetyContracts.ts` | Appliquer hard constraints (rehab, U18 caps, consentement mineur, quality floor) | P0 |
| `src/services/program/policies/ruleConstants.v1.ts` | Constantes exécutable KB/data (ACWR, U18 caps, deload policy) | P0 |
| `src/services/program/policies/softAdaptations.ts` | Règles non bloquantes (cycle symptom-driven, PHV caution, position boost) | P1 |
| `src/services/program/policies/types.ts` | Types policy (`HardDecision`, `SoftAdjustment`, `PopulationSegment`) | P0 |

### 2.3 Notes d’intégration

- Pipeline visé: `normalizeProfile -> populationRules -> safetyContracts -> buildSessionFromRecipe -> validateSession`.
- Écart de scope: pas de `src/services/program/suggestions.ts` actuel; créer un wrapper moteur sur `src/services/ui/suggestions.ts`.

## 3. Tableau règles terrain -> moteur -> type -> données

> `FEM-U18-Rx` correspond au document `_bmad-output/.../domain-feminine-u18-rugby-research-2026-03-10.md` sections 6/7.

| Règle terrain | Règle moteur | Type | Données requises |
|---|---|---|---|
| U18 match <= 120 min/semaine (FEM-U18-R1) | Bloquer génération “match load” si dépassement | Hard | `playedMinutesWeek`, `scheduledMatchMinutes` |
| U18 >= 72h entre matchs (FEM-U18-R2) | Interdire microcycle non conforme | Hard | `lastMatchAt`, `nextMatchAt` |
| U18 high contact <= 15 min/sem (FEM-U18-R3) | Budget contact hebdo obligatoire | Hard | `contactHighMinutesWeek` |
| U18 medium contact <= 30 min/sem (FEM-U18-R4) | Budget contact medium obligatoire | Hard | `contactMediumMinutesWeek` |
| U18 <= 30 matchs/saison (FEM-U18-R5) | Verrou saisonnier + warning coaching | Hard | `matchesPlayedSeason` |
| Rehab active: pas de `FULL_*` / `COND_*` non whitelistés (EC-02) | Policy de neutralisation recettes | Hard | `rehabInjury`, `recipeId` |
| `critical + rehab` conserve séance rehab (EC-01) | Priorité rehab avant réduction ACWR | Hard | `fatigueLevel`, `rehabInjury` |
| `week` invalide interdit (EC-05) | Validation stricte week | Hard | `week` |
| Profil incomplet/null-safe (EC-06) | Normalisation et fallback sûr | Hard | `equipment`, `injuries`, `trainingLevel` |
| Slot requis absent interdit (EC-07) | Quality gate: fail explicite ou mobility fallback | Hard | `builtSession.blocks`, `requiredSlots` |
| DELoad réel (C-1) | Routing deload vers sessions allégées, pas FORCE | Hard | `week`, `phase`, `recipePolicy` |
| Contra exercice->bloc cohérentes (C-2) | Contrat intégrité CI | Hard | `blocks`, `exercises` |
| Consentement mineur / santé (FEM-U18-R8/R9) | Désactiver features sensibles si consentement absent | Hard | `ageBand`, `parentalConsentHealthData` |
| U18 jouant adulte (FEM-U18-R10) | Éligibilité documentaire obligatoire | Hard | `adultPlayEligibilityApproved`, `medicalClearance` |
| Prévention neuromusculaire >=3/sem (FEM-U18-R6) | KPI d’adhérence et priorité blocs prévention | Soft | `preventionSessionsWeek` |
| Cycle menstruel symptom-driven opt-in (FEM-U18-R11) | Ajustement volume 0.8-0.9 selon symptômes | Soft | `cycleTrackingOptIn`, `cycleSymptomScoreToday` |
| PHV caution (FEM-U18-R12) | Limiter ramp-up volume/intensité | Soft | `maturityStatus`, `growthRateCmMonth` |
| Position specificity renforcée (M-4) | Augmenter poids scoring tags poste | Soft | `rugbyPosition` |
| Ondulation intra-semaine (M-2/EC-09) | Profils heavy/light/neural par session | Soft | `sessionIndex`, `seasonMode`, `matchProximity` |

## 4. Data Model Changes

### 4.1 `src/types/training.ts` — nouveaux champs

#### P0 (sécurité/cohérence)

| Entité | Champ | Type | Raison |
|---|---|---|---|
| `UserProfile` | `populationSegment?` | `'male_senior' \| 'female_senior' \| 'u18_female' \| 'u18_male' \| 'unknown'` | Brancher policies population |
| `UserProfile` | `ageBand?` | `'u18' \| 'adult'` | Hard constraints mineurs |
| `UserProfile` | `parentalConsentHealthData?` | `boolean` | Conformité mineurs/santé |
| `UserProfile` | `adultPlayEligibilityApproved?` | `boolean` | Garde-fou U18->adult |
| `UserProfile` | `weeklyLoadContext?` | objet minutes/contact/matches | Enforcement U18 caps |
| `WeekProgramResult` | `hardConstraintEvents` | `string[]` | Traçabilité décisions bloquantes |

#### P1 (crédibilité sportive)

| Entité | Champ | Type | Raison |
|---|---|---|---|
| `UserProfile` | `maturityStatus?` | `'pre_phv' \| 'circa_phv' \| 'post_phv' \| 'unknown'` | PHV caution |
| `UserProfile` | `cycleTrackingOptIn?` | `boolean` | Consentement explicite |
| `UserProfile` | `cycleSymptomScoreToday?` | `0 \| 1 \| 2 \| 3` | Autorégulation symptômes |
| `UserProfile` | `preventionSessionsWeek?` | `number` | Adhérence prévention |
| `BuiltSession` | `sessionArchetype?` | `'force' \| 'power' \| 'recovery' \| 'rehab'` | Lisibilité UX et logique |

### 4.2 Validations d’entrée

- Nouveau module `src/services/program/validateProfileInput.ts` appelé avant génération.
- Rejeter explicitement: `week` invalide, `weeklySessions` hors contrat, `injuries=null`, `equipment=undefined`.
- Conserver un mode de compatibilité: profils legacy sont normalisés, jamais crash.

### 4.3 Compatibilité backward

- Les nouveaux champs sont optionnels.
- Si absents: `populationSegment='unknown'`, `ageBand='adult'`, `maturityStatus='unknown'`, `cycleTrackingOptIn=false`.
- Aucune régression attendue pour profils existants si flags désactivés.

## 5. Plan d’implémentation par vagues

### Vague P0 — sécurité / cohérence (ordre strict)

1. Contracts d’entrée + normalisation (`EC-05`, `EC-06`, `EC-03`).
2. Fixes critiques moteur (`C-1`, `EC-01`, `EC-02`, `EC-08`).
3. Intégrité data (`C-2`) + suppression code mort (`M-6`).
4. Ajout couche `ruleConstants` + `safetyContracts` + flags.
5. Enforcement hard constraints U18/mineurs/santé.

### Vague P1 — crédibilité sportive

1. Warm-up/cooldown et quality floor session (`M-1`, `M-5`, `EC-07`).
2. Ondulation intra-semaine + couplage MD± (`M-2`, `EC-09`, `EC-11`).
3. Renforcement différenciation poste (`M-4`).
4. Cycle symptom-driven opt-in + PHV caution.
5. Enrichissement blocs builder/COD/contact prep (`O-1`, `O-2`, `m-3`).

### Vague P2 — optimisation continue

1. Ingestion charge externe multi-environnements.
2. Externalisation complète rules/scoring en config versionnée.
3. Monitoring qualité perçue + recalibrage trimestriel.

## 6. Backlog tickets détaillés

### P0

**[QSP-001] Corriger routing DELOAD et contrat de phase**
- Priorité: P0
- Type: bug-fix
- Effort: S
- Dépendances: []
- Fichiers: `src/services/program/buildWeekProgram.ts`, `src/services/program/programPhases.v1.ts`, `src/services/program/buildWeekProgram.test.ts`
- Critère d’acceptation: Given `week='DELOAD'`, when programme généré, then aucune session FORCE/HYPER/POWER standard n’est routée.
- Source: C-1, ENG-001

**[QSP-002] Policy rehab explicite pour 3 séances**
- Priorité: P0
- Type: refactor
- Effort: S
- Dépendances: [QSP-001]
- Fichiers: `src/services/program/buildWeekProgram.ts`, `src/data/sessionRecipes.v1.ts`, `src/services/program/buildWeekProgramEdgeCases.test.ts`
- Critère d’acceptation: Given rehab active + 3 séances, when build, then `FULL_*`/`COND_*` sont remplacés ou explicitement whitelistés.
- Source: EC-02, ENG-002

**[QSP-003] Prioriser rehab en fatigue critical**
- Priorité: P0
- Type: bug-fix
- Effort: XS
- Dépendances: [QSP-002]
- Fichiers: `src/services/program/buildWeekProgram.ts`, `src/services/program/buildWeekProgramEdgeCases.test.ts`
- Critère d’acceptation: Given `critical + rehab`, when réduction ACWR, then au moins 1 session rehab-compatible reste présente.
- Source: EC-01, ENG-003

**[QSP-004] Normalisation et validation stricte d’entrée**
- Priorité: P0
- Type: refactor
- Effort: M
- Dépendances: []
- Fichiers: `src/services/program/buildWeekProgram.ts`, `src/services/program/programPhases.v1.ts`, `src/services/program/selectEligibleBlocks.ts`, `src/types/training.ts`
- Critère d’acceptation: Given `week=NaN` ou `injuries=null`, when build, then erreur contrôlée ou normalisation sûre, jamais crash.
- Source: EC-05, EC-06, EC-03, ENG-005

**[QSP-005] Aligner build/validate pour FULL_BUILDER**
- Priorité: P0
- Type: bug-fix
- Effort: XS
- Dépendances: []
- Fichiers: `src/services/program/buildSessionFromRecipe.ts`, `src/services/program/validateSession.ts`, `src/services/program/validateSession.contract.test.ts`
- Critère d’acceptation: Given `FULL_BUILDER_V1`, when validate, then règles de finisher et contrat main block sont cohérents entre build et validate.
- Source: EC-08, ENG-006

**[QSP-006] Contrat intégrité contras exercice -> bloc**
- Priorité: P0
- Type: bug-fix
- Effort: S
- Dépendances: []
- Fichiers: `src/data/blocks.v1.json`, `src/services/program/programDataIntegrity.test.ts`
- Critère d’acceptation: Given data integrity suite, when run tests, then 0 mismatch contraindications.
- Source: C-2, QW-3, QW-4, ENG-007

**[QSP-007] Retirer moteur mort et imports orphelins**
- Priorité: P0
- Type: refactor
- Effort: XS
- Dépendances: []
- Fichiers: `src/services/program/buildSession.ts`, `src/services/program/index.ts`, éventuels imports app
- Critère d’acceptation: Given build, when compile/tests, then aucune référence au moteur obsolète.
- Source: M-6, QW-2, ENG-008

**[QSP-008] Introduire rule constants versionnées**
- Priorité: P0
- Type: refactor
- Effort: S
- Dépendances: []
- Fichiers: `src/services/program/policies/ruleConstants.v1.ts` (new), `src/services/program/buildWeekProgram.ts`
- Critère d’acceptation: Given policy evaluation, when reading thresholds, then valeurs viennent de `ruleConstants.v1.ts`, pas de hardcode dispersé.
- Source: C-3, diagnostic §4f/§4g, ENG-019

**[QSP-009] Ajouter population profile + safety contracts**
- Priorité: P0
- Type: feature
- Effort: M
- Dépendances: [QSP-004, QSP-008]
- Fichiers: `src/services/program/policies/populationRules.ts` (new), `src/services/program/policies/safetyContracts.ts` (new), `src/services/program/buildWeekProgram.ts`, `src/types/training.ts`
- Critère d’acceptation: Given profil population, when generate week, then hard constraints appliquées avant assemblage session.
- Source: diagnostic verdict, M-5, EC-07, FEM-U18-R1..R10

**[QSP-010] Hard constraints U18 + mineurs santé**
- Priorité: P0
- Type: feature
- Effort: M
- Dépendances: [QSP-009]
- Fichiers: `src/types/training.ts`, `src/services/program/policies/safetyContracts.ts`, `src/services/program/buildWeekProgram.ts`
- Critère d’acceptation: Given profil `u18` sans consentement requis ou hors caps contact/match, when generate, then session bloquée ou ajustée avec événement explicite.
- Source: FEM-U18-R1..R10, research RGPD P0, ENG-020

**[QSP-011] Clamp contract `starter` et weeklySessions**
- Priorité: P0
- Type: bug-fix
- Effort: XS
- Dépendances: [QSP-004]
- Fichiers: `src/services/program/buildWeekProgram.ts`, `src/pages/ProfilePage.tsx`, `src/pages/__tests__/WeekPage.integration.test.tsx`
- Critère d’acceptation: Given `starter + 3`, when save profil/generate, then contrat explicite (clamp 2 ou blocage UI/API) sans session fantôme.
- Source: EC-03, ENG-004

**[QSP-012] Feature flags + telemetry de sécurité**
- Priorité: P0
- Type: feature
- Effort: S
- Dépendances: [QSP-009]
- Fichiers: `src/services/program/buildWeekProgram.ts`, `src/types/training.ts`, instrumentation analytics
- Critère d’acceptation: Given flags off, when generate, then comportement legacy; Given flags on, then événements hard-constraint loggés.
- Source: diagnostic rollout need, FEM-U18 risques produit

### P1

**[QSP-013] Ajouter intents warm-up et cooldown obligatoires**
- Priorité: P1
- Type: content
- Effort: M
- Dépendances: [QSP-009]
- Fichiers: `src/types/training.ts`, `src/data/sessionRecipes.v1.ts`, `src/data/blocks.v1.json`, `src/services/program/validateSession.ts`
- Critère d’acceptation: Given session standard, when validate, then 1 warmup + 1 cooldown (hors exemptions explicites).
- Source: M-1, ENG-010

**[QSP-014] Quality floor anti séance dégradée**
- Priorité: P1
- Type: refactor
- Effort: S
- Dépendances: [QSP-009, QSP-013]
- Fichiers: `src/services/program/buildSessionFromRecipe.ts`, `src/services/program/validateSession.ts`
- Critère d’acceptation: Given slot requis introuvable, when fallback épuise options, then hard-fail contrôlé ou mobilité explicitement assumée.
- Source: M-5, EC-07, ENG-009

**[QSP-015] Ondulation intra-semaine + session archetype**
- Priorité: P1
- Type: feature
- Effort: M
- Dépendances: [QSP-001, QSP-013]
- Fichiers: `src/services/program/buildWeekProgram.ts`, `src/services/program/programPhases.v1.ts`, `src/types/training.ts`, `src/data/sessionRecipes.v1.ts`
- Critère d’acceptation: Given semaine 3 séances in-season, when build, then profil heavy/light/neural visible et non homogène.
- Source: M-2, EC-09, diagnostic §4e, ENG-011

**[QSP-016] Couplage MD± calendrier -> intensité recette**
- Priorité: P1
- Type: feature
- Effort: M
- Dépendances: [QSP-015]
- Fichiers: `src/services/program/scheduleOptimizer.ts`, `src/services/program/buildWeekProgram.ts`
- Critère d’acceptation: Given match proximity connue, when generate, then intensité ajustée selon MD± et date invalide rejetée explicitement.
- Source: EC-11, diagnostic gap MD±, ENG-012

**[QSP-017] Renforcer poids poste et segment population**
- Priorité: P1
- Type: refactor
- Effort: S
- Dépendances: [QSP-009]
- Fichiers: `src/services/program/buildSessionFromRecipe.ts`, `src/services/program/positionPreferences.v1.ts`, `src/data/blocks.v1.json`
- Critère d’acceptation: Given `prop` vs `wing`, when generate même semaine, then distribution blocs diffère de manière mesurable.
- Source: M-4, ENG-013, FEM-U18 segment needs

**[QSP-018] Cycle symptom-driven opt-in (sans surpromesse)**
- Priorité: P1
- Type: feature
- Effort: M
- Dépendances: [QSP-009, QSP-012]
- Fichiers: `src/types/training.ts`, `src/services/program/policies/softAdaptations.ts`, `src/services/ui/suggestions.ts`, `src/services/program/suggestions.ts` (new wrapper)
- Critère d’acceptation: Given `cycleTrackingOptIn=true` et symptômes élevés, when suggestion/build, then volume factor réduit (0.8-0.9) sans règle déterministe par phase.
- Source: FEM-U18-R11, FEM-U18-R12, S5/S6/S7

**[QSP-019] PHV caution mode U18**
- Priorité: P1
- Type: feature
- Effort: S
- Dépendances: [QSP-009]
- Fichiers: `src/types/training.ts`, `src/services/program/policies/softAdaptations.ts`, `src/services/program/buildWeekProgram.ts`
- Critère d’acceptation: Given `maturityStatus=circa_phv`, when generate, then ramp-up limité et choix blocs favorisant contrôle technique.
- Source: FEM-U18 maturation, S8/S9

**[QSP-020] Enrichir contenu manquant (builder/COD/contact prep)**
- Priorité: P1
- Type: content
- Effort: L
- Dépendances: [QSP-013, QSP-017]
- Fichiers: `src/data/blocks.v1.json`, `src/data/exercices.v1.json`, `src/data/sessionRecipes.v1.ts`
- Critère d’acceptation: Given coverage audit, when run data checks, then blocs builder + COD/agilité + trunk/contact prep présents et adressables par intent/tag.
- Source: m-3, O-1, O-2, ENG-017, ENG-018

### P2

**[QSP-021] Ingestion charge externe multi-environnements**
- Priorité: P2
- Type: feature
- Effort: L
- Dépendances: [QSP-010, QSP-012]
- Fichiers: `src/types/training.ts`, services calendrier/charge
- Critère d’acceptation: Given sessions externes importées, when build, then budgets hebdo prennent en compte charge globale.
- Source: FEM-U18 data manquante #1

## 7. Plan de tests

### 7.1 Unit tests (P0 en priorité)

| Test | Fichier | Priorité |
|---|---|---|
| Validation d’entrée (`week`, `injuries`, `equipment`) | `src/services/program/buildWeekProgram.contract.test.ts` | P0 |
| `critical + rehab` conserve rehab | `src/services/program/buildWeekProgramEdgeCases.test.ts` | P0 |
| Rehab interdit `FULL_*` / `COND_*` sans whitelist | `src/services/program/buildWeekProgramEdgeCases.test.ts` | P0 |
| Parité `FULL_BUILDER` build/validate | `src/services/program/validateSession.contract.test.ts` | P0 |
| Intégrité contras exercice->bloc | `src/services/program/programDataIntegrity.test.ts` | P0 |
| Hard constraints U18 caps | `src/services/program/safetyContracts.test.ts` (new) | P0 |
| Consentement mineur et data santé gating | `src/services/program/safetyContracts.test.ts` (new) | P0 |
| Cycle opt-in symptom-driven | `src/services/program/softAdaptations.test.ts` (new) | P1 |
| PHV caution | `src/services/program/softAdaptations.test.ts` (new) | P1 |

### 7.2 Integration tests

| Test | Fichier | Priorité |
|---|---|---|
| `starter + 3` sans session fantôme | `src/pages/__tests__/WeekPage.integration.test.tsx` | P0 |
| Semaine 3 séances in-season ondulée | `src/services/program/buildWeekProgram.integration.test.ts` | P1 |
| MD± influence intensité | `src/services/program/scheduleOptimizer.integration.test.ts` | P1 |
| Différenciation poste mesurable | `src/services/program/positionDiffCheck.test.ts` | P1 |

### 7.3 E2E (smoke métier)

| Parcours | Fichier | Priorité |
|---|---|---|
| U18 sans consentement santé -> protections actives | `e2e/program/u18-consent-safety.spec.ts` (new) | P0 |
| Femme senior opt-in symptômes -> adaptation soft | `e2e/program/female-cycle-optin.spec.ts` (new) | P1 |
| Rehab + fatigue critical -> cohérence end-to-end | `e2e/program/rehab-critical.spec.ts` (new) | P0 |

## 8. Critères métier d’acceptation

- [ ] Aucune séance générée ne viole les hard constraints U18 (caps contact/match/recovery).
- [ ] Aucune séance rehab active ne laisse passer un routage non conforme (`FULL_*`/`COND_*` non autorisé).
- [ ] En `critical + rehab`, au moins une séance rehab-compatible est conservée.
- [ ] DELoad génère une structure explicitement allégée (pas de FORCE standard déguisée).
- [ ] Les profils incomplets/corrompus sont normalisés ou rejetés sans crash.
- [ ] Les séances standard incluent warm-up et cooldown (hors exemptions explicites).
- [ ] Les semaines 3 séances in-season montrent une ondulation visible (heavy/light/neural).
- [ ] La différenciation poste est objectivable (front row vs back three non identiques).
- [ ] Le mode cycle menstruel est strictement opt-in et symptom-driven, sans règle pseudo-déterministe par phase.
- [ ] Les contraintes mineurs/données santé sont traçables (audit events + consent gates).
- [ ] Les tests P0 sont verts avant activation flags en production.

## 9. Risques et mitigations

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Livraison sans hard constraints U18 | Safety élevé | Élevée | Bloquer release sans QSP-010 + tests P0 verts |
| Cycle mal implémenté (surpromesse) | UX + crédibilité | Moyenne | Opt-in strict, soft-only, message explicite incertitude |
| Régression legacy profils existants | Produit | Moyenne | Normalisation backward + feature flags + canary |
| Explosion complexité fallback | Qualité | Moyenne | Quality floor explicite + contrats validateSession |
| Non-conformité mineurs/santé | Légal | Moyenne à élevée | Gating consentement + minimisation data + journalisation |
| Dette technique de règles dispersées | Maintenabilité | Élevée | `ruleConstants.v1.ts` + externalisation progressive |

## 10. Plan de rollout

### 10.1 Feature flags

- `ff_population_profile_v1`
- `ff_safety_contracts_v1`
- `ff_u18_hard_caps_v1`
- `ff_cycle_optin_soft_adaptation_v1`
- `ff_session_archetype_v1`

### 10.2 Stratégie d’activation

1. **Phase 0 (staging interne):** activer tous flags + suite P0 complète.
2. **Phase 1 (canary 5-10%):** activer `population_profile` + `safety_contracts` seulement.
3. **Phase 2 (50%):** activer U18 hard caps + telemetry conformité.
4. **Phase 3 (100%):** activer soft adaptations (cycle/PHV) pour profils opt-in.

### 10.3 Migration data

- Migration non destructive: champs optionnels ajoutés à `UserProfile`, defaults gérés par normalizer.
- Journaliser les profils `unknown segment` pour nettoyage progressif.

### 10.4 Monitoring post-release (2 sprints)

- KPI: `hardConstraintEvents`, taux sessions invalides, distribution archetypes, conformité consentement mineurs.
- Alertes: pics `session build failed` et `policy reject`.

### 10.5 Go/No-Go

- **Go** si: tickets P0 livrés, tests P0 verts, canary sans régression critique.
- **No-Go** si: violation hard constraints U18, crash sur input corrompu, ou incohérence rehab+critical.
