---
title: 'Garde-fous beta self-serve — Éligibilité profil'
slug: 'beta-selfserve-eligibility-guardrails'
created: '2026-03-13'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 19', 'TypeScript', 'Tailwind CSS', 'Vitest']
files_to_modify: ['src/services/betaEligibility.ts (NEW)', 'src/services/betaEligibility.test.ts (NEW)', 'src/pages/OnboardingPage.tsx', 'src/pages/WeekPage.tsx', 'src/pages/ProfilePage.tsx']
code_patterns: ['pure function (no side effects)', 'centralized eligibility → consumed by 3 surfaces', 'UserProfile as sole input', 'BetaEligibilityResult as structured output', 'early return guard in WeekPage']
test_patterns: ['vitest describe/it/expect', 'createProfile() factory from testHelpers.ts', 'profile fixture per exclusion reason']
---

# Tech-Spec: Garde-fous beta self-serve — Éligibilité profil

**Created:** 2026-03-13

## Overview

### Problem Statement

Un utilisateur hors périmètre beta validé (shoulder_pain actif, rehab actif, multi-blessures, off_season, U18 sans consentement, LIMITED_GYM + shoulder_pain) peut actuellement accéder au programme self-serve sans aucun blocage. Le seul guard existant (`RequireAuth.tsx`) vérifie uniquement si l'onboarding est complété, pas la qualité/éligibilité du profil. Risque sécurité produit.

### Solution

Fonction d'éligibilité centralisée `checkBetaEligibility(profile)` retournant un verdict structuré (éligible/non-éligible + raisons explicites). Consommée par 3 surfaces :
1. **Onboarding step 6** (Résumé) : warning non-bloquant si profil hors scope — l'utilisateur voit le problème avant de terminer
2. **WeekPage** : guard bloquant — `buildWeekProgram` n'est pas appelé, fallback UI affiché
3. **ProfilePage** : banner dynamique — se met à jour dès que le profil passe hors scope

Défense en profondeur : même logique, pas de duplication de règles.

### Scope

**In Scope :**
- Fichier `src/services/betaEligibility.ts` : types + fonction pure `checkBetaEligibility`
- Fichier `src/services/betaEligibility.test.ts` : tests unitaires complets
- `OnboardingPage.tsx` step 6 : warning non-bloquant
- `WeekPage.tsx` : early return guard avant `buildWeekProgram`
- `ProfilePage.tsx` : banner dynamique réactif au profil courant

**Out of Scope :**
- Modification du moteur (`src/services/program/` gelé)
- Formulaire de consentement parental U18 (feature séparée)
- Feedback form beta (feature séparée)
- Analytics / monitoring instrumenté
- Gestion de liste d'attente / waitlist (futur)

## Context for Development

### Codebase Patterns

- **Profil** : `UserProfile` dans `src/types/training.ts` (L180-216)
  - `injuries: Contra[]` — tableau, peut être vide
  - `rehabInjury?: RehabInjury` — présent si rehab actif
  - `seasonMode?: SeasonMode` — défaut `'in_season'`
  - `ageBand?: AgeBand` — `'u18'` | `'adult'`
  - `parentalConsentHealthData?: boolean`
  - `equipment: Equipment[]`
- **WeekPage** : hooks en L54-83, `buildWeekProgram` en L99 → early return DOIT se placer entre L83 et L99 (après tous les hooks React)
- **OnboardingPage step 6** : render en L1048-1116, données locales en `Set<Contra>` et `SeasonMode`, `AgeBand`, `parentalConsentHealthData`
- **ProfilePage** : `profile` issu de `useProfile()` en L163, réactif aux `updateProfile()` calls
- **Tests** : Vitest, `createProfile()` factory dans `src/services/program/testHelpers.ts`
- **LIMITED_GYM** : pas de type dédié dans le code — condition : `!equipment.includes('barbell')`

### Anchor Points

| Point | Fichier | Ligne | Action |
|-------|---------|-------|--------|
| Step 6 render | OnboardingPage.tsx | L1048 | Injecter warning avant le bouton |
| handleFinish | OnboardingPage.tsx | L266 | Pas de changement — warning est informatif |
| buildWeekProgram call | WeekPage.tsx | L99 | Early return guard avant cette ligne |
| WeekPage hooks fin | WeekPage.tsx | L83 | Dernière ligne après laquelle l'early return est legal |
| ProfilePage profile load | ProfilePage.tsx | L163 | `checkBetaEligibility(profile)` ici, résultat utilisé dans le render |
| ProfilePage render | ProfilePage.tsx | ~L320 (début du return JSX) | Banner en top de page |

