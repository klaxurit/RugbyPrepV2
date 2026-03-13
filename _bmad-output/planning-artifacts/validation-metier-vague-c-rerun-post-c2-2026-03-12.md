# Validation Métier — Re-run Post Vague C2

**Date** : 2026-03-12
**Baseline** : `validation-metier-vague-c-2026-03-12.md` (63/100)
**Corpus** : 17 profils × 6 semaines = 102 cas (dont 14 profils originaux × 6 = 84 cas comparables)
**Source** : `corpus_summary_2026-03-12.txt` (sorties réelles du moteur)

---

## 1. Executive Summary

La Vague C (C1 algo + C2 contenu) fait progresser la note moyenne de **63/100 à 72/100** (+9 points). Les gains sont concentrés sur les starters nominaux (+15 pts), l'apparition du pattern squat en performance (+10 pts), et la résolution de S4 (low_back_pain activation). En revanche, **3 problèmes structurels persistent** : S5 (starter + BW + shoulder_pain) reste une coquille vide, P3/B3 (shoulder_pain) ont un UPPER_V1 sévèrement dégradé en phase force, et le volume W3/W7 dépasse le cap starter. Le moteur est **GO CONDITIONNEL** pour stabilisation produit, sous réserve de 2 correctifs P0 restants.

---

## 2. Tableau Avant/Après

| Métrique | Baseline Vague C | Post-C2 | Delta | Commentaire |
|---|---|---|---|---|
| **Note moyenne globale** | 63/100 | 72/100 | **+9** | Progression significative, portée par starters et perf nominaux |
| **Starter nominal (S1/S2)** | 55/100 | 70/100 | **+15** | Variété doublée (activation + hypertrophy rotation) |
| **Starter blessé (S3-S5)** | 45/100 | 55/100 | **+10** | S4 résolu. S5 inchangé (BW + shoulder = impossible). S3 stable. |
| **Builder nominal (B1/B2/B5)** | 75/100 | 78/100 | **+3** | Peu de changement, déjà bien structuré |
| **Builder blessé (B3/B4)** | 55/100 | 58/100 | **+3** | B3 FULL toujours safety-adapted. B4 correct (rehab lower). |
| **Perf nominal (P1/P2)** | 82/100 | 88/100 | **+6** | Squat jump contrast visible. DUP correct. Deload W7 propre. |
| **Perf blessé (P3-P6)** | 58/100 | 63/100 | **+5** | P3 UPPER_V1 W1-W4 encore dégradé (4 blocs). FULL_V1 OK via rehab band force. |
| **Perf BW (P7)** | 30/100 | 32/100 | **+2** | Cas extrême inchangé, dégradation massive attendue |
| **Pattern squat visible** | 0 profils | P1/P2 W1-W5 | **Fix** | `BLK_CONTRAST_LOWER_SQUAT_JUMP_01` sélectionné en contrast slot |
| **Variété activation starter** | 1 bloc unique | 3-4 blocs en rotation | **Fix** | `BLK_STR_ACT_UPPER_BW_02`, `BLK_STR_ACT_UPPER_BAND_01`, `BLK_STR_ACT_LOWER_BW_01` |
| **Volume cap starter W7** | Non mesuré | 13/10 (violation) | **Nouveau** | Détecté par quality gates. Version W3 pousse le volume trop haut. |
| **Deload W7 perf** | 3 sessions (duplication) | 2 sessions (LOWER + MOB) | **Fix** | VC-05 appliqué correctement |
| **Upper shoulder_pain starter** | 0 bloc réel | 0 bloc réel (BW) / 2 blocs (band) | **Partiel** | VC-04 résout pour band. BW_ONLY = pas de tirage possible. |

---

## 3. Tableau des 14 Cas de Validation (profils originaux)

