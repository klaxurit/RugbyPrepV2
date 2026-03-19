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

## 3. Fatigue Override

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

## 4. Position Logic

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

## 5. Weekly Examples

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

## 6. When to Reduce Volume

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

## 7. Implementation Notes

Later in the app, weekly selection can follow a simple path:
1. detect weekly frequency (`2` or `3`)
2. detect match or no-match week
3. detect fatigue override
4. select position-specific mother sessions
5. apply equipment and injury substitutions using the automatic alternatives matrix

This keeps the system coach-led, readable, and app-friendly.
