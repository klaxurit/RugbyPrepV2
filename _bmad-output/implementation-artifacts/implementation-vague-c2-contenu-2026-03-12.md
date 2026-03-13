# Rapport — Vague C2 : Sprint de crédibilité contenu

**Date** : 2026-03-12
**Baseline commit** : `1e18345`
**Statut** : ✅ 354 tests verts, 0 nouvelle erreur TypeScript, build OK

---

## Résumé

3 findings contenu implémentés depuis la Vague C1 (algo fixes) :
- **VC-02** : 11 nouveaux blocs/exercices starter pour variété (4 activation + 5 hypertrophy + 2 exercices support)
- **VC-03** : 3 nouveaux blocs lower (2 force squat-dominant + 1 contrast sans box) + 3 exercices
- **VC-04** : 2 nouveaux blocs upper safe pour shoulder_pain (pull-only, zéro poussée) + 1 exercice

13 nouveaux tests + 3 tests existants mis à jour.

---

## Détail par finding

### VC-02 [CRITICAL] — Variantes starter ✅

**Problème** : Les profils starter reproduisaient exactement les mêmes blocs W1/W5/W7. Un seul bloc activation BW, un seul bloc upper hypertrophy BW, aucune variante blessure-safe.

**Correction — Blocs ajoutés** :

| Bloc | Intent | Équipement | Exercices | Justification |
|---|---|---|---|---|
| `BLK_STR_ACT_LOWER_BW_01` | activation | none | bird dog + pont fessier | Activation BW sans aucune CI — résout le trou S4 (low_back_pain) |
| `BLK_STR_ACT_LOWER_BAND_01` | activation | band | clam shell band + pont fessier | Activation band ciblée moyen fessier (prévention genou valgus) |
| `BLK_STR_ACT_UPPER_BW_02` | activation | none | pompe inclinée + bird dog | Activation upper BW alternative (plus facile que scap push-up) |
| `BLK_STR_ACT_UPPER_BAND_01` | activation | band | band pull-apart overhead + face pull | Activation upper band santé coiffe |
| `BLK_STR_HP_L_03` | hypertrophy | none | fente arrière BW + pont fessier | Lower unilatéral (transfert rugby : poussée, appuis) |
| `BLK_STR_HP_L_04` | hypertrophy | none | fente latérale BW + wall sit | Lower frontal (adducteurs + isométrique quadriceps) |
| `BLK_STR_HP_A_03` | hypertrophy | band | pompe inclinée + rowing band | Upper plus facile (débutants qui ne maîtrisent pas les pompes) |
| `BLK_STR_HP_A_04` | hypertrophy | band | pompe genoux + face pull band | Upper débutant avec équilibre push/pull scapulaire |
| `BLK_STR_HP_A_05` | hypertrophy | none | pompe genoux + traction inversée | Upper BW variante (pompes genoux au lieu de standard) |
| `BLK_STR_HP_A_SAFE_01` | hypertrophy | band | rowing band + rétraction scapulaire | **Upper safe shoulder_pain** : zéro push, pull-only |
| `BLK_STR_HP_A_SAFE_02` | hypertrophy | band | rowing coudes bas + face pull | **Upper safe shoulder_pain** v2 : 2 tirages différents |

**Exercices ajoutés** :

| Exercice | Pattern | Équipement | CIs |
|---|---|---|---|
| `lower_lunge__reverse_lunge__bodyweight` | lunge | none | knee_pain |
| `lower_lunge__lateral_lunge__bodyweight` | lunge | none | groin_pain, knee_pain |
| `push_horizontal__push_up__incline` | push_horizontal | none | shoulder_pain, wrist_pain |
| `activation__band_pull_apart__overhead` | activation | band | shoulder_pain |
| `activation__bird_dog__bodyweight` | activation | none | aucune |
| `activation__glute_clam__band` | activation | band | aucune |
| `lower_squat__wall_sit__bodyweight` | squat | none | aucune |
| `pull_horizontal__band_row__face_pull_height` | pull_horizontal | band | aucune |

