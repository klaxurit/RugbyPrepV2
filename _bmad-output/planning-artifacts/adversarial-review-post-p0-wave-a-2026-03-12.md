# Revue Adversariale Post-P0 Vague A

**Date** : 2026-03-12
**Reviewer** : Audit adversarial automatise
**Perimetre** : 7 hypotheses implementees (H1, H2, H3, H4, H5, H6, H10), 22 tests Wave A, 10 fichiers modifies
**Methode** : Lecture exhaustive du code, croisement avec les 3 documents de reference (audit scientifique, calibration statistique, hypothesis roadmap), verification des assertions de test, recherche de lacunes et regressions silencieuses

---

## Verdict

**GO CONDITIONNEL** pour la Vague B -- sous reserve de corriger les 3 findings **Critical** et les 3 findings **High** identifies ci-dessous. Les 7 hypotheses P0 sont implementees et les tests passent, mais plusieurs implementations sont cosmetiques ou insuffisamment protegees. Le moteur est plus solide qu'avant la Vague A, mais des chemins de code contournent les nouvelles protections.

---

## Findings

### F-01 [CRITICAL] classifyACWR boundary off-by-one : ACWR=1.3 classe "optimal", ACWR=1.5 classe "caution" au lieu de "danger"

**Fichier** : `src/hooks/useACWR.ts:77-84`

**Probleme** : La fonction `classifyACWR()` utilise `<=` pour les comparaisons :
```
if (acwr <= cautionThreshold) return 'optimal'   // cautionThreshold = 1.3
if (acwr <= dangerThreshold) return 'caution'     // dangerThreshold = 1.5
if (acwr <= criticalThreshold) return 'danger'    // criticalThreshold = 2.0
```

Pour ACWR = **exactement 1.3** : `1.3 <= 1.3` = true, retourne **'optimal'**. Correct d'apres la KB (1.3 est la limite haute du sweet spot).

Pour ACWR = **exactement 1.5** : `1.5 <= 1.5` = true, retourne **'caution'**. **Incorrect** : la KB dit >=1.5 = danger (Hulin 2016 : risque x2.12). Un joueur a exactement 1.5 ne recoit qu'un warning au lieu d'un remplacement de seance.

Pour ACWR = **exactement 2.0** : `2.0 <= 2.0` = true, retourne **'danger'**. **Incorrect** : le commentaire dans `ruleConstants.v1.ts:5` dit ">=2.0 critical", mais `classifyACWR` retourne 'danger' et non 'critical'. Un joueur a 2.0 conserve 2 seances au lieu d'etre reduit a 1.

**Impact** : Les seuils exacts sont les plus dangereux (par definition, ils marquent la transition de risque), et c'est precisement la ou le comportement est faux. Deux boundary values sur trois sont mal classees.

**Correction recommandee** : Utiliser `<` au lieu de `<=` pour `dangerThreshold` et `criticalThreshold` :
```
if (acwr <= cautionThreshold) return 'optimal'
if (acwr < dangerThreshold) return 'caution'
if (acwr < criticalThreshold) return 'danger'
return 'critical'
```

**Aucun test existant ne couvre les valeurs limites exactes 1.3, 1.5, 2.0.** Les tests TA-06/07/08 utilisent les niveaux de fatigue comme strings ('caution', 'danger', 'critical') et ne testent jamais `classifyACWR` directement.

---

### F-02 [CRITICAL] Le volume budget (H6) est un warning-only derriere un feature flag desactive par defaut -- il ne bloque rien

**Fichier** : `src/services/program/qualityGates.ts:220-236`, `src/services/program/policies/featureFlags.ts:20`

**Probleme** : Le budget volume (H6) est implemente comme un event dans `evaluateQualityGates()`. Mais `evaluateQualityGates()` n'est appele que si `featureFlags.qualityGatesV2 === true` (`buildWeekProgram.ts:315`). Or `qualityGatesV2` est **`false` par defaut** dans `DEFAULT_PROGRAM_FEATURE_FLAGS`.

En production, le budget volume n'est jamais evalue. Un starter a W4 recoit 13 sets (depasse le cap de 10 de 30%) sans aucun avertissement.

De plus, meme quand le flag est actif, le volume budget n'ajoute le session index dans `invalidSessionIndexes` -- il se contente d'un `events.push()` et d'un `warnings.push()`. La session n'est pas remplacee. Le volume cap est donc purement decoratif dans tous les cas.

