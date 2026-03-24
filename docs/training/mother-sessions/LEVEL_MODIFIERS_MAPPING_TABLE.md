# Level Modifiers Mapping Table

This document translates the level framework and onboarding scorecard into concrete training transformations.

Goal:
- make `Starter`, `Builder`, and `Performance` operational
- tell the app exactly how to adapt a base mother session
- avoid writing parallel session libraries

Important:
- the app still selects the **base mother session first**
- this table only defines how to modify that session afterward

---

## 1. Order of Operations

The app should apply transformations in this order:

1. select annual phase
2. select weekly template
3. select base mother session
4. apply position accent
5. apply level modifiers using this table
6. apply equipment substitutions
7. apply injury substitutions
8. apply weekly fatigue override

Reason:
- level modifiers shape the intended training difficulty
- substitutions then adapt that intended version to real constraints

---

## 2. Three Scored Axes

The mapping table only uses the three V1 scored axes:

1. `exercise_complexity`
2. `volume_tolerance`
3. `explosive_readiness`

Two more levers are derived:
- `intensity_tolerance`
- `optional_block_tolerance`

### Derived rules

#### `intensity_tolerance`
- use the lower of:
  - `exercise_complexity`
  - `volume_tolerance`

#### `optional_block_tolerance`
- derive mainly from:
  - `volume_tolerance`

This means the app does not need five separate onboarding scores to behave intelligently.

---

## 3. General Transformation Rules

### If `exercise_complexity = starter`
- simplify the hardest movement in the session first
- prefer supported or more self-limiting patterns
- keep the same training intent when possible

### If `volume_tolerance = starter`
- reduce support volume first
- keep the main block if possible
- remove optional blocks early

### If `explosive_readiness = starter`
- simplify jump/throw/sprint exposure
- reduce contacts and rounds
- delay reactive or loaded explosive work

### If all three = performance
- use the authored session as written

---

## 4. Session-Type Mapping

## Lower Sessions

### Base intent
- squat or hinge anchor
- one structural support block
- tissue continuity / finisher

### `Starter` mapping

#### Complexity
- simplify main lower lift if needed:
  - `Pin Back Squat` -> `Back Squat`
  - `Back Squat` -> `Front Squat`
  - `Front Squat` -> `Goblet Squat`
  - `Trap Bar Deadlift` -> `DB RDL` or `Hip Thrust`
- simplify unilateral work:
  - `RFESS` -> `Reverse Lunge`
  - `Reverse Lunge` -> `Split Squat`
- simplify tissue work:
  - `Nordic Curl` -> `Leg Curl`
  - `Copenhagen Hold` -> `Supine Adductor Squeeze`

#### Volume
- reduce main anchor sets by `1` only if recovery is clearly low
- reduce support block by `1` round by default if the session is dense
- reduce tissue block to minimum effective dose

#### Explosive
- bodyweight jump before loaded contrast
- no aggressive reactive plyos
- lower total contacts

### `Builder` mapping

#### Complexity
- keep the same anchor lift whenever possible
- simplify only one secondary exercise if needed

#### Volume
- keep main block as written
- reduce one support set only if the session is at the high end of density

#### Explosive
- standard simple jumps and contrast
- slightly lower total contacts if readiness is average

### `Performance` mapping
- use session as authored

---

## Upper Sessions

### Base intent
- one main press or pull anchor
- one structural support block
- one shoulder / arm / trunk support block

### `Starter` mapping

#### Complexity
- simplify pressing:
  - `Bench Press` -> `Neutral-Grip DB Bench Press`
  - `Seated DB OHP` -> `Half-Kneeling Landmine Press`
  - `Push Press` -> `Landmine Press`
- simplify pulling:
  - `Neutral-Grip Pull-Up` -> `Lat Pulldown`
  - unsupported row -> `Chest-Supported Row`

#### Volume
- reduce secondary push/pull block by `1` round if needed
- trim optional arm or shoulder work first

#### Explosive
- med-ball chest pass or simple plyo push-up only if the player already shows some readiness
- otherwise keep push speed intent low and technical

### `Builder` mapping

#### Complexity
- keep the same base press and row
- simplify only vertical work if needed

#### Volume
- keep the anchor block as written
- trim optional shoulder/arm density if recovery is average

#### Explosive
- allow simple upper contrast
- avoid very dense upper power clusters if readiness is only moderate

### `Performance` mapping
- use session as authored

---

## Full Sessions

### Base intent
- complete the week
- not duplicate lower or upper exactly
- keep one anchor, one support block, one tissue/trunk finish

### `Starter` mapping

#### Complexity
- simplify the anchor lift before cutting the session
- prefer one clean bilateral pattern plus one simple unilateral pattern
- avoid giving the session the hardest exercise of the week if the player is low-complexity

#### Volume
- this is often the first session to trim
- reduce optional block first
- reduce tissue block second
- reduce one support round third

#### Explosive
- keep only the simplest jump/throw expression if present
- no dense explosive stacking

### `Builder` mapping

#### Complexity
- keep the same session skeleton
- simplify one movement if needed

#### Volume
- preserve anchor and support blocks
- trim optional density when needed

#### Explosive
- keep standard simple explosive pairings

