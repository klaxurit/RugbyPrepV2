# Analyse des gaps — Bibliothèque exercices poids de corps

> **Branche** : `feature/bodyweight-minimal-equipment-program`  
> **Date** : 2026-06-18  
> **Objectif** : identifier ce qui manque dans `exercices.v1.json` pour alimenter le registre pattern×tier du programme BW annuel (`bodyweight-annual-cycle-program.md`).

---

## 1. Synthèse exécutive

| Métrique | Valeur |
|----------|--------|
| Exercices catalogue total | **208** |
| Tier 0 pur (`equipment: [none]`) | **73** |
| Tier 0–1 (`none` ou `none`+`band`) | **103** |
| Patterns rugby **sans aucune entrée BW** | **pull_vertical**, **push_vertical**, **carry**, **core_rotation** |
| Entrées à ajouter (P0) | **18** |
| Entrées à ajouter (P1) | **12** |
| Corrections métadonnées existantes | **4** |

**Verdict** : la base est **suffisante pour Recovery/Transition** (pompes, squat, pont fessier, mobilité, sauts). Elle est **insuffisante pour Hypertrophie → In-season** sans enrichissement : pull vertical, push vertical, carries, rotations explosives, progressions unilatérales BW.

**Recommandation** : implémenter les **P0** avant le registre `resolveExerciseForSlot` ; valider les séances Recovery avec le catalogue actuel + P0 pull/push vertical.

---

## 2. Méthode d'audit

1. Cartographie des **6 patterns rugby** + support (carry, core, groin, neck, power, sprint).
2. Comptage par **tier matériel** : `bw` (none), `band`, `home` (db/bench/kb), `bar` (pullup_bar), `gym`.
3. Croisement avec les **slots** du doc `bodyweight-annual-cycle-program.md` §2 (table variantes).
4. Références externes : Harrison 2010 (BW S&C), World Rugby Physical Preparation, IRFU home workouts, van der Horst 2015 (Nordic), KB interne `beginner-intermediate-training.md` §6.

Script reproductible :

```bash
node scripts/auditBodyweightExerciseCoverage.mjs
```

---

## 3. État actuel par pattern rugby

### 3.1 Couverture suffisante (tier 0 utilisable)

| Pattern | Entrées BW | Exemples catalogue |
|---------|------------|-------------------|
| Push horizontal | 5 | `push_up__incline`, `standard`, `knee`, `plyo`, `oscillation` |
| Squat / unilatéral | 6+ | `squat__bodyweight_squat`, `reverse_lunge`, `lateral_lunge`, `split_squat_iso`, `wall_sit` |
| Hinge | 4 | `glute_bridge`, `hip_thrust`, `good_morning__bodyweight`, `ham_catch` |
| Ischios | 3 | `nordic__partner`, `slide_leg_curl__towel`, `bridge_iso__single_leg` |
| Puissance bas | 6+ | `broad_jump`, `vertical_jump`, `squat_jump`, `split_jump`, `lateral_bound`, `pogo_hops` |
| Core anti-ext | 2 | `dead_bug`, `hollow_hold` |
| Core anti-rot | 1 | `side_plank` |
| Groin | 1 | `supine_squeeze` |
| Mollet / tibial | 2 | `calf__standing_raise__bodyweight`, `tibialis__raise__bodyweight` |
| Locomotion | 2 | `bear_crawl`, `crab_walk` |
| Mobilité / warm-up | 20+ | `ankle_rocks`, `adductor_rock-back`, etc. |

### 3.2 Gaps critiques (bloquent le programme BW)

