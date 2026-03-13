# Revue Adversariale Post-P1 — Vague B

**Date** : 2026-03-12
**Reviewer** : Audit automatise (adversarial)
**Baseline** : implementation-wave-b-p1-2026-03-12.md + code actuel
**Perimetre** : H8 (position scoring), H9 (deload 3:1), H11 (U18 cap W2), H12 (ACWR caution W1)

---

## Findings

### F-B01 [CRITICAL] — H8 : Le poids +5 s'applique aux tags PHASE en plus des tags POSITION

**Probleme** : Le rapport dit que H8 passe le poids position de +3 a +5. Mais dans `scoreBlock()` (ligne 123), le parametre `preferTags` recoit la concatenation `[...positionPreferences.preferTags, ...phasePreferences.preferTags]` (ligne 423). Le +5 s'applique donc aux **deux sources** de tags — position ET phase. PHASE_PREFERENCES.FORCE contient 7 tags ; chaque match donne +5 au lieu de +3. Le score phase a augmente de +21 max a +35 max, soit un gain de +14 points non prevu.

**Impact** : La phase devient encore plus dominante qu'avant (+35 vs +35 position pour FRONT_ROW = 6 tags). L'objectif de H8 etait de rendre la position plus differenciante *relativement* a la phase, mais les deux ont augmente proportionnellement. L'ecart relatif position/phase est inchange. Les tests TB-03/TB-04 passent par accident parce que FRONT_ROW et BACK_THREE ont des tags tres differents, mais pour des paires plus proches (BACK_ROW vs CENTERS), la differentiation sera nulle.

**Fichiers** :
- `src/services/program/buildSessionFromRecipe.ts:120-126` (scoreBlock +5 sur preferTags)
- `src/services/program/buildSessionFromRecipe.ts:423` (concatenation position+phase)

**Correction recommandee** : Separer le scoring position et phase dans `scoreBlock()` avec des poids distincts : `positionScore = +5`, `phaseScore = +3`. Passer les deux arrays separement en parametres.

---

### F-B02 [HIGH] — H9 : `getNextWeek(W3)` retourne W4 — la navigation frontend ignore le 3:1 in-season

**Probleme** : Le deload 3:1 in-season est applique dans `buildWeekProgram` quand `week === 'W3'` (ou W7, H3). Mais `getNextWeek('W3')` dans `programPhases.v1.ts:103` retourne `'W4'`, pas `'DELOAD'`. Le frontend (ProgramPage, WeekPage) utilise `getNextWeek` pour avancer dans le cycle. Un joueur in-season qui avance apres W3 recevra W4 (semaine normale, pas deload), contredisant la logique du moteur qui traite W3 comme un deload.

**Impact** : Incoherence UX : la semaine W3 affiche un deload (warning "Deload 3:1"), mais le joueur avance vers W4 qui est une semaine de peak intensity. Le ratio effectif redevient 4:1 dans l'experience utilisateur. Le H9 est cosmetique sans mise a jour de `getNextWeek`.

**Fichiers** :
- `src/services/program/programPhases.v1.ts:103` (`W3 -> W4`)
- `src/services/program/buildWeekProgram.ts:168-172` (logique deload 3:1)

**Correction recommandee** : Modifier `getNextWeek` pour que, en contexte `in_season + performance`, W3 saute directement a W5 (ou DELOAD), W7 a DELOAD, H3 a DELOAD. Cela necessite de passer le profil en parametre ou de creer une variante `getNextWeekInSeason`.

---

### F-B03 [HIGH] — H9 + H12 collision : ACWR caution sur une semaine auto-deload W3

**Probleme** : Si un profil `performance + in_season` est a W3 avec ACWR=1.4 (caution), deux mecanismes se declenchent :
1. `isInSeasonAutoDeload = true` → routing deload (1 structuree W1 + mobilites)
2. H12 ACWR caution → `versionW1OverrideIndexes` sur la derniere seance

Le resultat : la derniere seance (deja une mobilite RECOVERY_MOBILITY_V1) recoit un override W1. Mais la session de mobilite est deja en W1 par defaut. Le warning ACWR "version W1" est trompeur car il n'a aucun effet reel sur une session mobilite.

**Impact** : Warning parasite dans l'UI. Le joueur voit "ACWR vigilance : volume reduit" alors que la semaine est deja un deload. Confusion fonctionnelle sans danger, mais mauvaise UX.

**Fichiers** :
- `src/services/program/buildWeekProgram.ts:168-172, 269`
- `src/services/program/policies/safetyContracts.ts:191-194`

