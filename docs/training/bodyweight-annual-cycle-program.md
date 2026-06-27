# Cycle annuel poids de corps — Programmes & séances

> **Branche** : `feature/bodyweight-minimal-equipment-program`  
> **Version** : V1 draft — contenu source pour futures mother sessions `equipment: bodyweight`  
> **Aligné sur** : `weeklyTemplates.ts`, `annual-cycle-algorithm.md`, 39 mother sessions full_gym

Chaque exercice est prescrit en **version zéro matériel** (base). Les variantes s'activent **dans l'ordre** dès que le matériel est disponible — on prend la variante la plus élevée possible.

---

## 1. Légende des variantes matériel

| Code | Matériel requis | Notes |
|------|-----------------|-------|
| **BW** | Rien (sol, mur, chaise, table) | Version par défaut — toujours faisable |
| **B** | Élastiques | Bande loop ou tube avec ancrage |
| **PB** | Barre de traction | Mur, porte, parc |
| **PA** | Barres parallèles | Dips station ; sinon chaise pour dips pieds au sol |
| **DB** | Haltères | Paire d'haltères |
| **KB** | Kettlebell | Un ou deux KB |

**Règle de résolution** : `BW → B → PB → PA → DB → KB` — utiliser la variante la plus avancée dont tu disposes **tout** le matériel requis.

**Notation dans les séances** :
```
Exercice `prescription`
  BW : … → B : … → PB : … → PA : … → DB : … → KB : …
```

**Progression de difficulté BW** (quand la base devient trop facile sans matériel) :
- Pompes : genoux → standard → pieds surélevés → diamant → tempo 3-1-3
- Tractions : rowing table → rowing pieds sur chaise → traction assistée (corps + jambes)
- Squat : 2 jambes → tempo → squat sauté → pistol assisté mur
- Hinge : pont fessier → pont unilatéral → nordique excentrique assisté

---

## 2. Table de variantes par pattern moteur

Référence rapide — utilisée dans toutes les séances ci-dessous.

| Pattern | BW | B | PB | PA | DB | KB |
|---------|----|---|----|----|----|-----|
| **Squat** | Squat poids de corps | Squat avec bande (résistance) | — | — | Goblet squat | Goblet squat KB |
| **Hinge** | Pont fessier / hip hinge air | Good morning élastique | — | — | Romanian deadlift haltères | Romanian deadlift KB |
| **Hinge force** | Nordique excentrique assisté | Nordique assisté bande | — | — | RDL lourd | KB swing |
| **Push horizontal** | Pompe (inclinée → standard → déclinée) | Pompe avec bande (résistance) | — | Dips (ou dips pieds au sol entre chaises) | Développé couché haltères | Floor press KB |
| **Push vertical** | Pike push-up | Développé épaules élastique | — | Dips sur parallèles (léger) | Développé épaules haltères assis | KB press |
| **Pull vertical** | Rowing inversé table / barre basse | Tirage vertical élastique | Tractions (ou traction assistée) | — | — | — |
| **Pull horizontal** | Rowing inversé | Rowing élastique assis | Tractions prise large | — | Rowing haltère | Rowing KB |
| **Unilatéral bas** | Fente arrière / fente bulgare | Fente avec bande | — | — | Fente bulgare goblet | Fente goblet KB |
| **Puissance bas** | Squat sauté / broad jump | Squat sauté avec bande | — | — | — | KB swing explosif |
| **Puissance haut** | Pompe plyo / clap push-up | — | — | Dips explosifs | — | — |
| **Carry** | Bear crawl / crab walk | — | — | — | Farmer walk | Farmer walk KB |
| **Core anti-rotation** | Planche latérale | Pallof press élastique | — | — | — | — |
| **Core rotation** | Dead bug / bird dog | Rotation élastique | — | — | — | — |
| **Adducteurs** | Squeeze isométrique allongé | Copenhagen assisté bande | — | Copenhagen planche | — | — |
| **Mollet / tibial** | Mollet unilatéral BW | — | — | — | Mollet haltère | — |
| **Cou** | Isométrie main | Isométrie bande | — | — | — | — |
| **Sprint / accélération** | Sprint départ tombé / fente | Sprint résisté bande | — | — | — | — |

---

## 2bis. Règles volume & rugby (V1.1)

Référence : `docs/training/bodyweight-program-review.md` + `load-budgeting.md`.

| Phase | Sets durs max / séance | Si fatigue club élevée |
|-------|------------------------|-------------------------|
| Recovery | 12–16 | Garder tel quel |
| Transition | 14–18 | −1 tour bloc 2 |
| Hypertrophie | **16–22** | Couper blocs optionnels (bras, épaule) |
| Force-pont | 14–18 | −1 tour contrast si qualité ↓ |
| In-season | 10–14 | −1 tour finisher |
| Primer | 6–10 | Ne pas ajouter |

**Règle rugby** : si un bloc n'a pas de transfert mêlée/sprint/plaquage, il est **optionnel**.

---

## 2ter. Accents par poste — Bloc Position

Groupes : `front_row` (piliers, talonneurs, 2e/3e ligne) · `back_three` (demis, centres, arrières).

Ajouter **en fin de séance** (sauf Recovery A) sauf indication. Réduire ce bloc **en premier** si fatigue.