| Pattern | BW actuel | Impact programme | Priorité |
|---------|-----------|------------------|----------|
| **Pull vertical** | 0 | Pas de slot tractions sans barre ; assisted = `machine` only | **P0** |
| **Push vertical** | 0 | Pike push-up absent ; séances Upper/Primer incomplètes | **P0** |
| **Pull horizontal (progressions)** | 1 (genoux seulement) | Pas de rowing pieds surélevés / standard | **P0** |
| **Carry** | 0 | Farmer/suitcase = haltères only ; bear crawl = `locomotion` | **P0** |
| **Core rotation** | 0 | Landmine/câble only ; finisher pré-saison impossible en BW | **P0** |
| **Dips** | 0 | Référencés dans le doc BW, absents du catalogue | **P0** |
| **Bulgarian split squat BW** | 0 | DB only ; hypertrophie/force unilatérale BW impossible | **P0** |
| **Copenhagen BW** | 0 | Versions existantes = `bench` (short/long) | **P0** |
| **Traction assistée bande** | 0 | `pull_up__assisted` tagué `machine` | **P0 (fix)** |

### 3.3 Gaps modérés (P1 — enrichissement)

| Besoin | Détail |
|--------|--------|
| Pistol progression | `pistol_box` existe mais requiert `box` — ajouter assisté mur |
| Push décliné | Doc BW le cite ; pas d'entrée dédiée (≠ incliné inversé) |
| Scap pull / dead hang | Pré-traction, santé épaule |
| Step-up BW | `step_up__low` existe — vérifier tier |
| Sissy squat BW | Charge quad sans matériel |
| Archer pull-up | Progression parc street |
| Neck isometric BW | `neck__flexion` existe ; manque extension/latéral |
| Pallof | `pallof_press__band` OK tier 1 ; manque hold BW (planche latérale partielle) |
| Med ball substitut | Rotation bande explosive — P1 |

---

## 4. Corrections sur entrées existantes

| exerciseId actuel | Problème | Action |
|-------------------|----------|--------|
| `pull_vertical__pull_up__neutral__assisted` | `equipment: [machine]` — inutilisable sans salle | Ajouter variante `…__band_assist` ; garder machine pour full_gym |
| `pull_horizontal__inverted_row__knees_bent` | Seule progression pull BW | Ajouter `…__standard`, `…__feet_elevated` |
| `groin_adductors__copenhagen_plank__short/long` | Requiert `bench` | Ajouter `…__knee_bodyweight` (genou au sol) |
| `locomotion__bear_crawl` | Pattern `locomotion`, pas `carry` | Dupliquer alias `carry__bear_crawl__bodyweight` OU mapper registre locomotion→carry |

---

## 5. Exercices proposés — P0 (18 entrées)

Convention ID : `{pattern}__{movement}__{variant}` — alignée sur `exercices.v1.json`.

### Pull (5)

| exerciseId proposé | nameFr | pattern | equipment | metricType | Notes rugby |
|--------------------|--------|---------|-----------|------------|-------------|
| `pull_horizontal__inverted_row__standard` | Rowing inversé | pull_horizontal | none | reps | Table/barre stable, corps aligné |
| `pull_horizontal__inverted_row__feet_elevated` | Rowing inversé pieds surélevés | pull_horizontal | none | reps | Chaise/table — progression pull tier 0 |
| `pull_vertical__scap_pull__bodyweight` | Scap pull (dead hang) | pull_vertical | pullup_bar | reps | Activation scapulaire ; parc/barre |
| `pull_vertical__pull_up__band_assisted` | Tractions assistées élastique | pull_vertical | band | reps | Tier 1 sans barre ; ancrage haut |
| `pull_vertical__pull_up__feet_assisted` | Tractions assistées pieds au sol | pull_vertical | pullup_bar | reps | Barre basse parc ; progression |

### Push (4)

| exerciseId proposé | nameFr | pattern | equipment | metricType | Notes rugby |
|--------------------|--------|---------|-----------|------------|-------------|
| `push_vertical__pike_push_up__bodyweight` | Pike push-up | push_vertical | none | reps | Push vertical tier 0 — essentiel |
| `push_vertical__pike_push_up__feet_elevated` | Pike push-up pieds surélevés | push_vertical | none | reps | Progression épaules |
| `push_horizontal__push_up__decline` | Pompes déclinées | push_horizontal | none | reps | Pieds sur chaise — distinct de incliné |
| `push_horizontal__dip__chair` | Dips entre chaises | push_horizontal | none | reps | Tier 0 ; remplace parallèles si absent |

