# Implémentation P0 — Quick Spec V2 Microcycle Engine

**Date:** 2026-03-10  
**Baseline commit:** `1e1834582495c95be32e3f36cdc94f5c5ebae4a0`  
**Spec source:** `_bmad-output/planning-artifacts/quick-spec-v2-microcycle-engine-2026-03-10.md`  
**Adversarial source:** `_bmad-output/planning-artifacts/adversarial-review-quick-spec-v2-microcycle-engine-2026-03-10.md`

---

## 1) Résumé des changements implémentés (par ticket QSV2 P0)

### QSV2-001 — Schéma `MicrocycleArchetype`
**Statut:** ✅ Implémenté  
**Livré:**
- `src/types/training.ts`: nouveaux types `MicrocycleArchetypeId`, `SessionRole`, `MatchDayOffset`, `SessionIdentity`, `QualityScorecard`.
- `src/data/microcycleArchetypes.v1.ts`: référentiel V1 des archetypes et slots.

### QSV2-002 — Resolver microcycle
**Statut:** ✅ Implémenté  
**Livré:**
- `src/services/program/resolveMicrocycleArchetype.ts`:
  - résolution archetype,
  - ordering in-season (`lower -> upper -> reste`),
  - contrat match context (`UNKNOWN` si données insuffisantes),
  - construction identity labels.

### QSV2-003 — Session Identity
**Statut:** ✅ Implémenté  
**Livré:**
- `src/services/program/buildSessionFromRecipe.ts`: `BuiltSession.identity`.
- `src/services/program/buildWeekProgram.ts`: identity attachée par session quand flags V2 actifs.
- UI branchée:
  - `src/pages/WeekPage.tsx`
  - `src/pages/SessionDetailPage.tsx`
  - `src/pages/ProgramPage.tsx`

### QSV2-004 — Quality gates hard
**Statut:** ✅ Implémenté  
**Livré:**
- `src/services/program/qualityGates.ts`:
  - détection slots requis manquants,
  - garde rehab/fatigue,
  - garde `starter` (2 séances),
  - garde heavy en `MD-1` (activable seulement avec contexte fiable).
- `src/services/program/buildWeekProgram.ts`:
  - exécution gates,
  - remplacement sessions invalides par fallback recovery explicite,
  - événements `qualityGateEvents`.

### QSV2-005 — Unification rehab + fatigue critical
**Statut:** ✅ Implémenté/renforcé  
**Livré:**
- Cohérence conservée via `safetyContracts` existant + contrôle quality-gate (rehab obligatoire en critical, neutralisation recettes incompatibles).

### QSV2-006 — Contrat d’entrée moteur
**Statut:** ✅ Implémenté/renforcé  
**Livré:**
- Contrats déjà en place conservés (`normalizeProfileInput`, validation week).
- Couverture test maintenue + regression tests verts.

### QSV2-007 — Contrat starter bout-en-bout
**Statut:** ✅ Implémenté/renforcé  
**Livré:**
- Clamp starter conservé,
- contrôle gate starter ajouté,
- tests de non-régression passants.

### QSV2-008 — Scorecard hebdo
**Statut:** ✅ Implémenté  
**Livré:**
- `src/services/program/qualityScorecard.ts`: calcul score axes + overall.
- Intégration `buildWeekProgram.ts`.
- Affichage score hebdo sur WeekPage quand disponible.

### QSV2-009 — Feature flags V2 + rollback
**Statut:** ✅ Implémenté  
**Livré:**
- `src/services/program/policies/featureFlags.ts`: nouveaux flags V2
  - `microcycleArchetypesV2`
  - `sessionIdentityV2`
  - `qualityGatesV2`
  - `qualityScorecardV2`
  - `enforceMatchProximityGateV2`
- Mode legacy préservé par défaut (flags off).

---

## 2) Fichiers modifiés

### Nouveaux fichiers
- `src/data/microcycleArchetypes.v1.ts`
- `src/services/program/resolveMicrocycleArchetype.ts`
- `src/services/program/qualityGates.ts`
- `src/services/program/qualityScorecard.ts`
- `src/services/program/resolveMicrocycleArchetype.test.ts`
- `src/services/program/qualityGates.test.ts`
- `src/services/program/qualityScorecard.test.ts`

### Fichiers modifiés
- `src/types/training.ts`
- `src/services/program/policies/featureFlags.ts`
- `src/services/program/buildSessionFromRecipe.ts`
- `src/services/program/buildWeekProgram.ts`
- `src/services/program/buildWeekProgram.test.ts`
- `src/pages/WeekPage.tsx`
- `src/pages/SessionDetailPage.tsx`
- `src/pages/ProgramPage.tsx`

---

## 3) Résultats tests/lint

### Tests ciblés nouveaux modules
Commande:
```bash
npm run test -- src/services/program/resolveMicrocycleArchetype.test.ts src/services/program/qualityGates.test.ts src/services/program/qualityScorecard.test.ts src/services/program/buildWeekProgram.test.ts
```
Résultat:
- ✅ 4 fichiers
- ✅ 18 tests passés

### Suite complète
Commande:
```bash
npm run test
```
Résultat:
- ✅ 10 fichiers
- ✅ 164 tests passés
- ✅ 0 échec

### Lint
Commande:
```bash
npm run lint
```
Résultat:
- ✅ OK (0 erreur)

### Build (vérification supplémentaire)
Commande:
```bash
npm run build
```
Résultat:
- ✅ OK
- ⚠️ Warnings non bloquants Vite/size déjà présents (pas de blocage compilation).

---

## 4) Écarts restants / bloqueurs

1. **B3 (adversarial): harness tests UI dédié manquant**  
Le plan P0 initial mentionnait des tests page-level (`WeekPage.integration.test.tsx`), mais la stack de test UI n’a pas été ajoutée dans ce lot.  
Impact: couverture P0 essentiellement service-level.

2. **B4 (adversarial): cycle de vie consentement santé mineurs incomplet côté produit**  
Les gates techniques sont en place côté moteur, mais le flux complet UX/legal (collecte/retrait/rétention/audit) n’est pas finalisé dans ce lot.

3. **B7 (adversarial): canary “10%” non opérable tel quel**  
Flags V2 locaux implémentés, mais pas de provider de flags distant pour un vrai split progressif prod.

4. **B8 (adversarial): traçabilité formelle EC-* -> tests CI à finaliser**  
Les tests critiques existent, mais la matrice de traçabilité documentaire et le gate CI explicite “Dangerous/Broken=0” restent à formaliser.

---

## 5) Recommandation pour la vague P1

1. **Activer P1 microcycle sport-specific**
- `QSV2-010` (SPEED_FIELD) puis `QSV2-011` (couplage scheduleOptimizer -> microcycle).

2. **Compléter conformité et gouvernance produit**
- Finaliser flux consentement mineurs/santé (collecte + retrait + rétention + audit).

3. **Renforcer validation qualité release**
- Ajouter matrice `EC-* -> tests` + gate CI objectif (`Dangerous=0`, `Broken=0`).

4. **Lancer test harness UI**
- Installer et configurer tests UI (ou équivalent) pour sécuriser les AC d’affichage identity/scorecard côté pages.

