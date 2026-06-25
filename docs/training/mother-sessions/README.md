# Mother Sessions — Source & Regeneration

## Single source of truth

All mother sessions live as Markdown source files under `docs/training/mother-sessions/<cycle>/`. The TypeScript dataset `src/data/motherSessions.generated.ts` is generated from these MDs and **must not be edited by hand**.

| Cycle | Markdown source | Count |
|-------|-----------------|------:|
| Off-season | `off-season/*.md` | 19 |
| Pre-season | `pre-season/*.md` | 14 |
| In-season | `in-season/*.md` | 8 |
| **Total** | | **41** |

Migration to MD-as-single-source-of-truth was completed during B2 Phase B' (2026-05-08).

## Regeneration

After editing any `.md`, run:

```bash
node scripts/generateMotherSessionsDataset.mjs
```

This:
- Walks all `.md` files under `docs/training/mother-sessions/<cycle>/`
- Parses each via `src/services/motherSession/parseMotherSession.ts`
- Emits a fresh `src/data/motherSessions.generated.ts` with sessions sorted alphabetically by `metadata.id`
- Sessions are also indexed in `MOTHER_SESSIONS_BY_ID` for O(1) lookup

## Inverse extraction (TS → MD)

Useful when bootstrapping a new MD from existing inline data, or when validating the round-trip:

```bash
node scripts/extractMotherSessionsToMd.mjs                      # all cycles
node scripts/extractMotherSessionsToMd.mjs --cycle off_season   # filter
```

The MD format produced is the same one parsed by `parseMotherSession`. Round-trip is loss-less (verified during Phase B' migration).

## Markdown format

```markdown
# SESSION_ID

- `status`: validated
- `version`: V1
- `cycle`: off_season
- `session_type`: lower
- `target_level`: performance
- `target_position_group`: front_row + back_three (common base)
- `equipment`: full_gym
- `target_duration`: 50-60 min

## Goal
- ...

## Session Identity
- ...

## Warm-Up
### Recommended warm-up
- `exercise name` `prescription`
### Notes
- ...

## Visible Blocks
### Block 1 - Block Name
- Format: `4 work sets`, `2 min` rest
- Exercise A: `Exercise Name` `4x8`
- Coaching notes:
  - ...

## Progression Rules
## Position Accent
## Injury Substitutions
## Coaching Warnings
## Source References
```

See `src/services/motherSession/__tests__/motherSessionFixtures.ts` for a full reference.