### `Performance` mapping
- use session as authored

---

## Primer Sessions

### Base intent
- neural activation
- low fatigue
- high intent

### `Starter` mapping

#### Complexity
- keep the simplest primer options only
- no advanced reactive plyometrics
- prefer:
  - `CMJ`
  - med-ball throw
  - simple landmine press
  - simple row

#### Volume
- keep only first `2-3` blocks
- trim optional confidence/pump block by default

#### Explosive
- lowest explosive contact dose in the system
- no depth jump, no aggressive reactive exposure

### `Builder` mapping

#### Complexity
- standard primer structure
- simplify only the highest-risk explosive option

#### Volume
- keep the authored primer unless recovery is questionable

#### Explosive
- allow standard low-volume primer explosiveness

### `Performance` mapping
- use session as authored

---

## Speed / Power Sessions

### Base intent
- field speed
- jumps
- throws
- COD / athletic work

This is the session type most strongly affected by `explosive_readiness`.

### `Starter` mapping

#### Complexity
- keep sprint mechanics simple
- use short accelerations
- use basic jumps only
- use med-ball throws before more advanced variations
- remove high-skill or high-reactivity drills first

#### Volume
- reduce jump contacts
- reduce COD reps
- reduce one block before making the session longer or denser

#### Explosive
- no advanced reactive plyos
- no overloaded contrast if the player has not earned it

### `Builder` mapping

#### Complexity
- standard simple sprint/jump/COD drills
- moderate drill complexity

#### Volume
- moderate contacts and reps
- still conservative if weekly rugby load is high

#### Explosive
- standard simple field power exposure

### `Performance` mapping
- use session as authored

---

## 5. Phase-Specific Mapping

## Recovery

### `Starter`
- almost identical to base
- simplify one exercise if needed
- `2 rounds` by default on the most demanding block

### `Builder`
- nearly the same as base

### `Performance`
- same as base

Reason:
- recovery is already conservative

---

## Transition

### `Starter`
- simplify barbell choices if pattern confidence is low
- keep support blocks slightly shorter

### `Builder`
- mostly same structure
- trim volume only when needed

### `Performance`
- same as authored

---

## Hypertrophy

### `Starter`
- simpler exercise choices where needed
- one less support set
- optional reward blocks usually off
- more RIR

### `Builder`
- almost same structure
- some optional volume reduced

### `Performance`
- same as authored

---

## Force-Bridge

### `Starter`
- keep force intent
- but stay closer to late hypertrophy than to pre-season density
- no rush toward heavy bridging if readiness is not there

### `Builder`
- same patterns
- slightly more margin if needed

### `Performance`
- same as authored

---

## Pre-Season

### `Starter`
- simplest viable version of the phase
- fewer explosive contacts
- simpler contrast
- more conservative loading

### `Builder`
- near-base structure
- moderate contrast volume

### `Performance`
- same as authored

---

## In-Season

### `Starter`
- shortest useful version
- fewer support blocks
- simple primer only

### `Builder`
- mostly same structure
- trim optional volume

### `Performance`
- same as authored

---

## 6. Concrete Transformation Examples

### Example A — Lower pre-season force

Base:
- `Pin Back Squat 4x4-5`
- `Barbell RDL`
- `RFESS`
- `Nordic + calf + tibialis`

`Starter`:
- `Back Squat` or `Goblet Squat`
- `DB RDL`
- `Split Squat`
- `Leg Curl + calf + tibialis`

`Builder`:
- `Back Squat`
- `Barbell RDL`
- `Reverse Lunge`
- `Nordic micro-dose + calf + tibialis`

### Example B — Upper off-season hypertrophy

Base:
- `Bench 4x8`
- `CSR 4x8-10 + Incline DB 3-4x8-10`
- `DB OHP + Pulldown`
- `arms + shoulder support`

`Starter`:
- `Neutral-Grip DB Bench 3-4x8`
- `CSR 3x8-10 + Incline DB 3x8`
- `Landmine Press + Pulldown`
- no optional shoulder pair

`Builder`:
- same anchor
- incline fixed at `3 sets`
- optional shoulder pair removed if recovery is average

---

## 7. Mapping Rules for the Engine

The engine should not store level as a single rigid switch only.

Recommended implementation:
- visible label:
  - `Starter / Builder / Performance`
- internal modifier object:
  - `exercise_complexity`
  - `volume_tolerance`
  - `explosive_readiness`
  - derived `intensity_tolerance`
  - derived `optional_block_tolerance`

Then each session type can be transformed with small rule sets rather than cloned.

---

## 8. Minimum Viable Engine Behavior

If RugbyPrep wants to ship a V1 quickly, the minimum useful behavior is:

### For `Starter`
- simplify one key exercise in the session
- reduce one support set or one support round
- disable optional blocks
- cap aggressive explosive content

### For `Builder`
- keep the session mostly intact
- trim optional density where useful

### For `Performance`
- serve the authored session

This alone would already make the current annual system much more accessible.

---

## 9. Recommended Next Step

Once this mapping table is accepted, RugbyPrep should create:
- a technical mapping schema for the app layer
- one worked example per session family in structured JSON/YAML form

That is the point where the authoring library becomes truly ready for mapping into the engine.