**Impact** : L'hypothese H6 du roadmap specifiait "warning d'abord, pas de blocage" (acceptable en MVP), MAIS le rapport d'implementation annonce "budget volume gate" comme si c'etait une protection effective. Un utilisateur qui active `qualityGatesV2` verra un warning mais la session debordante sera quand meme delivree telle quelle. Un utilisateur en production par defaut ne verra rien du tout.

**Correction recommandee** :
1. Evaluer le budget volume en dehors de `qualityGatesV2` (en faire un check standalone toujours actif, ou creer un flag dedie `volumeBudgetV1`).
2. Documenter explicitement que c'est un warning non-bloquant dans le rapport d'implementation (actuellement absent).

---

### F-03 [CRITICAL] L'injection ACL feminine (H5) ne filtre pas par niveau d'entrainement et ignore les contraindications

**Fichier** : `src/services/program/buildWeekProgram.ts:287-312`

**Probleme** : L'injection post-build du bloc ACL (`BLK_PREHAB_ACL_PREVENT_01`) fait un `allBlocks.find()` directement sur la liste globale de blocs, sans passer par `selectEligibleBlocks()`. Le filtre inline est minimaliste :
```typescript
b.intent === 'prehab' &&
b.tags.includes('knee_health') &&
b.equipment.every((eq) => eq === 'none' || profile.equipment.includes(eq))
```

Ce code ne verifie **pas** :
- Le **niveau d'entrainement** (un profil starter pourrait recevoir un bloc non-starter)
- Les **contraindications** (le bloc `BLK_PREHAB_ACL_PREVENT_01` a `low_back_pain` en contraindication -- une femme avec low_back_pain recevra quand meme ce bloc)
- Les **contraindications des exercices** composant le bloc

Par chance, `BLK_PREHAB_ACL_PREVENT_01` est tague `none` en equipment et n'a pas de tag `starter`/`builder`, donc le filtrage equipment et niveau fonctionnent "par accident" pour ce bloc specifique. Mais la contraindication `low_back_pain` n'est pas verifiee.

**Impact** : Une joueuse feminine avec `low_back_pain` recevra un bloc `hamstring_bridge_iso__single_leg + glute_bridge` malgre la contraindication explicite. C'est un risque de blessure direct.

**Correction recommandee** : Utiliser `selectEligibleBlocks(profile, allBlocks)` comme pool de recherche au lieu de `allBlocks`. Ou au minimum, verifier les contraindications contre `profile.injuries`.

---

### F-04 [HIGH] Le deload structure (H1) utilise `getPerformanceRecipeIds()` pour les profils off_season/pre_season, donnant des recettes inattendues

**Fichier** : `src/services/program/buildWeekProgram.ts:141-156`

**Probleme** : `getDeloadRecipeIds()` appelle `getPerformanceRecipeIds()` qui contient des overrides par `seasonMode` :
```typescript
if (profile.seasonMode === 'off_season') return ['LOWER_HYPER_V1', 'UPPER_HYPER_V1', 'COND_OFF_V1']
if (profile.seasonMode === 'pre_season') { ... return ['LOWER_V1', 'UPPER_V1', 'COND_PRE_V1'] }
```

Pour un profil performance 3x off_season, le deload structure utilisera `LOWER_HYPER_V1` comme session structuree + 2 mobilites. C'est coherent avec le block periodization (le deload doit maintenir le stimulus de la phase courante).

MAIS pour un profil performance 3x pre_season avec focus speed, le deload structure utilisera `LOWER_V1` -- qui est une session de force, pas de vitesse. Le deload ne reflete pas le focus actuel.

Plus problematique : pour un profil performance off_season 3x, la session structuree est `LOWER_HYPER_V1` (hypertrophie). Quand le `buildSessionFromRecipe` recoit `week === 'DELOAD'` converti en `'W1'`, les blocs hypertrophie sont joues en version W1. C'est correct en volume, mais la phase envoyee a `getSessionPhase()` est calculee avec `week === 'DELOAD'` qui retourne `null` puis fallback `FORCE`. La session recoit des phase preferences FORCE mais la recette est HYPER -- les preferences de phase et la recette sont desalignees.

**Impact** : En deload off_season, les blocs sont scores avec des preferences FORCE (via `getSessionPhase` qui fallback sur FORCE quand phase=null) alors que la recette est HYPER. Cela ne crash pas mais produit un scoring incoherent. Les blocs selectionnes seront ceux qui matchent le plus de tags `force, hinge, squat` plutot que `hypertrophy, push, pull` -- ce qui est l'inverse de ce qu'on veut pour maintenir le stimulus hypertrophie en deload.

