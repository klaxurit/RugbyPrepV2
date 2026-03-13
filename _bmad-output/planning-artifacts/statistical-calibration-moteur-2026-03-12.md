# Calibration Statistique du Moteur RugbyPrepV2

**Date:** 2026-03-12
**Source principale:** `_bmad-output/planning-artifacts/scientific-audit-regles-moteur-2026-03-12.md`
**Methode:** Croisement audit scientifique (42 regles) + code moteur (12 fichiers) + recherche externe (3 documents) + simulation par combinaisons (60+ profils)
**Perimetre:** Audit et recommandations uniquement — pas de modification de code

---

## 1. Executive Summary

Le moteur RugbyPrepV2 genere des programmes via 102 blocs, 142 exercices et 24 recettes. La calibration revele **6 ecarts critiques** entre le code et les referentiels scientifiques : (1) le seuil ACWR danger a 1.3 est trop conservateur de 15%, privant les joueurs en zone optimale haute d'une seance ; (2) le deload genere de la mobilite pure au lieu de sessions a volume reduit, supprimant le stimulus neural ; (3) le warmup conditionnel exclut 60%+ des sessions (starters, hypertrophie, light) ; (4) les feature flags U18 sont desactives par defaut en production ; (5) aucune prevention ACL pour les feminines ; (6) aucun budget volume dans le pipeline. L'analyse de sensibilite montre que le poids de scoring de l'intensite (+1/-1) est noye par les preferences de phase/position (+3), rendant l'ondulation DUP theorique. Les corrections P0 representent ~6-8 jours de travail et adressent les 3 risques securite + 3 risques credibilite. Les corrections P1 representent ~10 jours supplementaires pour la differenciation reelle (position, intensite, deload in-season).

---

## 2. Baseline Metrics

### 2.1 Inventaire data

| Metrique | Valeur | Fichier source |
|---|---|---|
| Blocs total | 102 | `blocks.v1.json` |
| Exercices total | 142 | `exercices.v1.json` |
| Recettes total | 24 | `sessionRecipes.v1.ts` |
| Blocs starter | 9 | `selectEligibleBlocks.ts:26` |
| Blocs builder | 5 | `selectEligibleBlocks.ts:27` |
| Blocs performance | 88 | `selectEligibleBlocks.ts:28` |
| Blocs avec contraindications | 86/102 (84%) | `blocks.v1.json` |
| Exercices pattern UNKNOWN | 62/142 (44%) | `exercices.v1.json` |
| Feature flags actifs par defaut | 1/8 (safetyContractsV1) | `featureFlags.ts:14-23` |

### 2.2 Volume par session (sets estimes, blocs types)

| Session | W1 (sets) | W4 (sets) | Delta W1→W4 | Cap KB (load-budgeting.md) | Ecart |
|---|---|---|---|---|---|
| LOWER_V1 (perf) | ~17 | ~21 | +24% | 14-20 | W4 depasse cap (+5%) |
| UPPER_V1 (perf) | ~14 | ~17 | +21% | 14-20 | Conforme |
| FULL_V1 (perf) | ~14 | ~18 | +29% | 14-20 | W4 limite |
| Starter session | ~10 | ~13 | +30% | 6-10 | W4 depasse cap (+30%) |
| RECOVERY_MOBILITY_V1 | 2 | 2 | 0% | N/A | -- |

**Constat :** Pas de garde-fou volume dans le pipeline (`validateSession.ts`, `qualityGates.ts`). Un starter a W4 recoit ~13 sets vs cap KB de 10 max.

### 2.3 Poids de scoring (buildSessionFromRecipe.ts:108-137)

| Source de score | Poids par tag match | Tags typiques par source | Score max typique |
|---|---|---|---|
| Position preferences (`preferTags`) | **+3** | 3-5 tags | +9 a +15 |
| Phase preferences (`preferTags`) | **+3** | 5-8 tags | +15 a +24 |
| Recipe `preferredTags` | **+1** | 5-8 tags | +5 a +8 |
| Intensity prefer | **+1** | 5-7 tags | +5 a +7 |
| Position avoid | **-2** | 0-2 tags | 0 a -4 |
| Intensity avoid | **-1** | 1-3 tags | -1 a -3 |

**Constat critique :** L'intensite (+1/-1) represente 5-10% du score total vs position+phase (+3 chacun = 50-70%). L'intensite est un tiebreaker, pas un driver. Deux sessions "heavy" et "light" selectionnent quasi-systematiquement les memes blocs.

### 2.4 Warmup coverage

