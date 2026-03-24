# Level Modifiers Framework

This document defines how RugbyPrep should make the annual training system accessible to a wider amateur player base without duplicating the mother-session library.

Goal:
- keep one single annual training library
- adapt that library to real amateur S&C levels
- avoid building separate `Starter`, `Builder`, and `Performance` session libraries
- make level progression gradual, not binary

---

## 1. Core Principle

RugbyPrep should not create:
- one program for `R3`
- one program for `R2`
- one program for `F3`
- one program for `F1`

That would be the wrong abstraction.

Division is:
- useful context for rugby load and match demands
- **not** a reliable proxy for gym level, movement competency, or recovery capacity

The correct model is:
- one shared annual system:
  - off-season
  - pre-season
  - in-season
- one shared mother-session library
- one layer of **level modifiers** applied on top

This keeps:
- maintenance simple
- session identity coherent
- product behavior predictable

---

## 2. Base Authoring Rule

The current mother sessions are authored primarily for:
- `performance`
- `full_gym`

This remains the source of truth.

`Starter` and `Builder` should not become parallel libraries.
They should be derived from the same base sessions through controlled transformations.

Important rule:
- the app selects the mother session first
- then applies level modifiers
- then applies equipment / injury substitutions
- then applies fatigue overrides

---

## 3. The Three User-Facing Levels

### Starter
Profile:
- low S&C experience
- low tolerance to volume and technical complexity
- inconsistent recent training history
- needs simpler exercises and more margin

Typical amateur examples:
- player new to gym training
- player returning after a long break
- player with poor pattern confidence
- player who can commit only irregularly

### Builder
Profile:
- regular amateur S&C practice
- decent pattern competency
- moderate tolerance to volume
- this should likely be the default level for many amateur players

Typical amateur examples:
- consistent `2-3x/week` lifter
- decent barbell literacy
- can recover from structured weekly work
- not elite, but not beginner

### Performance
Profile:
- high S&C experience
- high exercise competency
- good recovery and consistency
- can tolerate the authored session structure as written

Typical amateur examples:
- highly invested player
- strong full-gym familiarity
- stable schedule
- already training near the intent of the current library

---

## 4. Level Must Not Be Global and Binary

This is the most important implementation rule.

A player should not jump from:
- `Starter`
to
- `Builder`

in one global switch just because one score changed.

Instead, RugbyPrep should use:
- one **global label** for UX simplicity
- plus a more granular **modifier profile** underneath

### Full modifier profile axes

1. `exercise_complexity`
2. `volume_tolerance`
3. `intensity_tolerance`
4. `explosive_readiness`
5. `optional_block_tolerance`

Each axis can sit at:
- `starter`
- `builder`
- `performance`

So a player can be:
- globally `Builder`
- but still `Starter` on explosive readiness
- and `Starter` on volume tolerance

Example:
- Back Squat unlocked = `Builder` on exercise complexity
- still only `3` sets instead of `4` = `Starter` on volume tolerance
- no true contrast yet = `Starter` on explosive readiness

That is the correct progression model.

### Important V1 implementation decision

The engine does **not** need to score all five axes directly at onboarding.

For V1, RugbyPrep should score only:
1. `exercise_complexity`
2. `volume_tolerance`
3. `explosive_readiness`

Then derive:
- `intensity_tolerance` mainly from:
  - `exercise_complexity`
  - `volume_tolerance`
- `optional_block_tolerance` mainly from:
  - `volume_tolerance`
  - weekly recovery / fatigue once the player starts using the app

This keeps onboarding:
- short
- realistic
- and product-friendly

---

## 5. Initial Assessment Inputs

The app should not ask only:
- `what division do you play in?`

It should assess real S&C readiness.

### Minimum useful onboarding inputs for V1

The V1 onboarding scorecard should stay under `2 minutes`.

It should use only `6` short questions to score the `3` primary axes:

#### For `exercise_complexity`
1. **Training age**
- since when has the player been lifting regularly?
2. **Pattern confidence**
- are they comfortable with squat, deadlift, and bench?

#### For `volume_tolerance`
3. **Recent consistency**
- how many gym sessions per week over the last `2 months`?
4. **Recovery capacity**
- how well do they usually recover between sessions?

#### For `explosive_readiness`
5. **Explosive exposure**
- have they already done jumps, med-ball work, or speed training?
6. **Current pain / irritation**
- do they currently have pain that could make explosive work less safe?

