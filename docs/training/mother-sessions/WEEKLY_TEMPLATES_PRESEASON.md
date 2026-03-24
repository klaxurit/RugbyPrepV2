# Weekly Templates Pre-Season

This document defines the first weekly structure for the pre-season mother-session system.

Goal:
- keep the weekly format simple
- align with the 12-week pre-season architecture
- support `2x`, `3x`, and `4x` weekly S&C formats
- keep gym and field load coherent for amateur rugby players

---

## 1. Base Weekly Logic

### 2 sessions per week
- Session 1: `Lower`
- Session 2: `Upper`

### 3 sessions per week
- Session 1: `Lower`
- Session 2: `Upper`
- Session 3: `Full`

### 4 sessions per week
- Session 1: `Lower`
- Session 2: `Upper`
- Session 3: `Full`
- Session 4: `Speed/Power`

This is the default V1 architecture for pre-season.

### Note for `2x/week` players
- `Lower + Upper` is the minimum effective dose, not a complete expression of the system.
- These players will miss some full-body and terrain exposures by design.
- If even `20-30 min` of extra training time becomes available, prefer:
  - `Block 1-2` of the relevant `Speed/Power` session
  - over adding a third full gym session at random
- In practice, a short jump / throw / sprint exposure is the best add-on for a `2x/week` player.

---

## 2. Phase Logic

### Phase 1 — Force (`S1-S4`)
Use:
- `LOWER_PRESEASON_FORCE_V1`
- `UPPER_PRESEASON_FORCE_V1`
- `FULL_PRESEASON_FORCE_V1`
- `SPEED_POWER_PRESEASON_INTRO_V1` only for `4x/week`

Intent:
- build force capacity
- keep field speed-power low-volume and technical
- avoid introducing too much contrast too early

### Phase 2 — Force + Power (`S5-S8`)
Use:
- `LOWER_PRESEASON_FORCE_POWER_V1`
- `UPPER_PRESEASON_FORCE_POWER_V1`
- `FULL_PRESEASON_FORCE_POWER_V1`
- `SPEED_POWER_PRESEASON_V1` only for `4x/week`

Intent:
- convert force into usable power
- introduce contrast both in gym and on field
- keep total explosive volume controlled

### Phase 3 — Power (`S9-S12`)
Use:
- `LOWER_PRESEASON_POWER_FRONT_ROW_V1` or `LOWER_PRESEASON_POWER_BACK_THREE_V1`
- `UPPER_PRESEASON_POWER_FRONT_ROW_V1` or `UPPER_PRESEASON_POWER_BACK_THREE_V1`
- `FULL_PRESEASON_POWER_FRONT_ROW_V1` or `FULL_PRESEASON_POWER_BACK_THREE_V1`

Intent:
- express power
- reduce total support volume
- converge naturally toward in-season structure

Important V1 rule:
- no dedicated `4th` speed-power mother session is planned in Phase 3
- the weekly structure shifts back to `2x` or `3x` S&C plus qualitative field work

---

## 3. Frequency by Phase

### Phase 1
- `2x/week`:
  - `Lower Force`
  - `Upper Force`
- `3x/week`:
  - `Lower Force`
  - `Upper Force`
  - `Full Force`
- `4x/week`:
  - `Lower Force`
  - `Upper Force`
  - `Full Force`
  - `Speed/Power Intro`

### Phase 2
- `2x/week`:
  - `Lower Force-Power`
  - `Upper Force-Power`
- `3x/week`:
  - `Lower Force-Power`
  - `Upper Force-Power`
  - `Full Force-Power`
- `4x/week`:
  - `Lower Force-Power`
  - `Upper Force-Power`
  - `Full Force-Power`
  - `Speed/Power`

### Phase 3
- `2x/week`:
  - `Lower Power`
  - `Upper Power`
- `3x/week`:
  - `Lower Power`
  - `Upper Power`
  - `Full Power`

### Frequency transitions between phases
- Players can change frequency between phases if recovery, schedule, or rugby load changes.
- `4x -> 3x`:
  - drop the `Speed/Power` session first
- `3x -> 4x`:
  - add the `Speed/Power` session only if the player has tolerated `3x/week` well for at least `2 weeks`
- `3x -> 2x`:
  - keep `Lower + Upper`
  - accept that this becomes a minimum effective dose structure
- `2x -> 3x`:
  - add `Full` before considering a 4th terrain slot

---

## 4. Position Logic

### Phase 1
- sessions stay common
- use `Position Accent` notes inside the session

### Phase 2
- sessions stay common
- accents become more marked
- terrain session stays common but with clearer front-row vs back-three emphasis

### Phase 3
- `Lower` and `Upper` are fully position-specific
- `Full` is also split in practice for now:
  - `FULL_PRESEASON_POWER_FRONT_ROW_V1`
  - `FULL_PRESEASON_POWER_BACK_THREE_V1`

