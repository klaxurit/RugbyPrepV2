# Rapport — Fixes Bloquants Post-P1 (GO conditionnel → GO ferme)

**Date** : 2026-03-12
**Baseline commit** : `1e18345`
**Statut** : ✅ 243 tests verts, 0 erreurs TypeScript, build OK

---

## Résumé

6 findings corrigés de la revue adversariale post-P1. Les 3 bloquants (F-B01 scoring position/phase fusionné, F-B02/F-B10 progression cycle 3:1, F-B03 caution sur deload) et 3 complémentaires (F-B04 event U18 trompeur, F-B05 tests U18 profils incomplets, F-B06 reporting "5 vs 4", F-B08 test builder négatif, F-B11 TB-08 faux positifs) sont résolus avec 8 nouveaux tests.

---

## Détail par finding

### F-B01 [CRITICAL] — Scoring position (+5) et phase (+3) séparés ✅

**Fichier** : `src/services/program/buildSessionFromRecipe.ts`

**Correction** : `scoreBlock()` et `chooseBlockByIntent()` reçoivent maintenant des paramètres distincts :
- `positionPreferTags` / `positionAvoidTags` → poids +5 / -2
- `phasePreferTags` / `phaseAvoidTags` → poids +3 / -2

Avant : `preferTags = [...positionPreferences.preferTags, ...phasePreferences.preferTags]` → tout à +5
Après : Position à +5, Phase à +3, scoring séparé

Les 3 appels à `chooseBlockByIntent` (primaire, safety force, safety off) sont mis à jour.

**Score breakdown** (FRONT_ROW, FORCE phase, bloc avec `hinge + squat`) :
- Avant : preferTags = `['scrum','neck','contact','carry','hinge','posterior_chain', 'force','hinge','squat',...]` → +5 × matches
- Après : position `['hinge']` → +5, phase `['hinge','squat']` → +3×2 = +6, total = +11 (vs +15 avant)
- Le delta position entre FRONT_ROW (+5 pour `hinge`) et BACK_THREE (+0 pour `hinge`) est maintenant significatif (+5 écart net vs +5 équivalent avant)

---

### F-B02/F-B10 [HIGH] — Progression cycle 3:1 in-season ✅

**Fichiers** :
- `src/services/program/programPhases.v1.ts:113-137` — nouvelle fonction `getNextWeekForProfile()`
- `src/pages/ProgramPage.tsx:31-32, 62-65, 139` — filtrage week selector
- `src/pages/WeekPage.tsx:26-27, 60-65, 298` — filtrage week selector

**Correction** :
1. `getNextWeekForProfile(week, seasonMode, trainingLevel)` : pour `performance + in_season`, W3→W5, W7→W1, H3→W1 (saute W4/W8/H4)
2. Frontend : les semaines W4, W8, H4 sont masquées du sélecteur de semaine pour les profils in-season performance

**Progression in-season 3:1** :
```
W1 → W2 → W3(deload) → W5 → W6 → W7(deload) → W1 (nouveau cycle)
H1 → H2 → H3(deload) → W1 (transition force)
```

**Progression off-season/pre-season** (inchangée) :
```
W1 → W2 → W3 → W4 → DELOAD → ...
```

---

### F-B03 [HIGH] — Caution ACWR sur semaine auto-deload ✅

**Fichier** : `src/services/program/buildWeekProgram.ts:183, 203-215`

**Correction** : Quand `isDeloadWeek` est vrai et que `safetyContracts` émet un `versionW1OverrideIndexes` :
- Les warnings contenant "version W1" sont filtrés (déjà en deload)
- L'event `action:caution-fatigue-version-downgrade` est filtré
- Les `versionW1OverrideIndexes` sont vidés (pas de double override)

Le warning ACWR informatif non-caution (ex: danger/critical) passe toujours.

---

### F-B04 [HIGH] — Event U18 cap trompeur si deload ✅

**Fichier** : `src/services/program/buildWeekProgram.ts:257`

**Correction** : L'event `hard:u18-version-cap` et le warning U18 ne sont émis que quand `!isDeloadWeek`. Si le deload force déjà W1, le cap U18 (W2) est une information trompeuse.

---

### F-B05 [HIGH] — Tests U18 profils incomplets ✅

**Fichier** : `src/services/program/waveA.test.ts`

