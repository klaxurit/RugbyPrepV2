# Adversarial Audit — RugbyPrepV2 Session Generation Engine

**Date:** 2026-03-10
**Auditor:** Cynical Reviewer
**Reference:** `_bmad-output/planning-artifacts/research/domain-preparation-physique-rugby-research-2026-03-10.md`
**Engine version:** 96 blocks, 130 exercises, 24 recipes, 18 KB files

---

## 1. Executive Summary

The engine is a competent MVP that generates structurally valid sessions through a recipe-slot-block pipeline. It covers the fundamentals: equipment filtering, contraindication exclusion, cross-session deduplication, ACWR-based session reduction, and multi-level routing (starter/builder/performance). However, the gap between "technically functional" and "feels like a real rugby S&C session" is wide. The engine has no warm-up, no cooldown, no session tempo, no intra-week undulation, no cooldown, and the Knowledge Base is purely decorative -- 3700+ lines of scientific references that zero engine code ever reads. The DELOAD week silently generates full FORCE sessions. Contraindication data is systematically leaky (39 exercise-level contras not propagated to blocks). The session has no identity beyond a recipe title -- a player cannot tell "why this session today" or feel weekly progression. These are not hypothetical concerns: they are structural gaps that any rugby player or S&C coach would notice on day one.

---

## 2. Findings by Severity

### CRITICAL

#### C-1. DELOAD week generates full FORCE sessions instead of deloading

- **File:** `src/services/program/buildWeekProgram.ts`, line 79
- **Code:** `const rawPhase = getPhaseForWeek(week) ?? 'FORCE';`
- **Description:** `getPhaseForWeek('DELOAD')` returns `null`. The null-coalescing operator defaults to `'FORCE'`. Then `getBaseWeekVersion('DELOAD')` returns `'W4'`. The result: the DELOAD week generates normal FORCE-phase sessions using W4 version parameters. W4 versions have lower RER (1-2) but often the same or higher set counts (e.g., `BLK_FORCE_DROP_RDL_ROTATION_01` goes from 3 sets W1 to 4 sets W4). This is the opposite of a deload.
- **Impact:** A player in DELOAD week gets served heavy force sessions. The suggestions system (`suggestions.ts`) does handle DELOAD for load/reps suggestions, but the SESSION STRUCTURE itself is not reduced. This contradicts the entire periodization model.
- **Recommendation:** Either (a) generate reduced-volume sessions for DELOAD (e.g., RECOVERY_MOBILITY_V1 + 1 light session) or (b) skip session generation entirely and show a recovery protocol. The current silent fallback to FORCE is dangerous.

#### C-2. 39 contraindication leaks: exercises have contras their parent block does not declare

- **File:** `src/data/blocks.v1.json` + `src/data/exercices.v1.json`
- **Description:** 39 instances where an exercise declares a contraindication that its parent block does not. Breakdown: `low_back_pain` (18 blocks), `wrist_pain` (15), `knee_pain` (4), `elbow_pain` (4), `ankle_pain` (2), `shoulder_pain` (1).
- **Examples:**
  - `BLK_ACT_LOWER_HIP_ANKLE_01` contains `core_anti_extension__dead_bug` which has `low_back_pain` contra. Block declares zero contras. A player with low back pain gets a dead bug in their activation.
  - `BLK_PREHAB_HAMSTRING_01` contains `hamstring__nordic__band_assist` and `hamstring__curl__prone_band`, both with `knee_pain` contra. Block does not declare `knee_pain`. A player with knee pain gets nordics.
  - `BLK_CONTRAST_LOWER_HINGE_BROAD_01` contains `power__jump__broad_jump` with `knee_pain` contra. Block does not declare `knee_pain`.
- **Impact:** `selectEligibleBlocks.ts` (line 40-43) does check exercise-level contras, so the *new* engine catches these. But `buildSession.ts` (the old engine, still present in the codebase at line 34-47) does NOT check exercise-level contras -- it only checks block-level. If anyone uses the old engine, contras leak. Even with the new engine, the data inconsistency is a maintenance hazard and signals sloppy data curation.
- **Recommendation:** Propagate all exercise-level contraindications to the block level in `blocks.v1.json`. Write a CI check that fails if any exercise contra is missing from its parent block.