### BLOC_POSITION_FRONT_ROW (2 tours, repos 45–60s)

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A — Nuque | `2×10s/direction` (flexion, extension, latéral) | BW : isométrie main → B : `neck__*_iso__band` |
| B — Adducteurs | `2×15–20s/côté` | BW : Copenhagen pied surélevé → B : Copenhagen assisté → banc : Copenhagen long |
| C — Grip / contact | `2×20m` ou `2×30s` | BW : farmer walk sac → DB : farmer walk → PA : dips |

### BLOC_POSITION_BACK_THREE (2 tours, repos 45–60s)

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A — COD / vitesse | `2×5m` shuffle → sprint OU `2×3/côté` bound latéral | BW |
| B — Trunk anti-rot | `2×15s/côté` | B : Pallof → BW : planche latérale |
| C — Pull plaquage | `2×5` qualité | PB : tractions → BW : rowing explosif |

*Nuque back_three* : optionnel `1×10s` flexion si plaquage lourd cette semaine.

### Placement par cycle

| Séances | front_row | back_three |
|---------|-----------|------------|
| Recovery B → Force-pont | Bloc Position complet | Bloc Position complet |
| Recovery A | Nuque 1 tour optionnel | — |
| In-season Full | Bloc 4 dédié | Finisher EMOM existant |
| Light Primer | Nuque 1 tour optionnel | — |

---

## 3. Vue d'ensemble du cycle annuel

### 3.1 Off-season (10 semaines typiques)

| Phase | Semaines | Objectif | Séances / semaine (2x) | Séances / semaine (3x) |
|-------|----------|----------|------------------------|------------------------|
| 1 Récupération | S1–S2 | Décharge, réentraînement patterns | Recovery A + B | → repli 2x |
| 2 Transition | S3–S4 | Réintro charge modérée | Lower Trans + Upper Trans | + Full Trans |
| 3 Hypertrophie | S5–S8 | Volume, masse musculaire | Lower Hyp + Upper Hyp | + Full Hyp |
| 4 Force-pont | S9–S10 | Force + contrastes explosifs | Lower FB + Upper FB | + Full FB |
| 5 Entretien | S11+ | Maintien en attente pré-saison | Hypo Lower + Upper (alternance A/B) | — |

### 3.2 Pré-saison (12 semaines)

| Phase | Semaines | Objectif | 2x | 3x | 4x (option) |
|-------|----------|----------|----|----|-------------|
| 1 Force | S1–4 | Construction force | Lower Force + Upper Force | + Full Force | + Speed Intro |
| 2 Force-Puissance | S5–8 | Contrastes force-vitesse | Lower FP + Upper FP | + Full FP | + Speed Power |
| 3 Puissance | S9–12 | Pic explosivité | Lower Power + Upper Power | + Full Power | — |

### 3.3 In-season (mésocycle 3:1)

| Fréquence | Semaine match | Séances |
|-----------|---------------|---------|
| 2x | — | Lower + Upper |
| 3x | Oui | Lower + Upper + Light Primer |
| 3x | Non | Lower + Upper + Full Body |

Deload : semaine 4 de chaque mésocycle — réduire volume −30 %, garder l'intention.

### 3.4 Playoffs (taper)

| Phase | Jours avant match | Séances |
|-------|-------------------|---------|
| Taper 1 | > 10j | Lower + Upper allégés |
| Taper 2 | 6–10j | 1× Light Primer |
| Match week | ≤ 5j | Activation 15–20 min (Primer réduit) ou repos |

---

# OFF-SEASON

---

## FULL_BW_OFFSEASON_RECOVERY_A_V1

- `cycle`: off_season — phase 1 (S1–S2)
- `session_type`: full
- `equipment`: bodyweight
- `target_duration`: 30–40 min
- `RPE`: 4–5 partout

### Échauffement (3–5 min)
| Exercice | Prescription | Variantes |
|----------|--------------|-----------|
| Balancement cheville | `1×8/côté` | BW uniquement |
| Rock-back adducteurs | `1×8/côté` | BW uniquement |
| Scap push-up | `1×8` | BW → B : scap pull-apart élastique |

### Bloc 1 — Squat / Hinge ré-entrée
- Format : `3 tours`, repos `60–90s` après la paire

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A — Squat | `3×8` | BW : squat poids de corps → B : squat bande → DB/KB : goblet squat léger |
| B — Hinge | `3×8` | BW : pont fessier → B : good morning élastique → DB/KB : RDL léger |

### Bloc 2 — Push / Pull ré-entrée
- Format : `3 tours`, repos `60–90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A — Push | `3×8–10` | BW : pompe inclinée (mains surélevées) → standard → B : pompe bande → PA : dips légers → DB : développé couché léger |
| B — Pull | `3×8–10` | BW : rowing inversé table → B : rowing élastique → PB : tractions assistées (saut) → PB : tractions strictes |

### Bloc 3 — Trunk / mobilité
- Format : `2 tours`, repos minimal

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×8/côté` | BW : dead bug |
| B | `2×8/côté` | BW : rock-back adducteurs |
| C | `2×4/côté` | BW : world's greatest stretch |

---

## FULL_BW_OFFSEASON_RECOVERY_B_V1

- `cycle`: off_season — phase 1 (S1–S2)
- `session_type`: full
- `equipment`: bodyweight
- `target_duration`: 30–40 min
- `RPE`: 4–5

