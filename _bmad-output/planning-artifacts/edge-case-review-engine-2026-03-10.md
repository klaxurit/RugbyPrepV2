# Edge Case Review — RugbyPrepV2 Session Generation Engine

**Date:** 2026-03-10  
**Inputs:** `_bmad-output/planning-artifacts/research/domain-preparation-physique-rugby-research-2026-03-10.md`, `_bmad-output/planning-artifacts/adversarial-review-engine-2026-03-10.md`

## 1. Summary

J'ai trouvé **12 edge cases uniques** non couverts par l'audit adversarial: **2 Dangerous**, **5 Broken**, **4 Degraded**, **1 Cosmetic**.

La zone la plus fragile n'est pas le scoring pur, mais le couplage entre **routing hebdo**, **rehab**, **contrats UI**, et **gestion des entrées corrompues**. Le moteur tient sur les chemins nominaux, mais il déraille vite dès qu'on combine rehab, fatigue ACWR, faible équipement, ou contrats UI incohérents.

Méthode appliquée:
- lecture exhaustive des branches du pipeline demandé
- sweep local de **7 560 combo-weeks** (`3 niveaux × 2 fréquences × 4 presets matériel × 5 sets blessures × 3 états rehab × 3 seasonModes × 7 semaines critiques`)
- vérifications ciblées runtime sur les cas demandés (`starter+3`, `rehab+critical`, `week=0/NaN`)
- brute force du scheduler sur les **5 040** permutations possibles des 7 jours pour vérifier les branches mortes

Point important: je n'ai **pas** trouvé de cas supporté où la même recette apparaît 2 fois dans la même semaine. Les arrays de recettes sont uniques et les branches `danger`/`critical` raccourcissent ou remplacent, mais ne dupliquent pas.

---

## 2. Edge Cases Par Zone Du Pipeline

### `src/services/program/buildWeekProgram.ts`

#### [Dangerous] EC-01 — `critical` + rehab lower supprime la séance rehab

- **Trigger:** `trainingLevel=performance`, `weeklySessions=3`, `rehabInjury={ zone:'lower', phase:3 }`, `fatigueLevel='critical'`, `hasSufficientACWRData=true`
- **Observed:** la séquence devient `['UPPER_V1', 'REHAB_LOWER_P3_V1', 'FULL_V1']`, puis `slice(0, 1)` conserve uniquement `UPPER_V1`
- **Expected:** conserver au minimum une séance rehab-compatible ou une mobilité ciblée
- **Risk:** le joueur en réhab bas du corps perd totalement son stimulus de réathlétisation au moment où la fatigue devient critique
- **Code:** `src/services/program/buildWeekProgram.ts:50-53` `return ids.map((id) => targetIds.includes(id) ? rehabId : id)`, `src/services/program/buildWeekProgram.ts:83-90`, `src/services/program/buildWeekProgram.ts:110-113` `recipeIds = rehabRecipeIds.slice(0, 1);`

#### [Dangerous] EC-02 — la rehab 3 séances laisse passer `FULL_*` ou `COND_*`

- **Trigger:** rehab active + `weeklySessions=3` chez `builder` ou `performance`
- **Observed:** le routing rehab ne remplace que les IDs présents dans `UPPER_RECIPE_IDS`/`LOWER_RECIPE_IDS`; `FULL_V1`, `FULL_BUILDER_V1`, `FULL_HYPER_V1`, `COND_OFF_V1`, `COND_PRE_V1` restent intacts
- **Expected:** en rehab, toute séance qui recharge potentiellement la zone blessée devrait être remplacée, neutralisée ou explicitement autorisée
- **Risk:** un joueur rehab lower peut encore recevoir `FULL_V1` ou `COND_OFF_V1`
- **Runtime examples:** `performance lower rehab + in_season -> [UPPER_V1, REHAB_LOWER_P3_V1, FULL_V1]`; `performance lower rehab + off_season -> [UPPER_HYPER_V1, REHAB_LOWER_P3_V1, COND_OFF_V1]`
- **Code:** `src/services/program/buildWeekProgram.ts:42-53`, `src/services/program/buildWeekProgram.ts:83-97`

#### [Broken] EC-03 — `starter + 3 séances` est permis par l'UI, mais le moteur rend toujours 2 séances

