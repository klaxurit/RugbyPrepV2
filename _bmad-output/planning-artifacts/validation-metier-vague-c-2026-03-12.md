# Validation Métier — Vague C : Revue Adversariale Terrain

**Date** : 2026-03-12
**Baseline commit** : `1e18345`
**Corpus** : 14 profils × 6 semaines = 84 cas de validation (sortie réelle du moteur)
**Test source** : `src/services/program/validationMetier.test.ts`

---

## 1. Verdict Exécutif

Le moteur produit désormais des programmes structurellement corrects : DUP fonctionnel, deload 3:1 opérant, cap U18, ACWR, routing saison. La structure macro (LOWER/UPPER/FULL, phases, progression W1→W4) est cohérente et identifiable par un préparateur physique. **Mais** les séances restent pauvres en contenu : monotonie exercice sévère (même activation, mêmes force blocks partout), différenciation positionnelle faible, sessions blessure upper dévastées (3 blocs utiles sur shoulder_pain), et U18 féminine sans aucune adaptation spécifique. Le moteur est un bon squelette algorithmique. Le vrai chantier restant est **90% contenu/data** (blocs, exercices, variété) et **10% algo** (fallback, female U18, deload dupliqué).

**Verdict : GO CONDITIONNEL** — Le moteur est suffisant. Passer en phase d'enrichissement contenu contrôlé avec 5 corrections ciblées.

---

## 2. Tableau des 14 Cas de Validation