**Correction recommandee** : Dans `buildWeekProgram`, si `isInSeasonAutoDeload`, ne pas appliquer le W1 override (la semaine est deja allegee). Ou dans `safetyContracts`, verifier si les recettes passees sont deja des deload recipes avant d'emettre le caution.

---

### F-B04 [HIGH] — H11 : U18 + deload in-season W3 = version W1 mais event dit "capped to W2"

**Probleme** : Un profil U18 + performance + in_season a la semaine W3 declenche :
1. H11 : `u18VersionCapped = true` → `u18CappedWeek = 'W2'`, event `hard:u18-version-cap:W3:W2`
2. H9 : `isInSeasonAutoDeload = true` → `effectiveWeek = 'W1'` (ligne 269, priorite deload)

Le code a la ligne 269 donne la priorite au deload (`isDeloadWeek` verifie en premier). Le resultat est correct (W1), mais l'event et le warning U18 disent "version plafonnee a W2" alors que la version reelle est W1. Information trompeuse.

**Impact** : Logs de debug et warnings UI mensongers. Le joueur/coach voit "U18 : version W2" mais recoit W1. Pas de danger, mais erosion de la confiance dans les messages du moteur.

**Fichiers** :
- `src/services/program/buildWeekProgram.ts:242-248, 269-275`

**Correction recommandee** : Conditionner l'emission de l'event/warning U18 a `!isDeloadWeek`. Ou emettre un event plus precis : `hard:u18-version-cap:W3:W1 (deload override)`.

---

### F-B05 [HIGH] — H11 : Aucun test U18 avec profil incomplet (`ageBand: undefined`, `populationSegment: undefined`)

**Probleme** : TB-08 a TB-09c testent tous des profils avec `ageBand: 'u18'` et/ou `populationSegment: 'u18_male'` explicites. Il n'y a aucun test de H11 (version cap) pour un profil ou les champs sont absents ou corrompus (ex: `ageBand: undefined, populationSegment: undefined`). Les tests TA-14d de Wave A couvrent le cas "pas de caps U18" pour un profil incomplet, mais H11 n'a pas d'equivalent.

**Impact** : Un mineur dont le profil est incomplet (onboarding partiel, donnee corrompue en BDD) ne sera pas detecte comme U18. Il recevra des versions W3/W4 peak. Le risque est le meme que F-06 de la review P0 — la surface d'attaque n'a pas ete fermee pour H11 specifiquement.

**Fichiers** :
- `src/services/program/waveA.test.ts` (TB-08 a TB-09c)
- `src/services/program/buildWeekProgram.ts:240-248`

**Correction recommandee** : Ajouter TB-09d : profil `ageBand: undefined, populationSegment: undefined` a W3 → confirmer que les versions W3 sont presentes (pas de cap abusif). Ajouter TB-09e : profil `ageBand: undefined, populationSegment: 'u18_male'` a W3 → confirmer le cap a W2.

---

### F-B06 [HIGH] — Rapport Wave B dit "5 items P1" mais n'en liste que 4

**Probleme** : Le resume du rapport Wave B (ligne 11) annonce "5 items P1 implementes" et cite "H8, H12, H9, H11, et mise a jour TA-06". Mais la mise a jour de TA-06 n'est pas un item P1 — c'est une modification de test existant. Le tableau de detail ne contient que 4 sections (H8, H12, H9, H11). La correspondance "5 items" n'existe pas.

**Impact** : Erreur de reporting qui fausse le tracking du roadmap. Si un stakeholder se fie au compte "5 items", le delta avec le roadmap (qui definit 7 items P1 : H7, H8, H9, H11, H12, H10, P1-4 RTP) est masque.

**Fichiers** :
- `_bmad-output/implementation-artifacts/implementation-wave-b-p1-2026-03-12.md:11`

**Correction recommandee** : Corriger a "4 items P1 implementes (H8, H9, H11, H12)". H7 (intensite +2/-2) et H10 (scoring intensite recalibre) ont ete faits en Wave A, les mentionner comme prerequis deja livres.

---

### F-B07 [MEDIUM] — H8 : TB-03/TB-04 testent uniquement FRONT_ROW vs BACK_THREE (paires extremes)

**Probleme** : Le roadmap H8 definit le seuil d'acceptation comme ">=3 paires de postes differenciees sur 6". Les tests TB-03 et TB-04 ne verifient que FRONT_ROW vs BACK_THREE — les deux postes les plus polarises du spectre (avants lourds vs arriere rapides). Les paires plus proches (BACK_ROW vs CENTERS, SECOND_ROW vs BACK_ROW) ne sont pas testees. Avec le bug F-B01 (phase +5), ces paires proches ont probablement 0 differentiation.

