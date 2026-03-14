# Réévaluation Décision Beta — Post-implémentation Garde-fous Self-Serve

**Date :** 2026-03-13
**Revue :** Adversariale (cynique)
**Reviewer :** Opus
**Documents analysés :**
- `decision-beta-et-garde-fous-rugbyprep-2026-03-13.md` (décision initiale)
- `tech-spec-beta-selfserve-eligibility-guardrails.md` (spec implémentée)
- `implementation-beta-selfserve-eligibility-guardrails-2026-03-13.md` (rapport d'implémentation)
- Code source vérifié : `betaEligibility.ts`, `WeekPage.tsx`, `OnboardingPage.tsx`, `ProfilePage.tsx`, `SessionDetailPage.tsx`, `ProgramPage.tsx`, `useProfile.ts`, `App.tsx`
- `validation-finale-stabilisation-produit-2026-03-13.md` (baseline qualité)

---

## 1. Executive Summary

Les garde-fous beta self-serve sont **réellement implémentés** dans le produit. La fonction centralisée `checkBetaEligibility` est en place, testée (25+ tests unitaires + 1 test d'intégration pour le chemin inéligible), et consommée par 3 surfaces (onboarding, WeekPage, ProfilePage). La règle conservative `seasonMode` a été durcie après retour PO (seul `'in_season'` explicite autorise l'accès). Le gel moteur est respecté — aucun fichier de `src/services/program/` ou `src/data/sessionRecipes.v1.ts` n'a été modifié.

**Cependant**, l'implémentation présente des trous de couverture et des incohérences documentaires qui doivent être évalués avant de déclarer le self-serve opérationnel. Les findings ci-dessous détaillent chaque problème.

---

## 2. Avant / Après — Décision Beta

| Dimension | Avant (décision initiale) | Après (garde-fous implémentés) |
|---|---|---|
| **Verdict** | GO beta **fermée** (recrutement manuel) | Potentiellement GO self-serve **conditionnel** (voir findings) |
| **Garde-fous UX** | ❌ Non implémentés — PO = garde-fou humain | ✅ Implémentés sur 3 surfaces |
| **WeekPage bloquant** | ❌ `buildWeekProgram` appelé pour tout profil | ✅ Early return guard — moteur jamais appelé si inéligible |
| **Onboarding warning** | ❌ Aucun signal à l'utilisateur | ✅ Warning non-bloquant + libellé bouton honnête |
| **ProfilePage** | ❌ Pas de feedback | ✅ Banner dynamique réactif |
| **Consentement U18 bloquant** | ❌ Non implémenté | ✅ `U18_NO_CONSENT` bloque si ageBand non-adult ET pas de consentement |
| **Restriction in_season** | ❌ off/pre-season accessibles | ✅ Seul `in_season` explicite autorise l'accès |
| **Analytics blocage** | ❌ Aucun | ✅ `posthog.capture('beta_eligibility_blocked', { surface, primaryReason, reasons })` |
| **Tests** | 392 tests moteur | 417 tests (+25) dont 25 sur l'éligibilité |
| **Feedback form** | ❌ Non implémenté | ❌ **Toujours non implémenté** |

---

## 3. Bloquants Fermés

| Bloquant originel (décision §2) | Statut | Preuve |
|---|---|---|
| Garde-fous UX implémentés | ✅ **FERMÉ** | `betaEligibility.ts` + 3 surfaces consommatrices |
| Consentement U18 implémenté | ✅ **FERMÉ** | `U18_NO_CONSENT` bloque `ageBand !== 'adult'` sans `parentalConsentHealthData: true`. Règle conservative : `ageBand: undefined` = inéligible. |
| Modes saison validés | ✅ **FERMÉ** | `profile.seasonMode !== 'in_season'` → `OFF_SEASON_NOT_SUPPORTED`. Règle conservative durcie par le PO. |
| Shoulder pain exclu | ✅ **FERMÉ** | `SHOULDER_PAIN` et `SHOULDER_PAIN_LIMITED_GYM` bloquent l'accès |
| Rehab exclu | ✅ **FERMÉ** | `REHAB_ACTIVE` bloque si `rehabInjury != null` |
| Multi-blessures exclu | ✅ **FERMÉ** | `MULTI_INJURIES` bloque si ≥2 blessures hors shoulder_pain |

---

## 4. Findings — Bloquants Restants et Problèmes

### F1 — CRITICAL : `SessionDetailPage` et `ProgramPage` appellent `buildWeekProgram` SANS guard d'éligibilité

**Constat :** Le guard est uniquement sur `WeekPage.tsx`. Mais `SessionDetailPage.tsx` (L52) et `ProgramPage.tsx` (L84) appellent aussi `buildWeekProgram(profile, ...)` directement, sans aucune vérification d'éligibilité. Ces pages sont accessibles via :
- `/session/:sessionIndex` — accessible en tapant l'URL ou via un deeplink
- `/program` — accessible via la navigation

**Impact :** Un utilisateur inéligible bloqué sur `/week` peut accéder à `/session/0` ou `/program` et obtenir une session générée par le moteur. Le guard WeekPage est contournable. La « défense en profondeur » a un trou béant.

**Preuve :** `src/pages/SessionDetailPage.tsx:52`, `src/pages/ProgramPage.tsx:84`, `src/App.tsx:39-41` (routes accessibles sous `RequireAuth`).

**Correction recommandée :** Ajouter `checkBetaEligibility` en early return guard dans `SessionDetailPage` et `ProgramPage`, identique au pattern WeekPage.

### F2 — HIGH : `DEFAULT_PROFILE` dans `useProfile.ts` n'a PAS de `seasonMode` — conséquence du durcissement F3

**Constat :** `DEFAULT_PROFILE` (L18-36 de `useProfile.ts`) ne définit pas `seasonMode`. Avec la nouvelle règle conservative `profile.seasonMode !== 'in_season'`, le `DEFAULT_PROFILE` est **lui-même inéligible**.

**Impact en pratique :** Probablement faible — le `DEFAULT_PROFILE` n'est utilisé que :
1. Comme état initial avant chargement Supabase (flash bref)
2. Quand l'utilisateur n'est pas connecté (reset)

Mais si le guard WeekPage s'évalue pendant ce flash (avant que Supabase ne retourne le vrai profil), l'utilisateur verrait brièvement le guard d'inéligibilité, puis le programme chargerait normalement. Ce flash UX est un bug visuel.

**Correction recommandée :** Ajouter `seasonMode: 'in_season'` au `DEFAULT_PROFILE` dans `useProfile.ts`. C'est un changement hors périmètre moteur, aucun risque.

### F3 — HIGH : `posthog.capture` dans le WeekPage guard s'exécute à CHAQUE render, pas une seule fois

**Constat :** L105-109 de WeekPage — le `posthog.capture('beta_eligibility_blocked', ...)` est dans le corps du composant, AVANT le `return`. Il s'exécute à chaque render React du composant (re-render parent, changement de state, etc.).

**Impact :** Pollution des données PostHog — un utilisateur bloqué qui reste sur la page ou y revient n génère n events identiques au lieu d'un seul. Cela fausse les métriques (nombre de blocages ≠ nombre d'utilisateurs bloqués) et peut excéder les quotas PostHog.