#### C-3. Knowledge Base is entirely decorative -- zero integration with the engine

- **File:** `src/knowledge/` (18 files, ~3700+ lines)
- **Description:** No file in `src/services/program/` imports, references, or reads anything from `src/knowledge/`. The KB contains detailed periodization rules, ACWR thresholds, load budgets, return-to-play criteria, population-specific guidance -- none of which influences session generation. The only consumer is the `ai-coach` Edge Function (confirmed by memory: "KB embarquee dans system prompt").
- **Impact:** The engine makes decisions that may contradict the KB. For example, `load-budgeting.md` defines max volumes per level/phase, but `buildWeekProgram.ts` has no volume budget. `evidence-register.md` lists ACWR thresholds (0.8/1.3/1.5) that are hardcoded in the engine but not sourced from the KB. `return-to-play-criteria.md` has detailed phase criteria, but rehab routing is a simple phase number (1/2/3) with no LSI or criteria checks.
- **Recommendation:** Either (a) extract structured constants from the KB into importable TS modules that the engine uses, or (b) honestly admit the KB is documentation-only and stop pretending it is a "knowledge base" that guides the system.

### MAJOR

#### M-1. No warm-up or cooldown in session structure

- **File:** `src/data/sessionRecipes.v1.ts`
- **Description:** The domain reference documents a 4-phase session: warm-up (15-20min), main block (30-45min), complementary work (10-15min), cooldown (5-10min). The engine generates sessions starting with an `activation` block and ending with a finisher (core/neck/carry). There is no explicit warm-up block, no jogging, no dynamic stretching, no cooldown, no static stretching. The `activation` block is 2-3 sets of band work -- not a warm-up.
- **Impact:** A player opening the app sees "Activation epaules (TYI + face pull)" as the first thing to do. No warm-up guidance means the player either skips warm-up or does not know what to do. Every S&C coach in the world starts with a structured warm-up. This is the most visible gap between the app and real-world practice.
- **Recommendation:** Add `warmup` and `cooldown` as BlockIntent types. Create 2-3 warm-up blocks (general: jog + dynamic mobility + progressive sprints) and 2-3 cooldown blocks (static stretching + breathing). Add them as required first/last slots in every recipe.

#### M-2. No intra-week undulation -- sessions within the same week are identical in character

- **File:** `src/services/program/buildWeekProgram.ts`, `src/services/program/programPhases.v1.ts`
- **Description:** The domain reference states that 88% of S&C coaches use periodization, and in-season the standard model is **ondule (undulating)** -- varying intensity/volume within the same week. The engine uses pure linear block periodization: all sessions in a week share the same phase (e.g., all FORCE, all HYPERTROPHY). There is no mechanism to make Tuesday a "heavy day" and Thursday a "light/speed day" within the same week. The version system (W1-W4) varies between weeks but not within a week.
- **Impact:** A 3-session week has: UPPER (FORCE), LOWER (FORCE), FULL (FORCE) -- all at the same intensity character. A real coach would program Tuesday as strength, Thursday as power/speed. This is particularly problematic in-season where match-day proximity should dictate session intensity (MD-3: heavy, MD-1: light/neural).
- **Recommendation:** Add a `sessionIntensity` property to recipe sequence or create variant recipes per day-slot. At minimum, when sessions=3, the third session should be lower intensity or neural-focused.

#### M-3. BLK_STR_CORE_03 is tagged `starter` but requires `ab_wheel` equipment

- **File:** `src/data/blocks.v1.json` -- block `BLK_STR_CORE_03`
- **Description:** This block is tagged `starter` (intended for bodyweight/band users) but requires `ab_wheel` equipment. A starter user without an ab wheel will never see this block. Its stated purpose (memory: "core 3e option, fallback quand CORE_01 utilise en safety") is undermined if the starter user does not own an ab wheel.
- **Impact:** Reduced core block variety for starter users. With CORE_01 and CORE_02 available (both BW), this is survivable but contradicts the starter philosophy of zero-equipment accessibility.
- **Recommendation:** Either remove the `starter` tag from BLK_STR_CORE_03 or create a BW-only variant.

