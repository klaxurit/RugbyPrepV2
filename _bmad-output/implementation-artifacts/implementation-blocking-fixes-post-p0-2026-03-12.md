# Rapport — Fixes Bloquants Post-P0 (GO conditionnel → GO ferme)

**Date** : 2026-03-12
**Baseline commit** : `1e18345`
**Statut** : ✅ 215 tests verts, 0 erreurs TypeScript, build OK

---

## Résumé

6 findings bloquants de la revue adversariale corrigés. Les 3 critiques (ACWR boundary, volume budget décoratif, ACL sans contraindication check) et 3 high (deload phase mismatch, tests no-op, tests U18 happy-path only) sont résolus avec des patches ciblés et 13 nouveaux tests.

---

## Détail par finding

### F-01 [CRITICAL] — classifyACWR off-by-one ✅

**Fichier** : `src/hooks/useACWR.ts:77-84`

**Correction** : `<=` remplacé par `<` pour `dangerThreshold` et `criticalThreshold`.

| ACWR | Avant | Après |
|------|-------|-------|
| 1.3  | optimal | optimal |
| 1.31 | caution | caution |
| 1.49 | caution | caution |
| **1.5**  | **caution** ❌ | **danger** ✅ |
| 1.99 | danger | danger |
| **2.0**  | **danger** ❌ | **critical** ✅ |

**Fonction exportée** (`export function classifyACWR`) pour permettre les tests unitaires directs.

**Tests ajoutés** : TA-20 à TA-27 (8 boundary tests couvrant 0.79, 0.8, 1.3, 1.31, 1.49, 1.5, 1.99, 2.0).

---

### F-02 [CRITICAL] — Volume budget always-on ✅

**Fichier** : `src/services/program/buildWeekProgram.ts:314-327`

**Correction** : Le volume budget check est extrait de `evaluateQualityGates()` et placé directement dans `buildWeekProgram()`, exécuté inconditionnellement (sans dépendre de `qualityGatesV2`).

**Comportement** :
- Toujours actif en production
- Émet `quality:volume-exceeded:*` dans `qualityGateEvents` quand dépassement > cap + 1 tolérance
- Warning textuel ajouté à `warnings`
- Suppression du code dupliqué dans `qualityGates.ts` + nettoyage imports inutilisés

**Tests** : TA-17 vérifie que les events sont émis sans `qualityGatesV2`. TA-18 vérifie le comptage réel de sets par niveau.

---

### F-03 [CRITICAL] — Injection ACL respecte éligibilité complète ✅

**Fichier** : `src/services/program/buildWeekProgram.ts:287-312`

**Correction** : Remplacement de `allBlocks.find(...)` par `selectEligibleBlocks(profile, allBlocks).find(...)`. Cela filtre automatiquement :
- Contraindications (bloc et exercice)
- Équipement
- Niveau d'entraînement

