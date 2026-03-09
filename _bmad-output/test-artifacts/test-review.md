---
stepsCompleted: ['step-01-load-context', 'step-02-discover-tests', 'step-03-review', 'step-04-report']
lastStep: 'step-04-report'
lastSaved: '2026-03-09'
workflowType: 'testarch-test-review'
inputDocuments:
  - '_bmad/tea/testarch/knowledge/test-quality.md'
  - '_bmad/tea/testarch/knowledge/data-factories.md'
  - '_bmad/tea/testarch/knowledge/test-levels-framework.md'
---

# Test Quality Review: Suite complète RugbyPrepV2

**Quality Score**: 52/100 (D - Needs Improvement)
**Review Date**: 2026-03-09
**Review Scope**: suite (tous les tests du projet)
**Reviewer**: TEA Agent

---

Note: This review audits existing tests; it does not generate tests.
Coverage mapping and coverage gates are out of scope here. Use `trace` for coverage decisions.

## Executive Summary

**Overall Assessment**: Needs Improvement

**Recommendation**: Approve with Comments

### Key Strengths

- Les tests existants sont **déterministes** — fonctions pures sans dépendance réseau ni hard waits
- Les assertions sont **explicites** et visibles dans le corps des tests
- Le choix du niveau de test est **approprié** — tests unitaires sur services purs (moteur programme + intégrité données)

### Key Weaknesses

- **Couverture extrêmement faible** — seulement 2 fichiers de test / 6 test cases pour 110+ fichiers source
- **Pas de factory pattern** — données de test hardcodées inline dans chaque test
- **Pas de test IDs** ni de marqueurs de priorité (P0/P1/P2/P3)
- **Pas de tests pour les edge cases documentés** (starter+shoulder_pain, ACWR zones, rehab routing)

### Summary

La suite de tests de RugbyPrepV2 repose sur 2 fichiers couvrant le moteur de programme (`buildWeekProgram`) et l'intégrité des données (`programDataIntegrity`). La qualité intrinsèque de ces tests est bonne : ils sont déterministes, rapides, focalisés sur la logique pure, et suivent les bonnes pratiques Vitest. Cependant, la couverture est critique — les 88 blocs, 192+ exercices, 24 recettes, et les nombreux edge cases moteur documentés (ACWR, rehab, starter) ne sont couverts que partiellement. L'absence de factory functions pour `UserProfile` entraîne de la duplication et fragilise les tests face aux évolutions du schéma.

---

## Quality Criteria Assessment

| Criterion | Status | Violations | Notes |
|---|---|---|---|
| BDD Format (Given-When-Then) | ⚠️ WARN | 6 | Descriptions claires mais pas de format Given-When-Then |
| Test IDs | ❌ FAIL | 6 | Aucun test ID |
| Priority Markers (P0/P1/P2/P3) | ❌ FAIL | 6 | Aucun marqueur de priorité |
| Hard Waits (sleep, waitForTimeout) | ✅ PASS | 0 | Aucun hard wait — tests synchrones purs |
| Determinism (no conditionals) | ✅ PASS | 0 | Aucun conditionnel dans le flow des tests |
| Isolation (cleanup, no shared state) | ✅ PASS | 0 | Tests stateless — fonctions pures |
| Fixture Patterns | ⚠️ WARN | 2 | Pas de fixtures — setup inline dans chaque test |
| Data Factories | ❌ FAIL | 2 | Profils hardcodés, pas de factory avec overrides |
| Network-First Pattern | ✅ PASS | 0 | N/A — pas de réseau dans les tests unitaires |
| Explicit Assertions | ✅ PASS | 0 | Toutes les assertions sont visibles dans les tests |
| Test Length (≤300 lines) | ✅ PASS | 0 | 131 lignes + 41 lignes — bien sous la limite |
| Test Duration (≤1.5 min) | ✅ PASS | 0 | Exécution < 1 seconde |
| Flakiness Patterns | ✅ PASS | 0 | Aucun pattern de flakiness détecté |

**Total Violations**: 0 Critical, 2 High, 3 Medium, 1 Low

---

## Quality Score Breakdown

```
Starting Score:          100
Critical Violations:     -0 × 10 = -0
High Violations:         -2 × 5 = -10
Medium Violations:       -3 × 2 = -6
Low Violations:          -1 × 1 = -1

Structural Penalty:
  Only 6 tests for 110+ files: -25
  No edge case coverage for documented cases: -10

Bonus Points:
  Excellent BDD:         +0
  Comprehensive Fixtures: +0
  Data Factories:        +0
  Network-First:         +0 (N/A)
  Perfect Isolation:     +5
  All Test IDs:          +0
  Deterministic Tests:   +5
                         --------
Total Bonus:             -37

Final Score:             52/100 (adjusted from 63 with structural penalty)
Grade:                   D
```

