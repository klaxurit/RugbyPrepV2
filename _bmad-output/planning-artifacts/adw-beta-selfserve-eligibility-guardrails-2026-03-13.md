# Revue Adversariale — Garde-fous beta self-serve (Éligibilité profil)

**Date** : 2026-03-13
**Spec reviewée** : `_bmad-output/implementation-artifacts/tech-spec-beta-selfserve-eligibility-guardrails.md`
**Reviewer** : Adversarial review (cynical, assume problems exist)

---

## Verdict

**GO CONDITIONNEL** — 2 findings critiques bloquants à corriger avant implémentation. Les autres sont correctibles pendant le dev ou en post-implémentation.

---

## Findings classés par sévérité

---

### 🔴 CRITICAL

---

#### F1 — Déclaration `const` dans une expression JSX → erreur de compilation garantie

**Problème** : Task 3 spécifie de déclarer `onboardingProfileSnap` et `onboardingEligibility` *"à l'intérieur du bloc `{step === 6 && (`"*. En React, les expressions JSX `{}` n'acceptent que des expressions, pas des statements (`const`, `let`, etc.). Un dev lisant cette instruction à la lettre écrira un code non-compilable.

```tsx
// Ce que le spec implique (INVALIDE) :
{step === 6 && (
  const onboardingProfileSnap = {...}  // ← SyntaxError
  <div>...</div>
)}
```

**Impact** : Build cassé dès Task 3. Bloquant.

**Correction** : Reformuler explicitement : les variables `onboardingProfileSnap` et `onboardingEligibility` doivent être calculées dans le **corps de la fonction composant**, avant le `return` JSX, et non à l'intérieur d'une expression conditionnelle JSX. Elles sont calculées à chaque render (React recalcule le composant entier à chaque changement de `step`).

```typescript
// CORRECT — dans le corps du composant, avant le return :
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
// Ensuite, dans le JSX : {step === 6 && ( ... {!onboardingEligibility.isEligible && ...} ... )}
```

---

#### F2 — ACs 4–8 utilisent `eligible` au lieu de `isEligible` → inconsistance spec / code

**Problème** : ACs 1–3 ont été mis à jour vers `isEligible`. ACs 4, 5, 6, 7, 8 utilisent encore l'ancienne propriété `eligible === false`, qui n'existe plus dans `BetaEligibilityResult`.

```
AC-4 : "Then eligible === false et reasons contient 'REHAB_ACTIVE'"
AC-5 : "Then eligible === false et reasons contient 'MULTI_INJURIES'"
...
```

**Impact** : Un dev lisant les ACs pour écrire les tests écrira `result.eligible` → erreur TypeScript au runtime. Les tests passeront à la compilation mais `.eligible` sera `undefined`, donc `undefined === false` → `false` → les assertions échoueront silencieusement ou passeront à tort selon le framework.

**Correction** : Remplacer `eligible === false` par `isEligible === false` dans ACs 4, 5, 6, 7, 8.

---

### 🟠 HIGH

---

#### F3 — `MULTI_INJURIES` se déclenche aussi quand `shoulder_pain` est comptabilisé → double messaging confusant

**Problème** : Profil `injuries: ['shoulder_pain', 'knee_pain']` → `injuries.length >= 2` est vrai → la fonction pousse à la fois `SHOULDER_PAIN` ET `MULTI_INJURIES`. L'utilisateur lit deux raisons qui se chevauchent sémantiquement :

> - "Douleur à l'épaule active — Les séances haut du corps sont fortement dégradées."
> - "Plusieurs zones sensibles déclarées (2 ou plus) — Les combinaisons n'ont pas été testées."

Ces deux raisons décrivent partiellement le même état. Le wording "combinaisons non testées" est trompeur si l'épaule est déjà la raison principale : la douleur à l'épaule seule justifie l'exclusion, le fait qu'il y ait 2 blessures est secondaire.

**Impact** : UX dégradée, message confus. Risque de sur-alarme pour un profil `shoulder_pain + ankle_pain` où ankle_pain ne change rien à l'exclusion.