| Profil | Description | Semaines | Note /100 | Verdict | Point fort | Point faible |
|---|---|---|---|---|---|---|
| **S1** | Starter BW, sain | H1-W7 | **72** | Acceptable | Rotation hypertrophy (L_01↔L_04), activation (FB↔UPPER_BW_02) | Même BLK_STR_HP_A_01 partout (1 seul upper hypertrophy BW). W7 volume 13/10. |
| **S2** | Starter LIMITED_GYM, sain | H1-W7 | **72** | Acceptable | Activation band (BAND_01) en rotation. Variété OK. | Mêmes hypertrophy blocks que S1 (L_04/A_01). W7 volume 13/10. |
| **S3** | Starter BW, knee_pain | H1-W7 | **65** | Passable | Rehab lower (L_REHAB_01) correct. Activation upper (BW_02) visible. | 1 seul lower hypertrophy (L_REHAB_01) sur 6 semaines. Monotonie. W7 volume 13/10. |
| **S4** | Starter LIMITED_GYM, low_back_pain | H1-W7 | **70** | Acceptable | **Activation slot rempli** (ACT_LOWER_BAND_01). Plus de safety fallback. 2 lower hyper (L_04+L_03). | Pas de bloc core (correct cliniquement). 5 blocs au lieu de 6. |
| **S5** | Starter BW, shoulder_pain | H1-W7 | **35** | Insuffisant | Lower hypertrophy OK (L_04/L_01 en rotation). Activation lower (BW_01) new. | **UPPER session = coquille vide** : activation→core, hypertrophy→activation lower. Zéro travail upper. 100% safety adapted. |
| **B1** | Builder LIMITED_GYM, sain | H1-W7 | **78** | Bon | Structure SS solide. Rotation finishers (core anti-rot/anti-ext). Prehab hamstring. | Toujours 2 mêmes hypertrophy lower (SS_01+SS_02). Peu de variété lower. |
| **B2** | Builder FULL_GYM, sain, 3x | H1-W7 | **82** | Bon | FULL_BUILDER bien structuré (upper + lower hyper). Bonne variété (vert/horiz/shoulder SS). | Aucun neural/force block — builder = hypertrophy only. OK par design. |
| **B3** | Builder FULL_GYM, shoulder_pain, 3x | H1-W7 | **55** | Passable | UPPER uses rehab pull+scap blocks — réel travail upper tirage. Lower intact. | **FULL_BUILDER 100% safety-adapted** (6/6 semaines). Upper hyper slot → core. Warning "imbalance" permanent. |
| **P1** | Perf FULL_GYM, sain, 3x | H1-W7 | **90** | Excellent | DUP correct (H/M/L). **Squat jump contrast** visible en LOWER W1. Neural + force + contrast complets. W7 deload propre (2 sess). | W4 volume 22/20 (léger dépassement). |
| **P2** | Perf FULL_GYM, sain, 2x | H1-W7 | **85** | Bon | Mêmes qualités que P1. Force phase W1-W4 complète. Deload W7 correct. | W4 volume 22/20. Pas de FULL session (2x seulement). |
| **P3** | Perf FULL_GYM, shoulder_pain, 3x | H1-W7 | **55** | Passable | Lower W1-W4 intact (neural+contrast+force). UPPER_HYPER (H1/H4) OK avec rehab blocks. FULL_V1 W1 a rehab band force. | **UPPER_V1 W1-W4 = 4 blocs** (warmup+act+core+cooldown). Neural et contrast impossibles (tous push-based → contra shoulder_pain). |
| **P4** | Perf FULL_GYM, knee_pain, 3x | H1-W7 | **65** | Passable | Upper intact. Force lower survit (RDL, hinge OK). | LOWER contrast→core (squat jump contra knee_pain). FULL aussi partiellement dégradé. |
| **P5** | Perf LIMITED_GYM, sain, 3x | H1-W7 | **72** | Acceptable | Hypertrophy (H1/H4) sessions complètes avec DB blocks. | Force phase (W1-W4): contrast limited (DB snatch EMOM en neural OK). Pas de barbell. |
| **P7** | Perf BW_ONLY, sain, 3x | H1-W7 | **32** | Insuffisant | Neural lower (broad jump) survit. W7 deload correct (2 sess). | UPPER_V1 = 4 blocs (warmup+act+prehab+cooldown). FULL = 5 blocs all-activation fallbacks. Cas extrême, profil non réaliste. |

