# Definition of Done — MVP

A change is "Done" only if:
- npm run lint passes
- npm run build passes
- Engine output remains deterministic
- Program page renders on mobile width
- No contract JSON changed unless explicitly intended
- Session rules still hold:
  - maxBlocks <= 5
  - exactly 1 activation
  - at least 1 main block (contrast or force)
  - maxFinishers <= 1
  - no duplicate exerciseId outside activation/prehab
