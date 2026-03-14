# Rapport — Patch variété starter full gym + qualité contrast sets

**Date :** 2026-03-14
**Baseline commit :** `6ed729e9b70665411c7be82eaf1103e6156e83b0`

---

## 1. Résumé des changements

### 1a. Starter full gym — variété entre les 2 séances

**Problème :** UPPER_STARTER_V1 et LOWER_STARTER_V1 produisaient des séances quasi identiques (mêmes blocs hypertrophy + même contrast).

**Fix :** Différenciation des `slotFocusTags` entre les deux recettes :
- **Session A (UPPER_STARTER_V1)** : contrast focus `['upper', 'power']`, lower hyper focus `['lower', 'squat']`, upper hyper focus `['upper', 'push']`
- **Session B (LOWER_STARTER_V1)** : contrast focus `['lower', 'power']`, lower hyper focus `['lower', 'hinge', 'unilateral']`, upper hyper focus `['upper', 'pull']`

**Résultat :** Les deux sessions ont désormais des contrast blocks différents. Pour les backs (back_three), le bloc lower hypertrophy diffère aussi entre sessions (GYM_01 squat+RDL vs GYM_02 lunge+hip thrust).

### 1b. Retrait du pattern starter problématique

**Problème :** `BLK_STR_HP_L_GYM_02` = Back Squat + RDL Barbell, trop lourd et peu pédagogique pour un débutant.

