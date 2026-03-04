# Return-to-Play Criteria — Rugby Physical Preparation

> Reference document for the RugbyPrep rehab routing engine.
> Defines objective entry/exit criteria for each rehab phase (P1 → P2 → P3 → Full).
> Sources: rugby-specific RTP frameworks (Creighton 2010, Shrier 2015), consensus BJSM 2016.

---

## Overview

The rehab pipeline has **3 phases** before returning to full team training:

| Phase | Program recipes | Focus | Duration guide |
|-------|----------------|-------|----------------|
| P1 — Acute protection | REHAB_UPPER/LOWER_P1_V1 | Reduce pain/swelling, restore basic ROM | 1–3 weeks |
| P2 — Progressive loading | REHAB_UPPER/LOWER_P2_V1 | Rebuild strength, proprioception | 2–4 weeks |
| P3 — Sport-specific | REHAB_UPPER/LOWER_P3_V1 | Power, contact tolerance, agility | 2–3 weeks |
| Full return | Standard program | Normal training load | — |

*Durations are indicative. Progression is **criteria-based**, not time-based.*

---

## Phase P1 → P2 Criteria (Acute → Sub-acute)

All criteria must be met simultaneously:

### Pain
- Resting pain **≤ 2/10** on NRS (Numeric Rating Scale 0–10)
- Activity pain **≤ 4/10** during P1 exercises
- No acute swelling at the joint after exercise

### Range of Motion
- **Upper (shoulder):** ≥ 90° shoulder flexion active, ≥ 60° external rotation without compensation
- **Lower (knee):** Full passive extension (0°), ≥ 90° active knee flexion
- **Lower (hip/ankle):** No significant ROM deficit vs. contralateral side (< 15% difference)

### Strength
- Can complete all P1 session exercises with control and zero pain increase
- No significant antalgic compensation pattern during movement

### Functional
- Can walk pain-free (lower) or perform basic daily arm movements pain-free (upper)

---

## Phase P2 → P3 Criteria (Sub-acute → Reloading)

### Pain
- Activity pain **≤ 2/10** during P2 exercises
- No post-exercise swelling or night pain

### Range of Motion
- **Upper:** Shoulder flexion ≥ 150°, IR/ER within 10° of contralateral
- **Lower (knee):** Knee flexion ≥ 120°, full symmetrical extension
- **Lower (hip):** Full squat ROM without compensation

### Strength (Symmetry)
- Limb Symmetry Index (LSI) ≥ **70%** on basic tests:
  - Upper: push-up hold endurance ≥ 70% of contralateral baseline
  - Lower: single-leg wall sit duration ≥ 70% of contralateral
  - Lower (knee): single-leg press ≥ 70% of estimated 1RM on healthy side

### Functional
- Can jog in a straight line (lower) or throw a ball at 50% effort (upper) without pain

---

## Phase P3 → Full Training Criteria

### Pain
- **0/10** pain during all sport-specific movements
- Zero post-training soreness beyond normal DOMS within 24h

### Strength (Symmetry)
- LSI ≥ **90%** on sport-specific tests:
  - **Upper:** Push-up test, horizontal pull endurance
  - **Lower:** Single-leg hop distance ≥ 90% contralateral
  - **Lower:** Single-leg squat control — no valgus collapse, no trunk lean

### Power / Speed
- Lower: **CMJ bilateral** within 10% of pre-injury score (if known)
- Lower: 10m sprint within 5% of healthy baseline
- Upper: Shoulder internal rotation speed within 10% of contralateral (if measured)

### Sport-specific
- Completed a full contact training session without symptom recurrence
- Cleared by medical staff or physiotherapist

---

## Stoppage Rules (Any Phase)

Immediately **stop session and refer** if:
- Pain suddenly increases > 6/10 during exercise
- Acute joint swelling appears after exercise
- Sensation of joint instability or "giving way"
- Neurological symptoms: numbness, tingling, radiating pain
- For upper: any suspicion of rotator cuff re-tear (external rotation weakness + pain arc)
- For lower: any suspicion of re-rupture (ACL/Achilles pop sensation, immediate swelling)

→ See also: `medical-red-flags.md`

---

## Routing in the App

```
rehabInjury = { zone: 'upper' | 'lower', phase: 'P1' | 'P2' | 'P3' }
```

The `applyRehabRouting()` function in `buildWeekProgram.ts` replaces standard sessions with:
- `REHAB_UPPER_P1_V1` / `REHAB_LOWER_P1_V1` — activation + prehab (no load)
- `REHAB_UPPER_P2_V1` / `REHAB_LOWER_P2_V1` — progressive loading
- `REHAB_UPPER_P3_V1` / `REHAB_LOWER_P3_V1` — sport-specific intensity

The AI coach should reference these criteria when answering rehab progression questions.

---

*Last updated: 2026-03-03*
*Sources: Creighton DW et al. (2010) BJSM; Shrier I (2015) CJSM; Gabbett TJ (2016) BJSM consensus*
