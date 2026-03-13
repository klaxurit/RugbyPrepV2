# Revue adversariale — Quick Spec V2 Microcycle Engine

**Date:** 2026-03-10  
**Document revu:** `_bmad-output/planning-artifacts/quick-spec-v2-microcycle-engine-2026-03-10.md`

## 1) Findings classés (>=12)

### Critical

1. **[CR-01] Les hard rules MD± sont définies sans chemin de données P0 exécutable**
Problème: le spec impose `forbidHeavyOnMD1` et match proximity en hard (`L67-L69`) mais la collecte/propagation de cette donnée n’est planifiée qu’en P1 via `QSV2-011` (`L251-L258`).  
Impact: les quality gates hard ne peuvent pas être évaluées correctement en P0, ou deviennent arbitraires (faux positifs/faux négatifs).  
Correction: ajouter un ticket P0 dédié “match context contract” (source des dates match, fallback quand absent, mapping `matchDayOffset`) avant activation des gates MD±.

2. **[CR-02] Le data model cible modifie les mauvais propriétaires de types**
Problème: le spec demande d’étendre `BuiltSession` et `WeekProgramResult` dans `src/types/training.ts` (`L94-L95`), alors que ces interfaces sont actuellement définies dans `src/services/program/buildSessionFromRecipe.ts:12-21` et `src/services/program/buildWeekProgram.ts:57-62`.  
Impact: duplication de types, imports divergents, erreurs TypeScript et implémentation incohérente.  
Correction: ajouter un ticket “canonical type ownership” en P0 (choisir un owner unique, migrer imports, supprimer doublons).

3. **[CR-03] Le plan de tests P0 n’est pas exécutable avec la stack actuelle**
Problème: P0 exige des tests UI `WeekPage.integration.test.tsx` (`L317`) alors que `src/pages/__tests__` n’existe pas et que `package.json` ne contient ni `@testing-library/react` ni setup browser/jsdom (`package.json:35-54`).  
Impact: critères P0 non vérifiables, quick-dev bloqué ou livré sans preuves.  
Correction: ajouter un ticket “test harness UI” (deps, env, setup) avant tout AC UI, ou déplacer ces tests en P1 avec un prérequis explicite.

4. **[CR-04] Safety/compliance mineurs incomplète malgré hard constraints**
Problème: le spec impose des gates consentement/santé U18 (`L75-L76`) mais ne définit pas de ticket P0 pour: recueil du consentement, retrait du consentement, politique de rétention/suppression, preuve d’audit.  
Impact: risque conformité (mineurs + données santé) et impossibilité d’activer sereinement les règles hard.  
Correction: ajouter un bloc P0 “consent lifecycle” couvrant UX, stockage, audit trail, retrait et purge.

### High

5. **[H-01] Dépendances incomplètes pour la scorecard**
Problème: `QSV2-008` dépend seulement de `QSV2-004` (`L226`) alors que ses métriques requièrent archetype et identity (`L339-L345`).  
Impact: scorecard calculée sur données partielles, résultats non fiables.  
Correction: ajouter dépendances `QSV2-002` et `QSV2-003` à `QSV2-008`.

6. **[H-02] AC `QSV2-006` ambiguë et non déterministe**
Problème: AC mélange deux comportements incompatibles: “erreur explicite ou clamp” (`L210`).  
Impact: tests non stables, implémentations divergentes selon dev.  
Correction: scinder en règles déterministes par couche (ex: moteur throw typed error, UI clamp en amont) et l’écrire explicitement.

7. **[H-03] AC `QSV2-002` non testable sans oracle métier**
Problème: “ordre slots respecte archetype ... et match proximity” (`L174`) sans table d’attendus par contexte.  
Impact: validation subjective, QA fragile.  
Correction: ajouter une matrice d’oracle (exemples attendus pour 2x/3x, in-season/off-season, match samedi/dimanche).

8. **[H-04] Oubli de fichiers impactés par l’évolution de `WeekProgramResult`**
Problème: le spec cible `WeekPage` et `SessionDetailPage` (`L182`) mais oublie `ProgramPage.tsx`, qui consomme aussi `buildWeekProgram` et ses champs.  
Impact: régression compile/UX partielle en rollout.  
Correction: inclure explicitement `src/pages/ProgramPage.tsx` dans `QSV2-003` et dans les tests d’intégration.

9. **[H-05] Stratégie canary “10%” non implémentable avec les flags actuels**
Problème: rollout propose canary 10% (`L391`) mais la stack flags actuelle est locale/statique (`featureFlags.ts:1-20`).  
Impact: plan de rollout irréaliste, impossible à opérer en production.  
Correction: ajouter ticket P0 “flag provider + audience split” (hash userId ou remote config).

10. **[H-06] Gate de sortie P0 non mappée à des tests exécutables**
Problème: “Dangerous=0 / Broken=0” (`L133`) sans correspondance explicite edge case -> tests CI.  
Impact: décision release non objective.  
Correction: créer une table de traçabilité `EC-* -> test case`, avec seuil CI automatique.

