# B4 — Hardening transitions (B4-redux post-#47)

**Status** : ✅ SHIPPED 2026-05-08 — Décision #49 dans `docs/release-v1-plan.md`.
**Commits main** : d203f9d (A) → 32765bb (B) → b0587b7 (C) → 4f768dc (D) → 468d389 (E) → 93b638a (F).

## Contexte

Le plan original B4 (release-v1-plan.md §314, écrit pré-#47) ciblait `buildWeekProgram → waveA → resolveMicrocycleArchetype`. La Décision #47 a supprimé toute cette chaîne (-17 426 LOC nettes). La cible test-hardening n'existe plus.

**Cibles plan original** :

| Cible plan | État post-#47 |
|---|---|
| `getEffectivePhase` / `getSessionPhase` | ❌ supprimé |
| `getNextWeekForProfile` | ❌ supprimé |
| `applyAnnualPlanningOverride` (buildWeekProgram.ts:127-272) | ❌ supprimé |
| `resolveMicrocycleArchetype.ts` | ❌ supprimé |
| `waveA.test.ts` | ❌ supprimé |
| `buildWeekProgram*.test.ts` | ❌ supprimé |
| `getPhaseForWeek` | ✅ subsiste — 9 LOC dans `programPhases.v1.ts` (utilisé seulement par ChatPage) |
| `src/services/season/*` | ✅ alive (854 LOC src + 1682 LOC tests) |

## Re-scope B4-redux

**Cible** : couche `src/services/season/*` (la "vraie" surface de planification annuelle post-#47).

**Pourquoi** : `detectAnnualPlanningContext.ts` (847 LOC) est la fonction la plus complexe non triviale du repo qui pilote toutes les décisions de cycle/phase/semaine. Elle a 30+ tests classiques mais aucun test d'invariants structurels. C'est le risque le plus tangible.

**Pourquoi pas un re-build de buildWeekProgram** : irait à l'encontre de l'intention de #47 (simplifier la stack). Si on veut réintroduire un harness de programme hebdo, c'est un sujet V1.1.

## Modules visés et tests existants

| Module | LOC src | LOC tests | Cas couverts |
|---|---:|---:|---|
| `cycleToSeasonPhase.ts` | 14 | — | Pure mapping. Skip. |
| `transitionJournal.ts` | 81 | 115 | append, restore, computeDeferralExpiry, cycleToSeasonMode |
| `deferralRules.ts` | 86 | 104 | 11 cases (purge expired, removed, passed, return-set, advanced, closer-match) |
| `detectSeasonPhase.ts` | 209 | 123 | weekLabel, isMatchWeek, pre-season weeks 1-12 |
| `detectSeasonTransitions.ts` | 167 | 297 | UC1-UC9 (season-end, treve, playoffs, pre-season, off-season match detected) |
| `detectAnnualPlanningContext.ts` | 847 | 516 | CA-1..CA-7, manual overrides, anchors, baselines |
| `seasonLifecycle.integration.test.ts` | — | 393 | mesocycle 3:1, treve, ramp-up, season-end, playoffs, dismissal |

**Densité existante** : 1.97 LOC tests / LOC src. Surface scénarios bien couverte. Surface invariants pas du tout.

## Phase B — Install fast-check + scaffold

- `npm i -D fast-check`
- `src/services/season/__tests__/seasonInvariants.property.test.ts` (nouveau, sentinelle)
- Vérifier vitest run

## Phase C — Properties (12)

| # | Module | Invariant |
|---|---|---|
| P1 | detectAnnualPlanningContext | Ne throw jamais sur input valide (today YYYY-MM-DD + events valides) |
| P2 | detectAnnualPlanningContext | `cycle ∈ AnnualCycle`, `weekLabel` non vide, `planningTrace.resolutionMode` well-formed |
| P3 | detectAnnualPlanningContext | in-season ⟹ `weekNumber === (mesocycleBlock-1)*4 + mesocycleWeek` ET `isDeloadWeek === (mesocycleWeek===4)` |
| P4 | detectAnnualPlanningContext | pre-season ⟹ `weekNumber ∈ [1, effectivePreSeasonWeeks]` ET deload ssi `wn%4===0 OR wn===last` |
| P5 | detectAnnualPlanningContext | off-season ⟹ `weekNumber ≥ 1`, `isDeloadWeek === false` toujours |
| P6 | detectAnnualPlanningContext | Monotonie : `today + 7j` (même cycle) ⟹ `weekNumber + 1` |
| P7 | detectAnnualPlanningContext | Playoffs month guard : `month > 5 + manualPlayoffs ⟹ cycle ≠ 'playoffs'` |
| P8 | detectAnnualPlanningContext | firstMatchDate output cohérent : override prime sur calendrier |
| P9 | deferralRules | `!activeDeferral ⟹ structuralEvents === visibleEvents` ET `!shouldPurge` |
| P10 | deferralRules | `shouldPurge ⟹ structuralEvents === visibleEvents` (purge n'élague pas) |
| P11 | deferralRules | `!shouldPurge && activeDeferral ⟹ |structural| === |visible| - 1` (eventId filtré) |
| P12 | transitionJournal | append maintient `journal.length ≤ 3` ; restore est left-inverse de append |

## Phase D — Fixtures (12-14)

| # | Frontière | Bug potentiel |
|---|---|---|
| F1 | Off-season W2→W3 (phase1→2) | offSeasonPhaseFromWeek borne |
| F2 | Off-season W4→W5 (phase2→3) | borne phase 3 |
| F3 | Off-season W(N-2)→W(N-1) compressé (N=6) | clamp `effectiveOffSeasonWeeks` |
| F4 | Off-season W(N-2)→W(N-1) étalé (N=12) | borne haute |
| F5 | Pre-season W4→W5 (phase1→2) | preSeasonPhaseFromWeek third |
| F6 | Pre-season W8→W9 (phase2→3) | second third |
| F7 | Pre-season last → in-season W1 | bascule `todayWeekMonday >= firstMatchWeekMonday` |
| F8 | In-season W3→W4 (deload trigger) | mesocycle 3:1 |
| F9 | In-season W4→W5 (post-deload, block 2) | mesocycleBlock recompute |
| F10 | treve_deep boundary (DUN=21 vs 22) | `> 21` strict |
| F11 | treve_return boundary (DUN=14 vs 15, DSL≥14) | `≥ 8 && ≤ 14` |
| F12 | treve_rampup boundary (DUN=7 vs 8, DSL≥14) | `≤ 7` |
| F13 | Auto season-end (DSL=27 vs 28, DUN=null) | `>= 28` |
| F14 | Playoffs month guard (May 31 vs June 1) | `month <= 5` |
| F15 | Onboarding grace boundary (T=onboarding+7 vs +8) | `today <= addDays(+7)` (detectSeasonTransitions) |

## Phase E — Triage findings

Pour chaque counter-example fast-check :
- **Bug code** : escalade B4 P0 (Décision #45). Fix code, garder property.
- **Property trop stricte** : relâcher la property (documenter pourquoi).
- **Edge case voulu** : ajouter assertion ciblée dans test classique, retirer du periodique.

### Findings (2026-05-08)

**Aucun bug code détecté.** Deux counter-examples sur P6 (monotonie +7d), tous deux comportements intentionnels :

1. **No-firstMatch fallback** — `today=2025-01-01, events=[]` → `detectAnnualPlanningContext` route au fallback line 622-633 qui ancre l'off-season sur `todayWeekMonday`. L'anchor "glisse" avec `today` donc `weekNumber=1` reste constant. Comportement voulu pour les profils sans calendrier (UX : "tu es en semaine 1 d'inter-saison" plutôt qu'une semaine arbitraire).
   - **Action** : property scopée pour ne s'appliquer que quand `ctxA.offSeasonStartAt === ctxB.offSeasonStartAt`.

2. **Lower clamp avant offSeasonStart** — `today=2025-01-01, match=2025-06-09` → backfill calcule `offSeasonStart=2025-01-06`, mais today (2025-01-01) est *avant* l'anchor. Le code line 745-747 clamp `rawOffWeek=0` à 1. Après +7d, today=2025-01-08 ≥ anchor → W1 réel. Les deux contextes reportent W1.
   - **Action** : property scopée pour skip `if (inputs.today < ctxA.offSeasonStartAt)`.

**Stress-test à 1000 runs/property** : 13/13 vert, aucun nouveau counter-example. Production tourne à 250 runs/property pour rester rapide en CI (~80ms vs 270ms à 1000).

**Verdict B4 P0 escalation (Décision #45)** : non déclenché. B4 reste P1.

## Phase F — Close

- Décision #49 dans `docs/release-v1-plan.md` (B4-redux post-#47, scope final, commits)
- Update `MEMORY.md` ligne RESTE V1 (B4 → SHIPPED)
- Pas de README convention-doc (pas de pipeline complexe à documenter, juste des property tests)

## Effort estimé

- Phase A : 0.1j (fait)
- Phase B : 0.05j
- Phase C : 0.4-0.6j
- Phase D : 0.3-0.4j
- Phase E : variable (0-0.5j selon findings)
- Phase F : 0.1j

**Total** : ~1-1.5j (versus 1.5j initial). Re-scope post-#47 sans expansion d'effort.
