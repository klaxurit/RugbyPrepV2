# Plan d'Experiences et Roadmap d'Implementation — Moteur RugbyPrepV2

**Date:** 2026-03-12
**Sources:** scientific-audit (SA), statistical-calibration (ST), adversarial-review (C/M/m), edge-case-review (EC)
**Methode:** Hypotheses falsifiables croisees avec les findings des 4 audits, priorisees par impact x incertitude
**Perimetre:** Corrections P0/P1 du moteur de generation de programme — pas de modification de code

---

## 1. Executive Summary

Le moteur genere des programmes structurellement valides mais presente **6 ecarts critiques** avec la science et le terrain : (1) deload = mobilite pure au lieu de volume reduit (SA-R04, C-1), (2) seuil ACWR danger a 1.3 au lieu de 1.5 (SA-R08, ST-4.1), (3) warmup absent dans ~60% des sessions (SA-R14/R19, ST-2.4, M-1), (4) feature flags U18 desactives en production (SA-R36, EC-36-40), (5) aucune prevention ACL feminine (SA-R39), (6) aucun budget volume (SA-R13, ST-2.2). Nous formulons **12 hypotheses falsifiables** organisees en 3 vagues : Vague A (P0 securite/credibilite, ~8j), Vague B (P1 calibration/differenciation, ~10j), Vague C (hardening/monitoring). Chaque hypothese a une metrique de succes quantifiable, un seuil d'acceptation, et un ou plusieurs tests de regression. Les criteres GO/NO-GO entre vagues sont bases sur le taux de passage des tests et l'absence de regressions.

---

## 2. Tableau d'Hypotheses

### H1 — Le deload structure maintient le stimulus neural sans surcharge

| Champ | Detail |
|---|---|
| **ID** | H1 |
| **Cause racine** | SA-R04, C-1, ST-4.2 : le deload genere `RECOVERY_MOBILITY_V1` (mobilite pure), supprimant tout stimulus force/neural. KB periodization.md §5.2 : "meme structure, volume -40-50%". Issurin 2008 : effet residuel puissance 18-24j. |
| **Variable manipulee** | Remplacer `RULE_CONSTANTS_V1.deload.recipeId` par une logique qui genere les memes recettes standard avec version W1 et nombre de blocs reduit (max 2 main blocks/session). Pour 2x/sem : 1 session structure W1 + 1 mobilite. Pour 3x/sem : 1 session structure W1 + 1 mobilite + 1 skip ou mobilite. |
| **Metrique de succes** | (a) Toute semaine DELOAD contient au moins 1 session avec >=1 bloc `force` ou `hypertrophy` (version W1). (b) Volume total DELOAD < 60% du volume W1 normal. (c) Aucune session DELOAD n'utilise une version W3 ou W4. |
| **Seuil acceptation** | 100% des profils (60 combinaisons matrice ST-3.1) satisfont (a), (b), (c). |
| **Seuil rejet** | Tout profil qui produit un DELOAD avec 0 bloc main work, ou un DELOAD avec version > W1. |
| **Tests de regression** | `DELOAD W1 au moins 1 bloc force/hypertrophy` ; `DELOAD 2x = 1 struct + 1 mob` ; `DELOAD 3x = 1 struct + 1-2 mob` ; `DELOAD volume < 60% de W1 normal` |
| **Fichiers concernes** | `ruleConstants.v1.ts`, `buildWeekProgram.ts:138-139` |
| **Decision** | Implement si tests passent. Rollback vers mobilite pure si >5% des profils produisent des sessions incompletes en DELOAD. |

### H2 — Le recalibrage ACWR (danger=1.5, caution=1.3) preserve la securite sans perte de seance inutile

