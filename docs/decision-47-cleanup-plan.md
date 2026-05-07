# Decision #47 — Legacy stack cleanup plan

**Branch** : `chore/decision-47-cleanup`
**Started** : 2026-05-07
**Estimated effort** : ~5 days (1 commit per phase, 6 phases A-F)
**Status** : Phase 0 in progress

## Context

Audit triggered by B2 (rest times audit) revealed that the active session UI is driven by `motherSessions.generated.ts` (via `services/motherSession/*`), while a parallel legacy stack (`buildWeekProgram.ts`, `blocks.v1.json`, `qualityGates.ts` rehab logic, etc.) is still in tree but no longer routed to users.

This cleanup also addresses the medical content concern — the legacy stack carries `RehabZone`/`RehabPhase`/`RehabInjury` types and rehab UI surfaces that are no longer wanted in V1 (cf. `memory/medical_content_status.md`).

## Decisions captured (2026-05-07)

| # | Decision | Rationale |
|---|---|---|
| D1 | **ACL prevention femmes (Hewett 2005) → KEEP, rename athletic** | Renamed from "ACL prevention / prehab" to "stabilité hanche femmes" — claim athlétique vs claim médicale. Block + code path retained, tags retagged. |
| D2 | **MobilityPage / `/mobility` → audit in Phase A** | Status not yet decided. Phase A audit will determine if it's actively linked or orphaned. Decision deferred to Phase D. |
| D3 | **Workflow → 1 commit per phase, dedicated branch** | `chore/decision-47-cleanup`. 6 phases = 6 commits. Allows partial rollback + review before merge to main. |
| D4 | **B2 reorientation** | After #47 lands, B2 reset onto motherSessions data (parsing rest from `Block.format` and `coachingNotes` strings, not a typed field). |

## Phase plan

### Phase 0 — Setup (today)

- Branch created
- This tracking doc written
- MEMORY.md updated with V1 status
- B2 park committed on main (separate commit, before branching)

**Commit** : `Decision #47 phase 0: cleanup plan + tracking doc`

### Phase A — Caller audit + classification (0.5 d) — DONE

#### Methodology

Reverse-import scan across `src/` (excluding `__tests__/`, `__devChecks__/`, `*.test.*`, knowledge `*.md`). For each candidate file, classify by transitive caller chain.

#### Classification table

**LEGACY — zero production caller or transitively legacy chain (delete in Phase B)**

| File | Reason |
|---|---|
| `services/program/buildWeekProgram.ts` | Only re-exported by `index.ts` which has no production caller |
| `services/program/index.ts` | Zero production caller; just re-exports legacy |
| `services/program/qualityGates.ts` | Only used by buildWeekProgram + qualityScorecard (also legacy) |
| `services/program/qualityScorecard.ts` | Only used by buildWeekProgram |
| `services/program/selectEligibleBlocks.ts` | Used by buildSessionFromRecipe + buildWeekProgram + index — all legacy |
| `services/program/buildSessionFromRecipe.ts` | Zero non-legacy callers (only buildMobilitySession + buildProgramSessionLog legacy func + buildWeekProgram) |
| `services/program/buildMobilitySession.ts` | Only used by MobilityPage (legacy chain — see D2 below) |
| `services/program/sessionIntensity.ts` | Only used by buildWeekProgram |
| `services/program/validateSession.ts` | Only used by buildWeekProgram + index |
| `services/program/positionPreferences.v1.ts` | Only used by buildSessionFromRecipe + index |
| `services/program/adaptBlockExercises.ts` | Only used by buildSessionFromRecipe + selectEligibleBlocks |
| `services/program/resolveMicrocycleArchetype.ts` | Only used by buildWeekProgram |
| `services/program/policies/normalizeProfile.ts` | Only used by buildWeekProgram |
| `services/program/policies/safetyContracts.ts` | Only used by buildWeekProgram |
| `services/program/policies/populationRules.ts` | Only used by buildWeekProgram + safetyContracts (legacy) |
| `services/program/__devChecks__/*` | Dev-only diagnostics |
| `services/program/testHelpers.ts` | Only test files reference it (none in production) |
| `data/blocks.v1.json` | Production caller is ProgressPage line 240 ONLY (exercise frequency stats — easy migrate or drop visualization) |
| `data/sessionRecipes.v1.ts` | All callers are legacy `services/program/*` files |
| `data/microcycleArchetypes.v1.ts` | Only `resolveMicrocycleArchetype.ts` (legacy) |
| `data/exerciseVariants.v1.ts` | Only `adaptBlockExercises.ts` (legacy chain) |

