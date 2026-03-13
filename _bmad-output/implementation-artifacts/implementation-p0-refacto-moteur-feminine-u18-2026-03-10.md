# Implémentation P0 — Refacto Moteur Féminines + U18

**Date:** 2026-03-10  
**Scope exécuté:** QSP-001 à QSP-012 (P0)  
**Spec source:** `/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/quick-spec-refacto-moteur-feminine-u18-2026-03-10.md`

## 1) Résumé des changements implémentés (par ticket QSP)

- **QSP-001 (DELOAD):** corrigé. `buildWeekProgram` route désormais `DELOAD` vers `RECOVERY_MOBILITY_V1` uniquement (plus de fallback implicite FORCE).
- **QSP-002 (rehab 3 séances):** corrigé. Les recettes `FULL_*` et `COND_*` sont reroutées vers recette rehab quand `rehabInjury` est active.
- **QSP-003 (critical + rehab):** corrigé. En fatigue `critical`, la réduction conserve explicitement une séance rehab-compatible.
- **QSP-004 (normalisation/validation input):** corrigé. Ajout `normalizeProfileInput`, validation stricte semaine, robustesse `injuries/equipment` corrompus.
- **QSP-005 (build/validate FULL_BUILDER):** corrigé. `validateSession` traite `FULL_BUILDER_V1` comme “full recipe” (2 finishers autorisés).
- **QSP-006 (intégrité contras):** corrigé. Ajout test de propagation exercise->block + propagation effective dans `blocks.v1.json`.
- **QSP-007 (code mort):** corrigé. Suppression `src/services/program/buildSession.ts`.
- **QSP-008 (rule constants):** corrigé. Ajout `ruleConstants.v1.ts` et usage dans le moteur.
- **QSP-009 (population profile + safety contracts):** corrigé. Ajout couches `populationRules` + `safetyContracts` branchées dans `buildWeekProgram`.
- **QSP-010 (hard constraints U18/mineurs):** implémenté côté moteur via `weeklyLoadContext` + consent gating + événements hard constraint.
- **QSP-011 (clamp starter):** corrigé. Clamp moteur + UI (`OnboardingPage`, `ProfilePage`) pour empêcher starter 3 séances.
- **QSP-012 (feature flags + telemetry):** implémenté au niveau moteur (flags `population/safety/u18` + retour `hardConstraintEvents`).

## 2) Fichiers modifiés

### Modifiés

- `src/services/program/buildWeekProgram.ts`
- `src/services/program/selectEligibleBlocks.ts`
- `src/services/program/validateSession.ts`
- `src/services/program/programDataIntegrity.test.ts`
- `src/types/training.ts`
- `src/hooks/useProfile.ts`
- `src/pages/ProfilePage.tsx`
- `src/pages/OnboardingPage.tsx`
- `src/data/blocks.v1.json`

### Supprimés

- `src/services/program/buildSession.ts`

### Ajoutés

- `src/services/program/policies/ruleConstants.v1.ts`
- `src/services/program/policies/featureFlags.ts`
- `src/services/program/policies/populationRules.ts`
- `src/services/program/policies/normalizeProfile.ts`
- `src/services/program/policies/safetyContracts.ts`
- `src/services/program/buildWeekProgram.contract.test.ts`
- `src/services/program/safetyContracts.test.ts`
- `src/services/program/validateSession.contract.test.ts`
- `supabase/migrations/20260310190000_profiles_population_safety.sql`

## 3) Résultats de tests / lint / build

- **Tests ciblés P0:** `npx vitest run ...` -> **PASS** (137 puis 138 tests après ajout flag fallback)
- **Suite complète tests:** `npm run test` -> **PASS** (6 fichiers, 138 tests)
- **Lint:** `npm run lint` -> **PASS**
- **Build typecheck + prod:** `npm run build` -> **PASS**
- **Warnings build non bloquants:** warning CSS minify (`file` unknown property) + warning bundle >500KB (pré-existant, non P0).

## 4) Écarts restants / bloqueurs

- **Télémetry produit QSP-012 partielle:** `hardConstraintEvents` est disponible côté moteur, mais la remontée analytics UI/BI n’est pas encore branchée.
- **QSP-010 dépend de la qualité data profil:** les hard constraints U18 s’appliquent si `weeklyLoadContext`/consentement sont renseignés; il manque encore un flux UI complet de saisie guidée.
- **Tests integration UI/e2e non ajoutés en P0:** la stack actuelle de tests est orientée services (`src/**/*.test.ts`), pas d’infra E2E en place.
- **Conformité approfondie (journal consentement/rétention/purge):** migration de champs réalisée, mais gouvernance complète RGPD/santé à compléter en P1/P2.

## 5) Prochaine vague recommandée (P1)

1. **QSP-013 + QSP-014:** warm-up/cooldown obligatoires + quality floor explicite.
2. **QSP-015 + QSP-016:** ondulation intra-semaine + couplage MD±.
3. **QSP-017:** renforcement différenciation poste (effet mesurable).
4. **QSP-018 + QSP-019:** cycle symptom-driven opt-in + PHV caution.
5. **QSP-020:** enrichissement contenu builder/COD/contact prep.

Ordre recommandé: `QSP-013 -> QSP-014 -> QSP-015 -> QSP-016 -> QSP-017 -> QSP-018 -> QSP-019 -> QSP-020`.
