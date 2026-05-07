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

### Phase A — Caller audit + classification (0.5 d)

For each file under `src/services/program/`, `src/services/ui/`, `src/data/`, list exports and their production callers (excluding tests, dev-checks, knowledge MD).

**Output** : a classification table in this doc, one row per file/function:
- `LEGACY` — zero production callers, safe to delete
- `ACTIVE` — used by motherSession path or other live UI, KEEP
- `BRIDGE-MIXED` — file mixes legacy and active exports, requires per-export decision

Refine effort estimate per phase based on actual surface area.

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