**Correction recommandée :** Déplacer dans un `useEffect` avant le guard :
```typescript
useEffect(() => {
  if (!betaEligibility.isEligible) {
    posthog.capture('beta_eligibility_blocked', { ... })
  }
}, [betaEligibility.isEligible, betaEligibility.primaryReason])
```
Mais attention : le `useEffect` doit être AVANT l'early return (sinon c'est un hook conditionnel). Il faut donc réorganiser légèrement le code.

### F4 — HIGH : Le tech-spec (§5 + Notes) dit « Surfaces auditées : SessionDetailPage ne génère pas de programme » — c'est FAUX

**Constat :** Le tech-spec (ligne 93-94) affirme :
> *SessionDetailPage : affiche une session existante depuis les logs — ne génère pas de programme → guard non requis*

C'est factuellement faux. `SessionDetailPage.tsx:52` appelle `buildWeekProgram(profile, effectiveWeek, {...})`. Le spec a été validé avec cette affirmation incorrecte, et l'implémentation a suivi sans vérifier.

**Impact :** Le finding F1 (CRITICAL) ci-dessus en est la conséquence directe. La revue adversariale initiale du spec n'a pas détecté cette erreur factuelle.

### F5 — MEDIUM : Le rapport d'implémentation affiche « 414/414 tests » et « 22 tests unitaires » — chiffres périmés

