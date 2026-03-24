# Level Onboarding Scorecard

This document defines the V1 onboarding scorecard used to assign an initial training level in RugbyPrep.

Goal:
- keep onboarding under `2 minutes`
- collect only the minimum data needed to assign a safe starting profile
- score `3` primary level axes
- derive the visible label `Starter`, `Builder`, or `Performance`
- allow later refinement from real usage

---

## 1. Scope

This scorecard is:
- a **first calibration**
- not a diagnosis
- not a long readiness assessment
- not a medical questionnaire

It is designed to answer one product question:

**How advanced should the app be when it serves the player their first program?**

Important:
- equipment is handled elsewhere
- rugby division is handled elsewhere
- injury substitutions are handled elsewhere
- this scorecard only drives level modifiers

---

## 2. V1 Scored Axes

The onboarding scorecard directly scores only `3` axes:

1. `exercise_complexity`
2. `volume_tolerance`
3. `explosive_readiness`

The engine then derives:
- `intensity_tolerance`
- `optional_block_tolerance`

This keeps V1 simple and fast.

---

## 3. The Six Questions

### Q1 — Training age
**Question**
- `Depuis combien de temps tu fais de la musculation régulièrement ?`

**Choices**
- `Moins de 6 mois`
- `Entre 6 mois et 2 ans`
- `Plus de 2 ans`

**Primary axis**
- `exercise_complexity`

### Q2 — Pattern confidence
**Question**
- `Est-ce que tu es à l’aise avec le squat barre, le soulevé de terre, et le développé couché ?`

**Choices**
- `Pas vraiment`
- `Plutôt oui`
- `Oui, clairement`

**Primary axis**
- `exercise_complexity`

### Q3 — Recent consistency
**Question**
- `Sur les 2 derniers mois, tu faisais combien de séances de musculation par semaine en moyenne ?`

**Choices**
- `0 à 1`
- `2`
- `3 ou plus`

**Primary axis**
- `volume_tolerance`

### Q4 — Recovery capacity
**Question**
- `En général, comment tu récupères entre les séances ?`

**Choices**
- `Plutôt difficilement`
- `Plutôt correctement`
- `Très bien`

**Primary axis**
- `volume_tolerance`

### Q5 — Explosive exposure
**Question**
- `Est-ce que tu as déjà fait des sauts, des lancers de med ball, ou du travail de vitesse en entraînement ?`

**Choices**
- `Jamais ou presque`
- `Oui, un peu`
- `Oui, régulièrement`

**Primary axis**
- `explosive_readiness`

### Q6 — Current pain
**Question**
- `Est-ce que tu as actuellement des douleurs qui peuvent te gêner à l’entraînement ?`

**Choices**
- `Oui, plusieurs ou importantes`
- `Oui, légères ou occasionnelles`
- `Non`

**Primary axis**
- `explosive_readiness`

Important:
- this is **not** a medical screen
- it is only used to avoid assigning an overly aggressive starting profile

---

## 4. Raw Scoring

Each answer gives `1`, `2`, or `3` points.

### Q1 — Training age
- `Moins de 6 mois` -> `1`
- `Entre 6 mois et 2 ans` -> `2`
- `Plus de 2 ans` -> `3`

### Q2 — Pattern confidence
- `Pas vraiment` -> `1`
- `Plutôt oui` -> `2`
- `Oui, clairement` -> `3`

### Q3 — Recent consistency
- `0 à 1` -> `1`
- `2` -> `2`
- `3 ou plus` -> `3`

### Q4 — Recovery capacity
- `Plutôt difficilement` -> `1`
- `Plutôt correctement` -> `2`
- `Très bien` -> `3`

### Q5 — Explosive exposure
- `Jamais ou presque` -> `1`
- `Oui, un peu` -> `2`
- `Oui, régulièrement` -> `3`

### Q6 — Current pain
- `Oui, plusieurs ou importantes` -> `1`
- `Oui, légères ou occasionnelles` -> `2`
- `Non` -> `3`

---

## 5. Axis Scores

Each axis is the average of `2` questions.

### `exercise_complexity`
- average of `Q1 + Q2`

### `volume_tolerance`
- average of `Q3 + Q4`

### `explosive_readiness`
- average of `Q5 + Q6`

The raw average can stay decimal internally.

Example:
- `Q1 = 2`
- `Q2 = 3`
- `exercise_complexity = 2.5`

