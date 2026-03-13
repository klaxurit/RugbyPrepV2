# Adversarial Review — Quick Spec Refacto Moteur (Féminines + U18)

**Date:** 2026-03-10  
**Content reviewed:** `/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/quick-spec-refacto-moteur-feminine-u18-2026-03-10.md`

## Résumé

- **Critical:** 4
- **High:** 6
- **Medium:** 3
- **Total findings:** 13

## Findings (classés par sévérité)

### Critical

- **F1 — Gap bloquant persistence/schéma pour les nouveaux champs profil**
  - **Problème:** Le quick spec ajoute des champs `UserProfile` (ex. `populationSegment`, `ageBand`, `parentalConsentHealthData`) mais n’inclut pas les points de persistance réels (`src/hooks/useProfile.ts` mapping row/profile + migrations DB).
  - **Impact:** Les règles P0 “population-aware” ne peuvent pas être alimentées correctement; comportements incohérents entre mémoire, localStorage et Supabase.
  - **Correction recommandée:** Ajouter des tickets P0 explicites pour:
    - `src/hooks/useProfile.ts` (`ProfileRow`, `rowToProfile`, `profileToRow`, `select` SQL),
    - migrations `supabase/migrations/*profiles*.sql`,
    - compatibilité onboarding localStorage.
  - **Évidence:** quick spec lignes 118-135 (nouveaux champs), 8-20 (files_to_modify sans `useProfile`/migrations); `src/hooks/useProfile.ts:119-187,206-210`.

- **F2 — Contradiction hard constraints U18 vs disponibilité data**
  - **Problème:** Le spec impose des hard constraints U18 en P0 (caps match/contact/récupération) alors que l’ingestion charge externe est repoussée en P2.
  - **Impact:** Enforcement impossible en P0 -> soit blocage abusif, soit bypass silencieux; sécurité non garantie.
  - **Correction recommandée:** Soit remonter l’ingestion minimale en P0, soit rendre les contraintes “hard-if-data-complete” avec policy fallback explicite.
  - **Évidence:** quick spec lignes 92-98 (hard constraints), 153-157 (P0 enforcement), 349-356 (ingestion P2).

- **F3 — Plan de tests non exécutable avec la toolchain actuelle**
  - **Problème:** Le quick spec exige des tests `*.test.tsx` et E2E, mais le repo est configuré Vitest `node` avec include `src/**/*.test.ts` uniquement, sans stack E2E.
  - **Impact:** Les critères “tests P0 verts” sont inatteignables; risque de livrer sans vérification réelle.
  - **Correction recommandée:** Ajouter un ticket “infra tests” avant implémentation P0:
    - Vitest `jsdom` + pattern `*.test.tsx`,
    - ou retirer les tests TSX/E2E des gates P0,
    - et définir explicitement l’outil E2E (Playwright/Cypress) si requis.
  - **Évidence:** quick spec lignes 408-419; `vitest.config.ts:4-5`; `package.json:6-17` (aucun script e2e).

- **F4 — Comportement non défini quand une règle hard bloque la génération**
  - **Problème:** L’AC QSP-010 dit “session bloquée ou ajustée” sans contrat de sortie déterministe.
  - **Impact:** Risque de semaines vides, messages incohérents, régressions UI (`WeekPage`, `ProgramPage`, `SessionDetailPage`) et silent failures.
  - **Correction recommandée:** Définir un ordre strict de fallback:
    1. session rehab-compatible,
    2. sinon mobilité/récupération,
    3. sinon état `blocked` typé + raison affichable.
  - **Évidence:** quick spec ligne 264; usage direct de `buildWeekProgram` dans `src/pages/WeekPage.tsx`, `src/pages/ProgramPage.tsx`, `src/pages/SessionDetailPage.tsx`.

### High

- **F5 — Clamp `starter` incomplet: onboarding non couvert**
  - **Problème:** QSP-011 couvre `ProfilePage` mais pas `OnboardingPage`, qui propose toujours 2/3 séances quel que soit le niveau.
  - **Impact:** Le flux onboarding peut recréer l’état invalide immédiatement après correction.
  - **Correction recommandée:** Étendre QSP-011 à `src/pages/OnboardingPage.tsx` + validation serveur/client.
  - **Évidence:** quick spec lignes 267-274; `src/pages/OnboardingPage.tsx:485-488`.

- **F6 — Source of truth segment population absente**
  - **Problème:** Le spec ajoute `populationSegment` mais ne définit pas le mécanisme de collecte/derivation (UI, onboarding, migration, règles de fallback).
  - **Impact:** Une grande partie des utilisateurs restera `unknown`; règles féminines/U18 inopérantes ou mal appliquées.
  - **Correction recommandée:** Ajouter un ticket P0/P1 pour acquisition segment:
    - collecte explicite + consentement,
    - fallback déterministe,
    - validation en entrée.
  - **Évidence:** quick spec ligne 120 (champ) sans ticket de collecte dédié.