| Profil | Warmup inclus ? | Condition (buildSessionFromRecipe.ts:197-223) |
|---|---|---|
| Performance heavy/medium | Oui | `hasHighNeuromuscularDemand` + intensity heavy/medium |
| Performance light | **Non** | intensity === 'light' exclu |
| Builder heavy | Oui | `hasHighNeuromuscularDemand` + intensity heavy |
| Builder medium/light | **Non** | intensity !== 'heavy' |
| Starter (toujours medium) | **Non** | level !== 'performance' ET intensity !== 'heavy' |
| Toute session hypertrophie pure | **Non** | pas de neural/contrast/force dans recette |
| Rehab / blessure active | Oui | `profile.rehabInjury` ou `injuries.length > 0` |

**Constat :** ~60% des sessions n'ont pas d'echauffement. KB : echauffement reduit blessures 20-50% (Emery 2015, preuve A).

---

## 3. Matrice d'Evaluation (60+ combinaisons)

### 3.1 Combinaisons testees (lecture code, pas execution)

| # | Niveau | Saison | Freq | Blessure | Semaine | Metric cle evaluee |
|---|---|---|---|---|---|---|
| 1 | starter | in | 2x | aucune | H1 | warmup absent, volume ~10 sets OK |
| 2 | starter | in | 2x | aucune | H4 | warmup absent, volume ~13 sets > cap 10 |
| 3 | starter | in | 2x | shoulder_pain | H1 | safety fallback, warmup present (injuries>0) |
| 4 | starter | in | 2x | knee+shoulder | H1 | double contra, pool tres reduit |
| 5 | starter | in | 2x | aucune | DELOAD | 1x mobilite pure (P0-1 : devrait garder structure) |
| 6 | builder | in | 2x | aucune | H1 | warmup absent (medium), 2 sessions |
| 7 | builder | in | 3x | aucune | H2 | warmup absent (medium), 3 sessions |
| 8 | builder | in | 2x | shoulder_pain | W1 | rehab routing, warmup present |
| 9 | builder | off | 2x | aucune | H1 | hypertrophie, pas de DUP |
| 10 | builder | off | 3x | aucune | H3 | +FULL_BUILDER, warmup absent |
| 11 | builder | in | 2x | aucune | DELOAD | mobilite pure (P0-1) |
| 12 | perf | in | 2x | aucune | W1 | DUP heavy+medium, warmup sur heavy seul |
| 13 | perf | in | 3x | aucune | W1 | DUP heavy+medium+light, warmup heavy+medium |
| 14 | perf | in | 3x | aucune | W2 | progression W2, memes blocs (intensite tiebreaker) |
| 15 | perf | in | 3x | aucune | W3 | W3 pre-peak |
| 16 | perf | in | 3x | aucune | W4 | W4 peak, volume ~21 sets LOWER |
| 17 | perf | in | 2x | aucune | DELOAD | mobilite pure (P0-1) |
| 18 | perf | off | 2x | aucune | H1 | LOWER_HYPER+UPPER_HYPER, block periodization |
| 19 | perf | off | 3x | aucune | H1 | +COND_OFF, hypertrophie |
| 20 | perf | off | 3x | aucune | H4 | deload→mobilite (P0-1), devrait etre volume reduit |
| 21 | perf | pre | 2x | aucune | W1 | LOWER_V1+UPPER_V1, force |
| 22 | perf | pre | 3x | aucune | W1 | +COND_PRE, force+conditioning |
| 23 | perf | pre | 3x | speed | W1 | +SPEED_FIELD_PRE_V1 (performanceFocus=speed) |
| 24 | perf | in | 3x | shoulder_pain | W1 | rehab routing upper, LOWER preserve |
| 25 | perf | in | 3x | knee_pain | W1 | rehab routing lower, UPPER preserve |
| 26 | perf | in | 3x | aucune | W1 | ACWR danger (1.3) → derniere seance mobilite |
| 27 | perf | in | 3x | aucune | W1 | ACWR critical (2.0) → 1 seance |
| 28 | perf | in | 3x | shoulder_pain | W1 | ACWR critical + rehab → 1 seance rehab |
| 29 | perf | in | 2x | aucune | W1 | ACWR danger 2x → derniere seance mobilite (reste 1) |
| 30 | perf | in | 3x | multi (shoulder+knee) | W1 | double contra, pool epuise |
| 31 | starter | in | 2x | aucune | W5 | pas de DUP, medium+medium |
| 32 | starter | in | 2x | aucune | W8 | W4 version (peak), volume ↑ |
| 33 | perf | in | 3x | aucune | H1 | off-season block hypertrophie, 3x |
| 34 | perf | in | 3x | aucune | W5 | power phase, DUP active |
| 35 | perf | in | 3x | aucune | W8 | power W4, pre-deload peak |
| 36-40 | U18 (flags OFF) | in | 2x | aucune | H1-DELOAD | **Hard caps inactifs** → meme programme adulte |
| 41-45 | U18 (flags ON) | in | 2x | aucune | H1-DELOAD | Hard caps actifs, mobilite si cap depasse |
| 46 | U18 | in | 2x | aucune | H1 | Consent parental absent → fallback mobilite |
| 47 | feminine | in | 3x | aucune | W1 | Pas de prehab ACL force (P0-5) |
| 48 | feminine | in | 2x | aucune | W1 | Idem, 2 sessions |
| 49 | feminine | off | 3x | aucune | H1 | Pas de prevention neuromuscul obligatoire |
| 50 | feminine U18 | in | 2x | aucune | H1 | Cumul risques : flags off + pas ACL |
| 51 | perf | in | 3x | aucune | W1 | PROP vs WING : position +3, differenciation ? |
| 52 | perf | in | 3x | aucune | W1 | SCRUM_HALF vs FULLBACK : idem |
| 53 | perf | in | 3x | low_back_pain | W1 | Contra sur activation lower |
| 54 | perf | in | 3x | ankle_pain | W1 | Contra specifique |
| 55 | builder | pre | 2x | aucune | W1 | builder + pre-season = block period W1 |
| 56 | builder | pre | 3x | aucune | W4 | builder + pre + peak → deload apres |
| 57 | perf | in | 3x | aucune | W1 | ignoreAcwrOverload=true + danger → pas de modif |
| 58 | perf | in | 3x | aucune | W1 | hasSufficientACWRData=false + danger → pas de modif |
| 59 | starter | off | 2x | aucune | H1 | starter ignore seasonMode |
| 60 | perf | in | 3x | aucune | W1 | qualityGatesV2=true → gates evalues |