- **Trigger:** profil `trainingLevel='starter'`, `weeklySessions=3`
- **Observed:** `STARTER_RECIPE_IDS` contient 2 recettes fixes seulement; l'UI laisse pourtant choisir `2` ou `3` séances. `WeekPage` calcule 3 jours d'entraînement, puis peut lier vers `/session/2`; `SessionDetailPage` affiche alors `Séance introuvable`
- **Expected:** soit bloquer `starter` à 2 séances côté profil, soit générer 3 séances cohérentes
- **Risk:** jour fantôme dans la semaine, navigation cassée, contrat produit incohérent
- **Code:** `src/services/program/buildWeekProgram.ts:33-34`, `src/services/program/buildWeekProgram.ts:92-97`, `src/pages/ProfilePage.tsx:436-447`, `src/pages/WeekPage.tsx:83-87`, `src/pages/WeekPage.tsx:137`, `src/pages/SessionDetailPage.tsx:57`
- **Out-of-contract variant:** `weeklySessions=4` fait planter `buildWeekProgram` avec `recipeIds is not iterable`

#### [Degraded] EC-04 — `builder` ignore complètement `seasonMode`

- **Trigger:** `trainingLevel='builder'` avec `seasonMode='off_season'` ou `pre_season`
- **Observed:** `buildWeekProgram` route systématiquement vers `BUILDER_RECIPE_IDS[profile.weeklySessions]`; le `seasonMode` ne sert qu'aux bannières UI
- **Expected:** soit cacher ce réglage pour builder, soit le faire réellement impacter les recettes
- **Risk:** l'utilisateur croit avoir changé la nature du plan alors que seul le décor change
- **Code:** `src/services/program/buildWeekProgram.ts:37-40`, `src/services/program/buildWeekProgram.ts:92-97`, `src/pages/ProfilePage.tsx:402-433`

### `src/services/program/programPhases.v1.ts`

#### [Broken] EC-05 — une semaine invalide est convertie silencieusement en `POWER / W4 / week 8 / next W1`

- **Trigger:** `week=0`, `week=-1`, `week=NaN`, ou toute valeur hors contrat
- **Observed:** `getPhaseForWeek` tombe sur `POWER`, `getBaseWeekVersion` sur `W4`, `getCycleWeekNumber` sur `8`, `getNextWeek` sur `W1`
- **Expected:** rejet explicite ou retour uniforme `null/error`
- **Risk:** une corruption de state ressemble à une vraie fin de cycle puissance, donc le bug reste invisible
- **Code:** `src/services/program/programPhases.v1.ts:20-25`, `src/services/program/programPhases.v1.ts:27-39`, `src/services/program/programPhases.v1.ts:42-52`, `src/services/program/programPhases.v1.ts:54-67`

### `src/services/program/selectEligibleBlocks.ts`

#### [Broken] EC-06 — `equipment undefined` ou `injuries null` fait tomber le moteur

- **Trigger:** profil incomplet ou corrompu, avec arrays manquants
- **Observed:** `availableEquipment.includes(...)` et `profile.injuries.includes(...)` lèvent immédiatement
- **Expected:** schéma d'entrée strict ou fallback défensif `[]`
- **Risk:** un seul profil mal sérialisé casse toute génération
- **Code:** `src/services/program/selectEligibleBlocks.ts:4-12`, `src/services/program/selectEligibleBlocks.ts:35-47`
- **Note:** `position` manquante est correctement absorbée via le fallback `BACK_ROW`; ce sont bien les arrays qui sont fragiles

### `src/services/program/buildSessionFromRecipe.ts`

#### [Broken] EC-07 — un slot requis peut disparaître et la séance est quand même retournée

- **Trigger:** profils très contraints, par exemple `starter + BW + low_back_pain`, ou `starter + BW + shoulder_pain + rehab upper P1`
- **Observed:** quand aucun bloc n'est trouvé pour un slot requis, le code pousse un warning puis `continue`; la séance reste livrée, parfois sans activation, parfois sans bloc principal
- **Expected:** hard-fail, substitution sûre obligatoire, ou suppression explicite de la séance
- **Risk:** l'utilisateur reçoit une séance incomplète sans stop fort
- **Sweep signal:** `588` combo-weeks avec activation manquante chez `starter`
- **Code:** `src/services/program/buildSessionFromRecipe.ts:362-422`
- **Validator downstream:** `src/services/program/validateSession.ts:36-50`
- **Tests actuels:** `src/services/program/buildWeekProgramEdgeCases.test.ts:15-21`, `src/services/program/buildWeekProgramEdgeCases.test.ts:80-107` documentent ce comportement comme "known limitation" au lieu de le faire échouer