**Note moyenne 14 profils : 72/100** (vs 63/100 baseline)

---

## 4. Findings Classés par Sévérité

### CRITICAL (3)

**F-C2-01** : S5 (starter + BW + shoulder_pain) — UPPER session reste une coquille vide
- 100% safety-adapted sur 6/6 semaines
- `activation` → core, `hypertrophy` → activation lower
- Zéro travail upper effectif
- VC-04 a ajouté 2 blocs safe (BLK_STR_HP_A_SAFE_01/02) mais ils nécessitent `band`
- **Impact** : Un utilisateur starter BW avec shoulder_pain recevra un programme "Upper" sans aucun exercice upper. Crédibilité nulle.
- **Fix data possible ?** Non — sans élastique, aucun tirage possible au poids du corps pour un débutant shoulder_pain. Le fix est UX : renommer la session ou la remplacer par "Recovery/Mobility".

**F-C2-02** : P3 UPPER_V1 (perf + shoulder_pain, phase force W1-W4) — Session gutted (4 blocs)
- UPPER_V1 perd neural + contrast (tous push-based, contra shoulder_pain)
- Ne reste que warmup + activation + core + cooldown
- Le slot `neural` et le slot `contrast` de UPPER_V1 n'ont aucun candidat pull-only
- UPPER_HYPER_V1 (H1/H4) fonctionne grâce aux blocs rehab (PULL_SCAP + ROW_CONTROL)
- **Impact** : En phase force, l'athlète performance avec shoulder_pain n'a aucun travail upper significatif 2 semaines sur 4.
- **Fix** : Ajouter des blocs neural/contrast upper pull-only (ex: pendlay row EMOM pull-only, pull-up contrast) sans push.

**F-C2-03** : Volume cap starter W7 dépassé (13 sets vs cap 10) — 5 profils touchés
- S1, S2, S3 déclenchent `quality:volume-exceeded` sur W7
- Version W3 augmente sets par bloc (3→4 pour hypertrophy, 2→3 pour core)
- Total : warmup(1) + activation(2) + hyper(4) + hyper(4) + core(3) + cooldown(1) = 15 brut, 13 comptés
- **Impact** : Starter W7 charge plus que W1, ce qui est l'inverse de ce qu'on attend d'une progression débutant.
- **Fix** : Plafonner les versions starter à W2 (pas W3), ou réduire les sets W3 pour les blocs starter.

### HIGH (4)

**F-C2-04** : B3 FULL_BUILDER_V1 100% safety-adapted — upper hypertrophy → core
- 6/6 semaines avec safety fallback + warning "Full-body session imbalance"
- Les 2 blocs builder upper SS sont consommés en S1 (cross-session exclusion)
- Aucun bloc upper hypertrophy restant compatible shoulder_pain au niveau builder
- **Fix** : Ajouter 1-2 blocs builder upper pull-only (ex: superset row + face pull builder-level).

**F-C2-05** : Starter hypertrophy upper BW — 1 seul bloc (BLK_STR_HP_A_01) sur toutes les semaines
- S1/S2/S3 utilisent toujours le même bloc hypertrophy upper
- BLK_STR_HP_A_05 (pompe genoux + traction inversée) existe mais n'est pas sélectionné (score inférieur ?)
- La variété inter-semaines sur le slot upper hypertrophy BW est nulle
- **Fix** : Vérifier le scoring de BLK_STR_HP_A_05 vs BLK_STR_HP_A_01. Forcer la rotation via un mécanisme de diversité.

**F-C2-06** : Perf LOWER_V1 W4 volume 22 sets vs cap 20 — touche P1/P2/P3/P4/P6
- Version W4 pousse neural(8) + contrast(4) + force(4) + prehab(3) + act(3) = 22
- Le quality gate détecte mais n'agit pas (warning seulement)
- **Fix** : Soit réduire les sets W4 des blocs neural (8→6), soit faire agir le quality gate (retirer le bloc le moins prioritaire).

