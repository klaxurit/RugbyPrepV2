# B2 — Audit rest times motherSessions vs KB

**Statut** : Phase A en cours
**Décision parente** : #48 (à ouvrir post-#47)
**Source spec** : `docs/release-v1-plan.md` Section 8 B2 (v2 review-validated)
**Re-scope** : `docs/decision-47-cleanup-plan.md` ligne 194-201 (B2 reset sur motherSessions après #47)

## 1. Pourquoi ce doc

Après #47, les rest times ne sont plus stockés dans `restSeconds` typé sur `versions[]`. Ils vivent maintenant dans des **strings libres** :

- `Block.format` (string libre, ex. `` "`3 rounds`, `90-120s` rest after the pair" ``)
- `Block.coachingNotes` (string array libre)

Un parser dédié est requis. Le `parseBlockFormat` existant (`src/services/ui/parseBlockFormat.ts`) ne traite que la **structure** (EMOM/Tabata/AMRAP/rounds), pas les rest times.

## 2. Corpus quantifié (2026-05-08)

| Cycle | Sessions | Source data |
|---|---:|---|
| off-season | 17 | MD files in `docs/training/mother-sessions/off-season/` |
| in-season | 8 | INLINE in `src/data/motherSessions.generated.ts` |
| pre-season | 14 | INLINE in `src/data/motherSessions.generated.ts` |
| **Total** | **39** | |

| Métrique | Valeur |
|---|---:|
| Total blocks | 155 |
| Distinct `format` strings | 46 |
| Empty `format` (warmups, etc.) | 3 |

**Conséquence** : Phase B' prévoit la migration des 22 sessions inline vers MD. Toutes les corrections post-audit passent par MD + regen, conforme à la convention single-source-of-truth.

## 3. Patterns de format (catalogue)

Les 46 strings se répartissent en **6 classes structurelles** :

### Classe 1 — Tour-based avec rest entre rounds (typique hypertrophy/power)
Format : `` `N rounds`, `X-Ys` rest [after the round|pair|triplet]? ``

Exemples (count) :
- `` `3 rounds`, `75-90s` rest after the pair `` × 11
- `` `2 rounds`, `45-60s` rest `` × 11
- `` `3 rounds`, `90-120s` rest after the pair `` × 10
- `` `4 rounds`, `90-120s` rest after the pair `` × 8
- `` `3 rounds`, `60-75s` rest after the pair `` × 4
- variantes 60-90s, 75-90s, 60-75s

**Variantes de la qualifier `after`** :
- `after the round` (round entier)
- `after the pair` (pair = round contenant 2 exos)
- `after the triplet` (triplet = round contenant 3 exos contrast)
- `between drills` (intra-round, low priority)
- (omis = sous-entendu inter-round)

### Classe 2 — Force-style (work sets explicite ou full rest min)
Format : `` `N work sets`, `X-Y min` rest between sets `` ou `` `N rounds`, full rest `X-Y min` ``

Exemples :
- `` `4 work sets`, `2-3 min` rest between sets `` × 4
- `` `4 work sets`, `2 min` rest between sets `` × 4
- `` `4 rounds`, full rest `3 min` after each round `` × 4
- `` `4 rounds`, `3-4 min` rest between rounds `` × 4
- `` `3 rounds`, full rest `90-120s` `` × 6
- `` `3 rounds`, full rest `2-3 min` `` × 6
- `` `3 rounds`, full rest `3 min` `` × 4
- `` `3 work sets`, `2-3 min` rest between sets `` × 1
- `` `4 rounds`, full rest `2 min 30 to 3 min` after each round `` × 2 (compound)

### Classe 3 — EMOM (timed)
Format : `` `EMOM N'` ``
- `` `EMOM 8'` `` × 4
- `` `EMOM 6'` `` × 4
- `` `EMOM 9'` `` × 1

EMOM convention : intervalle = 60s. "Rest" = temps restant après chaque rep dans la minute. Pas de mapping direct aux KB ranges → règle dédiée.

### Classe 4 — Sprint / drills (walk-back / minimal)
- `` `6-8 reps`, walk-back recovery and full rest between reps `` × 1 (sprints)
- `` `2 rounds`, minimal rest `` × 2 (warm-up flow / mobility)
- `` `2 rounds`, move continuously with minimal rest `` × 1
- `` `1-2 rounds`, `20-30s` rest between drills `` × 4 (warmup / activation)
- `` `1 round`, `20-30s` rest between drills `` × 1
- `` `1-2 rounds`, `30-45s` rest `` × 2

### Classe 5 — Composite (multi-niveau de rest)
Précédence : capturer le rest **entre rounds** (round = exécution complète du `scheme`).

- `` `4 rounds`, `10-15s` between exercises, full rest `3-4 min` after each round `` × 4
  → Ignorer "10-15s between exercises" (intra-round) ; capturer **3-4 min** (inter-round, force).
- `` `2 drills`, `3-4 reps` each, full rest `60-90s` [between reps]? `` × 2
  → Sprint cluster : rest entre reps (60-90s).
- `` `W5-W6 = 4 rounds`, `W7 = 5 rounds`, `W8 = 4 rounds`, full rest `90-120s` between reps and `2-3 min` between rounds `` × 1
  → Block periodization. Capturer **2-3 min between rounds** (inter-round, force).

### Classe 6 — Vide
`""` × 3 → warmups indépendants ou blocs prep (pas de scheme propre, pas de rest applicable).

## 4. Intent heuristique (inférence depuis Block.name + structure)

Pas de champ `intent` dans `Block`. À dériver. Heuristique en 9 catégories :

| Intent | Keywords name (regex) | Range KB (s) | Source KB |
|---|---|---|---|
| `force` | `force\|strength\|primary\|main\b\|squat\|deadlift\|press\b\|bench(?! support\|.* renfo)\|trap bar\|romanian\|hinge` (sans "speed/contrast") | **180-300** | strength-methods.md:218 (Effort Maximal 3-5min) |
| `power_contrast` | `contrast\|cluster\|power\|olympic\|jerk\|clean\|snatch\|broad jump\|cmj\|countermovement\|projection.* pair\|force-projection\|force-power\|speed-power\|force-speed` | **120-180** | Décision #40 v2 (rest après triplet contrast/cluster) |
| `dynamic` | `dynamic\|speed\|landmine.*press.* (rotational\|explosive)\|medball throw\|throw\|launch\|pogo` | **60-90** | strength-methods.md:245 (Effort Dynamique) |
| `hypertrophy` | `hypertrophy\|renfo\|push.*pull strength\|push.?pull\|posterior chain\|support block\|accessory\|finisher rugby` (et formats `60-120s` typiques) | **60-120** | strength-methods.md:276 (Effort Répété) |
| `dup_endurance` | DUP session = `cycle in_season` + `sessionType full` + bloc tagué `endurance\|metcon` (+rare) | **60-90** | periodization.md:122 (DUP Séance C) |
| `activation` | `warm.?up\|prep\|ramp.?up\|rehearsal\|primer\|easy.* round\|progressive` | **30-60** | KB silent → soft rule documentée ici (cohérence intra-corpus) |
| `prehab` | `prehab\|rehab\|stability\|groin\|lower.?leg\|tibialis\|copenhagen\|adductor\|hip stability\|nordic\|y-balance` | **30-90** | KB silent → soft rule (Décision #46 retag prehab 60-90s) |
| `core` | `core\|trunk\|anti.?rotation\|cable chop\|dead bug\|hollow\|carry\|farmer\|zercher\|front rack\|neck\|carry support` | **30-90** | KB silent → soft rule |
| `sprint` | `sprint\|acceleration\|free accel\|fly\|10.?m\|shuttle\|cod\|change of direction\|5-10-5\|athletic finisher` | **60-180** | walk-back / full rest entre reps (KB silent — soft) |
| `conditioning` | `conditioning\|metcon\|circuit\|emom\|tabata\|amrap` ou `format` contient EMOM/Tabata/AMRAP | **protocol-specific** | strength-methods.md (1:1, 1:2, 1:3 selon protocole) |
| `reward` | `reward\|arm pump\|confidence\|optional` (et `isOptional: true`) | **30-90** | Soft (accessoire, KB silent) |

**Order de matching** : du plus spécifique (sprint, conditioning, contrast) au plus générique (force, hypertrophy). En cas de double-match, le premier dans l'ordre suivant gagne :

1. `conditioning` (format EMOM/Tabata/AMRAP)
2. `sprint`
3. `power_contrast`
4. `dynamic`
5. `dup_endurance` (signal cycle + sessionType + name)
6. `activation`
7. `prehab`
8. `core`
9. `force`
10. `hypertrophy`
11. `reward`
12. `unknown` (fallback → surface en audit)

## 5. KB ranges autoritatives

| Intent | Min (s) | Max (s) | Tolérance ±s | Source |
|---:|---:|---:|---:|---|
| force | 180 | 300 | 0 | [strength-methods.md:218](../src/knowledge/strength-methods.md) |
| power_contrast | 120 | 180 | 0 | Décision #40 v2 (révisée 2026-05-07) |
| dynamic | 60 | 90 | 0 | [strength-methods.md:245](../src/knowledge/strength-methods.md) |
| hypertrophy | 60 | 120 | 0 | [strength-methods.md:276](../src/knowledge/strength-methods.md) |
| dup_endurance | 60 | 90 | 0 | [periodization.md:122](../src/knowledge/periodization.md) |
| activation | 30 | 60 | 15 | KB silent — soft, ±15 acceptable |
| prehab | 30 | 90 | 15 | KB silent — soft, Décision #46 |
| core | 30 | 90 | 15 | KB silent — soft |
| sprint | 60 | 180 | 30 | KB silent — walk-back varies |
| reward | 30 | 90 | 15 | Soft accessoire |
| conditioning | n/a | n/a | n/a | Protocol-specific (skip in test) |
| unknown | n/a | n/a | n/a | Surface as fail in audit |

**Règle d'overlap** : un block PASSES si `[parsedMin, parsedMax]` chevauche `[kbMin - tolerance, kbMax + tolerance]`. La parfaite inclusion n'est pas requise (Block.format encode souvent un range, pas une valeur). Exemple : `60-120s` rest sur un bloc `hypertrophy` (KB 60-120) → PASS exact match. `90-120s` sur `hypertrophy` → PASS overlap. `120-180s` sur `hypertrophy` → FAIL (no overlap).

## 6. Allowlist (cas hors-règle documentés)

| Pattern format | Justification | Statut |
|---|---|---|
| `""` (empty) | Warmups indépendants — pas de scheme propre | SKIP audit |
| `minimal rest` / `move continuously` | Mobility flows / activation continue | SKIP audit (no rest measurable) |
| `walk-back recovery` | Sprints — rest dépend du run, pas chrono fixe | SKIP audit (sprint kind) |
| EMOM/Tabata/AMRAP | Timed conditioning — rest = inter-interval, géré par protocole | SKIP audit (conditioning kind) |
| `between drills` (only) sans inter-round qualifier sur `1 round` | Single-round prep — pas de rest inter-round applicable | SKIP audit |

## 7. Sortie attendue Phase B

`scripts/auditRestTimes.mjs` produit :

```
sessionId,blockNum,blockName,intent,parsedMin,parsedMax,kbMin,kbMax,status,reason
FULL_BODY_IN_SEASON_BACK_THREE_V1,1,Lower Power Pair,power_contrast,180,180,120,180,PASS,exact-overlap
FULL_BODY_IN_SEASON_BACK_THREE_V1,2,Upper Push/Pull Strength,hypertrophy,90,120,60,120,PASS,overlap
FULL_BODY_IN_SEASON_BACK_THREE_V1,3,Posterior Chain / Rotation Support,hypertrophy,75,90,60,120,PASS,overlap
...
```

Statuts possibles :
- `PASS` — overlap KB range (ou allowlist)
- `FAIL_RANGE` — parsed hors range
- `FAIL_INTENT_UNKNOWN` — heuristique n'a pas matché
- `FAIL_PARSE` — format string non parsable (parser miss)
- `SKIP` — allowlist (empty, minimal, walk-back, conditioning)

Et un résumé markdown : `docs/b2-rest-times-findings.md` avec aggrégats par intent + listing des FAILs.

## 8. Phases (récap)

| Phase | Livrable | Effort | Commit |
|---|---|---|---|
| A | Ce doc + intent heuristique + KB ranges | 0.5j | `B2 phase A: discovery + audit plan` |
| B | Parser + audit script + findings dump | 1j | `B2 phase B: parser + dry-run audit` |
| B' | Migrate 22 inline sessions → MD | 1j | `B2 phase B': migrate in/pre-season inline to MD` |
| C | Triage findings (data bug / intent mistag / allowlist / parser miss) | 0.5j | `B2 phase C: findings triage + corrections plan` |
| D | Apply corrections + regen + re-audit clean | 1-1.5j | `B2 phase D: apply rest time corrections in MD` |
| E | Strict contract test | 0.5j | `B2 phase E: restTimes contract test` |
| F | MEMORY.md + release-v1-plan + README convention | 0.25j | `B2 phase F: docs + close` |
| **Total** | | **~4.5j** | 7 commits |

## 9. Risques connus

- **Heuristique intent imparfaite** : certains blocks ont des noms ambigus (`Posterior Chain / Rotation Support` → hypertrophy ou force ?). Phase C inclut une review manuelle des `unknown`.
- **Migration in/pre-season** : le parser MD existant (`parseAllMotherSessions`) doit accepter les nouveaux fichiers. Vérifier compatibilité avec le format actuel des off-season MDs.
- **Régénération idempotente** : Phase B' doit produire un diff vide entre `motherSessions.generated.ts` actuel et la version regénérée à partir des nouveaux MDs (modulo cosmetic).
- **Test strict** : Phase E peut révéler des `FAIL_INTENT_UNKNOWN` que la Phase D n'a pas couverts. Provisionner ~0.25j buffer.
