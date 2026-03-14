# Validation Finale — GO Self-Serve Conditionnel

**Date :** 2026-03-13
**Revue :** Adversariale finale (cynique)
**Reviewer :** Sonnet (post-patch)
**Mission :** Vérifier qu'il ne reste plus de contournement connu ni de bloquant réel avant de confirmer l'ouverture d'une beta self-serve conditionnelle sur périmètre restreint.

**Documents analysés :**
- `reevaluation-decision-beta-post-self-serve-guardrails-2026-03-13.md` (Opus — 11 findings, F1 CRITICAL)
- `decision-beta-et-garde-fous-rugbyprep-2026-03-13.md` (décision initiale GO beta fermée)
- `implementation-final-self-serve-guardrails-patch-2026-03-13.md` (rapport patch final)
- Code source vérifié : `betaEligibility.ts`, `WeekPage.tsx`, `ProgramPage.tsx`, `SessionDetailPage.tsx`, `useProfile.ts`, `MobilityPage.tsx`, `App.tsx`

---

## 1. Executive Summary

Le patch final a fermé les 3 findings critiques/high identifiés par Opus :
- **F1 CRITICAL** (contournement via `/session/:id` et `/program`) → guards ajoutés
- **F2 HIGH** (`DEFAULT_PROFILE` sans `seasonMode`) → `seasonMode: 'in_season'` ajouté
- **F3 HIGH** (analytics spam) → `useEffect` conditionnel sur les 3 surfaces

Les 3 pages qui appellent `buildWeekProgram` (`WeekPage`, `SessionDetailPage`, `ProgramPage`) sont maintenant toutes protégées par `checkBetaEligibility` en early return, avec un pattern identique et uniforme. **Aucun profil inéligible ne peut obtenir de programme de musculation via une route directe.**

Suite de tests : **417/417 ✅** — Build OK — Gel moteur respecté.

---

## 2. Bloquants Fermés

| Finding Opus | Sévérité | Statut | Vérification code |
|---|---|---|---|
| **F1** — SessionDetailPage + ProgramPage sans guard | CRITICAL | ✅ **FERMÉ** | `SessionDetailPage.tsx:54` + `ProgramPage.tsx:85` — `checkBetaEligibility` en early return avant `buildWeekProgram` |
| **F2** — `DEFAULT_PROFILE` sans `seasonMode` | HIGH | ✅ **FERMÉ** | `useProfile.ts:25` — `seasonMode: 'in_season'` explicite |
| **F3** — `posthog.capture` à chaque render | HIGH | ✅ **FERMÉ** | `useEffect` conditionnel sur WeekPage (L106), SessionDetailPage (L56), ProgramPage (L87) — deps: `[isEligible, primaryReason]` |

---

## 3. Vérifications Obligatoires — Résultats

### 3.1 Toutes les surfaces qui appellent `buildWeekProgram` sont protégées

| Page | Appel `buildWeekProgram` | Guard `checkBetaEligibility` | Ligne guard | Ligne build |
|---|---|---|---|---|
| WeekPage | ✅ L144 | ✅ L103 | L116 early return | L144 (après guard) |
| SessionDetailPage | ✅ L94 | ✅ L54 | L66 early return | L94 (après guard) |
| ProgramPage | ✅ L126 | ✅ L85 | L97 early return | L126 (après guard) |

**Verdict : ✅ Couverture complète.** Les 3 pages sont protégées avec le même pattern.

### 3.2 Aucun profil inéligible ne peut obtenir de programme via route directe

Routes vérifiées dans `App.tsx` (L26-43) :
- `/week` → WeekPage → guard ✅
- `/session/:sessionIndex` → SessionDetailPage → guard ✅
- `/program` → ProgramPage → guard ✅
- `/mobility` → MobilityPage → **voir F1 ci-dessous**
- `/profile` → ProfilePage → pas de `buildWeekProgram` → banner informatif (non-bloquant, correct)
- `/onboarding` → OnboardingPage → warning non-bloquant + pas de `buildWeekProgram` (correct)
- Autres routes (`/`, `/history`, `/progress`, `/calendar`, `/chat`) → aucune génération de programme

**Verdict : ✅** pour `buildWeekProgram`. Réserve sur `buildMobilitySession` (voir F1).

### 3.3 `DEFAULT_PROFILE` ne provoque plus de faux blocage

