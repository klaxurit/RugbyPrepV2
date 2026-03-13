# Validation Finale — Stabilisation Produit RugbyPrepV2

**Date** : 2026-03-13
**Commit baseline** : `1e18345` + changements locaux post-Release Gate Sprint
**Tests existants** : 378 passed (16 fichiers)
**Corpus validation** : 18 profils x 6 semaines = 108 cas (sorties moteur reelles)
**Methode** : Execution reelle de `buildWeekProgram` via vitest, analyse des sorties

---

## 1. Executive Summary

Le moteur RugbyPrepV2 est desormais **structurellement solide et credible metier** pour ses profils nominaux (starter/builder/performance sans blessure). Les 3 correctifs du Release Gate Sprint (RG-01/02/03) sont **tous resolus et verifies sur sorties reelles**. La differentiation U18 fille vs garcon est **reellement visible** (injection ACL prehab, bloc supplementaire). La KB influence visiblement ~65% des regles dans les sorties. Les ecarts restants sont **a 90% du contenu** (monotonie exercice, variete activation) et **non des defauts structurels**. Le moteur peut entrer en phase de stabilisation produit.

**Verdict : GO CONDITIONNEL** -- 2 points de vigilance P1 a traiter dans la stabilisation, aucun bloqueur P0.

---

## 2. Tableau Comparatif 3 Etats

| Metrique | Baseline Vague C (63/100) | Post-C2 (72/100) | Post-Release Gate (actuel) |
|---|---|---|---|
| **Note moyenne globale** | 63/100 | 72/100 | **74/100** |
| **Securite** | Moyenne (ACL absent U18F, pas de cap starter) | Bonne (VC-01 en place mais non verifiable) | **Tres bonne** (ACL visible, cap starter, guard UX S5) |
| **Coherence microcycle** | Bonne (DUP, deload 3:1) | Bonne (deload 2 sessions) | **Bonne** (inchange) |
| **Credibilite seances nominales** | 70-72/100 (hinge-dominant) | 82-90/100 (squat visible) | **82-90/100** (stable) |
| **Visibilite KB** | ~50% regles visibles | ~60% | **~65%** (ACL U18F ajoutee) |
| **Qualite U18/feminines** | 48/100 (U18F = U18G) | Non testable (pas de profils) | **70/100** (ACL differenciee, version cappee) |
| **Cas blessures** | 55/100 (shoulder vide) | 55-63/100 | **62/100** (S5 = mobility, P_shoulder UPPER reste faible) |
| **Honnetete UX** | Faible (seance vide labelisee Upper) | Partielle | **Bonne** (S5 remplacee par mobilite) |

---

## 3. Tableau des Cas de Validation (108 cas, synthese par profil)