**Impact** : Le critere de succes du roadmap (>=3 paires) n'est pas verifie par les tests. TB-03/TB-04 passent mais ne prouvent pas que H8 atteint son objectif.

**Fichiers** :
- `src/services/program/waveA.test.ts:498-541` (TB-03, TB-04)
- `_bmad-output/planning-artifacts/hypothesis-roadmap-moteur-2026-03-12.md:124-126`

**Correction recommandee** : Ajouter TB-03b (BACK_ROW vs CENTERS) et TB-03c (HALF_BACKS vs BACK_THREE) pour verifier la differentiation sur des paires proches. Documenter le resultat meme s'il echoue (seuil rejet <2 paires → decision P2).

---

### F-B08 [MEDIUM] — H9 : Pas de test starter/builder a W3 in-season pour verifier l'exclusion

**Probleme** : La logique H9 exclut starter et builder (`trainingLevel === 'performance'`). Mais les tests TB-05 a TB-07b ne verifient que des profils performance. Il n'y a aucun test negatif confirmant qu'un builder in-season a W3 ne recoit PAS le deload 3:1.

**Impact** : Si un refactoring futur supprime la condition `trainingLevel === 'performance'`, le deload 3:1 s'appliquera aux builders (qui ont des cycles fixes). Aucun test ne detecterait cette regression.

**Fichiers** :
- `src/services/program/waveA.test.ts:543-589` (TB-05 a TB-07b)
- `src/services/program/buildWeekProgram.ts:169-172`

**Correction recommandee** : Ajouter TB-05b : builder + in_season + W3 → pas de deload 3:1.

---

### F-B09 [MEDIUM] — H12 : Aucun test boundary exact a ACWR 1.29 et 1.30

**Probleme** : Le rapport Wave B mentionne les bornes 1.29/1.30/1.49/1.50 comme points de verification critiques. Les tests Wave A (TA-20 a TA-25) couvrent les boundaries de `classifyACWR` (1.3, 1.31, 1.49, 1.5). Mais les tests H12 (TB-10, TB-11, TB-11b) utilisent `fatigueLevel: 'caution'` directement, pas un ACWR numerique. Il n'y a aucun test end-to-end qui injecte un ACWR=1.30 et verifie qu'il est classifie `optimal` (pas `caution`) puis que le programme n'est PAS modifie.

**Impact** : La classification 1.30 = optimal depend de `classifyACWR` dans `useACWR.ts` (hook React). Le moteur `buildWeekProgram` recoit un `fatigueLevel` pre-classifie. Le test de la borne 1.30 en E2E (hook → moteur) n'existe pas. Un bug dans le hook ne serait pas detecte par les tests moteur.

**Fichiers** :
- `src/hooks/useACWR.ts` (classifyACWR)
- `src/services/program/waveA.test.ts` (TB-10, TB-11)

**Correction recommandee** : Ajouter un test d'integration qui appelle `classifyACWR(1.30)` puis passe le resultat a `buildWeekProgram` via `fatigueLevel`, verifiant le comportement end-to-end.

---

### F-B10 [MEDIUM] — H9 : Double deload possible W3 auto + DELOAD explicite W4

**Probleme** : En in-season, W3 est un auto-deload (H9). Mais `getNextWeek('W3')` retourne W4, et `getNextWeek('W4')` retourne DELOAD. Si le frontend suit la progression classique (W3 → W4 → DELOAD), le joueur recevra :
- W3 : auto-deload (1 structuree + mobilites)
- W4 : semaine peak (normal)
- DELOAD : semaine deload explicite (1 structuree + mobilites)

Le joueur a donc 2 semaines de deload sur un cycle de 5 semaines (W1, W2, W3-deload, W4, DELOAD). Le ratio effectif est 2:2:1, pas 3:1. Pire : si `getNextWeek` est corrige (F-B02), W3 → skip → mais ensuite le cycle H/W ne correspond plus.

**Impact** : Perte de stimulus cumulative. La periodisation 3:1 *in-season* implique que W4 et le DELOAD explicite n'existent plus — le cycle devrait etre W1→W2→W3(deload)→W5 ou equivalent. Sans modification de la progression de cycle, le 3:1 ajoute un deload sans supprimer l'ancien.

**Fichiers** :
- `src/services/program/programPhases.v1.ts:98-112`
- `src/services/program/buildWeekProgram.ts:168-172`