| Champ | Detail |
|---|---|
| **ID** | H2 |
| **Cause racine** | SA-R08, ST-4.1 : le seuil danger actuel (1.3) est la limite haute du sweet spot (evidence-register.md). Un joueur a 1.35 perd 1 seance entiere. Le vrai danger est a 1.5+ (Gabbett 2016, Hulin 2016, injury-prevention.md §3.2). |
| **Variable manipulee** | (a) Nouveau `cautionThreshold: 1.3` — zone vigilance : warning UI, pas de modification programme. (b) `dangerThreshold: 1.3 -> 1.5` — remplacement derniere seance par mobilite. (c) `criticalThreshold: 2.0` inchange. |
| **Metrique de succes** | (a) Profil ACWR=1.35 conserve toutes ses seances (pas de remplacement). (b) Profil ACWR=1.55 perd la derniere seance (remplacement mobilite). (c) Profil ACWR=2.1 reduit a 1 seance. |
| **Seuil acceptation** | 100% de conformite sur les 3 assertions pour tous les profils matrice. |
| **Seuil rejet** | Tout ACWR dans [1.3-1.5[ qui declenche un remplacement, ou tout ACWR >=1.5 qui ne declenche PAS de remplacement. |
| **Tests de regression** | `ACWR 1.35 pas de remplacement` ; `ACWR 1.55 remplacement derniere` ; `ACWR 2.1 => 1 seance` ; regression EC-01 (`rehab + critical => rehab survit`) |
| **Fichiers concernes** | `ruleConstants.v1.ts:5-7`, `safetyContracts.ts:151-178` |
| **Decision** | Implement direct — preuve B, consensus eleve, risque faible. |

### H3 — Le warmup systematique couvre >=95% des sessions non-mobilite

| Champ | Detail |
|---|---|
| **ID** | H3 |
| **Cause racine** | SA-R14/R19, ST-2.4, M-1 : warmup conditionne par `hasHighNeuromuscularDemand` exclut ~60% des sessions (starter, hypertrophie, light). KB injury-prevention.md §9 : echauffement -20-50% blessures (Emery 2015, preuve A). |
| **Variable manipulee** | Supprimer la condition `hasHighNeuromuscularDemand` et la condition sur `sessionIntensity` dans `shouldIncludeOptionalPrepIntent`. Garder uniquement l'exclusion pour `RECOVERY_MOBILITY_V1` et `REHAB_*_P1_V1`. |
| **Metrique de succes** | Taux de sessions avec warmup parmi les sessions non-RECOVERY_MOBILITY et non-REHAB_P1 >= 95%. |
| **Seuil acceptation** | 95%+ sur 60 combinaisons matrice (seul motif d'absence : 0 bloc warmup eligible apres filtrage equipement). |
| **Seuil rejet** | Tout profil starter ou builder sans warmup en session non-mobilite. |
| **Tests de regression** | `Toute session non-mob/non-rehab-P1 inclut warmup` ; `Session starter inclut warmup` ; `Session hypertrophie inclut warmup` ; `RECOVERY_MOBILITY_V1 PAS de warmup` |
| **Fichiers concernes** | `buildSessionFromRecipe.ts:202-223` |
| **Decision** | Implement direct — preuve A, effort 0.5j, aucune incertitude. |

### H4 — Les feature flags U18 actifs par defaut protegent les profils mineurs

| Champ | Detail |
|---|---|
| **ID** | H4 |
| **Cause racine** | SA-R36, EC-36-40, ST-3.2 : `u18HardCapsV1` et `populationProfileV1` sont `false` par defaut en prod. Un U18 recoit le meme programme qu'un adulte. RFU age-grade, World Rugby Activate exigent des limites. |
| **Variable manipulee** | Activer automatiquement `populationProfileV1: true` et `u18HardCapsV1: true` quand le profil est detecte U18 (via `resolvePopulationContext`). |
| **Metrique de succes** | (a) Tout profil U18 detecte => hard caps evalues. (b) U18 sans consentement parental => fallback mobilite. (c) U18 avec depassement caps => programme reduit. |
| **Seuil acceptation** | 100% des profils U18 dans la matrice (combinaisons 36-50) ont les caps actifs. |
| **Seuil rejet** | Tout profil U18 qui recoit un programme adulte non-modifie. |
| **Tests de regression** | `U18 detecte => hard caps actifs` ; `U18 + parentalConsent=false => mobilite` ; `U18 depassement match minutes => mobilite` ; regression EC-46 |
| **Fichiers concernes** | `featureFlags.ts:14-23`, potentiellement `buildWeekProgram.ts` ou `resolveProgramFeatureFlags` |
| **Decision** | Implement direct — risque legal si non fait. Effort 0.5j. |

### H5 — L'injection prehab ACL pour les feminines ajoute >=1 bloc knee/hip par semaine

| Champ | Detail |
|---|---|
| **ID** | H5 |
| **Cause racine** | SA-R39, ST-3.2 combo 47-50 : aucune regle specifique feminine dans le moteur. KB population-specific.md §1 : ACL risk 2-3x (Hewett 2005). domain-feminine-u18-research §4 : prevention moteur-ready avec tags ACL-prep. |
| **Variable manipulee** | Si `populationSegment` contient "female", injecter 1 slot prehab supplementaire avec tags cibles `knee_health`, `hip_stability`, `landing`, `deceleration` dans au moins 1 session/semaine. Implementation possible via `safetyContracts.ts` ou injection dans `buildWeekProgram.ts`. |
| **Metrique de succes** | Toute semaine d'un profil feminin contient au moins 1 bloc prehab avec tag `knee_health` ou `hip_stability`. |
| **Seuil acceptation** | 100% des profils feminins matrice (combos 47-50). |
| **Seuil rejet** | Toute semaine feminine avec 0 bloc prehab oriente genou/hanche. |
| **Tests de regression** | `female_senior => >=1 prehab knee/hip par semaine` ; `female U18 => prehab + caps U18` |
| **Fichiers concernes** | `buildWeekProgram.ts` ou `safetyContracts.ts`, `ruleConstants.v1.ts` (nouveau champ `femalePrevention`) |
| **Decision** | Implement si blocs prehab existants couvrent les tags. Verifier couverture avant implementation. |

### H6 — Le budget volume empeche le depassement des caps KB par session

| Champ | Detail |
|---|---|
| **ID** | H6 |
| **Cause racine** | SA-R13, ST-2.2, ST-4.5 : aucun controle volume dans le pipeline. Starter W4 = ~13 sets vs cap KB 10. LOWER_V1 W4 = ~21 sets vs cap KB 20. |
| **Variable manipulee** | Ajouter un compteur de sets par session dans `qualityGates.ts` ou `validateSession.ts`. Caps : starter=10, builder=12, performance=20. Warning si depassement. Action possible : skip du dernier slot optionnel ou fallback version W1 sur le bloc en exces. |
| **Metrique de succes** | (a) 0% des sessions starter depassent 10 sets. (b) 0% des sessions performance depassent 20 sets (tolerance +1 set = 21 acceptable). |
| **Seuil acceptation** | 95%+ des sessions respectent les caps (tolerance 1 set). |
| **Seuil rejet** | >5% des sessions depassent le cap de >2 sets. |
| **Tests de regression** | `Starter W4 <= 10 sets` ; `Performance W4 <= 20 sets (tolerance 21)` ; `Builder H3 <= 12 sets` |
| **Fichiers concernes** | `qualityGates.ts` ou `validateSession.ts`, `ruleConstants.v1.ts` (nouveau champ `volume`) |
| **Decision** | Implement avec warning d'abord (pas de blocage). Passer en hard constraint apres validation terrain. |

### H7 — L'augmentation du poids intensite (+2/-2) differencie reellement les sessions DUP

| Champ | Detail |
|---|---|
| **ID** | H7 |
| **Cause racine** | SA-R24, ST-2.3, ST-4.4, M-2 : l'intensite (+1/-1) represente 5-10% du score total. Deux sessions heavy et light selectionnent quasi-systematiquement les memes blocs. La KB attend une vraie ondulation DUP (periodization.md §2.2). |
| **Variable manipulee** | Passer le poids intensite de +1/-1 a +2/-2 dans `scoreBlock()`. |
| **Metrique de succes** | Sur les profils performance 3x in-season (combos 13-16, 51-52), la session heavy et la session light selectionnent des blocs differents pour au moins 1 intent commun dans >=60% des cas. |
| **Seuil acceptation** | >=60% de differenciation mesurable (au moins 1 bloc different par paire heavy/light). |
| **Seuil rejet** | <40% de differenciation — dans ce cas, la solution structurelle (blocs variants par intensite) est necessaire. |
| **Tests de regression** | `Session heavy vs light meme semaine => blocs differents pour meme intent` ; snapshot scoring avant/apres sur 60 combinaisons |
| **Fichiers concernes** | `buildSessionFromRecipe.ts:128-136` |
| **Decision** | Implement et mesurer. Si <40%, passer a l'Option C (blocs variants) en P2. |

### H8 — L'augmentation du poids position (+5) differencie pilier vs arriere

| Champ | Detail |
|---|---|
| **ID** | H8 |
| **Cause racine** | SA-R25, ST-4.4, M-4 : le bonus position +3 est noye par les preferences de phase (+3 x 7 tags). PROP et WING sur la meme recette selectionnent quasi-identiquement. Nash 2017, Baker 1999 : differentiation majeure par poste. |
| **Variable manipulee** | Passer le poids position de +3 a +5 dans `scoreBlock()`. |
| **Metrique de succes** | PROP et WING sur `UPPER_V1` W1 in-season selectionnent des blocs differents pour au moins 1 slot principal (force/contrast/hypertrophy). |
| **Seuil acceptation** | Differenciation mesurable pour >=3 paires de postes sur 6 (PROP vs WING, PROP vs SCRUM_HALF, LOCK vs FULLBACK, etc.). |
| **Seuil rejet** | <2 paires differenciees — dans ce cas, des recettes position-variantes sont necessaires (P2+). |
| **Tests de regression** | `PROP vs WING UPPER_V1 => blocs differents` ; `SCRUM_HALF vs FULLBACK => blocs differents` |
| **Fichiers concernes** | `buildSessionFromRecipe.ts:120-123` |
| **Decision** | Implement et mesurer. Risque de regression faible (les blocs mieux scores pour un poste sont toujours pertinents). |

### H9 — Le ratio deload 3:1 in-season ameliore la gestion de fatigue sans perte de stimulus

| Champ | Detail |
|---|---|
| **ID** | H9 |
| **Cause racine** | SA-R03 : ratio 4:1 valide hors saison, mais KB periodization.md §7.3C recommande 3:1 in-season (charge match + S&C cumulative). Pritchard 2015. |
| **Variable manipulee** | Si `seasonMode === 'in_season'`, deload a H3/W3/W7 au lieu de H4/W4/W8. Off-season reste 4:1. |
| **Metrique de succes** | (a) In-season : DELOAD a semaine 3 de chaque bloc. (b) Off-season : DELOAD reste a semaine 4. (c) Pas de regression sur la progression W1-W3 (volume monotone croissant). |
| **Seuil acceptation** | 100% des profils in-season deload a W3 ; 100% des profils off-season deload a W4. |
| **Seuil rejet** | Tout profil in-season qui ne deload PAS a W3, ou tout profil off-season qui deload a W3. |
| **Tests de regression** | `In-season => deload W3` ; `Off-season => deload W4` ; `W1 < W2 < W3 volume monotone` |
| **Fichiers concernes** | `programPhases.v1.ts`, `buildWeekProgram.ts` |
| **Decision** | Implement apres H1 (deload structure doit etre corrige avant de changer le ratio). Depend de H1. |

### H10 — Le seuil qualite minimum evite les sessions degradees

| Champ | Detail |
|---|---|
| **ID** | H10 |
| **Cause racine** | SA-R41, M-5, EC-07 : la fallback chain peut produire une session avec 2 activations + 2 core + 0 travail principal. Le code `continue` seul est trop permissif. |
| **Variable manipulee** | Si une session a <1 bloc main work (force/contrast/hypertrophy) apres tous les fallbacks, ET n'est pas exemptee (COND, REHAB_P1, RECOVERY), la remplacer par `RECOVERY_MOBILITY_V1`. |
| **Metrique de succes** | Aucune session non-exemptee ne contient 0 bloc main work dans les 60 combinaisons. |
| **Seuil acceptation** | 0 session degradee livree (toutes remplacees par mobilite). |
| **Seuil rejet** | Toute session avec 0 main work livree au joueur. |
| **Tests de regression** | `Session 0 bloc main work => remplacee par mobilite` ; regression EC-07 (starter + BW + low_back_pain) |
| **Fichiers concernes** | `qualityGates.ts` (deja partiellement implemente — etendre la gate) |
| **Decision** | Implement direct. Le gate existe deja dans `qualityGates.ts` mais necessite le flag `qualityGatesV2=true`. |

### H11 — Le cap intensite U18 (version max W2) protege les mineurs

| Champ | Detail |
|---|---|
| **ID** | H11 |
| **Cause racine** | SA-R37 : pas de cap %1RM pour U18. KB population-specific.md : U18 max 75% 1RM, U16 max 65%. W3-W4 = versions peak inadaptees. |
| **Variable manipulee** | U18 utilise versions W1-W2 max (jamais W3-W4 peak). Implementation dans `buildSessionFromRecipe.ts` ou `buildWeekProgram.ts` : override `week` pour U18 si semaine > W2. |
| **Metrique de succes** | Aucun profil U18 ne recoit une version W3 ou W4 dans aucune session. |
| **Seuil acceptation** | 100% des blocs U18 en version W1 ou W2. |
| **Seuil rejet** | Tout bloc U18 en version W3 ou W4. |
| **Tests de regression** | `U18 jamais version W4` ; `U18 W3 => override W2` |
| **Fichiers concernes** | `buildSessionFromRecipe.ts` ou `buildWeekProgram.ts`, `ruleConstants.v1.ts` (nouveau champ `u18.maxVersionIndex`) |
| **Decision** | Implement apres H4 (flags U18 doivent etre actifs). |

### H12 — L'action ACWR caution (1.3-1.5) reduit le volume sans supprimer de seance

| Champ | Detail |
|---|---|
| **ID** | H12 |
| **Cause racine** | SA-R10, ST-4.1 : entre 1.3 et 1.5, la KB recommande une reduction de 20-30% (load-budgeting.md), pas un remplacement complet. |
| **Variable manipulee** | Pour ACWR dans [1.3, 1.5[ : appliquer la version W1 sur la derniere seance (volume minimal) au lieu de la remplacer par mobilite. Afficher un warning UI. |
| **Metrique de succes** | (a) ACWR=1.4 ne remplace PAS de seance. (b) ACWR=1.4 utilise version W1 sur la derniere seance. (c) Volume derniere seance < volume normal meme semaine. |
| **Seuil acceptation** | 100% des profils ACWR [1.3, 1.5[ conservent toutes leurs seances avec version W1 sur la derniere. |
| **Seuil rejet** | Tout remplacement dans la zone caution. |
| **Tests de regression** | `ACWR 1.4 => pas de remplacement` ; `ACWR 1.4 => version W1 derniere seance` ; regression H2 (ACWR 1.55 => remplacement) |
| **Fichiers concernes** | `safetyContracts.ts`, `ruleConstants.v1.ts` (nouveau `cautionThreshold`) |
| **Decision** | Implement apres H2 (les seuils doivent etre recalibres d'abord). |

---

## 3. Priorisation (Impact x Effort x Incertitude)

### Fast Confirm (faible effort, fort impact, faible incertitude)

| Hypothese | Impact | Effort | Incertitude | Justification |
|---|---|---|---|---|
| **H2** ACWR seuils | Securite | 1j | Faible (preuve B, consensus) | Recalibrage de 2 constantes + ajout 1 constante. Tests directs. |
| **H3** Warmup obligatoire | Securite + credibilite | 0.5j | Nulle (preuve A) | Suppression d'une condition dans 1 fonction. |
| **H4** Flags U18 | Securite legale | 0.5j | Nulle (regle pure) | Changement de 2 defaults + condition auto-detection. |

### High-Risk / High-Value (effort modere, impact critique, incertitude moderee)

| Hypothese | Impact | Effort | Incertitude | Justification |
|---|---|---|---|---|
| **H1** Deload structure | Credibilite + retention neural | 2-3j | Moderee (logique nouvelle de routing deload) | Refonte de la logique deload. Risque : sessions incompletes pour profils contraints. |
| **H5** Prevention ACL feminine | Securite population | 1j | Moderee (depends des blocs prehab existants) | Injection conditionnelle. Risque : pas assez de blocs prehab knee/hip. |
| **H6** Budget volume | Securite overtraining | 1-2j | Moderee (comptage sets depends des versions) | Nouveau check dans le pipeline. Risque : comptage imprecis sur blocs EMOM. |
| **H10** Seuil qualite minimum | Coherence seance | 1j | Faible (gate deja partiellement implementee) | Extension d'une gate existante. |

### Long-Cycle (effort eleve ou dependances fortes)

| Hypothese | Impact | Effort | Incertitude | Justification |
|---|---|---|---|---|
| **H7** Poids intensite +2/-2 | Credibilite DUP | 0.5j code + mesure | Elevee (impact reel a mesurer) | La mesure determinera si +2/-2 suffit ou si des blocs variants sont necessaires. |
| **H8** Poids position +5 | Differenciation postes | 0.5j code + mesure | Elevee (impact reel a mesurer) | Meme logique : mesure avant decision structurelle. |
| **H9** Deload 3:1 in-season | Gestion fatigue | 2j | Moderee (preuve C) | Depend de H1. Modification du cycle de periodisation. |
| **H11** Cap intensite U18 | Securite mineurs | 1-2j | Faible (logique simple) | Depend de H4. Override de version conditionnel. |
| **H12** Action ACWR caution | Granularite fatigue | 1j | Moderee (nouveau comportement intermediaire) | Depend de H2. Version W1 conditionnelle. |

---

## 4. Roadmap Experimentale en 3 Vagues

### Vague A — P0 Immediat (Semaine 1-2, ~8j)

**Objectif :** Corriger les 6 ecarts critiques securite + credibilite.

```
Jour 1-2 :
  H2  ACWR recalibrage              [0 dependance]         => 1j
  H3  Warmup systematique           [0 dependance]         => 0.5j
  H4  Feature flags U18             [0 dependance]         => 0.5j

Jour 3-4 :
  H5  Prevention ACL feminine       [apres H4 si partage populationProfileV1]  => 1j
  H10 Seuil qualite minimum         [0 dependance]         => 1j

Jour 5-8 :
  H1  Deload structure              [0 dependance]         => 2-3j
  H6  Budget volume                 [0 dependance]         => 1-2j
```

**Criteres de sortie Vague A :**
- 100% des tests P0 passent (voir section 6)
- 0 regression sur les tests existants (`buildWeekProgram.test.ts`, `buildWeekProgramEdgeCases.test.ts`)
- Matrice 60 combinaisons : 0 crash, 0 session vide non-intentionnelle

### Vague B — P1 Calibration (Semaine 3-5, ~10j)

**Objectif :** Differenciation reelle (position, intensite, deload in-season).

```
Jour 1-2 :
  H7  Poids intensite +2/-2         [apres H2]            => 0.5j + mesure
  H8  Poids position +5             [0 dependance]         => 0.5j + mesure
  H12 Action ACWR caution           [apres H2]            => 1j

Jour 3-5 :
  H9  Deload 3:1 in-season          [apres H1]            => 2j
  H11 Cap intensite U18             [apres H4]            => 1-2j

Jour 6-8 :
  Stabilisation + tests snapshot    [apres H7, H8]        => 2j
  Ajustement poids si mesure H7/H8 insuffisante           => 1j
```

**Criteres de sortie Vague B :**
- Tests P1 passent a 100%
- Differenciation DUP (H7) >= 60% ou decision documentee de passer aux blocs variants
- Differenciation position (H8) >= 3 paires differenciees ou decision documentee
- 0 regression Vague A

### Vague C — Hardening et Monitoring (Semaine 6+, continu)

**Objectif :** Fiabiliser, monitorer, preparer les corrections P2.

```
  C1  Test d'integration matrice 60 combinaisons en CI    => 2j
  C2  Script de simulation volume (sets/session reels)    => 1j
  C3  Enrichissement patterns exercices (44% UNKNOWN)     => 3j (P2)
  C4  Extraction constantes KB -> module TS importable    => 1 semaine (P2)
  C5  Criteres RTP dans UI (checklist rehab phases)       => 2j (P1-4)
  C6  Monitoring terrain : retours utilisateurs U18/fem   => continu
```

**Criteres de sortie Vague C :**
- CI vert sur 60+ combinaisons a chaque PR
- 0 finding regression post-Vague B
- Couverture patterns exercices >= 80% (vs 56% actuel)

---

## 5. Registre des Risques et Mitigations

| ID | Risque | Probabilite | Impact | Mitigation |
|---|---|---|---|---|
| R1 | H1 (deload structure) genere des sessions incompletes pour profils tres contraints (starter + BW + blessure) | Moderee | Session degradee en deload | Fallback : si <1 bloc main work en deload, revenir a RECOVERY_MOBILITY_V1. Test explicite dans la matrice. |
| R2 | H2 (ACWR 1.5) trop permissif pour joueurs avec historique blessure entre 1.3-1.5 | Faible | Risque blessure modere | Le seuil caution (1.3) + warning UI compense. La KB est claire : 1.3-1.5 = vigilance, pas danger. |
| R3 | H3 (warmup obligatoire) augmente duree sessions de ~5-10 min | Certaine | UX : sessions plus longues | Blocs warmup courts (1 set). Benefice securite >> inconvenient duree. Communiquer dans l'UI. |
| R4 | H5 (prehab ACL feminine) : pas assez de blocs prehab avec tags knee_health/hip_stability | Moderee | Slot prehab injecte mais rempli par un bloc generique | Verifier la couverture des 4 blocs prehab existants AVANT implementation. Creer 1-2 blocs si insuffisant. |
| R5 | H6 (budget volume) : comptage sets imprecis sur blocs EMOM/conditioning | Moderee | Faux positifs de depassement | Exclure les blocs conditioning/mobility du comptage volume. Comptabiliser uniquement les intents principaux. |
| R6 | H7/H8 (poids scoring) : regression de selection de blocs | Moderee | Blocs inattendus selectionnes | Tests de snapshot avant/apres sur 60 combinaisons. Revue manuelle des 5 profils les plus courants. |
| R7 | H9 (deload 3:1) : perte de stimulus W3 si deload trop precoce | Faible | Volume cumule insuffisant sur 3 semaines | La W3 actuelle est deja la semaine pre-peak. Le deload 3:1 est standard in-season (Pritchard 2015). |
| R8 | Vague B sans Vague A complete : les corrections de calibration construisent sur des fondations instables | Elevee si GO premature | Regressions en cascade | GO/NO-GO strict entre vagues. Pas de Vague B avant 100% tests Vague A. |

---

## 6. Plan de Tests (Mapping Hypothese -> Tests)

### 6.1 Tests Vague A (P0)

| Test ID | Hypothese | Assertion | Fichier cible | Type |
|---|---|---|---|---|
| TA-01 | H1 | `DELOAD genere >=1 session avec bloc force/hypertrophy (version W1)` | `buildWeekProgram.test.ts` | Unit |
| TA-02 | H1 | `DELOAD sessions utilisent version W1 (jamais W3/W4)` | `buildWeekProgram.test.ts` | Unit |
| TA-03 | H1 | `DELOAD 2x = 1 session structure W1 + 1 mobilite` | `buildWeekProgram.test.ts` | Unit |
| TA-04 | H1 | `DELOAD 3x = 1 session structure W1 + 1-2 mobilite` | `buildWeekProgram.test.ts` | Unit |
| TA-05 | H1 | `DELOAD volume total < 60% du volume W1 normal` | `buildWeekProgram.test.ts` | Unit |
| TA-06 | H2 | `ACWR 1.35 ne declenche PAS de remplacement` | `buildWeekProgram.test.ts` | Unit |
| TA-07 | H2 | `ACWR 1.55 declenche remplacement derniere seance` | `buildWeekProgram.test.ts` | Unit |
| TA-08 | H2 | `ACWR 2.1 reduit a 1 seance` | `buildWeekProgram.test.ts` | Unit |
| TA-09 | H3 | `Toute session non-RECOVERY_MOBILITY/non-REHAB_P1 inclut warmup` | `buildSessionFromRecipe.test.ts` | Unit |
| TA-10 | H3 | `Session starter inclut warmup` | `buildSessionFromRecipe.test.ts` | Unit |
| TA-11 | H3 | `Session hypertrophie pure inclut warmup` | `buildSessionFromRecipe.test.ts` | Unit |
| TA-12 | H3 | `RECOVERY_MOBILITY_V1 ne contient PAS warmup` | `buildSessionFromRecipe.test.ts` | Unit |
| TA-13 | H4 | `Profil U18 detecte => hard caps actifs sans flags manuels` | `safetyContracts.test.ts` | Unit |
| TA-14 | H4 | `U18 + parentalConsent=false => fallback mobilite` | `safetyContracts.test.ts` | Unit |
| TA-15 | H5 | `Profil female_senior => >=1 bloc prehab knee_health/hip_stability par semaine` | `buildWeekProgram.test.ts` | Unit |
| TA-16 | H5 | `Profil female_u18 => prehab ACL + caps U18 actifs` | `buildWeekProgram.test.ts` | Unit |
| TA-17 | H6 | `Session starter W4 <= 10 sets travail principal` | `qualityGates.test.ts` | Unit |
| TA-18 | H6 | `Session performance W4 <= 20 sets (tolerance 21)` | `qualityGates.test.ts` | Unit |
| TA-19 | H10 | `Session 0 bloc main work (non-exemptee) => remplacee par mobilite` | `qualityGates.test.ts` | Unit |

### 6.2 Tests Vague B (P1)

| Test ID | Hypothese | Assertion | Fichier cible | Type |
|---|---|---|---|---|
| TB-01 | H7 | `Session heavy vs light meme semaine => blocs differents pour >=1 intent` | `buildSessionFromRecipe.test.ts` | Unit |
| TB-02 | H7 | `Score intensite +2/-2 cree ecart mesurable (>=3 points) entre heavy et light sur meme bloc` | `buildSessionFromRecipe.test.ts` | Unit |
| TB-03 | H8 | `PROP vs WING sur UPPER_V1 W1 => blocs differents pour >=1 slot principal` | `buildSessionFromRecipe.test.ts` | Unit |
| TB-04 | H8 | `SCRUM_HALF vs FULLBACK sur LOWER_V1 => blocs differents` | `buildSessionFromRecipe.test.ts` | Unit |
| TB-05 | H9 | `In-season => deload a W3 (pas W4)` | `buildWeekProgram.test.ts` | Unit |
| TB-06 | H9 | `Off-season => deload a W4 (inchange)` | `buildWeekProgram.test.ts` | Unit |
| TB-07 | H9 | `Volume W1 < W2 < W3 monotone croissant` | `buildWeekProgram.test.ts` | Unit |
| TB-08 | H11 | `U18 jamais version W3 ou W4` | `buildSessionFromRecipe.test.ts` | Unit |
| TB-09 | H11 | `U18 semaine W3 => override version W2` | `buildSessionFromRecipe.test.ts` | Unit |
| TB-10 | H12 | `ACWR 1.4 => pas de remplacement seance` | `buildWeekProgram.test.ts` | Unit |
| TB-11 | H12 | `ACWR 1.4 => version W1 sur derniere seance` | `buildWeekProgram.test.ts` | Unit |

### 6.3 Tests de Regression (contrats a verrouiller des la Vague A)

| Test ID | Source | Assertion | Priorite |
|---|---|---|---|
| TR-01 | EC-01 | `rehab lower + critical ACWR => au moins 1 session rehab survit` | Vague A |
| TR-02 | EC-02 | `rehab active + 3 sessions => aucune FULL/COND dans le resultat` | Vague A |
| TR-03 | EC-03 | `starter + weeklySessions=3 => normalise a 2` | Vague A |
| TR-04 | C-2 | `Toutes contraindications exercice propagees au bloc parent` (CI integrite data) | Vague A |
| TR-05 | C-1 | `DELOAD week phase != FORCE (plus de fallback null->FORCE)` | Vague A |
| TR-06 | EC-08 | `FULL_BUILDER_V1 : meme definition "full" entre build et validate` | Vague B |
| TR-07 | -- | `17 profils x 6 semaines : 0 crash, 0 session vide non-intentionnelle` | CI continu |
| TR-08 | -- | `60 combinaisons matrice : toutes sessions valides (validateSession)` | CI continu |

---

## 7. Criteres GO/NO-GO entre Vagues

### Vague A -> Vague B

| Critere | Seuil GO | Seuil NO-GO |
|---|---|---|
| Tests Vague A (TA-01 a TA-19) | 100% pass | Tout echec => fix avant GO |
| Tests regression (TR-01 a TR-05) | 100% pass | Tout echec => fix avant GO |
| Tests existants (`buildWeekProgram.test.ts`, `buildWeekProgramEdgeCases.test.ts`, `programDataIntegrity.test.ts`) | 0 regression | Toute regression => fix avant GO |
| Matrice 60 combinaisons smoke | 0 crash, 0 session vide | Tout crash => NO-GO |
| Revue PO des 3 profils critiques (starter BW, perf 3x in-season, U18 2x) | Validation terrain subjective | Objection bloquante du PO => fix |

### Vague B -> Vague C

| Critere | Seuil GO | Seuil NO-GO |
|---|---|---|
| Tests Vague B (TB-01 a TB-11) | 100% pass | Tout echec => fix avant GO |
| 0 regression Vague A | 100% | Toute regression => NO-GO |
| Mesure differenciation H7 (DUP) | >=40% (acceptable meme si <60% — decision P2 documentee) | <20% => revue architecturale necessaire |
| Mesure differenciation H8 (position) | >=2 paires differenciees | <1 paire => revue architecturale necessaire |
| Decision PO sur H9 (ratio 3:1) | Validation terrain | Objection bloquante => revert a 4:1 |

---

## 8. Decision Finale — Ordre Exact d'Implementation

```
VAGUE A — P0 IMMEDIAT (jours 1-8)
=================================

1. H2  ACWR recalibrage (caution=1.3, danger=1.5)        [jour 1]
   Fichiers: ruleConstants.v1.ts, safetyContracts.ts
   Tests: TA-06, TA-07, TA-08, TR-01

2. H3  Warmup systematique                                [jour 1]
   Fichiers: buildSessionFromRecipe.ts:202-223
   Tests: TA-09, TA-10, TA-11, TA-12

3. H4  Feature flags U18 actifs par defaut                [jour 2]
   Fichiers: featureFlags.ts, buildWeekProgram.ts ou resolveProgramFeatureFlags
   Tests: TA-13, TA-14

4. H5  Prevention ACL feminine                            [jour 3]
   Fichiers: safetyContracts.ts ou buildWeekProgram.ts, ruleConstants.v1.ts
   Tests: TA-15, TA-16
   Pre-requis: verifier couverture blocs prehab knee_health

5. H10 Seuil qualite minimum                             [jour 4]
   Fichiers: qualityGates.ts (extension gate existante)
   Tests: TA-19

6. H1  Deload structure (sessions W1 + mobilite)          [jours 5-7]
   Fichiers: ruleConstants.v1.ts, buildWeekProgram.ts:138-139
   Tests: TA-01, TA-02, TA-03, TA-04, TA-05, TR-05

7. H6  Budget volume (warning si depassement caps)        [jour 8]
   Fichiers: qualityGates.ts ou validateSession.ts, ruleConstants.v1.ts
   Tests: TA-17, TA-18

--- GO/NO-GO: 100% TA + TR pass, 0 regression, PO valide ---

VAGUE B — P1 CALIBRATION (jours 9-18)
======================================

8. H7  Poids intensite +2/-2                              [jour 9]
   Fichiers: buildSessionFromRecipe.ts:128-136
   Tests: TB-01, TB-02
   Mesure: % differenciation heavy/light

9. H8  Poids position +5                                  [jour 9]
   Fichiers: buildSessionFromRecipe.ts:120-123
   Tests: TB-03, TB-04
   Mesure: nombre de paires differenciees

10. H12 Action ACWR caution (version W1)                  [jour 10-11]
    Fichiers: safetyContracts.ts, buildWeekProgram.ts
    Tests: TB-10, TB-11
    Depend de: H2

11. H9  Deload 3:1 in-season                             [jours 12-13]
    Fichiers: programPhases.v1.ts, buildWeekProgram.ts
    Tests: TB-05, TB-06, TB-07
    Depend de: H1

12. H11 Cap intensite U18                                 [jours 14-15]
    Fichiers: buildSessionFromRecipe.ts ou buildWeekProgram.ts, ruleConstants.v1.ts
    Tests: TB-08, TB-09
    Depend de: H4

13. Stabilisation + snapshots                             [jours 16-18]
    60 combinaisons matrice : verification automatisee
    Ajustement poids H7/H8 si mesure insuffisante

--- GO/NO-GO: 100% TB pass, 0 regression VA, mesures H7/H8 documentees ---

VAGUE C — HARDENING (semaine 6+)
=================================

14. CI integration matrice 60 combinaisons
15. Script simulation volume reel
16. Enrichissement patterns exercices (P2)
17. Extraction constantes KB -> module TS (P2)
18. Criteres RTP dans UI (P1-4)
19. Monitoring retours terrain
```

---

*Fin du document. Ce plan est un outil de decision et d'execution — il ne modifie aucun code.*