### Bloc 1 — Unilatéral / locomotion
- Format : `2–3 tours`, repos `60–75s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A — Fente | `2–3×6/côté` | BW : fente arrière → fente bulgare → DB/KB : fente goblet |
| B — Locomotion | `2–3×10–15m` | BW : bear crawl → crab walk |

### Bloc 2 — Push / Pull reset
- Format : `2–3 tours`, repos `60–90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A — Push | `2–3×8–10` | BW : pompe inclinée → standard |
| B — Pull | `2–3×8/côté` | BW : rowing inversé → B : rowing élastique demi-genoux → PB : tractions |

### Bloc 3 — Mollet / tronc / adducteurs

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×10/côté` | BW : mollet unilatéral |
| B | `2×12` | BW : tibial au mur |
| C | `2×20s/côté` | BW : planche latérale |
| D | `2×20s` | BW : squeeze adducteurs allongé → B : squeeze avec bande |

---

## LOWER_BW_OFFSEASON_TRANSITION_V1

- `cycle`: off_season — phase 2 (S3–S4)
- `session_type`: lower
- `target_duration`: 40–50 min
- `RPE`: 5–6

### Bloc 1 — Squat / Hinge base
- Format : `3 tours`, repos `90–120s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A — Squat | `3×6–8` | BW : squat tempo 3-1-3 → B : squat bande → DB/KB : goblet squat |
| B — Hinge | `3×6–8` | BW : pont fessier unilatéral → B : good morning bande → DB/KB : RDL |

### Bloc 2 — Unilatéral
- Format : `3 tours`, repos `75–90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×6–8/côté` | BW : fente arrière → fente bulgare → DB/KB : fente bulgare goblet |
| B | `3×6–8/côté` | BW : RDL unilatéral (kickstand) → DB : RDL unilatéral haltère |

### Bloc 3 — Tronc / adducteurs / mollet

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×20–30s/côté` | BW : planche latérale → B : Copenhagen assisté bande |
| B | `2×20s` | BW : squeeze adducteurs |
| C | `2×10–12/côté` | BW : mollet unilatéral → DB : mollet haltère |
| D | `2×12–15` | BW : tibial mur |

---

## UPPER_BW_OFFSEASON_TRANSITION_V1

- `cycle`: off_season — phase 2
- `session_type`: upper
- `target_duration`: 40–50 min

### Bloc 1 — Push principal
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×6–8` | BW : pompe déclinée → B : pompe bande → PA : dips → DB : développé couché |

### Bloc 2 — Pull / Push secondaire
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A — Pull | `3×6–8` | BW : rowing inversé pieds surélevés → B : rowing élastique → PB : tractions |
| B — Push | `3×8–10` | BW : pike push-up → B : développé épaules élastique → DB : développé épaules assis |

### Bloc 3 — Bras / épaule santé
- Format : `2 tours`, repos `60s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×12` | BW : curl isométrique serviette → B : curl élastique |
| B | `2×12` | BW : extension triceps chaise → B : pressdown élastique |
| C | `2×12` | B : face pull élastique (si B dispo) sinon BW : Y-T-W au sol |

---

## FULL_BW_OFFSEASON_TRANSITION_V1

- `cycle`: off_season — phase 2
- `session_type`: full
- `target_duration`: 45–55 min

### Bloc 1 — Hinge + squat léger
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×8` | BW : hip hinge drill → pont fessier → DB/KB : RDL |
| B | `3×10` | BW : squat → DB/KB : goblet squat |

### Bloc 2 — Push / Pull
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×8–10` | BW : pompes → PA : dips → DB : développé |
| B | `3×8–10` | BW : rowing inversé → PB : tractions |

### Bloc 3 — Finisher rugby léger
- Format : `2 tours`, repos `45s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×15m` | BW : bear crawl → DB/KB : farmer walk |
| B | `2×15s/côté` | BW : planche latérale |
| C | `2×10s/direction` | BW : isométrie cou → B : cou bande |

---

## LOWER_BW_OFFSEASON_HYPERTROPHY_V1

- `cycle`: off_season — phase 3 (S5–S8)
- `session_type`: lower
- `target_duration`: 45–55 min *(V1.1 : −10 min vs draft)*
- `RPE`: 6–8 (S4 deload : −30 % volume)
- **Sets durs cible** : 16–20 (était ~35 — voir `bodyweight-program-review.md`)

### Bloc 1 — Squat hypertrophie
- Format : `4 séries`, repos `2 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×8–10` | BW : squat tempo / fente bulgare → DB/KB : goblet squat |

### Bloc 2 — Hinge + unilatéral
- Format : **`3 tours`** *(V1.1 : était 4)*, repos `90–120s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×8–10` | BW : nordique excentrique → B : nordique bande → DB/KB : RDL |
| B | **`3×8–10/côté`** *(fixe, pas 3–4)* | BW : fente bulgare → DB/KB : fente goblet |

### Bloc 3 — Ischios / adducteurs
- Format : **`2 tours`** *(V1.1 : était 3)*, repos `60–75s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×10–12` | BW : nordique excentrique → B : leg curl élastique |
| B | `2×20–30s/côté` | BW : Copenhagen pied surélevé → B : Copenhagen assisté → banc : Copenhagen long |