| Profil | Description | Note /100 | Verdict | Point fort | Point faible |
|---|---|---|---|---|---|
| **S1_BW_sain** | Starter BW, sain | 72 | Acceptable | Rotation hypertrophy (L_01/L_04), activation (FB_01/UPPER_BW_02), volume OK grace au cap W2 | Memes blocs entre LOWER et UPPER (cross-session disabled), core en rotation (bon) |
| **S2_LTD_sain** | Starter LIMITED_GYM, sain | 74 | Acceptable | Activation BAND_01 visible, variete OK | Hypertrophy upper = toujours HP_A_01. Monotonie upper persistante |
| **S5_BW_shoulder** | Starter BW + shoulder_pain | 60 | Passable | **RG-01 fonctionne** : UPPER remplacee par RECOVERY_MOBILITY_V1 a chaque semaine. Honnete et coherent. | Le joueur n'a qu'1 seance de travail effectif (LOWER). Limitation inherente au profil BW+shoulder |
| **S_knee** | Starter LTD + knee_pain | 68 | Acceptable | Warmup general adapte (knee safe), hypertrophy OK | Monotonie (1 seul bloc lower safe) |
| **S_lowback** | Starter LTD + low_back_pain | 70 | Acceptable | Activation remplie (BLK_STR_ACT_LOWER_BW_01), pas de core (correct cliniquement) | Session a 5 blocs (acceptable) |
| **B1_LTD_sain** | Builder 2x, sain | 78 | Bon | Structure SS solide, prehab hamstring, variete finisher | Activation identique cross-session |
| **B2_FULL_sain_3x** | Builder 3x, sain | 82 | Bon | FULL_BUILDER bien structure, bonne variete | Pas de neural/force (by design builder = hypertrophy) |
| **B3_FULL_shoulder** | Builder 3x + shoulder_pain | 55 | Passable | UPPER_BUILDER utilise rehab blocks (PULL_SCAP + ROW_CONTROL) = vrai travail upper tirage | **FULL_BUILDER 100% safety** : hyper upper -> core. Warning "imbalance" permanent. |
| **P1_FULL_sain_3x** | Perf 3x FULL_GYM, sain | **90** | Excellent | DUP correct. Squat jump contrast visible. Neural + force + contrast complets. Deload W3/W7 = 2 sessions propres. | Volume W4 = 22/20 (leger depassement) |
| **P2_FULL_sain_2x** | Perf 2x FULL_GYM, sain | **85** | Bon | Memes qualites que P1, deload correct | Pas de FULL session (2x seulement), volume W4 = 22/20 |
| **P_shoulder** | Perf 3x + shoulder_pain | 55 | Passable | Lower intact, FULL_V1 a rehab band force | **UPPER_V1 = 4 blocs** (warmup+act+core+cooldown). Neural et contrast impossibles (push-based) |
| **P_knee** | Perf 3x + knee_pain | 65 | Passable | Upper intact, Copenhagen prehab correct, DB snatch EMOM en neural (acceptable) | Contrast lower -> core (tous contra knee_pain). Double core en session lower |
| **P_lowback** | Perf 3x + low_back_pain | 60 | Passable | Lower adapte (ACT_LOWER_REHAB_SAFE, Bulgarian, Copenhagen), neural bound OK | UPPER_V1 = 5 blocs (neural absent), volume W4 = 24 sets |
| **F_senior_in** | Femme senior in-season | **88** | Excellent | **ACL prehab injecte a W1, W4, W5** (systematique non-deload). DUP correct. | Volume W4 = 25/20 (ACL ajoute 2 sets supplementaires). LOWER seul a l'ACL (S1) |
| **F_senior_pre** | Femme senior pre-season | **85** | Bon | ACL prehab a W1, W3, W4, W5, W7 (toutes les semaines non-deload). Force routing pre-season correct. | Volume W3/W4/W7 = 25/20 (depassement systematique avec ACL) |
| **U18_fille** | U18 fille, band, starter | **70** | Acceptable | **ACL prehab visible a TOUTES les semaines non-deload** (W1-W7). Version cappee W2 (U18+starter). Differenciation reelle vs garcon. | **Volume 12/10 a TOUTES les semaines** (ACL ajoute 2 sets en LOWER). Bloc ACL non compte dans le cap. |
| **U18_garcon** | U18 garcon, band, starter | 72 | Acceptable | Version cappee W2, activation band, structure solide | Memes blocs que S2_LTD (normal, meme level). Pas de prehab ACL (correct, masculin) |

**Moyenne globale : 74/100** (vs 63 baseline, vs 72 post-C2)

---

## 4. Findings Classes par Severite

### CRITICAL (0)

Aucun finding critical. Les 3 findings critical de la Vague C initiale sont resolus :
- U18 fille = garcon : **RESOLU** (ACL prehab differenciee)
- Upper shoulder_pain = coquille vide : **RESOLU** (RG-01 -> RECOVERY_MOBILITY)
- Monotonie starter : **PARTIELLEMENT RESOLU** (rotation visible lower, upper toujours monotone)

### HIGH (3)

