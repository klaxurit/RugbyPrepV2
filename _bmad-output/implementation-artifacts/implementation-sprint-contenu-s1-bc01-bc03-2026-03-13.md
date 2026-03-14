# Rapport d'implémentation — Sprint Contenu S1 (BC-01 à BC-03)

**Date** : 2026-03-13
**Baseline commit** : `48e4016e3a480d9b5e2d455f4b6b973c197c4878`
**Moteur** : GELÉ (aucune modification des fichiers moteur)
**Tests** : 392 passed (0 fail, 0 skip) — identique au baseline

---

## 1. Résumé exécutif

Implémentation des 3 premiers items du backlog contenu prioritaire, conformément au `plan-final-stabilisation-produit-rugbyprep-2026-03-13.md`. Tous les changements sont **data-only** (`blocks.v1.json`, `exercices.v1.json`). Aucun fichier moteur n'a été touché.

**Résultat** : 1 exercice ajouté + 6 blocs ajoutés. Tests 392/392. Build OK.

---

## 2. BC-01 — Blocs builder upper pull-only (B3 shoulder_pain)

### Problème ciblé
`B3_FULL_shoulder` (builder 3× + shoulder_pain) : tous les blocs builder upper SS avaient `shoulder_pain` en CI → slot upper hypertrophy dans FULL_BUILDER_V1 et UPPER_BUILDER_V1 tombait en safety (core à la place). Note validation : 55/100.

### Solution data
Création de 2 blocs builder upper pull-only sans CI `shoulder_pain` :

| blockId | Nom | Equipment | CI |
|---------|-----|-----------|-----|
| `BLK_BLD_UPPER_SS_PULL_BACK_01` | Superset Tirage Dos — T-Bar Row + Rowing élastique | tbar_row + band | low_back_pain |
| `BLK_BLD_UPPER_SS_PULL_BAND_01` | Superset Tirage Élastique — Row debout + Face pull | band | — |

**Tags** : `['builder', 'superset', 'upper', 'pull', 'hypertrophy', 'shoulder_health']`

### Exercices utilisés (existants)
- `pull_horizontal__tbar_row` (CI: low_back_pain)
- `pull_horizontal__band_row__elbows_low` (CI: [])
- `pull_horizontal__band_row__standing` (CI: [])
- `pull_horizontal__band_row__face_pull_height` (CI: [])

### Impact attendu
Pour B3 (FULL_BUILDER_V1 slot 2 = upper hypertrophy + shoulder_pain) : les nouveaux blocs sont désormais éligibles → session recevra un vrai superset tirage au lieu du fallback core.

---

## 3. BC-02 — Bloc contrast lower safe-knee (P4/P_knee)

### Problème ciblé
`P_knee` (performance + knee_pain) : tous les blocs contrast lower avaient `knee_pain` en CI → slot contrast dans LOWER_V1 tombait en core. Note validation : 65/100.

### Nouvel exercice ajouté
| exerciseId | Nom | Pattern | Equipment | CI |
|-----------|-----|---------|-----------|-----|
| `hinge__hip_thrust__barbell` | Hip thrust barre | hinge | barbell + bench | low_back_pain |

### Nouveau bloc
| blockId | Nom | Equipment | CI |
|---------|-----|-----------|-----|
| `BLK_CONTRAST_LOWER_SAFE_KNEE_01` | Contrast bas du corps safe genou (Hip Thrust barre + Glute Bridge réactif) | barbell + bench | low_back_pain |

**Tags** : `['lower', 'contrast', 'posterior_chain', 'power', 'knee_health']`

**Exercices** :
1. `hinge__hip_thrust__barbell` (prime, lourd — 3-5 reps @ 80-85% 1RM)
2. `hinge__glute_bridge__bodyweight` (contrast, réactif — 6-8 reps explosives)

**Mécanisme** : Potentialisation neuromusculaire hinge pur (hip extension). Aucun stress genou (pas de flexion/extension genou sous charge).

