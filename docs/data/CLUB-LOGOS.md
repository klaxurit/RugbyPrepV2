# Club logos (hybrid source)

## Sources
- FFR IDs mapping: `src/data/clubFfrIds.json`
- Automatic lookup (Wikidata/Wikimedia): `src/data/clubLogos.wikidata.json`
- Manual overrides (priority): `src/data/clubLogos.manual.json`

## Priority order in app
1. Manual logo URL by `clubCode`
2. FFR logo URL generated from `clubCode -> ffrClubId`
3. Auto logo URL if `status = found`
4. Monogram fallback (club initials)

## Update auto dataset
```bash
LIMIT=200 npm run fetch:club-logos
```

## Add manual logo
### Recommended local workflow (stable)
1. Put the image file in `public/club-logos/`
2. Use a stable filename, for example:
   - `good-luck-rugby-971.jpg`
   - `as-ampountra-club-de-chiconi-976.png`
3. Map the club code to the local public path in `src/data/clubLogos.manual.json`

Example:
```json
{
  "6758W": "/club-logos/as-ampountra-club-de-chiconi-976.png"
}
```

### Remote URL workflow (works, but less stable)
You can also use a direct image URL if the club logo is hosted elsewhere.

Example:
```json
{
  "7489A": "https://.../logo.png"
}
```

Use uppercase club codes.

Avoid temporary/signed URLs when possible (they expire).

### Validate manual mappings
Basic validation (codes + local file existence):
```bash
npm run validate:club-logos:manual
```

Validation with remote URL checks (`Content-Type: image/*`):
```bash
npm run validate:club-logos:manual:remote
```

## Add FFR logo mapping
Edit `src/data/clubFfrIds.json`:
```json
{
  "5082Z": 1285
}
```

## Files created for manual logos
- `public/club-logos/` local club logo assets (served by Vite as `/club-logos/...`)
- `src/data/clubLogos.manual.json` manual overrides
- `scripts/validateClubLogosManual.mjs` validation script
