# Brief illustrations — gamification RugbyForge

Document destiné à un **graphiste** (second temps). Objectif : remplacer les
signaux génériques (émoji, médaille Lucide unique) par un **langage iconique
rugby / vestiaire**, cohérent avec la marque paper/forge (#7B0D1E, crème
#F5F2EE, accents pro/gold).

Ce brief ne prescrit pas le style exact (linogravure, flat, glyph) : il fixe
**quoi**, **pourquoi**, **formats**, et **contraintes produit**. Le scoring
récompense la **conformité au plan**, jamais le volume — les pictos doivent
raconter ça.

Références produit :
- [`gamification-competition-plan.md`](./gamification-competition-plan.md)
- [`gamification-prod-launch.md`](./gamification-prod-launch.md)

---

## 1. Contexte & ton

| À viser | À éviter |
|---|---|
| Vestiaire, terrain, staff, cadence | E-sport néon, gemmes type Duolingo |
| Rigueur, baisse de charge volontaire | Flammes « grind » / trophées volume |
| Lisible à 16–24 px | Détail photo-réaliste |
| FR + EN (pas de texte dans l’icône) | Lettres, scores, drapeaux clubs |

**Univers** : rugby à XV amateur / pro club français. Motifs utiles : ballon
ovale, poteaux, brassard capitaine, casque (optionnel, pas obligatoire),
tableau de match, sifflet, chasuble, crampons, glace/récup, calendrier de
semaine, flamme de cadence (stylisée, pas emoji).

---

## 2. Priorités de livraison

### Lot A — Soft launch « plus pro » (priorité haute)

Sans ce lot, on reste sur Lucide / 🔥💤.

| # | Asset | Usage | Taille cible |
|---|---|---|---|
| A1 | Forme **en rythme** (remplace 🔥) | Rang classement, à côté du pseudo | 24×24, 48×48 |
| A2 | Forme **en pause** (remplace 💤) | Idem, athlète inactif ≥ 7 j | 24×24, 48×48 |
| A3–A6 | **4 familles de badges** (glyphs maîtres) | Strip badges Groupe + toast unlock | 64×64, 128×128 |
| A7–A11 | **5 crests de ligue** | Pill / header board | 48×48, 96×96 |

### Lot B — Polish empty states & célébration (priorité moyenne)

| # | Asset | Usage |
|---|---|---|
| B1 | Empty **board solo** | « Personne d’autre du club… » |
| B2 | Empty **ligue lundi** | « Ta ligue est constituée lundi… » |
| B3 | Empty **opt-in private** | Illustration douce à côté du picker |
| B4 | Unlock badge (spot) | Confetti / flash léger optionnel — ou picto seul |
| B5 | Promotion de palier | Nudge « montée en Fédérale » |

### Lot C — Nice to have (après observation)

| # | Asset | Usage |
|---|---|---|
| C1–C5 | 5 niveaux athlète (Espoir → Légende) | Accueil / identité |
| C6 | Kudos (variante brand du cœur) | Bouton kudos board |
| C7 | Duel (face-à-face) | Section duels |
| C8 | Défi club (bouclier / chasuble collective) | ClubChallengeCard |

---

## 3. Détail Lot A

### A1 / A2 — Indices de forme (classement)

**Règle produit** : ce n’est **pas** un score de santé. C’est « a-t-il
enchaîné des séances récemment ? » (jours depuis dernière séance loguée).

| Cue | Sens | Direction visuelle |
|---|---|---|
| `hot` | Actif ≤ 2 j | Cadence / ballon en mouvement / crampon planté / flamme **stylisée brand** (forme géométrique, pas 🔥 Unicode) |
| `dormant` | Inactif ≥ 7 j | Pause assumée : casque sur le banc, chasuble pliée, sablier soft — **pas** ridicule / pas « loser » |
| (neutre) | 3–6 j | Pas d’icône |

Accessibilité : l’UI garde un `aria-label` texte ; l’icône est décorative.

### A3–A6 — Familles de badges (glyphs maîtres)

Les **12 badges** se déclinent ensuite par le graphiste (variante + chiffre
ou densification), ou on compose en UI le glyph maître + label. Préférer
**4 maîtres** + déclinaisons légères plutôt que 12 dessins totalement
distincts (coût / cohérence).

| Famille | Badge IDs | Idée visuelle rugby |
|---|---|---|
| **Plan tenu** | `plan_week_1`, `_4`, `_12`, `_26` | Calendrier de semaine / tableau d’entraînement coché / jalons de saison |
| **Streak** | `streak_4`, `_8`, `_16` | Chaîne de semaines / enchaînement de séances / brassard de régularité |
| **Deload** | `deload_1`, `deload_3` | Récup volontaire : glace, repos actif, « semaine plus légère » — **positif**, pas paresse |
| **Niveau** | `level_cadre`, `_capitaine`, `_legende` | Brassard, étoile de cadre, « Légende » sobre (pas cartoon) |

Labels FR déjà en prod (ne pas les changer sans produit) :

| id | Label FR |
|---|---|
| `plan_week_1` | Plan tenu |
| `plan_week_4` | Quatre sur quatre |
| `plan_week_12` | Bloc complet |
| `plan_week_26` | Saison tenue |
| `streak_4` | Régulier |
| `streak_8` | Installé |
| `streak_16` | Inarrêtable |
| `deload_1` | Décharge assumée |
| `deload_3` | Gestion de charge |
| `level_cadre` | Cadre |
| `level_capitaine` | Capitaine |
| `level_legende` | Légende |

### A7–A11 — Crests de ligue (divisions)

Échelle hebdo (promo / relégation lundi) :

| Tier | FR | Suggestion |
|---|---|---|
| `reserve` | Réserve | Écusson simple, 1 chevron |
| `espoirs` | Espoirs | Écusson + jeune plant / 2 chevrons |
| `premiere` | Première | Écusson club stylisé |
| `federale` | Fédérale | Écusson + étoile |
| `elite` | Élite | Écusson + laurier discret |

Doivent rester **lisibles en monochrome** (pill bordeaux sur fond crème).

---

## 4. Spécifications techniques

| Livrable | Spec |
|---|---|
| Format | SVG (préféré) + PNG export 1×/2×/3× si besoin raster |
| Grille | ViewBox 24×24 (UI) et 128×128 (badges / empty) |
| Couleur | 1. Monochrome `currentColor` 2. Variante 2 tons brand (bordeaux + crème) |
| Fond | Transparent ; pas de cercle imposé (l’UI pose le container) |
| Trait | Stroke ≥ 1.5 à 24 px ; coins arrondis cohérents brand |
| Naming | `rf-gami-{slug}.svg` ex. `rf-gami-form-hot.svg`, `rf-gami-tier-elite.svg`, `rf-gami-badge-plan.svg` |
| Dossier cible repo | `src/assets/gamification/` (à créer à l’intégration) |

**Dark / paper** : l’app a thèmes forge/paper ; privilégier masque SVG /
`currentColor` pour que le chrome colore.

**Pas d’emoji dans les fichiers livrés.**

---

## 5. Empty states (Lot B) — consignes

Compositions **simples**, une idée, pas de collage stats.

| ID | Mood | Élément central |
|---|---|---|
| B1 solo | Invitation, pas solitude triste | Un joueur près d’un tableau encore vide / chasuble en attente |
| B2 lundi | Patience / calendrier | Semaine qui bascule vers le lundi |
| B3 private | Contrôle / confiance | Cadenas soft + vestiaire fermé gentiment |

Ratio utile : illustration ~160–200 px de large dans une colonne mobile 390 px.
Pas de texte dans l’image (i18n).

---

## 6. Références concurrentes (inspiration, pas copie)

| App | Ce qu’on regarde | Ce qu’on ne copie pas |
|---|---|---|
| Duolingo | Crests de ligue très lisibles, reset hebdo | Métaux / gemmes / Duo |
| Strava | Badges trophée case distincts par type | Couronnes KOM « plus vite » |
| Apple Fitness | Rings / clean monochrome | Esthétique tech neutre |
| FIFA Ultimate / clubs | Écussons de division | Overload gaming |

Notre ancre : **vestiaire rugby français**, paper UI RugbyForge déjà en prod.

---

## 7. Process proposé

1. Moodboard 3 directions (glyph stroke / écusson plat / linogravure soft) —
   **1 page**.
2. Validation produit sur **A1–A2 + 1 crest + 1 famille badge**.
3. Production Lot A complet.
4. Intégration dev (`Icon` / imports SVG) — remplacer `athleteFormCueEmoji`
   et le `Medal` unique de `RigorBadgesStrip`.
5. Lot B après soft launch metrics.

**Estimation indicative** : Lot A ≈ 11–15 assets (avec déclinaisons badges) ;
Lot B ≈ 5 ; Lot C optionnel.

---

## 8. Checklist intégration (dev, plus tard)

- [ ] Brancher A1/A2 dans `resolveAthleteFormCue` / `LeagueBoard` (plus d’emoji)
- [ ] `badgeId` → asset dans `RigorBadgesStrip` (+ toast unlock)
- [ ] `leagueTier` → crest sur `SquadPage` + `LeagueBoard`
- [ ] Empty states B1–B3 sur `SquadPage`
- [ ] Tests : assertions texte / `data-testid`, pas sur le caractère 🔥

---

## 9. Contacts / questions ouvertes pour le graphiste

1. Préférence stroke monoline vs écusson plein ?
2. Faut-il un **mascotte** récurrente (hors scope actuel) ou uniquement des
   glyphs système ?
3. Les logos clubs réels restent fournis par les clubs — ne pas les
   redessiner dans ce brief.