**Correction recommandée** : Ne pas déclencher `MULTI_INJURIES` si `shoulder_pain` est déjà dans les raisons. Ou exclure `shoulder_pain` du comptage pour `MULTI_INJURIES` (`injuries.filter(i => i !== 'shoulder_pain').length >= 2`). Documenter ce choix explicitement dans la spec.

---

#### F4 — Autres routes non auditées → contournement possible du guard WeekPage

**Problème** : Le guard est uniquement placé sur `WeekPage.tsx`. La spec n'audite pas les autres pages qui pourraient appeler `buildWeekProgram` ou afficher des données de programme (ex. `SessionDetailPage`, `ProgressPage`, `ProgramPage` si elle existe). Un utilisateur inéligible bloqué sur `/week` pourrait accéder à une session via un deeplink `/session/:id` ou depuis `/progress`.

**Impact** : Contournement partiel du guard. Risque de cohérence UX (programme visible ailleurs mais bloqué sur WeekPage).

**Correction** : Ajouter une section d'audit dans la spec : "Pages à vérifier avant implémentation — confirmer qu'aucune autre route n'appelle `buildWeekProgram` directement". Si d'autres routes sont trouvées, le guard doit y être appliqué également ou elles doivent être explicitement exclues avec justification.

---

#### F5 — `ageBand: undefined` bypasse silencieusement le guard U18

**Problème** : La condition U18 est `profile.ageBand === 'u18' && !profile.parentalConsentHealthData`. Si `ageBand` est `undefined` (non renseigné), la condition est fausse → l'utilisateur n'est pas bloqué. Or `ageBand` est optionnel dans `UserProfile` (`ageBand?: AgeBand`). Un utilisateur réel U18 qui aurait complété un onboarding sans renseigner `ageBand` (via un ancien flux, ou si le champ est skippable) passerait le guard sans consentement.

**Impact** : Faille de sécurité sur le cas U18. Faible probabilité en beta fermée (le PO vérifie manuellement), mais la spec prétend être la garde-fou self-serve.

**Correction** : Clarifier dans la spec que `ageBand` est **toujours renseigné par l'onboarding**. Si cette garantie est confirmée, le risque est faible — le doc doit juste l'énoncer explicitement. Si elle n'est pas garantie, ajouter une note que `ageBand: undefined` est traité comme `'adult'` (comportement actuel) et que ce cas accepte ce risque résiduel.

---

### 🟡 MEDIUM

---

#### F6 — Task 2 tests contiennent `...` — pas implementation-ready

**Problème** : 100% des corps de tests sont des placeholders `...` :

```typescript
it('retourne eligible=true pour un profil standard', ...)
it('SHOULDER_PAIN si shoulder_pain + barbell dispo', ...)
```

La norme "READY FOR DEVELOPMENT" du workflow exige "No placeholders or 'TBD'". Un dev fresh context n'a aucun modèle de test à suivre. Il devra inventer la structure de chaque assertion.

**Impact** : Déviation probable de la logique attendue, surtout pour les cas `primaryReason` et les combinaisons. Les ACs donnent les assertions mais pas la façon de les écrire en Vitest.

**Correction** : Écrire au moins 2–3 tests complets (profil éligible, SHOULDER_PAIN, combinaison) pour servir de modèle. Les autres peuvent rester en structure courte tant qu'un exemple complet existe.

---

#### F7 — `onboardingProfileSnap` manque le cast `as Equipment` sur `'none'`

**Problème** : Le code spécifié écrit `equipment: equipment.size > 0 ? Array.from(equipment) : ['none']`. La valeur `'none'` n'est pas typée — TypeScript inférera `string[]` et non `Equipment[]`. Le type `Equipment` inclut `'none'` mais le cast est nécessaire.

**Impact** : Erreur TypeScript de type `Type 'string[]' is not assignable to type 'Equipment[]'`. Build cassé.

**Correction** : `['none' as Equipment]` ou `['none' as const]`.

---

#### F8 — `isLimitedGym` non défini pour `equipment: []` (BW_ONLY) — comportement implicite non documenté