**Constat :** Le rapport (`implementation-beta-selfserve-eligibility-guardrails-2026-03-13.md`) §5 indique « Suite complète : 414/414 tests ». L'auto-fix a ajouté des tests, portant le total à 417. Le rapport n'a pas été mis à jour après l'auto-fix.

De même, §1 indique « 22 tests unitaires » mais le fichier `betaEligibility.test.ts` en contient maintenant 25 (après ajout de BW_ONLY sans blessure, seasonMode undefined, WeekPage ineligible).

**Impact :** Incohérence documentaire. Un audit traçabilité trouverait des chiffres contradictoires.

### F6 — MEDIUM : Le tech-spec code (Task 1, §5 de la spec) montre encore `seasonMode ?? 'in_season'` — pas mis à jour après durcissement F3

**Constat :** Le code dans le tech-spec (L163, L190) utilise encore `const seasonMode = profile.seasonMode ?? 'in_season'` et `if (seasonMode === 'off_season' || seasonMode === 'pre_season')`. Le code réel (`betaEligibility.ts` L103-108) utilise correctement `profile.seasonMode !== 'in_season'`. Le spec et le code divergent.

**Impact :** Si quelqu'un lit le spec pour comprendre la logique (futur dev, audit), il comprendra mal la règle conservative.

### F7 — MEDIUM : Le message `OFF_SEASON_NOT_SUPPORTED` dit « Mode inter-saison ou pré-saison » — ne couvre pas le cas `seasonMode: undefined`

**Constat :** Avec la règle conservative, `seasonMode: undefined` déclenche aussi `OFF_SEASON_NOT_SUPPORTED`. Mais le message utilisateur dit "Mode inter-saison ou pré-saison" — ce qui est trompeur si le vrai problème est que le mode n'est pas renseigné du tout.

**Impact :** Un utilisateur dont le `seasonMode` n'est pas renseigné (edge case, corruption de données) verrait un message qui ne correspond pas à son état réel. Confusion UX.

**Correction recommandée :** Ajouter une raison dédiée `SEASON_MODE_MISSING` ou modifier le message de `OFF_SEASON_NOT_SUPPORTED` pour couvrir le cas "non renseigné" : *"Mode saison non renseigné, inter-saison ou pré-saison"*.

### F8 — MEDIUM : L'onboarding step 6 warning ne fire PAS d'event PostHog (`surface: 'onboarding'`)

**Constat :** Le WeekPage a `posthog.capture('beta_eligibility_blocked', { surface: 'week_page', ... })`, mais l'onboarding step 6 n'a aucun tracking analytics quand le warning est affiché. C'est la première surface de contact avec l'inéligibilité.

**Impact :** On ne saura pas combien d'utilisateurs voient le warning à l'onboarding et continuent quand même. Donnée critique pour le product management.

### F9 — MEDIUM : Le `onboardingProfileSnap` utilise `equipment: ['none' as Equipment]` quand `equipment.size === 0` — mais `checkBetaEligibility` ne traite pas `'none'` spécifiquement

**Constat :** Quand l'utilisateur n'a sélectionné aucun équipement en onboarding, le snap envoie `['none']`. Dans `checkBetaEligibility`, `isLimitedGym = !equipment.includes('barbell')` — vrai pour `['none']`. Si l'utilisateur a aussi `shoulder_pain`, cela déclenche `SHOULDER_PAIN_LIMITED_GYM`.