**Bonus (F-08)** : Le bloc ACL est maintenant inséré avant le premier finisher/cooldown (au lieu d'être appended en fin de session).

**Test ajouté** : TA-28 — profil `female_senior + low_back_pain` ne reçoit PAS le bloc ACL (contraindiqué).

---

### F-04 [HIGH] — Deload phase preferences alignées ✅

**Fichier** : `src/services/program/buildWeekProgram.ts:98-102, 224-227`

**Correction** : Nouvelle fonction `derivePhaseFromRecipe(recipeId)` :
- Recette contenant `HYPER` → phase `HYPERTROPHY`
- `COND_PRE_V1` ou `SPEED_FIELD_PRE_V1` → phase `POWER`
- Tout autre → phase `FORCE`

En DELOAD, les phase preferences sont dérivées de la recette structurée (pas du fallback `getSessionPhase()` → FORCE).

**Bonus (F-07)** : Suppression du code mort ternaire identique pour `n`.

**Test existant** : TR-05 vérifie que DELOAD n'utilise pas le fallback FORCE.

---

### F-05 [HIGH] — Tests TA-17/18/19 non-no-op ✅

**Fichier** : `src/services/program/waveA.test.ts`

| Test | Avant (no-op) | Après (discriminant) |
|------|---------------|---------------------|
| TA-17 | `expect(events).toBeDefined()` (toujours vrai) | Vérifie l'émission de `quality:volume-exceeded` quand dépassement réel |
| TA-18 | `expect(sessions.length >= 1)` (toujours vrai) | Vérifie comptage sets par session + corrélation avec events |
| TA-19 | `expect(sessions.length >= 1)` (toujours vrai) | Vérifie quality gate events pour profil dégradé |
| TA-19b | — | Test direct de `evaluateQualityGates` : session sans main work → event + invalidation |

---

### F-06 [HIGH] — Tests U18 non-happy-path ✅

**Fichier** : `src/services/program/waveA.test.ts`

| Test | Scénario | Assertion |
|------|----------|-----------|
| TA-14b | `ageBand: undefined, populationSegment: 'u18_male'` | U18 détecté via segment → hard caps actifs |
| TA-14c | `ageBand: 'adult', populationSegment: 'male_senior'` | Adulte → PAS de caps U18 |
| TA-14d | `ageBand: undefined, populationSegment: undefined` | Profil incomplet → default adult, PAS de caps U18 |

---

## Fichiers modifiés

| Fichier | Finding(s) |
|---|---|
| `src/hooks/useACWR.ts` | F-01 |
| `src/services/program/buildWeekProgram.ts` | F-02, F-03, F-04, F-07, F-08 |
| `src/services/program/qualityGates.ts` | F-02 (suppression code dupliqué) |
| `src/services/program/waveA.test.ts` | F-05, F-06, F-01 (boundary tests), F-03 (ACL CI test) |

---

## Tests ajoutés/modifiés

| ID | Type | Description |
|---|---|---|
| TA-14b | NEW | U18 via populationSegment seul |
| TA-14c | NEW | Adulte négatif (pas de caps U18) |
| TA-14d | NEW | Profil incomplet → adult par défaut |
| TA-17 | REWRITTEN | Volume budget events sans qualityGatesV2 |
| TA-18 | REWRITTEN | Comptage sets par niveau + corrélation events |
| TA-19 | REWRITTEN | Quality gate S4 profil dégradé |
| TA-19b | NEW | evaluateQualityGates direct — no-main-work |
| TA-20 | NEW | classifyACWR(1.3) = optimal |
| TA-21 | NEW | classifyACWR(1.31) = caution |
| TA-22 | NEW | classifyACWR(1.49) = caution |
| TA-23 | NEW | classifyACWR(1.5) = danger |
| TA-24 | NEW | classifyACWR(1.99) = danger |
| TA-25 | NEW | classifyACWR(2.0) = critical |
| TA-26 | NEW | classifyACWR(0.79) = underload |
| TA-27 | NEW | classifyACWR(0.8) = optimal |
| TA-28 | NEW | female + low_back_pain → pas de bloc ACL |

---

## Résultats validation

```
Test Files:  12 passed (12)
Tests:       215 passed (215)
TypeScript:  0 errors
Build:       ✅ (dist/ generated)
```

---

## Risques résiduels

1. **F-02 warning-only** : Le volume budget émet un warning mais ne remplace pas la session. C'est conforme au design P0 (warning first, blocking en P1). Le risque est qu'un utilisateur reçoive une session à 13+ sets sans blocage.

2. **F-04 DELOAD off-season** : `derivePhaseFromRecipe` est une heuristique basée sur le nom de la recette. Si de nouvelles recettes sont ajoutées avec des noms non-standard, le fallback sera FORCE. Acceptable pour le catalogue actuel.

3. **F-06 profil U18 sans aucun champ** : Un profil avec `ageBand: undefined` et `populationSegment: undefined` est traité comme adulte. C'est le seul fallback safe possible, mais un vrai mineur pourrait échapper aux protections si le formulaire d'inscription ne force pas la saisie.

---

## Verdict

**GO FERME pour la Vague B.** Les 6 findings bloquants sont corrigés et testés. 215 tests verts, 0 erreurs TS, build OK.