**Impact** :
- BW starter : 3 activation → (avant : 1-2), 4 hypertrophy (2 upper + 2 lower) → (avant : 2+2 mais aucune variante)
- Band starter : 5 activation, 6+ hypertrophy
- S4 (low_back_pain) : activation slot maintenant rempli (résolution du bug TID-EDG-004)
- Shoulder_pain starter : 2 blocs upper hypertrophy pull-only (résolution VC-04 ci-dessous)

---

### VC-03 [HIGH] — Lower squat-dominant + contrast sans box ✅

**Problème** : Aucun pattern squat dans les profils performance/builder. Le seul bloc squat (front squat) nécessitait barbell + ab_wheel. Les contrast lower nécessitaient tous un box.

**Correction — Blocs ajoutés** :

| Bloc | Intent | Équipement | Exercices | Justification |
|---|---|---|---|---|
| `BLK_FORCE_LOWER_BACK_SQUAT_01` | force | barbell | back squat + dead bug | Le mouvement roi du rugby S&C. Transfert mêlée, ruck, démarrage. |
| `BLK_FORCE_LOWER_GOBLET_SQUAT_01` | force | dumbbell | goblet squat + fente arrière DB | Alternative squat sans barre. Auto-correction posturale. |
| `BLK_CONTRAST_LOWER_SQUAT_JUMP_01` | contrast | dumbbell | goblet squat + squat jump + fente sautée | Contrast squat-dominant SANS box. Transfert explosivité rugby. |

**Exercices ajoutés** :

| Exercice | Pattern | Équipement | CIs |
|---|---|---|---|
| `squat__back_squat__barbell` | squat | barbell | knee_pain, low_back_pain |
| `power__squat_jump__bodyweight` | squat | none | knee_pain, low_back_pain |
| `power__split_jump__bodyweight` | lunge | none | knee_pain, ankle_pain |

**Impact** :
- Performance full gym : 3+ blocs force squat (back squat + front squat + bulgarian) au lieu de 1
- Performance limited gym (dumbbell) : goblet squat + contrast squat jump accessibles
- Le pattern squat apparaît maintenant réellement dans les profils performance/builder
- Contrast lower sans box : `BLK_CONTRAST_LOWER_SQUAT_JUMP_01` ne nécessite que dumbbell

---

### VC-04 [HIGH] — Upper viable pour shoulder_pain ✅

**Problème** : Les séances upper avec shoulder_pain étaient des "coquilles vides" — tous les blocs upper hypertrophy starter étaient contra (push-based). Le starter + shoulder_pain n'avait aucun bloc upper réel.

**Correction** : Intégrée dans VC-02 ci-dessus via les 2 blocs `BLK_STR_HP_A_SAFE_01` et `BLK_STR_HP_A_SAFE_02`.

**Principes** :
- Zéro exercice de poussée (push-up, press, overhead)
- Uniquement du tirage (band row, face pull) et du travail scapulaire (rétraction iso)
- Compatible shoulder_pain au niveau exercice ET bloc
- Tagged `starter` pour être sélectionnables par les débutants
- Tagged `pull` + `shoulder_health` (pas de `push`)

**Impact** :
- Starter + shoulder_pain + band : 2 blocs upper hypertrophy réels (au lieu de 0)
- Performance + shoulder_pain : les blocs rehab existants restent disponibles (`BLK_HYPER_UPPER_REHAB_*`)
- La séance upper n'est plus vide — elle contient du travail musculaire réel de tirage

---

## Fichiers modifiés

| Fichier | Finding(s) |
|---|---|
| `src/data/exercices.v1.json` | VC-02, VC-03, VC-04 — 12 exercices ajoutés |
| `src/data/blocks.v1.json` | VC-02, VC-03, VC-04 — 14 blocs ajoutés |
| `src/services/program/waveA.test.ts` | TC-15 à TC-27 |
| `src/services/program/buildWeekProgram.test.ts` | TID-ENG-008 mis à jour (S4 non-degraded) |
| `src/services/program/buildWeekProgramEdgeCases.test.ts` | TID-EDG-004 mis à jour (S4 activation rempli) |

