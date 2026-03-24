---
title: 'Architecture off-season annuelle — Mother Sessions S&C Rugby'
slug: 'off-season-mother-sessions'
created: '2026-03-20'
status: 'draft'
source_of_truth: false
tech_stack: ['Markdown authoring', 'Mother Session Template']
files_to_modify:
  - docs/training/mother-sessions/ (nouveau dossier off-season)
  - docs/training/mother-sessions/WEEKLY_TEMPLATES_OFF_SEASON.md
code_patterns:
  - 'Mother session = Markdown structuré (Goal, Identity, Warm-Up, Visible Blocks, Progression, Substitutions)'
  - 'Weekly templates = fréquence + phase + transitions + overrides fatigue'
  - 'Conditioning V1 = prescriptions simples intégrées aux weekly templates, pas un système parallèle de mother sessions'
  - 'Transition off-season -> pre-season -> in-season = logique produit explicite, jamais silencieuse'
test_patterns:
  - 'Validation manuelle par le coach : chaque phase doit être défendable en 30s'
  - 'Pas de tests automatisés pour les mother sessions (authoring humain)'
---

# Tech-Spec: Architecture off-season annuelle — Mother Sessions S&C Rugby

**Created:** 2026-03-20

## Overview

### Problem Statement

Le système RugbyPrep couvre maintenant correctement :
- l'in-season
- la pré-saison 12 semaines

Mais il manque encore le chaînon annuel le plus évident : **l'off-season coach-authored**.

Aujourd'hui, un joueur qui termine sa saison peut :
- rester sans cadre pendant 6-10 semaines
- bricoler un programme hypertrophie générique
- arriver en pré-saison sans base cohérente

Ce trou de produit casse la continuité annuelle et augmente le risque de transition mal dosée vers la pré-saison. La KB off-season documente explicitement :
- la désadaptation aérobie rapide
- la reconstruction progressive des patterns
- le risque d'ACWR mal géré à l'entrée en pré-saison

### Solution

Concevoir l'architecture complète **off-season V1** comme un livrable unique qui inclut :
1. l'architecture off-season elle-même
2. les weekly templates off-season
3. la logique de transition off-season -> pre-season -> in-season
4. un module compagnon de conditioning simple intégré aux weekly templates

Le livrable cible est un **plan d'architecture et un backlog d'authoring**, pas encore l'authoring détaillé de toutes les séances.

### Scope

**In Scope :**
- architecture off-season standard `10 semaines` pour joueur amateur
- logique flexible `8-10 semaines` si la fenêtre est plus courte
- weekly templates off-season (`2x` et `3x`, pas de `4x` par défaut en V1)
- types de mother sessions à créer par phase
- logique de transition :
  - fin de saison -> off-season
  - off-season -> pre-season
  - pre-season -> in-season
- conditioning/endurance V1 sous forme de prescriptions simples par phase
- backlog d'authoring priorisé

**Out of Scope :**
- système parallèle complet de mother sessions conditioning
- niveaux `starter / builder`
- variantes `home gym / limited equipment`
- autres groupes de postes au-delà du cadre actuel V1
- refacto moteur app
- mapping app détaillé

## Context for Development

### Source directrice scientifique

La KB [off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md) décrit une logique off-season rugby amateur réaliste :

| Phase | Semaines | Objectif | Volume | Intensité |
|---|---|---|---|---|
| Récupération active | S1-S2 | régénération | très faible | légère |
| Transition | S3-S4 | réentraîner les patterns | faible | modérée |
| Hypertrophie | S5-S8 | reconstruire la masse | élevée | modérée |
| Force-Bridge | S9-S10 | intensifier et préparer la pré-saison | modérée | élevée |

La pré-saison 12 semaines existe déjà comme source de vérité dans [tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md).

Donc l'off-season doit être pensée comme :
- une phase de reconstruction autonome
- suivie d'un **handoff explicite** vers la pré-saison
- sans contradiction de structure avec les mother sessions déjà validées

### Conventions à préserver

Le système actuel de mother sessions repose sur :
- authoring Markdown humain d'abord
- template stable
- blocs visibles lisibles
- substitutions blessure
- weekly templates comme vrai orchestrateur système

Références à préserver :
- [README.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/README.md)
- [TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)
- [WEEKLY_TEMPLATES_PRESEASON.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/WEEKLY_TEMPLATES_PRESEASON.md)
- [WEEKLY_TEMPLATES_IN_SEASON.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/WEEKLY_TEMPLATES_IN_SEASON.md)
- [AUTOMATIC_ALTERNATIVES_MATRIX.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/AUTOMATIC_ALTERNATIVES_MATRIX.md)

### Technical Decisions

