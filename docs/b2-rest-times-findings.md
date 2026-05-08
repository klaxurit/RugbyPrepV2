# B2 — Rest times audit findings (Phase B dry-run)

**Generated:** 2026-05-08T07:39:10.552Z
**Total blocks:** 155

## Status breakdown

| Status | Count |
|---|---:|
| PASS | 138 |
| SKIP | 16 |
| FAIL_RANGE | 1 |
| FAIL_INTENT_UNKNOWN | 0 |
| FAIL_PARSE | 0 |

## Per-intent breakdown

| Intent | Total | Pass | Fail | Skip |
|---|---:|---:|---:|---:|
| power_contrast | 39 | 38 | 1 | 0 |
| hypertrophy | 62 | 62 | 0 | 0 |
| prehab | 20 | 17 | 0 | 3 |
| reward | 5 | 5 | 0 | 0 |
| core | 12 | 10 | 0 | 2 |
| conditioning | 9 | 0 | 0 | 9 |
| activation | 2 | 1 | 0 | 1 |
| sprint | 4 | 3 | 0 | 1 |
| dynamic | 2 | 2 | 0 | 0 |

## FAIL findings

| Session | # | Block name | Intent | Parsed | KB | Status | Reason |
|---|--:|---|---|---|---|---|---|
| `UPPER_IN_SEASON_BACK_THREE_V1` | 2 | Pull Contrast Strength | power_contrast | 75-90s | 120-180s ±0 | FAIL_RANGE | parsed 75-90s too-low vs KB 120-180s (Décision #40 v2 (rest after contrast triplet/cluster)) |

## Skipped (allowlist)

| Reason | Count |
|---|---:|
| EMOM/Tabata/AMRAP timed protocol | 9 |
| minimal-rest sentinel (mobility/flow) | 3 |
| empty-format (warmup or prep block) | 3 |
| walk-back sprint recovery | 1 |

## Sample PASS rows (first 10)

| Session | # | Block name | Intent | Parsed | KB |
|---|--:|---|---|---|---|
| `FULL_BODY_IN_SEASON_BACK_THREE_V1` | 1 | Lower Power Pair | power_contrast | 180-180s | 120-180s |
| `FULL_BODY_IN_SEASON_BACK_THREE_V1` | 2 | Upper Push/Pull Strength | hypertrophy | 90-120s | 60-120s |
| `FULL_BODY_IN_SEASON_BACK_THREE_V1` | 3 | Posterior Chain / Rotation Support | hypertrophy | 75-90s | 60-120s |
| `FULL_BODY_IN_SEASON_BACK_THREE_V1` | 4 | Lower Leg / Groin Support | prehab | 45-60s | 30-90s |
| `FULL_BODY_IN_SEASON_BACK_THREE_V1` | 5 | Arm Pump / Reward Block | reward | 45-60s | 30-90s |
| `FULL_BODY_IN_SEASON_FRONT_ROW_V1` | 1 | Lower Power Pair | power_contrast | 180-180s | 120-180s |
| `FULL_BODY_IN_SEASON_FRONT_ROW_V1` | 2 | Upper Push/Pull Strength | hypertrophy | 90-120s | 60-120s |
| `FULL_BODY_IN_SEASON_FRONT_ROW_V1` | 3 | Posterior Chain / Trunk Support | core | 75-90s | 30-90s |
| `FULL_BODY_IN_SEASON_FRONT_ROW_V1` | 4 | Front Row Support | hypertrophy | 45-60s | 60-120s |
| `FULL_BODY_IN_SEASON_FRONT_ROW_V1` | 5 | Arm Pump / Reward Block | reward | 45-60s | 30-90s |