### Technical Decisions

1. **Fonction pure** : `checkBetaEligibility(profile: UserProfile): BetaEligibilityResult` — aucun side effect, aucun hook, testable unitairement
2. **Placement** : `src/services/` — hors périmètre gel moteur
3. **Champs éditables** : ne pas griser dans ProfilePage — warning suffit
4. **Ordre de priorité des raisons** (le premier applicable devient `primaryReason`) :
   1. `SHOULDER_PAIN_LIMITED_GYM` — shoulder_pain + sans barbell (le plus dégradé)
   2. `REHAB_ACTIVE` — rehabInjury défini
   3. `MULTI_INJURIES` — ≥2 blessures hors shoulder_pain (évite double messaging)
   4. `SHOULDER_PAIN` — shoulder_pain seul avec barbell
   5. `OFF_SEASON_NOT_SUPPORTED` — off_season ou pre_season
   6. `U18_NO_CONSENT` — u18 ou âge non déterminé sans consentement
5. **MULTI_INJURIES** : `injuries.filter(i => i !== 'shoulder_pain').length >= 2` — évite la redondance quand shoulder_pain est déjà une raison
6. **U18 / ageBand undefined — règle conservative** : si `ageBand != null && ageBand !== 'adult'` (ageBand = 'u18') → `U18_NO_CONSENT`. Si `ageBand == null` (non renseigné) → également `U18_NO_CONSENT`, profil incomplet = inéligible par sécurité. Message étendu : "Moins de 18 ans ou âge non confirmé".
7. **isLimitedGym** = `!equipment.includes('barbell')`. Vrai aussi pour `equipment: []` (BW_ONLY). Un profil BW_ONLY + shoulder_pain déclenche `SHOULDER_PAIN_LIMITED_GYM`, pas `SHOULDER_PAIN`. Ce comportement est intentionnel et correspond au cas le plus dégradé.
8. **Onboarding** : `onboardingProfileSnap` et `onboardingEligibility` calculés dans le **corps du composant**, avant le `return` JSX. Ne jamais déclarer `const` à l'intérieur d'une expression JSX `{...}`.
9. **Surfaces à auditer (F4)** : Le guard WeekPage est le point principal. Avant d'implémenter, vérifier que `SessionDetailPage` et `ProgressPage` ne génèrent pas de programme directement :
   - `SessionDetailPage` : ⚠️ **appelle `buildWeekProgram`** (L52) → guard requis et implémenté (patch post-review F1)
   - `ProgramPage` : ⚠️ **appelle `buildWeekProgram`** (L84) → guard requis et implémenté (patch post-review F1)
   - `ProgressPage` : lit les logs historiques — ne génère pas de programme → guard non requis

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/types/training.ts` | UserProfile, RehabInjury, Contra, Equipment, AgeBand |
| `src/pages/OnboardingPage.tsx` | Step 6 render (L1048), handleFinish (L266), local states |
| `src/pages/WeekPage.tsx` | Hook zone (L54-83), buildWeekProgram call (L99), return JSX (L140) |
| `src/pages/ProfilePage.tsx` | useProfile (L163), return JSX start (~L320) |
| `src/services/program/testHelpers.ts` | `createProfile()`, `LIMITED_GYM`, `BW_ONLY`, `FULL_GYM` |

## Implementation Plan

### Tasks

- [x] **Task 1 : Créer `src/services/betaEligibility.ts`**
  - File: `src/services/betaEligibility.ts` (nouveau fichier)
  - Action: Créer les types et la fonction pure centralisée
  - Notes:
    ```typescript
    import type { UserProfile } from '../types/training'

    export type BetaEligibilityReason =
      | 'SHOULDER_PAIN_LIMITED_GYM'  // shoulder_pain + pas de barbell — prioritaire
      | 'SHOULDER_PAIN'              // shoulder_pain seul
      | 'REHAB_ACTIVE'               // rehabInjury défini
      | 'MULTI_INJURIES'             // injuries.length >= 2
      | 'OFF_SEASON_NOT_SUPPORTED'   // seasonMode === 'off_season' | 'pre_season'
      | 'U18_NO_CONSENT'             // ageBand === 'u18' && !parentalConsentHealthData

    export interface BetaEligibilityResult {
      isEligible: boolean
      primaryReason: BetaEligibilityReason | null  // raison prioritaire pour affichage simplifié (null si éligible)
      reasons: BetaEligibilityReason[]             // liste complète pour affichage multi-raisons
    }

    export const BETA_ELIGIBILITY_MESSAGES: Record<BetaEligibilityReason, { reason: string; detail: string }> = {
      SHOULDER_PAIN_LIMITED_GYM: {
        reason: 'Douleur à l\'épaule + équipement sans barre olympique',
        detail: 'C\'est la combinaison la plus dégradée actuellement. Les séances sont fortement incomplètes pour ce profil.',
      },
      SHOULDER_PAIN: {
        reason: 'Douleur à l\'épaule active',
        detail: 'Les séances haut du corps sont fortement dégradées pour ce profil. Support prévu dans une version future.',
      },
      REHAB_ACTIVE: {
        reason: 'Programme de réhabilitation actif',
        detail: 'Les protocoles retour blessure ne sont pas encore disponibles en self-serve. Consulte ton kiné ou coach.',
      },
      MULTI_INJURIES: {
        reason: 'Plusieurs zones sensibles déclarées (2 ou plus)',
        detail: 'Les combinaisons de blessures n\'ont pas encore été testées en self-serve. Consulte un coach.',
      },
      OFF_SEASON_NOT_SUPPORTED: {
        reason: 'Mode inter-saison ou pré-saison',
        detail: 'Seul le mode saison est supporté en bêta. Repasse en mode saison pour accéder à ton programme.',
      },
      U18_NO_CONSENT: {
        reason: 'Moins de 18 ans ou âge non confirmé',
        detail: 'Un accord parental est requis pour accéder au programme, ou ton profil ne renseigne pas ta tranche d\'âge. Contacte-nous pour le formaliser.',
      },
    }

    export function checkBetaEligibility(profile: UserProfile): BetaEligibilityResult {
      const reasons: BetaEligibilityReason[] = []
      const injuries = profile.injuries ?? []
      const equipment = profile.equipment ?? []
      const seasonMode = profile.seasonMode ?? 'in_season'
      // isLimitedGym = pas de barbell. Vrai aussi pour BW_ONLY (equipment: []).
      const isLimitedGym = !equipment.includes('barbell')

      // 1. shoulder_pain (most specific first)
      if (injuries.includes('shoulder_pain') && isLimitedGym) {
        reasons.push('SHOULDER_PAIN_LIMITED_GYM')
      }

      // 2. rehab actif (indépendant de shoulder_pain)
      if (profile.rehabInjury != null) {
        reasons.push('REHAB_ACTIVE')
      }

      // 3. multi-blessures : exclure shoulder_pain du comptage pour éviter le double messaging
      //    shoulder_pain est déjà capturé ci-dessus si présent
      const injuriesWithoutShoulder = injuries.filter((i) => i !== 'shoulder_pain')
      if (injuriesWithoutShoulder.length >= 2) {
        reasons.push('MULTI_INJURIES')
      }

      // 4. shoulder_pain seul avec barbell (après MULTI, pour que MULTI ait la priorité si applicable)
      if (injuries.includes('shoulder_pain') && !isLimitedGym) {
        reasons.push('SHOULDER_PAIN')
      }

      // 5. off_season / pre_season non supportés
      if (seasonMode === 'off_season' || seasonMode === 'pre_season') {
        reasons.push('OFF_SEASON_NOT_SUPPORTED')
      }

      // 6. U18 sans consentement — règle conservative :
      //    ageBand == null (non renseigné) = profil incomplet = inéligible par sécurité
      const ageIsAdult = profile.ageBand === 'adult'
      if (!ageIsAdult && !profile.parentalConsentHealthData) {
        reasons.push('U18_NO_CONSENT')
      }

      return {
        isEligible: reasons.length === 0,
        primaryReason: reasons[0] ?? null,
        reasons,
      }
    }
    ```

- [x] **Task 2 : Créer `src/services/betaEligibility.test.ts`**
  - File: `src/services/betaEligibility.test.ts` (nouveau fichier)
  - Action: Tests unitaires couvrant chaque raison + combinaisons + profil éligible
  - Notes: Utiliser `createProfile()` de `testHelpers.ts` + `LIMITED_GYM`, `FULL_GYM`, `BW_ONLY`
    ```typescript
    import { describe, it, expect } from 'vitest'
    import { checkBetaEligibility } from './betaEligibility'
    import { createProfile, LIMITED_GYM, FULL_GYM, BW_ONLY } from './program/testHelpers'

    describe('checkBetaEligibility', () => {

      // ── Profil éligible nominal ──────────────────────────────────

      it('retourne isEligible=true pour un profil standard adulte in_season', () => {
        const profile = createProfile({
          injuries: [], equipment: FULL_GYM, seasonMode: 'in_season', ageBand: 'adult',
        })
        const result = checkBetaEligibility(profile)
        expect(result.isEligible).toBe(true)
        expect(result.primaryReason).toBeNull()
        expect(result.reasons).toHaveLength(0)
      })

      it('retourne isEligible=true pour senior F in_season sans blessure', () => {
        const profile = createProfile({
          injuries: [], equipment: FULL_GYM, seasonMode: 'in_season',
          ageBand: 'adult', populationSegment: 'female_senior',
        })
        expect(checkBetaEligibility(profile).isEligible).toBe(true)
      })

      // ── shoulder_pain ────────────────────────────────────────────

      it('SHOULDER_PAIN si shoulder_pain + barbell disponible', () => {
        const profile = createProfile({ injuries: ['shoulder_pain'], equipment: FULL_GYM })
        const result = checkBetaEligibility(profile)
        expect(result.isEligible).toBe(false)
        expect(result.primaryReason).toBe('SHOULDER_PAIN')
        expect(result.reasons).toEqual(['SHOULDER_PAIN'])
      })

      it('SHOULDER_PAIN_LIMITED_GYM si shoulder_pain + LIMITED_GYM (sans barbell)', () => {
        const profile = createProfile({ injuries: ['shoulder_pain'], equipment: LIMITED_GYM })
        const result = checkBetaEligibility(profile)
        expect(result.isEligible).toBe(false)
        expect(result.primaryReason).toBe('SHOULDER_PAIN_LIMITED_GYM')
        expect(result.reasons).not.toContain('SHOULDER_PAIN')
      })

      it('SHOULDER_PAIN_LIMITED_GYM si shoulder_pain + BW_ONLY (equipment vide)', () => {
        const profile = createProfile({ injuries: ['shoulder_pain'], equipment: BW_ONLY })
        const result = checkBetaEligibility(profile)
        expect(result.primaryReason).toBe('SHOULDER_PAIN_LIMITED_GYM')
      })

      // ── REHAB_ACTIVE ─────────────────────────────────────────────

      it('REHAB_ACTIVE si rehabInjury défini', () => {
        const profile = createProfile({
          injuries: [], equipment: FULL_GYM,
          rehabInjury: { zone: 'upper', phase: 1, startDate: '2026-03-01', phaseStartDate: '2026-03-01' },
        })
        const result = checkBetaEligibility(profile)
        expect(result.isEligible).toBe(false)
        expect(result.primaryReason).toBe('REHAB_ACTIVE')
      })

      // ── MULTI_INJURIES ───────────────────────────────────────────

      it('MULTI_INJURIES si 2 blessures non-shoulder', () => {
        const profile = createProfile({ injuries: ['knee_pain', 'low_back_pain'], equipment: FULL_GYM })
        const result = checkBetaEligibility(profile)
        expect(result.isEligible).toBe(false)
        expect(result.reasons).toContain('MULTI_INJURIES')
      })

      it('pas MULTI_INJURIES si shoulder_pain + 1 seule autre blessure', () => {
        const profile = createProfile({ injuries: ['shoulder_pain', 'knee_pain'], equipment: FULL_GYM })
        const result = checkBetaEligibility(profile)
        // shoulder_pain est déjà une raison ; knee_pain seul ne dépasse pas le seuil non-shoulder
        expect(result.reasons).not.toContain('MULTI_INJURIES')
        expect(result.reasons).toContain('SHOULDER_PAIN')
      })

      it('pas MULTI_INJURIES si 1 blessure seule', () => {
        const profile = createProfile({ injuries: ['knee_pain'], equipment: FULL_GYM })
        const result = checkBetaEligibility(profile)
        expect(result.reasons).not.toContain('MULTI_INJURIES')
      })

      // ── OFF_SEASON ───────────────────────────────────────────────

      it('OFF_SEASON_NOT_SUPPORTED si off_season', () => {
        const profile = createProfile({ seasonMode: 'off_season', injuries: [], equipment: FULL_GYM })
        const result = checkBetaEligibility(profile)
        expect(result.isEligible).toBe(false)
        expect(result.reasons).toContain('OFF_SEASON_NOT_SUPPORTED')
      })

      it('OFF_SEASON_NOT_SUPPORTED si pre_season', () => {
        const profile = createProfile({ seasonMode: 'pre_season', injuries: [], equipment: FULL_GYM })
        expect(checkBetaEligibility(profile).reasons).toContain('OFF_SEASON_NOT_SUPPORTED')
      })

      it('isEligible si in_season (default)', () => {
        const profile = createProfile({ seasonMode: 'in_season', injuries: [], equipment: FULL_GYM, ageBand: 'adult' })
        expect(checkBetaEligibility(profile).isEligible).toBe(true)
      })

      // ── U18 / ageBand ────────────────────────────────────────────

      it('U18_NO_CONSENT si ageBand u18 sans consentement (false)', () => {
        const profile = createProfile({ ageBand: 'u18', parentalConsentHealthData: false, injuries: [], equipment: FULL_GYM })
        const result = checkBetaEligibility(profile)
        expect(result.isEligible).toBe(false)
        expect(result.reasons).toContain('U18_NO_CONSENT')
      })

      it('U18_NO_CONSENT si ageBand undefined (règle conservative)', () => {
        const profile = createProfile({ ageBand: undefined, parentalConsentHealthData: undefined, injuries: [], equipment: FULL_GYM })
        const result = checkBetaEligibility(profile)
        expect(result.isEligible).toBe(false)
        expect(result.reasons).toContain('U18_NO_CONSENT')
      })

      it('isEligible si ageBand u18 avec consentement (true)', () => {
        const profile = createProfile({ ageBand: 'u18', parentalConsentHealthData: true, injuries: [], equipment: FULL_GYM, seasonMode: 'in_season' })
        expect(checkBetaEligibility(profile).reasons).not.toContain('U18_NO_CONSENT')
      })

      it('isEligible si ageBand adult sans consentement (consentement non requis)', () => {
        const profile = createProfile({ ageBand: 'adult', parentalConsentHealthData: false, injuries: [], equipment: FULL_GYM, seasonMode: 'in_season' })
        expect(checkBetaEligibility(profile).isEligible).toBe(true)
      })

      // ── Combinaisons ─────────────────────────────────────────────

      it('multiple reasons si rehab + off_season : primaryReason = REHAB_ACTIVE', () => {
        const profile = createProfile({
          seasonMode: 'off_season',
          rehabInjury: { zone: 'lower', phase: 1, startDate: '2026-03-01', phaseStartDate: '2026-03-01' },
          injuries: [], equipment: FULL_GYM,
        })
        const result = checkBetaEligibility(profile)
        expect(result.reasons).toContain('REHAB_ACTIVE')
        expect(result.reasons).toContain('OFF_SEASON_NOT_SUPPORTED')
        expect(result.primaryReason).toBe('REHAB_ACTIVE') // premier dans l'ordre
      })

    })
    ```

- [x] **Task 3 : Onboarding step 6 — warning non-bloquant**
  - File: `src/pages/OnboardingPage.tsx`
  - Action:
    1. Ajouter l'import en tête de fichier :
       ```typescript
       import { checkBetaEligibility, BETA_ELIGIBILITY_MESSAGES } from '../services/betaEligibility'
       ```
    2. Dans le **corps du composant `OnboardingPage`**, avant le `return` JSX principal (pas dans une expression JSX), ajouter le calcul d'éligibilité :
       ```typescript
       // ⚠️ IMPORTANT : ces déclarations doivent être dans le corps du composant,
       // AVANT le return JSX. Ne jamais déclarer const à l'intérieur d'une expression JSX {}.
       const onboardingProfileSnap: UserProfile = {
         level: 'beginner',
         weeklySessions: sessions ?? 2,
         equipment: equipment.size > 0 ? Array.from(equipment) : ['none' as Equipment],
         injuries: Array.from(injuries),
         seasonMode,
         ageBand,
         parentalConsentHealthData: parentalConsentHealthData === true,
       }
       const onboardingEligibility = checkBetaEligibility(onboardingProfileSnap)
       // onboardingEligibility est ensuite utilisé dans {step === 6 && (...)} via closure
       ```
    3. Injecter le warning avant le bouton "Voir mon programme" (avant L1107) :
       ```tsx
       {!onboardingEligibility.isEligible && (
         <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-4 space-y-2">
           <p className="text-sm font-bold text-amber-400">Profil non encore supporté en bêta self-serve</p>
           <ul className="space-y-1">
             {onboardingEligibility.reasons.map((r) => (
               <li key={r} className="text-xs text-amber-300/80">
                 · {BETA_ELIGIBILITY_MESSAGES[r].reason} — {BETA_ELIGIBILITY_MESSAGES[r].detail}
               </li>
             ))}
           </ul>
           <p className="text-xs text-white/40">Tu peux quand même créer ton compte. Le programme sera disponible quand le support sera en place.</p>
         </div>
       )}
       ```
    4. Modifier le libellé du bouton "Voir mon programme" selon l'éligibilité :
       ```tsx
       <button
         type="button"
         onClick={handleFinish}
         className="w-full h-14 rounded-full bg-[#ff6b35] ..."
       >
         <CheckCircle2 className="w-5 h-5" />
         {onboardingEligibility.isEligible ? 'Voir mon programme' : 'Terminer et accéder à mon espace'}
       </button>
       ```
       Si inéligible, le libellé "Terminer et accéder à mon espace" évite de promettre un programme qui sera bloqué sur WeekPage.
  - Notes: `onboardingProfileSnap` est construit depuis les states locaux (Set → Array). `level` et `weeklySessions` sont requis par le type mais non utilisés dans l'éligibilité.

- [x] **Task 4 : WeekPage — guard bloquant avant `buildWeekProgram`**
  - File: `src/pages/WeekPage.tsx`
  - Action:
    1. Ajouter l'import :
       ```typescript
       import { checkBetaEligibility, BETA_ELIGIBILITY_MESSAGES } from '../services/betaEligibility'
       ```
    2. Après la dernière ligne de hooks (L83, `useEffect`) et avant `buildWeekProgram` (L99), ajouter :
       ```typescript
       const betaEligibility = checkBetaEligibility(profile)
       if (!betaEligibility.isEligible) {
         return (
           <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24">
             <PageHeader title="Mon espace" backTo="/" />
             <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
               <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                 <p className="font-bold text-amber-400">Profil non encore supporté en bêta self-serve</p>
                 <ul className="space-y-2">
                   {betaEligibility.reasons.map((r) => (
                     <li key={r} className="text-sm text-amber-300/80">
                       <span className="font-semibold">{BETA_ELIGIBILITY_MESSAGES[r].reason}</span>
                       <br />{BETA_ELIGIBILITY_MESSAGES[r].detail}
                     </li>
                   ))}
                 </ul>
                 <p className="text-xs text-white/40">Ton compte et ton profil sont conservés. Modifie ton profil pour revenir dans le périmètre supporté, ou contacte-nous.</p>
                 <Link to="/profile" className="inline-block text-sm font-bold text-[#ff6b35] hover:text-[#e55a2b]">
                   Modifier mon profil →
                 </Link>
               </div>
             </main>
             <BottomNav />
           </div>
         )
       }
       ```
    3. `buildWeekProgram` n'est PAS appelé si inéligible.
  - Notes: L'early return est legal ici car tous les hooks React sont déjà appelés au-dessus (L54-83). `Link` est déjà importé. `PageHeader`, `BottomNav` sont déjà importés.

- [x] **Task 5 : ProfilePage — banner dynamique**
  - File: `src/pages/ProfilePage.tsx`
  - Action:
    1. Ajouter l'import :
       ```typescript
       import { checkBetaEligibility, BETA_ELIGIBILITY_MESSAGES } from '../services/betaEligibility'
       ```
    2. Juste après `const { profile, updateProfile, resetProfile } = useProfile()` (L163), ajouter :
       ```typescript
       const betaEligibility = checkBetaEligibility(profile)
       ```
    3. Dans le JSX, au début du contenu principal (après le `<PageHeader>` et avant la première section), injecter le banner conditionnel :
       ```tsx
       {!betaEligibility.isEligible && (
         <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-4 space-y-2 mx-4 mt-4">
           <p className="text-sm font-bold text-amber-400">⚠️ Profil hors périmètre bêta self-serve</p>
           <ul className="space-y-1">
             {betaEligibility.reasons.map((r) => (
               <li key={r} className="text-xs text-amber-300/80">
                 · {BETA_ELIGIBILITY_MESSAGES[r].reason} — {BETA_ELIGIBILITY_MESSAGES[r].detail}
               </li>
             ))}
           </ul>
           <p className="text-xs text-white/40">Le programme ne sera pas généré tant que ce profil est hors périmètre. Modifie les champs ci-dessous pour revenir en zone supportée.</p>
         </div>
       )}
       ```
    4. Les champs restent tous éditables — pas de `disabled` ajouté.
  - Notes: `betaEligibility` est recalculé à chaque render. Comme `profile` vient de `useProfile()` (réactif), le banner se met à jour immédiatement après chaque `updateProfile()`.

### Acceptance Criteria

**AC-1 : Profil éligible standard**
- Given un profil `in_season`, sans blessure, `ageBand: 'adult'`, avec barbell
- When `checkBetaEligibility(profile)` est appelé
- Then `isEligible === true`, `primaryReason === null`, et `reasons === []`

**AC-2 : Shoulder pain seul avec barbell**
- Given un profil avec `injuries: ['shoulder_pain']` et `equipment` contenant `'barbell'`
- When `checkBetaEligibility(profile)` est appelé
- Then `isEligible === false`, `primaryReason === 'SHOULDER_PAIN'`, et `reasons === ['SHOULDER_PAIN']`

**AC-3 : Shoulder pain sans barbell**
- Given un profil avec `injuries: ['shoulder_pain']` et `equipment` sans `'barbell'`
- When `checkBetaEligibility(profile)` est appelé
- Then `isEligible === false`, `primaryReason === 'SHOULDER_PAIN_LIMITED_GYM'`, et `reasons === ['SHOULDER_PAIN_LIMITED_GYM']` (pas `SHOULDER_PAIN`)

**AC-4 : Rehab actif**
- Given un profil avec `rehabInjury` défini (zone: 'upper', phase: 1)
- When `checkBetaEligibility(profile)` est appelé
- Then `isEligible === false`, `primaryReason === 'REHAB_ACTIVE'`, et `reasons` contient `'REHAB_ACTIVE'`

**AC-5 : Multi-blessures (sans shoulder_pain)**
- Given un profil avec `injuries: ['knee_pain', 'low_back_pain']`
- When `checkBetaEligibility(profile)` est appelé
- Then `isEligible === false`, `primaryReason === 'MULTI_INJURIES'`, et `reasons` contient `'MULTI_INJURIES'`

**AC-5b : shoulder_pain + 1 seule autre blessure → pas MULTI_INJURIES**
- Given un profil avec `injuries: ['shoulder_pain', 'knee_pain']` et `equipment` contenant `'barbell'`
- When `checkBetaEligibility(profile)` est appelé
- Then `reasons` contient `'SHOULDER_PAIN'` mais PAS `'MULTI_INJURIES'` (knee_pain seul ne dépasse pas le seuil de 2 non-shoulder)

**AC-6 : off_season bloqué**
- Given un profil avec `seasonMode: 'off_season'`
- When `checkBetaEligibility(profile)` est appelé
- Then `isEligible === false` et `reasons` contient `'OFF_SEASON_NOT_SUPPORTED'`

**AC-7 : pre_season bloqué**
- Given un profil avec `seasonMode: 'pre_season'`
- When `checkBetaEligibility(profile)` est appelé
- Then `isEligible === false` et `reasons` contient `'OFF_SEASON_NOT_SUPPORTED'`

**AC-8 : U18 sans consentement**
- Given un profil avec `ageBand: 'u18'` et `parentalConsentHealthData: false`
- When `checkBetaEligibility(profile)` est appelé
- Then `isEligible === false` et `reasons` contient `'U18_NO_CONSENT'`

**AC-8b : ageBand undefined → bloqué par sécurité**
- Given un profil avec `ageBand: undefined` (ou non renseigné) et `parentalConsentHealthData: undefined`
- When `checkBetaEligibility(profile)` est appelé
- Then `isEligible === false` et `reasons` contient `'U18_NO_CONSENT'`

**AC-9 : U18 avec consentement**
- Given un profil avec `ageBand: 'u18'` et `parentalConsentHealthData: true`
- When `checkBetaEligibility(profile)` est appelé
- Then `reasons` ne contient PAS `'U18_NO_CONSENT'`

**AC-10 : WeekPage — guard bloquant**
- Given un utilisateur avec `shoulder_pain` actif
- When il navigue vers `/week`
- Then la page affiche le message d'inéligibilité (titre + raison + lien profil) et ne génère pas de programme

**AC-11 : WeekPage — retour à l'éligibilité**
- Given un utilisateur bloqué sur WeekPage (shoulder_pain)
- When il retire `shoulder_pain` de son profil via ProfilePage
- When il revient sur WeekPage
- Then le programme est généré normalement

**AC-12 : Onboarding step 6 — warning visible, bouton honnête, non bloquant**
- Given un utilisateur avec `shoulder_pain` coché à l'onboarding step 4
- When il arrive au step 6 (Résumé)
- Then un warning amber est affiché avant le bouton
- And le bouton affiche "Terminer et accéder à mon espace" (pas "Voir mon programme")
- And le bouton reste cliquable — l'utilisateur peut terminer l'onboarding

**AC-13 : ProfilePage — banner dynamique**
- Given un utilisateur avec profil éligible sur ProfilePage
- When il active `rehabInjury` (mode rehab)
- Then le banner d'inéligibilité apparaît immédiatement sans rechargement

**AC-14 : ProfilePage — retour éligibilité**
- Given un utilisateur avec banner visible (off_season actif)
- When il repasse en `in_season` sur ProfilePage
- Then le banner disparaît immédiatement

**AC-15 : Combinaisons de raisons**
- Given un profil avec `rehabInjury` défini ET `seasonMode: 'off_season'`
- When `checkBetaEligibility(profile)` est appelé
- Then `reasons` contient à la fois `'REHAB_ACTIVE'` et `'OFF_SEASON_NOT_SUPPORTED'`
- And `primaryReason === 'REHAB_ACTIVE'` (première raison dans l'ordre d'évaluation)
- And WeekPage / ProfilePage affichent les 2 raisons

## Additional Context

### Dependencies

- Aucune nouvelle dépendance npm
- `checkBetaEligibility` importe uniquement `UserProfile` de `src/types/training.ts`
- Tests importent `createProfile`, `LIMITED_GYM`, `FULL_GYM`, `BW_ONLY` de `src/services/program/testHelpers.ts`

### Testing Strategy

- **Tests unitaires** : `src/services/betaEligibility.test.ts` — 15+ cas, couvre chaque raison + combinaisons
- **Pas de test composant React** — la logique est dans la fonction pure, les composants consomment le résultat
- **Validation manuelle** : vérifier visuellement le warning onboarding, le guard WeekPage, le banner ProfilePage
- **Commandes** : `npm run test` → `npm run lint` → `npm run build`

### Notes

**Risques :**
- **OnboardingPage — placement des const** : `onboardingProfileSnap` et `onboardingEligibility` doivent être dans le **corps du composant avant le `return`**, jamais dans une expression JSX `{}`. Erreur de compilation garantie sinon.
- **OnboardingPage — cast Equipment** : `equipment.size === 0` → `['none' as Equipment]`. Sans le cast, TypeScript inférera `string[]` incompatible avec `Equipment[]`.
- **isLimitedGym = `!equipment.includes('barbell')`** : vrai pour `LIMITED_GYM` et pour `BW_ONLY` (`equipment: []`). Un profil BW_ONLY + shoulder_pain déclenche donc `SHOULDER_PAIN_LIMITED_GYM`, pas `SHOULDER_PAIN`. Comportement intentionnel et attendu.
- **ageBand undefined → U18_NO_CONSENT** : règle conservative. Profil adulte sans ageBand renseigné est bloqué. En pratique, le DEFAULT_PROFILE a `ageBand: 'adult'` et l'onboarding renseigne toujours ce champ. Le risque de faux positif est négligeable.
- **WeekPage early return** : `useProfile()` retourne toujours un `UserProfile` avec defaults (voir `DEFAULT_PROFILE` dans le hook — jamais null). L'early return est safe.
- **ProfilePage** : le banner doit être dans la section scrollable principale, pas dans un overlay fixe. Utiliser la même largeur/padding que les autres sections.
- **Surfaces auditées** : `SessionDetailPage` lit les logs existants, `ProgressPage` lit l'historique — aucune des deux ne génère de programme. Guard uniquement requis sur WeekPage.

**Future :**
- Quand le consentement parental U18 sera implémenté (formulaire dédié), `U18_NO_CONSENT` sera résolu côté onboarding.
- Quand `off_season` sera validé, retirer `OFF_SEASON_NOT_SUPPORTED` de la liste des raisons.
- Quand `shoulder_pain` sera traité (nouveaux blocs upper BW), retirer `SHOULDER_PAIN` et `SHOULDER_PAIN_LIMITED_GYM`.


## Review Notes
- Adversarial review completed (step-05 quick-dev workflow)
- Findings: 11 total — 9 real, 2 bruit
- Resolution approach: auto-fix (F)
- Fixed: F1 (test ineligible path WeekPage), F2 (analytics event posthog), F3 (comment seasonMode intent), F4 (comment computation rationale), F5 (remove emoji ProfilePage), F6 (comment rehabInjury assumption), F7 (comment level hardcoded), F9 (comment null→false coercion), F10 (test BW_ONLY eligible)
- Skipped: F8 (bruit — wording support channel), F11 (bruit — spacing inconsistency)
- Final test count: 416/416 ✅ | Build ✅