#### [Broken] EC-08 — `FULL_BUILDER_V1` n'a pas le même contrat côté build et côté validation

- **Trigger:** `builder + 3 séances`, surtout si une contrainte pousse un fallback `core` dans `FULL_BUILDER_V1`
- **Observed:** le builder considère `FULL_BUILDER_V1` comme une full-body recipe (2 finishers autorisés), mais le validateur le traite comme une séance non-full (1 finisher max)
- **Expected:** liste de recettes "full" partagée entre génération et validation
- **Risk:** faux positifs qualité, warnings contradictoires, confiance QA dégradée
- **Runtime example:** `builder + shoulder_pain + 3x -> warnings: Session exceeds max finishers (2/1)`
- **Code:** `src/services/program/buildSessionFromRecipe.ts:81-82`, `src/services/program/buildSessionFromRecipe.ts:303-308`, `src/services/program/validateSession.ts:81-87`

#### [Degraded] EC-09 — les égalités de score sont biaisées et la rotation s'arrête aux 3 premiers

- **Trigger:** plusieurs blocs éligibles avec score identique
- **Observed:** tri lexical sur `blockId`, puis rotation limitée à `topN=3`; le 4e bloc ex aequo et au-delà ne sera jamais choisi
- **Expected:** rotation stable sur tout l'ensemble ex aequo, ou seed explicite
- **Risk:** variété artificiellement plafonnée quand la librairie grossit
- **Code:** `src/services/program/buildSessionFromRecipe.ts:141-149`, `src/services/program/buildSessionFromRecipe.ts:197-202`, `src/services/program/buildSessionFromRecipe.ts:229-230`

#### [Degraded] EC-10 — l'ancre `localStorage` peut sauter silencieusement et changer la séance en milieu de semaine

- **Trigger:** localStorage vidé, quota dépassé, mode privé, ou changement de profil qui modifie la clé hashée
- **Observed:** `getAnchor` et `setAnchor` avalent toutes les erreurs et reviennent à "pas d'ancre"
- **Expected:** remonter l'état d'ancre au moteur ou au moins signaler le reset
- **Risk:** le plan semaine et le détail séance peuvent diverger entre deux renders sans avertissement
- **Code:** `src/services/program/buildSessionFromRecipe.ts:257-292`

### `src/services/program/scheduleOptimizer.ts`

#### [Degraded] EC-11 — une date de match invalide est ignorée sans alerte

- **Trigger:** `upcomingMatchDates=['not-a-date']` ou sync calendrier partiellement corrompu
- **Observed:** `new Date(...).getDay()` retourne `NaN`; aucune garde n'existe, donc le match disparaît du scoring
- **Expected:** valider le parsing et rejeter/flagger la date
- **Risk:** suggestions de jours S&C trop proches d'un vrai match
- **Code:** `src/services/program/scheduleOptimizer.ts:107-116`

#### [Cosmetic] EC-12 — le fallback "jours par défaut" est mort pour le contrat actuel 2|3 séances

- **Trigger:** aucun trouvé sur les entrées supportées
- **Observed:** `pickWithMinGap(..., count=2|3, minGap=2)` trouve toujours assez de jours sur 7 jours uniques; le fallback n'est donc pas pris
- **Expected:** soit supprimer la branche, soit tester explicitement le cas futur `4+`
- **Risk:** code mort et faux sentiment de résilience
- **Code:** `src/services/program/scheduleOptimizer.ts:121-131`, `src/services/program/scheduleOptimizer.ts:150-160`
- **Verification:** brute force local sur les `5 040` permutations possibles, aucune ne tombe dans le fallback

---

## 3. Combinaisons Profil Les Plus Fragiles

1. `performance + 3 séances + rehab lower P3 + ACWR critical`
   Observé: `['UPPER_V1']` uniquement. La rehab lower disparaît complètement.

2. `performance + 3 séances + rehab lower P3 + off_season`
   Observé: `['UPPER_HYPER_V1', 'REHAB_LOWER_P3_V1', 'COND_OFF_V1']`. La réhab coexiste avec du conditionnement hors-saison non neutralisé.