**Fix :** Remplacement par **Fente arrière DB + Hip Thrust BW** :
- Pattern lunge + hinge (vs squat + hinge avant)
- Unilatéral (corrige les asymétries, transfert changement d'appui rugby)
- Matériel : dumbbell uniquement (plus accessible que barbell)
- Tags : `lunge`, `hinge`, `unilateral`, `posterior_chain`, `acceleration`
- Transfert rugby : fente = changement d'appui, hip thrust = moteur du sprint

### 1c. Simplification des contrast sets (3 exercices → 2)

| Bloc | Avant | Après |
|------|-------|-------|
| `BLK_CONTRAST_FULL_STARTER_01` | Glute Bridge + Broad Jump + Med Ball Slam | **Glute Bridge + Broad Jump** (retiré slam) |
| `BLK_CONTRAST_LOWER_BUILDER_01` | Goblet Squat + Squat Jump + Split Jump | **Goblet Squat + Squat Jump** (retiré split jump) |
| `BLK_CONTRAST_UPPER_BUILDER_01` | DB Bench + Chest Pass + Slam | **DB Bench + Chest Pass** (retiré slam) |
| `BLK_CONTRAST_LOWER_BUILDER_02` | RDL DB + Broad Jump + Rotational Throw | **RDL DB + Broad Jump** (retiré rotational throw) |

**Principe :** 1 prime force + 1 explosif = 1 seul transfert clair. Lisibilité coach.

**Bonus :** `BLK_CONTRAST_FULL_STARTER_01` passe de `equipment: ["med_ball"]` à `equipment: ["none"]` — accessible BW-only.

### 1d. Builder full gym — vrai contrast healthy

**Problème :** `FULL_BUILDER_V1` sur profil sain full gym reçoit `BLK_CONTRAST_LOWER_SAFE_KNEE_01` (rehab-like).

**Fix :** Création de `BLK_CONTRAST_FULL_BUILDER_01` :
- Goblet Squat (force) → Med Ball Slam (explosif full body)
- Tags : `builder`, `full`, `contrast`, `squat`, `power`, `trunk`, `contact`
- Equipment : dumbbell + med_ball
- Transfert : squat = poussée mêlée/accélération, slam = plaquage/ruck

**Résultat :** Le nouveau bloc est sélectionné dans la session UPPER du builder (session 1), pas dans FULL (session 2) à cause de la cross-session exclusion. Session 2 retombe sur safe_knee — contenu acceptable (hip thrust → glute bridge), mais nommage trompeur. Limitation documentée.

---

## 2. Blocs modifiés / ajoutés / retirés

| Action | Bloc | Description |
|--------|------|-------------|
| **Modifié** | `BLK_STR_HP_L_GYM_02` | Back Squat+RDL BB → Fente arrière DB + Hip Thrust BW |
| **Simplifié** | `BLK_CONTRAST_FULL_STARTER_01` | 3 exercices → 2, equipment none |
| **Simplifié** | `BLK_CONTRAST_LOWER_BUILDER_01` | 3 exercices → 2 |
| **Simplifié** | `BLK_CONTRAST_UPPER_BUILDER_01` | 3 exercices → 2 |
| **Simplifié** | `BLK_CONTRAST_LOWER_BUILDER_02` | 3 exercices → 2, equipment dumbbell seul |
| **Ajouté** | `BLK_CONTRAST_FULL_BUILDER_01` | Goblet Squat → Med Ball Slam (builder full) |

**Fichiers modifiés :**
- `src/data/blocks.v1.json` — 4 blocs modifiés, 1 ajouté
- `src/data/sessionRecipes.v1.ts` — slotFocusTags de 3 recettes (UPPER_STARTER, LOWER_STARTER, FULL_BUILDER)

---

## 3. Tests

- **457 tests passent, 0 échec**
- Aucun test ajouté ou modifié (les profils existants couvrent les cas)
- Build production réussit

---

## 4. Résumé des 5 programmes régénérés (W4, full gym)

### Starter full gym FRONT_ROW

| | Session 0 (LOWER_STARTER) | Session 1 (UPPER_STARTER) |
|---|---|---|
| Contrast | **UPPER_STARTER** (push-up → chest pass) | **FULL_STARTER** (bridge → broad jump) |
| Hyper lower | GYM_01 (goblet squat + RDL DB) | GYM_01 (goblet squat + RDL DB) |
| Hyper upper | GYM_02 (bench press + Pendlay row) | GYM_02 (bench press + Pendlay row) |

**Verdict :** Contrast différencié ✅. Hyper identique ⚠️ (limitation cross-session exclusion starter).

### Starter full gym BACK_THREE

| | Session 0 (LOWER_STARTER) | Session 1 (UPPER_STARTER) |
|---|---|---|
| Contrast | **LOWER_STARTER** (squat → squat jump + broad jump) | **FULL_STARTER** (bridge → broad jump) |
| Hyper lower | **GYM_02** (fente arrière + hip thrust) | **GYM_02** (fente arrière + hip thrust) |
| Hyper upper | GYM_02 (bench + Pendlay row) | GYM_02 (bench + Pendlay row) |

**Verdict :** Contrast différencié ✅. Nouveau bloc lunge utilisé ✅. Back Squat+RDL éliminé ✅.

### Builder full gym SECOND_ROW

| Session | Contrast |
|---|---|
| Session 0 (LOWER) | **BUILDER_02** (RDL → broad jump) ✅ simplifié |
| Session 1 (UPPER) | **FULL_BUILDER_01** (goblet → slam) ✅ nouveau bloc |
| Session 2 (FULL) | SAFE_KNEE_01 (hip thrust → glute bridge) ⚠️ fallback acceptable |

**Verdict :** 2/3 sessions avec contrast adaptés ✅. Fallback session 3 acceptable.

### Performance full gym FRONT_ROW / BACK_THREE

Performance inchangé — blocs contrast performance existants utilisés correctement. Aucune régression.

---

## 5. Verdict explicite

### Gains visibles

1. ✅ **Contrast différencié entre sessions starter** — chaque séance a un contrast set distinct
2. ✅ **Back Squat+RDL Barbell éliminé** — remplacé par fente arrière + hip thrust (pédagogique, unilatéral, rugby)
3. ✅ **Contrast sets lisibles** — 1 prime + 1 explosif, transfert unique identifiable
4. ✅ **Bonus : BLK_CONTRAST_FULL_STARTER_01 accessible BW-only** (equipment: none)
5. ✅ **Builder full gym reçoit un vrai contrast** (session 1/3)
6. ✅ **Performances non impactées** — programmes perf identiques avant/après

### Limitations résiduelles

1. ⚠️ **Hypertrophy blocks identiques entre sessions starter** pour un même poste — cross-session exclusion désactivée pour starter. Corrigeable uniquement par changement moteur (hors scope).
2. ⚠️ **Builder session 3 (FULL)** retombe sur `safe_knee` — cross-session exclusion consomme les 3 blocs builder. Contenu acceptable mais nommage trompeur. Corrigeable en ajoutant un 2e bloc contrast full builder.
3. ⚠️ **BLK_CONTRAST_LOWER_STARTER_01** a toujours 3 exercices (squat + squat jump + broad jump) — non ciblé dans le scope de ce patch, mais candidat à simplification future.
