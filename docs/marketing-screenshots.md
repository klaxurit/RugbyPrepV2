# App screenshots propres

Le script `screenshots:app` prend des captures propres avec `playwright-core` et le Chrome local.

## Cas simple

```bash
npm run screenshots:app -- --route /landing --output-dir video/public/assets/screens
```

## Capturer une route avec le viewport exact du telephone

```bash
npm run screenshots:app -- --base-url http://127.0.0.1:5173 --route /calendar
```

Par defaut, le script capture le viewport visible.
Cela evite le bug des full-page screenshots ou un footer fixe se retrouve au milieu.

## Capturer seulement le contenu principal

```bash
npm run screenshots:app -- --route /week --selector main
```

Pratique si tu veux exclure le `BottomNav` ou les elements fixes.

## Routes protegees

Premier passage, en visible, avec un profil persistant:

```bash
npm run screenshots:app -- \
  --route /week \
  --headed \
  --manual \
  --user-data-dir tmp/screenshot-profile
```

Tu te connectes dans la fenetre Chrome, tu navigues ou ajustes l'etat si besoin, puis tu appuies sur Entree dans le terminal pour capturer.

Ensuite, tu peux reutiliser la meme session en headless:

```bash
npm run screenshots:app -- \
  --route /week \
  --route /calendar \
  --user-data-dir tmp/screenshot-profile \
  --output-dir video/public/assets/screens
```

## Aides utiles

- `--selector main` : capture un element cible au lieu de la page complete
- `--full-page` : active une vraie capture pleine hauteur si tu en as vraiment besoin
- `--ready-selector '.mon-selecteur'` : attend un composant specifique avant capture
- `--hide '.badge,.tooltip'` : masque des elements avant screenshot
- `--width 430 --height 932` : change le viewport si besoin