**Correction recommandee** : Definir la progression in-season 3:1 comme W1→W2→W3(deload)→W5→W6→W7(deload) en sautant W4/W8. Creer `getNextWeekForProfile` qui tient compte du seasonMode et trainingLevel.

---

### F-B11 [MEDIUM] — H11 : TB-08 teste W3 et W4 mais H9 transforme W3 en deload pour performance in-season

**Probleme** : TB-08 itere sur `['W3', 'W4', 'H3', 'H4', 'W7', 'W8']` pour verifier que U18 n'a jamais de version W3/W4. Mais le profil par defaut est `performance + in_season`. Pour W3 et W7, H9 declenche le deload 3:1, et toutes les versions sont W1 (pas W2 comme attendu par le cap U18). Le test passe parce que W1 est dans `['W1', 'W2']`, mais il ne teste pas reellement le cap U18 — il teste le deload.

Pour H3, meme probleme : H3 est dans `IN_SEASON_DELOAD_WEEKS`, donc les versions sont W1.

**Impact** : TB-08 est un faux positif pour 3 des 6 semaines testees (W3, H3, W7). Le cap U18 n'est reellement valide que sur W4, H4, W8. La couverture reelle est 3/6, pas 6/6.

**Fichiers** :
- `src/services/program/waveA.test.ts:593-612` (TB-08)

**Correction recommandee** : Pour les semaines W3/W7/H3 dans TB-08, utiliser `seasonMode: 'off_season'` (ou `trainingLevel: 'builder'`) pour isoler le cap U18 du deload 3:1. Ou separer en deux tests : un pour les semaines auto-deload, un pour les semaines non-deload.

---

### F-B12 [LOW] — H12 : `versionW1OverrideIndexes` n'est pas valide quand l'index pointe vers une recette rehab

**Probleme** : Si un profil a `rehabInjury` actif + ACWR caution, la derniere recette peut etre une recette REHAB (ex: `REHAB_UPPER_P2_V1`). Le W1 override s'applique sur cette recette rehab. Les recettes rehab ont des versions specifiques et le W1 peut ne pas etre le plus leger (certains blocs rehab n'ont que W1).

**Impact** : Pas de degradation fonctionnelle (le W1 est toujours la version minimale). Mais le warning "version W1 = volume reduit" est mensonger si le bloc rehab n'a qu'une version W1 — aucune reduction n'a lieu.

**Fichiers** :
- `src/services/program/policies/safetyContracts.ts:191-194`

**Correction recommandee** : Accepter comme comportement normal. Documenter dans les risques residuels.

---

### F-B13 [LOW] — Absence de test H9 avec rehab actif

**Probleme** : Aucun test ne combine H9 (deload 3:1 in-season) avec un profil `rehabInjury` actif. Le routing rehab remplace UPPER/LOWER/FULL par des recettes REHAB. Quand H9 s'active (W3 in-season), `getDeloadRecipeIds()` prend la premiere recette des `normalRecipes` (qui a ete reecrite par le rehab routing en amont). Le comportement est probablement correct (le rehab routing passe avant le deload routing via `applySafetyContracts`), mais l'interaction n'est pas verifiee.

**Impact** : Risque de regression non couvert. Si l'ordre des operations change, un profil rehab a W3 pourrait perdre son routing rehab.

**Fichiers** :
- `src/services/program/buildWeekProgram.ts:174-180`
- `src/services/program/policies/safetyContracts.ts:138-140`

**Correction recommandee** : Ajouter TB-05c : profil performance + in_season + rehabInjury lower + W3 → verifier que le deload inclut la recette rehab.

---

### F-B14 [LOW] — Le rapport Wave A annonce H10 comme "scoring intensite recalibre" mais le roadmap definit H10 comme "seuil qualite minimum"

**Probleme** : Le rapport Wave A (implementation-wave-a-p0-2026-03-12.md, ligne 68) decrit H10 comme "Scoring intensite recalibre" (+1→+2 intensite). Mais dans le roadmap (hypothesis-roadmap-moteur-2026-03-12.md, §2 H10), H10 est defini comme "Le seuil qualite minimum evite les sessions degradees". Le doublement de l'intensite correspond a H7 dans le roadmap. Il y a un decalage de numerotation entre le roadmap et l'implementation Wave A.

**Impact** : Confusion dans le tracking. Le H7 du roadmap (intensite +2/-2) a ete fait en Wave A sous le label H10. Le H10 du roadmap (seuil qualite minimum) a ete partiellement fait dans la meme wave (TA-19, quality gate no-main-work). La traçabilite hypothese → implementation est rompue.

