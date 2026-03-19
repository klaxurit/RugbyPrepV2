---
title: 'Audit de couverture contenu & plan enrichissement — Contrast Sets à tous les niveaux'
slug: 'audit-couverture-contenu-contrast-all-levels'
created: '2026-03-14'
updated: '2026-03-14'
status: 'review'
stepsCompleted: [1, 2, 3]
tech_stack: ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'Supabase']
files_to_modify:
  - src/data/blocks.v1.json
  - src/data/exercices.v1.json
  - src/data/sessionRecipes.v1.ts
code_patterns:
  - 'Scoring tag-driven (+1 recipe, +5 position, +3 phase, +2 intensity)'
  - 'Equipment = pass/fail gate, pas de scoring'
  - 'Level gating via tags: starter → tag "starter" requis, builder → pas de tag "starter", perf → ni "starter" ni "builder"'
  - 'Focus tags par slot (slotFocusTags) filtrent les intents: activation, prehab, neural, contrast, force, hypertrophy, conditioning'
  - 'Cross-session exclusion désactivée pour starter'
  - 'Rotation semaine pour neck/core/carry (top 3), sinon top-scored'
  - 'Slot contrast optionnel (required: false) déjà utilisé par REHAB_*_P3_V1 — pattern éprouvé'
test_patterns:
  - 'validationMetier.test.ts: 14 profils × 6 semaines, assertion sessions.length >= 1'
  - 'Pas de test starter+gym, pas de test différenciation poste'
  - 'Pas de test contrast starter/builder (aucun slot contrast dans ces recettes actuellement)'
---

# Tech-Spec: Audit de couverture contenu & plan enrichissement — Contrast Sets à tous les niveaux

**Created:** 2026-03-14
**Updated:** 2026-03-14

## Overview

### Problem Statement

La couverture data actuelle (125 blocs, 155 exercices) est fortement déséquilibrée : Performance = 98 blocs vs Starter = 20 (tous BW/band) vs Builder = 7 (hypertrophie uniquement). Conséquences directes :

1. **Starter full gym** : un utilisateur débutant avec accès à une vraie salle reçoit le même programme qu'un starter sans matériel — aucune exploitation du matériel disponible.
2. **Personnalisation par poste quasi inexistante** : le scoring doux (preferTags/avoidTags) n'a pas assez de data discriminante pour différencier front row, second row et back three de manière perceptible.
3. **Métadonnées incomplètes** : 40% des exercices sans `pattern` ni `level`, `muscleGroups` vide partout — limite le potentiel futur du moteur sans même toucher au code.
4. **Zéro contrast set hors performance** : 16 blocs contrast existent, tous niveau performance. Un starter ou builder ne reçoit JAMAIS de bloc contrast → la dimension force→vitesse (fondamentale en rugby) n'existe pas pour 2 niveaux sur 3. Un préparateur physique ne proposerait jamais un programme rugby sans aucune composante explosive, même pour un débutant.

### Solution

Audit quantitatif des gaps réels, puis plan d'enrichissement en 3 volets :

- **Lot 0 (P0)** : Starter full gym — ajout ciblé de blocs hypertrophy gym-starter + **contrast sets simples à tous les niveaux** (micro-évolution recettes + blocs contrast starter/builder).
- **Lot 1 (P1)** : Enrichissement tags position sur blocs performance existants + blocs position-spécifiques.
- **Lot 2 (P2)** : Backfill métadonnées (`pattern`, `level`, `muscleGroups`) sur les exercices existants.

### Scope

**In Scope:**
- Audit quantitatif de couverture par niveau × équipement × poste × saison
- Matrice de gaps avec priorisation P0/P1/P2
- Plan Lot 0 : blocs gym-starter + slot contrast optionnel dans 5 recettes + blocs contrast starter/builder
- Plan Lot 1 : enrichissement tags position + blocs position-spécifiques
- Plan Lot 2 : backfill métadonnées exercices existants
- Sources croisées : `rugby_exercices_bibliotheque.docx` + `raw-programs.md` + KB `strength-methods.md` + blocks.v1.json

