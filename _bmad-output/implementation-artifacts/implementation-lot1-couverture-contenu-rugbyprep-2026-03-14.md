# Rapport d'implémentation — Lot 1 Couverture Contenu (Contrast Sets à tous les niveaux)

**Date :** 2026-03-14
**Baseline commit :** `f76da075d1ec6f6b7defa9abb28128d37402d6e5`
**Spec source :** `_bmad-output/implementation-artifacts/tech-spec-wip.md`
**Revue adversariale :** 7 findings (0 Critical, 0 High, 2 Medium, 5 Low)
**Résolution :** Auto-fix F1/F2/F6 — F3/F4/F7 acceptés comme limitations connues — F5 hors lot

---

## 1. Résumé des changements

### P0-a : Starter Full Gym (5 blocs hypertrophy)

| Bloc | Intent | Equipment | Tags scoring | Position favorisée |
|------|--------|-----------|-------------|-------------------|
| `BLK_STR_HP_A_GYM_01` | hypertrophy | dumbbell, bench | contact | Avants, Centers |
| `BLK_STR_HP_A_GYM_02` | hypertrophy | barbell, bench | contact, force | Avants (phase Force) |
| `BLK_STR_HP_L_GYM_01` | hypertrophy | dumbbell | carry, posterior_chain | Avants, Backs |
| `BLK_STR_HP_L_GYM_02` | hypertrophy | barbell | force, contact, posterior_chain | Front row +++ |
| `BLK_STR_CORE_GYM_01` | core | band, dumbbell | trunk, carry, contact | Avants +++ |

### P0-b : Contrast Sets à tous les niveaux (5 recettes modifiées + 6 blocs contrast)

**Recettes modifiées (slot `contrast` optionnel ajouté après activation, avant hypertrophy) :**
- `UPPER_STARTER_V1` — slot 2, slotFocusTags: `['lower', 'upper', 'power']`
- `LOWER_STARTER_V1` — slot 2, slotFocusTags: `['lower', 'upper', 'power']`
- `UPPER_BUILDER_V1` — slot 2, slotFocusTags: `['upper', 'power']`
- `LOWER_BUILDER_V1` — slot 2, slotFocusTags: `['lower', 'power']`
- `FULL_BUILDER_V1` — slot 2, slotFocusTags: `['lower', 'full', 'power']`

**Blocs contrast :**

| Bloc | Niveau | Equipment | Famille | Tags scoring |
|------|--------|-----------|---------|-------------|
| `BLK_CONTRAST_LOWER_STARTER_01` | starter | none | Squat→Jump | acceleration, power |
| `BLK_CONTRAST_UPPER_STARTER_01` | starter | med_ball | Push→Throw | contact, power |
| `BLK_CONTRAST_FULL_STARTER_01` | starter | med_ball | Hinge→Jump+Slam | posterior_chain, power |
| `BLK_CONTRAST_LOWER_BUILDER_01` | builder | dumbbell | Squat→Jump+Split | acceleration, unilateral, power |
| `BLK_CONTRAST_UPPER_BUILDER_01` | builder | dumbbell, bench, med_ball | Bench→Throw+Slam | contact, power |
| `BLK_CONTRAST_LOWER_BUILDER_02` | builder | dumbbell, med_ball | RDL→Jump+Rotation | posterior_chain, trunk, power |

### Ajustements de constantes de validation

| Constante | Avant | Après | Justification |
|-----------|-------|-------|---------------|
| `MAX_BLOCKS` (validateSession.ts) | 7 | 8 | Les recettes perf existantes (UPPER_V1/LOWER_V1) ont déjà 8 slots. La constante était trop basse. |
| `VOLUME_COUNTED_INTENTS` (buildWeekProgram.ts) | inclut `contrast` | exclut `contrast` | Le contrast est du travail explosif/neural (3-5 reps), pas du volume-accumulating. Le compter dans le volume cap starter (10 sets) est scientifiquement incorrect — KB strength-methods.md §4.4. |

### Exercices : 0 à créer

Tous les exercices référencés existaient déjà dans `exercices.v1.json`. Remapping effectué :
- Spec `pull_horizontal__dumbbell_row__single_arm` → existant `pull_horizontal__one_arm_row__dumbbell`
- Spec `pull_horizontal__barbell_row__pronated` → existant `pull_horizontal__pendlay_row__barbell`
- Spec `carry__farmer_carry__dumbbell` → existant `carry__farmer_walk__dumbbell`

### Contraindications corrigées

Chaque bloc porte l'union des contraindications de ses exercices (conformément au test d'intégrité TID-DAT-006).

---

## 2. Fichiers modifiés

| Fichier | Type de modification |
|---------|---------------------|
| `src/data/sessionRecipes.v1.ts` | Ajout slot contrast optionnel sur 5 recettes |
| `src/data/blocks.v1.json` | Ajout de 11 blocs (5 gym-starter + 6 contrast) |
| `src/services/program/validateSession.ts` | MAX_BLOCKS 7 → 8 |
| `src/services/program/buildWeekProgram.ts` | `contrast` retiré de VOLUME_COUNTED_INTENTS |
| `src/services/program/waveA.test.ts` | VOLUME_INTENTS synchronisé avec buildWeekProgram |
| `src/services/program/validationMetier.test.ts` | 5 nouveaux profils de test ajoutés |