### Bloc 4 — Mollet / tibial *(optionnel — couper en premier)*

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×10–12/côté` | BW : mollet unilatéral → DB : mollet haltère |
| B | `2×12–15` | BW : tibial mur |

### Bloc 5 — Position *(voir §2ter)*
- **front_row** : `BLOC_POSITION_FRONT_ROW` (priorité nuque + Copenhagen)
- **back_three** : Copenhagen + mollet qualité ; nuque skip

**Accent back_three** : +1 série unilatéral Bloc 2 si récup OK.

---

## UPPER_BW_OFFSEASON_HYPERTROPHY_V1

- `cycle`: off_season — phase 3
- `session_type`: upper
- `target_duration`: 45–55 min *(V1.1)*
- **Sets durs cible** : 16–20 *(était ~45 — surcharge bodybuilding)*

### Bloc 1 — Push hypertrophie
- Format : `4 séries`, repos `2 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×8–10` | BW : pompes déclinées → PA : dips → DB : développé |

### Bloc 2 — Pull + push incliné
- Format : **`3 tours`** *(V1.1 : était 4)*, repos `90–120s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×8–10` | BW : rowing inversé → B : rowing élastique → PB : tractions |
| B | `3×8–10` | BW : pike push-up → DB : développé incliné |

### Bloc 3 — Vertical push/pull
- Format : `3 tours`, repos `75–90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×8–10` | BW : pike push-up → DB : développé épaules |
| B | `3×10–12` | BW : rowing inversé → PB : tractions |

### Bloc 4 — Bras *(optionnel — couper si fatigue club)*

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×10–12` | B : curl élastique → DB : curl marteau |
| B | `2×10–12` | B : pressdown → DB : extension triceps |

### Bloc 5 — Santé épaule *(optionnel)*

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×12–15` | B : face pull élastique |

### Bloc 6 — Position *(§2ter)*
- **front_row** : `BLOC_POSITION_FRONT_ROW` (nuque prioritaire)
- **back_three** : `BLOC_POSITION_BACK_THREE` (pull + Pallof)

---

## FULL_BW_OFFSEASON_HYPERTROPHY_V1

- `cycle`: off_season — phase 3
- `session_type`: full
- `target_duration`: 55–70 min

### Bloc 1 — Hinge hypertrophie
- Format : `4 séries`, repos `2 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×6–8` | BW : nordique + pont fessier lourd → DB/KB : RDL → KB : KB swing contrôlé |

### Bloc 2 — Push / Pull
- Format : `4 tours`, repos `90–120s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×8–10` | BW : pompes lestées (sac) → DB : développé |
| B | `4×8–10/côté` | BW : rowing inversé → PB : tractions → DB : rowing unilatéral |

### Bloc 3 — Unilatéral + tronc
- Format : `3 tours`, repos `75–90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×8–10/côté` | BW : fente arrière → DB : fente haltères |
| B | `3×15–20s/côté` | BW : planche latérale → B : Pallof press |

### Bloc 4 — Finisher rugby
- Format : `2 tours`, repos `45–60s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×30s` | BW : bear crawl → DB/KB : farmer walk |
| B | `2×20–30s/côté` | BW : Copenhagen → B : Copenhagen assisté |
| C | `2×10s/dir` | BW/B : isométrie cou |

---

## LOWER_BW_OFFSEASON_FORCE_BRIDGE_V1

- `cycle`: off_season — phase 4 (S9–S10)
- `session_type`: lower
- `target_duration`: 45–55 min
- **Contrast training** : charge lourde → explosif dans les 15–20s

### Bloc 1 — Squat force + contrast
- Format : `4 tours`, repos `3–4 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A (lourd) | `4×4–5` RIR 1–2 | BW : fente bulgare tempo lent (max difficile) → DB/KB : goblet squat lourd → DB : fente bulgare lourde |
| B (explosif) | `4×3–4` max intention | BW : squat sauté → B : squat sauté bande → KB : KB swing explosif |

### Bloc 2 — Hinge force + contrast
- Format : `4 tours`, repos `90–120s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×4–5` | BW : nordique excentrique strict → DB/KB : RDL lourd |
| B | `4×3` max distance | BW : broad jump → squat sauté latéral |

### Bloc 3 — Unilatéral force + ischios
- Format : `3 tours`, repos `75–90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×5–6/côté` | BW : fente bulgare lente → DB : fente bulgare chargée |
| B | `3×4–5` | BW : nordique → B : nordique assisté bande |

### Bloc 4 — Prévention
- Format : `2 tours`, repos `45s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×20–30s/côté` | BW/B : Copenhagen |
| B | `2×10–12` | BW : mollet unilatéral |
| C | `2×12` | BW : tibial mur |

**Accent back_three** : contrast B = broad jump prioritaire ; moins de charge sur A.

---

## UPPER_BW_OFFSEASON_FORCE_BRIDGE_V1

- `cycle`: off_season — phase 4
- `session_type`: upper
- `target_duration`: 45–55 min

### Bloc 1 — Push force + contrast
- Format : `4 tours`, repos `3–4 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×4–5` RIR 1–2 | BW : pompes lestées / déclinées lentes → PA : dips lestés → DB : développé lourd |
| B | `4×3–4` | BW : pompes plyo → PA : dips explosifs |

### Bloc 2 — Pull force
- Format : `4 séries`, repos `2–3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×4–6` | BW : rowing inversé pieds très surélevés → PB : tractions lestées (sac) → DB : rowing lourd |