Recommended V1 rule:
- common base in `S1-S8`
- clear split by position in `S9-S12`

---

## 5. Field Work Coexistence

### Phase 1
- endurance can stay relatively present
- one field speed exposure can coexist with the gym week
- if `4x/week` is used, `SPEED_POWER_PRESEASON_INTRO_V1` is the main dedicated field speed-power slot

### Phase 2
- endurance volume should drop slightly
- gym contrast and terrain contrast now coexist
- the `Speed/Power` session is optional and should only stay if recovery is still good

### Phase 3
- field work becomes more qualitative than voluminous
- no dedicated 4th mother session is planned here
- in practice, "qualitative field work" means:
  - rugby collective training when it already provides sprint, COD, and contact exposure
  - or `1-2` short acceleration / sprint blocks during the week if the player is not yet back in regular rugby training
- if the player already has strong rugby field exposure, avoid adding extra explosive volume just to fill the week

---

## 6. Recommended Weekly Placement

The template defines what to do in a week. Placement defines when to do it.

Key rules:
- avoid heavy lower-body work inside the `48h` before a match or very heavy rugby field session
- keep lower-body sessions at least `48h` apart when possible
- the most neurally demanding lower session should be placed earliest in the week
- upper-body work can usually tolerate slightly tighter placement than lower-body work

### Example - `3x/week` with rugby training on Wednesday and match on Saturday
- Monday: `Lower`
- Tuesday: `Upper`
- Thursday: `Full` light-moderate

### Example - `3x/week` with rugby training on Tuesday and Thursday, no match
- Monday: `Lower`
- Wednesday: `Upper`
- Friday or Saturday: `Full`

### Example - `4x/week` in Phase 1 or 2
- Monday: `Lower`
- Tuesday: `Upper`
- Thursday: `Full`
- Saturday: `Speed/Power`

The placement rule is more important than the exact weekday names:
- heavy lower early
- speed-power separated from the hardest lower work
- no dense lower fatigue too close to a match

---

## 7. Fatigue Override

The weekly plan should not be selected by phase alone.

If fatigue is high:
- remove optional lower-leg blocks first
- reduce support blocks second
- reduce one round from jump / COD blocks third
- keep the main quality block if movement quality is still high

Simple V1 rule:
- `normal fatigue` -> keep the planned weekly structure
- `high fatigue in Phase 1 or 2` -> remove the 4th session before cutting the main gym work
- `high fatigue in Phase 3` -> keep only `2x/week` if needed

---

## 8. Weekly Examples

### Phase 1 - 4x / Front Row
- `LOWER_PRESEASON_FORCE_V1`
- `UPPER_PRESEASON_FORCE_V1`
- `FULL_PRESEASON_FORCE_V1`
- `SPEED_POWER_PRESEASON_INTRO_V1`

### Phase 1 - 4x / Back Three
- `LOWER_PRESEASON_FORCE_V1`
- `UPPER_PRESEASON_FORCE_V1`
- `FULL_PRESEASON_FORCE_V1`
- `SPEED_POWER_PRESEASON_INTRO_V1`

### Phase 2 - 4x / Front Row
- `LOWER_PRESEASON_FORCE_POWER_V1`
- `UPPER_PRESEASON_FORCE_POWER_V1`
- `FULL_PRESEASON_FORCE_POWER_V1`
- `SPEED_POWER_PRESEASON_V1`

### Phase 2 - 4x / Back Three
- `LOWER_PRESEASON_FORCE_POWER_V1`
- `UPPER_PRESEASON_FORCE_POWER_V1`
- `FULL_PRESEASON_FORCE_POWER_V1`
- `SPEED_POWER_PRESEASON_V1`

### Phase 3 - 3x / Front Row
- `LOWER_PRESEASON_POWER_FRONT_ROW_V1`
- `UPPER_PRESEASON_POWER_FRONT_ROW_V1`
- `FULL_PRESEASON_POWER_FRONT_ROW_V1`

### Phase 3 - 3x / Back Three
- `LOWER_PRESEASON_POWER_BACK_THREE_V1`
- `UPPER_PRESEASON_POWER_BACK_THREE_V1`
- `FULL_PRESEASON_POWER_BACK_THREE_V1`

---

## 9. Implementation Notes

Later in the app, weekly selection can follow a simple path:
1. detect pre-season week number (`S1-S12`)
2. map week to phase
3. detect weekly frequency (`2`, `3`, or `4`)
4. detect position group
5. apply fatigue override
6. select the corresponding mother sessions
7. detect whether the week is a deload week (`W4`, `W8`, `W12`)
8. apply equipment and injury substitutions using the alternatives matrix

This keeps the system coach-led, readable, and app-friendly.