11. **[H-07] Politique de fallback hebdo sous-spécifiée**
Problème: risque “semaines vides” reconnu (`L370`) mais aucun ticket P0 n’impose un contrat minimal de contenu (ex: nombre minimal de séances non-mobility).  
Impact: dégradation UX silencieuse malgré hard gates.  
Correction: ajouter un quality gate hebdo explicite (`min_work_sessions_per_week`) + message utilisateur standardisé.

### Medium

12. **[M-01] Notation de dépendances ambiguë**
Problème: `QSV2-009` utilise `[QSV2-001..QSV2-008]` (`L235`).  
Impact: ambigu pour suivi manuel/outil backlog.  
Correction: lister explicitement toutes les dépendances.

13. **[M-02] Formules scorecard incomplètes**
Problème: métriques utilisent `overlap_index`, `slots_valides`, `population_rule_total` (`L339-L345`) sans définition formelle.  
Impact: scores non reproductibles et manipulables.  
Correction: ajouter spécification mathématique + exemples chiffrés + tests de calcul.

14. **[M-03] Contradiction Hard/Soft sur `SPEED_FIELD`**
Problème: `SPEED_FIELD` est “Hard (P1)” (`L80`) alors que les gates P0 exigent déjà une cohérence structurelle globale.  
Impact: risque faux échec en P0 si la règle est interprétée comme obligatoire immédiatement.  
Correction: clarifier “Hard à partir de P1 uniquement” et exclure ce critère des gates P0.

15. **[M-04] Migration metadata recettes insuffisamment cadrée**
Problème: ajout de metadata `sessionRole`, `allowedIntensities`, etc. (`L96`) sans stratégie de backfill exhaustive recette par recette.  
Impact: trous de data, comportement legacy imprévisible.  
Correction: ajouter un ticket migration data + test d’intégrité “100% recipes have required metadata”.

16. **[M-05] Capture `weeklyLoadContext` non planifiée dans le backlog**
Problème: les caps U18 dépendent de `weeklyLoadContext.*` (`L75`) mais aucun ticket P0 ne décrit comment ce contexte est alimenté de façon fiable depuis calendar/history.  
Impact: hard constraints inopérantes ou basées sur données nulles.  
Correction: ajouter ticket P0 “load context aggregator” avec AC de fraîcheur et fallback.

17. **[M-06] Observabilité planifiée sans tickets d’implémentation**
Problème: monitoring détaillé listé (`L406-L417`) mais aucun ticket backlog dédié instrumentation/dashboard.  
Impact: rollout sans visibilité réelle sur régressions et quality gates.  
Correction: ajouter tickets P0/P1 pour instrumentation + dashboard + alertes.

### Low

18. **[L-01] Incohérence de nommage des événements de gate**
Problème: coexistence de `hardConstraintEvents` (code actuel) et `qualityGateEvents` (spec `L95`) sans règle de convergence.  
Impact: confusion API interne et charge de maintenance.  
Correction: définir un schéma événement unique (`gateEvents`) avec enum typé.

19. **[L-02] Estimations effort optimistes sur des tickets structurants**
Problème: certains tickets structurants (resolver + identity + gates + rollout) sont estimés `S/M` avec impacts multi-couches.  
Impact: risque de sous-estimation planning et dette en quick-dev.  
Correction: rebaser les estimations après découpage technique (spikes courts puis re-chiffrage).

---

## 2) Corrections bloquantes avant `quick-dev`

1. **Bloquant B1** — Ajouter un ticket P0 “match context contract” avant toute gate hard MD± (`CR-01`).
2. **Bloquant B2** — Corriger l’ownership des types (`BuiltSession`, `WeekProgramResult`) et définir l’architecture de types canonique (`CR-02`).
3. **Bloquant B3** — Ajouter setup tests UI (ou déplacer AC UI hors P0) pour rendre le plan testable (`CR-03`).
4. **Bloquant B4** — Ajouter bloc conformité mineurs/santé complet (consent lifecycle + rétention + retrait) avant activation des gates U18 (`CR-04`).
5. **Bloquant B5** — Rendre toutes les AC P0 déterministes (supprimer “ou clamp”, formaliser oracle archetype) (`H-02`, `H-03`).
6. **Bloquant B6** — Ajouter `ProgramPage.tsx` et autres callsites à la liste des fichiers P0 impactés (`H-04`).
7. **Bloquant B7** — Définir une stratégie de flagging opérable (canary réel ou retirer la promesse 10%) (`H-05`).
8. **Bloquant B8** — Traçabilité CI: mapper `EC-*` vers tests concrets et formaliser les gates de release (`H-06`).
9. **Bloquant B9** — Recalculer dépendances tickets (notamment `QSV2-008`) et expliciter toutes les dépendances sans intervalle (`H-01`, `M-01`).

---

## 3) Verdict pré-implémentation

Le quick spec V2 est solide en vision, mais **pas encore prêt pour quick-dev P0** sans les 9 corrections bloquantes ci-dessus.  
En l’état, les principaux risques sont: non-testabilité, faux sentiment de conformité safety/compliance, et dérive d’implémentation due à AC ambiguës.

