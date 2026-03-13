# Rapport d'implémentation — Vague A (P0)

**Date** : 2026-03-12
**Baseline commit** : `1e18345`
**Statut** : ✅ Tous les tests passent (202/202), 0 erreurs TypeScript

---

## Résumé exécutif

7 hypothèses P0 implémentées (H1, H2, H3, H4, H5, H6, H10) corrigeant les problèmes racines identifiés dans l'audit scientifique et la calibration statistique. Changements : ACWR recalibré, warmup obligatoire, deload structuré, U18 hard caps par défaut, prévention ACL féminine, budgets volume, scoring intensité recalibré. 22 nouveaux tests dédiés Wave A + 180 tests existants maintenus verts.

---

## Changements par hypothèse

### H1 — Deload structuré (au lieu de mobilité pure)
- **Cause racine** : DELOAD = mobilité-only perd les adaptations neuromusculaires (KB periodization.md §5.2)
- **Variable** : routing DELOAD → 1 séance structurée (version W1) + mobilité
- **Implémentation** :
  - `buildWeekProgram.ts` : nouvelle fonction `getDeloadRecipeIds()` — performance/builder 2x = 1 structurée + 1 mobilité, 3x = 1 structurée + 2 mobilité
  - Exception : starter = mobilité pure (pas assez de variété de blocs)
  - Toutes les séances structurées en DELOAD forcées à version W1 (volume minimal)
- **Tests** : TA-01 à TA-05, TR-05

### H2 — ACWR recalibré (caution=1.3, danger=1.5)
- **Cause racine** : seuil danger à 1.3 trop conservateur, déclenche remplacement mobilité dès la zone caution (Gabbett 2016 recommande 1.5)
- **Variable** : `dangerThreshold` 1.3 → 1.5, ajout zone caution explicite
- **Implémentation** :
  - `ruleConstants.v1.ts` : `dangerThreshold: 1.5`, `optimalCeiling: 1.3`, `cautionThreshold: 1.3`
  - `useACWR.ts` : `classifyACWR()` utilise maintenant les constantes centralisées
  - `safetyContracts.ts` : caution = warning informatif (pas de remplacement), danger = remplacement dernière séance, critical = 1 séance max
- **Tests** : TA-06 à TA-08

### H3 — Warmup obligatoire
- **Cause racine** : warmup conditionnel = 20-50% des séances sans échauffement (Emery 2015, evidence A)
- **Variable** : `shouldIncludeOptionalPrepIntent` retourne `true` pour warmup sur toutes les recettes sauf mobilité et REHAB P1
- **Implémentation** :
  - `buildSessionFromRecipe.ts` : warmup toujours inclus (exempt : RECOVERY_MOBILITY_V1, REHAB_UPPER_P1_V1, REHAB_LOWER_P1_V1)
  - `selectEligibleBlocks.ts` : ajout `LEVEL_EXEMPT_INTENTS` (warmup, cooldown, mobility) — ces blocs ne sont plus filtrés par niveau d'entraînement
- **Tests** : TA-09 à TA-12, TID-ENG-006 mis à jour

### H4 — U18 feature flags actifs par défaut
- **Cause racine** : flags U18 désactivés = hard caps plaques de croissance ignorés (population vulnérable)
- **Variable** : `populationProfileV1: true`, `u18HardCapsV1: true` dans les defaults
- **Implémentation** :
  - `featureFlags.ts` : `DEFAULT_PROGRAM_FEATURE_FLAGS.populationProfileV1 = true`, `u18HardCapsV1 = true`
- **Tests** : TA-13, TA-14

### H5 — Prévention ACL féminine
- **Cause racine** : femmes 2-3× plus à risque ACL (Hewett 2005), aucun prehab knee_health/hip_stability dans le moteur
- **Variable** : injection post-build de bloc prehab ACL pour segments `female_senior` et `u18_female`
- **Implémentation** :
  - `blocks.v1.json` : ajout tag `knee_health` sur BLK_PREHAB_HAMSTRING_01, création BLK_PREHAB_ACL_PREVENT_01 (BW, prehab, knee_health + hip_stability, exercices: hamstring bridge iso single leg + glute bridge)
  - `buildWeekProgram.ts` : post-build check → si profil féminin et pas de bloc prehab knee_health, injection du bloc ACL sur la 1ère séance
- **Tests** : TA-15, TA-16

### H6 — Budgets volume par niveau
- **Cause racine** : pas de plafond → starter peut recevoir 20+ sets, dépassement dangereux pour débutants
- **Variable** : `maxSetsPerSession` { starter: 10, builder: 14, performance: 20 } avec tolérance de 1 set
- **Implémentation** :
  - `ruleConstants.v1.ts` : ajout section `volume` avec caps par niveau et tolérance
  - `qualityGates.ts` : nouveau gate volume budget — compte les sets des intents de travail et alerte si dépassement
- **Tests** : TA-17, TA-18