### Bloc 3 — Push vertical + row
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×5` | BW : pike push-up difficile → DB : développé épaules |
| B | `3×6` | BW : rowing inversé → PB : tractions → DB : rowing |

### Bloc 4 — Rotation / cou
- Format : `2 tours`, repos `45s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3–4/côté` | B : rotation élastique explosive → BW : rotation au sol |
| B | `15–20s` | BW/B : isométrie cou |

---

## FULL_BW_OFFSEASON_FORCE_BRIDGE_V1

- `cycle`: off_season — phase 4
- `session_type`: full
- `target_duration`: 50–60 min

### Bloc 1 — Hinge force + jump
- Format : `3 tours`, repos `3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×4–5` | DB/KB : RDL lourd → BW : nordique strict |
| B | `3×3` | BW : broad jump |

### Bloc 2 — Push contrast
- Format : `3 tours`, repos `3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×4` | BW/DB : push lourd → DB : développé |
| B | `3×4` | BW : pompes plyo |

### Bloc 3 — Pull + unilatéral
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×5` | PB : tractions → BW : rowing inversé |
| B | `3×5/côté` | BW/DB : fente bulgare |

### Bloc 4 — Finisher
- Format : `2 tours`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×20m` | BW : bear crawl sprint → DB/KB : farmer walk rapide |
| B | `2×15s/côté` | BW : planche latérale |

---

# PRÉ-SAISON

---

## LOWER_BW_PRESEASON_FORCE_V1

- `cycle`: pre_season — phase 1 (S1–4)
- `session_type`: lower
- `target_duration`: 45–55 min
- Deload S4 : −30 % volume

### Bloc 1 — Squat force
- Format : `4 séries`, repos `2–3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×4–5` RIR 1–2 | BW : fente bulgare lente max → DB/KB : goblet squat lourd → DB : fente bulgare très lourde |

### Bloc 2 — Hinge + unilatéral
- Format : `3 tours`, repos `90–120s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×5–6` | DB/KB : RDL → BW : nordique |
| B | `3×6/côté` | BW : fente bulgare → DB : fente chargée |

### Bloc 3 — Ischios / mollet
- Format : `2–3 tours`, repos `60–90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2–3×4–5` | BW : nordique |
| B | `3×10–12` | BW : mollet → DB : mollet haltère |
| C | `2–3×10–12` | BW : tibial mur |

### Bloc 4 — Finisher position
- Format : `2 tours`, repos `45s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `20–30s/côté` | BW/B : Copenhagen |
| B | `20m` | BW : bear crawl → DB/KB : farmer walk |

**Accent front_row** : +1 série Bloc 1, farmer walk plus lourd.  
**Accent back_three** : fente bulgare plus explosive en concentrique.

---

## UPPER_BW_PRESEASON_FORCE_V1

- `cycle`: pre_season — phase 1
- `session_type`: upper
- `target_duration`: 45–55 min

### Bloc 1 — Push force
- Format : `4 séries`, repos `2–3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×4–5` | BW : pompes lestées → PA : dips lestés → DB : développé lourd |

### Bloc 2 — Pull + push support
- Format : `3 tours`, repos `90–120s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×6–8` | PB : tractions → BW : rowing inversé difficile → DB : rowing |
| B | `3×6–8` | BW : pike push-up → DB : développé incliné |

### Bloc 3 — Hinge haut / tronc
- Format : `3 tours`, repos `75s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×6–8` | DB : développé épaules → BW : pike push-up |
| B | `2–3×6–8/côté` | B : rotation élastique → BW : dead bug weighted (sac) |

### Bloc 4 — Finisher
- Format : `2 tours`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×20m/côté` | DB/KB : suitcase carry → BW : bear crawl latéral |
| B | `2×10s/dir` | BW/B : cou isométrique |

---

## FULL_BW_PRESEASON_FORCE_V1

- `cycle`: pre_season — phase 1
- `session_type`: full
- `target_duration`: 50–60 min

### Bloc 1 — Hinge force
- Format : `3 séries`, repos `2–3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×5` | DB/KB : RDL lourd → BW : nordique strict |

### Bloc 2 — Push / Pull
- Format : `3 tours`, repos `90–120s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×6–8` | DB : développé → BW : pompes lestées |
| B | `3×6–8/côté` | PB : tractions → DB : rowing |

### Bloc 3 — Hanche / rotation
- Format : `3 tours`, repos `75–90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×6–8` | BW : pont fessier unilatéral lourd → DB : hip thrust (banc) |
| B | `2–3×6–8/côté` | B : rotation élastique |

### Bloc 4 — Finisher
- Format : `2 tours`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `15–20m` | BW : bear crawl sprint → DB/KB : farmer walk |
| B | `20–30s/côté` | BW : Copenhagen |

---

## SPEED_BW_POWER_PRESEASON_INTRO_V1

- `cycle`: pre_season — phase 1 — 4e séance optionnelle
- `session_type`: speed_power
- `equipment`: terrain + BW
- `target_duration`: 35–45 min

### Bloc 1 — Accélération
- Format : `4 tours`, repos `2 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `8–10m` | B : sprint résisté bande → BW : départ tombé |
| B | `10–15m` | BW : sprint libre |

### Bloc 2 — Plyométrie intro
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2–3 reps` | BW : squat jump |
| B | `2 reps` | BW : broad jump |
| C | `2/côté` | BW : bound latéral |

### Bloc 3 — Ballistique haut
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4 reps` | BW : pompes plyo → B : passe poitrine élastique (ancrage) |
| B | `3–4/côté` | B : rotation élastique explosive |