### Inputs handled elsewhere

The onboarding should still ask for:
- equipment
- rugby division / context
- position
- injuries / substitutions context

But these should not all feed directly into the level-modifier score.

Important product distinction:
- **equipment** feeds substitutions
- **pain/injury context** feeds substitutions and can also cap explosive readiness
- **division** feeds rugby context
- **level scorecard** feeds training complexity

### Important rule

If the app does not know enough yet:
- do **not** default to full `Performance`
- start conservatively with:
  - `Builder` global label at most
  - but `Starter` modifiers on complexity / explosive exposure where uncertainty is high

---

## 6. The Five Modifier Levers

These are the only levers RugbyPrep should use to make sessions more accessible.

For V1:
- only the first three are scored directly at onboarding
- the last two are derived or updated later from real usage

### 1. Exercise complexity

Use easier versions before removing the training intent.

Examples:
- `Pin Back Squat` -> `Back Squat` -> `Front Squat` -> `Goblet Squat`
- `Neutral-Grip Pull-Up` -> `Lat Pulldown` -> `Chest-Supported Row`
- `Seated DB OHP` -> `Half-Kneeling Landmine Press`
- `Copenhagen Hold` -> `Supine Adductor Squeeze`
- `Nordic Curl` -> `Leg Curl`

### 2. Volume

Reduce total sets before rewriting the whole session.

Default approach:
- `Starter`: around `-20% to -30%` total volume
- `Builder`: around `-10% to 0%`
- `Performance`: as authored

### 3. Intensity / RIR

Keep more margin for less experienced players.

Default approach:
- `Starter`: keep `2-4 RIR`
- `Builder`: keep `2-3 RIR`
- `Performance`: as authored

### 4. Explosive introduction

The less experienced player should not lose all explosive work forever.
They should just receive:
- simpler
- later
- lower-volume

Examples:
- `Starter`
  - bodyweight jumps before loaded contrast
  - med-ball before more demanding combinations
  - drop aggressive reactive plyos until later
- `Builder`
  - standard jumps and simple contrast
- `Performance`
  - as authored

### 5. Optional blocks

Optional blocks are the first place to simplify.

Examples:
- remove reward blocks first
- remove arm volume second
- reduce lower-leg / tissue volume third
- keep the main block identity intact as long as possible

---

## 7. Level Rules by Phase

### Recovery

Level differences should be minimal.

Reason:
- recovery is already conservative
- most players should live close to the same structure here

Allowed changes:
- easier exercise choice
- `2` rounds instead of `3`
- simpler trunk / locomotion options

### Transition

Level differences become visible, but still moderate.

Typical `Starter` changes:
- simpler barbell choices
- fewer support rounds
- less unilateral fatigue

Typical `Builder` changes:
- mostly same skeleton
- slightly reduced volume if needed

### Hypertrophy

This is where level differences become most visible.

Typical `Starter` changes:
- simpler main lifts if pattern confidence is low
- one less support set
- optional reward blocks often removed
- higher RIR targets

Typical `Builder` changes:
- mostly same structure
- reduced optional volume
- some exercises simplified where needed

### Force-Bridge

This is where the app must be careful.

Typical `Starter` changes:
- keep force intent
- but stay closer to late hypertrophy than to pre-season density
- no unnecessary rush toward high intensity

Typical `Builder` changes:
- same patterns
- slightly lower density or slightly more margin

### Pre-Season

This is where `explosive_readiness` matters most.

Typical `Starter` changes:
- simpler contrast
- fewer explosive contacts
- easier plyo variations
- delayed advanced power options

Typical `Builder` changes:
- near-base structure
- moderate explosive exposure

### In-Season

This is where `volume_tolerance` and `recovery_capacity` matter most.

Typical `Starter` changes:
- shorter sessions
- simpler primer
- reduced support work

Typical `Builder` changes:
- close to base
- a little less optional density

---

## 8. What Changes at Each Level

### Starter

Default transformation rules:
- simplify one exercise before changing the whole block
- reduce one support set before touching the main block
- remove reward/optional blocks by default
- keep higher RIR
- delay advanced explosive methods

Examples:
- `4x8` -> `3x8`
- `4x5` -> `3x5`
- `Pin Back Squat` -> `Back Squat` or `Goblet Squat`
- `Neutral-Grip Pull-Up` -> `Lat Pulldown`
- `Nordic Curl` -> `Leg Curl`

### Builder