### 3.2 Synthese des constats par metrique

| Metrique | Score actuel | Cible | Ecart | Priorite |
|---|---|---|---|---|
| **Coherence seance** (warmup + main + finisher) | 40% ont warmup | 95%+ (hors mobilite) | **-55 pts** | P0-3 |
| **Diversite patterns** (exercices UNKNOWN) | 44% sans pattern | <10% | **-34 pts** | P2 |
| **Redondance intra-seance** | Faible (exercise overlap check) | OK | Conforme | -- |
| **Redondance inter-seances** | Cross-session exclusion OK (sauf starter) | OK | Conforme | -- |
| **Securite quality gates** | Gates existent mais flags OFF | 100% actifs | **Flags OFF** | P0-4 |
| **Securite volume** | Pas de cap | Caps KB appliques | **Absent** | P0-6 |
| **Securite U18** | Feature flags OFF en prod | ON pour tout U18 | **Desactive** | P0-4 |
| **Prevention feminine** | 0 regle specifique | Prehab ACL 1x/sem min | **Absent** | P0-5 |
| **Progression W1→W4** | +21 a +30% sets | +30-50% volume (KB) | Coherent | -- |
| **Differentiation position** | +3 par tag (noye) | Impact mesurable | **Faible** | P1-3 |
| **Differentiation intensite DUP** | +1/-1 (tiebreaker) | Driver reel | **Negligeable** | P1-2 |
| **Deload structure** | Mobilite pure | Structure W1 + volume -40-50% | **Non conforme** | P0-1 |
| **ACWR seuils** | danger=1.3 | caution=1.3, danger=1.5 | **Trop conservateur** | P0-2 |

---

## 4. Analyse de Sensibilite

### 4.1 Seuil ACWR danger

| Scenario | Seuil danger | Seuil critical | Impact sur joueur ACWR=1.35 | Impact sur joueur ACWR=1.55 | Source |
|---|---|---|---|---|---|
| **Actuel** | 1.3 | 2.0 | **Perd 1 seance** (mobilite) | Aucun effet (< critical) | `ruleConstants.v1.ts:6` |
| **Recommande** | 1.5 | 2.0 | Aucun effet (zone optimale haute) | **Perd 1 seance** (mobilite) | evidence-register.md, Gabbett 2016 |
| **Intermediaire** | 1.5 | 1.8 | Aucun effet | **Perd 1 seance** (1.55=danger) ; 1.8+=1 seance max | Compromis |
| Avec zone caution | caution=1.3, danger=1.5 | 2.0 | **Warning UI** + volume -20% sur derniere seance | **Perd 1 seance** | KB injury-prevention.md §3.2 |

