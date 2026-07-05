# B2 — Rest times audit findings (Phase B dry-run)

**Generated:** 2026-07-05T09:58:56.317Z
**Total blocks:** 249

## Status breakdown

| Status | Count |
|---|---:|
| PASS | 224 |
| SKIP | 25 |
| FAIL_RANGE | 0 |
| FAIL_INTENT_UNKNOWN | 0 |
| FAIL_PARSE | 0 |

## Per-intent breakdown

| Intent | Total | Pass | Fail | Skip |
|---|---:|---:|---:|---:|
| power_contrast | 56 | 56 | 0 | 0 |
| hypertrophy | 110 | 110 | 0 | 0 |
| prehab | 27 | 21 | 0 | 6 |
| reward | 6 | 6 | 0 | 0 |
| core | 19 | 15 | 0 | 4 |
| dynamic | 7 | 7 | 0 | 0 |
| activation | 3 | 2 | 0 | 1 |
| conditioning | 13 | 0 | 0 | 13 |
| sprint | 8 | 7 | 0 | 1 |

## Skipped (allowlist)

| Reason | Count |
|---|---:|
| EMOM/Tabata/AMRAP timed protocol | 13 |
| empty-format (warmup or prep block) | 6 |
| minimal-rest sentinel (mobility/flow) | 5 |
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
