# Mother Sessions

This folder is the source of truth for coach-authored "mother sessions".

Goal:
- author real rugby-specific sessions before integrating them into the app
- keep session intent, structure, and substitutions readable by humans
- avoid premature schema lock-in while the authoring model is still evolving

Current approach:
- author in Markdown first
- stabilize structure across several sessions
- later convert to YAML/JSON only when the format is mature enough

For now, no major refactor is required.

Recommended integration path:
1. Author 8-12 strong in-season sessions in this folder.
2. Stabilize the authoring template and substitution rules.
3. Add a thin transformation layer from docs -> app data format.
4. Only then adapt the program engine to select mother sessions and apply:
   - level modifiers
   - position accents
   - injury substitutions
   - progression rules

Naming convention:
- `UPPER_IN_SEASON_FRONT_ROW_V1.md`
- `UPPER_IN_SEASON_BACK_THREE_V1.md`
- `LOWER_IN_SEASON_FRONT_ROW_V1.md`
- `FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1.md`

Authoring rules:
- in-season sessions should stay short, readable, and low-noise
- 1 contrast pair by default
- visible blocks should be limited to the work that matters
- warm-up can be stored as a collapsible recommendation, not a mandatory visible block
- injury management keeps the same session skeleton whenever possible
- position differences should be subtle but real, not cosmetic

Status legend:
- `draft`: being authored
- `validated`: coach-approved as a mother session
- `ready_for_mapping`: stable enough to map into app data