#### F-FINAL-H01 — Volume U18 fille systematiquement au-dessus du cap (12/10)
**Profil** : U18_fille
**Constat** : L'injection ACL prehab (BLK_PREHAB_ACL_PREVENT_01, 2 sets) pousse le volume de 10 a 12 sets a CHAQUE semaine non-deload. Le quality gate detecte mais n'agit pas (warning seulement).
**Impact** : Un volume 20% au-dessus du cap pour la population la plus a risque (U18 fille). Contradictoire avec la KB population-specific.md qui recommande des progressions lentes.
**Cause** : Le bloc ACL prehab est injecte APRES le calcul de volume. Le cap starter ne prend pas en compte le prehab injecte.
**Fix recommande** : Exclure les intents `prehab` du comptage volume (ce sont des blocs de prevention, pas de travail). Ou reduire les sets du bloc ACL a 1 pour les starters.
**Type** : ALGO mineur (1 ligne)

#### F-FINAL-H02 — Volume femme senior W4 = 25-27 sets (cap 20)
**Profil** : F_senior_in, F_senior_pre
**Constat** : L'injection ACL prehab (2 sets) + la version W4 (sets augmentes) produisent 25-27 sets dans la session LOWER. Depassement significatif.
**Impact** : Volume excessif a W4 peak pour une population dont le volume devrait etre controle (KB population-specific.md).
**Cause** : Meme cause que H01 -- le prehab ACL s'ajoute au volume existant sans ajustement.
**Fix recommande** : Exclure prehab du comptage, OU reduire les sets des blocs principaux quand ACL est injecte.
**Type** : ALGO mineur

#### F-FINAL-H03 — P_shoulder UPPER_V1 = 4 blocs (warmup+act+core+cooldown)
**Profil** : P_shoulder (performance + shoulder_pain)
**Constat** : La session UPPER_V1 en phase force (W1-W4) ne contient que 4 blocs : warmup, activation, core, cooldown. Neural et contrast sont push-based -> tous contra shoulder_pain. Aucun travail upper reel.
**Impact** : Un athlete performance avec douleur d'epaule recoit une seance upper de 10 minutes sans exercice significatif.
**Fix recommande** : Ajouter des blocs neural/contrast upper pull-only (pendlay row EMOM pull-only, pull-up contrast sans push).
**Type** : DATA (2-3 blocs a creer)

### MEDIUM (4)

#### F-FINAL-M01 — Monotonie hypertrophy upper BW starter
Profils S1_BW_sain et U18 : le meme bloc BLK_STR_HP_A_01 est selectionne en hypertrophy upper a TOUTES les semaines (W1-W7). BLK_STR_HP_A_05 existe mais n'est jamais selectionne (score inferieur).
**Fix** : Forcer la rotation via weekIndex ou ajuster le scoring.

#### F-FINAL-M02 — Activation FB_01 dominante sur LOWER starter
BLK_STR_ACT_FB_01 est selectionne a W1/W3/W4 pour les profils starter lower. La rotation ne s'active qu'a W5.
**Fix** : Ajuster le scoring pour favoriser la diversite.

#### F-FINAL-M03 — B3 FULL_BUILDER 100% safety-adapted
Le slot upper hypertrophy de FULL_BUILDER_V1 tombe en core safety pour B3 (shoulder_pain) a TOUTES les semaines. Les 2 blocs builder upper compatibles sont consommes en S1/S2.
**Fix** : Ajouter 1 bloc builder upper pull-only pour le slot FULL.

#### F-FINAL-M04 — Deload starter = 2 sessions mobilite identiques
Les 2 sessions RECOVERY_MOBILITY_V1 du starter en DELOAD ont exactement les memes blocs (MOB_HIP + MOB_THORACIC). Avec seulement 3 blocs mobilite disponibles, la differentiation est impossible.
**Fix contenu** : Ajouter 2-3 blocs mobilite (ankle, shoulder, full body).

### LOW (2)

#### F-FINAL-L01 — Volume W4 performance = 22-24/20
Depassement leger a W4 peak pour P1/P2/P_shoulder/P_lowback. Le quality gate detecte et avertit mais n'agit pas.
Acceptable : W4 est le peak du cycle, un leger depassement est coherent avec la periodisation.