- **Off-season + transitions sortent ensemble** dans ce chantier
- **Conditioning V1 = module compagnon**, pas système complet parallèle
- **V1 = performance + full_gym**
- **V1 = priorité aux structures `2x` et `3x`**, pas de `4x` off-season par défaut
- **Différenciation poste faible à modérée** :
  - base commune dominante
  - accents poste en notes et finisher
  - pas de split complet front_row / back_three partout en V1
- **Pré-saison reste séparée** :
  - l'off-season doit préparer la pré-saison
  - pas la fusionner

## Architecture off-season V1

### Vue d'ensemble

```
FIN DE SAISON
   ↓
S1-S2     S3-S4         S5-S8            S9-S10            → PRE-SEASON
Recovery  Transition    Hypertrophy      Force-Bridge        S1-S12
```

### Phase 1 — Recovery (`S1-S2`)

**Objectif :**
- décharger le joueur après la saison
- récupérer articulairement et nerveusement
- réinstaller du mouvement sans logique de performance

**Qualité dominante :**
- récupération active
- réintroduction légère de patterns

**Format cible :**
- `2x/semaine` maximum
- séances courtes `30-45 min`
- full body seulement en V1

**Types de séances à créer :**
- `FULL_OFFSEASON_RECOVERY_A_V1`
- `FULL_OFFSEASON_RECOVERY_B_V1`

**Caractéristiques :**
- pas de contrast
- pas de travail lourd
- travail léger mobilité / patterns / circuits simples / tissus
- conditioning compagnon :
  - `2x 20-30 min zone 2`
  - marche, vélo, natation, footing facile

### Phase 2 — Transition (`S3-S4`)

**Objectif :**
- remettre les patterns fondamentaux sous contrainte modérée
- refaire tolérer squat / hinge / push / pull
- préparer la montée de volume hypertrophie

**Qualité dominante :**
- reconstruction technique
- volume bas à modéré

**Format cible :**
- `2x/semaine` : `Lower + Upper`
- `3x/semaine` : `Lower + Upper + Full`

**Types de séances à créer :**
- `LOWER_OFFSEASON_TRANSITION_V1`
- `UPPER_OFFSEASON_TRANSITION_V1`
- `FULL_OFFSEASON_TRANSITION_V1`

**Caractéristiques :**
- charges modérées
- patterns complets
- pas encore de travail de puissance central
- conditioning compagnon :
  - `2x 25-35 min zone 2`
  - ou `1x zone 2 + 1x tempo run léger`

### Phase 3 — Hypertrophy (`S5-S8`)

**Objectif :**
- reconstruire de la masse musculaire utile rugby
- créer de la marge structurelle pour la force future
- remettre du volume de travail sans contrainte match

**Qualité dominante :**
- hypertrophie

**Format cible :**
- `2x/semaine` : `Lower Hypertrophy + Upper Hypertrophy`
- `3x/semaine` : `Lower + Upper + Full Hypertrophy`

**Types de séances à créer :**
- `LOWER_OFFSEASON_HYPERTROPHY_V1`
- `UPPER_OFFSEASON_HYPERTROPHY_V1`
- `FULL_OFFSEASON_HYPERTROPHY_V1`

**Caractéristiques :**
- volume le plus haut du cycle annuel
- `6-12` reps dominantes
- support musculaire plus présent
- travail bras autorisé si cohérent
- conditioning compagnon :
  - `2x` aerobic base `25-35 min`
  - ou `1x zone 2 + 1x tempo`
  - garder interférence faible avec jambes

### Phase 4 — Force-Bridge (`S9-S10`)

**Objectif :**
- densifier la force à partir de la masse reconstruite
- réduire légèrement le volume
- préparer l'entrée en pré-saison Force / Force+Puissance

**Qualité dominante :**
- intensification
- bridge hypertrophie -> pré-saison

**Format cible :**
- `2x/semaine` : `Lower Force-Bridge + Upper Force-Bridge`
- `3x/semaine` : `Lower + Upper + Full Force-Bridge`

**Types de séances à créer :**
- `LOWER_OFFSEASON_FORCE_BRIDGE_V1`
- `UPPER_OFFSEASON_FORCE_BRIDGE_V1`
- `FULL_OFFSEASON_FORCE_BRIDGE_V1`

**Caractéristiques :**
- volume plus bas que l'hypertrophie
- intensité plus haute
- introduction discrète de vitesse d'intention, sans devenir pré-saison
- conditioning compagnon :
  - `1-2` expositions / semaine maximum
  - priorité à aerobic maintenance + quelques accélérations techniques courtes si besoin

## Weekly Template Decisions

### Fréquences cibles V1

**Recovery**
- `2x` seulement

**Transition / Hypertrophy / Force-Bridge**
- `2x` : `Lower + Upper`
- `3x` : `Lower + Upper + Full`