### Squat / unilatéral (3)

| exerciseId proposé | nameFr | pattern | equipment | metricType | Notes rugby |
|--------------------|--------|---------|-----------|------------|-------------|
| `lower_squat__split_squat__bodyweight` | Fente bulgare / split squat | lower_squat | none | reps | Pied arrière sur chaise — hypertrophie BW |
| `lower_squat__bulgarian_split_squat__bodyweight` | Bulgarian split squat | lower_squat | none | reps | Alias sémantique si split squat ≠ bulgarian |
| `hinge__single_leg_rdl__bodyweight` | RDL unilatéral (kickstand) | hinge | none | reps | Transition + hypertrophie ischios |

### Hinge / ischios (1)

| exerciseId proposé | nameFr | pattern | equipment | metricType | Notes rugby |
|--------------------|--------|---------|-----------|------------|-------------|
| `hamstring__nordic__eccentric_solo` | Nordique excentrique solo | hinge | none | reps | Pieds sous canapé/partenaire ; force-pont BW |

### Carry (2)

| exerciseId proposé | nameFr | pattern | equipment | metricType | Notes rugby |
|--------------------|--------|---------|-----------|------------|-------------|
| `carry__farmer_walk__backpack` | Farmer walk sac à dos | carry | none | load_reps | Lest maison ; finisher rugby |
| `carry__suitcase_walk__backpack` | Suitcase walk sac | carry | none | load_reps | Anti-rotation ; in-season finisher |

### Core / groin (2)

| exerciseId proposé | nameFr | pattern | equipment | metricType | Notes rugby |
|--------------------|--------|---------|-----------|------------|-------------|
| `core_rotation__band_rotation__explosive` | Rotation élastique explosive | core_rotation | band | reps | Remplace med ball ; pré-saison FP |
| `groin_adductors__copenhagen_plank__knee` | Copenhagen genou au sol | groin_adductors | none | seconds | Tier 0 adducteurs ; progression vers long |

### Parc / barre (1)

| exerciseId proposé | nameFr | pattern | equipment | metricType | Notes rugby |
|--------------------|--------|---------|-----------|------------|-------------|
| `push_horizontal__dip__parallel` | Dips aux parallèles | push_horizontal | pullup_bar | reps | Parc street ; `pullup_bar` suffit comme proxy |

---

## 6. Exercices proposés — P1 (12 entrées)

| exerciseId proposé | nameFr | pattern | equipment | Usage |
|--------------------|--------|---------|-----------|-------|
| `lower_squat__pistol__wall_assisted` | Pistol assisté mur | lower_squat | none | Force unilatérale avancée |
| `push_horizontal__push_up__diamond` | Pompes diamant | push_horizontal | none | Hypertrophie triceps |
| `push_horizontal__push_up__tempo` | Pompes tempo 3-1-3 | push_horizontal | none | Force push tier 0 (Harrison) |
| `pull_vertical__pull_up__archer` | Traction archer | pull_vertical | pullup_bar | Parc ; progression |
| `lower_squat__sissy_squat__bodyweight` | Sissy squat | lower_squat | none | Quad hypertrophie BW |
| `lower_step__step_up__bodyweight` | Step-up | lower_step | none | Unilatéral + box marche |
| `neck__isometric__flexion` | Isométrie cou flexion | neck | none | Finisher ; existe partiellement |
| `neck__isometric__extension` | Isométrie cou extension | neck | none | Contact avants |
| `neck__isometric__lateral` | Isométrie cou latéral | neck | none | Complète tri-plan |
| `core_anti_rotation__pallof_hold__band` | Pallof hold | core_anti_rotation | band | In-season finisher tier 1 |
| `power__broad_jump__seated` | Broad jump assis | power | none | Existe — vérifier lien registre |
| `activation__inchworm` | Inchworm | activation | none | Warm-up full body |