**Fichiers** :
- `_bmad-output/implementation-artifacts/implementation-wave-a-p0-2026-03-12.md:68`
- `_bmad-output/planning-artifacts/hypothesis-roadmap-moteur-2026-03-12.md:148-157`

**Correction recommandee** : Corriger les IDs dans le rapport Wave A pour aligner sur le roadmap. H10 Wave A = H7 roadmap. Le vrai H10 (quality gate minimum) = TA-19/TA-19b.

---

## Resume des findings

| ID | Severite | Hypothese | Resume |
|---|---|---|---|
| F-B01 | **CRITICAL** | H8 | Phase scoring aussi monte a +5 (devait etre position seul) |
| F-B02 | **HIGH** | H9 | `getNextWeek` ignore le 3:1 → le frontend contourne le deload |
| F-B03 | **HIGH** | H9+H12 | ACWR caution sur auto-deload = warning parasite |
| F-B04 | **HIGH** | H11+H9 | U18 cap event dit W2 mais version reelle est W1 (deload) |
| F-B05 | **HIGH** | H11 | Aucun test U18 avec profil incomplet pour le version cap |
| F-B06 | **HIGH** | Reporting | "5 items" annonces, 4 livres |
| F-B07 | **MEDIUM** | H8 | Tests uniquement sur paires extremes (FRONT_ROW vs BACK_THREE) |
| F-B08 | **MEDIUM** | H9 | Pas de test negatif builder/starter a W3 |
| F-B09 | **MEDIUM** | H12 | Pas de test boundary E2E a ACWR 1.30 |
| F-B10 | **MEDIUM** | H9 | Double deload W3(auto) + DELOAD(cycle) = ratio 2:2:1 |
| F-B11 | **MEDIUM** | H11 | TB-08 faux positif : 3/6 semaines testent le deload, pas le cap U18 |
| F-B12 | **LOW** | H12 | W1 override sur recette rehab = no-op silencieux |
| F-B13 | **LOW** | H9 | Pas de test deload 3:1 + rehab combine |
| F-B14 | **LOW** | Reporting | Numerotation H7/H10 inversee entre roadmap et Wave A |

---

## Verdict

### **GO CONDITIONNEL pour Vague C**

Le moteur est fonctionnellement correct dans les cas nominaux. Les 235 tests passent. Mais 1 finding CRITICAL (F-B01) et 5 findings HIGH montrent des ecarts entre l'intention du roadmap et l'implementation reelle. Le scoring position+phase fusionne a +5 (F-B01) invalide potentiellement l'hypothese H8. La navigation de cycle (F-B02, F-B10) rend H9 cosmetique.

---

## Fixes bloquants avant Vague C

| Priorite | Finding | Action |
|---|---|---|
| **BLOQUANT** | F-B01 | Separer le scoring position (+5) et phase (+3) dans `scoreBlock()`. Passer deux arrays distincts. Revalider TB-03/TB-04 + ajouter paires proches. |
| **BLOQUANT** | F-B02 | Creer `getNextWeekForProfile(week, profile)` qui gere le saut W3→W5 en in-season performance. |
| **BLOQUANT** | F-B10 | Definir la progression de cycle in-season 3:1 sans double deload. |
| **FORT** | F-B11 | Corriger TB-08 pour isoler le cap U18 du deload 3:1 (utiliser off_season pour les semaines W3/W7/H3). |
| **FORT** | F-B03 | Supprimer l'emission du warning caution quand la semaine est deja un deload. |
| **FORT** | F-B04 | Conditionner le warning U18 a `!isDeloadWeek`. |

---

## Items P1 restants ou partiellement implementes

| Item roadmap | Statut | Detail |
|---|---|---|
| H7 (intensite +2/-2) | Fait en Wave A (sous label H10) | Traçabilite a corriger |
| H8 (position +5) | **Partiellement** | Phase aussi a +5 (F-B01) — non conforme a l'intention |
| H9 (deload 3:1) | **Partiellement** | Moteur OK, progression de cycle non mise a jour (F-B02, F-B10) |
| H10 (seuil qualite min) | Fait en Wave A | TA-19, TA-19b OK |
| H11 (U18 cap W2) | Fait | Tests partiellement faux positifs (F-B11) |
| H12 (ACWR caution W1) | Fait | Collisions mineures avec deload (F-B03) |
| P1-4 (criteres RTP UI) | **Non fait** | Reporte a P2 dans le rapport Wave B. Decision a valider. |
| Quality gates always-on | **Non fait** | Reporte a P2. Volume budget always-on (F-02 fix) mais les autres gates restent derriere flag. |

---

*Fin de la revue adversariale.*