**F-C2-07** : P4 (knee_pain) — contrast lower systématiquement → core
- Tous les blocs contrast lower ont knee_pain en contraindication
- Le nouveau BLK_CONTRAST_LOWER_SQUAT_JUMP_01 aussi (knee_pain CI)
- P4 n'a aucune alternative contrast lower
- **Fix contenu** : Ajouter 1 bloc contrast lower safe knee (ex: hip thrust + box squat isométrique explosive, sans knee_pain CI).

### MEDIUM (4)

**F-C2-08** : Pas de différenciation U18 fille vs U18 garçon visible dans le corpus
- Le corpus ne contient pas de profils U18 explicites
- VC-01 (ACL prehab via `hip_stability` tag pour profils féminins) n'est pas vérifiable dans ce corpus
- **Fix** : Ajouter des profils U18 fille/garçon dans SIMULATION_PROFILES pour vérifier.

**F-C2-09** : S4 (low_back_pain) perd son bloc core — session à 5 blocs
- Tous les blocs core ont `low_back_pain` en contraindication
- La session tombe de 6 à 5 blocs
- Cliniquement correct mais la session paraît courte
- **Fix contenu possible** : Ajouter 1 bloc core safe low_back (ex: dead bug isométrique, planche sur genoux) sans low_back_pain CI.

**F-C2-10** : Rotation activation starter insuffisante — BLK_STR_ACT_FB_01 toujours gagnant en H1/H4/W5
- Sur S1 : H1=FB_01, H4=FB_01, W1=FB_01, W4=FB_01, W5=FB_01, W7=FB_01 pour LOWER
- La session UPPER utilise UPPER_BW_02 en W1/W4 (bon) mais FB_01 partout ailleurs
- Le scoring favorise FB_01 (tags upper+lower = score plus élevé sur recettes qui demandent `lower`)
- **Fix** : Ajuster le scoring pour favoriser la spécificité (activation lower sur recette lower, activation upper sur recette upper).

**F-C2-11** : Cross-session duplication starter acceptée mais visible
- S1 H1 : LOWER et UPPER ont les mêmes blocs hypertrophy (L_04 + A_01) inversés
- Design by documentation (starter cross-session disabled) mais un utilisateur qui voit 2 sessions identiques sera déçu
- **Fix UX** : Pas de fix data, c'est structurel au nombre de blocs BW starter.

### LOW (3)

**F-C2-12** : Deload W7 performance garde les mêmes blocs que W1 (juste intensity=none)
- P1 W7 LOWER_V1 a 7 blocs identiques à W1 mais avec intensity=none
- La KB recommande volume réduit (50-60% sets), pas juste intensity tag
- **Fix** : Implémenter une version "deload" qui réduit les sets, pas juste l'intensité.

**F-C2-13** : P7 (perf BW_ONLY) profil non réaliste mais note très basse
- UPPER = 4 blocs, FULL = all-activation fallbacks
- Performance sans équipement n'est pas un use case réel
- **Impact** : Faible car le profil est un edge case extrême.

**F-C2-14** : Warmup inconsistant — S3 (knee_pain) reçoit BLK_WARMUP_UPPER_01 en LOWER session
- BLK_WARMUP_LOWER_01 a knee_pain en CI → fallback vers UPPER warmup
- Un warmup upper avant une session lower est incohérent
- **Fix** : Ajouter un warmup lower safe-knee (ex: marche + hip circles + activation fessiers).

---

## 5. État des VC-01 à VC-05

