# AI Task Playbook (Cursor/Codex)

## Always provide
- Goal: one sentence
- Constraints: what must NOT change
- Files allowed to change
- Acceptance criteria (how to verify)
- Keep tasks small (1 feature / 1 module / 1 UI change)

## Good task example
"Add a Program page that renders one generated session. Do not modify engine or JSON contracts. Must compile and lint."

## Bad task example
"Refactor the app architecture" (too vague, high risk)

## Review checklist before accepting AI changes
- Does it touch contract JSON files? If yes, reject unless intended.
- Does it add randomness or AI generation? Reject for MVP.
- Is the diff minimal? If no, ask for a smaller patch.
- Does it keep boundaries (engine pure, UI thin)? If no, reject.