---

## LOWER_BW_PRESEASON_FORCE_POWER_V1

- `cycle`: pre_season — phase 2 (S5–8)
- `session_type`: lower
- `target_duration`: 45–55 min

### Bloc 1 — Contrast bas
- Format : `4 tours`, repos `3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×4` @ effort max propre | DB/KB : goblet squat lourd → BW : fente bulgare lourde |
| B | `4×3–4` | BW : squat sauté → KB : KB swing explosif |

### Bloc 2 — Hinge + unilatéral
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×4–5` | DB/KB : RDL → BW : nordique |
| B | `3×5/côté` | BW/DB : fente bulgare explosive |

### Bloc 3 — Finisher
- Format : `EMOM 8'`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| min 1 | `15–20m` | BW : bear crawl rapide → DB/KB : farmer walk |
| min 2 | `15–20s/côté` | BW : Copenhagen |

---

## UPPER_BW_PRESEASON_FORCE_POWER_V1

- `cycle`: pre_season — phase 2
- `session_type`: upper
- `target_duration`: 45–55 min

### Bloc 1 — Contrast haut
- Format : `4 tours`, repos `3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×4` effort max | DB : développé → BW : pompes lestées lentes |
| B | `4×4–5` | BW : pompes plyo → PA : dips explosifs |

### Bloc 2 — Pull force
- Format : `4 séries`, repos `2–3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×4–6` | PB : tractions lestées → DB : rowing lourd |

### Bloc 3 — Support
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×5` | DB : développé épaules → BW : pike push-up |
| B | `3×6` | PB : tractions → DB : rowing |

### Bloc 4 — Finisher
- Format : `2 tours`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3–4/côté` | B : rotation explosive |
| B | `15–20s` | BW/B : cou |
| C | `3×12` | B : face pull |

---

## FULL_BW_PRESEASON_FORCE_POWER_V1

- `cycle`: pre_season — phase 2
- `session_type`: full
- `target_duration`: 50–60 min

### Bloc 1 — Contrast hinge + jump
- Format : `4 tours`, repos `3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×3–4` | DB/KB : RDL lourd |
| B | `4×3` | BW : broad jump |

### Bloc 2 — Contrast push
- Format : `3 tours`, repos `3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×4` | DB : développé |
| B | `3×4` | BW : pompes plyo |

### Bloc 3 — Pull + rotation
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×5` | PB : tractions |
| B | `3×5/côté` | B : rotation élastique |

### Bloc 4 — Carry
- Format : `2 tours`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×20m/côté` | DB/KB : suitcase carry |

---

## SPEED_BW_POWER_PRESEASON_V1

- `cycle`: pre_season — phase 2 — 4e séance
- `session_type`: speed_power
- `target_duration`: 40–50 min

### Bloc 1 — Accélération contrastée
- Format : `4–5 tours`, repos `2–3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `8–10m` | B : résisté bande → BW : départ fente |
| B | `10–20m` | BW : sprint libre |

### Bloc 2 — Plyométrie
- Format : `3 tours`, repos `90–120s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2–3` | BW : CMJ |
| B | `2` | BW : broad jump |
| C | `2/côté` | BW : bound latéral |

### Bloc 3 — Ballistique haut
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4` | BW : pompes plyo |
| B | `3–4/côté` | B : rotation explosive |

### Bloc 4 — COD
- Format : `3 tours`, repos `60s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×5m` | BW : shuffle défensif → sprint |

---

## LOWER_BW_PRESEASON_POWER_V1

- `cycle`: pre_season — phase 3 (S9–12)
- `session_type`: lower
- `target_duration`: 40–50 min

### Bloc 1 — Contrast vitesse
- Format : `4 tours`, repos `2 min 30`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×3` vitesse max | DB/KB : goblet squat modéré → BW : fente bulgare rapide |
| B | `3` | BW : squat sauté / CMJ |

### Bloc 2 — Unilatéral explosif
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×4/côté` | BW : fente bulgare explosive → DB : fente légère explosive |
| B | `3×3` | BW : bound en avant |

### Bloc 3 — Finisher
- Format : `2 tours`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×15m` | BW : sprint → B : sprint résisté court |
| B | `2×15s/côté` | BW : Copenhagen |

**Variantes front_row / back_three** : même squelette ; front_row = charge A légèrement plus lourde, back_three = B et sprints plus longs.

---

## UPPER_BW_PRESEASON_POWER_V1

- `cycle`: pre_season — phase 3
- `session_type`: upper
- `target_duration`: 40–48 min

### Bloc 1 — Contrast push vitesse
- Format : `4 tours`, repos `2 min 30`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `4×3` vitesse max | DB : développé modéré → BW : pompes lestées rapides |
| B | `3–4` | BW : pompes plyo |

### Bloc 2 — Pull vitesse
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×4` | PB : tractions explosives → BW : rowing inversé explosif |
| B | `3×5` | BW : pompes déclinées rapides |

### Bloc 3 — Finisher
- Format : `EMOM 6'`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| min 1 | `3–4/côté` | B : rotation explosive |
| min 2 | `20m/côté` | DB/KB : suitcase carry rapide |

---

## FULL_BW_PRESEASON_POWER_V1