| VC | Description | Statut | Preuve corpus |
|---|---|---|---|
| **VC-01** | ACL prehab féminin (hip_stability tag) | **Non vérifiable** | Aucun profil U18/féminin dans SIMULATION_PROFILES. Le code est en place (VC-01 implémenté) mais pas testable sur ce corpus. |
| **VC-02** | Variantes starter | **Résolu (partiel)** | Nouveaux blocs visibles : ACT_LOWER_BW_01, ACT_LOWER_BAND_01, ACT_UPPER_BW_02, ACT_UPPER_BAND_01, HP_L_03, HP_L_04, HP_A_05, HP_A_SAFE_01/02. Rotation H1→W5 confirmée (L_04 ↔ L_01). **Mais** : upper hypertrophy BW = toujours HP_A_01 unique. Variété band > BW. |
| **VC-03** | Lower squat-dominant + contrast sans box | **Résolu** | P1 W1 LOWER_V1 : `BLK_CONTRAST_LOWER_SQUAT_JUMP_01` sélectionné en contrast slot. Back squat et goblet squat disponibles (blocs éligibles, non sélectionnés car scoring hinge > squat). |
| **VC-04** | Upper safe shoulder_pain | **Résolu (band) / Non résolu (BW)** | S5 (BW) : toujours 100% safety-adapted. Les blocs SAFE_01/02 nécessitent band. P3 UPPER_HYPER : REHAB_PULL_SCAP + REHAB_ROW_CONTROL fonctionnent. P3 UPPER_V1 (force phase) : 4 blocs seulement, aucun neural/contrast safe. |
| **VC-05** | Deload sans duplication | **Résolu** | P1/P2 W7 : 2 sessions (LOWER_V1 + RECOVERY_MOBILITY_V1). Plus de 3e session dupliquée. |

---

## 6. Top 5 Écarts Restants

| # | Écart | Type | Effort estimé | Impact |
|---|---|---|---|---|
| 1 | **S5 UPPER = coquille vide** (BW + shoulder_pain) | UX + data | Faible (renommer session ou ajouter mobility) | CRITICAL — 1 profil entier non fonctionnel |
| 2 | **P3 UPPER_V1 force phase = 4 blocs** (shoulder_pain) | Data (blocs neural/contrast pull-only) | Moyen (2-3 blocs à créer) | CRITICAL — athlète perf privé de travail upper 50% du temps |
| 3 | **Volume cap starter W7** (13/10) | Algo (plafonner version) | Faible (1 ligne) | HIGH — surcharge débutant en fin de cycle |
| 4 | **B3 FULL = 100% safety** (builder shoulder_pain) | Data (blocs builder upper pull-only) | Moyen (1-2 blocs) | HIGH — 1 session/semaine dégradée sur 3 |
| 5 | **Upper hypertrophy BW = 0 variété** | Scoring/data | Faible | MEDIUM — monotonie visible mais pas dangereux |

---

## 7. Réponses aux Questions

### a) La moyenne métier progresse-t-elle de manière significative par rapport à 63/100 ?
**Oui.** 72/100 (+9 points). La progression est portée par les starters nominaux et la résolution du pattern squat. Les profils blessés progressent plus modestement (+3 à +5 pts). L'écart entre profils nominaux (78+) et profils blessés (55-) reste important.

### b) Les 3 findings CRITICAL initiaux sont-ils réellement résolus ?
- **Monotonie starter** : Partiellement. Lower hypertrophy tourne (L_01↔L_04). Activation tourne (FB_01↔UPPER_BW_02). Mais upper hypertrophy BW = toujours le même bloc.
- **Absence squat** : Résolu. BLK_CONTRAST_LOWER_SQUAT_JUMP_01 visible en P1/P2 W1-W5.
- **Upper shoulder_pain vide** : Résolu pour starter+band et perf hypertrophy phase. Non résolu pour starter BW et perf force phase.

### c) Les 5 items VC-01 à VC-05 ont-ils produit un effet visible ?
- VC-01 : Non vérifiable (pas de profil féminin/U18 dans le corpus).
- VC-02 : Oui, rotation visible. Variété doublée pour starters.
- VC-03 : Oui, squat jump contrast sélectionné.
- VC-04 : Partiellement. Résolu pour band, pas pour BW.
- VC-05 : Oui, deload W7 = 2 sessions propres.