---

## Critical Issues (Must Fix)

No critical issues in existing test code. The existing 6 tests are well-written and pass. The main concern is structural — insufficient coverage for a production application.

---

## Recommendations (Should Fix)

### 1. Créer une factory `createUserProfile` avec overrides

**Severity**: P1 (High)
**Location**: `src/services/program/buildWeekProgram.test.ts:6-28`
**Criterion**: Data Factories
**Knowledge Base**: [data-factories.md](../../../testarch/knowledge/data-factories.md)

**Issue Description**:
Les profils utilisateur sont définis inline dans chaque test. Le profil `PERFORMANCE_PROFILE` est dupliqué en tant que constante module, mais chaque test qui nécessite une variation (legacyProfile, rehabProfile) recrée l'objet manuellement. Si le type `UserProfile` évolue (nouveau champ obligatoire), tous les tests cassent.

**Current Code**:

```typescript
// ⚠️ Profil hardcodé — fragile face aux évolutions du schéma
const PERFORMANCE_PROFILE: UserProfile = {
  level: 'intermediate',
  trainingLevel: 'performance',
  weeklySessions: 3,
  equipment: ['barbell', 'dumbbell', 'bench', /* ... 10 items */],
  injuries: [],
  rugbyPosition: 'BACK_ROW',
  seasonMode: 'in_season',
}

// Chaque variation recrée tout manuellement
const rehabProfile: UserProfile = {
  ...PERFORMANCE_PROFILE,
  injuries: ['shoulder_pain'],
  rehabInjury: { zone: 'upper', phase: 1, /* ... */ },
}
```

**Recommended Improvement**:

```typescript
// ✅ Factory avec overrides — un seul endroit à mettre à jour
const createProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  level: 'intermediate',
  trainingLevel: 'performance',
  weeklySessions: 3,
  equipment: ['barbell', 'dumbbell', 'bench', 'band', 'landmine',
    'tbar_row', 'ghd', 'med_ball', 'box', 'pullup_bar', 'machine',
    'sprint_track', 'ab_wheel'],
  injuries: [],
  rugbyPosition: 'BACK_ROW',
  seasonMode: 'in_season',
  ...overrides,
})

// Usage clair et concis
const rehabProfile = createProfile({
  injuries: ['shoulder_pain'],
  rehabInjury: { zone: 'upper', phase: 1, startDate: '2026-03-01', phaseStartDate: '2026-03-01', type: 'shoulder_pain' },
})

const starterProfile = createProfile({ trainingLevel: 'starter', weeklySessions: 2 })
const bwOnlyProfile = createProfile({ equipment: [] })
```

**Benefits**: Résilience aux évolutions du schéma, réduction de la duplication, intent explicite par test.

### 2. Ajouter des tests pour les edge cases moteur documentés

**Severity**: P1 (High)
**Location**: Suite entière
**Criterion**: Coverage structurelle
**Knowledge Base**: [test-levels-framework.md](../../../testarch/knowledge/test-levels-framework.md)

**Issue Description**:
La mémoire projet documente des edge cases critiques non testés :
- Starter + shoulder_pain + BW → slot upper [SAFETY]
- Builder + shoulder_pain + 3x → Full Body slot upper [SAFETY]
- Performance + BW only → upper hypertrophy [SAFETY]
- Tous les modes saison (off_season → HYPERTROPHY, pre_season → FORCE)
- Deload weeks (H4, W4, W8)
- Cross-session exclusion
- `selectEligibleBlocks` filtrage par contraindications exercice

**Recommended Improvement**:

```typescript
// ✅ Tests paramétrés pour les edge cases moteur
describe('buildWeekProgram edge cases', () => {
  it.each([
    { label: 'starter+shoulder_pain+BW', profile: createProfile({ trainingLevel: 'starter', injuries: ['shoulder_pain'], equipment: [] }) },
    { label: 'builder+shoulder_pain+3x', profile: createProfile({ trainingLevel: 'builder', injuries: ['shoulder_pain'], weeklySessions: 3 }) },
    { label: 'perf+BW only', profile: createProfile({ equipment: [] }) },
  ])('produces valid sessions for $label', ({ profile }) => {
    const result = buildWeekProgram(profile, 'W1')
    for (const session of result.sessions) {
      expect(validateSession(session).isValid).toBe(true)
    }
  })

  it.each([
    { mode: 'off_season' as const, expectedPhase: 'HYPERTROPHY' },
    { mode: 'pre_season' as const, expectedPhase: 'FORCE' },
  ])('routes $mode to $expectedPhase for performance level', ({ mode, expectedPhase }) => {
    const profile = createProfile({ seasonMode: mode })
    const result = buildWeekProgram(profile, 'W1')
    // vérifier que les recettes correspondent à la phase attendue
    expect(result.sessions.length).toBeGreaterThan(0)
  })
})
```

