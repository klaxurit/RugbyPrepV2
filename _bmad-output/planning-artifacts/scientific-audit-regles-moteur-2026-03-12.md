# Audit Scientifique des Regles Moteur RugbyPrepV2

**Date:** 2026-03-12
**Perimetre:** Toutes les regles explicites du moteur de generation de programme (hard constraints, soft rules, seuils numeriques)
**Methode:** Croisement code moteur vs KB interne (18 fichiers, ~3700+ lignes) vs recherche externe (3 documents domain research) vs audits precedents (adversarial + edge cases)
**Objectif:** Identifier les ecarts entre le code et la science, prioriser les corrections

---

## 1. Executive Summary

Le moteur RugbyPrepV2 repose sur 102 blocs, 142 exercices, 24 recettes et un pipeline `buildWeekProgram -> buildSessionFromRecipe -> selectEligibleBlocks`. L'audit croise **42 regles explicites** extraites du code avec la KB et la litterature. **18 regles sont solidement fondees** (ACWR, periodisation par blocs, ratio deload 4:1, DUP in-season). **8 regles presentent un ecart significatif** entre le code et la KB (deload W1 au lieu de volume reduit, absence de budget volume, pas de modulation MD-minus, seuils ACWR danger vs KB). **5 regles sont inadaptees pour U18/feminines** (pas de hard caps effectifs sans feature flags, pas de modulation cycle menstruel, pas de cap intensite U18). **11 regles sont des heuristiques terrain sans preuve solide** mais acceptables en MVP. Le risque principal est la **credibilite terrain** : un preparateur physique identifierait immediatement l'absence d'echauffement structure, l'absence d'ondulation reelle en intensite des blocs (malgre le systeme DUP recent), et le deload qui genere des sessions normales en structure.

---

## 2. Table des Regles Moteur

### 2.1 Periodisation et Cycle