**ACTIVE — used by motherSession path or live UI (DO NOT TOUCH in #47)**

| File | Active callers |
|---|---|
| `data/motherSessions.generated.ts` | services/motherSession/*, services/scheduling/* |
| `data/weeklyTemplates.ts` | services/motherSession/resolveMotherSessionsForWeek.ts |
| `data/exercises.ts` | 17 active components/pages |
| `data/exerciseDemos.ts` | data/exercises.ts |
| `data/exercices.v1.json` | data/exercises.ts |
| `data/exerciseMetricOverrides.v1.ts` | services/loadSuggestion, services/ui/exerciseMetrics, services/ui/suggestions |
| `data/prehab.v1.json` | services/ui/getPrehab.ts → SessionDetailPage |
| `services/ui/getPrehab.ts` | SessionDetailPage |
| `services/ui/blockPresentation.ts` | motherSession components (6 callers) |
| `services/ui/exerciseMetrics.ts` | SessionTourTracker, useBlockLogs, ProgressPage… |
| `services/ui/exerciseSetSpec.ts` | session/blocks/PrehabBlock, ToursBlock, motherSession/findCurrentPending |
| `services/ui/parseBlockFormat.ts` | 7 callers (motherSession + session components) |
| `services/ui/clubLogos.ts` | 4 callers (club logo UI) |
| `services/ui/debugDateOverride.ts` | 5 active callers |
| `services/ui/imageCrop.ts` | ProfilePage |
| `services/ui/progression.ts` | ProgressPage |
| `services/ui/suggestions.ts` | ProgressPage |
| `services/program/hasGlobalProgramHardBlock.ts` | MobilityPage, SessionDetailPage, WeekPage |
| `services/program/detectProgramChange.ts` | hooks/useProgramChangeNotice |
| `services/program/programHistoryAnalytics.ts` | HistoryPage, ProgressPage |
| `services/program/resolveFatigueLevel.ts` | HomePage, SessionDetailPage, services/annualPlanning/* |
| `services/program/resolveWeeklyProgramSurface.ts` | planning components, useWeekSnapshot, useWeeklyProgramSurface |
| `services/program/restartRampUp.ts` | ProfilePage, services/annualPlanning/* |
| `services/program/scheduleOptimizer.ts` | GymDaySelector, ClubSettingsSection, OnboardingPage, hooks |
| `services/program/sessionLogPresentation.ts` | HistoryPage, ProgressPage |

**BRIDGE-MIXED — mix legacy + active exports, split during Phase C**

| File | Active export | Legacy export |
|---|---|---|
| `services/program/buildProgramSessionLog.ts` | `mapMotherSessionType`, `buildAnnualWeekCode`, `buildMotherSessionProgramSessionLog` (used by SessionDetailPage) | `buildLegacyProgramSessionLog` (legacy chain via BuiltSession type) |
| `services/program/programPhases.v1.ts` | exports used by ChatPage (verify which) | exports used by buildSessionFromRecipe + buildWeekProgram |
| `services/program/policies/featureFlags.ts` | exports used by hooks/useProgramFeatureFlags + useWeeklyProgramSurface | exports used by buildWeekProgram |
| `services/program/policies/ruleConstants.v1.ts` | exports used by hooks/useACWR | exports used by buildWeekProgram + safetyContracts |
| `services/ui/getTodaySessionIndex.ts` + `services/ui/mapSlotsToScheduleDays.ts` | TBD — getTodaySessionIndex has 0 reported callers; verify it's not unused entirely | possibly fully legacy |

#### MobilityPage decision (D2 → resolved by audit)

`pages/MobilityPage.tsx` imports `buildMobilitySession` (legacy) + `getGlobalProgramHardBlock` (active). The page is reachable via `/mobility` route in `App.tsx`. Path is **LEGACY-DEPENDENT** — if Phase B deletes `buildMobilitySession`, MobilityPage breaks.

**Recommendation** : delete the route + page during Phase D. Mobility content (light recovery sessions) can be reintroduced V1.1 via motherSession path if needed. The current MobilityPage is not core to the V1 prepa/inter-saison/saison loop.

#### Refined effort estimate

| Phase | Original | Revised | Note |
|---|---|---|---|
| B — delete pure legacy | 1 d | **0.5 d** | Clean delete + ProgressPage line 240 migration |
| C — split bridges | 1.5 d | **1 d** | Bridges smaller than feared (5 files, mostly type-import surgery) |
| D — types + UI rehab + ACL rename + MobilityPage | 1 d | **1 d** | Confirmed MobilityPage delete |
| E — DB migration + tests | 0.5 d | **0.5 d** | Unchanged |
| F — docs | 0.5 d | **0.5 d** | Unchanged |
| **Total** | 5 d | **3.5 d** | -1.5 d |

**Commit** : `Decision #47 phase A: caller audit + classification table`

### Phase B — Delete pure legacy (1 d)

Files with zero production callers (per Phase A audit). Expected candidates:
- `src/services/program/buildWeekProgram.ts`
- `src/services/program/__devChecks__/`
- `src/services/program/qualityGates.ts` (if rehab-only — else split first)
- `src/data/blocks.v1.json`
- `src/data/__tests__/restTimes.contract.test.ts` (paused B2 work, dies with blocks.v1.json)
- `src/data/README-rest-times.md` (idem)
- Tests dependent on buildWeekProgram

Pre-delete: migrate `ProgressPage.tsx` exercise frequency stats off `blocks.v1.json` (replace with motherSession-derived stats or remove the visualization).

**Commit** : `Decision #47 phase B: delete legacy buildWeekProgram + blocks.v1.json + dev-checks`

### Phase C — Detricoter bridge files (1.5 d)

Files mixing active and legacy exports:
- `src/data/sessionRecipes.v1.ts` — split active vs legacy exports, delete legacy
- `src/data/microcycleArchetypes.v1.ts` — same
- `src/data/prehab.v1.json` + `src/services/ui/getPrehab.ts` — confirm UI status, delete or migrate
- `src/data/weeklyTemplates.ts` — KEEP (used by motherSession resolver)

For each bridge file: extract active part, delete legacy part, fix imports.

**Commit** : `Decision #47 phase C: split bridge files + remove legacy exports`

### Phase D — Types + UI cleanup (1 d)

- Delete types `RehabZone`, `RehabPhase`, `RehabInjury` from `src/types/training.ts`
- Delete `UserProfile.rehabInjury` field
- Delete ProfilePage rehab section
- Delete WeekPage rehab banner
- Clean `services/privacy/healthConsentLifecycle` rehab parts
- ACL prevention rename (per D1) : update tag from `prehab/hip_stability` to `athletic/hip_stability_female`, update copy in code path, update KB reference
- MobilityPage decision (per Phase A finding) : keep + migrate, or delete

**Commit** : `Decision #47 phase D: drop rehab types + UI + rename ACL prevention as athletic`

### Phase E — DB migration + tests (0.5 d)

- New migration `2026XXXXXXXXXX_drop_profiles_rehab_injury.sql` : `ALTER TABLE profiles DROP COLUMN rehab_injury`
- Run all existing tests `npm run test`
- Run `npx tsc -b` for type check
- Verify active programs build correctly via manual test (HomePage → WeekPage → SessionDetailPage on a sample profile)

**Commit** : `Decision #47 phase E: drop rehab_injury DB column + verify tests green`

### Phase F — Documentation (0.5 d)

- Update `MEMORY.md` :
  - Mark `#24 Mobilité` and `#25 Protocoles Retour Blessure` as OBSOLETE/ROLLED BACK
  - Add `#47 SHIPPED` line in V1 Release Status
- Update `docs/release-v1-plan.md` : Decision #47 row → DONE with details
- Delete `memory/medical_content_status.md` orphan-data section (no longer relevant) or update to reflect post-cleanup state
- Document new architecture briefly: motherSession resolver as single program source of truth

**Commit** : `Decision #47 phase F: docs + MEMORY.md updates, close cleanup`

## Open questions / risks

- **`qualityGates.ts` is referenced in code I haven't traced fully** — Phase A must confirm if anything outside `buildWeekProgram` calls `evaluateQualityGates`
- **17 active files import `services/program/*`** — Phase A must list which exports they use to avoid breaking active code
- **DB column drop is destructive** — coordinate with Supabase Studio before phase E (no production users yet, but verify)
- **MobilityPage uncertainty** — could surface a 4th phase D sub-decision

## Re-run B2 after #47 lands

Once #47 is merged to main, B2 audit reset on `motherSessions.generated.ts` :
- Build a parser for rest times from `Block.format` and `coachingNotes` strings
- Compare extracted rest values against the KB ranges (already documented in archived `README-rest-times.md` if kept)
- Flag mismatches, propose corrections in source MD files (`docs/training/mother-sessions/*.md`)
- Regenerate motherSessions via `node scripts/mergeOffSeasonIntoDataset.mjs`
- This is a separate workstream, not part of #47.
