# RugbyPrep V2 — Project Rules (Contract)

This file defines non-negotiable rules for contributors and AI tools (Cursor/Codex).
If a change conflicts with these rules, the change must be rejected or redesigned.

## 1) Product scope (MVP)
- MVP generates **rugby-oriented strength training** sessions using **predefined blocks**.
- No AI generation of workouts in MVP.
- No long-term planning logic beyond **W1–W4 versions** (mesocycle) in MVP.

## 2) Core domain model
- The atomic unit of programming is a **Training Block**.
- A session is an **ordered list of blocks**.
- A block is a **hand-written, versioned** set of exercises (W1–W4).
- The engine must never generate random exercises outside the block library.

## 3) Data contracts are immutable
The following files are **contracts**. They must not be changed casually:
- `src/data/exercises.v1.json`
- `src/data/blocks.v1.json`
- `src/data/sessionRecipes.v1.ts` (or `sessionRecipes.ts`)

Rules:
- Do not rename `exerciseId` or `blockId` without a migration plan.
- If a change is needed, create a new version file (e.g. `blocks.v2.json`) and a migration script.
- No “auto-fixes” by AI tools on these files.

## 4) Deterministic generation only (MVP)
- The program generator must be deterministic: same inputs => same outputs.
- No randomness unless explicitly introduced via a stable seed (not required for MVP).
- The engine must be implemented as **pure functions** (no side effects).

## 5) Safety-first filtering
- Blocks must be filtered out when they conflict with the user profile:
  - equipment mismatch
  - contraindications intersect with injuries
- If a required intent cannot be satisfied, the generator must return:
  - clear warnings
  - and either a safe fallback or an incomplete session marked as invalid (never invent).

## 6) No over-engineering
- No microservices.
- No complex abstractions.
- Prefer small, readable modules:
  - `selectEligibleBlocks`
  - `buildSessionFromRecipe`
  - `validateSession`
  - `buildWeekProgram`

## 7) TypeScript rules
- Strict typing: no `any`.
- Prefer exported types in `src/types/`.
- Prefer pure functions in `src/services/program/`.
- Keep data parsing/loading in `src/data/` only.

## 8) Folder ownership
- `src/data/` → static data and loaders only.
- `src/types/` → shared types only.
- `src/services/program/` → generation engine only (pure functions).
- `src/pages/` → screens only, no core business logic.
- `src/components/` → UI building blocks only.

## 9) UI rules (mobile-first, MVP)
- UI must display blocks clearly:
  - Block title
  - exercises with sets/reps/rest
  - coaching notes
- No performance tracking in MVP.
- No authentication in MVP.

## 10) AI tool usage rules (Cursor/Codex)
When using AI tools:
- Always give small, bounded tasks with acceptance criteria.
- Never ask the AI to “redesign the architecture”.
- Never allow AI to modify the data contract files without explicit intent.
- Prefer PR-like changes: small diffs, clear intent.

## 11) Versioning strategy
- `v1` files are the current source of truth.
- Future changes must create `v2` files instead of mutating `v1`.
- Keep backwards compatibility as long as possible.

## 12) Definition of Done (for MVP features)
A feature is done only if:
- Types compile with no errors
- Lint passes
- The engine returns deterministic output
- The UI renders the generated session on mobile width without breaking layout