**Correction recommandee** : `getSessionPhase()` pour le DELOAD devrait utiliser la phase de la recette structuree, pas le fallback FORCE. Ou passer un override de phase preferences au build de la session structuree DELOAD.

---

### F-05 [HIGH] Les tests TA-17 et TA-18 (H6 volume budget) sont des no-op qui passeraient meme si H6 n'existait pas

**Fichier** : `src/services/program/waveA.test.ts:239-261`

**Probleme** :

TA-17 :
```typescript
expect(result.qualityGateEvents).toBeDefined()
```
Cela verifie que `qualityGateEvents` est un tableau (il l'est toujours, c'est declare comme `string[]` dans `WeekProgramResult`). Le test ne verifie **pas** qu'il y a un evenement de depassement volume. Il passe meme si le budget volume est completement supprime du code.

TA-18 :
```typescript
expect(result.sessions.length).toBeGreaterThanOrEqual(1)
```
Cela verifie qu'il y a au moins 1 session. C'est un test de non-crash, pas un test de volume budget. Il passerait identiquement sans la moindre ligne de H6.

**Impact** : L'hypothese H6 n'a aucune couverture de test effective. Le rapport d'implementation compte 2 tests pour H6, mais ces 2 tests sont des placeholders qui ne verifient rien de specifique.

**Correction recommandee** :
- TA-17 : Verifier que `qualityGateEvents` contient un event `quality:volume-exceeded:*` pour un profil starter a W4 avec `qualityGatesV2: true`.
- TA-18 : Verifier que pour chaque niveau, le nombre total de sets par session respecte les caps declares dans `RULE_CONSTANTS_V1.volume`.

---

### F-06 [HIGH] Les tests H4 (U18 flags) ne testent pas le chemin par defaut -- ils passent des champs explicites dans le profil

**Fichier** : `src/services/program/waveA.test.ts:174-202`

**Probleme** : TA-13 cree un profil avec `ageBand: 'u18'` et `weeklyLoadContext: { contactHighMinutesWeek: 20 }`. Le test verifie que les hard caps sont actifs. Mais le test ne verifie pas le scenario ou un profil U18 arrive **sans** `ageBand` explicite -- par exemple un profil avec uniquement `populationSegment: 'u18_male'`.

De plus, `resolvePopulationContext` dans `populationRules.ts:20-24` determine `isU18` via `resolveAgeBand`, qui lit `profile.ageBand` en priorite. Si un utilisateur n'a jamais renseigne `ageBand` (undefined), le code tombe dans `segment === 'u18_female' || segment === 'u18_male'` pour deviner. Mais si `populationSegment` est aussi absent, le profil U18 echappe completement aux protections (segment = 'unknown', ageBand = 'adult', isU18 = false).

Le test TA-14 configure `parentalConsentHealthData: false` mais aussi `ageBand: 'u18'`. Que se passe-t-il si `ageBand` est absent mais `populationSegment` est 'u18_male'?

**Impact** : Les feature flags H4 sont actives par defaut, mais si les champs de profil ne sont pas correctement renseignes cote utilisateur, un mineur passe entre les mailles du filet. Le test ne couvre que le happy path.

**Correction recommandee** : Ajouter un test avec `ageBand: undefined, populationSegment: 'u18_male'` pour verifier la detection automatique. Ajouter un test avec `ageBand: undefined, populationSegment: undefined` pour verifier le fallback a 'adult' (meme si c'est faux, c'est le comportement actuel -- au moins on le documente).

---

### F-07 [MEDIUM] Le deload structure (H1) a du code mort : variable `n` calculee deux fois identiquement

**Fichier** : `src/services/program/buildWeekProgram.ts:151-153`

**Probleme** :
```typescript
const n = trainingLevel === 'builder'
  ? profile.weeklySessions
  : profile.weeklySessions;
```

Les deux branches du ternaire retournent la meme valeur. C'est du code mort qui trahit une intention inachevee. L'auteur prevoyait probablement un nombre de sessions different pour builder vs performance en deload, mais ne l'a pas implemente.

**Impact** : Pas de bug fonctionnel, mais c'est du bruit dans le code qui rend la revue plus difficile et masque potentiellement une logique manquante.

**Correction recommandee** : Remplacer par `const n = profile.weeklySessions;` ou implementer la logique differenciee prevue.

