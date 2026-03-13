# Recipe Coverage Matrix — RugbyPrepV2 (Phase 1)

Date: 2026-03-11  
Sources: `src/services/program/buildWeekProgram.ts`, `src/data/sessionRecipes.v1.ts`, `_bmad-input/raw-programs.md`

## 1. Décision d’architecture (confirmée)

Le modèle cible retenu pour éviter l’explosion combinatoire:

1. Archetype microcycle (contexte semaine)
2. Session blueprint (Upper/Lower/Full/Speed/Conditioning/Recovery/Rehab)
3. Adaptateurs (population, niveau, blessures, matériel)
4. Quality gates bloquants

On ne crée pas une recette par combinaison complète `segment × niveau × blessure × matériel`.

---

## 2. Coverage actuelle (routing réel)

### 2.1 Archetypes microcycle couverts

| Archetype | Context trigger | Couvert | Remarque |
|---|---|---|---|
| `LEGACY_V1` | default | Oui | fallback global |
| `IN_SEASON_2X_STD` | performance + in-season + 2 séances | Oui | lower -> upper |
| `IN_SEASON_3X_STD` | performance + in-season + 3 séances | Oui | lower -> upper -> full |
| `DELOAD_RECOVERY` | week=DELOAD | Oui | recovery only |
| `REHAB_UPPER` | rehab upper | Oui | routing rehab actif |
| `REHAB_LOWER` | rehab lower | Oui | routing rehab actif |

### 2.2 Blueprints couverts

| Blueprint | Recipes existantes | Couvert | Gap principal |
|---|---|---|---|
| `upper` | `UPPER_*` | Oui | qualité dépendante du pool blocs |
| `lower` | `LOWER_*` | Oui | qualité dépendante du pool blocs |
| `full` | `FULL_*` | Oui | cohérence insuffisante avant contrats (corrigé Phase 2 FULL) |
| `conditioning` | `COND_OFF_V1`, `COND_PRE_V1` | Oui | mélange speed/conditioning |
| `speed_field` | aucune recette dédiée | Non | type existe mais non routé |
| `recovery` | `RECOVERY_MOBILITY_V1` | Oui | OK |
| `rehab` | `REHAB_{upper/lower}_P{1..3}` | Oui | OK P0, enrichissement P1 |

---

## 3. Coverage par contexte métier (vue coach)

| Contexte | Moteur actuel | Écart vs terrain |
|---|---|---|
| In-season 2x | lower + upper | acceptable |
| In-season 3x | lower + upper + full | full parfois peu crédible sans garde-fous |
| Off-season 3x performance | lower_hyper + upper_hyper + conditioning | pas de speed dédiée |
| Pre-season 3x performance | lower + upper + conditioning | speed implicite uniquement |
| Starter | 2 full-body starter | cohérent mais rigide |
| Builder | lower/upper/full builder | seasonMode peu différenciant |
| Rehab + fatigue | rehab priorisée + mobilité | OK sur contrat P0 |

---

## 4. Matrice adaptateurs (état)

| Adaptateur | Support moteur | Données | Statut |
|---|---|---|---|
| Population (F senior / U18 F/M) | partiel | `populationSegment`, `ageBand` | En place |
| Niveau (starter/builder/performance) | Oui | `trainingLevel` | En place |
| Blessures | Oui | `injuries`, `rehabInjury` | En place |
| Matériel | Oui | `equipment` | En place |
| Priorité vitesse athlète | Non | champ absent | Gap P1 |

---

## 5. Règle vitesse (décision produit proposée)

`speed_field` ne doit pas être systématique in-season.

Règle cible:

- In-season: `speed_field` désactivé par défaut (sauf protocole coach explicite).
- Pre-season: `speed_field` autorisé pour profils avec priorité vitesse.
- Off-season: optionnel, secondaire derrière force/hypertrophie selon objectif.

Données à ajouter en P1:

- `performanceFocus: 'balanced' | 'speed' | 'strength'`
- recette(s) `SPEED_FIELD_PRE_V1` (+ variantes matériel limité)
- mapping archetype pre-season vers `speed_field` conditionnel.

---

## 6. Data manquante prioritaire (pour crédibilité)

1. Recipes `speed_field` dédiées (pré-saison, option profil speed).
2. Pool blocs speed/COD/sprint prep plus profond et typé.
3. Contrats blueprint explicites (upper/lower/full/speed) versionnés.
4. Scorecard qualité orientée coach (coverage patterns + redondance).

---

## 7. Plan exécutable 2 phases

### Phase 1 — Coverage matrix (ce document)

Objectif: figer ce qui existe, ce qui manque, et les priorités de comblement.

### Phase 2 — Contrats moteur (démarrage FULL)

P0 implémenté:

- `FULL_V1` contraint par slot focus lower/upper.
- Validation session: full-body balance obligatoire.
- Quality gates: full-body imbalance -> invalidation/replacement sécurité.
- Tests dédiés ajoutés.

P1 recommandé:

- Ajouter blueprint `speed_field` pré-saison conditionnel à `performanceFocus='speed'`.
- Étendre les quality gates à anti-redondance pattern-level.