**Out of Scope:**
- Refactoring moteur (`buildWeekProgram`, `selectEligibleBlocks`, `scoreBlock`, etc.)
- Routing par poste (changement de recettes selon position)
- Import brut / non filtré du fichier docx
- Changement de la logique de scoring
- Ajout de nouveaux intents (le moteur gère déjà l'intent `contrast`)

**Changement de scope vs version précédente :**
- `src/data/sessionRecipes.v1.ts` passe **IN SCOPE** pour l'ajout d'un slot `{ intent: 'contrast', required: false }` sur 5 recettes. C'est une micro-évolution (< 15 lignes TS), pas un refactoring moteur.

### Priorisation

| Priorité | Cible | Critère de succès |
|----------|-------|-------------------|
| **P0-a** | Starter full gym | Un starter avec barbell/dumbbell/bench reçoit des blocs différents d'un starter BW-only |
| **P0-b** | Contrast sets tous niveaux | Un starter et un builder reçoivent au moins 1 bloc contrast dans leurs sessions quand un bloc éligible existe |
| **P1** | Front row / Second row / Back three | Différence visible dans la sélection de blocs entre ces 3 profils |
| **P2** | Backfill métadonnées | `pattern`, `level`, `muscleGroups` renseignés sur 100% des exercices |

## Context for Development

### Contrainte technique critique : le scoring est tag-driven, pas equipment-driven

L'investigation révèle que **l'équipement n'intervient pas dans le scoring**, seulement dans le filtrage pass/fail :

1. Un bloc BW (`equipment: ["none"]`) passe pour TOUS les profils, y compris ceux avec gym complète
2. Un nouveau bloc barbell avec les mêmes tags qu'un bloc BW existant fera match nul → tiebreaker alphabétique sur blockId
3. Un nouveau bloc barbell avec MOINS de tags scoring-relevants que le bloc BW existant **perdra**

**Conséquence pour le Lot 0 :** Chaque nouveau bloc gym-starter DOIT porter :
- Tous les tags du bloc BW équivalent qu'il doit surclasser (pour ne pas perdre en scoring)
- Au minimum 1 tag supplémentaire (position ou pattern) pour gagner le tiebreaker
- L'id du bloc doit être choisi pour gagner le tiebreaker alphabétique en cas d'égalité

### Formule de scoring (scoreBlock)

| Source | Poids par tag match | Provenance |
|--------|--------------------:|------------|
| recipe.preferredTags | +1 | Recette de session |
| positionPreferTags | +5 | positionPreferences.v1.ts |
| positionAvoidTags | -2 | positionPreferences.v1.ts |
| phasePreferTags | +3 | programPhases.v1.ts |
| phaseAvoidTags | -2 | programPhases.v1.ts |
| intensityPreferTags | +2 | sessionIntensity.ts |
| intensityAvoidTags | -2 | sessionIntensity.ts |

**Le levier le plus puissant data-only = ajouter des tags qui matchent les positionPreferTags (+5 par match).**

### Position preferences actuelles (6 postes)

| Position | preferTags (+5) | avoidTags (-2) |
|----------|----------------|----------------|
| FRONT_ROW | scrum, neck, contact, carry, hinge, posterior_chain | speed |
| SECOND_ROW | carry, hinge, posterior_chain, power, contact, trunk | — |
| BACK_ROW | power, unilateral, conditioning, carry, contact | — |
| HALF_BACKS | speed, unilateral, trunk, shoulder_health | scrum |
| CENTERS | power, contact, acceleration, trunk | — |
| BACK_THREE | speed, acceleration, unilateral, posterior_chain | scrum |

### Phase preferences (DUP in-season)

| Phase | preferTags (+3) |
|-------|----------------|
| FORCE (session 0, lower) | force, hinge, squat, posterior_chain, contact, trunk, shoulder_health |
| POWER (session 1, upper) | neural, contrast, speed, power, unilateral, plyo, med_ball, carry |
| HYPERTROPHY (session 2, full) | hypertrophy, push, pull, squat, hinge, unilateral, upper, lower |

**Note** : la phase POWER favorise déjà `contrast` (+3). Les blocs contrast starter/builder bénéficieront de ce bonus si le profil est en phase power.

### Couverture actuelle par niveau

| Métrique | Starter | Builder | Performance |
|----------|---------|---------|-------------|
| Blocs total | 20 | 7 | 98 |
| Intents couverts | activation, hypertrophy, core | hypertrophy uniquement | tous |
| **Blocs contrast** | **0** | **0** | **16** |
| Équipement | BW + band uniquement | BW + band + dumbbell + bench | tous |
| Warmup/cooldown propres | 0 | 0 | 6 |
| Blocs par poste | 0 distinction | 0 distinction | scoring doux |

### Gaps identifiés par les documents existants

**Plan de stabilisation (BC-01→BC-09) :**
- BC-01 (HIGH) : builder upper pull-only pour shoulder pain
- BC-02 (HIGH) : contrast lower safe-knee → **partiellement couvert par ce spec (contrast starter/builder)**
- BC-03 (MEDIUM) : mobility blocs variété starter deload
- BC-04 (MEDIUM) : hypertrophy upper BW variété
- BC-05 (MEDIUM) : activation blocks rotation starter
- BC-06→BC-08 (LOW) : warmup/activation variété edge cases

**Raw programs — exercices absents les plus critiques :**
- Deadlift conventionnel + trap-bar deadlift (fondamentaux manquants)
- Incline/decline bench press (variantes pressing)
- Exercices d'agilité/COD (zéro couverture backs)
- Kettlebell (catégorie entière absente)
- Plyométrie structurée (hurdle jumps, lateral bounds)

### Pourquoi le manque de contrast sets limite la qualité perçue rugby des programmes

Le contrast set (force → vitesse) est **le marqueur le plus visible d'un programme rugby vs un programme fitness générique**. Un joueur de rugby amateur qui suit un programme chez RugbyPrep et ne voit que squat + push-up + plank sans jamais faire un saut, un lancer explosif ou un enchaînement force→plio ne percevra pas la spécificité rugby du programme — même si la périodisation sous-jacente est rigoureuse.

**Conséquences concrètes :**
- **Starter** : un débutant en salle apprend la force (squat, push, pull) mais jamais le transfert explosif. Il ne comprend pas pourquoi il s'entraîne "pour le rugby" plutôt que "pour la forme".
- **Builder** : un joueur intermédiaire fait des supersets mais rien d'explosif. Il a l'impression de faire de la musculation classique, pas de la prépa physique rugby.
- **Rétention** : la différenciation avec une app fitness générique est invisible pour 2/3 des niveaux.
- **Crédibilité** : un préparateur physique qui voit le programme dirait "il manque toute la composante puissance/vitesse".

### Contrast sets : philosophie par niveau

**Principe directeur** : les contrast sets doivent exister à tous les niveaux, avec une complexité, une charge et une technicité adaptées. Un débutant n'a pas besoin de French Contrast Method — mais il a besoin d'apprendre la logique force→vitesse.

| Niveau | Philosophie contrast | Complexité | Charge prime | Mouvement explosif | Objectif pédagogique |
|--------|---------------------|------------|-------------|-------------------|---------------------|
| **Starter** | Simple, sûr, auto-limité | 1 mouvement force + 1 mouvement explosif BW | BW ou léger (goblet, band) | Jump BW, broad jump, med ball throw | Apprendre la séquence "effort contrôlé → effort explosif" et son transfert rugby |
| **Builder** | Intermédiaire, plus chargé | 1 mouvement force DB/BB + 1 mouvement explosif BW ou med ball | DB ou BB modéré | Jump BW, med ball, box jump | Augmenter la PAP, intro au complex training simple |
| **Performance** | Spécifique, discriminant par poste | Complex training / French Contrast | BB lourd, olympique simplifié | Plyo réactive, sprint court, depth jump | PAP maximale, spécificité poste, transfert terrain |

### Familles de contrast sets recommandées par niveau

#### Lower contrast

| Famille | Starter | Builder | Performance |
|---------|---------|---------|-------------|
| **Squat → Jump** | BW squat → squat jump BW | Goblet squat → squat jump BW + broad jump | Back squat lourd → box squat jump / depth jump |
| **Hinge → Jump horizontal** | Glute bridge → broad jump | RDL DB → broad jump | RDL/DL BB → broad jump / sprint 10m |
| **Unilatéral → Jump** | Reverse lunge BW → split jump BW | Reverse lunge DB → split jump | Split squat BB → single-leg bound |

#### Upper contrast

| Famille | Starter | Builder | Performance |
|---------|---------|---------|-------------|
| **Push → Throw** | Push-up → med ball chest pass | DB bench → med ball chest pass | BB bench lourd → plyo push-up / med ball pass |
| **Pull → Throw** | Band row → med ball slam | DB row → med ball slam | T-bar row → med ball / plyo |

#### Full body contrast

| Famille | Starter | Builder | Performance |
|---------|---------|---------|-------------|
| **Compound → Slam** | Squat BW → med ball slam | Goblet squat → med ball slam | Clean pull → med ball slam rotationnel |

### Codebase Patterns

- Données structurées en JSON/TS dans `src/data/`
- Blocs dans `blocks.v1.json` : chaque bloc a `blockId`, `intent`, `tags[]`, `equipment[]`, `exercises[]`, `contraindications[]`
- Exercices dans `exercices.v1.json` : chaque exercice a `id`, `equipment[]`, `tags[]`, `contraindications[]`, `level?`, `pattern?`, `muscleGroups[]`
- Level gating : tag `"starter"` requis pour starter, pas de `"starter"` pour builder, ni `"starter"` ni `"builder"` pour perf
- Focus tags par slot (`slotFocusTags`) filtrent les intents filtrables
- Cross-session exclusion désactivée pour starter
- Rotation semaine pour neck/core/carry (top 3 candidats)
- **Slot contrast `required: false` déjà utilisé** dans REHAB_UPPER_P3_V1 et REHAB_LOWER_P3_V1 — pattern éprouvé, copier-coller

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/data/blocks.v1.json` | 125 blocs — source de vérité blocs |
| `src/data/exercices.v1.json` | 155 exercices — source de vérité exercices |
| `src/data/sessionRecipes.v1.ts` | 22 recettes — structure des sessions (**à modifier**) |
| `src/services/program/positionPreferences.v1.ts` | Scoring par poste (6 postes, +5/-2) |
| `src/services/program/selectEligibleBlocks.ts` | Filtrage éligibilité (equipment, level, contraindications) |
| `src/services/program/buildSessionFromRecipe.ts` | Remplissage slots, scoring, fallback chain |
| `src/services/program/programPhases.v1.ts` | Phase preferences (+3 par tag match) |
| `src/services/program/validationMetier.test.ts` | 14 profils × 6 semaines, tests de non-régression |
| `src/knowledge/strength-methods.md` | KB — §4.3 French Contrast, §4.4 Contrast Sets, niveaux de progression plyo |

### Technical Decisions

- **Micro-évolution recettes (Option B)** : ajout d'un slot `{ intent: 'contrast', required: false }` sur 5 recettes starter/builder. Justification détaillée ci-dessous.
- **Lot 0 petit et vérifiable** : chaque ajout correspond à 1 gap métier explicite
- **Lot 2 séparé** : backfill indépendant, implémentable sans Lot 0 ou 1
- **Sources croisées** : docx utilisé comme source prioritaire mais filtré par pertinence rugby S&C
- **Stratégie scoring** : nouveaux blocs gym-starter doivent porter tags ≥ blocs BW pour gagner
- **Tags position** : utiliser le vocabulaire existant des positionPreferTags sur les nouveaux blocs

### Décision architecturale : Option B — Slot contrast dans les recettes

#### Pourquoi Option B (slot contrast dans recettes) est préférable à Option A (contrast caché dans blocs hypertrophy)

| Critère | Option A — Data-only pur | Option B — Micro-évolution recettes |
|---------|--------------------------|-------------------------------------|
| **Routing moteur** | Le moteur ne sait pas que c'est un contrast set. Le bloc est traité comme hypertrophy. | Le moteur route correctement vers l'intent `contrast`. Le slot est dédié. |
| **Scoring phase** | Pas de bonus phase POWER (+3 pour `contrast`). Le bloc contrast caché dans un slot hypertrophy ne bénéficie pas du scoring phase. | Bonus phase POWER appliqué correctement (+3 pour tag `contrast`). |
| **Cohérence séance** | Un bloc avec des sauts dans un slot "hypertrophy" est sémantiquement incohérent. | Chaque slot a un intent clair. La séance est lisible. |
| **Fallback** | Si le bloc contrast/hypertrophy hybride n'est pas éligible, le fallback cherche un autre bloc hypertrophy → la séance perd une de ses 2 plages hypertrophy. | Si aucun bloc contrast n'est éligible, le slot optionnel est simplement ignoré. La séance conserve ses 2 plages hypertrophy intactes. |
| **Précédent codebase** | Aucun — ce serait un hack nouveau. | REHAB_UPPER_P3_V1 et REHAB_LOWER_P3_V1 utilisent déjà `{ intent: 'contrast', required: false }`. Pattern éprouvé. |
| **Volume de code** | 0 ligne TS | ~15 lignes TS (5 recettes × 3 lignes : slot + slotFocusTags + commentaire) |
| **Risque de régression** | Élevé — blocs hybrides pourraient prendre la place de vrais blocs hypertrophy dans le scoring. | Faible — slot optionnel, si vide la séance reste identique à aujourd'hui. |

**Verdict** : Option B est la seule façon propre de faire exister les contrast sets à tous les niveaux sans hacker le moteur. Le pattern est déjà éprouvé dans la codebase.

#### Garde-fous Option B

1. **Le slot contrast doit rester optionnel** (`required: false`) — si aucun bloc contrast éligible n'existe pour un profil, la séance reste cohérente sans lui.
2. **Le slot ne doit pas surcharger le volume** — il est placé APRÈS les slots hypertrophy, pas à la place.
3. **Pas d'haltérophilie complète au starter** — les blocs contrast starter utilisent uniquement BW, med ball, ou band.
4. **Chaque bloc contrast doit passer le test de transfert rugby** (4 questions) — pas de fitness explosif générique.
5. **La lisibilité de la séance ne doit pas souffrir** — un joueur starter voit "squat → saut" avec une explication claire, pas une séance surchargée de 12 exercices.

### Garde-fous métier — Ligne directrice rugby (verrouillée)

#### Fondamentaux physiques rugby (5 exigences universelles, tout joueur)

| Fondamental | Situation de match | Pattern moteur primaire |
|---|---|---|
| **Bracing / rigidité tronc** | Contact (plaquage, ruck, mêlée) → tronc verrouillé pour transmettre force et protéger le rachis | Anti-extension, anti-rotation, anti-flexion latérale |
| **Triple extension** (cheville-genou-hanche) | Accélération, plaquage offensif, poussée en mêlée, saut en touche | Squat, hinge, clean derivatives |
| **Décélération / absorption** | Plaquage défensif, changement de direction, réception de saut | Excentrique contrôlé, landing, lunge |
| **Poussée / traction horizontale** | Contact direct (plaquage, ruck clear-out, mêlée liée) | Push horizontal, pull horizontal, carry |
| **Robustesse cervicale / ceinture scapulaire** | Zone de contact primaire au rugby. La robustesse cervicale contribue à la préparation au contact et à la tolérance mécanique | Neck isometric, trap/rhomboid, scapular stability |

#### Signatures physiques par poste (référence pour la différenciation)

**FRONT ROW** (pilier, talonneur) — Force isométrique + robustesse contact
- Mêlée liée (8-12 engagements/match, 5-8s) → force isométrique horizontale maximale en position fléchie
- Ruck/maul (15-25/match) → carry lourd, trunk bracing max
- Plaquage frontal dominant → robustesse cervicale/épaule
- **Contrast starter** : squat BW → squat jump (transfert poussée en mêlée)
- Tags discriminants : `scrum`, `neck`, `contact`, `carry`, `hinge`, `posterior_chain`

**SECOND ROW** (2e ligne) — Hybride force-puissance + endurance de force
- Touche (saut assisté, 6-12/match) → triple extension explosive + stabilité aérienne
- Ruck (le plus impliqué, 20-30/match) → posterior chain endurance, hip hinge répété
- Porteur de balle en collision → trunk bracing + carry
- **Contrast starter** : squat BW → vertical jump (transfert touche)
- Patterns de puissance privilégiés (Lot 1) : jump shrug, med ball throw, landmine press, trap-bar jump si disponible
- Tags discriminants : `carry`, `hinge`, `posterior_chain`, `power`, `contact`, `trunk`

**BACK THREE** (ailier, arrière) — Vitesse-puissance + stiffness + capacité excentrique
- Sprint maximal (4-8 sprints >90% Vmax/match) → stiffness cheville + rate of force development
- Accélération (20-40/match) → triple extension explosive 0-10m
- Changement de direction (15-25/match) → décélération unilatérale + réaccélération
- Plaquage haute vélocité → excentrique hamstring, hip stability
- **Contrast starter** : lunge BW → split jump BW (transfert accélération + changement d'appui)
- Tags discriminants : `speed`, `acceleration`, `unilateral`, `posterior_chain`, `plyo`

#### Starter full gym — 6 patrons moteurs fondamentaux sous charge

| Qualité | Exercice salle simple et sûr | Transfert rugby |
|---|---|---|
| Force squat | Goblet squat (DB) → Back squat (BB) | Triple extension (mêlée, plaquage, accélération) |
| Force hinge | RDL dumbbell → Deadlift conventionnel | Posterior chain (protection hamstring + force poussée) |
| Push horizontal | DB bench press → Barbell bench press | Ruck clear-out, fend-off, plaquage offensif |
| Pull horizontal | DB row → Barbell row | Grappling ruck, plaquage, équilibre push/pull |
| Trunk bracing sous charge | Farmer's carry DB, Pallof press | Rigidité contact, protection rachis |
| Robustesse cervicale | Neck isometric (aucun équipement) | Préparation au contact, tolérance mécanique |

#### Starter contrast — Familles de contrast sets recommandées

| Famille | Mouvement force (prime) | Mouvement explosif (contrast) | Transfert rugby | Equipment min |
|---------|------------------------|------------------------------|----------------|---------------|
| **Squat → Jump** | Squat BW / Goblet squat | Squat jump BW | Triple extension : accélération, poussée mêlée, plaquage offensif | none |
| **Hinge → Jump horizontal** | Glute bridge BW | Broad jump BW | Posterior chain explosive : sprint, détente horizontale, plaquage | none |
| **Push → Throw** | Push-up standard | Med ball chest pass mur | Push explosif horizontal : ruck clear-out, fend-off, poussée contact | med_ball |
| **Lunge → Split jump** | Reverse lunge BW | Split jump BW | Changement d'appui explosif : sidestep, accélération latérale | none |

**Limitation BW-only upper** : aucun contrast set upper sûr n'est possible en BW pur (les plyo push-ups sont intermédiaires et contre-indiquées pour shoulder_pain). Le med ball chest pass est la seule option sûre pour un upper contrast starter → **nécessite med_ball**.

#### Exclusions Lot 0

| Catégorie exclue | Raison | Nuance |
|---|---|---|
| Isolation esthétique (curl, extension triceps, lateral raise) | Pas de transfert rugby direct nommable | Pourrait être accessoire dans un contexte builder/perf |
| Hypertrophie sans intent fonctionnel | Ne doit pas structurer le Lot 0 | Mouvements composés = OK |
| Machines guidées | Pas une priorité du Lot 0 | Accessoires dans d'autres contextes |
| Mouvements olympiques complets (clean, snatch) | Trop techniques pour starter, risque blessure | Variantes simplifiées acceptables à builder+ |
| Cardio steady-state | Le rugby est intermittent | Conditionnement spécifique = intervalles |
| Depth jump / drop jump | Trop avancé (stiffness cheville requise) | Réservé à performance |
| French Contrast Method | 4 exercices enchaînés, avancé | Réservé à performance, requiert maîtrise technique |

#### Test de transfert rugby — Filtre obligatoire pour chaque ajout

| # | Question | Si NON → rejet |
|---|---|---|
| 1 | **Situation de match** : Peut-on nommer ≥1 situation de match rugby où cette qualité est requise ? | Pas de transfert terrain |
| 2 | **Pattern moteur** : Le mouvement reproduit-il un schéma biomécanique du rugby (poussée, traction, bracing, triple extension, absorption) ? | Exercice analytique sans transfert |
| 3 | **Spécificité poste** : Si tagué pour un poste, le joueur de CE poste fait-il réellement PLUS de ce geste que les autres en match ? | Tag cosmétique, pas discriminant |
| 4 | **Risque/bénéfice starter** : Si niveau starter, un joueur sans expérience peut-il l'exécuter en sécurité avec une technique raisonnable ? | Trop technique/risqué pour débutant |

#### Critère de crédibilité coach

Le spec doit permettre de générer des séances dont un préparateur physique rugby dirait :
> "Oui, cette séance ressemble à une vraie séance rugby par poste/niveau"

Signaux de crédibilité :
- Patrons moteurs composés (squat, hinge, push, pull, carry) comme structure principale
- **Composante force→vitesse visible à tous les niveaux** (contrast sets adaptés)
- Tags de poste reflétant des exigences de match quantifiables (GPS, video analysis)
- Progression logique starter → builder → performance (complexité du contrast, pas juste "plus de volume")
- Robustesse cervicale systématique (spécificité rugby vs autres sports)

Signaux de dérive fitness :
- Bloc construit autour d'isolation ou de machines
- Tag de poste sur un exercice universel (ex: "front_row" sur un plank)
- Hypertrophie volume-driven sans intent fonctionnel nommé
- Ajout d'exercice sans gap métier identifié ("on ajoute parce qu'il manque")
- **Contrast set "explosif" sans transfert terrain nommable** (ex: jumping jacks)

## Implementation Plan

### Limitation technique identifiée (transparence)

Le scoring moteur est **tag-driven, pas equipment-driven**. Un bloc BW (`equipment: ["none"]`) passe le filtre pour TOUT profil, y compris un starter full gym. Pour qu'un nouveau bloc gym surclasse un bloc BW existant, il doit porter des tags supplémentaires scoring-relevants.

**Stratégie retenue** : Les nouveaux blocs gym-starter portent des tags position-relevant (`contact`, `carry`, `trunk`, `posterior_chain`, etc.) justifiés par les exercices qu'ils contiennent. Résultat :
- Un starter + gym + position définie → blocs gym gagnent via position scoring (+5 par tag match)
- Un starter + BW only → blocs BW seuls dans le pool (blocs gym filtrés par equipment)
- Un starter + gym + AUCUNE position → tiebreaker alphabétique (limitation acceptée P0)

---

### Lot 0 — P0-a : Starter Full Gym (5 blocs hypertrophy + 0-2 exercices)

#### Pré-requis : vérifier les exercices existants et créer les manquants

- [ ] **Task 0.1** : Vérifier l'existence dans `exercices.v1.json` des exercices nécessaires
  - File: `src/data/exercices.v1.json`
  - Exercices attendus (déjà présents) :
    - `squat__goblet_squat__dumbbell` (DB goblet squat) ✓
    - `hinge__rdl__dumbbell` (RDL haltères) ✓
    - `squat__back_squat__barbell` (back squat barre) ✓
    - `hinge__rdl__barbell` (RDL barre) ✓
    - `push_horizontal__bench_press__barbell` (bench press barre) ✓
  - Exercices à vérifier / créer si absents :
    - `push_horizontal__bench_press__dumbbell` (bench press haltères)
    - `pull_horizontal__dumbbell_row__single_arm` (DB row unilatéral)
  - Action: Si absents, les créer en respectant le schema (voir Task 0.2)

- [ ] **Task 0.2** : Créer les exercices manquants
  - File: `src/data/exercices.v1.json`
  - **Exercice 1** : DB Bench Press (si absent)
    ```json
    {
      "id": "push_horizontal__bench_press__dumbbell",
      "exerciseId": "push_horizontal__bench_press__dumbbell",
      "name": "Développé couché haltères",
      "nameFr": "Développé couché haltères",
      "pattern": "push_horizontal",
      "equipment": ["dumbbell", "bench"],
      "contraindications": ["shoulder_pain", "elbow_pain"],
      "level": "beginner",
      "metricType": "load_reps",
      "tags": ["upper", "push", "starter"],
      "notes": "Haltères au-dessus des pectoraux, coudes à 45°. Plus sûr que la barre pour débutants (chaque bras indépendant, bail-out facile).",
      "defaultNotes": "Coudes à 45°. Descente contrôlée 2s. Pas de rebond."
    }
    ```
    - Transfert rugby : push horizontal (ruck clear-out, fend-off). Haltères = plus sûr pour starter.
  - **Exercice 2** : DB Row unilatéral (si absent)
    ```json
    {
      "id": "pull_horizontal__dumbbell_row__single_arm",
      "exerciseId": "pull_horizontal__dumbbell_row__single_arm",
      "name": "Rowing haltère unilatéral",
      "nameFr": "Rowing haltère unilatéral",
      "pattern": "pull_horizontal",
      "equipment": ["dumbbell", "bench"],
      "contraindications": ["low_back_pain"],
      "level": "beginner",
      "tags": ["upper", "pull", "unilateral", "starter"],
      "metricType": "load_reps",
      "notes": "Un genou et une main sur le banc. Tirer le coude vers la hanche. Dos neutre, pas de rotation du tronc.",
      "defaultNotes": "Omoplate en premier. Coude vers la hanche. Contrôle excentrique 2s."
    }
    ```
    - Transfert rugby : pull horizontal unilatéral (grappling au ruck, résistance au contact latéral).

#### P0-a — Blocs starter gym (5 blocs hypertrophy)

Stratégie de nommage : `BLK_STR_HP_A_GYM_xx` pour identifier les blocs gym-starter. Le préfixe ne change pas le scoring (seuls les tags comptent).

- [ ] **Task 1.1** : Créer bloc `BLK_STR_HP_A_GYM_01` — Upper push-pull haltères
  - File: `src/data/blocks.v1.json`
  - Gap comblé : starter avec dumbbell+bench → programme upper identique au BW actuellement
  - ```json
    {
      "blockId": "BLK_STR_HP_A_GYM_01",
      "name": "Push-Pull Horizontal — Développé couché + Rowing haltère",
      "intent": "hypertrophy",
      "tags": ["starter", "upper", "push", "pull", "hypertrophy", "contact", "horizontal"],
      "equipment": ["dumbbell", "bench"],
      "contraindications": ["shoulder_pain", "elbow_pain"],
      "exercises": [
        { "exerciseId": "push_horizontal__bench_press__dumbbell", "role": "prime", "notes": "Haltères au-dessus des pectoraux, coudes à 45°, descente 2s contrôlée" },
        { "exerciseId": "pull_horizontal__dumbbell_row__single_arm", "role": "superset_partner", "notes": "Alterner bras droit/gauche. Omoplate d'abord, coude vers la hanche" }
      ],
      "versions": [
        { "versionId": "W1", "sets": 3, "scheme": { "kind": "reps", "reps": "8-10" }, "restSeconds": 90, "rer": 4 },
        { "versionId": "W2", "sets": 3, "scheme": { "kind": "reps", "reps": "10-12" }, "restSeconds": 90, "rer": 3 },
        { "versionId": "W3", "sets": 4, "scheme": { "kind": "reps", "reps": "10-12" }, "restSeconds": 90, "rer": 3 },
        { "versionId": "W4", "sets": 2, "scheme": { "kind": "reps", "reps": "8-10" }, "restSeconds": 90, "rer": 5 }
      ],
      "coachingNotes": "Développé couché haltères puis rowing unilatéral sans repos. Repos 90s après la paire. Les haltères permettent une amplitude plus naturelle que la barre. Chaque bras travaille indépendamment = correction des asymétries."
    }
    ```
  - **Scoring** : tags `contact` → +5 pour FRONT_ROW, SECOND_ROW, BACK_ROW, CENTERS.
  - **Transfert rugby** : Q1 ruck clear-out + grappling ✓ | Q2 push/pull horizontal ✓ | Q3 contact = tous avants ✓ | Q4 DB = sûr débutant ✓

- [ ] **Task 1.2** : Créer bloc `BLK_STR_HP_A_GYM_02` — Upper push-pull barre
  - File: `src/data/blocks.v1.json`
  - Gap comblé : starter avec barbell+bench → plus de charge possible que DB
  - ```json
    {
      "blockId": "BLK_STR_HP_A_GYM_02",
      "name": "Push-Pull Horizontal — Bench Press + Barbell Row",
      "intent": "hypertrophy",
      "tags": ["starter", "upper", "push", "pull", "hypertrophy", "contact", "force"],
      "equipment": ["barbell", "bench"],
      "contraindications": ["shoulder_pain", "elbow_pain", "wrist_pain"],
      "exercises": [
        { "exerciseId": "push_horizontal__bench_press__barbell", "role": "prime", "notes": "Prise légèrement plus large que les épaules. Pause 1s sur la poitrine." },
        { "exerciseId": "pull_horizontal__barbell_row__pronated", "role": "superset_partner", "notes": "Buste à ~45°, tirer vers le nombril. Dos neutre absolument." }
      ],
      "versions": [
        { "versionId": "W1", "sets": 3, "scheme": { "kind": "reps", "reps": "8-10" }, "restSeconds": 120, "rer": 4 },
        { "versionId": "W2", "sets": 3, "scheme": { "kind": "reps", "reps": "8-10" }, "restSeconds": 120, "rer": 3 },
        { "versionId": "W3", "sets": 4, "scheme": { "kind": "reps", "reps": "8" }, "restSeconds": 120, "rer": 2 },
        { "versionId": "W4", "sets": 2, "scheme": { "kind": "reps", "reps": "8" }, "restSeconds": 120, "rer": 5 }
      ],
      "coachingNotes": "Bloc barre : développé couché + rowing barre. Charge plus lourde que les haltères = transfert force contact. Supervision recommandée pour le bench press à la barre."
    }
    ```
  - **Scoring** : tags `contact`(+5 avants) + `force`(+3 phase FORCE).
  - **Vérification** : `pull_horizontal__barbell_row__pronated` doit exister dans exercices.v1.json.
  - **Transfert rugby** : Q1 collision prep ✓ | Q2 push/pull ✓ | Q3 contact avants ✓ | Q4 barre = supervision recommandée ✓

- [ ] **Task 1.3** : Créer bloc `BLK_STR_HP_L_GYM_01` — Lower squat-hinge haltères
  - File: `src/data/blocks.v1.json`
  - Gap comblé : starter avec dumbbell → goblet squat + RDL DB vs BW squat + hip thrust
  - ```json
    {
      "blockId": "BLK_STR_HP_L_GYM_01",
      "name": "Squat-Hinge — Goblet Squat + RDL Haltères",
      "intent": "hypertrophy",
      "tags": ["starter", "lower", "squat", "hinge", "posterior_chain", "hypertrophy", "carry"],
      "equipment": ["dumbbell"],
      "contraindications": ["knee_pain", "low_back_pain"],
      "exercises": [
        { "exerciseId": "squat__goblet_squat__dumbbell", "role": "prime", "notes": "Haltère au sternum. Descendre entre les genoux. Auto-correction posturale." },
        { "exerciseId": "hinge__rdl__dumbbell", "role": "superset_partner", "notes": "Haltères longent les cuisses. Dos neutre. S'arrêter quand les ischios sont tendus." }
      ],
      "versions": [
        { "versionId": "W1", "sets": 3, "scheme": { "kind": "reps", "reps": "10-12" }, "restSeconds": 90, "rer": 4 },
        { "versionId": "W2", "sets": 3, "scheme": { "kind": "reps", "reps": "12" }, "restSeconds": 90, "rer": 3 },
        { "versionId": "W3", "sets": 4, "scheme": { "kind": "reps", "reps": "10" }, "restSeconds": 90, "rer": 3 },
        { "versionId": "W4", "sets": 2, "scheme": { "kind": "reps", "reps": "10" }, "restSeconds": 90, "rer": 5 }
      ],
      "coachingNotes": "Goblet squat = le meilleur mouvement d'apprentissage squat. Le poids devant force le torse haut. RDL haltères = charnière de hanche sous charge."
    }
    ```
  - **Scoring** : tag `carry`(+5 avants) + `posterior_chain`(+5 FRONT_ROW, SECOND_ROW, BACK_THREE).
  - **Transfert rugby** : Q1 triple extension + posterior chain ✓ | Q2 squat + hinge ✓ | Q3 carry/posterior_chain ✓ | Q4 goblet = très sûr ✓

- [ ] **Task 1.4** : Créer bloc `BLK_STR_HP_L_GYM_02` — Lower squat-hinge barre
  - File: `src/data/blocks.v1.json`
  - Gap comblé : starter avec barbell → back squat + RDL barre = fondamentaux force max
  - ```json
    {
      "blockId": "BLK_STR_HP_L_GYM_02",
      "name": "Squat-Hinge — Back Squat + RDL Barre",
      "intent": "hypertrophy",
      "tags": ["starter", "lower", "squat", "hinge", "posterior_chain", "hypertrophy", "force", "contact"],
      "equipment": ["barbell"],
      "contraindications": ["knee_pain", "low_back_pain"],
      "exercises": [
        { "exerciseId": "squat__back_squat__barbell", "role": "prime", "notes": "Barre haute sur les trapèzes. Descendre sous la parallèle. Le roi du rugby S&C." },
        { "exerciseId": "hinge__rdl__barbell", "role": "superset_partner", "notes": "Barre devant les cuisses. Reculer les hanches. Dos neutre absolument." }
      ],
      "versions": [
        { "versionId": "W1", "sets": 3, "scheme": { "kind": "reps", "reps": "8-10" }, "restSeconds": 120, "rer": 4 },
        { "versionId": "W2", "sets": 3, "scheme": { "kind": "reps", "reps": "8-10" }, "restSeconds": 120, "rer": 3 },
        { "versionId": "W3", "sets": 4, "scheme": { "kind": "reps", "reps": "8" }, "restSeconds": 120, "rer": 2 },
        { "versionId": "W4", "sets": 2, "scheme": { "kind": "reps", "reps": "8" }, "restSeconds": 120, "rer": 5 }
      ],
      "coachingNotes": "Back squat + RDL barre : fondamentaux du bas du corps pour le rugby. Supervision recommandée."
    }
    ```
  - **Scoring** : tags `force`(+3 phase FORCE) + `contact`(+5 avants) + `posterior_chain`(+5 FRONT_ROW, SECOND_ROW, BACK_THREE).
  - **Transfert rugby** : Q1 mêlée, sprint, plaquage ✓ | Q2 squat + hinge ✓ | Q3 contact/force ✓ | Q4 barre = supervision ✓

- [ ] **Task 1.5** : Créer bloc `BLK_STR_CORE_GYM_01` — Core trunk bracing sous charge
  - File: `src/data/blocks.v1.json`
  - Gap comblé : 2 blocs core starter BW seulement → zéro core avec charge/résistance
  - ```json
    {
      "blockId": "BLK_STR_CORE_GYM_01",
      "name": "Core contact — Pallof Press + Farmer Carry",
      "intent": "core",
      "tags": ["starter", "core", "trunk", "carry", "anti_rotation", "contact"],
      "equipment": ["band", "dumbbell"],
      "contraindications": [],
      "exercises": [
        { "exerciseId": "core_anti_rotation__pallof_press__band", "role": "prime", "notes": "Bras tendus devant le sternum. Résister à la rotation. 3s hold en extension." },
        { "exerciseId": "carry__farmer_carry__dumbbell", "role": "superset_partner", "notes": "Haltères lourds, bras le long du corps. Marcher droit 30m. Épaules basses, tronc verrouillé." }
      ],
      "versions": [
        { "versionId": "W1", "sets": 3, "scheme": { "kind": "reps", "reps": "10/side + 30m" }, "restSeconds": 60, "rer": 4 },
        { "versionId": "W2", "sets": 3, "scheme": { "kind": "reps", "reps": "12/side + 30m" }, "restSeconds": 60, "rer": 3 },
        { "versionId": "W3", "sets": 3, "scheme": { "kind": "reps", "reps": "12/side + 40m" }, "restSeconds": 60, "rer": 3 },
        { "versionId": "W4", "sets": 2, "scheme": { "kind": "reps", "reps": "10/side + 30m" }, "restSeconds": 60, "rer": 5 }
      ],
      "coachingNotes": "Anti-rotation + carry = les deux qualités core les plus utiles au rugby."
    }
    ```
  - **Scoring** : tags `trunk`(+5 SECOND_ROW, HALF_BACKS, CENTERS) + `carry`(+5 avants) + `contact`(+5 avants+centers).
  - **Vérification** : confirmer l'existence de `core_anti_rotation__pallof_press__band` et `carry__farmer_carry__dumbbell`.
  - **Transfert rugby** : Q1 ruck/maul ✓ | Q2 anti-rotation + carry ✓ | Q3 trunk/carry avants ✓ | Q4 très sûrs ✓

#### Résumé P0-a

| Bloc | Intent | Equipment | Tags différenciants | Position favorisée |
|------|--------|-----------|--------------------|--------------------|
| BLK_STR_HP_A_GYM_01 | hypertrophy | dumbbell, bench | contact | Avants, Centers |
| BLK_STR_HP_A_GYM_02 | hypertrophy | barbell, bench | contact, force | Avants (phase Force) |
| BLK_STR_HP_L_GYM_01 | hypertrophy | dumbbell | carry, posterior_chain | Avants, Backs |
| BLK_STR_HP_L_GYM_02 | hypertrophy | barbell | force, contact, posterior_chain | Front row +++ |
| BLK_STR_CORE_GYM_01 | core | band, dumbbell | trunk, carry, contact | Avants +++ |

**Total P0-a : 5 blocs + 0-2 exercices** (selon vérification existants).

---

### Lot 0 — P0-b : Contrast Sets à tous les niveaux (recettes + 6 blocs)

#### Task 2.0 — Modifier les recettes starter/builder (sessionRecipes.v1.ts)

- [ ] **Task 2.0** : Ajouter un slot `{ intent: 'contrast', required: false }` sur 5 recettes
  - File: `src/data/sessionRecipes.v1.ts`
  - **Pattern à copier** : identique à REHAB_UPPER_P3_V1 / REHAB_LOWER_P3_V1 (slot contrast optionnel)
  - **Position du slot** : APRÈS activation, AVANT les slots hypertrophy. Raison : le travail explosif doit être exécuté quand le système nerveux central est au plus frais — après l'activation (qui prépare le SNC) mais avant les blocs hypertrophy (qui fatiguent le SNC et les muscles). C'est la séquence canonique en prépa physique rugby : activation → explosif/puissance → force/hypertrophy → accessoires.
  - **Justification scientifique** : KB `strength-methods.md` §4.3-4.4 — le travail de puissance/PAP requiert un SNC non fatigué. Placer le contrast après l'hypertrophy serait contre-productif (qualité explosive dégradée par la fatigue accumulée).

  **Recette 1 — UPPER_STARTER_V1** (Full Body A — Débutant) :
  ```typescript
  // AVANT :
  sequence: [
    { intent: 'warmup', required: false },     // slot 0
    { intent: 'activation', required: true },   // slot 1
    { intent: 'hypertrophy', required: true },  // slot 2 — upper
    { intent: 'hypertrophy', required: true },  // slot 3 — lower
    { intent: 'core', required: false },        // slot 4
    { intent: 'cooldown', required: false }     // slot 5
  ],
  slotFocusTags: [null, ['upper'], ['upper'], ['lower'], null, null]

  // APRÈS :
  sequence: [
    { intent: 'warmup', required: false },     // slot 0
    { intent: 'activation', required: true },   // slot 1
    { intent: 'contrast', required: false },    // slot 2 — explosif quand SNC frais
    { intent: 'hypertrophy', required: true },  // slot 3 — upper
    { intent: 'hypertrophy', required: true },  // slot 4 — lower
    { intent: 'core', required: false },        // slot 5
    { intent: 'cooldown', required: false }     // slot 6
  ],
  slotFocusTags: [null, ['upper'], ['lower', 'upper', 'power'], ['upper'], ['lower'], null, null]
  ```
  - **slotFocusTags du slot contrast** : `['lower', 'upper', 'power']` — ouvert aux deux. Le scoring position déterminera si le joueur reçoit un contrast lower (avants) ou upper (si med_ball disponible).

  **Recette 2 — LOWER_STARTER_V1** (Full Body B — Débutant) :
  ```typescript
  // APRÈS :
  sequence: [
    { intent: 'warmup', required: false },     // slot 0
    { intent: 'activation', required: true },   // slot 1
    { intent: 'contrast', required: false },    // slot 2 — explosif quand SNC frais
    { intent: 'hypertrophy', required: true },  // slot 3 — lower
    { intent: 'hypertrophy', required: true },  // slot 4 — upper
    { intent: 'core', required: false },        // slot 5
    { intent: 'cooldown', required: false }     // slot 6
  ],
  slotFocusTags: [null, ['lower'], ['lower', 'upper', 'power'], ['lower'], ['upper'], null, null]
  ```

  **Recette 3 — UPPER_BUILDER_V1** (Upper — Supersets) :
  ```typescript
  // APRÈS :
  sequence: [
    { intent: 'warmup', required: false },     // slot 0
    { intent: 'activation', required: true },   // slot 1
    { intent: 'contrast', required: false },    // slot 2 — explosif upper quand SNC frais
    { intent: 'hypertrophy', required: true },  // slot 3 — superset push/pull horizontal
    { intent: 'hypertrophy', required: true },  // slot 4 — superset push/pull vertical
    { intent: 'core', required: false },        // slot 5
    { intent: 'cooldown', required: false }     // slot 6
  ],
  slotFocusTags: [null, ['upper'], ['upper', 'power'], ['upper', 'push', 'horizontal'], ['upper', 'pull', 'vertical', 'horizontal'], null, null]
  ```

  **Recette 4 — LOWER_BUILDER_V1** (Lower — Supersets) :
  ```typescript
  // APRÈS :
  sequence: [
    { intent: 'warmup', required: false },     // slot 0
    { intent: 'activation', required: true },   // slot 1
    { intent: 'contrast', required: false },    // slot 2 — explosif lower quand SNC frais
    { intent: 'hypertrophy', required: true },  // slot 3 — superset squat / hinge
    { intent: 'hypertrophy', required: true },  // slot 4 — superset unilateral / posterior chain
    { intent: 'prehab', required: false },      // slot 5
    { intent: 'cooldown', required: false }     // slot 6
  ],
  slotFocusTags: [null, ['lower'], ['lower', 'power'], ['lower', 'squat'], ['lower', 'hinge', 'unilateral'], null, null]
  ```

  **Recette 5 — FULL_BUILDER_V1** (Full Body — Supersets) :
  ```typescript
  // APRÈS :
  sequence: [
    { intent: 'warmup', required: false },     // slot 0
    { intent: 'activation', required: true },   // slot 1
    { intent: 'contrast', required: false },    // slot 2 — explosif quand SNC frais
    { intent: 'hypertrophy', required: true },  // slot 3 — superset upper push/pull
    { intent: 'hypertrophy', required: true },  // slot 4 — superset lower squat/hinge
    { intent: 'core', required: false },        // slot 5
    { intent: 'cooldown', required: false }     // slot 6
  ],
  slotFocusTags: [null, ['upper', 'lower'], ['lower', 'full', 'power'], ['upper'], ['lower'], null, null]
  ```

  **Résumé modifications recettes :**

  | Recette | Slot ajouté | Position dans la séquence | slotFocusTags contrast | Impact si aucun bloc contrast éligible |
  |---------|-------------|--------------------------|----------------------|----------------------------------------|
  | UPPER_STARTER_V1 | contrast, required: false | slot 2 (après activation, avant hyper) | ['lower', 'upper', 'power'] | Slot ignoré silencieusement — séance identique à aujourd'hui |
  | LOWER_STARTER_V1 | contrast, required: false | slot 2 (après activation, avant hyper) | ['lower', 'upper', 'power'] | Slot ignoré silencieusement — séance identique à aujourd'hui |
  | UPPER_BUILDER_V1 | contrast, required: false | slot 2 (après activation, avant hyper) | ['upper', 'power'] | Slot ignoré silencieusement — séance identique à aujourd'hui |
  | LOWER_BUILDER_V1 | contrast, required: false | slot 2 (après activation, avant hyper) | ['lower', 'power'] | Slot ignoré silencieusement — séance identique à aujourd'hui |
  | FULL_BUILDER_V1 | contrast, required: false | slot 2 (après activation, avant hyper) | ['lower', 'full', 'power'] | Slot ignoré silencieusement — séance identique à aujourd'hui |

  **Volume de code** : ~15 lignes modifiées dans `sessionRecipes.v1.ts`. Aucun autre fichier TS touché.

  #### Comportement fallback — Slot contrast vide (verrouillé)

  Le slot `contrast` est **strictement optionnel** (`required: false`). Le moteur existant gère déjà ce cas dans `buildSessionFromRecipe` : quand un slot optionnel ne trouve aucun bloc éligible, il est **ignoré silencieusement** — aucun bloc n'est inséré, aucun avertissement n'est émis.

  **Garanties :**
  - **Pas de warning artificiel** : aucun message "bloc contrast manquant" n'est affiché à l'utilisateur. Le slot vide est invisible dans la séance.
  - **Pas de dégradation du volume** : les slots `hypertrophy` (required: true) sont indépendants du slot contrast. Qu'il soit rempli ou vide, les 2 blocs hypertrophy sont toujours présents.
  - **Pas de dégradation de la durée** : la séance sans contrast est strictement identique à la séance actuelle (avant cette évolution). Le contrast ajoute au maximum 1 bloc (~5-8 min), jamais plus.
  - **Pas de trou visuel** : le moteur n'affiche pas de placeholder vide. Le slot optionnel non rempli n'existe tout simplement pas dans le résultat rendu au joueur.
  - **Cohérence structurelle préservée** : activation → hypertrophy × 2 → core → cooldown reste la colonne vertébrale de la séance. Le contrast est un bonus quand les conditions le permettent (bloc éligible ET matériel disponible).

  **Cas concrets :**
  | Profil | Slot contrast | Résultat |
  |--------|-------------|----------|
  | Starter BW-only, pas de knee_pain | `BLK_CONTRAST_LOWER_STARTER_01` rempli | Séance = activation + **squat→jump** + hyper upper + hyper lower + core |
  | Starter BW-only, avec knee_pain | Aucun bloc éligible (contra knee_pain) | Séance = activation + hyper upper + hyper lower + core (identique à aujourd'hui) |
  | Starter avec med_ball | Meilleur bloc entre lower et upper | Séance = activation + **contrast** + hyper × 2 + core |
  | Builder sans med_ball ni box | Blocs builder contrast nécessitent dumbbell/med_ball | Séance = activation + hyper × 2 + prehab/core (identique à aujourd'hui) |

#### Inventaire exercices explosifs existants réutilisables

Avant de créer des blocs contrast, inventaire des exercices explosifs **déjà présents** dans `exercices.v1.json` et utilisables au niveau starter/builder :

| exerciseId | Name | Equipment | Level | Tags | Contraindications | Utilisable starter ? |
|------------|------|-----------|-------|------|-------------------|---------------------|
| `power__squat_jump__bodyweight` | Squat jump BW | none | beginner | lower, power, squat | knee_pain, low_back_pain | ✅ Oui |
| `power__jump__vertical_jump` | Saut vertical | none | beginner | lower, power, neural | knee_pain | ✅ Oui |
| `power__jump__broad_jump` | Saut en longueur | none | beginner | lower, power, neural | knee_pain | ✅ Oui |
| `lower_jump__broad_jump__seated` | Seated broad jump | none | beginner | lower, power, neural | knee_pain | ✅ Oui |
| `power__split_jump__bodyweight` | Fente sautée | none | **intermediate** | lower, power | knee_pain, ankle_pain | ⚠️ Intermédiaire — builder+ |
| `push_horizontal__push_up__plyo` | Pompes plyo | none | **intermediate** | upper, push, power, neural | wrist_pain, shoulder_pain, elbow_pain | ⚠️ Intermédiaire, 3 contra — builder+ |
| `power__medball_chest_pass__wall` | Med ball chest pass | med_ball | beginner | upper, power, neural | aucune | ✅ Oui (si med_ball) |
| `power__medball_slam__overhead` | Med ball slam | med_ball | beginner | full, power, neural | low_back_pain | ✅ Oui (si med_ball) |
| `power__medball_rotational_throw__wall` | Lancer rotationnel | med_ball | beginner | core, power, neural | low_back_pain | ✅ Oui (si med_ball) |
| `power__jump__box_jump` | Box jump | box | beginner | lower, power | knee_pain | ✅ Builder+ (box requis) |
| `power__bound__single_leg` | Bounds unilatéraux | none | beginner | lower, power, neural, unilateral | ankle_pain | ⚠️ Technique — builder+ |

**Conclusion** : 6 exercices explosifs sont sûrs et accessibles au starter BW (les 4 premiers + 2 med ball). Aucun exercice à créer pour les blocs contrast starter BW. Pour les blocs upper contrast, le med ball chest pass est la seule option sûre.

#### P0-b — Blocs contrast starter (3 blocs)

Stratégie : **3 blocs contrast starter** couvrant les 3 familles lower/upper/full. Cross-session exclusion désactivée pour starter → 1 bloc par famille suffit.

- [ ] **Task 2.1** : Créer bloc `BLK_CONTRAST_LOWER_STARTER_01` — Squat → Jump (BW)
  - File: `src/data/blocks.v1.json`
  - Gap comblé : zéro contrast set starter. Premier bloc force→vitesse accessible débutant.
  - ```json
    {
      "blockId": "BLK_CONTRAST_LOWER_STARTER_01",
      "name": "Contrast lower débutant — Squat + Squat Jump + Broad Jump",
      "intent": "contrast",
      "tags": ["starter", "lower", "contrast", "squat", "power", "acceleration"],
      "equipment": ["none"],
      "contraindications": ["knee_pain", "low_back_pain"],
      "exercises": [
        { "exerciseId": "squat__bodyweight_squat", "role": "prime", "notes": "5 squats contrôlés, descente 2s, remontée puissante — on prépare le système nerveux." },
        { "exerciseId": "power__squat_jump__bodyweight", "role": "contrast", "notes": "3 sauts maximum. Enchaîner immédiatement après les squats. Qualité > quantité." },
        { "exerciseId": "power__jump__broad_jump", "role": "contrast", "notes": "3 sauts en longueur. Réception souple, genoux fléchis. Penser 'sprint rugby : démarrer vite'." }
      ],
      "versions": [
        { "versionId": "W1", "sets": 3, "scheme": { "kind": "reps", "reps": "5 + 3 + 3" }, "restSeconds": 120, "rer": 4 },
        { "versionId": "W2", "sets": 3, "scheme": { "kind": "reps", "reps": "5 + 3 + 3" }, "restSeconds": 120, "rer": 3 },
        { "versionId": "W3", "sets": 4, "scheme": { "kind": "reps", "reps": "5 + 3 + 3" }, "restSeconds": 120, "rer": 3 },
        { "versionId": "W4", "sets": 2, "scheme": { "kind": "reps", "reps": "5 + 3 + 3" }, "restSeconds": 120, "rer": 5 }
      ],
      "coachingNotes": "Contrast squat pour débutant : squat contrôlé → squat jump explosif → broad jump. Le cerveau apprend à transformer la force en vitesse — c'est exactement ce qui se passe quand tu accélères sur le terrain ou que tu pousses en mêlée. Repos 2min entre les séries pour la qualité. Si les sauts perdent en hauteur/distance, arrêter la série."
    }
    ```
  - **Scoring** : tags `acceleration`(+5 BACK_THREE, CENTERS) + `power`(+5 SECOND_ROW, BACK_ROW, CENTERS). Score élevé pour backs et second row.
  - **Transfert rugby** : Q1 accélération 0-10m, poussée mêlée, plaquage ✓ | Q2 triple extension ✓ | Q3 acceleration = backs ✓ | Q4 BW = très sûr ✓

- [ ] **Task 2.2** : Créer bloc `BLK_CONTRAST_UPPER_STARTER_01` — Push → Throw (**nécessite med_ball**)
  - File: `src/data/blocks.v1.json`
  - Gap comblé : zéro contrast upper starter. Premier bloc push explosif.
  - **Equipment gate** : ce bloc requiert `med_ball`. Il n'est **PAS accessible en BW-only**. Un starter sans med_ball ne recevra jamais ce bloc (filtré par equipment pass/fail). Aucun exercice upper explosif sûr n'existe en BW pur pour un starter (les plyo push-ups sont intermediate + 3 contraindications).
  - ```json
    {
      "blockId": "BLK_CONTRAST_UPPER_STARTER_01",
      "name": "Contrast upper débutant — Push-up + Med Ball Chest Pass",
      "intent": "contrast",
      "tags": ["starter", "upper", "contrast", "push", "power", "contact"],
      "equipment": ["med_ball"],
      "contraindications": ["shoulder_pain", "wrist_pain"],
      "exercises": [
        { "exerciseId": "push_horizontal__push_up__standard", "role": "prime", "notes": "5 pompes contrôlées, tempo 2-0-1. On pousse le sol, pas soi-même." },
        { "exerciseId": "power__medball_chest_pass__wall", "role": "contrast", "notes": "5 lancers explosifs contre le mur. Attraper et relancer immédiatement. Penser 'repousser un adversaire au ruck'." }
      ],
      "versions": [
        { "versionId": "W1", "sets": 3, "scheme": { "kind": "reps", "reps": "5 + 5" }, "restSeconds": 90, "rer": 4 },
        { "versionId": "W2", "sets": 3, "scheme": { "kind": "reps", "reps": "5 + 6" }, "restSeconds": 90, "rer": 3 },
        { "versionId": "W3", "sets": 4, "scheme": { "kind": "reps", "reps": "5 + 6" }, "restSeconds": 90, "rer": 3 },
        { "versionId": "W4", "sets": 2, "scheme": { "kind": "reps", "reps": "5 + 5" }, "restSeconds": 90, "rer": 5 }
      ],
      "coachingNotes": "Contrast push pour débutant : pompes contrôlées → med ball chest pass explosif. La pompe active les muscles, le lancer les exprime en vitesse — même logique qu'un fend-off ou un clear-out au ruck. Repos 90s. Garder l'intention de vitesse sur chaque lancer."
    }
    ```
  - **Scoring** : tags `contact`(+5 avants+centers) + `power`(+5 SECOND_ROW, BACK_ROW, CENTERS). Favorise avants.
  - **Limitation** : nécessite med_ball. Un starter BW-only ne recevra pas ce bloc (equipment gate).
  - **Transfert rugby** : Q1 ruck clear-out, fend-off ✓ | Q2 push horizontal explosif ✓ | Q3 contact avants ✓ | Q4 push-up + med ball = très sûrs ✓

- [ ] **Task 2.3** : Créer bloc `BLK_CONTRAST_FULL_STARTER_01` — Hinge → Jump + Slam (med ball)
  - File: `src/data/blocks.v1.json`
  - Gap comblé : contrast full body starter, couvre hinge + explosif vertical
  - ```json
    {
      "blockId": "BLK_CONTRAST_FULL_STARTER_01",
      "name": "Contrast full body débutant — Glute Bridge + Broad Jump + Med Ball Slam",
      "intent": "contrast",
      "tags": ["starter", "full", "contrast", "hinge", "power", "posterior_chain"],
      "equipment": ["med_ball"],
      "contraindications": ["low_back_pain"],
      "exercises": [
        { "exerciseId": "hinge__glute_bridge__bodyweight", "role": "prime", "notes": "8 reps, serrer les fessiers en haut 2s. Activer la chaîne postérieure." },
        { "exerciseId": "power__jump__broad_jump", "role": "contrast", "notes": "3 sauts en longueur, réception souple. Penser 'sprint de 3 mètres'." },
        { "exerciseId": "power__medball_slam__overhead", "role": "contrast", "notes": "5 slams, lever haut et écraser au sol. Tronc gainé. Penser 'plaquage'." }
      ],
      "versions": [
        { "versionId": "W1", "sets": 3, "scheme": { "kind": "reps", "reps": "8 + 3 + 5" }, "restSeconds": 90, "rer": 4 },
        { "versionId": "W2", "sets": 3, "scheme": { "kind": "reps", "reps": "8 + 3 + 5" }, "restSeconds": 90, "rer": 3 },
        { "versionId": "W3", "sets": 4, "scheme": { "kind": "reps", "reps": "8 + 3 + 5" }, "restSeconds": 90, "rer": 3 },
        { "versionId": "W4", "sets": 2, "scheme": { "kind": "reps", "reps": "8 + 3 + 5" }, "restSeconds": 90, "rer": 5 }
      ],
      "coachingNotes": "Contrast full body : glute bridge (activation postérieure) → broad jump (détente horizontale) → med ball slam (puissance verticale + bracing). Trois qualités rugby en un seul bloc. Repos 90s."
    }
    ```
  - **Scoring** : tags `posterior_chain`(+5 FRONT_ROW, SECOND_ROW, BACK_THREE) + `power`(+5 SECOND_ROW, BACK_ROW, CENTERS). Large couverture postes.
  - **Transfert rugby** : Q1 sprint (posterior chain), plaquage (slam) ✓ | Q2 hinge + triple extension + bracing ✓ | Q3 posterior chain = tous ✓ | Q4 glute bridge + jump + slam = sûrs ✓

#### P0-b — Blocs contrast builder (3 blocs)

Stratégie : **3 blocs contrast builder** avec primes plus chargées (DB/BB), explosifs identiques ou légèrement plus avancés. Le tag `builder` les réserve au niveau builder uniquement.

**Note sur le level gating builder** : un bloc avec tag `builder` est exclu pour performance (qui exclut `builder`). Les 16 blocs contrast performance existants restent intacts. Un bloc SANS tag `builder` ni `starter` est accessible à builder ET performance — ici on veut des blocs spécifiques builder, donc on met le tag.

- [ ] **Task 2.4** : Créer bloc `BLK_CONTRAST_LOWER_BUILDER_01` — Goblet Squat → Jump (DB)
  - File: `src/data/blocks.v1.json`
  - Gap comblé : contrast lower builder avec prime chargée. PAP plus efficace qu'au starter.
  - ```json
    {
      "blockId": "BLK_CONTRAST_LOWER_BUILDER_01",
      "name": "Contrast lower builder — Goblet Squat + Squat Jump + Split Jump",
      "intent": "contrast",
      "tags": ["builder", "lower", "contrast", "squat", "power", "acceleration", "unilateral"],
      "equipment": ["dumbbell"],
      "contraindications": ["knee_pain", "low_back_pain"],
      "exercises": [
        { "exerciseId": "squat__goblet_squat__dumbbell", "role": "prime", "notes": "5 reps avec charge conséquente (RER 3). Descente contrôlée, remontée puissante." },
        { "exerciseId": "power__squat_jump__bodyweight", "role": "contrast", "notes": "3 squat jumps explosifs. Enchaîner dans les 15s après le goblet. Exploiter la PAP." },
        { "exerciseId": "power__split_jump__bodyweight", "role": "contrast", "notes": "3 reps/côté. Fente sautée : changement d'appui aérien. Transfert sidestep rugby." }
      ],
      "versions": [
        { "versionId": "W1", "sets": 3, "scheme": { "kind": "reps", "reps": "5 + 3 + 3/side" }, "restSeconds": 120, "rer": 4 },
        { "versionId": "W2", "sets": 3, "scheme": { "kind": "reps", "reps": "5 + 3 + 3/side" }, "restSeconds": 120, "rer": 3 },
        { "versionId": "W3", "sets": 4, "scheme": { "kind": "reps", "reps": "5 + 3 + 3/side" }, "restSeconds": 120, "rer": 3 },
        { "versionId": "W4", "sets": 2, "scheme": { "kind": "reps", "reps": "5 + 3 + 3/side" }, "restSeconds": 120, "rer": 5 }
      ],
      "coachingNotes": "Complex training simple : goblet squat chargé → squat jump BW → fente sautée. Le goblet active les quadriceps et fessiers (PAP), les sauts exploitent ce potentiel. La fente sautée ajoute la composante unilatérale pour les changements de direction. Repos 2min entre clusters."
    }
    ```
  - **Scoring** : tags `acceleration`(+5 BACK_THREE, CENTERS) + `unilateral`(+5 BACK_THREE, BACK_ROW, HALF_BACKS) + `power`(+5 SECOND_ROW, BACK_ROW, CENTERS). Très bon score backs.
  - **Transfert rugby** : Q1 accélération, changement de direction ✓ | Q2 squat + triple extension + unilatéral ✓ | Q3 acceleration/unilateral = backs ✓ | Q4 goblet + BW jumps = sûr intermédiaire ✓

- [ ] **Task 2.5** : Créer bloc `BLK_CONTRAST_UPPER_BUILDER_01` — DB Bench → Med Ball Pass (DB + med ball)
  - File: `src/data/blocks.v1.json`
  - Gap comblé : contrast upper builder avec prime chargée. PAP bench → transfert explosif push.
  - ```json
    {
      "blockId": "BLK_CONTRAST_UPPER_BUILDER_01",
      "name": "Contrast upper builder — DB Bench + Med Ball Chest Pass + Slam",
      "intent": "contrast",
      "tags": ["builder", "upper", "contrast", "push", "power", "contact"],
      "equipment": ["dumbbell", "bench", "med_ball"],
      "contraindications": ["shoulder_pain", "elbow_pain"],
      "exercises": [
        { "exerciseId": "push_horizontal__bench_press__dumbbell", "role": "prime", "notes": "5 reps charge lourde (RER 3). Descente 2s, remontée explosive." },
        { "exerciseId": "power__medball_chest_pass__wall", "role": "contrast", "notes": "5 lancers explosifs. Enchaîner < 20s après le bench. Puissance maximale." },
        { "exerciseId": "power__medball_slam__overhead", "role": "contrast", "notes": "5 slams. Full body explosive, tronc gainé. Transfert plaquage." }
      ],
      "versions": [
        { "versionId": "W1", "sets": 3, "scheme": { "kind": "reps", "reps": "5 + 5 + 5" }, "restSeconds": 120, "rer": 4 },
        { "versionId": "W2", "sets": 3, "scheme": { "kind": "reps", "reps": "5 + 5 + 5" }, "restSeconds": 120, "rer": 3 },
        { "versionId": "W3", "sets": 4, "scheme": { "kind": "reps", "reps": "5 + 5 + 5" }, "restSeconds": 120, "rer": 3 },
        { "versionId": "W4", "sets": 2, "scheme": { "kind": "reps", "reps": "5 + 5 + 5" }, "restSeconds": 120, "rer": 5 }
      ],
      "coachingNotes": "Complex training upper : bench press chargé (PAP) → chest pass explosif → slam. Le bench active les pectoraux/triceps, le chest pass les exprime en puissance horizontale (ruck), le slam ajoute la composante full body (plaquage). Repos 2min."
    }
    ```
  - **Scoring** : tags `contact`(+5 avants+centers) + `power`(+5 SECOND_ROW, BACK_ROW, CENTERS).
  - **Pré-requis** : `push_horizontal__bench_press__dumbbell` doit exister (créé dans Task 0.2 si absent).
  - **Transfert rugby** : Q1 ruck clear-out, plaquage ✓ | Q2 push horizontal + full body ✓ | Q3 contact avants ✓ | Q4 DB bench + med ball = sûr intermédiaire ✓

- [ ] **Task 2.6** : Créer bloc `BLK_CONTRAST_LOWER_BUILDER_02` — RDL → Broad Jump + Rotational Throw (DB + med ball)
  - File: `src/data/blocks.v1.json`
  - Gap comblé : contrast hinge builder. Couvre la chaîne postérieure → détente + rotation.
  - ```json
    {
      "blockId": "BLK_CONTRAST_LOWER_BUILDER_02",
      "name": "Contrast hinge builder — RDL DB + Broad Jump + Lancer Rotationnel",
      "intent": "contrast",
      "tags": ["builder", "lower", "contrast", "hinge", "posterior_chain", "power", "trunk"],
      "equipment": ["dumbbell", "med_ball"],
      "contraindications": ["low_back_pain"],
      "exercises": [
        { "exerciseId": "hinge__rdl__dumbbell", "role": "prime", "notes": "5 reps charge conséquente. Chaîne postérieure sous tension. Dos neutre." },
        { "exerciseId": "power__jump__broad_jump", "role": "contrast", "notes": "3 sauts en longueur. Extension complète hanches. Réception souple." },
        { "exerciseId": "power__medball_rotational_throw__wall", "role": "contrast", "notes": "4 lancers/côté. Rotation explosive depuis les hanches. Tronc stable." }
      ],
      "versions": [
        { "versionId": "W1", "sets": 3, "scheme": { "kind": "reps", "reps": "5 + 3 + 4/side" }, "restSeconds": 120, "rer": 4 },
        { "versionId": "W2", "sets": 3, "scheme": { "kind": "reps", "reps": "5 + 3 + 4/side" }, "restSeconds": 120, "rer": 3 },
        { "versionId": "W3", "sets": 4, "scheme": { "kind": "reps", "reps": "5 + 3 + 4/side" }, "restSeconds": 120, "rer": 3 },
        { "versionId": "W4", "sets": 2, "scheme": { "kind": "reps", "reps": "5 + 3 + 4/side" }, "restSeconds": 120, "rer": 5 }
      ],
      "coachingNotes": "Contrast hinge : RDL chargé (activation postérieure) → broad jump (triple extension horizontale) → lancer rotationnel (puissance tronc/hanches). Couvre sprint, plaquage et off-loading. Repos 2min."
    }
    ```
  - **Scoring** : tags `posterior_chain`(+5 FRONT_ROW, SECOND_ROW, BACK_THREE) + `trunk`(+5 SECOND_ROW, HALF_BACKS, CENTERS) + `power`(+5 SECOND_ROW, BACK_ROW, CENTERS). Score maximal SECOND_ROW (+15).
  - **Transfert rugby** : Q1 sprint (posterior chain), plaquage (trunk rotation), off-load (rotation) ✓ | Q2 hinge + triple extension + rotation ✓ | Q3 posterior_chain + trunk = avants + backs ✓ | Q4 RDL DB + jumps + med ball = sûr intermédiaire ✓

#### Résumé P0-b — Contrast sets à tous les niveaux

| Bloc | Niveau | Intent | Equipment | Famille | Tags scoring | Position favorisée |
|------|--------|--------|-----------|---------|-------------|-------------------|
| BLK_CONTRAST_LOWER_STARTER_01 | starter | contrast | none | Squat→Jump | acceleration, power | Backs, Centers |
| BLK_CONTRAST_UPPER_STARTER_01 | starter | contrast | med_ball | Push→Throw | contact, power | Avants, Centers |
| BLK_CONTRAST_FULL_STARTER_01 | starter | contrast | med_ball | Hinge→Jump+Slam | posterior_chain, power | Tous postes |
| BLK_CONTRAST_LOWER_BUILDER_01 | builder | contrast | dumbbell | Squat→Jump+Split | acceleration, unilateral, power | Backs |
| BLK_CONTRAST_UPPER_BUILDER_01 | builder | contrast | dumbbell, bench, med_ball | Bench→Throw+Slam | contact, power | Avants |
| BLK_CONTRAST_LOWER_BUILDER_02 | builder | contrast | dumbbell, med_ball | RDL→Jump+Rotation | posterior_chain, trunk, power | Second row +++ |

**Total P0-b : 5 recettes modifiées + 6 blocs contrast + 0 exercices à créer.**

**Nombre minimum de blocs dans le plus petit lot prudent :**
- Absolute minimum = 2 blocs (1 starter lower BW + 1 builder lower) → le contrast existe à chaque niveau, mais couverture partielle.
- **Lot recommandé = 6 blocs** (3 starter + 3 builder) → couverture complète lower/upper/full à chaque niveau, scoring par poste actif.

**Profils prioritaires pour les contrast sets :**
1. **Starter + BW only** : reçoit `BLK_CONTRAST_LOWER_STARTER_01` (seul contrast sans equipment gate). Gain immédiat : la séance a enfin une composante explosive.
2. **Starter + med_ball** : reçoit en plus `BLK_CONTRAST_UPPER_STARTER_01` et `BLK_CONTRAST_FULL_STARTER_01`.
3. **Builder + dumbbell** : reçoit `BLK_CONTRAST_LOWER_BUILDER_01` et potentiellement `BLK_CONTRAST_LOWER_BUILDER_02`.
4. **Builder + dumbbell + bench + med_ball** : reçoit les 3 blocs builder.

**Limitation BW-only upper :** Un starter sans med_ball ne reçoit AUCUN contrast upper (pas d'exercice upper explosif sûr en BW pur). Le slot contrast sera simplement vide pour ce profil. C'est acceptable cliniquement — le contrast lower est plus fondamental pour le rugby.

---

### Lot 1 — Tâches P1 : Enrichissement tags position (performance)

L'objectif est que front row, second row et back three reçoivent des sélections de blocs perceptiblement différentes. Le levier : **enrichir les tags des blocs performance existants** avec des tags position-relevant là où c'est justifié par le contenu du bloc.

- [ ] **Task 3.1** : Auditer et enrichir les tags des blocs performance existants
  - File: `src/data/blocks.v1.json`
  - Méthode : pour chaque bloc performance, vérifier si les exercices qu'il contient justifient l'ajout de tags position-relevant manquants.
  - **Règle** : un tag n'est ajouté que si les exercices du bloc correspondent au pattern moteur de ce tag (test de transfert Q2+Q3).
  - Tags cibles par poste :

  | Tag | Position(s) favorisée(s) | Critère d'attribution au bloc |
  |-----|-------------------------|-------------------------------|
  | `scrum` | FRONT_ROW (+5) | Bloc contient squat lourd isométrique / poussée horizontale basse |
  | `neck` | FRONT_ROW (+5) | Bloc contient exercice cervical |
  | `contact` | FRONT_ROW, SECOND_ROW, BACK_ROW, CENTERS (+5) | Bloc contient patterns de collision (push lourd, carry lourd, trunk) |
  | `carry` | FRONT_ROW, SECOND_ROW, BACK_ROW (+5) | Bloc contient farmer/zercher/suitcase carry ou équivalent |
  | `speed` | BACK_THREE, HALF_BACKS (+5) | Bloc contient sprint, plyométrie réactive, stiffness |
  | `acceleration` | BACK_THREE, CENTERS (+5) | Bloc contient squat jump, power clean départ bas, sled léger |
  | `unilateral` | BACK_THREE, BACK_ROW, HALF_BACKS (+5) | Bloc contient exercice unilatéral (split squat, SL RDL, lunge) |
  | `trunk` | SECOND_ROW, HALF_BACKS, CENTERS (+5) | Bloc contient anti-rotation, anti-flexion sous charge |
  | `posterior_chain` | FRONT_ROW, SECOND_ROW, BACK_THREE (+5) | Bloc contient hinge, RDL, hip thrust, Nordic |

  - **Estimation** : 15-25 blocs performance existants recevront 1-2 tags supplémentaires chacun.
  - **Blocs prioritaires à auditer** (ceux avec le plus d'impact scoring) :
    - Tous les blocs `force` et `contrast` lower → candidats pour `scrum`, `contact`, `posterior_chain`
    - Tous les blocs `neural` et `contrast` upper → candidats pour `contact`, `speed`
    - Tous les blocs `carry` → déjà bien tagués (vérifier `contact`)
    - Tous les blocs avec exercices unilatéraux → candidats pour `unilateral`

- [ ] **Task 3.2** : Créer 2-3 blocs performance position-spécifiques
  - File: `src/data/blocks.v1.json`
  - Ces blocs comblent des gaps de contenu pour lesquels aucun bloc existant ne peut être enrichi par tags.
  - **Bloc front row** : force scrum-specific
    ```
    BLK_FORCE_SCRUM_DRIVE_01
    intent: force
    tags: [lower, force, squat, hinge, scrum, contact, posterior_chain]
    equipment: [barbell]
    Exercices: Back squat (pause en bas 3s) + hip thrust barbell lourd
    Transfert: mêlée liée = squat isométrique en position fléchie + drive horizontal
    ```
  - **Bloc back three** : neural speed-reactive
    ```
    BLK_NEURAL_SPEED_REACTIVE_01
    intent: neural
    tags: [lower, neural, speed, acceleration, plyo, unilateral, posterior_chain]
    equipment: [box]
    Exercices: Box jump (réactif, temps sol minimal) + single-leg bound
    Transfert: accélération 0-10m, stiffness cheville, réactivité pied-sol
    ```
  - **Bloc second row** : power trunk-carry
    ```
    BLK_POWER_TRUNK_CARRY_01
    intent: neural (ou contrast selon le meilleur fit)
    tags: [full, power, carry, trunk, contact, hinge]
    equipment: [med_ball, dumbbell]
    Exercices: Med ball slam rotationnel + zercher carry lourd
    Transfert: touche (rotation tronc explosive), ruck/maul (carry sous charge)
    ```
  - **Estimation** : 3 blocs, 0-2 exercices à créer.

#### Résumé P1

| Action | Cible | Volume estimé |
|--------|-------|---------------|
| Enrichissement tags blocs existants | 15-25 blocs performance | +1-2 tags/bloc |
| Nouveaux blocs position-spécifiques | 3 blocs | front row, second row, back three |
| Nouveaux exercices (si absents) | 0-3 exercices | box jump réactif, med ball slam rot., SL bound |

**Total P1 : 15-25 enrichissements + 3 blocs + 0-3 exercices.**

---

### Lot 2 — Tâches P2 : Backfill métadonnées (lot séparé)

- [ ] **Task 4.1** : Backfill `pattern` sur les 62 exercices sans pattern
  - File: `src/data/exercices.v1.json`
  - Action: Pour chaque exercice avec `pattern: ""` ou absent, attribuer le pattern correct
  - Règle: le pattern doit correspondre au mouvement primaire de l'exercice

- [ ] **Task 4.2** : Backfill `level` sur les 62 exercices sans level
  - File: `src/data/exercices.v1.json`
  - Critère : `beginner` = exécutable sans coaching intensif | `intermediate` = nécessite supervision

- [ ] **Task 4.3** : Backfill `muscleGroups` sur les 155 exercices
  - File: `src/data/exercices.v1.json`
  - Vocabulaire : `quadriceps`, `hamstrings`, `glutes`, `calves`, `chest`, `lats`, `upper_back`, `shoulders`, `biceps`, `triceps`, `forearms`, `core`, `hip_flexors`, `adductors`, `neck`, `erectors`
  - Règle: 1-3 groupes primaires par exercice
  - **Pré-requis** : vérifier le type TypeScript de `muscleGroups` dans `src/types/training.ts`

---

## Acceptance Criteria

### P0-a — Starter Full Gym

- [ ] AC-01: Given un profil starter avec `equipment: ["dumbbell", "bench"]` et `position: "FRONT_ROW"`, when `buildWeekProgram` génère la semaine W1, then au moins 1 bloc dans la session contient un exercice avec `equipment: ["dumbbell"]` ou `["dumbbell", "bench"]`
- [ ] AC-02: Given un profil starter avec `equipment: []` (BW only), when `buildWeekProgram` génère la semaine W1, then aucun bloc `BLK_STR_*_GYM_*` n'apparaît dans les sessions
- [ ] AC-03: Given deux profils starter identiques sauf equipment (un BW, un full gym), when on compare les programmes W1, then les sessions contiennent au moins 2 blocs différents
- [ ] AC-04: Given un nouveau bloc gym-starter ajouté, when on vérifie ses tags, then il porte TOUS les tags de son équivalent BW + au moins 1 tag position-relevant supplémentaire
- [ ] AC-05: Given l'ajout des 5 blocs P0-a, when on exécute `validationMetier.test.ts`, then les 14 profils existants passent toujours (non-régression)

### P0-b — Contrast Sets tous niveaux

- [ ] AC-06: Given les 5 recettes modifiées et les 6 blocs contrast ajoutés, when on exécute `validationMetier.test.ts`, then les 14 profils existants passent toujours (non-régression) — le slot `required: false` ne casse rien
- [ ] AC-07: Given un profil starter BW-only in_season, when `buildWeekProgram` génère W1, then au moins 1 session contient `BLK_CONTRAST_LOWER_STARTER_01` dans son slot contrast
- [ ] AC-08: Given un profil starter avec med_ball, when `buildWeekProgram` génère W1, then au moins 1 session contient un bloc contrast avec tag `upper` ou `full`
- [ ] AC-09: Given un profil builder avec dumbbell+med_ball, when `buildWeekProgram` génère W1, then au moins 1 session contient un bloc avec intent `contrast` et tag `builder`
- [ ] AC-10: Given un profil starter BW-only sans position, when `buildWeekProgram` génère W1, then la session reste cohérente même si le slot contrast est vide (les slots hypertrophy et core ne sont pas affectés)
- [ ] AC-11: Given un profil performance in_season, when `buildWeekProgram` génère W1, then les sessions utilisent les blocs contrast PERFORMANCE existants (pas les starter/builder) — les tags level gating sont respectés

### P1 — Différenciation postes

- [ ] AC-12: Given deux profils performance identiques sauf position (un FRONT_ROW, un BACK_THREE), when `buildWeekProgram` génère la même semaine, then les sessions contiennent au moins 3 blocs différents
- [ ] AC-13: Given un profil FRONT_ROW performance, when on examine les blocs sélectionnés, then au moins 1 bloc porte le tag `scrum` ou `neck`
- [ ] AC-14: Given un profil BACK_THREE performance, when on examine les blocs sélectionnés, then au moins 1 bloc porte le tag `speed` ou `acceleration`
- [ ] AC-15: Given un profil SECOND_ROW performance, when on examine les blocs sélectionnés, then au moins 1 bloc porte le tag `carry` et au moins 1 porte le tag `trunk`
- [ ] AC-16: Given un tag ajouté à un bloc existant, when on vérifie les exercices du bloc, then au moins 1 exercice correspond au pattern moteur justifiant ce tag

### P2 — Backfill métadonnées

- [ ] AC-17: Given le backfill complété, when on filtre les exercices avec `pattern === ""`, then le résultat est vide
- [ ] AC-18: Given le backfill complété, when on filtre les exercices avec `level === ""`, then le résultat est vide
- [ ] AC-19: Given le backfill complété, when on vérifie `muscleGroups`, then chaque exercice a 1-3 groupes musculaires assignés
- [ ] AC-20: Given le backfill complété, when on exécute `validationMetier.test.ts`, then les 14 profils passent toujours

---

## Additional Context

### Dependencies

- **Dépendance code minimale** : seul `sessionRecipes.v1.ts` est modifié (ajout de slots optionnels)
- Lot 0 P0-a (blocs gym) et P0-b (contrast sets) sont indépendants l'un de l'autre mais peuvent être livrés ensemble
- Lot 1 (P1) et Lot 2 (P2) sont indépendants et implémentables dans n'importe quel ordre
- Les BC-01→BC-09 du plan de stabilisation sont partiellement couverts :
  - BC-02 (contrast lower safe-knee) → couvert par les contrast starter/builder qui évitent knee_pain via contraindications
  - BC-04 (hypertrophy upper variété) → couvert par P0-a (blocs gym upper)
  - BC-05 (activation rotation) → non couvert (hors scope)
  - BC-01 (builder upper pull-only) → non couvert

### Exercices/tags manquants identifiés pour supporter le plan

| Manque identifié | Impact | Action |
|-----------------|--------|--------|
| `push_horizontal__bench_press__dumbbell` potentiellement absent | Bloquant pour BLK_STR_HP_A_GYM_01 + BLK_CONTRAST_UPPER_BUILDER_01 | Task 0.2 le crée si absent |
| `pull_horizontal__dumbbell_row__single_arm` potentiellement absent | Bloquant pour BLK_STR_HP_A_GYM_01 | Task 0.2 le crée si absent |
| `pull_horizontal__barbell_row__pronated` à vérifier | Bloquant pour BLK_STR_HP_A_GYM_02 | Vérifier, créer si absent |
| Aucun exercice upper explosif BW sûr pour starter | Limitation : pas de contrast upper pour starter BW-only | Accepté — med_ball est le minimum |
| Tag `acceleration` absent des blocs contrast lower existants (perf) | Les blocs contrast perf ne scorent pas pour backs | Corrigé en P1 (enrichissement tags) |
| Tag `contact` absent de plusieurs blocs contrast perf | Les blocs contrast perf ne favorisent pas les avants | Corrigé en P1 (enrichissement tags) |

### Testing Strategy

**Tests automatisés (non-régression) :**
- Exécuter `validationMetier.test.ts` après chaque lot (14 profils × 6 semaines doivent passer)

**Nouveaux profils de test à ajouter à `validationMetier.test.ts` :**
- `starter_bw_only` : starter, BACK_ROW, equipment=[], in_season → doit avoir ≥1 contrast lower BW
- `starter_gym_front_row` : starter, FRONT_ROW, equipment=[dumbbell, bench, barbell, band, med_ball], in_season → blocs gym + contrast
- `starter_gym_back_three` : starter, BACK_THREE, equipment=[dumbbell, bench, band, med_ball], in_season → blocs gym + contrast
- `starter_bw_no_position` : starter, pas de position, equipment=[], in_season → séance cohérente même sans contrast upper
- `builder_full_equipment` : builder, SECOND_ROW, equipment=[dumbbell, bench, barbell, band, med_ball], in_season → blocs builder + contrast builder
- `perf_front_row_vs_back_three` : 2 profils perf identiques sauf position, comparer blocs sélectionnés

**Vérification manuelle :**
- Pour chaque nouveau bloc contrast, simuler une semaine et vérifier que le bloc apparaît dans le programme pour le profil cible
- Vérifier qu'un profil starter BW-only a une séance cohérente avec slot contrast vide (pas de trou visuel)
- Vérifier que le test de transfert rugby à 4 questions est satisfait pour chaque ajout
- Comparer côte à côte les programmes front row vs back three et vérifier ≥3 blocs différents

### Risques et garde-fous

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Nouveau bloc avec exercice manquant | Erreur runtime | Task 0.1/0.2 : vérifier CHAQUE exerciseId avant d'ajouter un bloc |
| Slot contrast optionnel mal indexé dans slotFocusTags | Bloc contrast dans mauvais focus → sélection incohérente | Vérifier alignement index slot/slotFocusTags pour chaque recette modifiée |
| Tags enrichis sur blocs existants → changement de sélection | Régression perçue | Exécuter les 14 profils avant/après et documenter les changements |
| Tiebreaker alphabétique → bloc gym perd vs BW | Programme identique BW/gym pour ~10% des users | Accepté P0. Position scoring (+5) couvre la majorité |
| Bloc contrast starter trop avancé | Risque blessure | Chaque exercice vérifié Q4. BW + med ball uniquement. Coaching notes détaillés |
| P1 over-tagging | Scoring artificiel | Chaque tag ajouté doit passer Q2+Q3 du test de transfert |
| Slot contrast sur recettes starter rallonge la séance | UX — séance trop longue pour un débutant | required: false + max 1 bloc contrast = +5min max. Coaching notes expliquent que c'est optionnel si fatigue |
| Builder profiles reçoivent les 16 blocs contrast perf EN PLUS des 3 builder | Trop de candidats pour le slot | Les blocs builder ont le tag `builder` et scorent mieux pour les tags builder ; les blocs perf sans tag builder sont aussi candidats mais c'est correct (le moteur choisit le meilleur score) |

### Limitations connues (hors scope, documentées pour la suite)

1. **Equipment scoring** : Le moteur n'a pas de préférence pour les blocs gym quand l'utilisateur a du matériel. Un futur P1-engine pourrait ajouter un bonus `equipmentMatch` dans `scoreBlock`.
2. **Position scoring poids** : L'audit scientifique recommande d'augmenter le poids position de +5 à +7 (P1-3 engine).
3. **Builder level** : Seulement 7 blocs hypertrophy. La même problématique gym/BW existe mais est moins prioritaire que starter.
4. **Speed/agility blocs** : Le catalogue manque de blocs speed/COD/agility structurés pour les backs.
5. **Conditioning par poste** : Les blocs conditioning (COND_OFF/PRE) ne sont pas différenciés par poste.
6. **Contrast starter BW upper** : Impossible sans med_ball. Pas d'exercice upper explosif sûr en BW pur. Pourrait être résolu par l'ajout d'un exercice type "explosive push-up partiel" ou "clapping push-up genou" dans un futur lot.
7. **Profondeur contrast builder** : 3 blocs seulement. Un lot dédié pourrait ajouter des variantes box jump, depth jump, hang clean simplifié pour builder avancé.

### Notes

- Priorité absolue à la prudence et à la non-régression
- Chaque ajout justifié par un gap métier visible ET test de transfert rugby passé
- Le scoring position (+5) est le levier data-only le plus efficace
- Les exercices existants sont réutilisés au maximum — 0 exercice à créer pour les blocs contrast
- Le Lot 2 (backfill) n'a aucun impact sur le scoring actuel mais prépare le terrain pour des améliorations futures
- **L'ajout des contrast sets à tous les niveaux est le changement le plus visible et le plus impactant pour la perception "programme rugby" de l'application**

### Ordre d'implémentation recommandé

```
1. Task 0.1 + 0.2 — Vérifier/créer exercices manquants
2. Task 2.0 — Modifier les 5 recettes (sessionRecipes.v1.ts)
3. Task 2.1→2.3 — Créer les 3 blocs contrast starter
4. Task 2.4→2.6 — Créer les 3 blocs contrast builder
5. Tests non-régression (validationMetier.test.ts)
6. Task 1.1→1.5 — Créer les 5 blocs gym-starter
7. Tests non-régression + nouveaux profils de test
8. Task 3.1→3.2 — Enrichissement tags + blocs position-spécifiques
9. Tests différenciation postes
10. Task 4.1→4.3 — Backfill métadonnées (indépendant, en parallèle)
```

**Raison de l'ordre** : les recettes modifiées (Task 2.0) doivent être en place AVANT les blocs contrast, sinon les blocs existent mais aucun slot ne les appelle. Les exercices (Task 0.1/0.2) doivent être vérifiés avant tout bloc qui les référence.