---

### F-08 [MEDIUM] L'injection ACL (H5) append le bloc a la fin de `sessions[0].blocks` -- pas a sa position semantique correcte

**Fichier** : `src/services/program/buildWeekProgram.ts:307`

**Probleme** : `sessions[0]!.blocks.push({ block: aclBlock, version })` ajoute le bloc prehab ACL apres le dernier bloc de la session (qui est typiquement un cooldown ou un finisher). Dans l'ordre d'une session, le prehab devrait apparaitre avant les finishers et le cooldown, idéalement apres le travail principal.

**Impact** : UX degrade -- le joueur voit un exercice de prevention ACL apres le cooldown. Ce n'est pas un risque de blessure mais c'est une incoherence structurelle qui erode la credibilite du programme.

**Correction recommandee** : Inserer le bloc ACL avant le premier finisher ou cooldown de la session au lieu de l'appender a la fin. Ou mieux : injecter le slot directement dans la recette avant le build (plus propre structurellement).

---

### F-09 [MEDIUM] Le warmup mandatory (H3) depend de `required: false` dans toutes les recettes -- un changement de recette pourrait casser silencieusement

**Fichier** : `src/services/program/buildSessionFromRecipe.ts:360-369`

**Probleme** : La logique de warmup mandatory repose sur ce code :
```typescript
if (
  (step.intent === 'warmup' || step.intent === 'cooldown') &&
  !step.required &&
  !shouldIncludeOptionalPrepIntent(step.intent, recipe, profile, sessionIntensity)
) {
  continue;
}
```

La condition `!step.required` signifie que `shouldIncludeOptionalPrepIntent` n'est evalue que si le warmup est `required: false`. Si quelqu'un modifie une recette pour mettre `required: true` sur le warmup, la logique H3 est contournee mais le warmup est inclus de toute facon (par le chemin standard `required`).

Le probleme inverse est plus subtil : si `shouldIncludeOptionalPrepIntent` retourne `true` (ce qu'elle fait toujours hors RECOVERY_MOBILITY et REHAB_P1), le `continue` n'est jamais execute, et on passe dans le `chooseBlockByIntent` standard. Si aucun bloc warmup n'est eligible (par exemple, tous les blocs warmup necessitent du materiel que le profil n'a pas), le warmup est silencieusement saute sans warning.

Les tests TA-09/10/11 ne verifient pas ce scenario (profil sans aucun bloc warmup eligible).

**Impact** : Un profil extremement contraint (BW only + blessures multiples) pourrait ne pas recevoir de warmup malgre H3. Le test ne le detectera pas car il verifie uniquement des profils standards.

**Correction recommandee** : Ajouter un warning quand `shouldIncludeOptionalPrepIntent` retourne `true` mais aucun bloc warmup n'est trouve. Ajouter un test pour un profil BW-only avec blessures.

---

### F-10 [MEDIUM] Le scoring intensite x2 (H10) peut creer des inversions inattendues sur les blocs avec le tag 'force'

**Fichier** : `src/services/program/buildSessionFromRecipe.ts:128-137`

**Probleme** : Le tag `force` apparait a la fois dans :
- `HEAVY_PREFS.preferTags` (intensity prefer : +2)
- `LIGHT_PREFS.avoidTags` (intensity avoid : -2)
- `PHASE_PREFERENCES.FORCE.preferTags` (phase prefer : +3)

Pour une session **light** (HYPERTROPHY phase via DUP) avec recette FULL_V1, un bloc tague `force` recoit :
- Phase HYPERTROPHY prefer : 0 (pas de tag hypertrophy dans le bloc)
- Intensity light avoid `force` : **-2**
- Mais le bloc est aussi le seul eligible pour un slot `force required`

Le slot `force` de FULL_V1 est `required: true`. Le bloc force recoive un malus de -2 de l'intensite, ce qui le fait perdre face a un bloc hypertrophy dans le scoring, MAIS le bloc est recherche par intent `force` d'abord. L'intensite ne change pas l'intent -- elle change le scoring au sein du meme intent.

Donc l'inversion est limitee aux cas ou il y a plusieurs blocs du meme intent avec des tags differents. Dans ce cas, le doublement du scoring pourrait faire remonter un bloc force "leger" (si tague `prehab` ou `neural`) au-dessus d'un bloc force "pur" dans une session heavy.

