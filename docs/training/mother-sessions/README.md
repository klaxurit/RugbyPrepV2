# Mother Sessions — Source & Regeneration

## Current State

The generated dataset `src/data/motherSessions.generated.ts` contains sessions from multiple cycles. Not all cycles have markdown source files yet:

| Cycle | Markdown source | Count | Status |
|-------|----------------|-------|--------|
| Off-season | `off-season/*.md` | 17 | **Source of truth** |
| Pre-season | — | ~9 | Inline in generated.ts |
| In-season | — | ~13 | Inline in generated.ts |

## Safe Regeneration Workflow

### For off-season changes

Edit the markdown files in `docs/training/mother-sessions/off-season/`, then run:

```bash
node scripts/mergeOffSeasonIntoDataset.mjs
```

This script:
- Parses all off-season `.md` files
- **Replaces** existing off-season sessions in place with the parsed version
- **Appends** genuinely new off-season sessions
- **Preserves** all non-off-season sessions untouched
- Prints a summary (replaced / added / unchanged / total)

### For pre-season or in-season changes

Currently, edit `src/data/motherSessions.generated.ts` directly. This is temporary until those cycles are migrated to markdown.

### Full regeneration (NOT safe yet)

```bash
# ⚠ DO NOT run this until ALL cycles have markdown sources
node scripts/generateMotherSessionsDataset.mjs
```

This script **overwrites the entire generated file** with only the sessions found in markdown. Running it now would delete all pre-season and in-season sessions.

## Migration Plan

To complete the migration to a single-source-of-truth workflow:
1. Export pre-season sessions to `docs/training/mother-sessions/pre-season/*.md`
2. Export in-season sessions to `docs/training/mother-sessions/in-season/*.md`
3. Once all cycles have markdown sources, `generateMotherSessionsDataset.mjs` becomes safe to use as the sole generation command

## Markdown Format

See the fixture in `src/services/motherSession/__tests__/motherSessionFixtures.ts` for the exact format. Key structure:

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