#### M-4. Position preferences have minimal actual impact on session content

- **File:** `src/services/program/positionPreferences.v1.ts`, `src/services/program/buildSessionFromRecipe.ts` line 97-99
- **Description:** Position preferences add +3 per matching prefer tag in `scoreBlock()`. But `scoreBlock` also gives +1 per recipe `preferredTags` match. With 5-8 preferredTags per recipe (all position-neutral), a position tag bonus of +3 rarely changes the top-ranked block. The domain reference emphasizes 4 positional groups with distinct training priorities (front row: force max/masse; back three: speed/acceleration). In practice, a prop and a winger running the same recipe with the same equipment get nearly identical sessions.
- **Impact:** The app claims position-specific training but delivers generic sessions. A front row player should see more neck work, carries, and heavy hinge work. A back three player should see more plyometric and speed neural work. The tag-weighting system is too weak to create meaningful differentiation.
- **Recommendation:** Either (a) increase position tag weight to +5 or +10, or (b) create position-variant recipes (e.g., UPPER_FORWARD_V1 vs UPPER_BACK_V1), or (c) add position-specific mandatory slots (e.g., front row always gets a neck slot).

#### M-5. Safety fallback chain can produce incoherent sessions

- **File:** `src/services/program/buildSessionFromRecipe.ts`, lines 47-62
- **Description:** When a required intent (e.g., `force`) cannot be filled, the SAFETY_FALLBACK_INTENTS chain tries: `core`, `prehab`, `activation`, `contrast`, `hypertrophy`, `neural`. This means a `force` slot can be replaced by `activation` -- giving the session two activation blocks and no main work. The `hypertrophy` fallback chain goes: `core`, `prehab`, `activation`, `neural`, `force`, `contrast` -- so a hypertrophy slot can become a prehab slot.
- **Impact:** The known limitation for S5 (starter + shoulder_pain + BW) admits a session with "activation basse + 2x core + lower hypo" -- this is a session with 3 filler blocks and 1 actual working block. The session is validated as "safety adapted" but presents no meaningful training stimulus. A player sees a 4-block session where 3/4 blocks are warmup-level work.
- **Recommendation:** If safety fallbacks degrade a session below a minimum quality threshold (e.g., fewer than 1 working block of hypertrophy/force/contrast), skip the session entirely and display a "rest day" or mobility session instead. Generating a broken session is worse than generating no session.

#### M-6. Old engine (`buildSession.ts`) is still in the codebase, creating confusion and risk

- **File:** `src/services/program/buildSession.ts`
- **Description:** The old `buildSession.ts` file contains a complete, exported `buildSessionFromRecipe` and `selectEligibleBlocks` function. These are shadows of the current engine in `buildSessionFromRecipe.ts` and `selectEligibleBlocks.ts`. The old engine does NOT check exercise-level contraindications (only block-level), does NOT handle cross-session exclusion, does NOT support anchor rotation, and does NOT handle safety fallbacks. It is not exported from `index.ts` but any developer could import it directly.
- **Impact:** Confusion risk. If someone imports from `./buildSession` instead of `./buildSessionFromRecipe`, they get a broken engine silently. The old engine's `selectEligibleBlocks` export shadows the new one.
- **Recommendation:** Delete `buildSession.ts` entirely. It serves no purpose.

### MINOR

#### m-1. Session titles are generic and uninformative

- **File:** `src/data/sessionRecipes.v1.ts`
- **Description:** Session titles are static strings: "Upper (rugby)", "Lower (rugby)", "Full Body (rugby)". They do not reflect the phase, the week, the intensity, or the session's actual content. A player in H2 (hypertrophy week 2) sees "Upper Hypertrophie" -- the same title they saw in H1, H3, H4.
- **Impact:** The player cannot differentiate sessions week to week. No sense of progression or purpose. "Why is this session different from last week?" has no answer in the UI.
- **Recommendation:** Generate dynamic titles that include phase + week context (e.g., "Upper Force S2 -- Montee progressive", "Lower Hypertrophie S3 -- Volume").

