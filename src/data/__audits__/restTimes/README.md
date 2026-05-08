# Rest times audit (B2)

Verifies that every block in `MOTHER_SESSIONS` has a rest time consistent
with KB-recommended ranges for its inferred training intent.

Shipped 2026-05-08 (Decision #48). See `docs/release-v1-plan.md` for the
audit-trail row and `docs/b2-rest-times-audit-plan.md` for the original
discovery doc.

## Pipeline

```
Block.format (free text)  ──▶  parseRestSeconds  ──▶  RestRange { kind, min, max }
Block.name + format       ──▶  inferBlockIntent  ──▶  Intent (11 categories)
                                       │
                                       ▼
                              auditBlock(parse, intent, kbRanges)
                                       │
                                       ▼
                            AuditRow { status, reason, ... }
                                       │
                          ┌────────────┴────────────┐
                          ▼                         ▼
              CLI: scripts/auditRestTimes.mjs   restTimes.contract.test.ts
                  → docs/b2-rest-times-              (CI gate)
                    findings.{md,csv}
```

## Convention canonique (Décision #40 v2)

`Block.format` encodes one or more rest specs; the parser returns the
**highest-level** one because that maps to the canonical "rest between
full executions of the round/scheme".

Qualifier precedence (lower number = higher priority):

| # | Qualifier example | Meaning |
|---|---|---|
| 1 | `between rounds`, `after each round`, `after the pair`, `after the triplet` | Inter-round rest (canonical `restSeconds`) |
| 2 | `between sets` | Force-style work-set rest |
| 3 | `between reps` | Sprint cluster / rep-by-rep rest |
| 4 | `between drills`, `between exercises` | Intra-round (rarely audited) |

Special kinds (audit `SKIP` allowlist):

- `EMOM`/`Tabata`/`AMRAP`/`for time` → timed protocol, rest implicit in interval
- `walk-back recovery` → sprint-specific, no chrono
- `minimal rest` / `move continuously` → mobility flow
- `""` (empty) → warm-up / prep block, no scheme

## KB ranges (authoritative)

| Intent | Range (s) | Tolerance | Source |
|---|---|---:|---|
| force | 180–300 | ±0 | strength-methods.md:218 |
| power_contrast | 120–180 | ±0 | Décision #40 v2 |
| dynamic | 60–90 | ±0 | strength-methods.md:245 |
| hypertrophy | 60–120 | ±0 | strength-methods.md:276 |
| dup_endurance | 60–90 | ±0 | periodization.md:122 |
| activation | 30–60 | ±15 | KB silent — soft |
| prehab | 30–90 | ±15 | KB silent (Décision #46) |
| core | 30–90 | ±15 | KB silent — soft |
| sprint | 60–180 | ±30 | KB silent — walk-back varies |
| reward | 30–90 | ±15 | KB silent — soft |
| conditioning | (skip) | — | Protocol-specific |

A block PASSes when `[parsedMin, parsedMax]` overlaps
`[kbMin − tolerance, kbMax + tolerance]`. Strict inclusion is **not**
required — `Block.format` typically encodes a range, not a single value.

## Heuristique d'intent — règles ordonnées

`inferBlockIntent` matches block name + format against 11 priority-ordered
rules. First match wins.

```
1.  conditioning   ←  format = EMOM/Tabata/AMRAP
2.  sprint         ←  name has sprint/acceleration/shuttle/cod
3.  power_contrast ←  name has contrast/cluster/neural pair/force+projection|power
4.  dynamic        ←  name has ballistic/throw/launch/pogo/medball
5.  activation     ←  name has warm-up/prep/ramp-up (NOT "primer" alone)
6.  prehab         ←  name has stability/groin/lower-leg/shoulder health/micro-dose
7.  core           ←  name has core/trunk/anti-rotation/carry/farmer/zercher
8.  reward         ←  name has reward/arm pump/confidence
9.  hypertrophy    ←  name has hypertrophy/strength pair|triplet/push|pull/support/primer/
                              main squat|hinge|press|pull/posterior chain
10. force          ←  narrow: name has "force max"/"max effort"/"heavy"/"1RM"/"5RM"
                            OR format `full rest 3-5 min` / `3-4 min rest`
11. dup_endurance  ←  name has "dup endurance" / "in-season endurance" (placeholder)
12. unknown        ←  fallback (FAIL in audit)
```

**Why hypertrophy is matched before force**: blocks named "Strength Pair"
or "Hypertrophy" with `4 work sets, 2 min rest` would otherwise fall to
force via the work-sets format hint, even though the rest (60–120s) is
RE/hypertrophy method per KB. Putting hypertrophy first encodes the
training intent over the structural shape.

See Phase C decisions in `docs/b2-rest-times-corrections.md` §2 for the
"why" behind each priority choice. They're locked in by
`inferBlockIntent.test.ts`.

## Running the audit

```bash
# Generate report (no CI gate)
node scripts/auditRestTimes.mjs --stdout

# Strict contract test (CI gate, fails on any FAIL_RANGE/INTENT/PARSE)
npx vitest run src/data/__audits__/restTimes/__tests__/restTimes.contract.test.ts
```

## Adding a new mother session

1. Write the MD under `docs/training/mother-sessions/<cycle>/`.
2. Run `node scripts/generateMotherSessionsDataset.mjs`.
3. Run the contract test. If a block fails:
   - **FAIL_INTENT_UNKNOWN** → block name uses a new pattern. Add a rule
     to `inferBlockIntent.ts` and a unit test to `inferBlockIntent.test.ts`.
   - **FAIL_RANGE** → either rename the block (if the data is right) or
     adjust rest in the MD (if the name is right). Document the decision
     in `docs/b2-rest-times-corrections.md`.
   - **FAIL_PARSE** → unrecognized format string. Extend
     `parseRestSeconds.ts` and add a unit test.