- `cycle`: pre_season — phase 3
- `session_type`: full
- `target_duration`: 40–50 min

### Bloc 1 — Contrast full body
- Format : `3 tours`, repos `2 min 30`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×3` | KB : KB swing → DB/KB : RDL rapide |
| B | `3` | BW : broad jump |

### Bloc 2 — Push / Pull explosif
- Format : `3 tours`, repos `2 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×3–4` | BW : pompes plyo |
| B | `3×4` | PB : tractions rapides |

### Bloc 3 — Activation
- Format : `2 tours`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×10m` | BW : A-skip / pogo hops |
| B | `2×15s/côté` | BW : planche latérale |

---

# IN-SEASON

---

## LOWER_BW_IN_SEASON_V1

- `cycle`: in_season
- `session_type`: lower
- `target_duration`: 35–45 min
- Mésocycle 3:1 — deload S4 : −30 %

### Bloc 1 — Contrast bas maintenance
- Format : `3–4 tours`, repos `2 min 30–3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3–4×3` @ ~75–80 % effort | DB/KB : goblet squat → BW : fente bulgare lourde |
| B | `3` | BW : broad jump → squat sauté |

### Bloc 2 — Postérieur + unilatéral
- Format : `3 tours`, repos `75–90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×5–6` | BW : pont fessier unilatéral → DB : hip thrust |
| B | `3×5/côté` | BW : fente bulgare → DB : fente |

### Bloc 3 — Finisher
- Format : `EMOM 8'`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| min 1 | `15–20m` | BW : bear crawl rapide → DB/KB : farmer walk |
| min 2 | `15–20s/côté` | BW : Copenhagen → B : Pallof hold |

**Accent front_row** : A plus lourd, farmer walk prioritaire.  
**Accent back_three** : B broad jump prioritaire, unilatéral plus explosif.

---

## UPPER_BW_IN_SEASON_V1

- `cycle`: in_season
- `session_type`: upper
- `target_duration`: 35–45 min

### Bloc 1 — Contrast haut
- Format : `3–4 tours`, repos `2 min 30–3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3–4×3–4` @ ~75–80 % | DB : développé → BW : pompes lestées |
| B | `3–4` | BW : pompes plyo → B : passe élastique explosive |

### Bloc 2 — Pull force
- Format : `3 tours`, repos `75–90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×5` | PB : tractions → BW : rowing inversé difficile |
| B | `3×5–6` | BW : rowing inversé strict → DB : rowing |

### Bloc 3 — Finisher
- Format : `EMOM 8'`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| min 1 | `20m/côté` | DB/KB : suitcase carry |
| min 2 | `15–20s` | B : Pallof hold → BW/B : cou isométrique |

---

## FULL_BW_BODY_IN_SEASON_V1

- `cycle`: in_season — semaine sans match (3x)
- `session_type`: full
- `target_duration`: 40–50 min

### Bloc 1 — Hinge + jump
- Format : `3 tours`, repos `2 min 30`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×3–4` | DB/KB : RDL modéré |
| B | `3` | BW : broad jump |

### Bloc 2 — Push / Pull
- Format : `3 tours`, repos `90s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×5` | DB : développé → BW : pompes lestées |
| B | `3×5` | PB : tractions |

### Bloc 3 — Unilatéral + tronc
- Format : `2 tours`, repos `75s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×6/côté` | BW : fente bulgare |
| B | `2×15s/côté` | B : Pallof → BW : planche latérale |

### Bloc 4 — Finisher léger
- Format : `2 tours`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×15m` | BW : bear crawl |
| B | `2×10s/dir` | BW/B : cou |

---

## FULL_BW_LIGHT_PRIMER_IN_SEASON_V1

- `cycle`: in_season — semaine match (3x) ou fatigue haute
- `session_type`: full_light_primer
- `target_duration`: 20–30 min
- **Objectif** : activation CNS, zéro fatigue résiduelle

### Bloc 1 — Neural bas
- Format : `3 tours`, repos `2–3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×2–3` @ ~70–75 % | DB/KB : goblet squat rapide → BW : squat sauté léger |
| B | `3` | BW : CMJ — arrêt si qualité baisse |

### Bloc 2 — Primer haut
- Format : `3 tours`, repos `2–3 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `3×5/côté` | BW : pike push-up explosif → DB : développé épaules léger |
| B | `3×3–5` | BW : pompes plyo légères |

### Bloc 3 — Pull / rotation
- Format : `2–3 tours`, repos `90–120s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2–3×5` | PB : tractions rapides → BW : rowing explosif |
| B | `2–3/côté` | B : rotation élastique → BW : rotation au sol |

### Bloc 4 — Optionnel confiance
- Format : `2 tours`, repos `45s`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×10` | B : curl élastique |
| B | `2×10` | B : pressdown élastique |

---

# PLAYOFFS — TAPER

---

## FULL_BW_PLAYOFF_ACTIVATION_V1

- `cycle`: playoffs — match week (J-5 à J-2)
- `session_type`: activation
- `target_duration`: 15–20 min

### Bloc unique — Activation CNS
- Format : `2 tours`, repos `2 min`

| Slot | Prescription | Variantes |
|------|--------------|-----------|
| A | `2×3` | BW : squat sauté léger |
| B | `2×3` | BW : pompes plyo légères |
| C | `2×3` | PB : tractions rapides → BW : rowing explosif |
| D | `2×10m` | BW : A-skip |
| E | `2×10s/dir` | BW : cou isométrique |

