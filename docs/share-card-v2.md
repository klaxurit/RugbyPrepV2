# Carte de partage de fin de séance — v2

Contexte de passation pour reprendre le travail (PR #9, branche `feat/share-card-club-identity`).

## Objectif

Une image Story 1080×1920 que les joueurs amateurs ont envie de poster (Instagram, groupe WhatsApp du club) : premium, identité rugby forte, ton brut et sérieux, jamais gadget. Maquettes et règles : canevas Claude Design « RugbyForge — Carte de fin de séance » (planche « Règles v2 »).

## Fichiers

Tout est dans `src/services/share/` :

| Fichier | Rôle |
| --- | --- |
| `selectShareHero.ts` | Choix du héros par priorité, chips (3 max), nettoyage du nom de l'adversaire, prochain match (`findShareNextMatch`). Fonctions pures. |
| `resolveShareCardFormat.ts` | Story vs carré selon le héros (+ préférence UI). |
| `prepareSharePhoto.ts` | Photo locale → object URL + dims + warning côté court &lt; 1080. |
| `buildShareCardData.ts` | Identité : prénom, poste, club (nom affiché, initiales), logo stocké, niveau FFR (R1–R3, F1–F3, N2), segments du pied. Fonctions pures. |
| `buildSessionShareCardHtml.ts` | Modèle de la carte + gabarit HTML (avec ou sans photo). |
| `sessionShareCard.css` | Styles de la carte (positions fixes, 1080×1920). |
| `generateSessionShareImage.ts` | Montage hors écran + rasterisation PNG (`html-to-image`), police Inter embarquée en data URL, logo club ou écusson de secours, métadonnées analytics. |
| `shareClubCrest.ts` | Écusson de secours : pastille ronde neutre aux initiales (jamais une forme de blason). |
| `shareSessionResult.ts` | Partage (share sheet OS) ou téléchargement ; renvoie `meta` pour PostHog. |
| `sessionShareTypes.ts` | `SessionSharePayload` et types associés. |

Le payload est construit dans `src/pages/SessionDetailPage.tsx`. La feuille de partage (aperçu, toggle « Afficher mon club », événements PostHog) est `src/components/session/SessionShareSheet.tsx`.

## Règles produit (à ne pas casser)

### Un seul héros, choisi par priorité

1. **Record battu** (`prs[0]`) : exercice + charge + écart avec l'ancien record (« +5 kg / vs 75 kg »). Sans ancien record : « 1er record ».
2. **Semaine de match** : match à J-1…J-7 (calendrier, matchs masqués exclus). J-X + adversaire nettoyé (« Rugby Club Hérouvillais » → « Hérouvillais ») + DOM./EXT. + frise J-7 → poteaux.
3. **Progression** (`payload.progression`) : charge ≥ +5 % sur 4 semaines, sinon série ≥ 3 semaines complètes d'affilée.
4. **Par défaut** : nom de la séance + durée + focus (dernier segment du libellé, ex. « Bas du corps · Explosivité »).

Si record et match tombent la même semaine, le record reste le héros par défaut et « J-X · Adversaire » remplace la date dans la chip en haut à droite. La feuille de partage propose un toggle **Exercice / Semaine de match** (`heroPreference`) quand les deux sont possibles.

### Le reste

- Le **tonnage n'est jamais le héros** ; il peut être une chip (« 5,6 t soulevées », premium uniquement).
- **3 chips maximum**, jamais la donnée déjà dans le héros. Ordre : focus → durée → régularité → tonnage → sets.
- **Un seul indicateur de régularité** : « N sem. d'affilée » (≥ 2) › « Semaine n/n » (semaine complète) › « Séance i/n ».
- **Pas de point final** dans les titres.
- **Safe zones Instagram** : rien d'important dans les 250 px du haut et du bas. En-tête à y 272, bloc texte qui s'arrête à y 1640.
- **Poste** en chip en haut à gauche uniquement (plus dans le pied).
- **Pied** : « Prénom · [écusson] Club · R2 » + wordmark, toujours sur une ligne. Si la place manque : niveau abrégé, puis ellipse sur le nom du club.
- **Aucune donnée inventée** : un champ absent est omis, séparateurs compris (jamais « · · »). Pas de niveau par défaut, pas de blason généré.
- **Logo club** : uniquement les URL déjà stockées (`getClubLogoUrl`), affiché dans un **rond**. Échec CORS ou absence → écusson de secours aux initiales (déjà circulaire).
- **Tampon RECORD** (Claude Design, 220 px story / 170 px carré) : uniquement si `prs.length > 0` — `— PERSO —` / RECORD / date `DD · MM · YY`. Hors flux, à cheval sur la coupe (déborde sur la photo + le panneau), sans padding ajouté au bloc bas.
- **Toggle « Afficher mon club »** : activé par défaut, mémorisé dans `localStorage` (`rf.share.showClub`). Désactivé → ni logo, ni club, ni niveau.
- **Contraste** : texte sur panneau bordeaux ≥ 4,5:1 même sur une photo blanche (panneau à 85 %).

### Géométrie

**Story 1080×1920** (match / progression, ou préférence UI) :
- Marges latérales 72 px. Coupe diagonale : y 1212 à gauche → 1092 à droite (photo sur ~60 % de la hauteur), liseré crème 6 px.
- Safe zones Instagram : en-tête y 272, contenu au-dessus de y 1640.

**Carré 1080×1080** (auto pour record / séance) : même vocabulaire, panneau depuis ~y 520, contenu ancré sous la coupe (`top: 610`), typo et tampon réduits (`.is-square`).

- Avec photo : photo naturelle, voile haut, dégradé bordeaux, panneau 85 % sous la coupe.
- Sans photo : fond crème, trame de terrain, poteaux en filigrane, panneau bordeaux plein.

## Analytics (PostHog)

- `session_share_clicked` : `club_shown`.
- `session_shared` : `club_shown`, `logo_source` (`"ffr"` | `"fallback"` | `"none"`). Note : `"ffr"` couvre aussi les logos de la liste manuelle et de Wikidata déjà stockés dans le dépôt.

## Reste à faire

1. ~~**Calculer `payload.progression`**~~ — `computeShareProgression.ts` (load vs S−4, sinon streak gamification), branché dans `SessionDetailPage.tsx`.
2. ~~**Photo de séance**~~ — `prepareSharePhoto.ts` + UI caméra/galerie dans `SessionShareSheet` (`photoUrl`, warning non bloquant si côté court &lt; 1080, changer/retirer). Point focal CSS inchangé (`object-position: 50% 35%`).
3. ~~**Format carré 1:1**~~ — `resolveShareCardFormat.ts` (auto square pour record/session), CSS `.is-square`, toggle UI si héros éligible, export 1080×1080.
4. ~~**Nom court du club**~~ — API prête (`clubShortName` prioritaire dans `buildShareCardData`) ; **aucune source produit** dans le repo pour l’instant (pas d’heuristique inventée).

## Vérifier

```
npm run check
```

Tests ciblés : `npx vitest run src/services/share`.
