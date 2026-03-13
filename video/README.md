# RugbyForge promo video

Mini projet Remotion autonome pour produire des videos promo verticales a partir des assets de l'app.

## Commandes

```bash
npm install
npm run dev
npm run check
npm run render
```

## Fichiers a modifier

- `src/data/screens.json`: ordre des scenes, textes, couleurs, durees et assets
- `src/compositions/PromoVertical.tsx`: direction artistique, animations, layout
- `src/compositions/PhoneFrame.tsx`: rendu des screenshots dans le mockup mobile

## Assets

- `public/assets/screens/`: captures d'ecran promo
- `public/assets/branding/`: logo et branding

## Sortie

Le rendu MP4 est ecrit dans `out/rugbyforge-promo-v1.mp4`.