### H10 — Scoring intensité recalibré
- **Cause racine** : poids +1/-1 insuffisants pour influencer le tri par intensité → séances indifférenciées malgré DUP
- **Variable** : scoring intensité `preferTags` +1 → +2, `avoidTags` -1 → -2
- **Implémentation** :
  - `buildSessionFromRecipe.ts` : bonus/malus intensité doublés (×2)
  - `qualityGates.ts` : gate no-main-work pour détecter séances sans travail principal
- **Tests** : TA-19

---

## Fichiers modifiés

| Fichier | Type de changement |
|---|---|
| `src/services/program/policies/ruleConstants.v1.ts` | H2 ACWR seuils + H6 volume caps + H5 ACL tags |
| `src/services/program/policies/safetyContracts.ts` | H2 zone caution warning |
| `src/services/program/policies/featureFlags.ts` | H4 U18 flags par défaut |
| `src/services/program/buildWeekProgram.ts` | H1 deload structuré + H5 ACL injection |
| `src/services/program/buildSessionFromRecipe.ts` | H3 warmup obligatoire + H10 scoring ×2 |
| `src/services/program/selectEligibleBlocks.ts` | H3 level-exempt warmup/cooldown/mobility |
| `src/services/program/qualityGates.ts` | H6 volume budget + H10 no-main-work gate |
| `src/hooks/useACWR.ts` | H2 constantes centralisées |
| `src/data/blocks.v1.json` | H5 knee_health tag + BLK_PREHAB_ACL_PREVENT_01 |
| `src/services/program/waveA.test.ts` | **NOUVEAU** — 22 tests Wave A |
| `src/services/program/buildWeekProgram.test.ts` | TID-ENG-001/006 mis à jour |
| `src/services/program/buildWeekProgram.contract.test.ts` | DELOAD tests mis à jour |
| `src/services/program/sessionIntensity.test.ts` | TID-INT-006 DELOAD mis à jour |

---

## Tests — Résultats d'exécution

```
Test Files:  12 passed (12)
Tests:       202 passed (202)
TypeScript:  0 errors
Duration:    325ms
```

### Tests ajoutés (waveA.test.ts)

| ID | Hypothèse | Description | Statut |
|---|---|---|---|
| TA-01 | H1 | DELOAD génère ≥1 séance avec bloc force/hypertrophy | ✅ |
| TA-02 | H1 | DELOAD utilise version W1 uniquement | ✅ |
| TA-03 | H1 | DELOAD 2× = 1 structurée + 1 mobilité | ✅ |
| TA-04 | H1 | DELOAD 3× = 1 structurée + 2 mobilité | ✅ |
| TA-05 | H1 | Starter DELOAD = mobilité-only | ✅ |
| TA-06 | H2 | ACWR caution ne déclenche PAS remplacement | ✅ |
| TA-07 | H2 | ACWR danger remplace dernière séance | ✅ |
| TA-08 | H2 | ACWR critical réduit à 1 séance | ✅ |
| TA-09 | H3 | Non-mobility/non-REHAB_P1 incluent warmup | ✅ |
| TA-10 | H3 | Starter sessions incluent warmup | ✅ |
| TA-11 | H3 | Hypertrophy sessions incluent warmup | ✅ |
| TA-12 | H3 | RECOVERY_MOBILITY_V1 n'a PAS de warmup | ✅ |
| TA-13 | H4 | U18 hard caps actifs sans flags manuels | ✅ |
| TA-14 | H4 | U18 + parentalConsent=false → fallback mobilité | ✅ |
| TA-15 | H5 | female_senior a ≥1 prehab knee_health | ✅ |
| TA-16 | H5 | U18 female a prehab ACL + U18 caps actifs | ✅ |
| TA-17 | H6 | Volume budget warning avec quality gates V2 | ✅ |
| TA-18 | H6 | Pas de crash volume check tous niveaux | ✅ |
| TA-19 | H10 | Session 0 main work + quality gate | ✅ |
| TR-01 | Régression | Rehab lower + critical ACWR → rehab survit | ✅ |
| TR-03 | Régression | Starter 3× normalisé à 2 | ✅ |
| TR-05 | Régression | DELOAD n'utilise pas fallback FORCE | ✅ |

---

## Écarts et bloqueurs

1. **S5 (starter + shoulder_pain + BW)** : slot upper hypertrophy toujours en [SAFETY] → limitation connue, comportement correct cliniquement
2. **Scoring H10** : le doublement ×2 est une première calibration. La Vague B devra affiner via simulation 60+ profils
3. **Volume caps H6** : les caps actuels (10/14/20 sets) sont des estimations basées sur KB load-budgeting.md. À valider avec données terrain

---

## Recommandation Vague B (P1)

| Priorité | Hypothèse | Description |
|---|---|---|
| 1 | H7 | Finisher rotation par index de semaine (variété intra-cycle) |
| 2 | H8 | Match-day aware scheduling (J-2/J+1 adaptation) |
| 3 | H9 | Progression inter-semaines W1→W4 (double progression) |
| 4 | H11 | DUP full-body balance check (quality gate pattern upper/lower) |
| 5 | H12 | Microcycle archetype auto-selection par contexte |

**Critères GO Vague B** : 202 tests verts (✅), 0 régression edge cases (✅), lint propre (✅). La Vague B peut démarrer.
