# Rapport Mini Fix — Doublons Mobilité Post-BC

**Date** : 2026-03-13
**Baseline commit** : `48e4016e3a480d9b5e2d455f4b6b973c197c4878`
**Moteur** : GELÉ (aucune modification moteur)
**Tests** : 392 passed (0 fail)

---

## 1. Problème corrigé

Suite à la revue adversariale du sprint BC-01/02/03, deux findings MEDIUM ont été identifiés :

### F1 — BLK_MOB_FULL_BODY_FLOW_01 × BLK_MOB_THORACIC_01

**Constat** : BLK_MOB_FULL_BODY_FLOW_01 utilisait `worlds_greatest_stretch` et `cat_camel`, deux exercices également présents dans BLK_MOB_THORACIC_01. Si ces deux blocs étaient sélectionnés dans la même session RECOVERY_MOBILITY_V1 (2 slots mobilité), l'utilisateur voyait ces exercices en doublon.

**Contexte** : Cross-session exclusion désactivée pour starter → les blocs ne sont pas protégés contre la co-sélection dans la même session.

### F2 — BLK_MOB_THORACIC_SHOULDER_01 × BLK_MOB_THORACIC_01

**Constat** : BLK_MOB_THORACIC_SHOULDER_01 utilisait `thoracic_rotation_seated` et `cat_camel`, deux exercices également présents dans BLK_MOB_THORACIC_01.

---

## 2. Correction appliquée

### F1 — BLK_MOB_FULL_BODY_FLOW_01

| | Avant | Après |
|-|-------|-------|
| **Exercices** | worlds_greatest_stretch + pigeon_pose + cat_camel | `hip_90_90` + pigeon_pose + `ankle_circles` |
| **Nom** | Flow mobilite corps entier (world's greatest + pigeon + chat-vache) | Flow mobilite corps entier (pigeon + 90/90 + cheville) |
| **Tags** | mobility, full_body, hip, thoracic, recovery | mobility, full_body, hip, **ankle**, recovery |

**Overlap avec BLK_MOB_THORACIC_01 post-fix** : ∅ (zéro)

### F2 — BLK_MOB_THORACIC_SHOULDER_01

| | Avant | Après |
|-|-------|-------|
| **Exercices** | thoracic_rotation_seated + sleeper_stretch + cat_camel | sleeper_stretch + `hip_couch_stretch` + `ankle_circles` |
| **Nom** | Mobilite thoracique & epaule (rotation + sleeper stretch + chat-vache) | Mobilite epaule & chaine posterieure (sleeper + couch stretch + cheville) |
| **Tags** | upper, mobility, thoracic, shoulder, recovery | upper, mobility, shoulder, **ankle, hip**, recovery |

**Overlap avec BLK_MOB_THORACIC_01 post-fix** : ∅ (zéro)

---

## 3. Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/data/blocks.v1.json` | Exercices et métadonnées de 2 blocs modifiés |

---

## 4. Validation

| Gate | Résultat |
|------|----------|
| `npm run test` | 392/392 passed ✅ |
| `npm run build` | OK ✅ |
| TID-DAT-001 (equipment) | Pas d'impact (exercices BW uniquement) ✅ |
| TID-DAT-003 (exercise refs) | Tous les exercices existent ✅ |
| TID-DAT-006 (CI propagation) | CI=[] sur tous les exercices de remplacement ✅ |

---

## 5. Confirmation gel moteur

> **Moteur resté GELÉ.** Seul `src/data/blocks.v1.json` modifié (2 blocs existants patchés).