| # | Profil | Semaines | Note /100 | Verdict | Principale faiblesse |
|---|--------|----------|-----------|---------|---------------------|
| 1 | starter_in_season (2x, band+db) | W1-DELOAD | 45/100 | FAIBLE | Monotonie extrême : mêmes 2 exos par bloc à chaque séance, aucun mécanisme de variété |
| 2 | builder_in_season (3x) | W1-DELOAD | 60/100 | ACCEPTABLE | Meilleure variété que starter, mais activation identique cross-session |
| 3 | perf_in_season_3x (BACK_ROW) | W1-DELOAD | 72/100 | BON | DUP correct, force blocks OK, mais hinge-dominant (pas de squat pattern) |
| 4 | perf_pre_season_speed (BACK_THREE) | W1-DELOAD | 70/100 | BON | SPEED_FIELD_PRE correct (RSA), mais COND_PRE identique entre LOWER/UPPER week |
| 5 | perf_off_season (FRONT_ROW) | W1-DELOAD | 68/100 | ACCEPTABLE | HYPER routing correct, COND_OFF présent, mais volume hypertrophie sous-exploité |
| 6 | femme_senior_in (CENTERS) | W1-DELOAD | 65/100 | ACCEPTABLE | ACL prehab injecté (bon), mais profil = homme sauf prehab genou. Pas de femme-spécifique visible |
| 7 | femme_senior_pre (HALF_BACKS) | W1-DELOAD | 67/100 | ACCEPTABLE | ACL prehab sur W5/W7 uniquement (inconsistant). Volumes/intensités = homme |
| 8 | u18_garcon_in (BACK_ROW) | W1-DELOAD | 62/100 | ACCEPTABLE | Cap W2 fonctionne. Contrast→core SYSTÉMATIQUE (manque box). Neural DB snatch lourd pour U18 discutable |
| 9 | u18_fille_in (CENTERS) | W1-DELOAD | 48/100 | FAIBLE | = u18_garcon_in copie conforme. Zéro adaptation féminine U18 (pas d'ACL prehab, pas de volume ajusté) |
| 10 | perf_shoulder_pain (FRONT_ROW) | W1-DELOAD | 55/100 | FAIBLE | UPPER session dévastée : 3 blocs (warmup+activation+core). Aucun travail upper réel malgré shoulder_pain ≠ interdiction totale |
| 11 | perf_knee_pain (SECOND_ROW) | W1-DELOAD | 64/100 | ACCEPTABLE | Copenhagen prehab OK. Contrast→core lower (attendu). Upper session intacte (correct). Warmup GENERAL au lieu de LOWER (mineur) |
| 12 | perf_low_back_pain (BACK_THREE) | W1-DELOAD | 60/100 | ACCEPTABLE | Similar à knee_pain pattern. Force blocks adaptés mais variété limitée |
| 13 | perf_front_row_in (no injuries) | W1-DELOAD | 70/100 | BON | Quelques différences vs BACK_THREE (neural block selection, neck block selection) |
| 14 | perf_back_three_in (no injuries) | W1-DELOAD | 70/100 | BON | Neural blocks speed-oriented (BOUND, JUMP_STEPUP). Neck FLEXION_ISO au lieu de MULTI |

**Moyenne pondérée : 63/100** — Squelette solide, contenu insuffisant pour crédibilité terrain.

---

## 3. Findings Classés par Sévérité

### CRITICAL (3)

#### F-C01 — U18 féminine = copie conforme U18 masculin
**Sévérité** : CRITICAL
**Fichiers** : `buildWeekProgram.ts`, `policies/safetyContracts.ts`
**Constat** : `u18_fille_in` et `u18_garcon_in` produisent des sorties **100% identiques** à W1, W3, W4, W5, W7, DELOAD. Zéro différenciation.
**Attendu** : ACL prehab obligatoire (femme U18 = population la plus à risque ACL, KB population-specific.md §1.3), volumes potentiellement réduits, pas de DB snatch lourd unilatéral.
**Impact** : Risque médico-légal si l'app prescrit des charges W2 à une fille de 16 ans sans prévention ACL.
**Cause** : Le check `isFemaleSenior` dans `buildWeekProgram.ts` ne couvre pas `u18_female`. Seul `female_senior` déclenche l'injection ACL prehab.

#### F-C02 — Upper session shoulder_pain = coquille vide
**Sévérité** : CRITICAL
**Fichier** : `buildSessionFromRecipe.ts` (scoring + fallback chain)
**Constat** : UPPER_V1 pour `shoulder_pain` ne contient que warmup + activation (scap pushup) + 1 core fallback + cooldown = **3 blocs utiles**. Aucun travail pull, aucune force upper, aucune hypertrophie.
**Attendu** : `shoulder_pain` devrait permettre du pull horizontal (rows band/cable), du pull vertical léger, de l'isométrique épaule. Interdire le push overhead et les mouvements à risque, pas TOUT l'upper.
**Impact** : Un joueur avec douleur d'épaule reçoit une séance inutile. Il la zappera et l'app perd sa crédibilité.
**Cause** : `shoulder_pain` contraindique trop de blocs upper via les exercices. Les fallback chains upper sont trop agressives — elles sautent directement à core au lieu de chercher des blocs upper safe (pull, band rehab).

#### F-C03 — Monotonie exercice starter : même séance chaque semaine
**Sévérité** : CRITICAL (pour la rétention utilisateur)
**Fichier** : `blocks.v1.json`, `selectEligibleBlocks.ts`
**Constat** : Le profil starter reçoit les mêmes 2 exercices par bloc hypertrophie à W1, W3, W5, W7, DELOAD. Activation identique entre UPPER et LOWER starter. Aucun mécanisme de rotation exercice.
**Attendu** : Minimum 2-3 variantes par bloc starter pour alterner entre semaines (ex: goblet squat vs split squat, pushup vs incline pushup).
**Impact** : Un débutant verra le même programme à l'identique pendant 8 semaines → abandon garanti.
**Cause** : **100% DATA** — Un seul bloc BW par catégorie dans blocks.v1.json pour le niveau starter. L'algo de sélection fonctionne correctement, mais n'a qu'un seul choix.

---

### HIGH (5)

#### F-H01 — Contrast→core fallback systématique U18 et knee_pain
**Sévérité** : HIGH
**Fichiers** : `blocks.v1.json`, `selectEligibleBlocks.ts`
**Constat** : Le slot `contrast` de LOWER_V1 tombe systématiquement en safety `core` pour U18 (manque `box`) et knee_pain (contraindicaté). Résultat : 2 blocs core dans la même session (anti_rot dans le slot core + anti_rot dans le slot contrast safety).
**Attendu** : Un bloc contrast alternatif sans box (ex: bodyweight split jump, banded hip extension explosive), ou un bloc plyométrique léger.
**Impact** : Session lower avec double core au lieu d'un travail puissance — incohérent pour un programme rugby.
**Cause** : **80% DATA** (manque blocs contrast BW/sans box) + **20% ALGO** (le safety fallback ne vérifie pas la duplication d'intent).

#### F-H02 — Deload sessions 2+3 identiques (mobilité dupliquée)
**Sévérité** : HIGH
**Fichier** : `buildWeekProgram.ts:200-220` (deload routing)
**Constat** : En deload 3:1, les sessions 1 et 2 sont toutes deux RECOVERY_MOBILITY_V1 avec **exactement les mêmes blocs** (MOB_HIP + MOB_THORACIC). Le joueur a 2 séances mobilité copie-conforme.
**Attendu** : Session 1 = mobilité lower (hips, ankles, hamstrings), Session 2 = mobilité upper (thoracique, épaules) OU une seule session mobilité + la session 2 supprimée.
**Impact** : Le joueur voit 2 séances identiques → perception de bug/paresse de l'app.
**Cause** : **70% DATA** (seulement 3 blocs mobilité disponibles) + **30% ALGO** (pas de cross-session exclusion sur mobilité deload).

#### F-H03 — Hinge-dominant lower : pas de squat pattern
**Sévérité** : HIGH
**Fichier** : `blocks.v1.json` (force blocks lower)
**Constat** : Le slot `force` de LOWER_V1 sélectionne systématiquement BLK_FORCE_RDL_BAR_PLATE_01 (hinge) ou BLK_FORCE_FULL_HINGE_PRESS_01 (hinge+press). Aucun bloc squat-dominant (back squat, front squat, goblet squat) n'apparaît jamais en position force lower.
**Attendu** : Le pattern squat est fondamental en préparation physique rugby. Un joueur doit squatter + hinge dans un cycle (Haff & Triplett 2016, gold-standard.md P-01 à P-06).
**Impact** : Programme déséquilibré au niveau patterns moteurs — tout le lower est hinge/posterior chain, le quadriceps est sous-entraîné.
**Cause** : **90% DATA** — Manque de blocs force lower squat-dominant avec les bons tags dans blocks.v1.json. Le scoring sélectionne correctement ce qui existe, mais il n'y a que du hinge.

#### F-H04 — ACL prehab femme senior inconsistant
**Sévérité** : HIGH
**Fichier** : `buildWeekProgram.ts` (ACL injection logic)
**Constat** : L'injection ACL prehab pour `femme_senior_pre` n'apparaît qu'à W5 et W7, pas à W1 et W3. Pour `femme_senior_in` elle apparaît de manière variable.
**Attendu** : Si le profil est féminin, l'ACL prehab devrait être injecté **chaque semaine** (sauf deload pure), pas de manière intermittente.
**Impact** : Prévention ACL incomplète — la règle KB population-specific.md §1.3 n'est pas correctement appliquée.
**Cause** : **ALGO** — Le check ACL prehab est conditionnel sur la présence de prehab_hamstring dans les blocs déjà sélectionnés (quand le hamstring prehab satisfait le check, l'ACL spécifique n'est pas injecté). Le hamstring prehab ≠ ACL prehab (pas de landing mechanics, pas de single-leg balance).

#### F-H05 — Activation identique cross-session et cross-profil
**Sévérité** : HIGH
**Fichier** : `blocks.v1.json`
**Constat** : BLK_ACT_LOWER_GLUTE_HAM_01 est sélectionné dans TOUTES les sessions lower/full de TOUS les profils (14/14). BLK_ACT_UPPER_BW_01 est sélectionné dans TOUTES les sessions upper (14/14). Zéro variation.
**Attendu** : 2-3 blocs activation par catégorie pour permettre la rotation (ex: activation lower → glute bridge, monster walk, fire hydrant en alternance).
**Impact** : Monotonie perçue dès la première semaine (même warm-up + même activation à chaque fois).
**Cause** : **100% DATA** — Un seul bloc activation lower et un seul bloc activation upper éligibles pour le niveau performance.

---

### MEDIUM (4)

#### F-M01 — DB snatch en neural pour U18 discutable
**Sévérité** : MEDIUM
**Fichier** : `blocks.v1.json` (BLK_NEURAL_DB_SNATCH_EMOM_01)
**Constat** : Le bloc neural DB snatch EMOM est sélectionné pour les profils U18 (garçon et fille). Le DB snatch unilatéral est un mouvement techniquement exigeant.
**Attendu** : Pour U18, préférer des mouvements balistiques plus simples (box jump, med ball throw, broad jump). KB population-specific.md §2 recommande des charges modérées et des mouvements maîtrisés.
**Impact** : Risque technique pour un athlète en développement. Un préparateur physique superviserait ce mouvement — l'app ne peut pas.
**Cause** : **DATA** — Pas de tags `u18_avoid` sur le bloc DB snatch, et pas de blocs neural alternatifs simples tagués `u18_prefer`.

#### F-M02 — Pas de pull vertical dans les sessions upper
**Sévérité** : MEDIUM
**Fichier** : `blocks.v1.json`, `sessionRecipes.v1.ts`
**Constat** : Les sessions UPPER_V1 contiennent : warmup + activation + neural (pendlay row) + contrast (board press + plyo push) + neck + cooldown. Le pull vertical (chin-up, lat pulldown) est absent.
**Attendu** : L'équilibre push/pull est fondamental. Chaque session upper devrait contenir au moins 1 pull horizontal ET 1 pull vertical OU 2 pulls horizontaux (Suchomel 2016).
**Impact** : Déséquilibre structural à long terme (épaules en rotation interne).
**Cause** : **ALGO + DATA** — La recette UPPER_V1 n'a pas de slot dédié pull vertical. Le neural slot prend un row (pull horizontal), le contrast prend un press (push). Pas de slot pour le pull vertical.

#### F-M03 — Volume budget starter en dépassement silencieux
**Sévérité** : MEDIUM
**Fichier** : `buildWeekProgram.ts` (quality gates)
**Constat** : Les sessions starter atteignent 13 sets sur certaines semaines (W3/W7 en autocompté) alors que le budget starter est de 10 sets (+1 tolérance = 11 max).
**Impact** : Le volume total dépasse la recommandation pour débutants.
**Cause** : Le comptage sets inclut les blocs prehab/core ajoutés automatiquement qui ne passent pas dans le budget control.

#### F-M04 — Progression W1→W4 peu visible sur les exercices
**Sévérité** : MEDIUM
**Fichier** : `buildSessionFromRecipe.ts` (version system)
**Constat** : La progression W1→W4 se traduit par des changements de sets/reps (3×8 → 3×6 → 4×5 etc.) et de RER. C'est techniquement correct mais peu lisible pour le joueur. Il ne voit pas de changement d'exercice, juste des chiffres différents.
**Attendu** : Un vrai programme de préparateur physique évolue aussi dans la complexité des exercices (ex: goblet squat W1 → front squat W3 → back squat W5).
**Impact** : Perception de programme statique — "pourquoi je paie pour une app qui me donne les mêmes exercices ?"
**Cause** : **STRUCTURAL** — Le système de versions ne modifie que les paramètres (sets/reps/rest), pas la sélection des exercices. Ceci nécessiterait un concept d'exercice progressif (exercise variants par week).

---

### LOW (3)

#### F-L01 — Warmup GENERAL vs LOWER pour knee_pain
**Sévérité** : LOW
**Fichier** : `selectEligibleBlocks.ts`
**Constat** : Le profil knee_pain reçoit BLK_WARMUP_GENERAL_01 (jog + arm circles + inchworm) au lieu de BLK_WARMUP_LOWER_01 (jog + lunge walk + lateral shuffle) pour les sessions LOWER.
**Cause** : Le warmup lower contient `dynamic_lunge_walk` qui est potentiellement contraindicé pour knee_pain → fallback vers warmup general.
**Impact** : Mineur — le warmup general est acceptable.

#### F-L02 — Carry blocks sous-exploités
**Sévérité** : LOW
**Constat** : Seuls 2 carry blocks alternent (farmer walk, overhead carry). Les carries sont un des meilleurs exercices rugby (conditioning + grip + trunk stability).
**Cause** : **DATA** — Peu de blocs carry dans blocks.v1.json.

#### F-L03 — Neck blocks rotation correcte mais limitée à 2-3 variantes
**Sévérité** : LOW
**Constat** : La rotation neck (ISO_MULTI, ISO_ROT, FLEXION_ISO) fonctionne correctement par semaine. Bonne implémentation.
**Impact** : Positif — c'est un des mécanismes qui fonctionne bien.

---

## 4. Top 10 Séances/Programmes les Moins Crédibles

| # | Profil | Semaine | Session | Pourquoi |
|---|--------|---------|---------|----------|
| 1 | **u18_fille_in** | W1 | LOWER | DB snatch EMOM + board press contrast pour une fille U18 = aucun préparateur physique ne prescrirait ça |
| 2 | **perf_shoulder_pain** | W1 | UPPER | 3 blocs (warmup+activation+core) = séance fantôme de 10min |
| 3 | **perf_shoulder_pain** | W4 | UPPER | Idem W1 — la session W4 avec RER=1 est censée être intense, mais il n'y a rien dedans |
| 4 | **starter_in_season** | W5 | LOWER | Exactement les mêmes exercices que W1 : band pull apart, glute bridge iso, air squat, pushup |
| 5 | **u18_garcon_in** | W3 | deload | Sessions 1 et 2 mobilité 100% identiques (copier-coller) |
| 6 | **u18_fille_in** | toutes | toutes | = u18_garcon_in au caractère près. Pas crédible pour un public féminin U18 |
| 7 | **perf_knee_pain** | W1 | LOWER | Double core (CORE_FULL_ANTI_ROT en core slot + contrast safety fallback) — 2 fois le même intent |
| 8 | **perf_front_row_in** | W1 | LOWER | Force = RDL seul. Un pilier devrait squatter lourds (Argus 2012) |
| 9 | **builder_in_season** | W1 | FULL | Activation = mêmes glute bridge + calf raise que toutes les autres sessions |
| 10 | **femme_senior_pre** | W1 | toutes | Aucune trace d'ACL prehab à W1 pour une femme pre-season — exactement le moment où c'est le plus important |

---

## 5. Ce qui Ressemble Enfin à un Vrai Coach

1. **DUP in-season** : Heavy(LOWER) / Medium(UPPER) / Light(FULL) — structurellement correct et aligné avec la littérature (Zourdos 2016). Un préparateur physique validerait cette logique.

2. **Deload 3:1 in-season** : W3/W7 → 1 session structurée W1 + 2 mobilités. Le principe est bon (Pritchard 2015). Le warning explicite est appréciable.

3. **U18 cap W2** : Plafonner les versions à W2 pour les mineurs est une décision défendable (plaques de croissance). L'event `hard:u18-version-cap` est traçable.

4. **Routing saison** : Off-season → HYPER + COND_OFF, Pre-season → FORCE + SPEED/COND_PRE, In-season → DUP. Les 3 parcours font sens.

5. **Nordic hamstring prehab** : Présent automatiquement sur lower sessions. C'est LE gold standard de prévention ischio-jambiers en rugby (Al Attar 2017).

6. **Neck training** : Rotation par semaine (multi/rot/flexion). Pertinent pour le rugby (Hrysomallis 2016). Différents blocs par semaine = bonne variété.

7. **Board press + plyo push contrast** : La méthode de contraste est correcte et utilisée en S&C rugby professionnel.

8. **Cross-session exclusion** : Les blocs principaux ne se répètent pas entre sessions dans la même semaine. Bon mécanisme.

9. **Progression paramétrique** : W1→W4 les sets/reps/rest/RER évoluent cohéremment (plus de sets, moins de reps, plus de rest). La logique de périodisation est présente.

10. **Copenhagen plank pour knee_pain** : Prehab groin + adducteurs pour douleur genou — pertinent scientifiquement (Ishøi 2019).

---

## 6. Ce qui Reste Artificiel / Moteur-Like

1. **Même activation dans chaque session** : Un vrai coach varier entre couch stretch, monster walk, glute bridge, banded side walk, fire hydrant. L'app donne toujours bridge_iso + calf_raise.

2. **Pas de squat dans les programmes** : Aucun back squat, front squat, goblet squat dans les 84 cas testés. Impensable pour un préparateur physique rugby.

3. **Force blocks toujours identiques cross-profil** : BLK_FORCE_RDL_BAR_PLATE_01 apparaît dans 12/14 profils au slot force lower. Un moteur qui choisit toujours le même bloc ne personnalise pas.

4. **Séances blessure ultra-minimalistes** : Un vrai coach adapterait (ex: shoulder pain → rows isométriques, band work, scapular stability). L'app supprime tout et laisse un squelette.

5. **2 sessions mobilité identiques en deload** : Aucun préparateur ne prescrirait 2x la même séance de mobilité dos-à-dos.

6. **Pas de variation exercice inter-semaines** : Les mêmes exercices reviennent à W1, W3, W5, W7. Un vrai programme alterne (ex: pendlay row → seal row → cable row).

7. **U18 fille = garçon** : Un S&C qui traite ses U18 filles comme ses U18 garçons ne serait pas employé longtemps.

8. **Conditioning blocks statiques** : RSA sprint 40m et HIIT 30/15 sont toujours les mêmes. Un coach varier les distances, les intervalles, les méthodes (shuttle, prowler, sled).

---

## 7. KB → Comportement Visible

### Règles KB visibles dans les sorties

| Règle KB | Visible ? | Commentaire |
|----------|-----------|-------------|
| DUP in-season (periodization.md §2.2) | ✅ OUI | Heavy/Medium/Light par session |
| Block periodization off-season (periodization.md §4.2) | ✅ OUI | HYPER en H-weeks |
| Deload 3:1 (load-budgeting.md) | ✅ OUI | W3/W7 auto-deload |
| Nordic hamstring prehab (injury-prevention.md) | ✅ OUI | BLK_PREHAB_HAMSTRING sur lower |
| Neck training rugby (injury-prevention.md) | ✅ OUI | 3 variantes rotation |
| U18 version cap (population-specific.md §2) | ✅ OUI | W2 max, event tracé |
| ACWR danger/caution (evidence-register.md) | ✅ OUI | Seuils respectés, events tracés |
| Position prefer tags (positionPreferences) | ⚠️ PARTIEL | Visible sur neural blocks, invisible sur force |
| ACL prehab femme (population-specific.md §1.3) | ⚠️ PARTIEL | Présent mais intermittent |
| Volume budgets (load-budgeting.md) | ⚠️ PARTIEL | Fonctionne mais pas 100% respecté pour starter |

### Règles KB invisibles ou décoratives

| Règle KB | Visible ? | Commentaire |
|----------|-----------|-------------|
| Squat pattern obligatoire (strength-methods.md) | ❌ NON | Aucun squat dans 84 cas |
| Pull vertical balance (strength-methods.md) | ❌ NON | Aucun chin-up/lat pulldown |
| ACL landing mechanics U18 fille (population-specific.md §1.3) | ❌ NON | Pas d'adaptation U18 féminine |
| Progression exercice (strength-methods.md §3) | ❌ NON | Mêmes exercices W1→W8 |
| Match-day proximity (double-match-weeks.md) | ❌ NON | Pas de donnée match calendar intégrée au moteur |
| RTP critères objectifs (return-to-play-criteria.md) | ❌ NON | Non intégré au moteur (prévu P2) |
| Deload charge réduite vs mobilité pure | ❌ NON | Seul modèle = mobilité (pas de charge réduite -40%) |

---

## 8. Verdict Final

### GO CONDITIONNEL pour passer en phase de stabilisation produit

**Conditions du GO :**

Le moteur algorithmique est structurellement solide. Les mécanismes de base (DUP, deload, safety, scoring) fonctionnent. Le vrai problème est le **contenu** :
- Pas assez de blocs (88 total, dont beaucoup spécialisés) pour créer de la variété
- Pas assez d'exercices alternatifs par pattern moteur
- Pas assez de blocs "safe" pour les profils blessés

**Ne PAS** refactoriser le moteur. **Enrichir le contenu** de manière contrôlée.

Les 5 items ci-dessous sont les conditions du GO. Sans eux, le produit n'est pas utilisable par un vrai joueur de rugby.

---

## 9. Backlog Vague C Corrective (5 items max)

| # | Item | Type | Priorité | Effort | Impact |
|---|------|------|----------|--------|--------|
| **VC-01** | ACL prehab U18 féminine + check systématique chaque semaine | ALGO | P0 CRITIQUE | 2h | Sécurité + crédibilité U18 fille |
| **VC-02** | Blocs starter ×2-3 variantes (activation, hypertrophie BW) + rotation | DATA + ALGO mineur | P0 | 4-6h | Rétention débutants (pool le plus large) |
| **VC-03** | Blocs force squat-dominant (back squat, front squat, goblet) + lower contrast sans box | DATA | P1 | 3-4h | Crédibilité programme — pattern moteur manquant |
| **VC-04** | Blocs upper safe pour shoulder_pain (rows band, isométrique, scapular) | DATA | P1 | 2-3h | Session upper shoulder_pain viable |
| **VC-05** | Deload 2e session différenciée (mob upper vs mob lower) OU suppression session 3 en deload | DATA + ALGO mineur | P1 | 1-2h | Perception qualité deload |

**Effort total estimé : 12-17h**

### Détail VC-01 (le plus critique)

```
Fichier: buildWeekProgram.ts
Modification: Étendre le check ACL prehab à TOUTE population féminine (female_senior + u18_female)
+ Rendre l'injection SYSTÉMATIQUE (chaque semaine non-deload), pas conditionnelle sur l'absence de hamstring prehab
```

### Détail VC-02

```
Fichiers: blocks.v1.json, exercices.v1.json
Ajout:
- 2 blocs activation lower BW alternatifs (monster walk band, fire hydrant, clamshell)
- 2 blocs activation upper BW alternatifs (band pull apart, wall slide, scap pushup variante)
- 2 blocs hypertrophie lower BW alternatifs (split squat, lunge variations)
- 2 blocs hypertrophie upper BW alternatifs (incline pushup, pike pushup)
+ Mécanisme de rotation par weekIndex dans selectEligibleBlocks (ou randomisation déterministe par profil hash)
```

### Détail VC-03

```
Fichiers: blocks.v1.json, exercices.v1.json
Ajout:
- BLK_FORCE_LOWER_SQUAT_01 (back squat / front squat, tags: lower,squat,force,quad)
- BLK_FORCE_LOWER_GOBLET_01 (goblet squat + split squat, tags: lower,squat,force,unilateral)
- BLK_CONTRAST_LOWER_JUMP_BW_01 (bodyweight jump squat + split jump, tags: lower,contrast,power,jump — pas besoin de box)
```

---

## Annexe : Questions Explicites

### a) Les programmes ressemblent-ils à de vrais programmes de préparateur physique rugby ?

**Partiellement.** La structure macro (DUP, split LOWER/UPPER/FULL, deload cyclique, prehab nordics) est crédible. Un S&C reconnaîtrait la logique. Mais le contenu (mêmes exercices partout, pas de squat, monotonie) trahit la nature automatisée. Un préparateur physique ne donnerait jamais le même programme à un FRONT_ROW et à un BACK_THREE pendant 8 semaines.

### b) Quelles séances restent incrédibles malgré P0/P1 ?

Upper shoulder_pain (coquille vide), toutes les séances U18 fille (= garçon), deload sessions 2+3 (copie conforme), starter toutes semaines (monotonie).

### c) Quels écarts sont structurels vs data/content ?

**Structurels (10%)** : ACL check U18 fille, deload duplication, ACL prehab intermittent.
**Data/Content (90%)** : Manque de blocs (activation, squat, contrast BW, upper safe, mobilité variée, starter variantes).

### d) La KB est-elle utilisée de manière visible ?

Oui pour ~60% des règles (DUP, deload, nordics, neck, U18 cap, ACWR). Non pour ~40% (squat pattern, pull vertical, ACL U18 fille, progression exercice, match proximity).

### e) Peut-on stopper la refacto moteur et passer à l'enrichissement ?

**Oui**, à condition de corriger les 2 bugs algo (VC-01 ACL U18, VC-05 deload dupliqué). Le reste est du contenu pur.

### f) Quels 3-5 écarts méritent encore une correction ?

VC-01 à VC-05 ci-dessus. Par ordre strict : VC-01 (sécurité) > VC-02 (rétention) > VC-03 (crédibilité) > VC-04 (blessure) > VC-05 (polish).