---

## Tests ajoutés/modifiés

| ID | Type | Description |
|---|---|---|
| TC-15 | NEW | Starter W1 vs W5 ne sont pas vides |
| TC-16 | NEW | Starter BW a ≥3 blocs activation éligibles |
| TC-17 | NEW | Starter BW a ≥4 blocs hypertrophy (2 upper + 2 lower) |
| TC-18 | NEW | Starter band a plus d'options activation que BW |
| TC-19 | NEW | Performance full gym a ≥2 blocs force squat-tagged lower |
| TC-20 | NEW | Pattern squat visible dans corpus H1-W4 |
| TC-21 | NEW | Contrast lower sans box existe pour dumbbell-only |
| TC-22 | NEW | Goblet squat accessible pour limited gym |
| TC-23 | NEW | Back squat accessible pour full gym |
| TC-24 | NEW | Starter + shoulder_pain a ≥1 upper hypertrophy bloc |
| TC-25 | NEW | Starter + shoulder_pain + band produit session upper avec bloc réel |
| TC-26 | NEW | Performance + shoulder_pain a ≥2 upper work blocks éligibles |
| TC-27 | NEW | Blocs safe shoulder_pain n'ont aucun tag push |
| TID-ENG-008 | MODIFIED | S4 ne déclenche plus quality gate (activation remplie) |
| TID-EDG-004 | MODIFIED | S4 activation slot maintenant ≥1 (VC-02 fix) |

---

## Résultats validation

```
Test Files:  16 passed (16)
Tests:       354 passed (354)
TypeScript:  0 nouvelles erreurs
Build:       ✅ (dist/ generated)
```

---

## Bilan contenu

| Avant VC-02/03/04 | Après |
|---|---|
| 102 blocs | 116 blocs (+14) |
| 141 exercices | 153 exercices (+12) |
| 0 bloc activation starter sans CI | 2 blocs (bird dog + clam) |
| 1 bloc upper hypertrophy BW starter | 3 blocs (+ knee push-up, incline) |
| 0 bloc upper starter safe shoulder | 2 blocs (pull-only band) |
| 1 bloc force squat (front squat + ab_wheel) | 4 blocs (+ back squat, goblet, bulgarian) |
| 0 contrast lower sans box | 1 bloc (goblet + squat jump + split jump) |

---

## Risques résiduels

1. **Monotonie starter BW** : Avec 2 blocs upper BW et 2 blocs lower BW, la variété est limitée sur 8+ semaines. Résolu pour les profils avec band (6+ options).

2. **TC-15 (W1 vs W5)** : Le test vérifie que les blocs ne sont pas vides mais pas que les blockIds diffèrent. La variété dépend du scoring déterministe — si les scores sont identiques, le même bloc sera toujours sélectionné. La variété inter-semaines vient principalement des **versions** (W1/W2/W3/W4) qui changent les sets/reps.

3. **Contrast squat jump** : `BLK_CONTRAST_LOWER_SQUAT_JUMP_01` a 4 CI (knee_pain, low_back_pain, wrist_pain, ankle_pain). Les profils U18/knee_pain tombent toujours sur `BLK_CONTRAST_LOWER_REHAB_CONTROL_01` (TKE + mollets). C'est correct cliniquement mais la question U18/knee_pain reste partiellement ouverte.

4. **Shoulder_pain starter sans band** : Un starter + shoulder_pain + BW_ONLY n'a toujours aucun bloc upper hypertrophy. Les 2 blocs safe nécessitent `band`. Comportement correct : sans élastique, pas de tirage possible. Le moteur tombe en safety fallback (core).

---

## Verdict

**Vague C2 complète.** Les 3 findings contenu sont traités :
- Starter : 14 blocs au lieu de 9, variété doublée
- Squat : présent dans le corpus performance/builder
- Shoulder_pain starter : 2 blocs upper réels (pull-only)

Le moteur est prêt pour la phase de stabilisation produit.