Ce n'est pas un bug fonctionnel (c'est le comportement voulu pour BW_ONLY). Mais la sémantique de `['none']` vs `[]` est incohérente : le BW_ONLY preset est `[]` (tableau vide), pas `['none']`. Deux chemins différents pour représenter "pas d'équipement" pourraient diverger dans le futur.

### F10 — LOW : Le tech-spec review notes (L607-613) indique « 416/416 tests ✅ » — le total réel est maintenant 417

**Constat :** Après le durcissement F3 (ajout test seasonMode undefined), le total est passé de 416 à 417. Les review notes n'ont pas été corrigées.

### F11 — LOW : La décision beta initiale §8 mentionne « Créer un canal feedback beta — Canal actif avant activation du 1er user »

**Constat :** Ce prérequis reste ❌. Ni la spec d'éligibilité ni l'implémentation ne traitent le feedback form. Le passage de beta fermée à self-serve conditionnelle exige-t-il ce canal ? La décision initiale le listait comme prérequis self-serve.

---

## 5. Verdict

### GO SELF-SERVE CONDITIONNEL — sous réserve de correction de F1

Le passage de « beta fermée / recrutement manuel » à « beta self-serve conditionnelle » est **possible** mais nécessite impérativement :

1. **F1 (CRITICAL)** : Ajout du guard `checkBetaEligibility` dans `SessionDetailPage` et `ProgramPage`. Sans cela, le guard WeekPage est contournable et le self-serve n'est pas réellement bloquant.

Les autres findings (F2 à F11) sont des améliorations souhaitables mais non bloquantes pour un self-serve restreint et surveillé.

### Conditions du GO :

| Condition | Bloquant ? | Statut |
|---|---|---|
| Guard sur toutes les surfaces qui appellent `buildWeekProgram` | ✅ BLOQUANT | ❌ F1 ouvert — SessionDetailPage + ProgramPage non protégés |
| WeekPage guard bloquant | Non-bloquant (déjà fait) | ✅ |
| Onboarding warning | Non-bloquant (déjà fait) | ✅ |
| ProfilePage banner | Non-bloquant (déjà fait) | ✅ |
| Tests unitaires complets | Non-bloquant (déjà fait) | ✅ |
| Analytics minimum (PostHog) | Non-bloquant (amélioration) | ⚠️ F3/F8 à améliorer |
| `DEFAULT_PROFILE` compatible | Non-bloquant mais recommandé | ⚠️ F2 à corriger |
| Feedback form / canal beta | Non-bloquant pour self-serve technique | ⚠️ F11 — prérequis product, pas technique |

---

## 6. Garde-fous Obligatoires à Conserver

1. **`checkBetaEligibility` en source unique de vérité** — toutes les surfaces DOIVENT consommer cette même fonction. Pas de logique d'éligibilité dupliquée.
2. **Guard bloquant sur TOUTES les pages qui appellent `buildWeekProgram`** : WeekPage, SessionDetailPage, ProgramPage.
3. **Règle conservative `ageBand`** : `undefined` = inéligible. Ne jamais adoucir sans formulaire de consentement implémenté.
4. **Règle conservative `seasonMode`** : seul `'in_season'` explicite passe. Ne jamais adoucir sans validation des recettes off/pre-season.
5. **Gel moteur intact** : `src/services/program/` + `src/data/sessionRecipes.v1.ts`.

---

## 7. Backlog Résiduel (max 3 items)

| Priorité | Item | Justification |
|---|---|---|
| **P0** | **F1 : Guard sur SessionDetailPage + ProgramPage** | Contournement du guard WeekPage. Bloquant self-serve. |
| **P1** | **F2 + F3 : DEFAULT_PROFILE seasonMode + analytics useEffect** | Flash UX + pollution PostHog. Qualité self-serve. |
| **P2** | **F7 + F8 : Message seasonMode undefined + analytics onboarding** | Honnêteté UX + données product. |