**Impact** : Faible en pratique pour le cataloge actuel de blocs. Mais le doublement rend le systeme plus sensible aux ajouts futurs de blocs mal tagges.

**Correction recommandee** : Documenter ce comportement et ajouter un test de non-regression qui verifie que la session heavy selectionne le bloc avec le score le plus eleve pour l'intent `force`.

---

### F-11 [MEDIUM] Aucun test ne verifie le deload pour builder 2x -- seul performance et starter sont testes

**Fichier** : `src/services/program/waveA.test.ts:12-63`

**Probleme** : Les tests H1 (TA-01 a TA-05) couvrent :
- `createProfile()` = performance 3x (TA-01, TA-02, TA-04)
- `createProfile({ weeklySessions: 2 })` = performance 2x (TA-03)
- `createProfile({ trainingLevel: 'starter', weeklySessions: 2 })` = starter 2x (TA-05)

Il manque :
- **Builder 2x** en DELOAD : le code passe par `BUILDER_RECIPE_IDS[profile.weeklySessions]` pour la session structuree. Est-ce que `LOWER_BUILDER_V1` fonctionne correctement en version W1?
- **Builder 3x** en DELOAD : `FULL_BUILDER_V1` est utilise. Est-ce que les cross-session exclusions interagissent correctement avec le deload?
- **Performance off_season** en DELOAD : la session structuree est `LOWER_HYPER_V1` (voir F-04).

**Impact** : 3 chemins de code non testes pour le deload. Le builder 3x en DELOAD produit 1 session `LOWER_BUILDER_V1` + 2 mobilites. Pas de test le confirme.

**Correction recommandee** : Ajouter TA-03b (builder 2x DELOAD) et TA-04b (builder 3x DELOAD).

---

### F-12 [MEDIUM] Le test TA-19 (H10 minimum quality threshold) ne verifie pas que la session degradee est effectivement remplacee

**Fichier** : `src/services/program/waveA.test.ts:263-280`

**Probleme** :
```typescript
expect(result.sessions.length).toBeGreaterThanOrEqual(1)
```

C'est un test de non-crash. Il ne verifie pas que :
1. Le quality gate `no-main-work` a ete declenche
2. La session sans main work a ete remplacee par `RECOVERY_MOBILITY_V1`
3. Le remplacement est effectif dans `result.sessions`

Le profil teste (starter + shoulder_pain + BW) est connu pour produire une session safety-adapted avec 0 main work. Mais le test ne verifie meme pas si `qualityGateEvents` contient `quality:no-main-work`.

**Impact** : L'hypothese H10 n'a pas de verification effective. Le test passerait identiquement si tout le code H10 etait supprime.

**Correction recommandee** : Verifier `result.qualityGateEvents.some(e => e.startsWith('quality:no-main-work'))` ou verifier qu'une session a ete remplacee par `RECOVERY_MOBILITY_V1`.

---

### F-13 [LOW] La constante `RULE_CONSTANTS_V1.deload.maxSessions` n'est jamais utilisee

**Fichier** : `src/services/program/policies/ruleConstants.v1.ts:13`

**Probleme** : `maxSessions: 1` est declare dans la section `deload` mais n'est jamais reference dans aucun fichier du moteur. La logique de deload dans `getDeloadRecipeIds()` utilise directement `profile.weeklySessions` pour determiner le nombre de sessions.

**Impact** : Code mort, confusion potentielle. Un developpeur pourrait croire que `maxSessions` limite le nombre de sessions structurees en deload, mais c'est ignore.

**Correction recommandee** : Supprimer la constante ou l'utiliser explicitement dans `getDeloadRecipeIds()`.

---

### F-14 [LOW] Le rapport d'implementation annonce "22 nouveaux tests" mais il n'y en a que 21 dans waveA.test.ts

**Fichier** : `_bmad-output/implementation-artifacts/implementation-wave-a-p0-2026-03-12.md:11`

**Probleme** : Le rapport dit "22 nouveaux tests dedies Wave A" mais le fichier `waveA.test.ts` contient TA-01 a TA-19 (19 tests) + TR-01, TR-03, TR-05 (3 tests de regression) = **21 tests**. Le rapport en compte 22, ce qui ne correspond ni au code ni au tableau recapitulatif du rapport (qui liste 21 lignes). La ligne TA-05 et TR-05 sont des tests distincts meme s'ils partagent le numero 05 dans des groupes differents.

**Impact** : Erreur cosmetique dans le rapport, pas d'impact fonctionnel.