**Problème** : `isLimitedGym = !equipment.includes('barbell')` → si equipment est `[]`, alors `isLimitedGym = true`. Un profil BW_ONLY + shoulder_pain déclenche donc `SHOULDER_PAIN_LIMITED_GYM` (pas `SHOULDER_PAIN`). C'est le comportement correct selon la matrice de décision, mais la spec ne le documente pas explicitement. Un dev pourrait penser que "limited gym" implique *avoir* du matériel (pas juste *manquer* de barbell).

**Impact** : Confusion lors de la lecture du code, risque de refactoring erroné.

**Correction** : Documenter explicitement : "`isLimitedGym` est true pour tout profil sans barbell, y compris BW_ONLY. Un profil `equipment: []` + shoulder_pain déclenche `SHOULDER_PAIN_LIMITED_GYM`."

---

### 🔵 LOW

---

#### F9 — Aucun test pour `parentalConsentHealthData: undefined` (distinct de `false`)

**Problème** : La condition U18 est `!profile.parentalConsentHealthData`. Si le champ est `undefined` (non renseigné), `!undefined === true` → l'utilisateur U18 est bloqué. Si le champ est `false`, même résultat. La spec ne distingue pas ces deux cas dans les ACs. Le comportement est correct mais un test explicite manque.

**Correction** : Ajouter un cas de test `ageBand: 'u18', parentalConsentHealthData: undefined` → doit retourner `U18_NO_CONSENT`.

---

#### F10 — WeekPage fallback UI n'a pas de titre de page cohérent

**Problème** : Le fallback WeekPage spécifie `<PageHeader title="Plan Semaine" backTo="/" />`. Un utilisateur bloqué voit quand même le titre "Plan Semaine" alors qu'il n'a pas de plan. Le titre est trompeur.

**Impact** : UX cosmétique. Faible.

**Correction** : Titre alternatif `"Programme"` ou `"Mon espace"`, ou simplement garder "Plan Semaine" avec la note que c'est acceptable pour une beta.

---

## Résumé des fixes bloquants avant dev

| ID | Sévérité | Fix requis |
|----|----------|------------|
| F1 | CRITICAL | Reformuler Task 3 : `onboardingProfileSnap` et `onboardingEligibility` dans le corps composant, pas dans l'expression JSX |
| F2 | CRITICAL | Remplacer `eligible === false` → `isEligible === false` dans ACs 4, 5, 6, 7, 8 |
| F7 | MEDIUM | Ajouter `as Equipment` dans le cast `['none' as Equipment]` |

Les findings F3–F6 sont des améliorations importantes mais non bloquantes : ils peuvent être résolus pendant l'implémentation en appliquant les corrections décrites ci-dessus.

---

## Évaluation spécifique des focus areas

| Focus | Verdict |
|-------|---------|
| Cohérence onboarding warning ↔ WeekPage guard | ✅ Cohérent par design (non-bloquant / bloquant). PO = garde-fou humain en beta fermée. |
| Contournement via ProfilePage | ✅ Reconnu explicitement — champs éditables, user peut mentir. Risque accepté. |
| Priorisation des raisons | ✅ `SHOULDER_PAIN_LIMITED_GYM` > `SHOULDER_PAIN` explicite. MAIS voir F3 (double raisons). |
| Affichage multi-raisons | ✅ `reasons[]` + `primaryReason` bien séparés. |
| Wording UX honnête | ✅ Bouton conditionnel "Terminer et accéder à mon espace". |
| Cas limites U18 | ⚠️ Voir F5 (`ageBand: undefined`). |
| Combinaisons blessures + season + équipement | ⚠️ Voir F3 (double raisons shoulder_pain + multi-injuries). |
| Risque duplication logique | ✅ Centralisé dans une fonction pure. 0 duplication. |
| Non-régression profils éligibles | ✅ AC-1, AC-11, tests positifs couverts. |
| Respect gel moteur | ✅ `src/services/betaEligibility.ts` hors `src/services/program/`. |
