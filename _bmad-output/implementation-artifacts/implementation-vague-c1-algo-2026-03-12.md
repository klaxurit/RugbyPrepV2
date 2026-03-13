# Rapport — Vague C1 : Fixes Algo Bloquants (VC-01 + VC-05)

**Date** : 2026-03-12
**Baseline commit** : `1e18345`
**Statut** : ✅ 341 tests verts, 0 nouvelle erreur TypeScript, build OK

---

## Résumé

2 fixes algo implémentés depuis la validation métier Vague C :
- **VC-01** : ACL prehab systématique pour toutes les femmes (female_senior + u18_female), chaque semaine non-deload
- **VC-05** : Deload réduit à 2 sessions max (suppression de la 3e session mobilité dupliquée)

14 nouveaux tests + 3 tests existants mis à jour.

---

## Détail par finding

### VC-01 [CRITICAL] — ACL prehab systématique pour toutes les femmes ✅

**Fichier** : `src/services/program/buildWeekProgram.ts:345-376`

**Problème** : Le check ACL prehab cherchait un bloc avec le tag `knee_health`. Or `BLK_PREHAB_HAMSTRING_01` (nordic hamstrings) porte ce tag → quand le hamstring prehab était déjà présent dans la session, le moteur considérait la prévention ACL satisfaite. Résultat : l'ACL-specific block (`BLK_PREHAB_ACL_PREVENT_01` avec `hip_stability`, `landing mechanics`, single-leg balance) n'était jamais injecté.

**Correction** : Le check exige maintenant le tag `hip_stability` (spécifique au bloc ACL prevent, absent du hamstring prehab). La recherche du bloc à injecter cible aussi `hip_stability`.

**Justification** :
- Hamstring prehab (nordics) ≠ ACL prevention (landing mechanics + hip stability)
- KB population-specific.md §1.3 : les femmes U18 sont la population la plus à risque ACL
- Le tag `hip_stability` est un discriminant fiable : seul `BLK_PREHAB_ACL_PREVENT_01` le porte

**Impact** :
- `female_senior` : ACL prehab injecté **chaque semaine non-deload** (plus intermittent)
- `u18_female` : ACL prehab injecté (était absent avant — identique au garçon)
- Homme/deload/auto-deload : pas d'injection (négatifs testés)

---

### VC-05 [HIGH] — Deload : suppression de la 3e session dupliquée ✅

**Fichier** : `src/services/program/buildWeekProgram.ts:151-167`

**Problème** : Pour un profil 3x en deload, `getDeloadRecipeIds()` retournait `[structuredId, mobilityId, mobilityId]` → 2 sessions RECOVERY_MOBILITY_V1 identiques (mêmes blocs HIP + THORACIC).

**Arbitrage retenu** : **Option 2 — Supprimer la 3e session**.

Raisons :
1. **Simplicité** : avec seulement 3 blocs mobilité, différencier 2 sessions est impossible sans ajouter du contenu
2. **Crédibilité** : un préparateur physique ne prescrit pas 2 séances mobilité identiques
3. **Gold standard** : en deload terrain, on fait 1-2 séances légères, pas 3
4. **Maintenabilité** : pas de nouvelle logique de routing, juste un changement de retour

**Correction** : `getDeloadRecipeIds()` retourne toujours `[structuredId, mobilityId]` pour les non-starter (2 sessions max).

**Impact** :
- Performance/Builder 3x en DELOAD : 2 sessions au lieu de 3
- Performance/Builder 3x en auto-deload (W3/W7/H3) : 2 sessions au lieu de 3
- Performance/Builder 2x : inchangé (déjà 2)
- Starter : inchangé (toujours 2 mobilités — pas de session structurée)

---

## Fichiers modifiés

| Fichier | Finding(s) |
|---|---|
| `src/services/program/buildWeekProgram.ts` | VC-01, VC-05 |
| `src/services/program/waveA.test.ts` | TC-01 à TC-14, TA-04 modifié |
| `src/services/program/buildWeekProgram.contract.test.ts` | 1 test modifié (deload 3→2) |
| `src/services/program/sessionIntensity.test.ts` | 1 test modifié (deload 3→2) |

---

## Tests ajoutés/modifiés

| ID | Type | Description |
|---|---|---|
| TC-01 | NEW | female_senior gets ACL prehab (hip_stability) at W1 |
| TC-02 | NEW | u18_female gets ACL prehab (hip_stability) at W1 |
| TC-03 | NEW | female_senior gets ACL prehab at W5 (systematic) |
| TC-04 | NEW | u18_female gets ACL prehab at W5 (systematic) |
| TC-05 | NEW | Male profile does NOT get ACL prehab (négatif) |
| TC-06 | NEW | Female DELOAD does NOT get ACL prehab (négatif) |
| TC-07 | NEW | Female in-season W3 auto-deload does NOT get ACL prehab (négatif) |
| TC-08 | NEW | Performance 3x DELOAD → exactly 2 sessions |
| TC-09 | NEW | Performance 3x in-season W3 auto-deload → exactly 2 sessions |
| TC-10 | NEW | Performance 3x in-season W7 auto-deload → exactly 2 sessions |
| TC-11 | NEW | Builder 3x DELOAD → exactly 2 sessions |
| TC-12 | NEW | Performance 2x DELOAD → 2 sessions (unchanged) |
| TC-13 | NEW | Starter DELOAD → 2 sessions (unchanged) |
| TC-14 | NEW | Normal week still has 3 sessions for 3x (no regression) |
| TA-04 | MODIFIED | DELOAD 3x expectations: 3→2 sessions |
| contract:DELOAD | MODIFIED | DELOAD routing: 3→2 sessions |
| TID-INT-006 | MODIFIED | DELOAD intensity: 3→2 sessions |

---

## Résultats validation

```
Test Files:  16 passed (16)
Tests:       341 passed (341)
TypeScript:  0 nouvelles erreurs
Build:       ✅ (dist/ generated)
```

---

## Risques résiduels

1. **VC-01 + low_back_pain** : Si une femme a `low_back_pain`, le bloc `BLK_PREHAB_ACL_PREVENT_01` peut être contraindicé au niveau exercice → pas d'injection ACL. Couvert par test existant TA-28. Comportement correct (sécurité > prévention).

2. **VC-05 starter deload** : Le starter garde 2 sessions mobilité identiques. Acceptable car les sessions starter en deload sont courtes (2 blocs mobilité) et le starter est le profil le moins exigeant en variété.

3. **Régression frontend** : Les pages WeekPage/ProgramPage affichent les sessions retournées par `buildWeekProgram`. Avec 2 sessions au lieu de 3 en deload, l'affichage sera correct (loop sur `result.sessions`). Pas d'impact frontend.

---

## Verdict

**Vague C1 complète.** Les 2 derniers bloqueurs algo sont corrigés. Le moteur est maintenant prêt pour le sprint d'enrichissement contenu (blocs, exercices, variété).