#### m-2. No explicit rest time prescription between blocks

- **File:** `src/types/training.ts` -- `BlockVersion` interface
- **Description:** `restSeconds` exists per version (between sets within a block), but there is no rest prescription BETWEEN blocks. A real S&C session prescribes 2-3 minutes between blocks for equipment changeover, hydration, and nervous system preparation.
- **Impact:** Minor -- most experienced athletes know to rest between blocks. But for starters/beginners, this is a missing instruction.
- **Recommendation:** Add an optional `interBlockRestSeconds` to the recipe or display a default "2-3 min recovery" message between blocks.

#### m-3. Builder level has only 5 blocks -- extremely limited variety

- **File:** `src/data/blocks.v1.json`
- **Description:** Builder (Level 2) has exactly 5 blocks: 3 upper hypertrophy supersets and 2 lower hypertrophy supersets. All are `hypertrophy` intent. There are zero builder activation blocks (it falls through to performance-level activation blocks), zero builder core blocks, zero builder prehab blocks, zero builder force/contrast/neural blocks.
- **Impact:** A builder user doing 3 sessions/week for 4 weeks sees the same 5 blocks rotated. Cross-session exclusion reduces available blocks further, potentially causing fallbacks. The builder experience is monotonous.
- **Recommendation:** Add at minimum: 2 builder activation blocks, 2 builder core blocks, 1 builder prehab block. Consider adding builder-level force/contrast blocks for phase variety.

#### m-4. Conditioning blocks are only available in off/pre-season for performance level

- **File:** `src/services/program/buildWeekProgram.ts`, lines 83-90
- **Description:** Conditioning recipes (COND_OFF_V1, COND_PRE_V1) are only routed when `seasonMode === 'off_season'` or `'pre_season'` AND `weeklySessions === 3`. In-season players never get conditioning. The domain reference states conditioning should be maintained in-season (light integration in the microcycle).
- **Impact:** In-season players lose all conditioning stimulus. The domain reference warns that aerobic capacity declines during the season, affecting recovery between matches.
- **Recommendation:** Add an optional light conditioning component for in-season (e.g., finisher conditioning block, or a conditioning recipe for the 3rd session in-season).

### OBSERVATIONS

#### O-1. No Change of Direction (COD) or agility work anywhere in the engine

- **File:** `src/data/blocks.v1.json`, `src/data/exercices.v1.json`
- **Description:** Zero exercises or blocks tagged with `cod`, `agility`, or `change_of_direction`. The domain reference lists COD and agility as core rugby demands, especially for backs and back-row.
- **Recommendation:** This is a content enrichment item for a future version. Add COD drills, T-test-style exercises, shuttle runs.

#### O-2. No trunk/contact preparation blocks

- **Description:** The domain reference highlights contact preparation as part of warm-up (neck, shoulders, core, progressive contact). The engine has neck blocks (3) and core blocks (7) but no explicit "contact prep" block that combines these for pre-match or pre-training readiness.
- **Recommendation:** Create 2-3 "contact prep" blocks combining neck, core bracing, and shoulder stability for forward-heavy sessions.

#### O-3. Anchor system depends on `localStorage` -- breaks in SSR/tests

- **File:** `src/services/program/buildSessionFromRecipe.ts`, lines 257-292
- **Description:** The anchor system (block rotation stability) checks `typeof window === 'undefined'` and silently skips. This means tests and SSR produce different block selections than the browser. Not a bug per se, but a testing fidelity concern.

#### O-4. Two exercises have zero contraindications but involve significant spinal load

- `squat__goblet_squat__dumbbell` -- no contras listed, but a goblet squat loads the spine (should have `low_back_pain`)
- `hinge__rdl__dumbbell` -- has only `low_back_pain` contra, but the pattern also stresses hamstrings/knees in certain populations

---

## 3. Root Cause Matrix

