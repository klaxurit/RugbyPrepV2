# Rapport — Vague B (P1) Implémentation

**Date** : 2026-03-12
**Baseline commit** : `1e18345`
**Statut** : ✅ 235 tests verts, 0 erreurs TypeScript, build OK

---

## Résumé

4 items P1 implémentés depuis le roadmap hypothèses : H8 (position scoring +5), H12 (ACWR caution W1 downgrade), H9 (deload 3:1 in-season), H11 (U18 version cap W2). H7 (intensité +2/-2) et H10 (quality gate no-main-work) étaient déjà livrés en Wave A. 13 nouveaux tests ajoutés (TB-03 à TB-11b), 1 test modifié (TA-06).

---

## Détail par hypothèse

### H8 — Position scoring +3 → +5

**Fichier** : `src/services/program/buildSessionFromRecipe.ts:120-123`

**Modification** : Poids `preferTags` (position-driven) passé de +3 à +5 dans `scoreBlock()`.

**Justification** : Statistical-calibration §3.4 — +3 = 15-20% du score total, insuffisant pour différencier les blocs par poste. +5 = 25-30%, aligne avec les demandes positionnelles (Duthie 2003).

**Impact** : Les profils FRONT_ROW et BACK_THREE sélectionnent maintenant des blocs différents sur UPPER_V1 et LOWER_V1 (vérifié par TB-03, TB-04).

**Tests** : TB-03, TB-04.

---

### H12 — ACWR caution → version W1 sur dernière séance

**Fichiers** :
- `src/services/program/policies/safetyContracts.ts:19,22,178-192`
- `src/services/program/buildWeekProgram.ts:191,253-260`

**Modification** :
1. `ApplySafetyContractsOutput` : nouveau champ `versionW1OverrideIndexes: number[]`
2. ACWR caution (1.3–1.5) avec ≥2 séances : marque la dernière séance pour version W1 (event `action:caution-fatigue-version-downgrade`)
3. ACWR caution avec 1 seule séance : warning informatif seulement (event `info:caution-fatigue-warning`)
4. `buildWeekProgram` : passe `effectiveWeek = 'W1'` pour les sessions marquées

**Distinction claire danger vs caution** :
| Zone | ACWR | Action |
|------|------|--------|
| Caution | 1.3–1.5 | Version W1 sur dernière séance (volume réduit ~20-30%) |
| Danger | 1.5–2.0 | Dernière séance remplacée par mobilité |
| Critical | ≥2.0 | Programme réduit à 1 séance |

**Tests** : TB-10, TB-11, TB-11b, TA-06 (modifié).

---

### H9 — Deload 3:1 in-season (Pritchard 2015)

**Fichier** : `src/services/program/buildWeekProgram.ts:170-183`

**Modification** : Pour les profils `performance` + `in_season`, les semaines W3/W7/H3 déclenchent automatiquement le routing DELOAD (1 séance structurée W1 + mobilité).

**Logique** :
- `IN_SEASON_DELOAD_WEEKS = Set(['W3', 'W7', 'H3'])`
- `isInSeasonAutoDeload` → routing deload + pas d'intensity pattern + phase dérivée de recette
- Off-season et pre-season : inchangés (4:1)
- Starter et builder : inchangés (cycles fixes)

**Impact** : Warning `Deload 3:1 in-season (W3) : volume réduit automatiquement (Pritchard 2015).` + event `info:in-season-3-1-deload:W3`.

**Tests** : TB-05, TB-06, TB-07, TB-07b.

---

### H11 — U18 version cap W2

**Fichiers** :
- `src/services/program/policies/ruleConstants.v1.ts:21` : ajout `maxVersion: 'W2'`
- `src/services/program/buildWeekProgram.ts:238-248`

**Modification** : Pour les profils U18 (`population.isU18`), la version est plafonnée à W2. Les semaines W3/W4/H3/H4/W7/W8 utilisent W2 au lieu de W3/W4.

**Justification** : KB population-specific.md §2 — plaques de croissance + tendons immatures → pas de charge de pic (W3/W4).

**Impact** : Warning `U18 : version plafonnée à W2 (pas de progression W3/W4).` + event `hard:u18-version-cap:W3:W2`.

**Tests** : TB-08 (6 semaines vérifiées), TB-09, TB-09b, TB-09c.

---

## Fichiers modifiés

