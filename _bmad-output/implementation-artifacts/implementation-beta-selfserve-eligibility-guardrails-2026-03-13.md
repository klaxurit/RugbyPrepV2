---
title: 'Rapport d'implémentation — Garde-fous beta self-serve éligibilité profil'
created: '2026-03-13'
sprint: 'Beta Self-Serve Guardrails'
status: 'complete'
---

# Rapport d'implémentation — Garde-fous beta self-serve

**Date :** 2026-03-13
**Spec :** `_bmad-output/implementation-artifacts/tech-spec-beta-selfserve-eligibility-guardrails.md`
**Revue adversariale :** `_bmad-output/planning-artifacts/adw-beta-selfserve-eligibility-guardrails-2026-03-13.md`

---

## 1. Résumé des changements

Implémentation complète de la logique d'éligibilité beta self-serve en défense en profondeur :

- **Fonction centralisée** `checkBetaEligibility(profile)` — source unique de vérité, pure, sans effets de bord
- **Onboarding step 6** — warning non-bloquant avec liste détaillée des raisons d'exclusion + libellé conditionnel du bouton
- **WeekPage** — guard bloquant avant `buildWeekProgram` : profils inéligibles voient un fallback UI, le moteur n'est jamais appelé
- **ProfilePage** — banner dynamique réactif, mis à jour à chaque `updateProfile()`
- **22 tests unitaires** couvrant toutes les raisons, combinaisons et règles conservatives

---

## 2. Fichiers créés / modifiés

| Fichier | Action | Description |
|---|---|---|
| `src/services/betaEligibility.ts` | **CRÉÉ** | Types + fonction pure `checkBetaEligibility` + dictionnaire `BETA_ELIGIBILITY_MESSAGES` |
| `src/services/betaEligibility.test.ts` | **CRÉÉ** | 22 tests unitaires Vitest |
| `src/pages/OnboardingPage.tsx` | **MODIFIÉ** | Warning non-bloquant step 6 + libellé bouton conditionnel |
| `src/pages/WeekPage.tsx` | **MODIFIÉ** | Early return guard avant `buildWeekProgram` |
| `src/pages/ProfilePage.tsx` | **MODIFIÉ** | Banner dynamique en tête de `<main>` |
| `src/pages/__tests__/WeekPage.integration.test.tsx` | **MODIFIÉ** | Fix mock profil : `ageBand: 'adult'` + `injuries: []` + `equipment: []` |

**Fichiers moteur non touchés :** `src/services/program/` (11 fichiers) + `src/data/sessionRecipes.v1.ts` — gel moteur respecté.

---

## 3. Logique d'éligibilité (`checkBetaEligibility`)

### Types exportés

```typescript
export type BetaEligibilityReason =
  | 'SHOULDER_PAIN_LIMITED_GYM'   // shoulder_pain sans barbell — priorité max
  | 'REHAB_ACTIVE'                 // rehabInjury != null
  | 'MULTI_INJURIES'               // ≥2 blessures non-shoulder
  | 'SHOULDER_PAIN'                // shoulder_pain avec barbell
  | 'OFF_SEASON_NOT_SUPPORTED'     // off_season ou pre_season
  | 'U18_NO_CONSENT'               // ageBand !== 'adult' sans consentement parental

export interface BetaEligibilityResult {
  isEligible: boolean
  primaryReason: BetaEligibilityReason | null
  reasons: BetaEligibilityReason[]
}
```

### Règles clés

- **isLimitedGym** = `!equipment.includes('barbell')` — aussi vrai pour `BW_ONLY` (`equipment: []`)
- **MULTI_INJURIES anti-double-messaging** : `injuries.filter(i => i !== 'shoulder_pain').length >= 2` — shoulder_pain exclu du comptage
- **Règle conservative U18** : `ageIsAdult = profile.ageBand === 'adult'` — `undefined` = inéligible
- **Ordre de priorité** dans `reasons[]` : SHOULDER_PAIN_LIMITED_GYM → REHAB_ACTIVE → MULTI_INJURIES → SHOULDER_PAIN → OFF_SEASON_NOT_SUPPORTED → U18_NO_CONSENT