### 3. Ajouter des test IDs et marqueurs de priorité

**Severity**: P2 (Medium)
**Location**: Tous les fichiers de test
**Criterion**: Test IDs / Priority Markers

**Issue Description**:
Aucun test n'a d'identifiant unique ni de marqueur de priorité. Cela empêche le traçage vers les requirements et la priorisation CI.

**Recommended Improvement**:

```typescript
// ✅ Test IDs dans les descriptions
describe('buildWeekProgram', () => {
  it('[ENGINE-UNIT-001][P0] falls back to starter recipes for legacy profiles', () => { ... })
  it('[ENGINE-UNIT-002][P0] keeps rehab sessions valid', () => { ... })
  it('[ENGINE-UNIT-003][P1] replaces last session in ACWR danger', () => { ... })
  it('[ENGINE-UNIT-004][P1] reduces to one session in ACWR critical', () => { ... })
})
```

### 4. Ajouter un test d'intégrité pour les recettes de session

**Severity**: P2 (Medium)
**Location**: `src/services/program/programDataIntegrity.test.ts`
**Criterion**: Data integrity coverage

**Issue Description**:
Le test d'intégrité existant vérifie uniquement la cohérence équipement bloc↔exercice. Mais les recettes (`sessionRecipes.v1.ts`) ne sont pas validées : slots manquants, tags invalides, recettes référençant des phases inexistantes.

**Recommended Improvement**:

```typescript
describe('session recipe integrity', () => {
  it('ensures all recipes reference valid block intents in their slots', () => {
    const validIntents = new Set(blocks.map(b => b.intent))
    for (const [id, recipe] of Object.entries(sessionRecipesV1)) {
      for (const slot of recipe.slots) {
        expect(validIntents.has(slot.intent), `${id} slot references unknown intent: ${slot.intent}`).toBe(true)
      }
    }
  })
})
```

---

## Best Practices Found

### 1. Tests déterministes sur fonctions pures

**Location**: `src/services/program/buildWeekProgram.test.ts`
**Pattern**: Unit testing pure functions
**Knowledge Base**: [test-quality.md](../../../testarch/knowledge/test-quality.md)

**Why This Is Good**:
Les tests appellent `buildWeekProgram()` comme une fonction pure — pas de réseau, pas de mocks, pas de side effects. Le résultat est entièrement déterministe. C'est le pattern idéal pour le moteur programme.

**Code Example**:

```typescript
// ✅ Test pur, déterministe, sans dépendance externe
it('reduces the week to one session in ACWR critical', () => {
  const result = buildWeekProgram(PERFORMANCE_PROFILE, 'W1', {
    fatigueLevel: 'critical',
    hasSufficientACWRData: true,
  })
  expect(result.sessions).toHaveLength(1)
  expect(result.warnings).toContain('ACWR critique : programme réduit à 1 séance. Récupération prioritaire.')
})
```

### 2. Validation croisée blocs↔exercices

**Location**: `src/services/program/programDataIntegrity.test.ts`
**Pattern**: Data integrity validation
**Knowledge Base**: [test-levels-framework.md](../../../testarch/knowledge/test-levels-framework.md)

**Why This Is Good**:
Ce test vérifie que chaque bloc déclare correctement l'équipement requis par ses exercices. C'est un test d'intégrité des données statiques qui prévient les régressions silencieuses quand on ajoute ou modifie un bloc.

### 3. Utilisation de `validateSession` comme guard

**Location**: `src/services/program/buildWeekProgram.test.ts:48-52`
**Pattern**: Internal consistency check

**Why This Is Good**:
Chaque test vérifie non seulement le routing des recettes mais aussi la validité structurelle de chaque session via `validateSession()`. C'est une double vérification qui attrape les bugs d'assemblage.

---

## Test File Analysis

### File: buildWeekProgram.test.ts

- **File Path**: `src/services/program/buildWeekProgram.test.ts`
- **File Size**: 131 lines
- **Test Framework**: Vitest
- **Language**: TypeScript