| Fichier | Hypothèse(s) |
|---|---|
| `src/services/program/buildSessionFromRecipe.ts` | H8 |
| `src/services/program/policies/safetyContracts.ts` | H12 |
| `src/services/program/buildWeekProgram.ts` | H9, H11, H12 |
| `src/services/program/policies/ruleConstants.v1.ts` | H11 |
| `src/services/program/waveA.test.ts` | TB-03 à TB-11b, TA-06 modifié |

---

## Tests ajoutés/modifiés

| ID | Type | Description |
|---|---|---|
| TA-06 | MODIFIED | ACWR caution → versionW1OverrideIndexes + event action:caution-fatigue-version-downgrade |
| TB-03 | NEW | FRONT_ROW vs BACK_THREE UPPER_V1 → blocs différents |
| TB-04 | NEW | FRONT_ROW vs BACK_THREE LOWER_V1 → blocs différents |
| TB-05 | NEW | In-season W3 → auto-deload |
| TB-06 | NEW | Off-season W3 → pas d'auto-deload |
| TB-07 | NEW | In-season W7 → auto-deload (2e cycle 3:1) |
| TB-07b | NEW | In-season W2 → pas de deload |
| TB-08 | NEW | U18 jamais version W3/W4 (6 semaines vérifiées) |
| TB-09 | NEW | U18 W3 → version W2 + event + warning |
| TB-09b | NEW | U18 W2 → pas de cap (dans la limite) |
| TB-09c | NEW | Adulte W3 → pas de cap U18 + versions W3 présentes |
| TB-10 | NEW | ACWR caution → 0 session remplacée |
| TB-11 | NEW | ACWR caution → dernière séance version W1 |
| TB-11b | NEW | ACWR caution 1 séance → warning seul |

---

## Résultats validation

```
Test Files:  15 passed (15)
Tests:       235 passed (235)
TypeScript:  0 errors
Build:       ✅ (dist/ generated)
```

---

## Items P1 non implémentés dans cette vague

1. **TB-01/TB-02 (H7 intensity +2/-2)** : Déjà implémenté en P0 (Wave A). Tests de vérification existants dans TA-09/TA-10.

2. **RTP critères objectifs** : Le roadmap mentionne des critères RTP mais ne les classe pas explicitement en Vague B. Les critères RTP actuels (rehab phases P1→P2→P3) sont déjà en place via `safetyContracts.ts` rehab routing. Des critères objectifs supplémentaires (LSI, pain scales) nécessiteraient des données patient non disponibles dans le profil actuel → P2.

3. **Quality gate always-on** : Le volume budget est déjà always-on (F-02 fix). Les quality gates restants (missing required slots, empty sessions, full-body balance, no-main-work) sont derrière `qualityGatesV2` flag. Les rendre always-on nécessite une revue de leur impact sur les profils dégradés → P2.

---

## Risques résiduels

1. **H9 auto-deload in-season** : Un profil in-season à W3 recevra un deload même si le joueur n'a pas besoin de récupération. C'est conforme à Pritchard 2015 (fatigue anticipée), mais pourrait frustrer un joueur en forme. Le paramètre `week` étant choisi par le frontend, l'UX pourrait afficher un indicateur "semaine de décharge automatique".

2. **H12 caution single-session** : Avec une seule séance, le caution ne peut pas downgrader sans supprimer la seule session. Le fallback warning est correct mais le joueur n'a pas de réduction concrète. Acceptable car ACWR caution avec 1 séance/sem est rare (faible charge aiguë).

3. **H11 U18 DELOAD** : Un profil U18 en DELOAD reçoit W1 (pas de cap nécessaire). Si W3/W7 sont en auto-deload in-season ET U18, les deux mécanismes s'appliquent sans conflit (deload routing prend le relais avant le cap).

4. **H8 scoring sensitivity** : +5 crée une forte différenciation positionnelle. Si un poste a peu de blocs avec ses tags préférés, le scoring pourrait favoriser des blocs sous-optimaux. Mitigation : les tags position sont larges (6 tags par poste) et le fallback chain reste actif.

---

## Verdict

**Vague B (P1) complète.** 5 hypothèses implémentées avec 13 nouveaux tests + 1 modifié. 235 tests verts, 0 erreurs TS, build OK. Prêt pour revue adversariale post-P1 ou Vague C.