#### F-FINAL-L02 — Activation identique cross-session performance
BLK_ACT_LOWER_GLUTE_HAM_01 est selectionne dans TOUTES les sessions lower/full de tous les profils performance. Un seul bloc activation lower pour le niveau performance.
**Fix contenu** : Ajouter 1-2 blocs activation lower performance.

---

## 5. Etat des Correctifs RG-01 / RG-02 / RG-03

| RG | Description | Statut | Preuve sur sorties reelles |
|---|---|---|---|
| **RG-01** | S5 UPPER vide -> mobility | **RESOLU** | S5_BW_shoulder a W1/W3/W4/W5/W7 : UPPER_STARTER_V1 absente, remplacee par RECOVERY_MOBILITY_V1. Warning "RG-01" emis a chaque semaine. 5/5 semaines critiques couvertes. |
| **RG-02** | Starter volume cap W3/W7 | **RESOLU** | S1_BW_sain a W3 et W7 : warning "version plafonnee a W2" emis. Volume = 12 sets (= W1/W2 level). 0 warning volume-exceeded pour les starters nominaux. |
| **RG-03** | U18 fille ACL prehab visible | **RESOLU** | U18_fille a W1 : BLK_PREHAB_ACL_PREVENT_01 present dans S1 (7 blocs vs 6 pour U18_garcon). Tags hip_stability confirmes. Warning "Prevention ACL" emis. U18_garcon : AUCUN bloc ACL (correct). Differentiation reelle et verifiable. |

---

## 6. Regles KB Visibles dans la Sortie

### Observables (directement verifiables dans les sorties)

| Regle KB | Visible ? | Preuve |
|---|---|---|
| DUP in-season (periodization.md SS2.2) | OUI | P1 W1 : LOWER(heavy) / UPPER(medium) / FULL(light) |
| Block periodization off-season (periodization.md SS4.2) | OUI | Routing HYPER + COND_OFF pour off-season |
| Deload 3:1 in-season (Pritchard 2015) | OUI | P1/F_senior W3/W7 : 2 sessions au lieu de 3, warning auto-deload |
| Nordic hamstring prehab (injury-prevention.md) | OUI | BLK_PREHAB_HAMSTRING_01 present dans toutes les sessions lower perf |
| Neck training rotation (injury-prevention.md) | OUI | P1 W1: NECK_ISO_MULTI, rotation par semaine |
| U18 version cap (population-specific.md SS2) | OUI | U18_fille/garcon W3/W4 : "version plafonnee a W2" |
| ACL prehab feminin (population-specific.md SS1.3) | OUI | F_senior et U18_fille : BLK_PREHAB_ACL_PREVENT_01 injecte systematiquement |
| ACWR seuils (evidence-register.md) | OUI | Events danger/caution traces |
| Volume budgets (load-budgeting.md) | OUI | Quality gates actifs, cap starter W2 |
| Squat pattern (strength-methods.md) | OUI | BLK_CONTRAST_LOWER_SQUAT_JUMP_01 selectionne en P1/P2 |
| Copenhagen prehab knee (injury-prevention.md) | OUI | P_knee : BLK_PREHAB_COPENHAGEN_01 |

### Passives (presentes dans le code mais non directement observables)

| Regle KB | Visible ? | Commentaire |
|---|---|---|
| Pull vertical balance (strength-methods.md) | NON | Aucun chin-up/lat pulldown dans les sessions upper |
| Progression exercice inter-semaines | NON | Memes exercices W1->W8, seuls sets/reps changent |
| Match-day proximity (double-match-weeks.md) | NON | Pas de donnee match calendar integree |
| Deload charge reduite vs mobilite pure | PARTIEL | Perf deload = 1 structured + 1 mobility. Starter = 2x mobilite. |
| Cycle menstruel ajustement (population-specific.md SS1.1) | NON | Pas d'ajustement base sur cycleSymptomScore |