**Recommandation calibree :** 3 zones : caution [1.3-1.5[ = warning + volume W1 sur derniere seance ; danger [1.5-2.0[ = remplacement derniere seance par mobilite ; critical >=2.0 = 1 seance max. Justification : la KB definit 1.3 comme limite haute du sweet spot, pas comme danger.

### 4.2 Deload : mobilite pure vs volume reduit

| Scenario | Contenu deload | Stimulus neural maintenu ? | Risque perte adaptation | Source |
|---|---|---|---|---|
| **Actuel** | RECOVERY_MOBILITY_V1 (2 blocs mobilite) | **Non** | **Eleve** (effet residuel puissance 18-24j, Issurin 2008) | `buildWeekProgram.ts:138-139` |
| **Recommande A** | Sessions normales, versions W1, 1-2 blocs max par session | **Oui** | Faible | periodization.md §5.2, load-budgeting.md |
| **Recommande B** (3x/sem) | 1 session structure W1 + 1 mobilite + 1 skip | **Oui (partiel)** | Faible | Compromis terrain |
| **Recommande C** (2x/sem) | 1 session structure W1 + 1 mobilite | **Oui** | Faible | Idem |

**Recommandation calibree :** Scenario A pour 2x/sem, Scenario B pour 3x/sem. Le deload doit garder les memes recettes avec version W1 et reduire le nombre de blocs (skip optionnels). La mobilite pure ne doit servir que pour les slots supplementaires.

### 4.3 Warmup : conditionnel vs obligatoire

| Scenario | Sessions avec warmup | Estimation reduction blessures | Source |
|---|---|---|---|
| **Actuel** | ~40% (heavy+medium perf, rehab, injuries) | ~8-20% global | `buildSessionFromRecipe.ts:202-223` |
| **Recommande** | ~95% (toutes sauf RECOVERY_MOBILITY_V1 et REHAB_P1) | ~20-50% (Emery 2015) | injury-prevention.md §9 |
| **Intermediaire** | ~70% (toutes perf + builder, pas starter) | ~15-35% | Compromis |

**Recommandation calibree :** Warmup systematique pour toute session non-mobilite, non-REHAB_P1. Les 3 blocs warmup existants couvrent le besoin. Impact code : supprimer la condition `hasHighNeuromuscularDemand` et la condition sur `sessionIntensity`. Garder uniquement l'exclusion pour `RECOVERY_MOBILITY_V1` et `REHAB_*_P1_V1`.

### 4.4 Poids de scoring : intensite vs position vs phase

| Scenario | Position | Phase | Recipe preferred | Intensity prefer | Intensity avoid | Impact DUP |
|---|---|---|---|---|---|---|
| **Actuel** | +3 | +3 | +1 | +1 | -1 | **Negligeable** : intensite = 5-10% du score |
| **Option A** | +3 | +3 | +1 | **+2** | **-2** | Faible : intensite = 10-15% du score |
| **Option B** | +5 | +3 | +1 | **+3** | **-3** | Modere : intensite differentie 1-2 blocs par session |
| **Option C** | +5 | +3 | +1 | +1 | -1 mais **blocs variants par intensite** | Fort : blocs physiquement differents |
| **Recommande** | **+5** | +3 | +1 | **+2** | **-2** | Position + intensite differenciants |

**Analyse :** Pour un bloc upper avec 3 tags (upper, push, force), un PROP avec 4 position prefer tags gagne +12 en position vs +3 en intensite. Meme en passant intensite a +2, le delta position reste dominant. La solution structurelle (Option C : blocs variants par intensite) est la plus efficace mais represente un effort data significatif. La solution pragmatique P1 est Option B.

### 4.5 Budget volume (absent → caps proposes)

| Niveau | Phase | Cap sets/session (KB) | Cap sets/semaine (KB) | Source |
|---|---|---|---|---|
| Starter | toutes | **10** | 20 (2 sessions) | load-budgeting.md |
| Builder | H1-H3 | **12** | 24-36 | load-budgeting.md (interpolation) |
| Builder | H4/DELOAD | 8 | 16 | -40% volume |
| Performance | W1-W3 | **18** | 36-54 | load-budgeting.md |
| Performance | W4 peak | **20** | 40-60 | load-budgeting.md |
| Performance | DELOAD | 10 | 20-30 | -40-50% volume |

**Actuel vs cap :** LOWER_V1 a W4 = ~21 sets → depasse cap de 20 par 1 set (acceptable). Starter a W4 = ~13 sets → depasse cap de 10 par 30% (problematique).

---

## 5. Recommandations Calibrees P0/P1

### 5.1 P0 — Corrections immediates (securite + credibilite critique)

| ID | Parametre | Valeur actuelle | Valeur recommandee | Justification | Fichier(s) | Effort |
|---|---|---|---|---|---|---|
| P0-1 | `deload.recipeId` | `RECOVERY_MOBILITY_V1` | Recettes standard avec version W1 + slots optionnels skips | periodization.md §5.2 : "meme structure, volume -40-50%". Issurin 2008 : effet residuel puissance 18-24j | `ruleConstants.v1.ts:10`, `buildWeekProgram.ts:138-139` | 2-3j |
| P0-2a | `acwr.dangerThreshold` | **1.3** | **1.5** | evidence-register.md : 1.3 = sweet spot upper. injury-prevention.md §3.2 : danger = 1.5+. Gabbett 2016 : risque x2-4 a 1.5+ | `ruleConstants.v1.ts:6` | 0.5j |
| P0-2b | Nouveau : `acwr.cautionThreshold` | (absent) | **1.3** | Zone vigilance 1.3-1.5 : warning UI + volume W1 sur derniere seance (pas remplacement) | `ruleConstants.v1.ts` (ajouter) | 0.5j |
| P0-3 | Condition warmup | `hasHighNeuromuscularDemand && (perf heavy/medium OR builder heavy)` | Toute session sauf RECOVERY_MOBILITY_V1 et REHAB_*_P1_V1 | injury-prevention.md §9 : echauffement -20-50% blessures, preuve A | `buildSessionFromRecipe.ts:202-223` | 0.5j |
| P0-4 | `u18HardCapsV1` default | `false` | `true` quand profil U18 detecte | domain-feminine-u18-research §2.2, RFU age-grade. Risque legal et safety | `featureFlags.ts:16` | 0.5j |
| P0-5 | Prevention ACL feminine | (absent) | 1 slot prehab `knee_health`/`hip_stability` obligatoire par semaine pour profil feminin | population-specific.md §1 : ACL risk 2-3x, Hewett 2005. domain-feminine-u18-research §4 | `buildWeekProgram.ts` ou `safetyContracts.ts` | 1j |
| P0-6 | Budget volume | (absent) | Warning si sets/session > cap niveau (starter:10, perf:20) | load-budgeting.md : caps par niveau. Israeltel 2019, Haff 2016 | `qualityGates.ts` ou `validateSession.ts` | 1-2j |

**Total P0 : ~6-8 jours**

### 5.2 P1 — Corrections court terme (coherence + differenciation)

| ID | Parametre | Valeur actuelle | Valeur recommandee | Justification | Fichier(s) | Effort |
|---|---|---|---|---|---|---|
| P1-1 | Ratio deload in-season | 4:1 | **3:1** (deload a H3/W3/W7 si `seasonMode=in_season`) | periodization.md §7.3C : in-season 3:1 plus adapte (charge match + S&C). Pritchard 2015 | `programPhases.v1.ts`, `buildWeekProgram.ts` | 2j |
| P1-2 | Poids scoring intensite | +1/-1 | **+2/-2** | R24 audit : intensite = tiebreaker, pas driver. +2/-2 represente ~15% du score → differenciation reelle mais pas dominante | `buildSessionFromRecipe.ts:129-136` | 0.5j |
| P1-3 | Poids scoring position | +3 | **+5** | R25 audit : +3 noye par phase (+3 x 7 tags). +5 cree ecart PROP vs WING de +10 vs +6 → selection de blocs differents | `buildSessionFromRecipe.ts:120-123` | 0.5j |
| P1-4 | Criteres RTP dans UI | (absent) | Checklist LSI + douleur + ROM avant changement phase rehab | return-to-play-criteria.md : LSI >=70% P2→P3, >=90% P3→Full | `ProfilePage.tsx` / UI | 2j |
| P1-5 | Seuil qualite minimum | Fallback chain → prehab/core/activation | Si session <1 bloc main work apres fallbacks → remplacer par mobilite | R41 audit : un slot force devenu activation = session degradee | `qualityGates.ts` | 1j |
| P1-6 | Cap intensite U18 | (absent) | U18 utilise versions W1-W2 max (jamais W3-W4 peak) | population-specific.md : U18 max 75% 1RM. W3-W4 = progression peak inadaptee | `buildSessionFromRecipe.ts` ou `programPhases.v1.ts` | 1-2j |
| P1-7 | Action ACWR caution (1.3-1.5) | (rien) | Warning UI + version W1 sur derniere seance (volume -30%) | load-budgeting.md : caution → reduce 20-30%. Pas de remplacement, juste reduction | `safetyContracts.ts` | 1j |

**Total P1 : ~9-10 jours**

---

## 6. Plan d'Implementation (ordre + dependances)

```
Phase 0 (semaine 1-2) :
  P0-2a,b  ACWR seuils           [0 dependance]          → 1j
  P0-3     Warmup systematique    [0 dependance]          → 0.5j
  P0-4     Feature flags U18      [0 dependance]          → 0.5j
  P0-5     Prevention ACL fem     [apres P0-4 si besoin]  → 1j
  P0-1     Deload structure       [0 dependance]          → 2-3j
  P0-6     Budget volume          [0 dependance]          → 1-2j

Phase 1 (semaine 3-5) :
  P1-2     Poids intensite        [apres P0-2]            → 0.5j
  P1-3     Poids position         [0 dependance]          → 0.5j
  P1-7     Action ACWR caution    [apres P0-2a,b]         → 1j
  P1-1     Deload 3:1 in-season   [apres P0-1]            → 2j
  P1-5     Seuil qualite min      [0 dependance]          → 1j
  P1-6     Cap intensite U18      [apres P0-4]            → 1-2j
  P1-4     Criteres RTP UI        [0 dependance]          → 2j
```

### Dependances critiques

- P0-2 (ACWR) doit etre fait avant P1-7 (action caution) : le seuil doit etre recalibre avant d'ajouter le comportement intermediaire.
- P0-4 (flags U18) doit etre fait avant P1-6 (cap intensite U18) : les flags doivent etre actifs pour que le cap ait un effet.
- P0-1 (deload) doit etre fait avant P1-1 (3:1 in-season) : la structure deload doit etre corrigee avant de changer le ratio.

---

## 7. Plan de Tests

### 7.1 Tests unitaires P0

| Test | Verifie | Fichier cible | Type |
|---|---|---|---|
| `DELOAD genere au moins 1 session avec bloc force/hypertrophy (version W1)` | P0-1 | `buildWeekProgram.test.ts` | Unit |
| `DELOAD sessions utilisent version W1 (pas W4)` | P0-1 | `buildWeekProgram.test.ts` | Unit |
| `DELOAD 2x = 1 session structure W1 + 1 mobilite` | P0-1 | `buildWeekProgram.test.ts` | Unit |
| `DELOAD 3x = 1 session structure W1 + 1 mobilite + 1 (skip ou mobilite)` | P0-1 | `buildWeekProgram.test.ts` | Unit |
| `ACWR 1.35 ne declenche PAS de remplacement (zone caution)` | P0-2 | `buildWeekProgram.test.ts` | Unit |
| `ACWR 1.55 declenche remplacement derniere seance` | P0-2 | `buildWeekProgram.test.ts` | Unit |
| `ACWR 2.1 reduit a 1 seance` | P0-2 | `buildWeekProgram.test.ts` | Unit |
| `Toute session non-RECOVERY_MOBILITY_V1 et non-REHAB_P1 inclut bloc warmup` | P0-3 | `buildSessionFromRecipe.test.ts` (creer) | Unit |
| `Session starter inclut warmup` | P0-3 | `buildSessionFromRecipe.test.ts` | Unit |
| `Session hypertrophie inclut warmup` | P0-3 | `buildSessionFromRecipe.test.ts` | Unit |
| `RECOVERY_MOBILITY_V1 ne contient PAS de warmup` | P0-3 | `buildSessionFromRecipe.test.ts` | Unit |
| `Profil U18 detecte → hard caps actifs meme sans feature flags manuels` | P0-4 | `safetyContracts.test.ts` | Unit |
| `Profil U18 + parentalConsent=false → fallback mobilite` | P0-4 | `safetyContracts.test.ts` | Unit |
| `Profil female_senior → au moins 1 bloc prehab knee_health/hip_stability par semaine` | P0-5 | `buildWeekProgram.test.ts` | Unit |
| `Session starter W4 ne depasse pas 10 sets de travail principal` | P0-6 | `validateSession.test.ts` ou `qualityGates.test.ts` | Unit |
| `Session performance W4 ne depasse pas 20 sets de travail principal` | P0-6 | Idem | Unit |
| `Session performance W1 respecte le cap volume` | P0-6 | Idem | Unit |

### 7.2 Tests unitaires P1

| Test | Verifie | Fichier cible | Type |
|---|---|---|---|
| `In-season → deload a W3 (pas W4) si ratio 3:1` | P1-1 | `buildWeekProgram.test.ts` | Unit |
| `Off-season → deload reste a W4 (ratio 4:1)` | P1-1 | `buildWeekProgram.test.ts` | Unit |
| `Session heavy et light meme semaine selectionnent blocs differents pour meme intent` | P1-2 | `buildSessionFromRecipe.test.ts` | Unit |
| `PROP et WING sur UPPER_V1 selectionnent des blocs differents` | P1-3 | `buildSessionFromRecipe.test.ts` | Unit |
| `Session 0 blocs main work → remplacee par mobilite` | P1-5 | `qualityGates.test.ts` | Unit |
| `U18 ne recoit jamais version W4 (utilise W2 max)` | P1-6 | `buildSessionFromRecipe.test.ts` | Unit |
| `ACWR 1.4 genere warning mais ne remplace pas de seance` | P1-7 | `buildWeekProgram.test.ts` | Unit |
| `ACWR 1.4 applique version W1 sur derniere seance` | P1-7 | `buildWeekProgram.test.ts` | Unit |

### 7.3 Tests de regression (contrats existants a verrouiller)

| Test | Verifie | Priorite |
|---|---|---|
| `rehab lower + critical ACWR → au moins 1 session rehab survit` | EC-01 | P0 |
| `rehab active + 3 sessions → aucune FULL/COND dans le resultat` | EC-02 | P0 |
| `starter + weeklySessions=3 → normalise a 2` | EC-03 | P0 |
| `Toutes contraindications exercice propagees au bloc parent` | C-2 (integrite data) | P0 |
| `DELOAD week phase != FORCE (plus de fallback null→FORCE)` | C-1 | P0 |
| `Cross-session exclusion desactivee pour starter` | Comportement attendu | P1 |
| `17 profils × 6 semaines : 0 crash, 0 session vide non-intentionnelle` | Smoke test | CI |

### 7.4 Tests d'integration

| Test | Verifie | Type |
|---|---|---|
| `60 combinaisons matrice §3.1 : toutes les sessions generees sont valides (validateSession)` | Couverture globale | Integration |
| `Budget volume respecte pour toutes les combinaisons` | P0-6 apres implementation | Integration |
| `Warmup present pour toutes les sessions non-exclues` | P0-3 apres implementation | Integration |
| `Progression W1→W4 : volume augmente monotoniquement pour toute recette` | Coherence progression | Integration |
| `Deload volume < W1 volume pour toute recette` | P0-1 apres implementation | Integration |

---

## 8. Risques et Limites

### 8.1 Risques de la calibration

| Risque | Impact | Mitigation |
|---|---|---|
| P0-1 (deload structure) peut generer des sessions incompletes si les blocs W1 sont filtres par equipement/contra | Session degradee en deload | Tester sur les 60 combinaisons ; fallback mobilite si <1 bloc main |
| P0-2 (ACWR 1.5) peut etre trop permissif pour certains joueurs avec historique blessure | Risque blessure accru entre 1.3-1.5 | Le seuil caution (1.3) + warning compense. La KB est claire : 1.3-1.5 = vigilance, pas danger |
| P0-3 (warmup obligatoire) augmente la duree de toutes les sessions de ~5-10 min | UX : sessions plus longues | Les blocs warmup sont courts (1 set, W1). Benefice securite >> inconvenient duree |
| P1-2/P1-3 (poids scoring) peuvent creer des regressions de selection de blocs | Blocs inattendus selectionnes | Tests de snapshot sur les 60 combinaisons avant/apres |

### 8.2 Limites de cette calibration

| Limite | Impact | Plan |
|---|---|---|
| **Pas d'execution reelle** : les estimations de volume sont basees sur la lecture du code, pas sur une execution du moteur | Les totaux de sets sont approximatifs (premier bloc eligible par intent, pas le reel) | Ajouter un script de simulation qui execute `buildWeekProgram` pour les 60 combinaisons et collecte les metriques |
| **Donnees populations specifiques limitees** : pas de donnees d'usage reel pour U18/feminines | Les seuils sont base KB, pas valides terrain | Collecter des retours utilisateurs apres activation des feature flags |
| **44% exercices sans pattern** : impossible de mesurer la couverture de mouvements (squat+hinge+push+pull/semaine) | La diversite de patterns n'est pas quantifiable automatiquement | P2 : enrichir les patterns dans `exercices.v1.json` |
| **KB decorative** : les constantes sont dupliquees manuellement entre KB et code | Desalignement inevitable sans extraction automatisee | P2 : extraire les constantes KB vers un fichier partage importe par le code |
| **Progressive overload absent** : le moteur n'a pas de memoire des charges reelles | La calibration volume est structurelle (versions W1-W4), pas individualisee | Backlog #21 |
| **Match-day-minus non implemente** : l'intensite n'est pas modulee par proximite au match | L'ondulation DUP n'est pas ancree au calendrier reel | Depends des feature flags `microcycleArchetypesV2` + `enforceMatchProximityGateV2` |

### 8.3 Niveaux de confiance par recommandation

| Recommandation | Niveau de confiance | Base |
|---|---|---|
| P0-1 Deload structure | **Estimation solide** — consensus S&C universel, KB explicite, Issurin 2008, Pritchard 2015 | Preuve A/B |
| P0-2 ACWR seuils | **Estimation solide** — evidence-register.md, Gabbett 2016, Hulin 2016 | Preuve B (debat Windt 2019 sur validite ACWR mais seuils consensuels) |
| P0-3 Warmup | **Estimation solide** — Emery 2015, preuve A, consensus universel | Preuve A |
| P0-4 Flags U18 | **Estimation solide** — RFU age-grade, World Rugby Activate | Preuve A |
| P0-5 Prevention ACL | **Estimation solide** — Hewett 2005, meta-analyses, population-specific.md | Preuve A/B |
| P0-6 Budget volume | **Estimation solide** — Israetel 2019, Haff 2016, load-budgeting.md | Preuve B |
| P1-1 Ratio 3:1 | **Hypothese raisonnable** — periodization.md §7.3C, consensus mais pas d'etude specifique rugby in-season | Preuve C |
| P1-2 Poids intensite +2 | **Hypothese** — pas de donnee empirique, estimation ingenierie basee sur distribution des scores | Heuristique |
| P1-3 Poids position +5 | **Hypothese** — idem, vise un ecart PROP vs WING de ~8-10 points sur score total | Heuristique |
| P1-6 Cap intensite U18 W2 | **Hypothese raisonnable** — NSCA 2009, population-specific.md, pas de seuil exact W1/W2 dans la litterature | Preuve C |
| P1-7 Action caution volume W1 | **Hypothese raisonnable** — load-budgeting.md : "reduce 20-30%", W1 = version minimale | Preuve C |

---

## Annexe A : Constantes de Reference (ruleConstants.v1.ts)

### Valeurs actuelles

```typescript
export const RULE_CONSTANTS_V1 = {
  acwr: {
    dangerThreshold: 1.3,    // → recalibrer a 1.5
    criticalThreshold: 2.0,  // → conserver
  },
  deload: {
    recipeId: 'RECOVERY_MOBILITY_V1',  // → remplacer par logique session W1
    maxSessions: 1,                     // → adapter (2x: 1 struct + 1 mob, 3x: 1 struct + 1 mob + 1 skip)
  },
  u18: {
    maxMatchMinutesPerWeek: 120,        // conforme
    minHoursBetweenMatches: 72,         // conforme
    maxHighContactMinutesPerWeek: 15,   // conforme
    maxMediumContactMinutesPerWeek: 30, // conforme
    maxMatchesPerSeason: 30,            // conforme
  },
}
```

### Valeurs recommandees

```typescript
export const RULE_CONSTANTS_V1 = {
  acwr: {
    cautionThreshold: 1.3,   // NOUVEAU — zone vigilance, warning + volume W1
    dangerThreshold: 1.5,    // MODIFIE — zone danger, remplacement derniere seance
    criticalThreshold: 2.0,  // INCHANGE
  },
  deload: {
    // MODIFIE — plus de recipeId unique, logique dans buildWeekProgram
    useStructuredDeload: true,
    deloadVersionOverride: 'W1' as const,
    maxMainBlocksPerSession: 2,
  },
  volume: {                  // NOUVEAU
    starterMaxSetsPerSession: 10,
    builderMaxSetsPerSession: 12,
    performanceMaxSetsPerSession: 20,
    deloadReductionFactor: 0.5,
  },
  u18: {
    maxMatchMinutesPerWeek: 120,
    minHoursBetweenMatches: 72,
    maxHighContactMinutesPerWeek: 15,
    maxMediumContactMinutesPerWeek: 30,
    maxMatchesPerSeason: 30,
    maxVersionIndex: 'W2' as const,  // NOUVEAU — cap intensite U18
  },
  femalePrevention: {                // NOUVEAU
    mandatoryPrehabPerWeek: 1,
    targetTags: ['knee_health', 'hip_stability', 'landing', 'deceleration'],
  },
}
```

---

## Annexe B : Scoring Impact Simulation

### Exemple : UPPER_V1, week W1, perf in-season

**Session 0 (heavy, FORCE phase via DUP) :**
- Phase FORCE preferTags = ['force','hinge','squat','posterior_chain','contact','trunk','shoulder_health'] → +3 chacun
- Position PROP preferTags = ['squat','hinge','trunk','force','contact'] → +3 chacun
- Recipe preferredTags = ['upper','push','pull','shoulder_health','contact'] → +1 chacun
- Intensity HEAVY preferTags = ['force','power','contrast','contact','squat','hinge','olympic_variant'] → **+1 chacun (actuel)** vs **+2 (propose)**

Pour un bloc `BLK_STR_FORCE_UPPER_BENCH_01` (tags: upper, push, force, bench) :
- Phase : force(+3) = +3
- Position PROP : force(+3) = +3
- Recipe : upper(+1) + push(+1) = +2
- Intensity actuel : force(+1) = +1 → **Total = 9**
- Intensity propose (+2) : force(+2) = +2 → **Total = 10**

Pour un bloc `BLK_HP_UPPER_PUSH_PULL_01` (tags: upper, push, pull, hypertrophy) :
- Phase : 0 (pas de tag force/hinge/squat)
- Position PROP : 0
- Recipe : upper(+1) + push(+1) + pull(+1) = +3
- Intensity actuel : 0 (pas de tag heavy) → **Total = 3**
- Intensity propose : hypertrophy avoid(-2) = +1 → **Total = 1** ← meilleure differenciation

**Conclusion :** Avec +2/-2, l'ecart entre un bloc force et un bloc hypertrophie passe de 6 points a 9 points pour une session heavy. La differenciation est mesurable mais pas dominante. Recommandation validee.

---

*Fin du document de calibration statistique. Ce document est un outil de decision — il ne modifie aucun code.*