Default transformation rules:
- keep the same session skeleton
- simplify only where needed
- preserve most main blocks
- reduce optional density if recovery is average

Examples:
- same anchor lift
- same number of main blocks
- one optional block removed or trimmed
- slightly more conservative RIR

### Performance

Default transformation rules:
- use the authored session as written
- only adapt for injury, equipment, or weekly fatigue

---

## 9. Division Is Context, Not Level

Division should influence:
- likely rugby load
- likely match intensity
- likely collision demands
- likely team-training density

Division should **not** directly decide:
- exercise complexity
- loading tolerance
- barbell competency
- readiness for plyometric progression

Recommended use of division:
- as a secondary contextual feature for:
  - contact emphasis
  - conditioning assumptions
  - match-week load sensitivity

Not as the main driver of:
- `Starter`
- `Builder`
- `Performance`

---

## 10. Promotion and Regression Rules

### Promotion

Promotion should happen:
- gradually
- per axis
- after evidence, not optimism

Recommended rule:
- promote one axis only after `2-4 weeks` of:
  - high compliance
  - good movement quality
  - low pain
  - acceptable recovery

Examples:
- unlock `Back Squat` before increasing total weekly volume
- unlock simple contrast before introducing more advanced plyos
- keep a player `Builder` globally while moving only `exercise_complexity` to `Performance`

### Regression

Regression should happen faster than promotion.

Trigger examples:
- repeated pain flare-ups
- poor movement quality
- high weekly fatigue
- missed sessions
- excessive soreness

Recommended rule:
- regress the smallest necessary lever first
- do not collapse the whole player profile if only one axis is failing

Example:
- keep `Builder` main lifts
- but move `explosive_readiness` back to `Starter`

---

## 11. Example Transformations

### Example A — Lower Pre-Season Force

Base session:
- `Pin Back Squat 4x4-5`
- `Barbell RDL`
- `RFESS`
- `Nordic + calf + tibialis`

`Builder` version:
- `Back Squat 4x4-5`
- `DB RDL 3x6`
- `Reverse Lunge 3x6/side`
- `Leg Curl or Nordic micro-dose`

`Starter` version:
- `Goblet Squat 3x6-8`
- `DB RDL 3x6-8`
- `Split Squat 2-3x6/side`
- `Calf + tibialis`
- no Nordic until tissue tolerance is clear

### Example B — Off-Season Hypertrophy Upper

Base session:
- `Bench 4x8`
- `CSR 4x8-10 + Incline DB 3-4x8-10`
- `DB OHP + Pulldown`
- `arms + shoulder support`

`Builder` version:
- same skeleton
- `Incline DB` fixed at `3 sets`
- optional shoulder pair removed if recovery is average

`Starter` version:
- `Bench` may become `Neutral-Grip DB Bench`
- `CSR 3x8-10`
- `Incline DB 3x8`
- `Landmine Press` instead of DB OHP if needed
- `Pulldown`
- arms kept minimal

---

## 12. Recommended App Logic

The app should follow this order:

1. detect annual phase
   - off-season / pre-season / in-season
2. detect weekly format
   - `2x / 3x / 4x`
3. select base mother sessions
4. apply position accents
5. apply level modifiers
6. apply equipment / injury substitutions
7. apply weekly fatigue overrides

Important:
- level modifiers happen before substitutions because they define the intended training complexity
- substitutions then adapt that level-appropriate intent to the real setup or pain context

---

## 13. Recommended Product Defaults

### Default UX label
- use one simple visible level:
  - `Starter`
  - `Builder`
  - `Performance`

### Default hidden engine behavior
- use granular per-axis states underneath

### Recommended default for unknown users
- not full `Performance`
- not aggressively downgraded everywhere either

Best default:
- visible label: `Builder` only if history supports it
- hidden profile:
  - `Starter` on explosive readiness until proven otherwise
  - `Starter` on complexity when barbell confidence is unknown
  - `Builder` on base structure if training history is decent

This is the safest way to avoid giving an amateur player a “pro-looking” program they cannot actually execute well.

---

## 14. Next Step

Before integrating into the app, RugbyPrep should add:
- a simple onboarding scorecard for the five modifier axes
- a mapping table per mother session type:
  - what changes for `Starter`
  - what changes for `Builder`
  - what stays fixed for `Performance`

This framework should become the source of truth for:
- accessible program delivery
- progression across amateur levels
- future `starter / builder` implementation work