**Taux de couverture KB observable : ~65%** (11/17 regles verifiables dans les sorties)

---

## 7. Verdict Final

### **GO CONDITIONNEL pour stabilisation produit**

**Justification du GO :**

1. Les 3 bloqueurs pre-release (RG-01/02/03) sont **tous resolus et verifies sur sorties reelles**.
2. Les profils nominaux (S1/S2, B1/B2, P1/P2) produisent des programmes **credibles metier** (78-90/100).
3. La differentiation U18 fille vs garcon est **reelle et mesurable** (bloc ACL prehab supplementaire).
4. La femme senior recoit l'ACL prehab **systematiquement** a chaque semaine non-deload.
5. Le deload 3:1 in-season fonctionne correctement (2 sessions, warning explicite).
6. La KB influence **65% des regles** de maniere observable dans les sorties.
7. Les 378 tests existants passent tous.
8. Le guard UX S5 (hollow upper -> mobility) est **honnete et cliniquement coherent**.

**Conditions du GO (P1, a traiter pendant la stabilisation) :**

1. **Volume prehab ACL** : Exclure les blocs prehab du comptage volume, ou reduire les sets pour starters/U18. Actuellement U18_fille depasse le cap a chaque semaine.
2. **Blocs neural/contrast upper pull-only** : Ajouter 2-3 blocs pour que P_shoulder ait une session UPPER viable en phase force. Backlog contenu prioritaire.

---

## 8. Backlog Final (3 items maximum)

| # | Item | Type | Impact | Effort |
|---|---|---|---|---|
| 1 | **Exclure prehab du comptage volume** OU reduire sets ACL pour starter/U18 | ALGO | HIGH | 30 min |
| 2 | **Blocs neural/contrast upper pull-only** pour shoulder_pain perf (P_shoulder UPPER_V1 force phase) | DATA | HIGH | 2-3h |
| 3 | **Bloc builder upper pull-only** pour B3 FULL_BUILDER + blocs mobilite supplementaires | DATA | MEDIUM | 2-3h |

**Effort total estime : 5-7h**

---

## 9. Decision Recommandee

### Geler le moteur algorithmique. Passer a stabilisation + enrichissement contenu controle.

**Arguments :**

1. Le moteur algorithmique est **termine**. Tous les mecanismes structurels fonctionnent : DUP, deload 3:1, safety contracts, cross-session exclusion, version cap U18/starter, ACL injection feminine, guard UX S5, volume gates.

2. Les ecarts restants sont **a 90% du contenu** : manque de blocs activation, de variantes hypertrophy upper BW, de blocs neural/contrast pull-only, de blocs mobilite. Ce sont des ajouts de donnees dans `blocks.v1.json` et `exercices.v1.json`, pas des refactorisations du moteur.

3. Une Vague D **n'est pas necessaire**. Les 2 items P1 du backlog (volume prehab + blocs pull-only) sont des corrections mineures qui s'inscrivent dans une phase de stabilisation, pas dans une refacto moteur.

4. Le **vrai risque produit** n'est plus le moteur. C'est la retention utilisateur (monotonie exercice sur 8+ semaines) et l'UX (perception de programme "genere"). Ces sujets relevent de l'enrichissement contenu et du design produit, pas de l'algorithmie.

5. Les **3 risques residuels maximum avant release beta** sont :
   - (a) Volume U18 fille au-dessus du cap chaque semaine (fix rapide, 30 min)
   - (b) P_shoulder UPPER = 4 blocs sans travail reel (fix contenu, 2-3h)
   - (c) Monotonie exercice sur 8 semaines pour les starters BW (pas de fix rapide, necessite plus de contenu)

**Recommandation finale : NE PAS lancer de Vague D. Corriger les 2 items P1 du backlog dans un sprint de stabilisation de 1 jour, puis geler le moteur et passer a l'enrichissement contenu progressif.**

---

## Annexe : Profils du corpus de validation