3. `starter + 3 séances/semaine`
   Observé: le moteur renvoie 2 séances, mais l'UI en planifie 3 jours. Le 3e slot peut pointer vers une séance inexistante.

4. `starter + BW only + low_back_pain`
   Observé: les deux séances starter peuvent perdre le bloc d'activation; les warnings existent, mais la séance continue quand même.

5. `builder + 3 séances + shoulder_pain`
   Observé: `FULL_BUILDER_V1` peut finir avec deux `core`, que le builder accepte mais que le validateur rejette (`2/1` finishers).

Observation transversale du sweep:
- les profils `builder/performance` en `3 séances` concentrent le plus de safety adaptations (`924` et `700` combo-weeks respectivement)
- les profils `starter` contraints par blessure + faible matériel concentrent les suppressions de slots requis

---

## 4. Branches Mortes Ou Inatteignables

- `src/services/program/scheduleOptimizer.ts:124-131`
  Le fallback `TRAINING_DAYS_DEFAULT` n'est pas atteignable avec `weeklySessions` supporté (`2 | 3`) et `ALL_DAYS` unique.

- `src/services/program/buildSessionFromRecipe.ts:152-160`
  Le paramètre `required` de `shouldRotateIntent(intent, required)` est mort: `void required;` puis aucune branche n'en dépend.

---

## 5. Tests Manquants

- Ajouter un test d'intégration UI `starter + 3 séances` qui vérifie: le profil est clampé à 2, ou la 3e carte/session existe réellement.
- Ajouter un test `rehab lower + critical ACWR` qui impose qu'au moins une séance rehab-compatible survive.
- Ajouter un test `rehab + 3 séances` qui interdit `FULL_*` ou `COND_*` tant que la rehab est active, sauf whitelisting explicite.
- Ajouter des tests de robustesse `programPhases.v1.ts` pour `week=0/-1/NaN/unknown`; le comportement actuel ne doit plus être accepté silencieusement.
- Ajouter une validation d'entrée ou un test schéma sur `UserProfile` (`equipment`, `injuries`) avant appel moteur.
- Ajouter un test de parité build/validate pour `FULL_BUILDER_V1`.
- Ajouter un test scheduler avec `upcomingMatchDates` invalides pour exiger un warning ou une exclusion explicite.
- Remplacer les tests "known limitation" actuels par des tests de régression qui échouent tant qu'une séance requise peut partir sans activation ou sans main block.

---

## 6. Recommandations

### P0 — immédiat

- Corriger le couplage `rehab + critical`: prioriser la séance rehab, puis mobilité, jamais une séance non-rehab par simple ordre d'array.
- Étendre `applyRehabRouting` à `FULL_*` et `COND_*`, ou interdire explicitement ces recettes quand `rehabInjury` est active.
- Bloquer `starter` à 2 séances côté profil, ou implémenter réellement une 3e séance starter.
- Introduire une validation d'entrée du `UserProfile` et du `CycleWeek` avant le pipeline.
- Unifier la définition des recettes "full" entre builder et validator.

### P1 — court terme

- Transformer "slot requis introuvable" en erreur bloquante ou en remplacement safe obligatoire; le `continue` seul est trop permissif.
- Faire de `seasonMode` un vrai driver pour builder, ou retirer ce réglage de l'UI builder.
- Sanitize `upcomingMatchDates` avant scoring, avec warning si parsing impossible.

### P2 — moyen terme

- Remplacer le tie-break lexical + top3 par une rotation sur tout l'ensemble ex aequo.
- Rendre l'état d'ancre observable et stable hors `localStorage` pur.
- Supprimer ou re-spécifier les branches mortes (`scheduleOptimizer` fallback, `required` inutilisé).

---

## 7. Verdict Edge-Case

Le moteur n'est pas "cassé partout"; il est **fragile sur les bords**. Le coeur nominal tient. En revanche, les combinaisons **rehab + fatigue**, **starter + contrat UI**, et **entrées corrompues** exposent des trous nets dans le contrôle de cohérence.

La priorité n'est pas une refonte globale. La priorité est de **fermer les contrats implicites**:
- contrat profil -> moteur
- contrat rehab -> recette
- contrat builder -> validator
- contrat semaine -> phase

Tant que ces contrats restent implicites, chaque nouvelle recette ou nouveau mode va réouvrir les mêmes failles.