- **F7 — Conformité données santé/mineurs sous-spécifiée techniquement**
  - **Problème:** Le spec traite la conformité via booléens profil, sans tâches sur journal de consentement, retention, minimisation analytics, purge.
  - **Impact:** Risque légal et audit trail insuffisant malgré “P0 conformité”.
  - **Correction recommandée:** Ajouter ticket compliance engineering:
    - schéma consent log,
    - politique retention TTL,
    - masquage analytics,
    - stratégie d’effacement.
  - **Évidence:** quick spec lignes 258-265 vs absence de tâches DB/compliance dédiées; recommandations RGPD issues du référentiel FEM-U18.

- **F8 — QSP-013 warmup/cooldown sous-scopé côté moteur**
  - **Problème:** Le ticket liste `types/recipes/blocks/validate`, mais oublie les maps d’intents/fallback dans `buildSessionFromRecipe` et le contrat recette-intents.
  - **Impact:** Incohérence compile/runtime (intents non gérés) ou génération dégradée.
  - **Correction recommandée:** Ajouter `src/services/program/buildSessionFromRecipe.ts` + tests intégrité intents/slots.
  - **Évidence:** quick spec lignes 287-294; `src/services/program/buildSessionFromRecipe.ts:24-57`.

- **F9 — Wrapper `program/suggestions.ts` sans plan de migration call-sites**
  - **Problème:** Le spec propose un wrapper mais ne mandate pas la migration des imports existants.
  - **Impact:** Les soft adaptations cycle/PHV risquent de ne jamais s’appliquer.
  - **Correction recommandée:** Ticket explicite “replace imports” + re-export transitoire.
  - **Évidence:** quick spec ligne 74; imports actuels sur `src/services/ui/suggestions.ts` (SessionView/ProgressPage).

- **F10 — Intégrité contras dépend de modifications JSON manuelles massives**
  - **Problème:** QSP-006 repose sur corrections manuelles dans `blocks.v1.json` sans mécanisme d’auto-correction.
  - **Impact:** Régressions probables à chaque enrichissement contenu.
  - **Correction recommandée:** Ajouter script de génération/synchronisation contraintes bloc<-exercice + check CI bloquant.
  - **Évidence:** quick spec lignes 222-229; taille/variabilité de `src/data/blocks.v1.json`.

### Medium

- **F11 — Plusieurs AC sont non mesurables**
  - **Problème:** Formulations vagues (“visible”, “non homogène”, “objectivable”) sans seuil.
  - **Impact:** “Done” subjectif, QA non reproductible.
  - **Correction recommandée:** Ajouter métriques:
    - score intensité par session,
    - delta min entre sessions hebdo,
    - distribution tags/intent par position.
  - **Évidence:** quick spec lignes 311, 329, 429-431.

- **F12 — Cas `week=NaN` mal ciblé par rapport aux entrées réelles**
  - **Problème:** Le spec cible `NaN`, alors que le flux actuel protège déjà les semaines via `isCycleWeek`.
  - **Impact:** Effort test/développement orienté sur un cas peu réaliste.
  - **Correction recommandée:** Cibler plutôt:
    - string hors enum depuis payload API,
    - corruption localStorage non conforme,
    - absence de week dans routes.
  - **Évidence:** quick spec ligne 210; `src/contexts/weekStorage.ts:6-17`.

- **F13 — Baseline qualité non stabilisée avant durcissement P0**
  - **Problème:** Le repo assume déjà des “known validation issues”; le spec n’ajoute pas explicitement un ticket de résorption préalable.
  - **Impact:** Les nouveaux garde-fous peuvent masquer des régressions ou générer des faux positifs.
  - **Correction recommandée:** Ajouter une tâche “baseline stabilization” avant activation flags P0.
  - **Évidence:** `src/services/program/buildWeekProgramEdgeCases.test.ts:15-21`.

## Changements à faire dans le quick spec avant `quick-dev`

1. Ajouter une **vague P0.0 “fondations data”**:
   - `useProfile.ts` mapping complet des nouveaux champs,
   - migrations `profiles` correspondantes,
   - contract tests row/profile.
2. Résoudre la contradiction U18:
   - soit ingestion minimale charge en P0,
   - soit hard constraints conditionnelles à la complétude data.
3. Ajouter un ticket **“hard-block output contract”** (type retour + UX fallback + affichage raison).
4. Étendre QSP-011 à `OnboardingPage.tsx` + validation persistée.
5. Ajouter ticket **“segment source-of-truth”** (collecte + fallback + validation).
6. Ajouter ticket **“compliance engineering”** (consent log, retention, purge, analytics masking).
7. Étendre QSP-013 à `buildSessionFromRecipe.ts` + tests intents/fallbacks.
8. Ajouter ticket **“migration imports suggestions”** (`ui` -> `program` wrapper/re-export).
9. Ajouter script d’auto-synchronisation contras bloc/exercice (pas seulement test).
10. Durcir ACs avec seuils chiffrés.
11. Aligner plan de tests avec tooling actuel (Vitest config / scripts / E2E réaliste).
12. Ajouter ticket “baseline stabilization” pour fermer les known validation issues avant rollout.