### Impact attendu
Pour P_knee (LOWER_V1 slot contrast + knee_pain) : unique bloc contrast lower éligible → session recevra un vrai stimulus de puissance au lieu du fallback core.

---

## 4. BC-03 — Blocs mobilité supplémentaires (deload starter)

### Problème ciblé
Deload starter : RECOVERY_MOBILITY_V1 disposait de seulement 3 blocs mobilité → sessions deload potentiellement identiques (cross-session exclusion désactivée pour starter).

### 3 nouveaux blocs mobilité

| blockId | Exercices | Tags |
|---------|-----------|------|
| `BLK_MOB_ANKLE_HIP_FLOW_01` | ankle_circles + hip_couch_stretch + worlds_greatest_stretch | lower, mobility, ankle, hip, recovery |
| `BLK_MOB_FULL_BODY_FLOW_01` | hip_90_90 + pigeon_pose + ankle_circles | mobility, full_body, hip, ankle, recovery |
| `BLK_MOB_THORACIC_SHOULDER_01` | sleeper_stretch + hip_couch_stretch + ankle_circles | upper, mobility, shoulder, ankle, hip, recovery |

**Note** : BLK_MOB_FULL_BODY_FLOW_01 et BLK_MOB_THORACIC_SHOULDER_01 ont été patchés post-revue adversariale (voir rapport mini-fix) pour éliminer les doublons d'exercices avec BLK_MOB_THORACIC_01.

### Impact attendu
Pool mobilité : 3 → 6 blocs. Les sessions RECOVERY_MOBILITY_V1 peuvent désormais varier sur 2+ semaines de deload.

---

## 5. Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/data/exercices.v1.json` | +1 exercice (`hinge__hip_thrust__barbell`) |
| `src/data/blocks.v1.json` | +6 blocs (BC-01 ×2, BC-02 ×1, BC-03 ×3) |

**Fichiers moteur non touchés** (gel respecté) :
- `buildWeekProgram.ts` ✓
- `buildSessionFromRecipe.ts` ✓
- `selectEligibleBlocks.ts` ✓
- `programPhases.v1.ts` ✓
- `validateSession.ts` ✓

---

## 6. Tests

| Métrique | Avant | Après |
|----------|-------|-------|
| Tests passés | 392 | 392 |
| Tests échoués | 0 | 0 |
| Tests skippés | 0 | 0 |
| Erreurs lint | 77 (pré-existantes) | 77 (pré-existantes) |
| Erreurs build | 0 | 0 |

Tous les quality gates TID-DAT-001 à TID-DAT-006 passent (equipment, exercise refs, contraindications propagées, no duplicates).

---

## 7. Revue adversariale — Findings et résolution

| ID | Sévérité | Description | Résolution |
|----|----------|-------------|-----------|
| F1 | MEDIUM | BLK_MOB_FULL_BODY_FLOW_01 partageait `worlds_greatest` + `cat_camel` avec BLK_MOB_THORACIC_01 | **Corrigé** — voir rapport mini-fix |
| F2 | MEDIUM | BLK_MOB_THORACIC_SHOULDER_01 partageait `thoracic_rotation` + `cat_camel` avec BLK_MOB_THORACIC_01 | **Corrigé** — voir rapport mini-fix |
| F3 | LOW | Tags `horizontal`/`vertical` absents des blocs BC-01 (scoring légèrement réduit, non bloquant) | Accepté — sélection garantie par élimination CI |
| F4 | LOW | Tag `full_body` non-standard | Accepté — cosmétique, sans impact moteur |
| F5 | LOW | Pas de test validant le fix B3 | Accepté — couvert par smoke test TID-SMK existant |
| F6 | LOW | Notation reps BC-02 | Bruit — pattern existant |

---

## 8. Confirmation gel moteur

> **Le moteur algorithmique est resté GELÉ.**
> Seuls `src/data/exercices.v1.json` et `src/data/blocks.v1.json` ont été modifiés.
> 392 tests verts. Build OK. Aucune régression.