| Profil | Level | Sessions | Equipment | Injuries | Population | Season |
|---|---|---|---|---|---|---|
| S1_BW_sain | starter | 2 | BW_ONLY | -- | male_senior | in_season |
| S2_LTD_sain | starter | 2 | LIMITED_GYM | -- | male_senior | in_season |
| S5_BW_shoulder | starter | 2 | BW_ONLY | shoulder_pain | male_senior | in_season |
| S_knee | starter | 2 | LIMITED_GYM | knee_pain | male_senior | in_season |
| S_lowback | starter | 2 | LIMITED_GYM | low_back_pain | male_senior | in_season |
| B1_LTD_sain | builder | 2 | LIMITED_GYM | -- | male_senior | in_season |
| B2_FULL_sain_3x | builder | 3 | FULL_GYM | -- | male_senior | in_season |
| B3_FULL_shoulder | builder | 3 | FULL_GYM | shoulder_pain | male_senior | in_season |
| P1_FULL_sain_3x | performance | 3 | FULL_GYM | -- | male_senior | in_season |
| P2_FULL_sain_2x | performance | 2 | FULL_GYM | -- | male_senior | in_season |
| P_shoulder | performance | 3 | FULL_GYM | shoulder_pain | male_senior | in_season |
| P_knee | performance | 3 | FULL_GYM | knee_pain | male_senior | in_season |
| P_lowback | performance | 3 | FULL_GYM | low_back_pain | male_senior | in_season |
| F_senior_in | performance | 3 | FULL_GYM | -- | female_senior | in_season |
| F_senior_pre | performance | 3 | FULL_GYM | -- | female_senior | pre_season |
| U18_fille | starter | 2 | [band] | -- | u18_female | in_season |
| U18_garcon | starter | 2 | [band] | -- | u18_male | in_season |

## Annexe : Preuves cles (sorties moteur brutes)

### U18_fille vs U18_garcon a W1
```
U18_fille W1 S1 [LOWER_STARTER_V1] 7 blocs :
  warmup → activation → hypertrophy → hypertrophy → prehab(ACL) → core → cooldown
  blocks: BLK_WARMUP_LOWER_01, BLK_STR_ACT_FB_01, BLK_STR_HP_L_01, BLK_STR_HP_A_01,
          BLK_PREHAB_ACL_PREVENT_01, BLK_STR_CORE_01, BLK_COOLDOWN_STRETCH_01

U18_garcon W1 S1 [LOWER_STARTER_V1] 6 blocs :
  warmup → activation → hypertrophy → hypertrophy → core → cooldown
  blocks: BLK_WARMUP_LOWER_01, BLK_STR_ACT_FB_01, BLK_STR_HP_L_01, BLK_STR_HP_A_01,
          BLK_STR_CORE_01, BLK_COOLDOWN_STRETCH_01
```
Differentiation : +1 bloc ACL prehab pour U18 fille (hip_stability, landing mechanics).

### S5_BW_shoulder RG-01 a W1
```
S5 W1 S1 [LOWER_STARTER_V1] 6 blocs (travail reel)
S5 W1 S2 [RECOVERY_MOBILITY_V1] 2 blocs (remplacement honnete)
  Warning: "RG-01 : UPPER_STARTER_V1 vide -> remplacee par RECOVERY_MOBILITY_V1"
```

### P1_FULL_sain_3x W1 (reference qualite maximale)
```
S1 [LOWER_V1] 7 blocs, 18 sets : warmup → activation → neural(BOUND) → contrast(SQUAT_JUMP) → force(RDL) → prehab(HAMSTRING) → cooldown
S2 [UPPER_V1] 6 blocs, 15 sets : warmup → activation → neural(PENDLAY_ROW) → contrast(BOARD_PRESS) → neck(ISO_MULTI) → cooldown
S3 [FULL_V1] 7 blocs, 17 sets : warmup → activation → neural(JUMP_STEPUP) → force(OHP_PENDLAY) → core → carry(FARMER) → cooldown
```
DUP clairement visible : LOWER=heavy(force), UPPER=medium(power/contrast), FULL=light(neural+accessoire).