**Décision V1 importante**
- pas de `4x` off-season comme architecture standard
- si un joueur a plus de temps, on ajoute du conditioning compagnon ou des micro-add-ons, pas une 4e grosse séance salle par défaut

### Position logic

**V1 off-season**
- base largement commune
- accents poste faibles à modérés
- exemples :
  - `front_row` : un peu plus de bracing, carry, neck, squat/hinge lourd
  - `back_three` : un peu plus de unilateral, lower leg, rotation, stiffness

**Décision**
- pas de split complet front_row / back_three sur tout l'off-season
- la vraie différenciation forte reste la pré-saison Phase 3 et l'in-season

## Conditioning Companion Module

### Règle produit

Le conditioning off-season V1 ne sera **pas** authoré comme un second système complet de mother sessions.

À la place, les weekly templates off-season devront prescrire simplement :
- le nombre d'expositions conditioning
- le type d'exposition
- la durée / densité
- quand réduire si la fatigue monte

### Types de prescriptions V1

- `Zone 2`
  - `20-35 min`
- `Tempo run`
  - exemples simples type `6x100m` ou `4x400m` à intensité contrôlée
- `Short acceleration technique`
  - quelques départs courts en force-bridge si utile

### Ce que V1 n'essaie pas de faire

- pas de bibliothèque complète de séances endurance détaillées
- pas de logique de substitutions blessure dédiée au conditioning
- pas de second moteur de sélection parallèle au système S&C

## Product Logic and Annual Transitions

### Fin de saison -> Off-season

L'app doit pouvoir proposer l'off-season si :
- pas de match depuis plus de `3 semaines`
- ou l'utilisateur déclare explicitement sa fin de saison
- ou la date correspond à une fenêtre cohérente de fin de championnat

Mais :
- **jamais de bascule silencieuse**
- toujours confirmation explicite utilisateur

### Off-season -> Pre-season

L'app doit proposer la pré-saison si :
- le joueur renseigne une date de reprise collective / premier match
- et que cette date entre dans la fenêtre `12 semaines`

Règles V1 :
- si l'off-season a été suivie normalement jusqu'à `Force-Bridge`, entrée en `Pre-season S1`
- si l'off-season est incomplète ou chaotique, proposer :
  - soit `Transition off-season` raccourcie
  - soit `Pre-season S1` avec prudence et charges basses

### Pre-season -> In-season

Déjà cadré dans les templates in-season, mais le chantier off-season doit rappeler :
- première semaine in-season = semaine d'installation
- charges `5-10%` sous les pics pré-saison
- volume bas de fourchette

## Authoring Backlog

### Lot 1 — Architecture minimum exploitable

- `WEEKLY_TEMPLATES_OFF_SEASON.md`
- logique produit de transition annuelle
- `FULL_OFFSEASON_RECOVERY_A_V1`
- `FULL_OFFSEASON_RECOVERY_B_V1`

Objectif :
- rendre l'app crédible immédiatement en début d'off-season
- éviter le trou juin-juillet

### Lot 2 — Base de reconstruction

- `LOWER_OFFSEASON_TRANSITION_V1`
- `UPPER_OFFSEASON_TRANSITION_V1`
- `FULL_OFFSEASON_TRANSITION_V1`
- `LOWER_OFFSEASON_HYPERTROPHY_V1`
- `UPPER_OFFSEASON_HYPERTROPHY_V1`
- `FULL_OFFSEASON_HYPERTROPHY_V1`

Objectif :
- couvrir le cœur de l'off-season utile

### Lot 3 — Bridge vers pré-saison

- `LOWER_OFFSEASON_FORCE_BRIDGE_V1`
- `UPPER_OFFSEASON_FORCE_BRIDGE_V1`
- `FULL_OFFSEASON_FORCE_BRIDGE_V1`

Objectif :
- lisser proprement l'entrée en pré-saison

## Open Questions To Resolve In Review

1. L'architecture standard doit-elle être présentée comme `10 semaines`, ou `8-10 semaines` avec standard `10` et version courte dérivée ?
2. Veut-on garder `Recovery` en full-body uniquement, ou introduire déjà `Lower/Upper` dès S1-S2 ?
3. Jusqu'où autoriser des blocs "reward / pump" en hypertrophie sans casser l'identité rugby ?
4. Faut-il intégrer un micro-bloc neck plus systématique dès l'off-season pour les avants ?
5. Quel est le plus petit module conditioning acceptable en V1 pour être utile sans gonfler le scope ?

## Recommended Next Step

1. Valider cette architecture off-season V1
2. Écrire [WEEKLY_TEMPLATES_OFF_SEASON.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/WEEKLY_TEMPLATES_OFF_SEASON.md)
3. Authorer d'abord `FULL_OFFSEASON_RECOVERY_A_V1` et `FULL_OFFSEASON_RECOVERY_B_V1`
4. Puis seulement ouvrir le lot Hypertrophy