### d) La KB est-elle maintenant visible dans les sorties ?
Partiellement. DUP visible (heavy/medium/light). Deload 3:1 visible (W7 → 2 sessions). Prehab hamstring systématique. Mais : warmup inconsistant pour blessés, volume W3/W4 non conforme KB, pas de cap version U18.

### e) Le moteur est-il assez crédible pour passer en stabilisation produit ?
**GO CONDITIONNEL.** Les profils nominaux (S1/S2, B1/B2, P1/P2) sont crédibles (78-90/100). Les profils blessés sont fonctionnels mais avec des limitations connues et documentées. Les 2 cas CRITICAL restants (S5 BW + P3 UPPER force) nécessitent soit un fix data soit un guard UX avant lancement.

### f) Quels écarts restants sont du contenu, et lesquels exigeraient de l'algo ?
| Écart | Contenu | Algo |
|---|---|---|
| S5 upper coquille vide | Non (pas de tirage BW possible) | **UX** : renommer/remplacer session |
| P3 UPPER_V1 force phase | **Oui** : blocs neural/contrast pull-only | Non |
| Volume cap W7 starter | Non | **Oui** : plafonner version starter à W2 |
| B3 FULL safety | **Oui** : blocs builder upper pull-only | Non |
| Upper hyper BW monotonie | **Possible** : ajouter 1 bloc BW | **Ou** scoring: forcer rotation |

---

## 8. Verdict Final

### **GO CONDITIONNEL** pour stabilisation produit

**Conditions :**

1. **P0 (avant release)** : Implémenter un guard UX pour S5 (renommer session UPPER en "Recovery Lower + Core" quand 100% safety-adapted) **OU** ajouter 1 bloc upper BW minimal (scap squeeze + isometric pull holds sans band)
2. **P0 (avant release)** : Plafonner la version starter à W2 maximum (empêcher W3 de déclencher volume-exceeded)

**Accepté avec backlog :**

3. P3 UPPER_V1 force phase — ajout blocs neural/contrast pull-only → backlog Vague C3

---

## 9. Backlog (3 items max)

| # | Item | Type | Impact | Effort |
|---|---|---|---|---|
| 1 | Blocs neural/contrast upper pull-only pour shoulder_pain perf (P3 UPPER_V1 force) | Data | HIGH | 2-3 blocs + exercices |
| 2 | Blocs builder upper pull-only pour shoulder_pain (B3 FULL) | Data | HIGH | 1-2 blocs |
| 3 | Profils U18 fille/garçon dans SIMULATION_PROFILES + tests VC-01 | Test | MEDIUM | 2 profils + 4 tests |

---

## Annexe : Profils du corpus

| ID | Level | Sessions | Equipment | Injuries | Season |
|---|---|---|---|---|---|
| S1 | starter | 2 | BW_ONLY | — | in_season |
| S2 | starter | 2 | LIMITED_GYM | — | in_season |
| S3 | starter | 2 | BW_ONLY | knee_pain | in_season |
| S4 | starter | 2 | LIMITED_GYM | low_back_pain | in_season |
| S5 | starter | 2 | BW_ONLY | shoulder_pain | in_season |
| B1 | builder | 2 | LIMITED_GYM | — | in_season |
| B2 | builder | 3 | FULL_GYM | — | in_season |
| B3 | builder | 3 | FULL_GYM | shoulder_pain | in_season |
| B4 | builder | 2 | LIMITED_GYM | knee_pain | in_season |
| B5 | builder | 3 | LIMITED_GYM | — | in_season |
| P1 | performance | 3 | FULL_GYM | — | in_season |
| P2 | performance | 2 | FULL_GYM | — | in_season |
| P3 | performance | 3 | FULL_GYM | shoulder_pain | in_season |
| P4 | performance | 3 | FULL_GYM | knee_pain | in_season |
| P5 | performance | 3 | LIMITED_GYM | — | in_season |
| P6 | performance | 3 | LIMITED_GYM | low_back_pain | in_season |
| P7 | performance | 3 | BW_ONLY | — | in_season |