**Tests ajoutés** :
- **TB-09d** : profil sans `ageBand` ni `populationSegment` à W3 → pas de cap U18 (adulte par défaut), versions W3 présentes
- **TB-09e** : profil U18 via `populationSegment: 'u18_male'` seul (pas d'ageBand) à W3 → cap appliqué, versions ≤ W2
- **TB-09f** : U18 + in-season W3 → event auto-deload présent, event U18 cap absent (F-B04)

---

### F-B06 [HIGH] — Rapport "5 items" corrigé à "4 items" ✅

**Fichier** : `_bmad-output/implementation-artifacts/implementation-wave-b-p1-2026-03-12.md:11`

---

### F-B08 [MEDIUM] — Test builder négatif pour 3:1 ✅

**Tests ajoutés** :
- **TB-05b** : builder + in_season + W3 → pas d'auto-deload
- **TB-05c** : in-season W3 + ACWR caution → pas de version downgrade caution (F-B03)
- **TB-05d** : `getNextWeekForProfile` : W3→W5, W7→W1, H3→W1 (in-season performance)
- **TB-05e** : `getNextWeekForProfile` : W3→W4 (off-season, standard 4:1)
- **TB-05f** : `getNextWeekForProfile` : W3→W4 (builder in-season, standard 4:1)

---

### F-B11 [MEDIUM] — TB-08 faux positifs corrigés ✅

**Correction** : TB-08 et TB-09 utilisent maintenant `seasonMode: 'off_season'` pour les semaines W3/W7/H3, isolant le test du cap U18 de l'auto-deload 3:1.

---

## Fichiers modifiés

| Fichier | Finding(s) |
|---|---|
| `src/services/program/buildSessionFromRecipe.ts` | F-B01 |
| `src/services/program/buildWeekProgram.ts` | F-B03, F-B04 |
| `src/services/program/programPhases.v1.ts` | F-B02/F-B10 |
| `src/pages/ProgramPage.tsx` | F-B02 (frontend) |
| `src/pages/WeekPage.tsx` | F-B02 (frontend) |
| `src/services/program/waveA.test.ts` | F-B05, F-B08, F-B11 |
| `_bmad-output/.../implementation-wave-b-p1-2026-03-12.md` | F-B06 |

---

## Tests ajoutés/modifiés

| ID | Type | Description |
|---|---|---|
| TB-05b | NEW | Builder + in_season + W3 → pas d'auto-deload |
| TB-05c | NEW | In-season W3 + ACWR caution → pas de caution version downgrade |
| TB-05d | NEW | getNextWeekForProfile: in-season 3:1 skip (W3→W5, W7→W1, H3→W1) |
| TB-05e | NEW | getNextWeekForProfile: off-season standard 4:1 |
| TB-05f | NEW | getNextWeekForProfile: builder in-season standard 4:1 |
| TB-08 | MODIFIED | off_season pour isoler U18 cap du 3:1 auto-deload |
| TB-09 | MODIFIED | off_season pour isoler U18 cap |
| TB-09d | NEW | Profil incomplet (no ageBand, no segment) → pas de cap U18 |
| TB-09e | NEW | U18 via segment seul → cap appliqué |
| TB-09f | NEW | U18 + in-season W3 → pas d'event U18 cap trompeur (deload active) |

---

## Résultats validation

```
Test Files:  15 passed (15)
Tests:       243 passed (243)
TypeScript:  0 errors
Build:       ✅ (dist/ generated)
```

---

## Risques résiduels

1. **F-B07 (Medium, non corrigé)** : TB-03/TB-04 testent FRONT_ROW vs BACK_THREE (paires extrêmes). Les paires proches (BACK_ROW vs CENTERS) ne sont pas testées. Maintenant que F-B01 sépare position (+5) et phase (+3), l'écart net entre positions proches est ~5 points (1 tag différent × 5). Suffisant pour créer une différenciation sur certains blocs, mais pas garanti sur toutes les paires. → Acceptable pour P1, à valider en P2 avec matrice exhaustive.

2. **F-B09 (Medium, non corrigé)** : Pas de test E2E ACWR 1.30 → buildWeekProgram. Le hook `classifyACWR` est testé unitairement (TA-20: 1.3=optimal), le moteur reçoit `fatigueLevel` pré-classifié. L'intégration complète nécessiterait un test React (hook + moteur). → Acceptable pour P1.

3. **F-B12/F-B13 (Low, non corrigés)** : W1 override sur recette rehab = no-op silencieux. Pas de test deload 3:1 + rehab combiné. → Risque accepté, documenté.

4. **Semaine sélectionnée invalide** : Si un joueur in-season a déjà sélectionné W4/W8/H4 dans localStorage avant cette mise à jour, il pourra encore voir cette semaine via le WeekProvider. Le sélecteur ne l'affichera plus, mais la valeur reste. → Impact faible (le moteur traite W4 normalement, pas comme un deload).

---

## Verdict

**GO FERME pour la Vague C.** Les 3 findings bloquants et 3 complémentaires sont corrigés. 243 tests verts, 0 erreurs TS, build OK.