| Category | Issues | Root Cause |
|---|---|---|
| **Content/KB** | C-3 (KB decorative), M-1 (no warm-up/cooldown), O-1 (no COD), O-2 (no contact prep), m-3 (builder poverty) | KB was written as documentation, not as machine-readable rules. Content was grown incrementally around the recipe system without a block coverage audit. |
| **Logic/Bugs** | C-1 (DELOAD=FORCE), C-2 (39 contra leaks), M-5 (safety produces junk sessions), M-6 (old engine still present) | Defensive fallbacks chosen over correctness. No integration tests that verify DELOAD produces lighter sessions. No automated contra propagation check. |
| **Architecture** | M-2 (no undulation), M-4 (position preferences too weak), m-1 (static titles) | The recipe-slot-block architecture is one-dimensional: it selects blocks by intent+tags but has no concept of session identity, intensity profile, or weekly sequencing strategy. The system knows WHAT goes in a slot but not WHY or HOW MUCH. |
| **UX/Perception** | m-1 (generic titles), m-2 (no inter-block rest), m-4 (in-season no conditioning) | The engine outputs raw block lists with no narrative. There is no "session story" (today's goal, expected duration, intensity level, what to focus on). The player sees a list of exercises, not a training session. |

---

## 4. Data Integrity Issues

### Concrete problems in JSON/TS

1. **39 contra propagation failures** -- see C-2 for full breakdown. Most dangerous: `BLK_PREHAB_HAMSTRING_01` (knee_pain exercises in a prehab block) and `BLK_CONTRAST_LOWER_HINGE_BROAD_01` (broad jumps with knee_pain contra).

2. **BLK_STR_CORE_03** tagged `starter` but requires `ab_wheel` -- equipment contradiction (M-3).

3. **BLK_ACT_LOWER_HIP_ANKLE_01** name says "hanches/chevilles" but contains only `core_anti_extension__dead_bug` (a core exercise, not hip/ankle activation). Misleading block name.

4. **13 blocks have only 1 exercise** -- these are functionally single-exercise sets, not "blocks" in the S&C sense. Blocks like `BLK_HYPER_LOWER_SQUAT_01` (just front squat) or `BLK_HYPER_LOWER_HINGE_01` (just RDL) are exercises dressed as blocks.

5. **`core_rotation__ghd_rotations`** has pattern `core_anti_rotation` but its name says "rotations" (not anti-rotation). Pattern/name mismatch.

6. **62 exercises have pattern `UNKNOWN`** (48% of exercises) -- the pattern field is largely abandoned, reducing the engine's ability to reason about movement coverage.

7. **`BLK_PULL_BALANCE_INCLINE_ROW_FACEPULL_01`** is tagged as `hypertrophy` intent but contains a face pull (prehab exercise). The block mixes intents -- it is simultaneously a pull hypertrophy block and a shoulder prehab block.

---

## 5. Gap vs Field Reference

| Field Standard | Engine Status | Gap Severity |
|---|---|---|
| **4-phase session** (warm-up, main, accessory, cooldown) | 2-phase only (activation + main/finisher). No warm-up, no cooldown. | **High** |
| **Olympic lifts** (clean is #1 prescribed exercise) | 2 neural blocks with DB snatch and hang high pull. No power clean, no clean variants. | **High** |
| **Undulating periodization in-season** | Linear block periodization only. All sessions same phase. | **High** |
| **Match-day-minus microcycle** (MD-3 heavy, MD-1 light) | `scheduleOptimizer.ts` picks days but does NOT vary session intensity by day proximity to match. | **High** |
| **Progressive overload** (memorize charges, +2.5kg/week) | Engine generates sessions but has no memory of past performance. Suggestion system exists but requires manual input each time. | **High** |
| **COD/agility** | Zero blocks or exercises. | **Medium** |
| **Contact preparation** | 3 neck blocks + 7 contact-tagged blocks, but no structured "contact prep" phase. | **Medium** |
| **Carries** (farmer walks, yoke) | 3 carry blocks exist. Adequate for current scope. | **Low** |
| **Prehab** (Copenhagen, Nordic, rotator cuff) | 4 prehab blocks + rehab system. Adequate. | **Low** |
| **Position-specific training** | 6 position groups with tag preferences, but effect is minimal (M-4). | **Medium** |
| **Deload protocol** | Generates FORCE sessions instead of deloading (C-1). | **Critical** |

---

## 6. Verdict

**Can the engine be saved with incremental adjustments?**

**Yes, with reservations.** The core architecture (recipe -> slots -> block selection) is sound and extensible. The problems fall into three categories:

1. **Bugs that need fixing now** (C-1 DELOAD, C-2 contras, M-6 old engine): these are pure code/data fixes with no architectural implications. Do them this week.

2. **Content gaps that need filling** (warm-up/cooldown, builder blocks, COD, contact prep): these require creating new blocks and modifying recipes. Labor-intensive but straightforward within the current architecture.

3. **Architectural limitations that require design work** (undulation, match-day-proximity session adaptation, session identity/narrative, KB integration): these need new concepts the engine currently lacks. The recipe system needs to express intensity profiles, the scheduling system needs to feed session selection, and the KB needs to become machine-readable. These are refactors, not rewrites.

The engine does NOT need an architectural overhaul. It needs: (a) data quality cleanup, (b) content enrichment, (c) two new dimensions in the recipe system (intensity profile, match proximity), and (d) a session narrative layer on top of the block list.

---

## 7. Prioritized Recommendations

### Quick Wins (1-3 days each)

| # | Action | Impact | Effort |
|---|---|---|---|
| QW-1 | Fix DELOAD week: generate RECOVERY_MOBILITY_V1 only (or 1 light session + mobility) | Critical safety fix | 1h |
| QW-2 | Delete `src/services/program/buildSession.ts` | Remove confusion risk | 5min |
| QW-3 | Propagate all 39 exercise contras to block level in `blocks.v1.json` | Safety fix | 2h |
| QW-4 | Add CI test: every exercise contra must exist on its parent block | Prevent regression | 1h |
| QW-5 | Remove `starter` tag from `BLK_STR_CORE_03` or create BW variant | Data correctness | 30min |
| QW-6 | Fix `BLK_ACT_LOWER_HIP_ANKLE_01` to actually contain hip/ankle exercises | Data correctness | 1h |
| QW-7 | Fix `core_rotation__ghd_rotations` pattern to `core_rotation` | Data correctness | 5min |

### Refactors (1-2 weeks each)

| # | Action | Impact | Effort |
|---|---|---|---|
| R-1 | Add warm-up and cooldown blocks + slots to all recipes | Major UX gap closure | 1 week |
| R-2 | Implement DELOAD as a distinct recipe set (light activation + mobility + flexibility) | Periodization correctness | 3 days |
| R-3 | Generate dynamic session titles with phase/week/intensity context | Player understanding | 2 days |
| R-4 | Add session intensity profile (heavy/medium/light/neural) to recipes | Enable undulation | 3 days |
| R-5 | Connect `scheduleOptimizer` match proximity to session intensity selection | MD-minus implementation | 1 week |
| R-6 | Add minimum quality threshold to safety fallback -- skip session if degraded below threshold | Prevent junk sessions | 2 days |
| R-7 | Strengthen position preferences (+10 weight or position-variant recipes) | Meaningful differentiation | 3 days |

### Content Enrichment (ongoing)

| # | Action | Impact | Effort |
|---|---|---|---|
| E-1 | Create 4-6 builder-level blocks (activation, core, prehab) | Builder experience | 3 days |
| E-2 | Add 2-3 warm-up blocks (general dynamic, lower-specific, upper-specific) | Session completeness | 2 days |
| E-3 | Add 2-3 cooldown blocks (static stretch, breathing, foam roll) | Session completeness | 2 days |
| E-4 | Add power clean / clean variant exercises and neural blocks | Rugby specificity | 2 days |
| E-5 | Add COD/agility exercises and blocks | Rugby specificity | 3 days |
| E-6 | Add contact preparation blocks | Rugby specificity | 2 days |
| E-7 | Add in-season light conditioning option | Aerobic maintenance | 2 days |
| E-8 | Fill pattern field for the 62 `UNKNOWN` exercises | Data completeness | 3 days |
| E-9 | Extract KB thresholds/constants into importable TS modules | KB integration | 1 week |

---

**End of audit.**

*The engine works. It generates sessions. But a rugby player opening this app would see a list of exercises, not a training session. The difference between those two things is what separates a spreadsheet from a coach.*
