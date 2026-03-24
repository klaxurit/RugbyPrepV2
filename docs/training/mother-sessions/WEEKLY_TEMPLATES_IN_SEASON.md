# Weekly Templates In-Season

This document defines the first weekly structure for the mother-session system.

Goal:
- keep the weekly format simple
- align with real in-season rugby constraints
- support both 2-session and 3-session strength plans
- leave room for fatigue-based overrides

---

## 1. Base Weekly Logic

### 2 sessions per week
- Session 1: `Lower`
- Session 2: `Upper`

### 3 sessions per week
- Session 1: `Lower`
- Session 2: `Upper`
- Session 3:
  - `Primer` if a match is scheduled that weekend
  - `Full Body` if there is no match that weekend

This is the default V1 architecture.

### Note for `2x/week` players
- `Lower + Upper` is the minimum effective dose, not the full in-season model.
- On match weeks:
  - if the planned `Upper` slot falls inside the last `3 days` before the match, it can be replaced by `Primer`
- On no-match weeks:
  - if `15-20 min` of extra time becomes available, prefer a short add-on block such as:
    - `hip thrust`
    - `rotation`
    - `Copenhagen`
  - rather than forcing a random third full gym session
- In practice, `2x/week` players should prioritize quality and freshness over trying to mimic the full `3x/week` structure.

---

## 2. Match vs No-Match Decision

### Match week
Use:
- `Lower`
- `Upper`
- `Primer`

Intent:
- maintain strength/power exposure
- sharpen neural output
- avoid unnecessary residual fatigue before the game

### No-match week
Use:
- `Lower`
- `Upper`
- `Full Body`

Intent:
- maintain whole-body quality
- allow a slightly more muscular support session
- keep a useful "reward" feeling without drifting into off-season volume

---

## 3. Recommended Weekly Placement

The template defines what to do in a week. Placement defines when to do it.

Key rules:
- do not place `Lower` or `Upper` inside the last `48h` before a match
- `Primer` is the only session that belongs at `J-1`
- keep lower-body work at least `48h` away from the match when possible
- place the heaviest lower-body session earliest in the week

### Example - Match on Saturday, `3x/week`
- Monday: `Lower`
- Wednesday: `Upper`
- Friday: `Primer`

### Example - Match on Sunday, `3x/week`
- Tuesday: `Lower`
- Thursday: `Upper`
- Saturday: `Primer`

### Example - Match week, `2x/week`
- Tuesday: `Lower`
- Thursday: `Upper`
- or `Thursday: Primer` if the upper slot is too close to the match and freshness is the clear priority

### Example - No-match week, `3x/week`
- Monday: `Lower`
- Wednesday: `Upper`
- Friday or Saturday: `Full Body`

The placement rule matters more than the exact weekday names:
- heavy lower early
- upper in the middle
- primer only close to the match

---

## 4. Rugby Coexistence

Rugby training is the primary training stimulus in-season.

S&C exists to:
- maintain strength and power qualities
- protect key tissues
- preserve useful outputs during the competition period

Simple V1 rule:
- if rugby volume is exceptionally high in a given week, reduce S&C before trying to reduce rugby
- if there are two matches in one week or an unusually heavy collective load, default to `2x/week` S&C before cutting rugby exposure

---

## 5. Transition Pre-Season -> In-Season

The first in-season week should be treated as an installation week.

Recommended V1 rule:
- establish reference loads around `5-10%` below the heaviest Phase 3 pre-season loads
- keep all session volumes at the low end of prescribed ranges
- prioritize clean execution and readiness over proving that pre-season peaks are still there

The goal of the first in-season week is:
- to install maintenance rhythm
- not to test residual pre-season capacity

---

## 6. Fatigue Override

The third session should not depend on the calendar alone.

If fatigue is high, even without a match:
- replace `Full Body` with `Primer`
or
- use a reduced `Full Body`

If fatigue is very high on a match week:
- reduce the `Primer`
or
- keep only the first 2 blocks

Simple V1 rule:
- `normal fatigue + match` -> `Primer`
- `normal fatigue + no match` -> `Full Body`
- `high fatigue + no match` -> `Primer` or `Full Body light`
- `high fatigue + match` -> `Primer light`

---

## 7. Position Logic

### Lower / Upper
- should be clearly accented by position group
- example:
  - `front_row`
  - `back_three`

### Primer
- should be position-specific
- this is the session where the positional accent matters the most

### Full Body
- should keep a common skeleton
- but still carry clear position accents

Recommended V1 rule:
- `Primer` -> separate by position group
- `Full Body` -> common logic, position-specific versions allowed when value is real

---

## 8. Weekly Examples

### Front Row - Match Week
- `LOWER_IN_SEASON_FRONT_ROW_V1`
- `UPPER_IN_SEASON_FRONT_ROW_V1`
- `FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1`

### Front Row - No Match Week
- `LOWER_IN_SEASON_FRONT_ROW_V1`
- `UPPER_IN_SEASON_FRONT_ROW_V1`
- `FULL_BODY_IN_SEASON_FRONT_ROW_V1`

### Back Three - Match Week
- `LOWER_IN_SEASON_BACK_THREE_V1`
- `UPPER_IN_SEASON_BACK_THREE_V1`
- `FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1`

### Back Three - No Match Week
- `LOWER_IN_SEASON_BACK_THREE_V1`
- `UPPER_IN_SEASON_BACK_THREE_V1`
- `FULL_BODY_IN_SEASON_BACK_THREE_V1`

---

## 9. Reduced Weeks

In-season deload is more organic than pre-season, but it should still exist.

Recommended V1 rule:
- every `4-6 weeks`, plan one reduced-volume week
- during that week:
  - keep sessions to `2 blocks maximum` when possible
  - keep loads around `75-80%` of normal reference loads
  - keep movement speed and quality high

This is especially useful during dense competition periods.

---

## 10. When to Reduce Volume

Reduce or simplify the week if:
- player reports high fatigue
- strong drop in jump quality / readiness
- heavy rugby field week
- pain warning on a main pattern

Priority order for reduction:
1. remove optional pump/reward blocks
2. reduce support/finisher blocks
3. reduce one round from secondary blocks
4. keep the main quality block if the player is still moving well

---

## 11. Implementation Notes

Later in the app, weekly selection can follow a simple path:
1. detect weekly frequency (`2` or `3`)
2. detect match or no-match week
3. detect whether this is the first in-season week after pre-season
4. detect fatigue override
5. detect whether the week is a planned reduced week
6. select position-specific mother sessions
7. apply equipment and injury substitutions using the automatic alternatives matrix

This keeps the system coach-led, readable, and app-friendly.
