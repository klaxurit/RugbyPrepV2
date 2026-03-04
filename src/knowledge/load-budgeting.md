# Load Budgeting — RugbyPrep Volume Guidelines

> Reference for `buildWeekProgram.ts` and the AI coach.
> Defines maximum recommended volume per session and per week by level, phase, and match context.
> Sources: Gabbett (2016) BJSM, Israetel et al. (2019) RP Strength, Haff & Triplett (2016) NSCA.

---

## Weekly Session Volume Caps

### By Training Level

| Level | Sets/session (strength) | Sets/week (per muscle group) | Notes |
|-------|------------------------|------------------------------|-------|
| Starter | 6–10 sets | 10–14 sets | BW/band only; high frequency low intensity |
| Builder | 10–14 sets | 14–20 sets | Supersets 2–3 exercises; RPE 7–8 |
| Performance | 14–20 sets | 18–24 sets | Block periodization; RPE 8–9 peak |

### By Phase

| Phase | Volume modifier | Intensity modifier | Notes |
|-------|-----------------|--------------------|-------|
| HYPERTROPHY (H1-H3) | 100% (baseline) | RPE 7–8 | High volume, moderate load |
| HYPERTROPHY_DELOAD (H4) | 40–50% | RPE 6 | Active recovery, maintain patterns |
| FORCE (W1-W8) | 80–90% | RPE 8–9 | Lower volume, higher intensity |
| POWER | 60–70% | RPE 9 | Explosive quality, not quantity |
| DELOAD (W4, W8) | 40–50% | RPE 6 | Mandatory recovery week |

---

## Match Week Load Management

### Proximity to Match (days before/after)

| Day | Load recommendation | Session type |
|-----|--------------------|-----------|
| J-4 or more | Full session — normal load | Standard program |
| J-3 | Moderate — 70–80% of normal volume | Standard (reduce sets by 2–3) |
| J-2 | Activation only — minimal load | Activation + prehab (15–20 min) |
| J-1 | Rest or mobility only | RECOVERY_MOBILITY_V1 |
| Match day | Match | — |
| J+1 | Rest or light mobility | RECOVERY_MOBILITY_V1 |
| J+2 | Low intensity — flush | Conditioning or easy BW |

### Double Match Week

When 2 matches are scheduled in one week (see `double-match-weeks.md`):
- **Cut S&C volume by 50%** vs. single-match week
- **Priority:** neuromuscular activation only (activation + power), no hypertrophy
- **Avoid:** heavy compound lifts (squat, deadlift) within 72h of a match
- **Maximum:** 1 structured gym session between the 2 matches

---

## ACWR-Based Load Adjustments

ACWR = Acute Load (7-day) / Chronic Load (28-day rolling average)

| ACWR zone | Risk level | Program action |
|-----------|-----------|----------------|
| < 0.8 | Under-trained | Increase load — add sets or intensity |
| 0.8–1.3 | **Sweet spot** (optimal) | Maintain planned program |
| 1.3–1.5 | Caution zone | Reduce volume 20–30%, prioritize quality |
| > 1.5 | **Red zone** (high injury risk) | Mandatory deload — activation/mobility only |

*Reference: Gabbett TJ (2016) "The training-injury prevention paradox" BJSM 50(5):273-280*

### Implementation in `buildWeekProgram`

```ts
// Planned: ENH-1
// fatigueLevel derived from ACWR in useACWR hook
// 'low' (ACWR < 0.8) → add volume
// 'medium' (0.8–1.3) → standard
// 'high' (1.3–1.5) → reduce volume 25%
// 'critical' (> 1.5) → deload override
```

---

## In-Season Volume Targets (Weekly)

During the competitive season, maintain minimum effective volume:

| Muscle group | Minimum sets/week | Rationale |
|-------------|------------------|-----------|
| Lower body (quad/posterior chain) | 6–8 sets | Maintain sprint + tackle power |
| Upper body push | 4–6 sets | Shoulder/chest stability |
| Upper body pull | 6–8 sets | Postural balance, injury prevention |
| Core | 6–10 sets | Transfer force, spine protection |

Below these minimums for 3+ weeks → strength loss, elevated injury risk.

---

## Deload Triggers

A deload is automatically recommended when:
1. **H4** (every 4th hypertrophy week) — scheduled deload
2. **W4** (mid-force block) — scheduled deload
3. **W8** (end-force block) — scheduled deload
4. **ACWR > 1.5** — emergency deload regardless of phase
5. **Subjective: Hooper Index ≥ 20** (if monitored) — fatigue, stress, sleep, soreness all elevated

*Implementation: `shouldRecommendDeload()` in `buildWeekProgram.ts`*

---

## Session Duration Targets

| Training level | Target session duration |
|---------------|------------------------|
| Starter | 30–45 min |
| Builder | 45–60 min |
| Performance | 60–75 min |

Sessions exceeding 75 min with high intensity show diminishing returns and elevated cortisol response.

---

*Last updated: 2026-03-03*
*Sources: Gabbett TJ (2016) BJSM; Israetel M et al. (2019) Scientific Principles of Strength Training; Haff GG & Triplett NT (2016) NSCA Essentials of Strength Training*