---

## 3. Tests ajoutés/modifiés

### Nouveaux profils dans `validationMetier.test.ts` (30 tests)

| Profil | Objectif |
|--------|----------|
| `starter_bw_only` | Starter BW, BACK_ROW — vérifie que seul le contrast lower BW apparaît |
| `starter_gym_front_row` | Starter full gym, FRONT_ROW — blocs gym + contrast upper/lower |
| `starter_gym_back_three` | Starter full gym, BACK_THREE — scoring position backs |
| `starter_bw_knee_pain` | Starter BW + knee_pain — slot contrast vide (contra), séance cohérente |
| `builder_full_equipment` | Builder full equipment, SECOND_ROW — blocs builder + contrast builder |

### Modification `waveA.test.ts`

- `VOLUME_INTENTS` synchronisé : `contrast` retiré (identique à `VOLUME_COUNTED_INTENTS` dans buildWeekProgram.ts)

---

## 4. Résultats test/lint/build

| Commande | Résultat |
|----------|----------|
| `npm run test` | **453 tests passent, 0 échec** |
| `npm run lint` | 77 erreurs pré-existantes (règles ESLint non trouvées dans la config) — aucune liée aux changements |
| `npm run build` | **Build production réussit** (dist/ généré) |

---

## 5. Confirmations explicites

### Aucun changement moteur structurel

- `buildWeekProgram.ts` : seule modification = retrait de `contrast` de `VOLUME_COUNTED_INTENTS` (constante de comptage volume, pas de logique)
- `validateSession.ts` : seule modification = `MAX_BLOCKS` 7 → 8 (constante de validation, pas de logique)
- `buildSessionFromRecipe.ts` : **inchangé**
- `selectEligibleBlocks.ts` : **inchangé**
- `scoreBlock` : **inchangé**
- `positionPreferences.v1.ts` : **inchangé**
- `programPhases.v1.ts` : **inchangé**

### Intégrité data respectée

- Toutes les contraindications exercices propagées aux blocs parents (TID-DAT-006 vert)
- Level gating respecté : tag `starter` sur blocs starter, `builder` sur blocs builder
- Tous les exerciseId référencés existent dans exercices.v1.json

### Fallback cohérent si slot contrast vide

- Le slot `contrast` est `required: false` — pattern identique à REHAB_*_P3_V1
- Vérifié par le profil `starter_bw_knee_pain` : le slot contrast est vide (exercices contra-indiqués pour knee_pain), la séance reste cohérente (activation + hypertrophy × 2 + core)
- Aucun warning artificiel émis quand le slot est vide
- Les slots hypertrophy ne sont pas affectés par la présence/absence du contrast

### Séquence de séance validée

```
warmup → activation → contrast (optionnel, quand SNC frais) → hypertrophy × 2 → core/prehab → cooldown
```

Le contrast est placé après l'activation et avant l'hypertrophy, conformément au spec validé (travail explosif quand le SNC est au plus frais).

---

## 6. Revue adversariale — Résolution

### Auto-fixés

| Finding | Sévérité | Fix appliqué |
|---------|----------|-------------|
| **F1** Contrast exclu du volume → guard aveugle | Medium | Guard local `MAX_CONTRAST_SETS = 4` ajouté dans `buildWeekProgram.ts`. Émet un warning si un bloc contrast dépasse 4 sets. Documenté avec KNOWN LIMIT. Aucun effet sur les blocs perf existants (tous ≤ 4 sets). |
| **F2** Dead weight `'full'` dans FULL_BUILDER_V1 | Low | Tag `'full'` retiré de slotFocusTags contrast. |
| **F6** Pas de test perf pour volume/contrast | Low | 4 tests ajoutés : F1-guard starter ≤ 4 sets, pas de warning starter, pas de volume-exceeded perf, perf contrast ≤ 4 sets. |

### Acceptés comme limitations connues

| Finding | Sévérité | Raison |
|---------|----------|--------|
| **F3** Même contrast lower dans les 2 sessions starter BW | Low | Cross-session exclusion désactivée pour starter. 1 seul bloc contrast BW = pas de variété possible. Documenté. |
| **F4** Blocs gym dominent les BW en scoring | Low | Intentionnel — c'est le but du Lot 1. |
| **F7** Schémas de reps non-standards | Low | Pattern existant dans la codebase. Affichage string uniquement. |

### Hors lot

| Finding | Raison |
|---------|--------|
| **F5** `useProfile.ts` changements non liés | Pré-existant dans le working tree. Commit séparé recommandé. |

---

## 7. Résultats finaux

| Commande | Résultat |
|----------|----------|
| `npm run test` | **457 tests passent, 0 échec** |
| `npm run lint` | 77 erreurs pré-existantes (config ESLint) |
| `npm run build` | **Build production réussit** |