---

## 7. Registre pattern×tier — brouillon ordonné

Ordre = préférence rugby (meilleur transfert en premier). `(nouveau)` = P0 à créer.

### pull_vertical

| Tier | Ordre registre |
|------|----------------|
| 0 | `inverted_row__feet_elevated` → `inverted_row__standard` → `inverted_row__knees_bent` |
| 1 | `pull_up__band_assisted` *(nouveau)* |
| 2 | `pull_up__feet_assisted` *(nouveau)* → `scap_pull` *(nouveau)* |
| 2+ | `pull_up__neutral` → `pull_up__supinated` → `pull_up__archer` (P1) |

### push_vertical

| Tier | Ordre registre |
|------|----------------|
| 0 | `pike_push_up__bodyweight` *(nouveau)* → `pike_push_up__feet_elevated` *(nouveau)* |
| 1 | `push_vertical__band_press` *(à créer P1 ou réutiliser landmine KB)* |
| 2 | `dip__parallel` *(nouveau)* |
| home | `dumbbell_press__seated` |

### push_horizontal

| Tier | Ordre registre |
|------|----------------|
| 0 | `push_up__incline` → `push_up__standard` → `push_up__decline` *(nouveau)* → `push_up__diamond` (P1) |
| 0 | `dip__chair` *(nouveau)* |
| 1 | `push_up__band_resisted` *(P1)* |
| 2 | `dip__parallel` *(nouveau)* |
| home | `bench_press__dumbbell` |

### squat / unilatéral

| Tier | Ordre registre |
|------|----------------|
| 0 | `squat__bodyweight` → `split_squat__bodyweight` *(nouveau)* → `bulgarian__bodyweight` *(nouveau)* |
| 1 | `squat__band_resisted` *(P1)* |
| home | `goblet_squat__dumbbell` → `bulgarian__dumbbell` |

### hinge

| Tier | Ordre registre |
|------|----------------|
| 0 | `glute_bridge` → `single_leg_rdl__bodyweight` *(nouveau)* → `nordic__eccentric_solo` *(nouveau)* |
| 0 | `nordic__partner` |
| 1 | `nordic__band_assist` |
| home | `rdl__dumbbell` |

### carry

| Tier | Ordre registre |
|------|----------------|
| 0 | `bear_crawl` (locomotion) → `farmer_walk__backpack` *(nouveau)* → `suitcase_walk__backpack` *(nouveau)* |
| home | `farmer_walk__dumbbell` → `suitcase_walk__dumbbell` |

---

## 8. Mapping slots programme → statut catalogue

Légende : ✅ OK · ⚠️ partiel · ❌ manquant

| Slot doc BW (§2) | Tier 0 | Tier 1 (band) | Tier 2 (bar/parc) | Statut |
|------------------|--------|---------------|-------------------|--------|
| Squat | ✅ squat BW | ⚠️ band squat P1 | — | OK |
| Hinge | ✅ glute bridge | ✅ good morning band | — | OK |
| Hinge force | ⚠️ nordic partner | ✅ nordic band | — | ⚠️ ajouter solo |
| Push horizontal | ✅ pompes | ⚠️ band push P1 | ❌ dips | ❌ P0 dips |
| Push vertical | ❌ | ⚠️ | ❌ dips parc | ❌ P0 pike |
| Pull vertical | ⚠️ inverted row | ❌ band pull | ❌ tractions | ❌ P0 |
| Pull horizontal | ⚠️ 1 variante | ✅ band row | ✅ tractions | ⚠️ P0 progressions |
| Unilatéral | ⚠️ lunges | ⚠️ | — | ⚠️ P0 bulgarian BW |
| Puissance bas | ✅ | ⚠️ | — | OK |
| Puissance haut | ✅ plyo push | — | ❌ dip explosif | ⚠️ P0 dip |
| Carry | ⚠️ bear crawl | — | — | ❌ P0 backpack |
| Core rotation | ❌ | ❌ band rot P0 | — | ❌ P0 |
| Adducteurs | ✅ squeeze | ⚠️ | ❌ copenhagen bench | ❌ P0 copenhagen knee |
| Sprint | ✅ (terrain) | ✅ band sprint | ✅ parc | OK (hors catalogue) |