**Correction recommandee** : Corriger le chiffre dans le rapport.

---

### F-15 [LOW] La detection du segment feminin pour H5 est dupliquee et fragile

**Fichier** : `src/services/program/buildWeekProgram.ts:289`

**Probleme** :
```typescript
const isFemale = population.segment === 'female_senior' || population.segment === 'u18_female';
```

Cette verification est faite apres le build des sessions, independamment de `resolvePopulationContext`. Si un nouveau segment feminin est ajoute (ex: `female_veteran`), il faudra penser a mettre a jour cette ligne en plus de `populationRules.ts`. Un predicat `population.isFemale` dans `PopulationContext` eviterait cette duplication.

**Impact** : Risque de regression si un nouveau segment est ajoute. Faible a court terme.

**Correction recommandee** : Ajouter `isFemale: boolean` dans `PopulationContext` et l'utiliser dans `buildWeekProgram.ts`.

---

## Cas limites NON testes

| Combinaison | Risque | Raison |
|---|---|---|
| Feminine + low_back_pain + DELOAD | F-03 : injection ACL sans check contraindication | Non teste |
| Builder 3x + off_season + DELOAD | F-04 + F-11 : recette HYPER en deload + scoring FORCE | Non teste |
| Profil U18 sans ageBand ni populationSegment | F-06 : echappe aux hard caps | Non teste |
| Profil BW-only sans bloc warmup eligible | F-09 : warmup silencieusement saute | Non teste |
| ACWR exactement 1.5 / exactement 2.0 | F-01 : boundary error | Non teste |
| Performance off_season 2x + DELOAD | Deload utilise LOWER_HYPER_V1 en W1 | Non teste |
| Starter en deload avec quality gates V2 | Volume cap + deload + starter interactions | Non teste |
| Feminine + rehab active | H5 injection + rehab routing interaction | Non teste |
| Performance 3x in-season + ACWR danger + DELOAD | ACWR et deload ne devraient pas se cumuler, mais c'est possible | Non teste |

---

## Synthese des findings par severite

| Severite | Count | IDs |
|---|---|---|
| **Critical** | 3 | F-01, F-02, F-03 |
| **High** | 3 | F-04, F-05, F-06 |
| **Medium** | 6 | F-07, F-08, F-09, F-10, F-11, F-12 |
| **Low** | 3 | F-13, F-14, F-15 |
| **Total** | **15** | |

---

## Fixes bloquants avant Vague B

Les 6 items suivants **doivent** etre corriges avant de demarrer la Vague B :

| # | Finding | Action | Effort estime |
|---|---|---|---|
| 1 | F-01 | Corriger `classifyACWR` : `<` au lieu de `<=` pour danger et critical. Ajouter 3 tests boundary (1.3, 1.5, 2.0). | 0.5j |
| 2 | F-02 | Activer le volume budget check en dehors du flag `qualityGatesV2` (ou activer le flag par defaut). Documenter le comportement warning-only. | 0.5j |
| 3 | F-03 | Utiliser `selectEligibleBlocks()` pour l'injection ACL, ou au minimum verifier `profile.injuries` contre `block.contraindications`. Ajouter test feminine + low_back_pain. | 0.5j |
| 4 | F-05 | Reecrire TA-17 et TA-18 avec des assertions qui verifieraient le depassement volume reel. | 0.5j |
| 5 | F-06 | Ajouter test U18 avec `ageBand: undefined` + `populationSegment: 'u18_male'`. | 0.25j |
| 6 | F-12 | Reecrire TA-19 pour verifier le declenchement effectif du quality gate et le remplacement de session. | 0.25j |

**Total effort : ~2.5 jours**

Les findings Medium (F-07 a F-11) sont souhaitables mais non bloquants. Les findings Low (F-13 a F-15) sont du nettoyage post-Vague B.

---

## Verdict final

**GO CONDITIONNEL pour la Vague B** : les 3 Critical + 3 High representent environ 2.5 jours de correctifs. Les 7 hypotheses P0 sont structurellement implementees et les 180 tests de regression restent verts. Mais 3 des 7 hypotheses ont des protections contournables (H6 derriere un flag inactif, H5 sans check contraindication, H2 avec boundary off-by-one dans le hook ACWR). La Vague B ne doit pas demarrer tant que ces 6 items ne sont pas resolus et couverts par des tests non-triviaux.

---

*Fin de la revue adversariale. Ce document est un outil de decision -- il ne modifie aucun code.*
