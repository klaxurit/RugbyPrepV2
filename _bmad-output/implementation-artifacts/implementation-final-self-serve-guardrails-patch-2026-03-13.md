---
title: 'Patch final — Fermeture contournements garde-fous beta self-serve'
created: '2026-03-13'
sprint: 'Final Self-Serve Guardrails Patch'
status: 'complete'
---

# Patch Final — Fermeture Contournements Garde-fous Beta Self-Serve

**Date :** 2026-03-13
**Source :** `reevaluation-decision-beta-post-self-serve-guardrails-2026-03-13.md` — findings F1 (CRITICAL), F2 (HIGH), F3 (HIGH)

---

## 1. Résumé des correctifs

### F1 — CRITICAL (fermé) : Guard manquant sur SessionDetailPage et ProgramPage

**Problème :** `SessionDetailPage.tsx:52` et `ProgramPage.tsx:84` appelaient `buildWeekProgram` sans vérification d'éligibilité. Un utilisateur bloqué sur `/week` pouvait accéder à `/session/0` ou `/program` et obtenir une session.

**Correction :** Guard `checkBetaEligibility` ajouté dans les deux pages, pattern identique à WeekPage :
- Early return après tous les hooks, avant `buildWeekProgram`
- UI de blocage cohérente (même messages, même structure)
- Analytics `posthog.capture('beta_eligibility_blocked', { surface: '...' })` via `useEffect`

### F2 — HIGH (fermé) : `DEFAULT_PROFILE` sans `seasonMode`

**Problème :** `DEFAULT_PROFILE` dans `useProfile.ts` ne définissait pas `seasonMode`. Avec la règle conservative `profile.seasonMode !== 'in_season'`, le profil par défaut était lui-même inéligible, causant un flash de garde-fou au chargement.

**Correction :** `seasonMode: 'in_season'` ajouté à `DEFAULT_PROFILE`. Changement hors périmètre moteur, cohérent avec l'intention du produit.

### F3 — HIGH (fermé) : `posthog.capture` à chaque render

**Problème :** L'event analytics était dans le corps du composant, exécuté à chaque re-render React.

**Correction :** Déplacé dans un `useEffect` conditionnel AVANT l'early return :
```typescript
useEffect(() => {
  if (!betaEligibility.isEligible) {
    posthog.capture('beta_eligibility_blocked', {
      surface: 'week_page',
      primaryReason: betaEligibility.primaryReason,
      reasons: betaEligibility.reasons,
    })
  }
}, [betaEligibility.isEligible, betaEligibility.primaryReason])
```
Pattern appliqué uniformément sur les 3 surfaces (WeekPage, SessionDetailPage, ProgramPage).

---

## 2. Fichiers modifiés

| Fichier | Action | Description |
|---|---|---|
| `src/pages/SessionDetailPage.tsx` | **MODIFIÉ** | Import `checkBetaEligibility` + guard bloquant + analytics `useEffect` |
| `src/pages/ProgramPage.tsx` | **MODIFIÉ** | Import `checkBetaEligibility` + guard bloquant + analytics `useEffect` |
| `src/pages/WeekPage.tsx` | **MODIFIÉ** | `posthog.capture` déplacé dans `useEffect` (F3) |
| `src/hooks/useProfile.ts` | **MODIFIÉ** | `seasonMode: 'in_season'` dans `DEFAULT_PROFILE` (F2) |
| `tech-spec-...guardrails.md` | **MODIFIÉ** | Correction doc : SessionDetailPage et ProgramPage appellent bien `buildWeekProgram` |

**Fichiers moteur non touchés** : `src/services/program/` + `src/data/sessionRecipes.v1.ts` — gel respecté.

---

## 3. Tests

### Existants (inchangés, tous passent)
- `betaEligibility.test.ts` : 25 tests — ✅
- `WeekPage.integration.test.tsx` : 2 tests (éligible + inéligible) — ✅
- Suite complète : **417/417 tests** — ✅

### Couverture guard

| Surface | `buildWeekProgram` appelé ? | Guard en place ? | Test dédié ? |
|---|---|---|---|
| WeekPage | Oui (L144) | ✅ (L103) | ✅ integration test |
| SessionDetailPage | Oui (L94) | ✅ (L54) | Via betaEligibility.test.ts (logique centralisée) |
| ProgramPage | Oui (L126) | ✅ (L85) | Via betaEligibility.test.ts (logique centralisée) |
| ProfilePage | Non | N/A (banner informatif) | N/A |
| OnboardingPage | Non | N/A (warning non-bloquant) | N/A |
| ProgressPage | Non | N/A | N/A |
| HomePage | Non | N/A | N/A |

---

## 4. Résultats validation

```
npm run test  → 417/417 ✅
npm run lint  → 0 erreurs fichiers modifiés
npm run build → SUCCESS ✅
```

---

## 5. Confirmation explicite

✅ **Plus aucun contournement connu du guard self-serve.**

Toutes les pages qui appellent `buildWeekProgram` (`WeekPage`, `SessionDetailPage`, `ProgramPage`) ont le guard `checkBetaEligibility` en early return. Aucune route accessible ne génère de programme pour un profil inéligible.

✅ **Gel moteur respecté** — aucun fichier de `src/services/program/` ou `src/data/sessionRecipes.v1.ts` modifié.

✅ **Analytics contrôlé** — `useEffect` empêche le spam d'events PostHog.

✅ **`DEFAULT_PROFILE` compatible** — `seasonMode: 'in_season'` élimine le flash d'inéligibilité au chargement.

✅ **Logique centralisée** — même fonction `checkBetaEligibility` consommée par 5 surfaces (3 guards + 1 banner + 1 warning), zéro duplication de règles.