**J-1** : mobilité seule (chevilles, hanches, thorax) — pas de séance structurée.  
**J-0 (match)** : échauffement terrain club.

---

## LOWER_BW_PLAYOFF_TAPER_V1 / UPPER_BW_PLAYOFF_TAPER_V1

- `cycle`: playoffs — taper 1 (J-11 à J-6)
- `target_duration`: 30–35 min chacune
- Volume : −40 % vs in-season, intensité maintenue

Reprendre **LOWER_BW_IN_SEASON** et **UPPER_BW_IN_SEASON** avec :
- 2 tours par bloc au lieu de 3–4
- 2 exercices max par bloc
- Repos complet conservé

---

# ANNEXE — Mapping IDs futurs → IDs full_gym

| ID bodyweight (ce document) | ID full_gym actuel |
|-----------------------------|-------------------|
| FULL_BW_OFFSEASON_RECOVERY_A_V1 | FULL_OFFSEASON_RECOVERY_A_V1 |
| FULL_BW_OFFSEASON_RECOVERY_B_V1 | FULL_OFFSEASON_RECOVERY_B_V1 |
| LOWER_BW_OFFSEASON_TRANSITION_V1 | LOWER_OFFSEASON_TRANSITION_V1 |
| UPPER_BW_OFFSEASON_TRANSITION_V1 | UPPER_OFFSEASON_TRANSITION_V1 |
| FULL_BW_OFFSEASON_TRANSITION_V1 | FULL_OFFSEASON_TRANSITION_V1 |
| LOWER_BW_OFFSEASON_HYPERTROPHY_V1 | LOWER_OFFSEASON_HYPERTROPHY_V1 |
| UPPER_BW_OFFSEASON_HYPERTROPHY_V1 | UPPER_OFFSEASON_HYPERTROPHY_V1 |
| FULL_BW_OFFSEASON_HYPERTROPHY_V1 | FULL_OFFSEASON_HYPERTROPHY_V1 |
| LOWER_BW_OFFSEASON_FORCE_BRIDGE_V1 | LOWER_OFFSEASON_FORCE_BRIDGE_V1 |
| UPPER_BW_OFFSEASON_FORCE_BRIDGE_V1 | UPPER_OFFSEASON_FORCE_BRIDGE_V1 |
| FULL_BW_OFFSEASON_FORCE_BRIDGE_V1 | FULL_OFFSEASON_FORCE_BRIDGE_V1 |
| LOWER_BW_PRESEASON_FORCE_V1 | LOWER_PRESEASON_FORCE_V1 |
| UPPER_BW_PRESEASON_FORCE_V1 | UPPER_PRESEASON_FORCE_V1 |
| FULL_BW_PRESEASON_FORCE_V1 | FULL_PRESEASON_FORCE_V1 |
| SPEED_BW_POWER_PRESEASON_INTRO_V1 | SPEED_POWER_PRESEASON_INTRO_V1 |
| LOWER_BW_PRESEASON_FORCE_POWER_V1 | LOWER_PRESEASON_FORCE_POWER_V1 |
| UPPER_BW_PRESEASON_FORCE_POWER_V1 | UPPER_PRESEASON_FORCE_POWER_V1 |
| FULL_BW_PRESEASON_FORCE_POWER_V1 | FULL_PRESEASON_FORCE_POWER_V1 |
| SPEED_BW_POWER_PRESEASON_V1 | SPEED_POWER_PRESEASON_V1 |
| LOWER_BW_PRESEASON_POWER_V1 | LOWER_PRESEASON_POWER_*_V1 |
| UPPER_BW_PRESEASON_POWER_V1 | UPPER_PRESEASON_POWER_*_V1 |
| FULL_BW_PRESEASON_POWER_V1 | FULL_PRESEASON_POWER_*_V1 |
| LOWER_BW_IN_SEASON_V1 | LOWER_IN_SEASON_*_V1 |
| UPPER_BW_IN_SEASON_V1 | UPPER_IN_SEASON_*_V1 |
| FULL_BW_BODY_IN_SEASON_V1 | FULL_BODY_IN_SEASON_*_V1 |
| FULL_BW_LIGHT_PRIMER_IN_SEASON_V1 | FULL_LIGHT_PRIMER_IN_SEASON_*_V1 |
| FULL_BW_PLAYOFF_ACTIVATION_V1 | (activation playoffs — dataset publié, resolver à brancher) |

**Playoffs taper (J-11 à J-6)** : réutilise `LOWER_BW_IN_SEASON_V1` / `UPPER_BW_IN_SEASON_V1` avec réduction de blocs via le resolver (`maxBlocks` 2–3), pas de mother session dédiée.

Les variantes `front_row` / `back_three` utilisent le **Bloc Position** (§2ter) + accents de charge documentés dans `bodyweight-program-review.md`.

---

## Prochaine étape technique

1. ~~Convertir séances validées en mother sessions MD~~ — cycle annuel BW couvert (off-season → playoffs activation).
2. Enrichir `patternExerciseRegistry.ts` sur les patterns restants.
3. Brancher `FULL_BW_PLAYOFF_ACTIVATION_V1` dans le resolver playoffs si slot dédié J-5→J-2.
4. Merger `feature/bodyweight-minimal-equipment-program` → `main`.