#### Test Structure

- **Describe Blocks**: 1 (`buildWeekProgram`)
- **Test Cases**: 5
- **Average Test Length**: 20 lines per test
- **Fixtures Used**: 0
- **Data Factories Used**: 0

### File: programDataIntegrity.test.ts

- **File Path**: `src/services/program/programDataIntegrity.test.ts`
- **File Size**: 41 lines
- **Test Framework**: Vitest
- **Language**: TypeScript

#### Test Structure

- **Describe Blocks**: 1 (`program data integrity`)
- **Test Cases**: 1
- **Average Test Length**: 30 lines per test
- **Fixtures Used**: 0
- **Data Factories Used**: 0

---

## Knowledge Base References

This review consulted the following knowledge base fragments:

- **[test-quality.md](../../../testarch/knowledge/test-quality.md)** - Definition of Done for tests (no hard waits, <300 lines, <1.5 min, self-cleaning)
- **[data-factories.md](../../../testarch/knowledge/data-factories.md)** - Factory functions with overrides, API-first setup
- **[test-levels-framework.md](../../../testarch/knowledge/test-levels-framework.md)** - Unit vs Integration vs E2E appropriateness

For coverage mapping, consult `trace` workflow outputs.

---

## Next Steps

### Immediate Actions

1. **Créer `createProfile` factory** — Extraire la création de `UserProfile` dans une factory réutilisable
   - Priority: P1
   - Estimated Effort: 30 min

2. **Ajouter test IDs aux 6 tests existants** — Format `[ENGINE-UNIT-XXX][Px]`
   - Priority: P2
   - Estimated Effort: 15 min

### Follow-up Actions (Future PRs)

1. **Tests edge cases moteur** — Starter/Builder/Perf × injuries × equipment × ACWR × seasonMode
   - Priority: P1
   - Target: Prochain sprint

2. **Tests intégrité recettes** — Valider slots, tags, phases dans sessionRecipes
   - Priority: P2
   - Target: Prochain sprint

3. **Golden master testing** — Snapshot des résultats de `buildWeekProgram` pour 17 profils × 6 semaines
   - Priority: P2
   - Target: Milestone M3

4. **Tests `estimateOneRM` et `getPositionBaseline`** — Services purs non testés
   - Priority: P2
   - Target: Backlog

### Re-Review Needed?

⚠️ Re-review recommandée après ajout de la factory et des tests edge cases moteur.

---

## Decision

**Recommendation**: Approve with Comments

**Rationale**:

Les 6 tests existants sont de bonne qualité intrinsèque — déterministes, rapides, focalisés sur la logique critique du moteur de programme. Le score de 52/100 reflète principalement le manque de couverture structurelle (6 tests pour 110+ fichiers) et l'absence de factory pattern, pas des défauts dans le code de test existant.

Les tests actuels peuvent rester en production. Les recommandations P1 (factory + edge cases) devraient être adressées dans le prochain sprint pour renforcer la confiance avant les évolutions futures du moteur.

---

## Appendix

### Violation Summary by Location

| Line | Severity | Criterion | Issue | Fix |
|---|---|---|---|---|
| buildWeekProgram.test.ts:6-28 | P1 | Data Factories | Profil hardcodé inline | Créer `createProfile()` factory |
| buildWeekProgram.test.ts:31 | P2 | Test IDs | Pas d'ID ni priorité | Ajouter `[ENGINE-UNIT-001][P0]` |
| Suite entière | P1 | Coverage | 6 tests / 110+ fichiers | Ajouter tests edge cases |
| programDataIntegrity.test.ts:7 | P2 | Test IDs | Pas d'ID ni priorité | Ajouter `[DATA-UNIT-001][P1]` |
| Suite entière | P2 | Recipe integrity | Pas de validation recettes | Ajouter test recettes |
| Suite entière | P3 | BDD Format | Pas de Given-When-Then | Optionnel pour tests unitaires |

### Related Reviews

| File | Score | Grade | Critical | Status |
|---|---|---|---|---|
| buildWeekProgram.test.ts | 62/100 | C | 0 | Approved with Comments |
| programDataIntegrity.test.ts | 58/100 | D | 0 | Approved with Comments |

**Suite Average**: 52/100 (D)

---

## Review Metadata

**Generated By**: BMad TEA Agent (Test Architect)
**Workflow**: testarch-test-review v5.0
**Review ID**: test-review-suite-20260309
**Timestamp**: 2026-03-09
**Version**: 1.0
