# Cursor Rules — RugbyPrep V2 (Non-negotiable)

You are working on RugbyPrep V2, a rugby strength & conditioning program generator.

## Absolute constraints
- DO NOT modify data contract files unless explicitly asked:
  - src/data/exercises.v1.json
  - src/data/blocks.v1.json
  - src/data/sessionRecipes.v1.ts (or sessionRecipes.ts)
- DO NOT change exerciseId/blockId strings. If needed, create v2 files + a migration plan.
- DO NOT add AI generation of programs in MVP. Engine must remain deterministic.
- DO NOT add Redux or backend/auth in MVP unless explicitly asked.

## Architecture boundaries
- src/services/program/** contains ONLY pure functions (deterministic, no side effects).
- src/data/** contains ONLY static data + simple loaders (no business logic).
- src/pages/** and src/components/** contain UI only (no generation rules).
- src/types/** contains shared TypeScript types.

## Domain model invariants
- Atomic unit is a TRAINING BLOCK, not individual exercises.
- A session = ordered blocks (Bloc A/B/C…).
- Blocks are hand-written and versioned W1–W4.
- Generation assembles blocks; it must never invent new blocks/exercises.

## Safety rules
- Filter blocks by:
  - equipment compatibility
  - contraindications vs injuries
- Avoid duplicate exerciseId in a session (except activation/prehab).
- Limit session length (maxBlocks <= 5).
- Allow at most ONE finisher among {neck, core, carry}.

## Working style
- Always propose a SMALL, atomic change with acceptance criteria.
- Prefer minimal diffs.
- Keep code readable; no over-engineering.
- Add brief comments only where it clarifies a rule/decision.

## Deload & Fatigue Management (Research-backed)
- Prefer a simple 3-4 + 1 rhythm: build weeks then one DELOAD week.
- DELOAD keeps session structure, but reduces stress (volume down ~30-40%, RER +2, shorter EMOM).
- If user self-reports fatigue (sleep/soreness/performance/motivation down), recommend DELOAD.
- For neural work, always enforce: quality > fatigue.
