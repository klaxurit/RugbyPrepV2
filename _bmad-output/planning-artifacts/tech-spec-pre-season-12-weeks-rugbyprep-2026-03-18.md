---
title: 'Architecture pré-saison 12 semaines — Mother Sessions S&C Rugby'
slug: 'pre-season-12-weeks-mother-sessions'
created: '2026-03-18'
status: 'validated'
source_of_truth: true
stepsCompleted: [1]
tech_stack: ['Markdown authoring', 'Mother Session Template']
files_to_modify:
  - docs/training/mother-sessions/ (nouveau dossier pre-season)
code_patterns:
  - 'Mother session = Markdown structuré (Goal, Identity, Warm-Up, Visible Blocks, Progression, Substitutions)'
  - 'Position accent = même squelette, exercices/volume/finisher différents'
  - 'Alternatives matrix = substitutions automatiques par equipment/injury'
  - 'Cycle field dans les métadonnées : pre_season (nouveau)'
test_patterns:
  - 'Validation manuelle par le coach : chaque session doit être défendable en 30s'
  - 'Pas de tests automatisés pour les mother sessions (authoring humain)'
---

# Tech-Spec: Architecture pré-saison 12 semaines — Mother Sessions S&C Rugby

**Created:** 2026-03-18

## Overview

### Problem Statement

L'application RugbyPrep couvre l'in-season (DUP, maintenance force/puissance) et l'off-season (hypertrophie, reconstruction). Mais la **pré-saison** — les 12 semaines cruciales avant la reprise collective — n'a aucune couverture structurée.

Un joueur qui entre dans cette fenêtre reçoit soit un programme off-season inadapté (trop de volume, pas assez de conversion), soit un programme in-season prématuré (trop peu de volume, pas de construction). La pré-saison est la période où un joueur rugby amateur peut réellement **construire** ses qualités physiques sans la contrainte des matchs.

### Solution