`DEFAULT_PROFILE` dans `useProfile.ts:18-37` :
- `seasonMode: 'in_season'` ✅
- `ageBand: 'adult'` ✅
- `injuries: []` ✅
- `parentalConsentHealthData: false` (inoffensif car `ageBand: 'adult'`)

Le profil par défaut passe `checkBetaEligibility` → pas de flash de guard au chargement.

**Verdict : ✅**

### 3.4 Analytics de blocage émis une seule fois par affichage

Les 3 surfaces utilisent le même pattern :
```typescript
useEffect(() => {
  if (!betaEligibility.isEligible) {
    posthog.capture('beta_eligibility_blocked', {
      surface: '<surface_name>',
      primaryReason: betaEligibility.primaryReason,
      reasons: betaEligibility.reasons,
    })
  }
}, [betaEligibility.isEligible, betaEligibility.primaryReason])
```

Deps stables → fire une seule fois par mount (ou changement de raison). Pas de spam.

**Verdict : ✅**

### 3.5 Périmètre self-serve vérifié dans `checkBetaEligibility`

| Règle | Code (`betaEligibility.ts`) | Statut |
|---|---|---|
| `in_season` only | L106: `profile.seasonMode !== 'in_season'` → inéligible | ✅ |
| `shoulder_pain` exclu | L82-83: `SHOULDER_PAIN_LIMITED_GYM` + L99-100: `SHOULDER_PAIN` | ✅ |
| `rehab` exclu | L87-88: `rehabInjury != null` → `REHAB_ACTIVE` | ✅ |
| Multi-blessures exclu | L93-96: `≥2` injuries hors shoulder → `MULTI_INJURIES` | ✅ |
| U18 sans consentement exclu | L112-114: `!ageIsAdult && !parentalConsentHealthData` | ✅ |
| `ageBand: undefined` = inéligible | L112: `profile.ageBand === 'adult'` → false si undefined | ✅ |
| `seasonMode: undefined` = inéligible | L106: `!== 'in_season'` → true si undefined | ✅ |

**Verdict : ✅** — Toutes les exclusions fonctionnent correctement, y compris les règles conservatives.

### 3.6 Aucun changement moteur

Fichiers dans le périmètre gel (`src/services/program/` + `src/data/sessionRecipes.v1.ts`) :

```
git diff 48e4016..HEAD --name-only -- src/services/program/ src/data/sessionRecipes.v1.ts
```

Aucun fichier moteur modifié depuis le tag de gel `v2.0-engine-freeze`.

**Verdict : ✅**

---

## 4. Findings — Problèmes Résiduels

### F1 — MEDIUM : `MobilityPage` appelle `buildMobilitySession(profile)` SANS guard

**Constat :** `MobilityPage.tsx:12` appelle `buildMobilitySession(profile)` qui, en interne, appelle `buildSessionFromRecipe()` — un fichier du périmètre gelé. Aucun guard d'éligibilité n'est en place.