---

## 6. Axis Banding

Convert each axis average into one of three states:

- `1.0` -> `starter`
- `1.5 to 2.0` -> `builder`
- `2.5 to 3.0` -> `performance`

### Important V1 interpretation rule

The scorecard should stay simple and reflect real amateur S&C readiness.

This means:
- a player does **not** need a perfect `3.0` to be considered `performance`
- a player with one strong and one decent answer on an axis can already sit closer to `performance` than to `builder`

Examples:
- `1.0` = clear `starter`
- `1.5` = `builder`
- `2.5` = `performance`

Safety is then protected by:
- the visible label using the **lowest** axis
- the explicit safety caps
- later refinement through real usage

---

## 7. Derived Axes

The engine should derive two more axes.

### `intensity_tolerance`

Default derivation:
- start from the lower of:
  - `exercise_complexity`
  - `volume_tolerance`

Reason:
- if the player cannot move well or recover well, intensity margin should stay conservative

### `optional_block_tolerance`

Default derivation:
- start from `volume_tolerance`

Reason:
- optional blocks are mostly a recovery / capacity question

Later, both can be refined through usage data.

---

## 8. Global Visible Label

The user should see only one simple label:
- `Starter`
- `Builder`
- `Performance`

### V1 mapping rule

The visible label should be based on the **lowest** of the three scored axes.

Reason:
- the first program must be safe
- the weakest axis is the one most likely to create bad prescriptions

### Examples

#### Example A
- `exercise_complexity = builder`
- `volume_tolerance = builder`
- `explosive_readiness = starter`

Visible label:
- `Starter`

Internal profile:
- complexity = builder
- volume = builder
- explosive = starter

#### Example B
- `exercise_complexity = performance`
- `volume_tolerance = builder`
- `explosive_readiness = builder`

Visible label:
- `Builder`

#### Example C
- all three axes = `performance`

Visible label:
- `Performance`

This is the correct V1 compromise:
- simple for the user
- granular in the engine

---

## 9. What Each Label Means in Practice

### Starter

Implications:
- simpler exercises first
- fewer support sets
- more RIR
- delayed complex explosive work
- optional blocks usually trimmed or removed

### Builder

Implications:
- same session skeleton as base
- moderate simplifications where needed
- slightly reduced support density
- standard simple explosive work

### Performance

Implications:
- base session as authored
- only adapted by fatigue, equipment, or injury

---

## 10. Safety Caps

The onboarding score should include a few conservative caps.

### Cap 1 — Pain cap

If `Q6 = Oui, plusieurs ou importantes`:
- cap `explosive_readiness` at `starter`

### Cap 2 — True beginner cap

If:
- `Q1 = Moins de 6 mois`
and
- `Q2 = Pas vraiment`

Then:
- cap `exercise_complexity` at `starter`
- cap visible label at `Starter`

### Cap 3 — Inconsistent + poor recovery cap

If:
- `Q3 = 0 à 1`
and
- `Q4 = Plutôt difficilement`

Then:
- cap `volume_tolerance` at `starter`

These caps are there to avoid obviously over-aggressive onboarding outputs.

---

## 11. Post-Onboarding Refinement

The onboarding result should not be permanent.

The app should refine the modifier profile through real usage:
- session completion
- skipped blocks
- reported soreness
- reported pain
- readiness drop
- movement quality feedback if available

### Important rule

Promotion should be:
- gradual
- axis by axis
- after repeated evidence

Regression should be:
- faster
- targeted
- and should affect only the failing axis when possible

---

## 12. UX Recommendation

### What the user sees

After the 6 questions:
- one short label
- one short explanation

Example:

`Ton profil initial : Builder`

`On te donne une version structurée mais progressive du programme. L’app ajustera ensuite ton niveau en fonction de ta récupération et de tes séances réelles.`

### What the user should not see

- no raw points
- no axis jargon
- no medical-looking interpretation
- no “you are weak / advanced” framing

The tone should be:
- simple
- safe
- coach-like

---

## 13. Recommended Next Step

Once this scorecard is accepted, RugbyPrep should create:
- a mapping table by session type:
  - `lower`
  - `upper`
  - `full`
  - `primer`
  - `speed/power`
- with explicit transformation rules for:
  - `Starter`
  - `Builder`
  - `Performance`

That mapping layer is what will make the scorecard operational in the real engine.