Concevoir l'architecture complète de la pré-saison 12 semaines, en s'appuyant sur :
1. Le visuel `pre-season-12week.png` (source directrice d'un vrai préparateur physique)
2. Le système de mother sessions déjà en place pour l'in-season
3. La KB scientifique existante (périodisation par blocs, effets résiduels, strength-methods)

Le livrable est un **plan d'architecture et un backlog d'authoring**, pas les séances elles-mêmes.

### Scope

**In Scope :**
- Architecture des 12 semaines (3 phases × 4 semaines)
- Types de séances mères à créer par phase
- Logique de progression inter-phases
- Différenciation progressive avants / arrières
- Intégration endurance / vitesse terrain dans l'architecture hebdomadaire
- Détection produit de la pré-saison (date de reprise → activation)
- Backlog d'authoring priorisé (plus petit lot pour démarrer)

**Out of Scope :**
- Rédaction détaillée des séances mères (authoring ultérieur, une par une)
- Séances endurance / vitesse terrain détaillées (mentionnées architecturalement)
- Niveaux starter / builder (performance + full_gym uniquement)
- Refacto moteur app
- Mapping app des mother sessions

## Context for Development

### Source directrice

Le fichier `pre-season-12week.png` provient d'un préparateur physique rugby réel. Son architecture est :

| Phase | Semaines | S&C salle | Endurance | Vitesse terrain |
|-------|----------|-----------|-----------|-----------------|
| **Force** | S1-S4 | 2-3-4x/sem selon profil-niveau | 2x/sem (dont 1 terrain rugby) | 1x terrain |
| **Force + Puissance** | S5-S8 | 2-3-4x/sem selon profil-niveau | 1-2x/sem (dont 1 terrain) | Optionnelle selon niveau |
| **Puissance** | S9-S12 | 2-3x/sem | 1x/sem (maintien qualité) | — |

Ce plan est la colonne vertébrale du spec. On le traduit dans notre système, on ne le réinvente pas.

### Système actuel de mother sessions (in-season)

| Type session | Durée | Blocs visibles | Usage |
|---|---|---|---|
| **Upper** | 42-50 min | 3 (contrast push, strength pair, position finisher) | Semaine standard |
| **Lower** | 42-52 min | 3 (contrast force-power, strength pair, position finisher) | Semaine standard |
| **Full Body** | 55-70 min | 4-5 (power pair, push/pull, posterior chain, position support, optionnel reward) | Semaine sans match |
| **Primer** | 25-40 min | 3-4 (neural pair, push primer, pull/trunk, optionnel confidence) | Semaine de match |

**Règles d'authoring validées :**
- 1 contrast pair par défaut
- Warm-up collapsible, pas un bloc visible obligatoire
- Position accent = même squelette, exercices/finisher différents
- Injury substitutions par session (shoulder, knee, low back)
- Progression rules par session

### Différences fondamentales in-season vs pré-saison

| Dimension | In-season | Pré-saison |
|---|---|---|
| Objectif | Maintien | Construction |
| Volume | Faible (match fatigue) | Modéré → élevé |
| Intensité | Élevée (maintien neural) | Progressive (modérée → élevée) |
| Périodisation | DUP (chaque séance = qualité différente) | **Blocs** (chaque phase = qualité dominante) |
| Match constraint | Forte (primer, recovery) | Aucune |
| Contrast sets | Maintien (1 par session) | Émergent S5+ → dominant S9+ |
| Volume de blocs | 3 blocs max | 3-4 blocs (volume de construction) |
| Session Primer | Oui (match week) | **Non** (pas de match) |

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `docs/training/Préparation Physique/pre-season-12week.png` | Source directrice — architecture 12 semaines |
| `docs/training/mother-sessions/README.md` | Conventions d'authoring mother sessions |
| `docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md` | Template d'authoring |
| `docs/training/mother-sessions/WEEKLY_TEMPLATES_IN_SEASON.md` | Architecture hebdomadaire in-season |
| `docs/training/mother-sessions/AUTOMATIC_ALTERNATIVES_MATRIX.md` | Matrice de substitutions exercices |
| `docs/training/mother-sessions/LOWER_IN_SEASON_FRONT_ROW_V1.md` | Exemple lower in-season (front row) |
| `docs/training/mother-sessions/LOWER_IN_SEASON_BACK_THREE_V1.md` | Exemple lower in-season (back three) |
| `docs/training/mother-sessions/UPPER_IN_SEASON_FRONT_ROW_V1.md` | Exemple upper in-season (front row) |
| `docs/training/mother-sessions/FULL_BODY_IN_SEASON_FRONT_ROW_V1.md` | Exemple full body in-season |
| `src/knowledge/periodization.md` | KB — modèles de périodisation, blocs, DUP |
| `src/knowledge/off-season-periodization.md` | KB — off-season, transition, reconstruction |
| `src/knowledge/strength-methods.md` | KB — contrast, PAP, French Contrast, progression plyo |
| `src/knowledge/injury-prevention.md` | KB — prévention blessures, prehab |
| `src/services/program/positionPreferences.v1.ts` | Scoring position existant (6 postes) |

### Technical Decisions

- **Livrable = architecture + backlog**, pas les séances elles-mêmes
- **Performance + full_gym uniquement** (starter/builder dérivés plus tard)
- **Périodisation par blocs** (pas DUP) — chaque phase de 4 semaines a une qualité dominante
- **Pas de Primer** en pré-saison — le terme Primer est réservé aux semaines de match in-season
- **Différenciation position progressive** : S1-4 commune, S5-8 modérée, S9-12 nette
- **Cycle autonome S1-S12** avec hypothèse d'entrée post-off-season
- **Détection par date de reprise** avec confirmation explicite utilisateur

---

## Architecture pré-saison 12 semaines

### Vue d'ensemble

```
S1 ──── S4     S5 ──── S8     S9 ──── S12    → IN-SEASON
 FORCE           FORCE+POWER    PUISSANCE       DUP / matchs
 ▪ Construire    ▪ Convertir    ▪ Exprimer      ▪ Maintenir
 ▪ Volume ↑      ▪ Volume ↔     ▪ Volume ↓
 ▪ Intensité ↔   ▪ Intensité ↑  ▪ Intensité ↑↑
 ▪ Pos: commune  ▪ Pos: modérée ▪ Pos: nette
```

### Phase 1 — Force (S1-S4)

**Objectif :** Construire la base de force maximale. C'est la phase où le joueur investit dans sa capacité à produire de la force, qui sera convertie en puissance ensuite.

**Qualité dominante :** Force (80-85% 1RM, séries de 4-6 reps)
**Qualité secondaire :** Hypertrophie de soutien (volume modéré sur les patterns composés)
**Contrast :** Absent ou minimal — le focus est sur la charge, pas sur la vitesse

**Paramètres :**

| Paramètre | Valeur |
|---|---|
| Intensité dominante | 78-85% 1RM |
| Reps dominantes | 4-6 (force), 6-8 (support) |
| Volume par session | 15-20 sets de travail |
| Repos inter-séries | 2-3 min (force), 90s (support) |
| Progression | +2.5 kg/sem si RER ≥ 3, sinon maintien |

**Structure hebdomadaire :**

| Fréquence | Sessions S&C | Endurance | Vitesse |
|---|---|---|---|
| 2x/sem | Lower Force + Upper Force | 2x (dont 1 terrain) | 1x terrain |
| 3x/sem | Lower + Upper + Full Force | 2x (dont 1 terrain) | 1x terrain |
| 4x/sem | Lower + Upper + Full + Speed/Power intro | 2x (dont 1 terrain) | Intégré dans la 4e séance |

**Position :** Base largement commune. Accents subtils uniquement :
- Front row : légère préférence squat/hinge lourd + carry dans le finisher
- Back three : légère préférence hip thrust/unilateral + stiffness dans le finisher
- Ces accents sont des **notes dans la session**, pas des sessions séparées

**Types de séances mères Phase 1 :**

| Session | Contenu principal | Durée cible |
|---|---|---|
| `UPPER_PRESEASON_FORCE_V1` | Force push (bench 4x5), force pull (row 4x5), support upper (accessoire 3x8), position finisher | 50-60 min |
| `LOWER_PRESEASON_FORCE_V1` | Force squat (squat 4x5), force hinge (RDL 4x5), support unilateral (lunge 3x6/side), position finisher | 50-60 min |
| `FULL_PRESEASON_FORCE_V1` | Force compound (squat ou hinge 3x5), push/pull pair (3x6), posterior chain support (3x8), position finisher | 55-65 min |
| `SPEED_POWER_PRESEASON_INTRO_V1` | *(4x/sem uniquement)* Intro explosive : jumps BW (3x3), med ball throws (3x5), speed drills terrain courtes | 35-45 min |

**Différence clé vs in-season :**
- Plus de volume (4x5 au lieu de 4x4)
- Pas de contrast set (la force est l'objectif, pas la conversion)
- Pas de primer (pas de match)
- Finisher plus volumineux (3 rounds au lieu de EMOM 8')

---

### Phase 2 — Force + Puissance (S5-S8)

**Objectif :** Commencer la conversion de la force acquise en puissance. Introduction des contrast sets et du travail balistique. Le volume force diminue légèrement pour faire place à la composante puissance.

**Qualité dominante :** Force-puissance (contrast sets : force lourde → explosif)
**Qualité secondaire :** Maintien de la force max (intensité élevée, volume réduit)
**Contrast :** Présent dans chaque session Lower et Upper (1 contrast pair par session)

**Paramètres :**

| Paramètre | Valeur |
|---|---|
| Intensité force | 82-88% 1RM |
| Intensité explosive | BW ou 30-40% 1RM |
| Reps force | 3-5 |
| Reps explosif | 3-5 (qualité > quantité) |
| Volume par session | 12-18 sets de travail |
| Repos inter-séries | 3 min (contrast clusters), 90-120s (support) |

**Structure hebdomadaire :**

| Fréquence | Sessions S&C | Endurance | Vitesse |
|---|---|---|---|
| 2x/sem | Lower Force-Power + Upper Force-Power | 1-2x (dont 1 terrain) | Optionnelle |
| 3x/sem | Lower + Upper + Full Force-Power | 1-2x (dont 1 terrain) | Optionnelle |
| 4x/sem | Lower + Upper + Full + Speed/Power | 1-2x (dont 1 terrain) | Intégré dans la 4e séance |

**Position :** Différenciation modérée. Les contrast sets commencent à varier par poste :
- Front row : contrast squat → jump vertical (poussée mêlée), carry lourd dans finisher
- Back three : contrast trap bar → broad jump (projection), sled léger + stiffness dans finisher
- **Les sessions restent communes** mais avec des paragraphes "Position Accent" plus marqués que Phase 1. Si la valeur ajoutée est réelle, on peut créer 2 versions (front_row / back_three) pour Lower et Upper.

**Types de séances mères Phase 2 :**

| Session | Contenu principal | Durée cible |
|---|---|---|
| `UPPER_PRESEASON_FORCE_POWER_V1` | **Contrast push** (bench 4x4 → plyo push-up 4x4), strength pull pair (row + accessoire), position finisher | 50-55 min |
| `LOWER_PRESEASON_FORCE_POWER_V1` | **Contrast lower** (squat 4x3 → broad jump 3 reps × 4), strength hinge pair (RDL + unilateral), position finisher | 50-55 min |
| `FULL_PRESEASON_FORCE_POWER_V1` | Power pair (compound → jump), push/pull support, posterior chain, position finisher | 55-65 min |
| `SPEED_POWER_PRESEASON_V1` | *(4x/sem)* Explosive dédié : contrast complexes, plyométrie structurée, sprint court terrain | 40-50 min |

**Différence clé vs Phase 1 :**
- Contrast sets introduits (c'est le changement majeur)
- Volume force réduit (-1 set par exercice)
- Finisher reste similaire mais peut inclure du work balistique léger
- Session structure se rapproche progressivement de l'in-season

---

### Phase 3 — Puissance (S9-S12)

**Objectif :** Expression maximale de la puissance. La force acquise en Phase 1-2 est maintenant exploitée pour la vitesse et la réactivité. Cette phase prépare directement la transition vers l'in-season.

**Qualité dominante :** Puissance / vitesse-force (contrast dominants, plyométrie avancée)
**Qualité secondaire :** Maintien force max (1-2 séries lourdes par session)
**Contrast :** Dominant — structure de session proche de l'in-season

**Paramètres :**

| Paramètre | Valeur |
|---|---|
| Intensité force | 85-90% 1RM (faible volume) |
| Intensité explosive | BW, med ball, bandes |
| Reps force | 2-4 |
| Reps explosif | 3-5 |
| Volume par session | 10-15 sets de travail |
| Repos inter-séries | 3-4 min (contrast clusters), 90s (support) |

**Structure hebdomadaire :**

| Fréquence | Sessions S&C | Endurance | Vitesse |
|---|---|---|---|
| 2x/sem | Lower Power + Upper Power | 1x (maintien qualité) | — |
| 3x/sem | Lower + Upper + Full Power | 1x (maintien qualité) | — |

**Position :** Différenciation nette. Les sessions sont désormais positionnées par poste, comme en in-season :
- Front row : contrast squat lourd + carry/bracing, finisher cervical/adducteur
- Back three : contrast trap bar/hip thrust + sprint-transfer, finisher stiffness/trunk
- **Sessions distinctes** front_row et back_three pour Lower et Upper

**Types de séances mères Phase 3 :**

| Session | Variantes position | Durée cible |
|---|---|---|
| `UPPER_PRESEASON_POWER_FRONT_ROW_V1` | Contrast bench → plyo, landmine press, carry/neck finisher | 45-55 min |
| `UPPER_PRESEASON_POWER_BACK_THREE_V1` | Contrast bench → plyo, incline DB, stiffness/trunk finisher | 45-55 min |
| `LOWER_PRESEASON_POWER_FRONT_ROW_V1` | Contrast box squat → jump, RDL, sled/Copenhagen finisher | 45-55 min |
| `LOWER_PRESEASON_POWER_BACK_THREE_V1` | Contrast trap bar → broad jump, hip thrust, sled léger/Pallof finisher | 45-55 min |
| `FULL_PRESEASON_POWER_V1` | Power pair, push/pull, posterior chain, position support (commune avec accents) | 50-60 min |

**Différence clé vs Phase 2 :**
- Le contrast set est le bloc principal (pas le bloc force)
- Volume total encore réduit (préparation au passage in-season)
- Sessions position-specific (×2 pour Upper et Lower)
- Durée se rapproche des sessions in-season
- Transition naturelle : S12 → première semaine in-season sans rupture

**Transition S12 → In-season :**
Les sessions Phase 3 sont conçues pour converger vers la structure in-season :
- Block 1 in-season = Block 1 Phase 3 (contrast pair, même format)
- Block 2 in-season = Block 2 Phase 3 (strength pair, même logique)
- Block 3 in-season = Block 3 Phase 3 (position finisher, identique)

Le passage se fait sans "semaine de transition" — S12 est déjà quasi-in-season.

---

## Progression et logique de charge sur 12 semaines

### Progression intra-phase (au sein de chaque bloc de 4 semaines)

| Semaine | Volume | Intensité | Intention |
|---|---|---|---|
| S1/S5/S9 | Référence | Référence | Installer le stimulus |
| S2/S6/S10 | Référence | +2.5-5 kg si RER ≥ 3 | Progresser |
| S3/S7/S11 | +1 set ou +1 round si toléré | Maintien ou légère hausse | Pic du bloc |
| S4/S8/S12 | -30% volume (deload) | Maintien intensité | Récupérer, surcompenser |

**Deload systématique à S4, S8, S12.** KB periodization.md §2.3 : "Durée optimale bloc = 4 semaines pour amateurs, avec S4 deload."

### Progression inter-phases

```
Phase 1 (Force)         Phase 2 (Force+Power)    Phase 3 (Power)
───────────────         ─────────────────────    ────────────────
Bench 4x5 @ 80%   →    Bench 4x4 @ 83% + plyo  →  Bench 4x3 @ 87% + plyo
Squat 4x5 @ 80%   →    Squat 4x3 @ 85% + jump  →  Squat 3x3 @ 88% + jump
RDL 4x5 @ 75%     →    RDL 3x5 @ 80%           →  RDL 2x5 @ 82% (maintien)
Volume: 15-20 sets →    Volume: 12-18 sets       →  Volume: 10-15 sets
```

Le volume descend, l'intensité et la vitesse montent. La force acquise est progressivement convertie en puissance.

---

## Différenciation avants / arrières

### Matrice de progression de la différenciation

| Phase | Structure | Position accent | Sessions distinctes ? |
|---|---|---|---|
| **S1-S4** | Communes | Accent notes dans chaque session | **Non** — 3-4 sessions communes |
| **S5-S8** | Communes | Paragraphes Position Accent développés | **Optionnel** — si valeur réelle, split Lower et Upper |
| **S9-S12** | Position-specific | Exercices, finishers, contrast variants distincts | **Oui** — Lower ×2, Upper ×2, Full commune |

### Quels accents sont réels en pré-saison

| Accent | Front row | Back three | Quand introduire |
|---|---|---|---|
| Squat pattern | Box squat, front squat | Trap bar, goblet squat | S1 (choix de lift) |
| Contrast pair | Squat → CMJ vertical | Trap bar → broad jump horizontal | S5 |
| Finisher | Carry + neck + Copenhagen | Sled léger + Pallof + stiffness | S1 (subtil), S5 (marqué), S9 (dédié) |
| Volume force | +1 set force, -1 set accessoire | +1 set plyométrique, -1 set force | S5 |
| Vitesse explosive | Moins prioritaire | Plus prioritaire | S5-S8 |

### Ce qui reste commun

- Structure de session (nombre de blocs, format, repos)
- Patterns fondamentaux (push/pull/squat/hinge)
- Warm-up
- Injury substitutions (même matrice)
- Progression rules (même logique)
- Deload timing (S4/S8/S12)

---

## Endurance et vitesse terrain dans l'architecture

### Intégration hebdomadaire (architecture, pas authoring détaillé)

**Phase 1 (S1-S4) — Semaine type 3x S&C :**
```
Lundi    : LOWER_FORCE + Endurance terrain (30-40 min continu + jeu réduit)
Mardi    : —
Mercredi : UPPER_FORCE
Jeudi    : Endurance salle (vélo/rameur intervalles) ou terrain
Vendredi : FULL_FORCE
Samedi   : Vitesse terrain (sprints courts 10-30m, repos complet entre)
Dimanche : Repos
```

**Phase 2 (S5-S8) — Semaine type 3x S&C :**
```
Lundi    : LOWER_FORCE_POWER + Endurance terrain (réduit : 20-25 min, plus intense)
Mardi    : —
Mercredi : UPPER_FORCE_POWER
Jeudi    : Endurance optionnelle (terrain ou salle, intensité modérée)
Vendredi : FULL_FORCE_POWER
Samedi   : Vitesse terrain optionnelle selon niveau
Dimanche : Repos
```

**Phase 3 (S9-S12) — Semaine type 3x S&C :**
```
Lundi    : LOWER_POWER
Mardi    : —
Mercredi : UPPER_POWER
Jeudi    : Endurance qualitative (1x/sem : intervalles courts haute intensité)
Vendredi : FULL_POWER
Samedi   : — (transition in-season, terrain collectif possible)
Dimanche : Repos
```

**Note :** L'endurance et la vitesse terrain ne seront pas authorées en tant que mother sessions dans le premier lot. Elles sont mentionnées dans l'architecture pour que les sessions S&C soient calibrées en sachant qu'elles coexistent.

---

## Détection produit de la pré-saison

### Logique de détection

1. **Demander au joueur** sa date de reprise collective / premier entraînement de club
2. **Calculer la fenêtre de 12 semaines** en amont de cette date
3. **Proposer** le passage en mode pré-saison avec un message clair :
   > "Ta reprise collective est prévue le [date]. On peut démarrer ta prépa physique 12 semaines avant, soit le [date - 12 sem]. Tu veux activer le programme pré-saison ?"
4. **Confirmation explicite** de l'utilisateur (pas d'activation automatique)
5. **Override manuel** possible : le joueur peut rester en off-season ou passer manuellement

### Entrée en pré-saison selon le contexte

| Contexte | Entrée recommandée |
|---|---|
| Joueur sort d'une off-season structurée (H1-H4 complétée) | S1 pré-saison directement |
| Joueur reprend après une longue coupure (> 4 semaines sans entraînement) | S1 pré-saison avec microcycle de ré-acclimatation (S1 = volume réduit -30%, progression plus douce) |
| Joueur a déjà fait de la force récemment | Possibilité de démarrer en S5 (force+power) si le coach valide |

### Implémentation UX (hors scope détaillé, mais architecture)

- Nouveau champ `seasonStartDate` dans le profil utilisateur
- Calcul `preSeasonStartDate = seasonStartDate - 12 semaines`
- Notification / proposition quand `today >= preSeasonStartDate - 7 jours`
- `seasonMode: 'pre_season'` avec `preSeasonWeek: 1-12`

---

## Backlog d'authoring priorisé

### Lot 1 — Plus petit lot pour démarrer (Phase 1 commune)

**3 sessions, ~3-4h d'authoring**

| # | Session | Priorité | Position | Raison |
|---|---|---|---|---|
| 1 | `LOWER_PRESEASON_FORCE_V1` | P0 | Commune + accent notes | Le bas du corps est la base du rugby S&C |
| 2 | `UPPER_PRESEASON_FORCE_V1` | P0 | Commune + accent notes | Complète le split Upper/Lower pour 2x/sem |
| 3 | `FULL_PRESEASON_FORCE_V1` | P0 | Commune + accent notes | Permet le 3x/sem |

**Avec ces 3 sessions, un joueur à 2x ou 3x/sem peut commencer sa Phase 1.**

### Lot 2 — Phase 2 avec contrast (S5-S8)

**3-4 sessions**

| # | Session | Priorité | Position |
|---|---|---|---|
| 4 | `LOWER_PRESEASON_FORCE_POWER_V1` | P1 | Commune + accent marqué |
| 5 | `UPPER_PRESEASON_FORCE_POWER_V1` | P1 | Commune + accent marqué |
| 6 | `FULL_PRESEASON_FORCE_POWER_V1` | P1 | Commune |
| 7 | `SPEED_POWER_PRESEASON_V1` | P2 | Commune (4x/sem option) |

### Lot 3 — Phase 3 position-specific (S9-S12)

**5-6 sessions**

| # | Session | Priorité | Position |
|---|---|---|---|
| 8 | `LOWER_PRESEASON_POWER_FRONT_ROW_V1` | P1 | Front row |
| 9 | `LOWER_PRESEASON_POWER_BACK_THREE_V1` | P1 | Back three |
| 10 | `UPPER_PRESEASON_POWER_FRONT_ROW_V1` | P1 | Front row |
| 11 | `UPPER_PRESEASON_POWER_BACK_THREE_V1` | P1 | Back three |
| 12 | `FULL_PRESEASON_POWER_V1` | P2 | Commune avec accents |

### Lot 4 — Architecture support

| # | Livrable | Priorité |
|---|---|---|
| 13 | `WEEKLY_TEMPLATES_PRESEASON.md` | P1 |
| 14 | Compléments `AUTOMATIC_ALTERNATIVES_MATRIX.md` (nouveaux exercices pré-saison) | P2 |
| 15 | `SPEED_POWER_PRESEASON_INTRO_V1` (4x/sem Phase 1) | P3 |

### Résumé du backlog

| Lot | Sessions | Couvre | Effort estimé |
|---|---|---|---|
| **Lot 1** | 3 sessions communes | Phase 1 complète (2x ou 3x/sem) | ~3-4h |
| **Lot 2** | 3-4 sessions communes | Phase 2 complète | ~3-4h |
| **Lot 3** | 5-6 sessions position-specific | Phase 3 complète | ~5-6h |
| **Lot 4** | Templates + matrice + option 4x | Support complet | ~2-3h |

**Total : 12-15 sessions pour couvrir les 12 semaines à 3 niveaux de fréquence.**

---

## Risques et garde-fous

| Risque | Impact | Mitigation |
|---|---|---|
| Trop de sessions différentes → ingérable | Authoring bloat, maintenance lourde | Lot 1 = 3 sessions communes. Ne pas splitter par position tant que la valeur n'est pas prouvée |
| Phase 1 trop proche de l'off-season | Joueur perçoit un "recyclage" | Phase 1 doit avoir un intent force explicite (4x5 @ 80%), pas un intent hypertrophie (3x10 @ 65%) |
| Phase 3 trop proche de l'in-season | Sentiment de "déjà-vu" au passage in-season | Phase 3 converge intentionnellement vers l'in-season — c'est une feature, pas un bug |
| Pas de détection automatique → joueur reste en off-season | Programme inadapté pendant la fenêtre critique | Détection date + notification proactive + possibilité d'override manuel |
| Entrée en S1 après longue coupure = risque blessure | Surcharge brutale | S1 prévoit une entrée prudente (volume -30%) pour joueurs non-préparés |
| 4x/sem trop ambitieux pour amateurs | Sur-entraînement, abandon | 4x/sem = option, pas défaut. Session 4 = la première sacrifiée si fatigue |
| Endurance/vitesse terrain non authorées | Joueur ne sait pas quoi faire hors salle | Architecture hebdomadaire documentée avec indications générales. Authoring détaillé = lot ultérieur |

### Garde-fous métier (verrouillés)

1. **Chaque session pré-saison doit passer le test de transfert rugby** : peut-on nommer une situation de match pour chaque exercice ?
2. **Le volume ne doit jamais dépasser ce qu'un amateur peut absorber** avec 2-3 entraînements rugby terrain en parallèle
3. **La progression inter-phases doit être visible** : un joueur qui compare sa S1 et sa S12 doit voir la transformation (volume → puissance)
4. **Le deload est non-négociable** : S4, S8, S12 = réduction volume, pas suppression
5. **Pas de fitness générique** : chaque bloc doit être défendable devant un coach rugby en 30 secondes

---

## Notes

- Les sessions pré-saison utilisent le même template Markdown que les sessions in-season (`TEMPLATE_MOTHER_SESSION.md`) avec `cycle: pre_season`
- La naming convention suit le pattern existant : `{TYPE}_PRESEASON_{PHASE}_{POSITION}_V1.md`
- L'authoring se fait une session à la fois, manuellement, comme pour l'in-season
- Les effets résiduels (KB periodization.md §1.3) justifient l'ordre Force → Force+Power → Power : la force dure ~30j après l'arrêt, la puissance ~20j, donc on capitalise sur la force pour exprimer la puissance
- La matrice d'alternatives automatiques existante couvre déjà la majorité des exercices pré-saison (même catalogue, usage différent)