| # | Regle moteur | Valeur actuelle | Fichier + ligne | Source KB | Niveau de preuve | Risque si faux | Recommandation | Priorite |
|---|---|---|---|---|---|---|---|---|
| R01 | Ordre des blocs : HYPERTROPHY -> FORCE -> POWER | H1-H4 -> W1-W4 -> W5-W8 | `programPhases.v1.ts:64-69` | periodization.md section 2.3 (Issurin 2008, effet residuel) | **Elevee** (meta-analyses, consensus S&C) | Faible (ordre valide) | Aucune correction requise | -- |
| R02 | Duree bloc = 4 semaines | 4 weeks par phase | `programPhases.v1.ts:71-76` | periodization.md section 2.3 : "4 semaines : standard recommande athletes amateurs a intermediaires" | **Elevee** (Issurin 2008, Bompa 2009) | Faible | Conforme | -- |
| R03 | Deload systematique ratio 4:1 | H4, W4, W8 -> DELOAD | `programPhases.v1.ts:98-112` | periodization.md section 5.2 : ratio 4:1 valide hors competition | **Elevee** (Pritchard 2015, Israetel 2019) | Faible hors saison, **modere en saison** (devrait etre 3:1) | Ajouter option 3:1 in-season (KB periodization.md section 7.3C) | P1 |
| R04 | DELOAD genere RECOVERY_MOBILITY_V1 uniquement | `buildWeekProgram.ts:138-139` via `RULE_CONSTANTS_V1.deload.recipeId` | load-budgeting.md : "volume reduit 40-50%, intensite maintenue" ; periodization.md section 5.2 : "meme structure de seance, meme frequence" | **Elevee** | **Eleve** -- la KB dit de maintenir la structure avec volume reduit, pas de passer a mobilite pure. Le deload actuel supprime tout stimulus de force. Perte d'adaptations neurales. | Generer sessions standard avec volume reduit (W1 versions) **ou** 1 session legere + 1 mobilite | **P0** |
| R05 | DUP in-season : session 0=FORCE, 1=POWER, 2=HYPERTROPHY | `programPhases.v1.ts:31-34, 43-62` | periodization.md section 2.2 (Rhea 2002, DUP superieur pour intermediaires) + gold-standard-microcycles section 2 (P-01) | **Elevee** (Rhea 2002, Cohen's d=0.48) | Faible -- implementation correcte du principe | Conforme. Valider que les tags d'intensite (sessionIntensity.ts) produisent une vraie differentiation dans les blocs selectionnes | P1 |
| R06 | Off-season : block periodization, toutes sessions meme phase | `programPhases.v1.ts:59-61` | periodization.md section 2.3, 4.2 | **Elevee** | Faible | Conforme | -- |
| R07 | Starter/Builder : pas de DUP | `programPhases.v1.ts:54` | beginner-programming.md : "charge constante moderee" | **Moderee** (consensus NSCA jeunesse, pas d'etude specifique DUP debutant) | Faible | Conforme comme heuristique | -- |

### 2.2 Gestion de la Fatigue et de la Charge (ACWR)

| # | Regle moteur | Valeur actuelle | Fichier + ligne | Source KB | Niveau de preuve | Risque si faux | Recommandation | Priorite |
|---|---|---|---|---|---|---|---|---|
| R08 | ACWR danger threshold | **1.3** | `ruleConstants.v1.ts:5-6` | evidence-register.md : "ACWR sweet spot upper = 1.3" ; injury-prevention.md section 3.2 : zone vigilance 1.3-1.5 | **Moderee** (Gabbett 2016 BJSM, debat Windt 2019) | **Modere** -- le code traite 1.3 comme "danger" alors que la KB le definit comme limite superieure du sweet spot. La **vraie zone danger** est >1.5 | Renommer : `cautionThreshold: 1.3`, `dangerThreshold: 1.5` (aligner code sur evidence-register.md) | **P0** |
| R09 | ACWR critical threshold | **2.0** | `ruleConstants.v1.ts:7` | evidence-register.md n'a pas de seuil explicite a 2.0 ; injury-prevention.md section 3.2 : ">2.0 = zone critique" | **Faible** (pas de seuil 2.0 dans Gabbett ; extrapole) | Modere -- mais conservateur (protecteur) | Acceptable. Ajouter commentaire "heuristique conservative, pas de seuil publie a 2.0" | P2 |
| R10 | Danger ACWR : derniere seance remplacee par mobilite | `safetyContracts.ts:175` | load-budgeting.md : "caution zone -> reduce volume 20-30%" | **Moderee** | **Modere** -- remplacer par mobilite est plus agressif que "reduire volume 20-30%". Un joueur a 1.3 perd une seance entiere au lieu de juste reduire | Implementer une reduction de volume (version W1) au lieu d'un remplacement complet | P1 |
| R11 | Critical ACWR : garder uniquement 1ere seance | `safetyContracts.ts:164` | load-budgeting.md : ">1.5 = mandatory deload, activation/mobility only" | **Moderee** | Modere -- coherent avec KB pour zone >1.5, mais le seuil est a 2.0 dans le code | Abaisser le seuil critical ou ajouter un palier intermediaire a 1.5 | P1 |
| R12 | ACWR fenetre calcul : 7j aigu, 28j chronique | Implicite (hook useACWR) | evidence-register.md : ACWR 7d/28d, Level B (Gabbett 2016) | **Moderee** (B) | Faible | Conforme | -- |
| R13 | Pas de budget volume hebdo dans le moteur | Absent | load-budgeting.md : caps par niveau (starter 6-10 sets/session, performance 14-20) + par phase (DELOAD 40-50%) | **Elevee** (Israetel 2019, Haff 2016) | **Eleve** -- aucun controle de volume total. Une session peut accumuler plus de sets que recommande sans que le moteur ne reagisse | Ajouter un compteur de sets/session et sets/semaine dans le pipeline, avec warning si depassement | **P0** |

### 2.3 Structure de Seance

| # | Regle moteur | Valeur actuelle | Fichier + ligne | Source KB | Niveau de preuve | Risque si faux | Recommandation | Priorite |
|---|---|---|---|---|---|---|---|---|
| R14 | Structure seance = warmup(opt) + activation + main + finisher + cooldown(opt) | Recettes dans `sessionRecipes.v1.ts` | strength-methods.md section 9.1 : echauffement general (5-10min) + echauffement specifique (5-10min) + bloc principal (20-30min) + bloc secondaire (15-20min) + accessoires (10-15min) + gainage (5-10min) | **Elevee** (consensus S&C universel, injury-prevention.md section 9) | **Eleve** -- warmup et cooldown sont optionnels et conditionnes. Le warmup n'apparait que pour les sessions avec haute demande neuromusculaire. Un starter ne verra jamais de warmup. | Rendre warmup required pour toutes les sessions (ou au minimum, toujours l'afficher si un bloc warmup existe) | **P0** |
| R15 | Max blocs par session = 7 | `validateSession.ts:8` | Pas de source KB directe. Heuristique raisonnable basee sur duree cible 60-75min (load-budgeting.md) | **Heuristique terrain** | Faible | Acceptable | -- |
| R16 | Max finishers : 1 (standard), 2 (full body) | `validateSession.ts:9-10`, `buildSessionFromRecipe.ts:379` | Heuristique terrain | **Heuristique terrain** | Faible | Acceptable | -- |
| R17 | Pas de repos inter-blocs prescrit | Absent | strength-methods.md section 3.1 : ME = 3-5min, section 3.2 : DE = 60-90s, section 3.3 : RE = 60-120s | **Elevee** (NSCA Haff 2016) | Modere -- un debutant ne sait pas combien se reposer entre blocs | Ajouter `interBlockRestSeconds` par defaut dans les recettes ou un message UI | P2 |
| R18 | Cross-session exclusion desactivee pour starter | `buildWeekProgram.ts:252` | beginner-programming.md : variete via inversion slots A/B | **Heuristique terrain** | Faible (1 seul bloc BW par categorie) | Acceptable -- decision pragmatique | -- |
| R19 | Warmup/cooldown optionnels, conditionnes par intensite et niveau | `buildSessionFromRecipe.ts:202-223` | injury-prevention.md section 9 : echauffement structure reduit blessures 20-50% (Emery 2015) | **Elevee** (A) | **Eleve** -- sauter l'echauffement augmente le risque de blessure. La condition `hasHighNeuromuscularDemand` exclut les sessions hypertrophie et starter | Toujours inclure warmup pour toute session non-mobilite | **P0** |

### 2.4 Intensite et Ondulation Intra-Semaine

| # | Regle moteur | Valeur actuelle | Fichier + ligne | Source KB | Niveau de preuve | Risque si faux | Recommandation | Priorite |
|---|---|---|---|---|---|---|---|---|
| R20 | Pattern intensite performance 3x : heavy, medium, light | `sessionIntensity.ts:60-63` | periodization.md section 2.2 + gold-standard-microcycles P-01 : "LOWER heavy loin du match, SPEED/POWER medium, UPPER/primer light" | **Elevee** | Faible -- principe correct | Conforme. Verifier que les tags d'intensite ont un impact reel sur la selection de blocs | P1 |
| R21 | Pattern starter : medium, medium | `sessionIntensity.ts:49-52` | beginner-programming.md : charge constante moderee | **Moderee** (consensus) | Faible | Conforme | -- |
| R22 | Heavy preferTags : force, power, contrast, squat, hinge, olympic_variant | `sessionIntensity.ts:21` | strength-methods.md section 2.1 : force lourde 85-92%, 3-5 reps | **Elevee** | Faible -- tags coherents | Conforme | -- |
| R23 | Light preferTags : neural, speed, plyo, activation, prehab | `sessionIntensity.ts:33` | strength-methods.md section 3.2 : DE = 55-75% 1RM, vitesse maximale | **Elevee** | Faible | Conforme | -- |
| R24 | Intensite = tiebreaker score (+1/-1) seulement | `buildSessionFromRecipe.ts:129-136` | N/A | N/A | **Modere** -- avec seulement +1/-1, l'intensite ne change souvent pas le bloc selectionne face aux +3 des position preferences et +1 des recipe preferredTags | Augmenter le poids de l'intensite a +2/-2 minimum, ou creer des blocs variants par intensite | P1 |

### 2.5 Position et Personnalisation

| # | Regle moteur | Valeur actuelle | Fichier + ligne | Source KB | Niveau de preuve | Risque si faux | Recommandation | Priorite |
|---|---|---|---|---|---|---|---|---|
| R25 | Position preferences : +3 par tag matching | `buildSessionFromRecipe.ts:120-123` | periodization.md section 3.2 : piliers = force max 5/5, arriere = vitesse 5/5. Differentiation majeure par poste | **Elevee** (Nash 2017, Baker 1999) | **Modere** -- +3 ne suffit pas a differencier pilier vs ailier. Avec 5-8 preferredTags par recette (+1 chacun), la position est noyee | Augmenter a +5 ou +10, ou creer des recettes position-variantes | P1 |
| R26 | Fallback position : BACK_ROW si absente | `buildSessionFromRecipe.ts:329` | Heuristique | **Heuristique** | Faible -- BACK_ROW est un profil moyen acceptable | Acceptable | -- |
| R27 | 6 groupes de postes mappes | `positionPreferences.v1.ts` | periodization.md section 3.2 | **Elevee** | Faible | Conforme | -- |

### 2.6 Equipement et Contraindications

| # | Regle moteur | Valeur actuelle | Fichier + ligne | Source KB | Niveau de preuve | Risque si faux | Recommandation | Priorite |
|---|---|---|---|---|---|---|---|---|
| R28 | Filtrage equipement : blocs exclus si equipement manquant | `selectEligibleBlocks.ts:4-11` | N/A (logique produit) | N/A | Faible | Conforme | -- |
| R29 | Contraindications : verifiees au niveau bloc ET exercice | `selectEligibleBlocks.ts:39-46` | N/A | N/A | Faible | Conforme -- amelioration post-audit C-2 | -- |
| R30 | `none` = bodyweight, ignore dans hard requirements equipement | `selectEligibleBlocks.ts:10` | N/A | N/A | Faible | Conforme | -- |
| R31 | Level filtering : starter=starter tag, builder=not starter, perf=not starter/builder | `selectEligibleBlocks.ts:22-29` | N/A | N/A | Faible | Conforme | -- |

### 2.7 Rehab et Return-to-Play

| # | Regle moteur | Valeur actuelle | Fichier + ligne | Source KB | Niveau de preuve | Risque si faux | Recommandation | Priorite |
|---|---|---|---|---|---|---|---|---|
| R32 | Rehab routing : remplace UPPER/LOWER/FULL/COND par recette rehab | `safetyContracts.ts:50-60` | return-to-play-criteria.md : P1/P2/P3 progression criteria-based | **Elevee** (Creighton 2010, Shrier 2015) | Faible -- principe correct | Conforme (apres correction edge-case EC-02 dans safetyContracts) | -- |
| R33 | Rehab phases simples (P1/P2/P3) sans criteres objectifs dans le moteur | `safetyContracts.ts:48` | return-to-play-criteria.md : LSI >=70% pour P2->P3, LSI >=90% pour P3->Full, CMJ <10% deficit | **Elevee** (B) | **Modere** -- le moteur accepte un changement de phase sans validation de criteres. Un joueur peut passer P1->P2->P3 en 3 semaines sans test | Ajouter un avertissement UI + checklist de criteres avant changement de phase | P1 |
| R34 | Pas de stoppage rules dans le moteur | Absent | return-to-play-criteria.md : "stop if pain >6/10, acute swelling, instability" ; medical-red-flags.md | **Elevee** | Modere -- mais c'est un probleme UX, pas moteur | Ajouter des questions pre-session pour rehab | P2 |

### 2.8 Populations Specifiques (U18, Feminines)

| # | Regle moteur | Valeur actuelle | Fichier + ligne | Source KB | Niveau de preuve | Risque si faux | Recommandation | Priorite |
|---|---|---|---|---|---|---|---|---|
| R35 | U18 hard caps : 120min match/sem, 72h entre matchs, 15min high contact, 30min medium contact, 30 matchs/saison | `ruleConstants.v1.ts:13-19` + `safetyContracts.ts:70-118` | domain-feminine-u18-research section 2.2 : memes valeurs ; gold-standard-microcycles section 4 | **Elevee** (RFU age-grade, World Rugby Activate) | Faible -- valeurs correctes | Conforme. S'assurer que les feature flags sont actives en production | P1 |
| R36 | U18 hard caps derriere feature flags (populationProfileV1 + u18HardCapsV1) | `safetyContracts.ts:139-142` | N/A | N/A | **Eleve si desactive** -- les protections U18 ne sont actives que si les feature flags sont on. En prod par defaut, les flags sont off | Activer par defaut en production pour tout profil U18 detecte | **P0** |
| R37 | Pas de cap intensite U18 (max %1RM) | Absent | population-specific.md : U18 max 75% 1RM, U16 max 65% 1RM | **Moderee** (NSCA 2009 position stand) | **Modere** -- un U18 recoit les memes prescriptions de charge qu'un adulte | Ajouter un modificateur d'intensite pour profils U18 dans les versions de blocs | P1 |
| R38 | Pas de gestion cycle menstruel | Absent | population-specific.md section 1 : "follicular phase = meilleur moment haute intensite" ; domain-feminine-u18-research section 3 : "symptom-driven, pas phase-based" | **Moderee** (Menses meta-analysis: effets petits et heterogenes) | Faible a court terme -- la KB elle-meme recommande de ne PAS imposer de regles universelles par phase | Implementer un tracking opt-in symptomes avec reduction volume ~10-20% si symptom_score >=2. Ne PAS imposer de modifications par phase | P2 |
| R39 | Pas de prevention neuromusculaire obligatoire pour feminines | Absent | population-specific.md : "ACL prevention should be embedded in all female programs" ; domain-feminine-u18-research : ACL risk 2-3x plus eleve | **Elevee** (Hewett 2005, Emery 2015) | **Eleve** -- une joueuse devrait avoir au minimum 1 bloc prehab supplementaire oriente genou/hanche | Ajouter un slot prehab obligatoire pour les profils feminins. Tags cibles : knee_health, hip_stability, landing, deceleration | **P0** |
| R40 | Pas de detection de maturite (PHV) pour U18 | Absent | population-specific.md : "peak growth velocity = high risk" ; domain-feminine-u18-research section 2 | **Moderee** (consensus jeunesse, pas de seuil operationnel simple) | Modere -- le risque est reel mais la detection PHV requiert des donnees anthropometriques | Ajouter un champ `maturityStatus` avec mode cautious par defaut pour U18 | P1 |

### 2.9 Safety Fallbacks et Quality Gates

| # | Regle moteur | Valeur actuelle | Fichier + ligne | Source KB | Niveau de preuve | Risque si faux | Recommandation | Priorite |
|---|---|---|---|---|---|---|---|---|
| R41 | Safety fallback : si intent requis introuvable, chain core->prehab->activation... | `buildSessionFromRecipe.ts:66-83` | N/A (logique produit) | N/A | **Modere** -- un slot force peut devenir activation, produisant une session avec 2 activations et 0 travail principal | Ajouter un seuil qualite minimum : si <1 bloc main work, remplacer la session entiere par mobilite | P1 |
| R42 | Quality gates : remplacement par RECOVERY_MOBILITY_V1 si session invalide | `qualityGates.ts:68-91` + `buildWeekProgram.ts:278-297` | N/A | N/A | Faible -- defense correcte | Conforme | -- |

---

## 3. Contradictions Critiques

### 3.1 Deload : code vs KB (CRITIQUE)

**Code** : `buildWeekProgram.ts:138-139` -- la semaine DELOAD genere **uniquement** `RECOVERY_MOBILITY_V1` (2 blocs de mobilite).

**KB** : `periodization.md` section 5.2 :
> "Volume reduit de 30-50% (sets x reps). Intensite maintenue (~80-90% des charges de la semaine precedente). **Meme structure de seance, meme frequence.**"

**KB** : `load-budgeting.md` :
> "DELOAD: 40-50% volume, RPE 6. Active recovery, maintain patterns."

**Contradiction** : La KB dit explicitement de maintenir la structure et l'intensite. Le code supprime tout. Cela contredit le principe fondamental du deload (maintenir les adaptations neurales, dissiper la fatigue) et contredit aussi Issurin (2008) sur l'effet residuel de la puissance (18-24j seulement).

**Fichiers concernes** :
- `src/services/program/buildWeekProgram.ts` ligne 138
- `src/services/program/policies/ruleConstants.v1.ts` ligne 10
- `src/knowledge/periodization.md` section 5.2
- `src/knowledge/load-budgeting.md` lignes 25-27

### 3.2 Seuils ACWR : code vs KB

**Code** : `ruleConstants.v1.ts:5-6` -- `dangerThreshold: 1.3`

**KB** : `evidence-register.md` -- "ACWR sweet spot upper = **1.3**" (c'est la **limite haute de la zone optimale**, pas le debut de la zone danger)

**KB** : `injury-prevention.md` section 3.2 :
> "0.8-1.3 = Zone optimale. 1.3-1.5 = Zone de vigilance. **>1.5 = Zone danger** (risque x2-4, Hulin 2016)"

**Contradiction** : Le code traite 1.3 comme "danger" et declenche un remplacement de session. La KB dit que 1.3 est encore dans la zone optimale ou tout juste en vigilance. Le **vrai danger** est a 1.5+. Un joueur a 1.35 (zone de vigilance moderee) perd une seance entiere.

**Fichiers concernes** :
- `src/services/program/policies/ruleConstants.v1.ts` lignes 5-6
- `src/knowledge/evidence-register.md` lignes 19-21
- `src/knowledge/injury-prevention.md` lignes 192-197

### 3.3 Warmup : code vs KB

**Code** : `buildSessionFromRecipe.ts:202-223` -- warmup inclus seulement si `hasHighNeuromuscularDemand(recipe)` ET (performance heavy/medium OU builder heavy).

**KB** : `injury-prevention.md` section 9.2 :
> "Echauffement structure 20-25 min [...] les programmes d'echauffement structures reduisent les blessures globales de **20-50%** (Emery 2015)"

**Contradiction** : Un starter ne reçoit jamais de warmup. Un builder en session "light" non plus. Une session hypertrophie (ni neural, ni contrast, ni force) est exclue du warmup. La KB est categorique : tout echauffement protege, niveau preuve A.

**Fichiers concernes** :
- `src/services/program/buildSessionFromRecipe.ts` lignes 197-223
- `src/knowledge/injury-prevention.md` section 9

### 3.4 DUP sans difference reelle dans les blocs

**Code** : Le systeme DUP (`programPhases.v1.ts:43-62`) assigne une phase par session. Les preferences de phase (`PHASE_PREFERENCES`) ajoutent des preferTags. L'intensite (`sessionIntensity.ts`) ajoute des prefer/avoid tags avec poids +1/-1.

**KB** : `periodization.md` section 2.2 :
> "Seance A : Force max (4x4-5 @ 85-90% 1RM). Seance B : Puissance (5x3 @ 70-75% 1RM). Seance C : Endurance (3x10-12 @ 60-65% 1RM)"

**Contradiction partielle** : Le DUP est implemente au niveau du scoring de blocs, mais le poids de l'intensite (+1/-1) est un tiebreaker, pas un driver. De plus, les versions de blocs (W1-W4) ne varient pas par session mais par semaine. Le resultat est que deux sessions "heavy" et "light" dans la meme semaine peuvent selectionner les memes blocs avec les memes sets/reps. La KB attend une vraie differentiation de volume et intensite au sein de la semaine.

**Fichiers concernes** :
- `src/services/program/sessionIntensity.ts` lignes 20-36, 129-136 dans buildSessionFromRecipe
- `src/services/program/programPhases.v1.ts` lignes 43-62
- `src/knowledge/periodization.md` section 2.2

### 3.5 Prevention ACL obligatoire feminines : absente

**Code** : Aucune regle specifique feminine dans le moteur. `populationRules.ts` detecte le segment mais ne l'utilise que pour U18 hard caps.

**KB** : `population-specific.md` section 1 :
> "Female rugby players have 2-3x higher ACL injury risk. **Priority: ACL prevention program should be embedded in all female player programs.**"

**Recherche** : `domain-feminine-u18-research` section 4 :
> "Priorite 2 : Genou (ACL) / controle neuromusculaire [...] prevention moteur-ready : tags ACL-prep (deceleration, atterrissage, genou-hanche-tronc)"

**Absence** : Le moteur ne differencie pas un profil masculin d'un profil feminin en termes de contenu de session. Aucun bloc prehab n'est force pour les feminines.

---

## 4. Plan de Calibration P0/P1

### P0 -- Corrections immediates (impact securite ou credibilite critique)

| ID | Action | Fichiers concernes | Dependances | Effort estime |
|---|---|---|---|---|
| P0-1 | **Corriger le DELOAD** : generer des sessions standard avec versions W1 (volume minimal) au lieu de mobilite pure. Option : 1 session allegee (versions W1, 2 blocs max) + 1 mobilite si 3x/sem | `buildWeekProgram.ts:138-139`, `ruleConstants.v1.ts:10`, potentiellement nouvelles recettes DELOAD_LIGHT | Aucune | 2-3j |
| P0-2 | **Realigner seuils ACWR** : `cautionThreshold: 1.3`, `dangerThreshold: 1.5`. Action "caution" = warning sans modification. Action "danger" = remplacer derniere session. Action "critical" = garder 1 session (seuil a 1.5 ou 2.0 selon choix) | `ruleConstants.v1.ts:5-7`, `safetyContracts.ts:151-178` | Aucune | 1j |
| P0-3 | **Rendre warmup systematique** : supprimer la condition `hasHighNeuromuscularDemand` pour warmup. Tout session non-mobilite/non-rehab-P1 devrait avoir un warmup. Exclure uniquement RECOVERY_MOBILITY_V1 | `buildSessionFromRecipe.ts:202-223` | Blocs warmup (3 existent deja) | 0.5j |
| P0-4 | **Activer les feature flags U18 par defaut** en production pour tout profil detecte U18 | `featureFlags.ts` ou configuration deployement | Resolution du segment population dans le profil | 0.5j |
| P0-5 | **Ajouter prevention ACL pour feminines** : si `populationSegment` contient "female", forcer au minimum 1 slot prehab supplementaire dans les recettes, ou injecter un bloc prehab knee_health/hip_stability | `buildWeekProgram.ts` ou `safetyContracts.ts` | Tags de blocs prehab existants (4 blocs prehab) | 1j |
| P0-6 | **Implementer un budget volume basique** : compteur de sets par session, warning si depassement des caps load-budgeting.md (starter: 10 sets max, performance: 20 sets max) | Nouveau check dans `validateSession.ts` ou `qualityGates.ts` | Lecture des versions de blocs (sets deja disponibles) | 1-2j |

### P1 -- Corrections court terme (amelioration de la coherence et credibilite)

| ID | Action | Fichiers concernes | Dependances | Effort estime |
|---|---|---|---|---|
| P1-1 | **Ratio deload 3:1 in-season** : ajouter option dans le profil ou detection automatique via `seasonMode === 'in_season'`. Deload a H3/W3/W7 au lieu de H4/W4/W8 | `programPhases.v1.ts`, `buildWeekProgram.ts` | R03 | 2j |
| P1-2 | **Augmenter poids intensite dans scoring** : passer de +1/-1 a +2/-2 minimum, ou creer des variantes de blocs par intensite | `buildSessionFromRecipe.ts:129-136` | R24 | 1j |
| P1-3 | **Augmenter poids position dans scoring** : passer de +3 a +5 ou +7 pour creer une vraie differentiation pilier vs ailier | `buildSessionFromRecipe.ts:120-123` | R25 | 0.5j |
| P1-4 | **Criteres RTP dans l'UI** : ajouter une checklist de validation avant changement de phase rehab (LSI, douleur, ROM) | `ProfilePage.tsx` / `SessionDetailPage.tsx` | R33 | 2j |
| P1-5 | **Seuil qualite minimum** : si une session a <1 bloc main work apres tous les fallbacks, la remplacer par mobilite au lieu de la livrer degradee | `qualityGates.ts` | R41, deja partiellement implemente | 1j |
| P1-6 | **Cap intensite U18** : ajouter un modificateur qui reduit les versions de blocs (ex: U18 utilise toujours W1-W2 max, jamais W3-W4 peak) | `buildSessionFromRecipe.ts` ou `programPhases.v1.ts` | R37 | 1-2j |
| P1-7 | **Action ACWR "caution" (1.3-1.5)** : au lieu de rien faire, afficher un warning et reduire le volume de la derniere session de 20-30% (utiliser version W1) | `safetyContracts.ts` | P0-2 | 1j |

---

## 5. Tests a Ajouter pour Verrouiller les Regles Corrigees

### Tests P0

| Test | Verifie | Fichier cible |
|---|---|---|
| `DELOAD genere au moins 1 session avec bloc force/hypertrophy (version W1)` | P0-1 : le deload maintient un stimulus | `buildWeekProgram.test.ts` |
| `ACWR 1.35 ne declenche PAS de remplacement de session (zone caution, pas danger)` | P0-2 : seuil danger = 1.5, pas 1.3 | `buildWeekProgram.test.ts` |
| `ACWR 1.55 declenche le remplacement de la derniere session` | P0-2 : danger a 1.5+ | `buildWeekProgram.test.ts` |
| `Toute session non-RECOVERY_MOBILITY_V1 inclut un bloc warmup` | P0-3 : warmup systematique | `buildSessionFromRecipe.test.ts` (a creer) |
| `Profil U18 detecte => hard caps actifs meme sans feature flags manuels` | P0-4 | `safetyContracts.test.ts` |
| `Profil female_senior => au moins 1 bloc prehab par semaine` | P0-5 | `buildWeekProgram.test.ts` |
| `Session starter ne depasse pas 10 sets de travail` | P0-6 : budget volume | `qualityGates.test.ts` ou `validateSession.test.ts` |
| `Session performance ne depasse pas 20 sets de travail` | P0-6 | Idem |

### Tests P1

| Test | Verifie | Fichier cible |
|---|---|---|
| `In-season seasonMode => deload a W3 au lieu de W4 (ratio 3:1)` | P1-1 | `buildWeekProgram.test.ts` |
| `Session heavy et session light dans la meme semaine selectionnent des blocs differents pour le meme intent` | P1-2 : ondulation reelle | `buildSessionFromRecipe.test.ts` |
| `Profil pilier (PROP) et profil ailier (WING) sur meme recette UPPER_V1 selectionnent des blocs differents` | P1-3 : position impact reel | `buildSessionFromRecipe.test.ts` |
| `Rehab P1->P2 affiche un warning si pas de validation criteres` | P1-4 | Test UI ou integration |
| `Session avec 0 bloc main work (apres fallbacks) est remplacee par mobilite, pas livree vide` | P1-5 | `qualityGates.test.ts` |
| `Profil U18 ne recoit jamais de version W4 (peak intensity)` | P1-6 | `buildSessionFromRecipe.test.ts` |
| `ACWR 1.4 genere un warning mais ne remplace pas de session` | P1-7 | `buildWeekProgram.test.ts` |

### Tests de regression (contrats existants a verrouiller)

| Test | Verifie |
|---|---|
| `rehab lower + critical ACWR => au moins 1 session rehab survit` | Edge-case EC-01 |
| `rehab active + 3 sessions => aucune FULL_* ou COND_* dans le resultat` | Edge-case EC-02 (corrige dans safetyContracts.ts) |
| `starter + weeklySessions=3 => normalise a 2` | Edge-case EC-03 (corrige dans normalizeProfile.ts:28-29) |
| `Toutes les contraindications exercice sont propagees au bloc parent` | Adversarial C-2 -- test CI d'integrite data |
| `DELOAD week phase != FORCE (pas de fallback null->FORCE)` | Adversarial C-1 (corrige : DELOAD genere maintenant RECOVERY_MOBILITY_V1 directement) |

---

## 6. Synthese des Niveaux de Preuve

| Niveau | Nombre de regles | Exemples |
|---|---|---|
| **Preuve solide (A/B)** | 18 | ACWR zones, periodisation par blocs, DUP, ordre Force->Power, NHE prevention, echauffement -20-50% blessures, deload ratio, 1RM formulas |
| **Preuve moderee (C)** | 13 | Caps de volume par phase, repos inter-sets, cap duree session 75min, position preferences, MCE menstruel, U18 intensite max |
| **Heuristique terrain** | 11 | Max blocs/session, finisher count, fallback chain, cross-session exclusion starter, position fallback BACK_ROW, rotation top3 |

---

## 7. Risques Residuels (hors perimetre moteur mais a surveiller)

1. **KB decorative** : les 18 fichiers KB (~3700+ lignes, ~186+ references) ne sont lus par aucun code du moteur. Les seuils sont dupliques manuellement dans le code et dans la KB. Un desalignement est inevitable sans extraction automatisee (`evidence-register.md` -> constantes TS importees).

2. **Pas de progressive overload** : le moteur genere des sessions mais n'a aucune memoire des charges reelles. La progression W1->W4 est structurelle (versions de blocs) mais pas individualisee. Le backlog ticket #21 couvre ce sujet.

3. **Pas de match-day-minus modulation** : le `scheduleOptimizer.ts` assigne des jours mais ne module pas l'intensite par proximite au match. La KB (load-budgeting.md : J-2 = activation only, J-1 = rest/mobility) n'est pas implementee. Le systeme de microcycle archetype (nouveau) adresse partiellement ce sujet via les feature flags.

4. **62 exercices avec pattern UNKNOWN** (48% des exercices) : le champ `pattern` est largement abandonne, reduisant la capacite du moteur a raisonner sur la couverture de mouvements. Impact : pas de verification automatique "au moins 1 squat + 1 hinge par semaine lower".

5. **Absence de COD/agilite/contact prep** : zero blocs dans le catalogue actuel. La recherche domain (gold-standard-microcycles section 4) identifie ces elements comme essentiels a la credibilite terrain.

---

*Fin de l'audit scientifique. Ce document est un outil de decision -- il ne modifie aucun code.*