---

## 9. Recherche externe — principes retenus (filtrés rugby)

Sources consultées (synthèse, pas copie de programmes calisthenics « skills ») :

| Source | Enseignement retenu pour RugbyPrep |
|--------|-----------------------------------|
| Harrison 2010 (JSCR) | BW efficace pour force/composition ; progressions par niveau de difficulté |
| World Rugby Physical Preparation | Patterns multi-articulaires ; hypertrophie comme base ; pas de bodybuilding pur |
| IRFU / home workouts (Cowman) | Circuits squat/lunge/push/pull/core sans matériel ; med ball optionnel |
| van der Horst 2015 (Nordic) | Nordique = priorité ischios ; versions assistées/solo acceptables |
| Rugby Renegade / praticiens | Unilatéral, tempo, isométrie pour compenser charge absolue limitée |
| Calisthenics moderne (Overcoming Gravity, etc.) | **Filtrer** : retenir progressions push/pull/squat/hinge ; **exclure** front lever, planche straddle, skills non transférables |

**Règle produit** : chaque nouvel exercice doit répondre à « quel pattern rugby renforce-t-il ? » — sinon hors scope.

---

## 10. Plan d'action recommandé

### Sprint 1 — Catalogue (avant code registre)
- [x] Ajouter les **18 P0** dans `exercices.v1.json` (2026-06-18)
- [ ] Corriger métadonnées §4 (assisted pull machine → garder + bande OK)
- [ ] Ajouter entrées `exerciseDemos.ts` + lexique i18n si vidéo dispo
- [x] Lancer `node scripts/auditBodyweightExerciseCoverage.mjs` → 0 gap P0

### Sprint 2 — Registre + tests
- [ ] Implémenter `patternExerciseRegistry.ts` (§7)
- [ ] `assertSessionEquipmentCompatible` + golden profiles S1/S2/P7
- [ ] Mapper slots Recovery A/B → registre

### Sprint 3 — Validation humaine
- [ ] Fiches testeur Recovery (profils 0 / band+DB / parc)
- [ ] Ajuster prescriptions si RPE hors cible

### Sprint 4 — P1 + phases suivantes
- [ ] Hypertrophie après validation Recovery
- [ ] P1 progressions avancées (pistol, archer, sissy)

---

## 11. Critères d'acceptation audit

Le script `auditBodyweightExerciseCoverage.mjs` doit passer quand :

1. Chaque pattern §7 a **≥ 1 entrée tier 0**.
2. `pull_vertical` tier 0 utilise `pull_horizontal` inverted row (mapping explicite) **ou** entrée dédiée.
3. `push_vertical` tier 0 a `pike_push_up`.
4. `carry` tier 0 a `backpack` ou `bear_crawl`.
5. `core_rotation` tier 1 a `band_rotation__explosive`.
6. Aucun slot P0 du tableau §8 n'est marqué ❌.

---

## 12. Liens internes

- Programme séances : `docs/training/bodyweight-annual-cycle-program.md`
- Plan implémentation : `docs/bodyweight-minimal-equipment-plan.md` *(si présent sur branche)*
- KB progressions BW : `src/knowledge/beginner-intermediate-training.md` §6
- Patterns rugby : `src/knowledge/strength-methods.md` §6