**Impact réel :** FAIBLE. `buildMobilitySession` génère une session de mobilité fixe (recette `RECOVERY_MOBILITY_V1` — exercices d'étirement sans charge). Ce n'est pas un programme d'entraînement structuré. Le risque de blessure est quasi nul. La session ne dépend pas du `seasonMode`, du `trainingLevel`, ni des blessures.

**Recommandation :** Non-bloquant pour le GO self-serve. À documenter comme known limitation. Si souhaité, ajouter un guard par cohérence UX (pas par safety).

### F2 — MEDIUM : Pas d'analytics `posthog.capture` sur l'onboarding (surface: 'onboarding')

**Constat :** L'onboarding step 6 affiche un warning d'inéligibilité (`OnboardingPage.tsx:325`) mais ne fire aucun event PostHog `beta_eligibility_blocked`. C'est la première surface de contact.

**Impact :** Données product incomplètes — on ne saura pas combien d'utilisateurs reçoivent le warning à l'onboarding vs combien sont bloqués ensuite sur les pages programme.

**Recommandation :** Non-bloquant. Ajouter un `posthog.capture` dans l'onboarding step 6 serait une amélioration analytics de qualité.

### F3 — MEDIUM : Message UX `OFF_SEASON_NOT_SUPPORTED` ne couvre pas le cas `seasonMode: undefined`

**Constat :** Le message dit « Mode inter-saison ou pré-saison » (`betaEligibility.ts:47`). Si `seasonMode` est `undefined` (profil incomplet, corruption de données), l'utilisateur voit un message qui ne correspond pas à son état.

**Impact :** Edge case rare (le `DEFAULT_PROFILE` a maintenant `in_season`, et l'onboarding le renseigne). Mais si un profil Supabase a `season_mode: null`, le `rowToProfile` retourne `undefined` (L209), et le message serait trompeur.

**Recommandation :** Modifier le `detail` de `OFF_SEASON_NOT_SUPPORTED` pour couvrir les 3 cas : *"Seul le mode saison (in_season) est supporté en bêta. Si ton mode n'est pas renseigné, mets-le à jour dans ton profil."*

### F4 — MEDIUM : `rowToProfile` retourne `seasonMode: undefined` quand Supabase a `season_mode: null`

**Constat :** `useProfile.ts:209` — `seasonMode: (row.season_mode as SeasonMode | null) ?? undefined`. Un profil Supabase avec `season_mode: null` (ancien profil pré-migration, ou profil jamais mis à jour) retourne `seasonMode: undefined`, ce qui est inéligible par la règle conservative.

**Impact :** Comportement **correct et voulu** (conservative). Un profil sans `seasonMode` explicite est hors périmètre beta. Le guard affichera une UI de blocage avec un lien vers `/profile` pour corriger. **Ce n'est pas un bug**, mais un edge case documentable.

**Recommandation :** Documenter comme comportement attendu. C'est exactement la philosophie conservative validée par le PO.

### F5 — MEDIUM : `eslint-disable-line react-hooks/exhaustive-deps` sur les 3 `useEffect` analytics

**Constat :** Les 3 surfaces (WeekPage L114, SessionDetailPage L64, ProgramPage L95) ont un `eslint-disable-line react-hooks/exhaustive-deps` car `betaEligibility.reasons` (tableau) est omis des deps.

**Impact :** Si `reasons` change sans que `isEligible` ou `primaryReason` ne change (impossible en pratique — raison ajoutée = toujours `isEligible: false`), l'event ne reflèterait pas la liste à jour. En pratique, risque nul car le `useEffect` fire au premier render inéligible, et les raisons sont stables pour un profil donné.

**Recommandation :** Non-bloquant. Le disable est justifié et documenté.

### F6 — LOW : Pas de test d'intégration dédié pour SessionDetailPage et ProgramPage (chemin inéligible)

**Constat :** Le test d'intégration WeekPage (`WeekPage.integration.test.tsx`) vérifie le chemin inéligible. Les chemins inéligibles de SessionDetailPage et ProgramPage n'ont pas de test d'intégration dédié — ils sont couverts par les 25 tests unitaires de `betaEligibility.test.ts` (logique centralisée).

**Impact :** La couverture est indirecte. Un développeur qui supprimerait accidentellement le guard dans SessionDetailPage ne serait pas alerté par les tests.

**Recommandation :** Non-bloquant pour le GO. Backlog P2 : ajouter 2 tests d'intégration similaires à celui de WeekPage.

### F7 — LOW : La cohérence du libellé guard entre WeekPage et SessionDetailPage diffère légèrement

**Constat :** WeekPage (L132) : *"Ton compte et ton profil sont conservés. Modifie ton profil pour revenir dans le périmètre supporté, **ou contacte-nous**."*
SessionDetailPage (L82) et ProgramPage (L113) : *"Ton compte et ton profil sont conservés. Modifie ton profil pour revenir dans le périmètre supporté."*

Le « ou contacte-nous » est uniquement sur WeekPage.

**Impact :** Incohérence UX mineure. Non-bloquant.

### F8 — LOW : Tech-spec et rapport d'implémentation initial ont des chiffres périmés

**Constat :** Déjà identifié par Opus (F5, F6, F10). Le tech-spec montre encore `seasonMode ?? 'in_season'` dans ses exemples de code. Le rapport initial dit « 414/414 tests » et « 22 tests unitaires ». Les vrais chiffres sont 417 tests et 25 tests unitaires.

**Impact :** Incohérence documentaire. Non-bloquant pour le code.

### F9 — LOW : Guard UI ne montre pas de CTA « Contacter l'équipe » pour les cas les plus graves (rehab, multi-blessures)

**Constat :** Le guard affiche « Modifier mon profil → » pour toutes les raisons. Pour `REHAB_ACTIVE` et `MULTI_INJURIES`, modifier le profil n'est pas la bonne action — l'utilisateur a réellement ces conditions. Le bon CTA serait « Contacter un coach ».

**Impact :** UX suboptimale pour 2 raisons d'exclusion sur 6. Non-bloquant.

### F10 — LOW : `betaEligibility.ts` L75-76 — `injuries ?? []` et `equipment ?? []` sont des protections défensives qui masquent des profils corrompus

**Constat :** Si `profile.injuries` ou `profile.equipment` est `undefined`, la fonction continue silencieusement avec un tableau vide. Un profil avec `injuries: undefined` est corrompu — il devrait probablement être signalé.

**Impact :** En pratique, `UserProfile` type requiert ces champs. Le fallback `?? []` protège uniquement contre un cast `as UserProfile` incorrect. Risque quasi nul.

---

## 5. Verdict Final

### ✅ GO SELF-SERVE CONDITIONNEL

Le passage de « beta fermée / recrutement manuel » à « beta self-serve conditionnelle » est **validé**.

**Justification :**
1. Les 3 surfaces qui appellent `buildWeekProgram` sont protégées par le même guard centralisé
2. Aucun contournement connu ne permet à un profil inéligible d'obtenir un programme d'entraînement
3. Les règles conservatives sont en place et testées (25 tests dédiés)
4. Le `DEFAULT_PROFILE` est compatible avec le guard
5. Les analytics sont contrôlées (pas de spam)
6. Le gel moteur est respecté
7. La suite de tests passe intégralement (417/417)

**Différence critique vs. beta fermée :** Le PO n'a plus besoin de vérifier manuellement chaque profil — le guard dans le code empêche structurellement l'accès au moteur pour les profils hors périmètre.

---

## 6. Garde-fous Obligatoires à Conserver

1. **`checkBetaEligibility` = source unique de vérité** — toutes les surfaces consomment cette même fonction. Jamais de logique d'éligibilité dupliquée.
2. **Guard bloquant sur TOUTES les pages `buildWeekProgram`** : WeekPage, SessionDetailPage, ProgramPage. Si une nouvelle page appelle `buildWeekProgram`, elle DOIT avoir le guard.
3. **Règle conservative `seasonMode`** : seul `'in_season'` explicite passe. Ne jamais adoucir sans validation des recettes off/pre-season.
4. **Règle conservative `ageBand`** : `undefined` = inéligible. Ne jamais adoucir sans formulaire de consentement implémenté.
5. **Gel moteur intact** : `src/services/program/` (11 fichiers) + `src/data/sessionRecipes.v1.ts` — aucune modification sans procédure formelle de réouverture.

---

## 7. Backlog Résiduel (3 items)

| Priorité | Item | Justification |
|---|---|---|
| **P1** | **F3 + F4 : Message UX `OFF_SEASON_NOT_SUPPORTED` + documentation `seasonMode: undefined`** | Honnêteté UX pour les profils legacy avec `season_mode: null` en Supabase |
| **P2** | **F6 : Tests d'intégration SessionDetailPage + ProgramPage (chemin inéligible)** | Filet de sécurité contre suppression accidentelle du guard |
| **P2** | **F2 : Analytics onboarding (`surface: 'onboarding'`)** | Données product complètes sur le funnel d'inéligibilité |

---

## Résumé des 10 findings

| # | Sévérité | Titre | Bloquant GO ? |
|---|---|---|---|
| F1 | MEDIUM | MobilityPage sans guard (buildMobilitySession) | ❌ Non — mobilité sans charge, risque nul |
| F2 | MEDIUM | Pas d'analytics onboarding | ❌ Non — données product, pas safety |
| F3 | MEDIUM | Message UX `OFF_SEASON_NOT_SUPPORTED` incomplet | ❌ Non — edge case rare |
| F4 | MEDIUM | `rowToProfile` seasonMode undefined = comportement voulu | ❌ Non — correct by design |
| F5 | MEDIUM | eslint-disable sur useEffect deps | ❌ Non — justifié |
| F6 | LOW | Pas de test intégration SessionDetailPage/ProgramPage | ❌ Non — couvert indirectement |
| F7 | LOW | Libellé guard « contacte-nous » incohérent | ❌ Non — cosmétique |
| F8 | LOW | Chiffres périmés dans tech-spec/rapport | ❌ Non — documentaire |
| F9 | LOW | CTA guard inadapté pour rehab/multi-blessures | ❌ Non — UX mineure |
| F10 | LOW | Fallback défensif `?? []` masque corruption | ❌ Non — risque quasi nul |

**Aucun finding bloquant. GO confirmé.**
