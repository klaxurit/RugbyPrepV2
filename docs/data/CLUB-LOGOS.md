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
Edit `src/data/clubLogos.manual.json`:
```json
{
  "7489A": "https://.../logo.png"
}
```

Use uppercase club codes.

## Add FFR logo mapping
Edit `src/data/clubFfrIds.json`:
```json
{
  "5082Z": 1285
}
```