---

## 4. Tests ajoutés / modifiés

### `src/services/betaEligibility.test.ts` (22 tests — tous ✅)

| Groupe | Tests |
|---|---|
| Profil éligible nominal | 2 tests (adulte standard + senior F) |
| SHOULDER_PAIN | 3 tests (barbell, LIMITED_GYM, BW_ONLY) |
| REHAB_ACTIVE | 1 test |
| MULTI_INJURIES | 3 tests (2 non-shoulder, shoulder+1, 1 seule) |
| OFF_SEASON | 3 tests (off, pre, in = éligible) |
| U18 / ageBand | 4 tests (u18 sans, undefined, u18 avec, adult sans) |
| Combinaisons | 2 tests (rehab+off_season, primaryReason priorité) |
| Cas limites | 4 tests (equipment vide, seasonMode undefined, injuries undefined, rehabInjury null) |

### `src/pages/__tests__/WeekPage.integration.test.tsx` (modifié)

- Mock profil complété avec `ageBand: 'adult'`, `injuries: []`, `equipment: []`
- Sans ce fix, le guard U18 conservative bloquait la page et le test échouait

---

## 5. Résultats validation

### Tests
```
✓ src/services/betaEligibility.test.ts (22 tests) — PASS
✓ src/pages/__tests__/WeekPage.integration.test.tsx (1 test) — PASS
✓ Suite complète : 414/414 tests — PASS
```

### Lint
```
npm run lint → 0 erreurs sur les fichiers modifiés
(60 erreurs pre-existantes sur d'autres fichiers — hors scope sprint)
```

### Build
```
npm run build → SUCCESS
Aucune erreur TypeScript
```

---

## 6. Confirmation explicite

✅ **Aucun changement moteur** — `src/services/program/` et `src/data/sessionRecipes.v1.ts` intacts, gel respecté.

✅ **Garde-fous self-serve actifs sur les 3 surfaces :**
- Onboarding step 6 : warning non-bloquant + libellé bouton honnête
- WeekPage : guard bloquant — `buildWeekProgram` jamais appelé pour profils inéligibles
- ProfilePage : banner dynamique réactif

✅ **Défense en profondeur** : même fonction centralisée, zéro duplication de règles.

✅ **Profils éligibles non impactés** : aucune régression sur les tests existants.

---

## 7. Corrections issues de la revue adversariale (F1-F10)

| Finding | Sévérité | Correction appliquée |
|---|---|---|
| F1 — `const` dans JSX | CRITICAL | Calcul déplacé dans le corps du composant avant `return` |
| F2 — `eligible` vs `isEligible` | CRITICAL | Propriété renommée `isEligible` dans spec + implémentation |
| F3 — Ordre priorité raisons | HIGH | Ordre final : SH_LIM_GYM → REHAB → MULTI → SH → OFF → U18 |
| F4 — MULTI_INJURIES double-messaging | HIGH | Filtrage `i !== 'shoulder_pain'` dans le comptage |
| F5 — ageBand conservative | HIGH | `ageIsAdult = ageBand === 'adult'` (undefined = inéligible) |
| F6 — Position guard WeekPage | MEDIUM | Early return après dernier hook (L84), avant buildWeekProgram (L99) |
| F7 — Type `['none']` | MEDIUM | Cast `['none' as Equipment]` dans le snapshot onboarding |
| F8 — Tests avec corps réels | MEDIUM | Spec mise à jour avec vrais corps de tests Vitest |
| F9 — Wording "unsupported" | LOW | Titre : "Profil non encore supporté en bêta self-serve" |
| F10 — Perf banner visible même éligible | LOW | Rendering conditionnel `{!betaEligibility.isEligible && ...}` |
