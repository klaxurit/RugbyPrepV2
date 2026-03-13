# Diagnostic Moteur — Synthèse Exécutive RugbyPrepV2

**Date:** 2026-03-10  
**Auteur:** Coach (synthèse consolidée BMAD quick-spec)  
**Portée:** Décision produit et backlog d'implémentation moteur de génération

## Sources consolidées

1. `_bmad-output/planning-artifacts/research/domain-preparation-physique-rugby-research-2026-03-10.md`
2. `_bmad-output/planning-artifacts/adversarial-review-engine-2026-03-10.md`
3. `_bmad-output/planning-artifacts/edge-case-review-engine-2026-03-10.md`

---

## 1. Diagnostic Exécutif

Le moteur est **fonctionnel mais fragile**: il produit des séances, mais la crédibilité “préparateur physique rugby” est inconstante.

Le problème principal n'est pas le nombre d'exercices: c'est l'absence de **contrat de génération explicite** entre routing, sécurité, rehab, validation et UX (C-1, M-5, EC-01, EC-07, EC-08).

Le problème secondaire est un déficit de **modélisation métier rugby haut niveau**: warm-up/cooldown, identité de séance, ondulation intra-semaine, MD± et progression visible (M-1, M-2, m-1, EC-04, EC-09).

Le moteur est sauvable en incrémental: l'architecture `recette -> slots -> blocs` est viable, mais doit être “encadrée” par des règles contractuelles et une couche d'archetypes (verdict adversarial + edge-case).

Les faux problèmes à écarter: “il faut tout réécrire”, “il n'y a pas de base de contenu”, “l'ACWR est absent”. Ces trois points sont faux au vu des audits et du code.

Risque court terme: combinaisons `rehab + fatigue`, `starter + 3 séances`, et entrées corrompues peuvent générer des séances incohérentes ou trompeuses (EC-01, EC-03, EC-05, EC-06).

---

## 2. Root Cause Matrix

| Contenu / KB | Logique / Bugs | Architecture de génération | UX / Perception joueur |
|---|---|---|---|
| KB non exécutable: connaissances présentes mais non consommées par le moteur (C-3, Critical). | DELOAD routé en FORCE (C-1, Critical). | Modèle sans “contrat global de séance” (intention lisible, seuil qualité minimum, garde-fous inter-sessions) (M-5, Major; EC-07, Broken). | Séances perçues comme listes d'exercices, pas comme coaching (m-1, Minor). |
| Couverture contenu incomplète pour la crédibilité terrain: pas de warm-up/cooldown, COD, contact prep structurés (M-1, Major; O-1/O-2, Observation). | Fuites et incohérences data safety (C-2, Critical; M-3, Major; O-4, Observation). | Pas d'ondulation intra-semaine ni couplage fort schedule -> intensité (M-2, Major; EC-11, Degraded). | Pas d'explication du “pourquoi aujourd'hui”, progression peu visible (m-1, m-2, M-2). |
| Spécificité poste présente mais trop faible en effet réel (M-4, Major). | Contrats d'entrée non robustes: `week` hors contrat, profile arrays null/undefined (EC-05/EC-06, Broken). | Contrats implicites non alignés build/validate (`FULL_BUILDER_V1`) (EC-08, Broken). | Jour fantôme possible côté UI (`starter + 3`) puis “séance introuvable” (EC-03, Broken). |
| Patterns et constantes clés restent en dur ou mal distribués entre KB, data et code (C-3, M-6, EC-12). | Rehab + fatigue critique peut supprimer la séance rehab cible (EC-01, Dangerous). | Rehab partielle: `FULL_*` / `COND_*` non neutralisés en rehab 3 séances (EC-02, Dangerous). | Ancre locale silencieuse: rotation pouvant changer sans signal explicite (O-3, Observation; EC-10, Degraded). |

Lecture consolidée:
- **Cause racine transversale:** contrat moteur incomplet + connaissances métier non compilées en règles exécutables.
- **Conséquence:** qualité variable, non déterminisme perçu, et confiance utilisateur dégradée sur les cas limites.

---

## 3. Gap Analysis — Référentiel Terrain vs État Moteur

| Dimension terrain | Ce que fait un préparateur physique rugby | Ce que fait RugbyPrepV2 aujourd'hui | Écart consolidé | Priorité |
|---|---|---|---|---|
| Structure de séance | 4 phases: warm-up, bloc principal, complémentaire, cooldown | Activation + blocs principaux/finishers, sans warm-up/cooldown explicites | Gap de structure perçue (M-1, Major; research gap “structure séance”) | P0 |
| Microcycle MD± | Ajuste intensité et type de séance selon proximité match | `scheduleOptimizer` suggère des jours, mais ne pilote pas l'intensité de la recette | Couplage incomplet planning -> contenu (M-2, Major; R-5; EC-11) | P0 |
| Périodisation in-season | Ondulation intra-semaine (heavy/light/neural) | Variation surtout inter-semaine; sessions semaine homogènes | Ondulation absente (M-2, Major; EC-09) | P1 |
| Deload | Réduction explicite volume/intensité et contenu | Bug historique DELOAD=FORCE; couche UI deload existe mais logique moteur fragile | Risque sécurité/cohérence (C-1, Critical; R-2) | P0 |
| Progressive overload | Mémoire des performances + progression contrôlée | Suggestion locale, mais mémoire et contrôle qualité incomplets côté génération | Progression peu visible (research #21, M-2 indirect, EC-07) | P1 |
| Spécificité poste | Différenciation forte par profil de poste | Tags positionnels présents mais effet faible | Différenciation insuffisante (M-4, Major) | P1 |
| Rehab progression | Contraintes strictes par zone/phase + compatibilité complète | Routing rehab partiel; cas `critical` et `3 séances` incohérents | Risque de prescriptions non alignées rehab (EC-01, EC-02) | P0 |
| Safety contraindications | Contra intégrées de bout en bout | Incohérences data historiques + fallbacks permissifs | Safety dépend d'heuristiques, pas d'invariant fort (C-2, M-5, EC-07) | P0 |
| Cohérence build/validate | Règles build et validation alignées | Divergence `FULL_BUILDER_V1` | Faux positifs QA et messages contradictoires (EC-08) | P0 |
| Robustesse entrées | Paramètres invalides rejetés explicitement | Valeurs hors contrat converties silencieusement ou crash | Fiabilité diminuée sur corruption de state (EC-05, EC-06) | P0 |
| Narrative UX | Le joueur sait quoi, pourquoi, comment progresser | Titres statiques, logique opaque de fallback, peu d'explication d'intention | Perception “liste d'exos” (m-1, m-2, M-5) | P1 |
| Conformité RGPD/welfare | Consentement explicite, politiques, limites de responsabilité | Avancement partiel, éléments réglementaires incomplets | Risque lancement public (research RGPD P0) | P0 |

Synthèse de l'écart:
- Le gap principal n'est pas “manque d'algorithme”, mais “manque de **contrat qualité exécutable**”.
- Le gap secondaire n'est pas “absence de données”, mais “données et KB non transformées en règles strictes”.

---

## 4. Verdict Clair

### a) Problème principal

La cause racine n°1 est l'absence d'un **contrat de génération explicite et vérifiable** qui relie:
- routing hebdo,
- sécurité,
- rehab,
- validation,
- et UX narrative.

Tant que ces invariants ne sont pas codifiés, les fallbacks “sauvent” la génération technique mais dégradent la crédibilité terrain (M-5, EC-01, EC-07, EC-08).

### b) Problème secondaire

Le 2e facteur est un **déficit de modélisation métier rugby** au niveau séance/semaine:
- pas de warm-up/cooldown natifs,
- pas de profil d'intensité de séance,
- pas de logique MD± qui pilote le choix des recettes,
- positionnement poste trop faible.

### c) Faux problèmes

- Faux problème 1: “Le moteur doit être jeté”. Non, l'architecture de base est extensible (verdict adversarial).
- Faux problème 2: “Il n'y a pas de contenu”. Non, base blocs/exercices substantielle; le souci est le contrat et la distribution des règles.
- Faux problème 3: “L'ACWR n'existe pas”. Non, il existe; le problème est son intégration contractuelle avec rehab/routing.

### d) Le moteur peut-il être sauvé incrémentalement ?

**OUI.**

Justification:
- bugs critiques localisables (C-1, C-2, EC-01/02/03/05/06/08),
- dette architecturale traitable par couche supplémentaire (archetype + contrat qualité),
- pas de blocage fondamental du pipeline `recette -> slots -> blocs`.

Condition:
- imposer d'abord les invariants P0 avant enrichissement contenu.

### e) Faut-il passer à un modèle de génération plus haut niveau ?

**OUI, mais en surcouche, pas en remplacement total.**

Recommandation:
- ajouter un niveau **SessionArchetype** / **WeeklyIntentProfile** au-dessus des recettes actuelles.
- les recettes restent le moteur d'assemblage.
- l'archetype impose:
  - objectif de séance,
  - profil intensité,
  - contraintes de sécurité/rehab,
  - structure obligatoire (prep/main/finisher/cooldown),
  - règles de variété.

### f) Quels éléments doivent passer de la KB vers le moteur ?

- seuils ACWR et actions associées (zone -> adaptation).
- règles de deload (réduction sets/intensité/volume par type de bloc).
- règles MD± (jour relatif match -> intensité cible -> intents autorisés).
- critères rehab phase-gating (minimum pour passer P1->P2->P3).
- red flags médicaux transformés en règles de blocage ou avertissements forts.
- budgets de volume par niveau/phase (load-budgeting).

### g) Quels éléments doivent passer du moteur vers la KB/data ?

- maps de fallback intents (`FALLBACK_INTENTS`, `SAFETY_FALLBACK_INTENTS`) vers config versionnée.
- poids de scoring tags et tie-break policy vers config.
- liste intents exclus cross-session vers config.
- catalogue “full recipes” partagé build+validate via data unique.
- contraintes de qualité minimale de séance (hard rules) dans une policy data-driven.

### h) Quels nouveaux tags / métadonnées / structures manquent ?

- `session_archetype` (force, power, recovery, rehab).
- `session_intensity_profile` (heavy/medium/light/neural).
- `match_day_offset` (`MD-3`, `MD-2`, `MD-1`, etc.).
- `block_phase` (`warmup`, `main_A`, `main_B`, `accessory`, `cooldown`).
- `rehab_compatibility` explicite (`upper_only`, `lower_only`, `both`, `none`).
- `safety_critical` pour intents/blocs non substituables.
- `quality_floor_score` par recette.
- `position_priority_weight` configurable.

### i) Quels tests fonctionnels mesurent la progression qualitative ?

- test “lisibilité séance”: chaque séance expose objectif, intensité, raison du jour.
- test “structure rugby crédible”: présence obligatoire prep + main + finisher + cooldown.
- test “cohérence hebdo”: au moins un pattern d'ondulation intra-semaine en in-season.
- test “rehab safety”: aucune séance non-compatible rehab dans les combinaisons critiques.
- test “progression”: surcharge visible semaine N+1 si RER/charge validés.
- test “perception joueur”: score UX (checklist) >= seuil cible sur échantillon de semaines.

---

## 5. Recommandations Priorisées En 3 Niveaux

### Quick Wins (< 1 jour, impact immédiat)

| Action | Fichiers | Effort | Impact | Source |
|---|---|---|---|---|
| Corriger DELOAD pour éviter génération FORCE silencieuse | `src/services/program/buildWeekProgram.ts` | XS | Safety immédiate | C-1 |
| Supprimer/retirer l'ancien moteur mort | `src/services/program/buildSession.ts`, exports associés | XS | Réduit ambiguïté technique | M-6 |
| Propager contras exercice -> bloc dans data | `src/data/blocks.v1.json`, `src/data/exercices.v1.json` | S | Réduction risque blessure | C-2 |
| Ajouter garde `starter=2` côté profil UI | `src/pages/ProfilePage.tsx`, `src/hooks/useProfile.ts` | XS | Supprime jour fantôme | EC-03 |
| Harmoniser la liste “full recipes” build/validate | `src/services/program/buildSessionFromRecipe.ts`, `src/services/program/validateSession.ts` | XS | Supprime faux warnings QA | EC-08 |
| Valider `CycleWeek` et arrays profile avant génération | `src/services/program/buildWeekProgram.ts`, `src/services/program/selectEligibleBlocks.ts` | S | Évite crash/corruption silencieuse | EC-05, EC-06 |
| Nettoyer incohérences data mineures ciblées (starter core, activation hip/ankle, pattern GHD) | `src/data/blocks.v1.json`, `src/data/exercices.v1.json` | XS | Qualité data immédiate | M-3, QW-6, QW-7 |

### Refactors moteur (1-3 semaines)

Ordre de dépendance recommandé:
1. Invariants P0 safety/rehab
2. Contrat qualité de séance
3. Couche d'intention hebdo et UX narrative

| Action | Fichiers principaux | Effort | Dépend de | Source |
|---|---|---|---|---|
| Étendre rehab routing à `FULL_*` / `COND_*` + policy explicite | `buildWeekProgram.ts`, `sessionRecipes.v1.ts` | S | Quick wins safety | EC-02 |
| Corriger priorisation `critical + rehab` (ne jamais perdre rehab cible) | `buildWeekProgram.ts` | S | Rehab policy | EC-01 |
| Introduire qualité minimale de séance (`quality floor`) et hard-fail sur slots requis | `buildSessionFromRecipe.ts`, `validateSession.ts` | M | EC-07 | M-5, EC-07 |
| Ajouter intents `warmup`/`cooldown` et slots obligatoires recettes | `types/training.ts`, `sessionRecipes.v1.ts`, `blocks.v1.json` | M | Contrat qualité | M-1 |
| Ajouter profil d'intensité de séance + ondulation intra-semaine | `sessionRecipes.v1.ts`, `buildWeekProgram.ts`, `programPhases.v1.ts` | M | Contrat qualité | M-2, EC-09 |
| Connecter `scheduleOptimizer` à la sélection d'intensité (MD± effectif) | `scheduleOptimizer.ts`, `buildWeekProgram.ts`, UI semaine | M | Intensité profilée | R-5, EC-11 |
| Rendre fallback/scoring/config data-driven | `buildSessionFromRecipe.ts`, nouvelle config moteur | M | Validation invariants | M-5, EC-12 |
| Renforcer poids position ou variantes de recettes par poste | `positionPreferences.v1.ts`, `sessionRecipes.v1.ts` | S | Intensity/intent layer | M-4 |
| Durcir parsing calendrier (dates invalides, warnings) | `scheduleOptimizer.ts` + tests | S | Contrat entrée | EC-11 |
| Stabiliser ancre rotation hors localStorage-only | `buildSessionFromRecipe.ts`, store dédié | M | Contrat qualité | O-3, EC-10 |

### Enrichissement KB / contenu (ongoing)

Distinction crédibilité rugby vs nice-to-have.

| Action | Catégorie | Impact crédibilité | Effort | Source |
|---|---|---|---|---|
| Warm-up rugby standards (général + lower + upper) | Crédibilité core | Élevé | S | M-1, research structure |
| Cooldown structuré (mobilité + statique + respiration) | Crédibilité core | Élevé | S | M-1, research structure |
| Blocs builder additionnels (activation/core/prehab) | Crédibilité core | Élevé | S | m-3 |
| COD/agilité | Crédibilité core | Élevé | M | O-1 |
| Contact prep intégré | Crédibilité core | Élevé | S | O-2 |
| Conditionnement in-season light | Crédibilité core | Moyen | S | m-4 |
| Clean variants / power patterns | Crédibilité core | Moyen | S | E-4 |
| Extraction KB -> constantes moteur (ACWR, deload, MD±, rehab criteria) | Crédibilité core | Très élevé | M | C-3, EC synthesis |
| VBT / wearables / premium AI enrichi | Nice-to-have court terme | Moyen | M/L | research tendances |

---

## 6. Backlog D'Implémentation Concret

[ENG-001] Corriger routing DELOAD
- Priorité : P0
- Type : bug-fix
- Effort : XS
- Dépendances : []
- Fichiers : `src/services/program/buildWeekProgram.ts`
- Critère d'acceptation : En semaine DELOAD, aucune recette `FORCE` n'est générée par défaut.
- Source : C-1

[ENG-002] Politique rehab explicite pour 3 séances
- Priorité : P0
- Type : refactor
- Effort : S
- Dépendances : [ENG-001]
- Fichiers : `src/services/program/buildWeekProgram.ts`, `src/data/sessionRecipes.v1.ts`
- Critère d'acceptation : Avec rehab active, `FULL_*` et `COND_*` sont remplacés ou bloqués selon policy.
- Source : EC-02

[ENG-003] Priorisation `critical + rehab`
- Priorité : P0
- Type : bug-fix
- Effort : S
- Dépendances : [ENG-002]
- Fichiers : `src/services/program/buildWeekProgram.ts`
- Critère d'acceptation : En ACWR critical + rehab, au moins une séance rehab-compatible est conservée.
- Source : EC-01

[ENG-004] Clamp starter à 2 séances côté produit
- Priorité : P0
- Type : bug-fix
- Effort : XS
- Dépendances : []
- Fichiers : `src/pages/ProfilePage.tsx`, `src/hooks/useProfile.ts`, `src/pages/WeekPage.tsx`
- Critère d'acceptation : Profil starter ne peut pas produire 3 jours pointant vers 2 séances.
- Source : EC-03

[ENG-005] Validation d'entrée profile/week
- Priorité : P0
- Type : bug-fix
- Effort : S
- Dépendances : []
- Fichiers : `src/services/program/buildWeekProgram.ts`, `src/services/program/selectEligibleBlocks.ts`, `src/contexts/weekStorage.ts`
- Critère d'acceptation : `week` invalide et arrays profile invalides ne crashent pas et sont rejetés explicitement.
- Source : EC-05, EC-06

[ENG-006] Alignement build/validate sur recettes full
- Priorité : P0
- Type : bug-fix
- Effort : XS
- Dépendances : []
- Fichiers : `src/services/program/buildSessionFromRecipe.ts`, `src/services/program/validateSession.ts`
- Critère d'acceptation : `FULL_BUILDER_V1` suit le même plafond finisher dans build et validate.
- Source : EC-08

[ENG-007] Contrat safety data contra propagation
- Priorité : P0
- Type : content
- Effort : S
- Dépendances : []
- Fichiers : `src/data/blocks.v1.json`, `src/data/exercices.v1.json`, test intégrité data
- Critère d'acceptation : toute contra exercice est propagée au bloc parent.
- Source : C-2

[ENG-008] Retrait code moteur mort
- Priorité : P0
- Type : refactor
- Effort : XS
- Dépendances : []
- Fichiers : `src/services/program/buildSession.ts`, `src/services/program/index.ts`
- Critère d'acceptation : aucune référence runtime à l'ancien moteur.
- Source : M-6

[ENG-009] Qualité minimale de séance et hard-fail requis
- Priorité : P1
- Type : refactor
- Effort : M
- Dépendances : [ENG-005, ENG-006]
- Fichiers : `src/services/program/buildSessionFromRecipe.ts`, `src/services/program/validateSession.ts`
- Critère d'acceptation : un slot requis introuvable déclenche fallback sûr ou échec explicite, jamais silence.
- Source : M-5, EC-07

[ENG-010] Ajout intents warmup/cooldown + slots obligatoires
- Priorité : P1
- Type : feature
- Effort : M
- Dépendances : [ENG-009]
- Fichiers : `src/types/training.ts`, `src/data/sessionRecipes.v1.ts`, `src/data/blocks.v1.json`
- Critère d'acceptation : chaque recette non-recovery contient prep et cooldown explicites.
- Source : M-1, research structure

[ENG-011] Profil d'intensité séance et ondulation intra-semaine
- Priorité : P1
- Type : refactor
- Effort : M
- Dépendances : [ENG-009]
- Fichiers : `src/data/sessionRecipes.v1.ts`, `src/services/program/buildWeekProgram.ts`, `src/services/program/programPhases.v1.ts`
- Critère d'acceptation : semaine in-season 3 séances contient au moins heavy + light/neural différenciées.
- Source : M-2, EC-09

[ENG-012] Couplage MD± schedule -> recipe intensity
- Priorité : P1
- Type : feature
- Effort : M
- Dépendances : [ENG-011]
- Fichiers : `src/services/program/scheduleOptimizer.ts`, `src/services/program/buildWeekProgram.ts`, pages semaine/programme
- Critère d'acceptation : proximité match influence directement le type de séance générée.
- Source : R-5, research MD±, EC-11

[ENG-013] Renforcement différenciation poste
- Priorité : P1
- Type : refactor
- Effort : S
- Dépendances : [ENG-011]
- Fichiers : `src/services/program/positionPreferences.v1.ts`, `src/data/sessionRecipes.v1.ts`
- Critère d'acceptation : profils avants vs arrières produisent des sessions distinctes mesurables.
- Source : M-4

[ENG-014] Configuration externalisée scoring/fallback/exclusions
- Priorité : P2
- Type : refactor
- Effort : M
- Dépendances : [ENG-009]
- Fichiers : `src/services/program/buildSessionFromRecipe.ts`, nouveau module de config
- Critère d'acceptation : poids et fallbacks modifiables sans changer le code moteur.
- Source : EC synthesis, M-5, EC-12

[ENG-015] Stabilisation ancre rotation
- Priorité : P2
- Type : refactor
- Effort : M
- Dépendances : [ENG-014]
- Fichiers : `src/services/program/buildSessionFromRecipe.ts`, store persistant
- Critère d'acceptation : rotation stable entre pages et sessions malgré reset localStorage.
- Source : O-3, EC-10

[ENG-016] Durcissement parsing dates calendrier
- Priorité : P2
- Type : bug-fix
- Effort : S
- Dépendances : []
- Fichiers : `src/services/program/scheduleOptimizer.ts`
- Critère d'acceptation : date invalide détectée et signalée; aucun scoring silencieux sur `NaN`.
- Source : EC-11

[ENG-017] Enrichissement contenu builder
- Priorité : P2
- Type : content
- Effort : S
- Dépendances : [ENG-010]
- Fichiers : `src/data/blocks.v1.json`, `src/data/exercices.v1.json`
- Critère d'acceptation : au moins 4 nouveaux blocs builder utiles en activation/core/prehab.
- Source : m-3, E-1

[ENG-018] Ajout COD/agilité/contact prep
- Priorité : P2
- Type : content
- Effort : M
- Dépendances : [ENG-010]
- Fichiers : `src/data/blocks.v1.json`, `src/data/exercices.v1.json`, recettes concernées
- Critère d'acceptation : blocs COD et contact prep disponibles selon niveau et contexte.
- Source : O-1, O-2, E-5, E-6

[ENG-019] KB -> constantes moteur
- Priorité : P2
- Type : refactor
- Effort : M
- Dépendances : [ENG-014]
- Fichiers : `src/knowledge/*`, nouveau module `src/services/program/policies/*`
- Critère d'acceptation : ACWR thresholds, deload rules, rehab criteria consommés via constantes versionnées.
- Source : C-3, E-9

[ENG-020] Conformité RGPD/welfare minimale pré-lancement
- Priorité : P0
- Type : feature
- Effort : M
- Dépendances : []
- Fichiers : pages onboarding/profil, policies/mentions légales, flux consentement
- Critère d'acceptation : consentement explicite données sensibles + politique accessible + suppression compte/documentée.
- Source : research RGPD P0

---

## 7. Tests À Ajouter (Consolidés)

| Test | Fichier de test | Type | Priorité |
|---|---|---|---|
| `starter + 3` ne crée jamais de session fantôme UI | `src/pages/__tests__/WeekPage.integration.test.tsx` | integration | P0 |
| `weeklySessions` hors contrat est rejeté sans crash | `src/services/program/buildWeekProgram.contract.test.ts` | unit | P0 |
| `week=0/-1/NaN/unknown` renvoie erreur contrôlée | `src/services/program/programPhases.contract.test.ts` | unit | P0 |
| `profile.equipment undefined` / `injuries null` gérés proprement | `src/services/program/selectEligibleBlocks.contract.test.ts` | unit | P0 |
| `critical + rehab lower` conserve séance rehab-compatible | `src/services/program/buildWeekProgramEdgeCases.test.ts` | integration | P0 |
| rehab active interdit `FULL_*` / `COND_*` selon policy | `src/services/program/buildWeekProgramEdgeCases.test.ts` | integration | P0 |
| parité build/validate sur `FULL_BUILDER_V1` | `src/services/program/validateSession.contract.test.ts` | unit | P0 |
| propagation contras exercice -> bloc (intégrité data) | `src/services/program/programDataIntegrity.test.ts` | unit | P0 |
| slot requis introuvable déclenche fallback sûr ou échec explicite | `src/services/program/buildSessionFromRecipe.test.ts` | unit | P1 |
| présence obligatoire warmup + cooldown sur recettes standard | `src/services/program/validateSession.test.ts` | unit | P1 |
| ondulation in-season 3 séances respecte profil heavy/light/neural | `src/services/program/buildWeekProgram.integration.test.ts` | integration | P1 |
| MD± influence effectivement l'intensité de séance | `src/services/program/scheduleOptimizer.integration.test.ts` | integration | P1 |
| différenciation poste mesurable (front row vs back three) | `src/services/program/positionDiffCheck.test.ts` | integration | P1 |
| ties scoring: rotation couvre plus que top3 ex aequo | `src/services/program/buildSessionFromRecipe.rotation.test.ts` | unit | P2 |
| dates de match invalides produisent warning explicite | `src/services/program/scheduleOptimizer.test.ts` | unit | P2 |
| ancre rotation stable entre views/page reload | `src/services/program/buildSessionFromRecipe.anchor.test.ts` | integration | P2 |
| test e2e parcours joueur semaine -> séance -> log -> semaine | `e2e/program-coherence.spec.ts` | E2E | P2 |

Notes de priorisation:
- P0 = sécurité, cohérence contractuelle, absence de crash.
- P1 = crédibilité rugby et lisibilité de progression.
- P2 = robustesse avancée et qualité perçue long terme.

---

## 8. Critères Métier D'Acceptation

Objectif: valider “cette séance ressemble à une vraie séance rugby crédible”.

### Structure de séance

- [ ] Chaque séance standard contient 4 phases explicites: warm-up, main, complémentaire, cooldown.
- [ ] Chaque phase a une durée cible visible pour le joueur.
- [ ] Le cooldown inclut un protocole clair de retour au calme.
- [ ] Les séances recovery/rehab affichent une structure adaptée mais explicite.

### Variété et cohérence hebdomadaire

- [ ] Une semaine in-season 3 séances n'est pas monolithique (au moins un jour light/neural).
- [ ] Les blocs majeurs ne se répètent pas de façon non intentionnelle entre séances.
- [ ] Le plan hebdo reste cohérent avec le calendrier match (logique MD±).
- [ ] Les fallbacks ne dégradent pas la séance sous un seuil qualité défini.

### Sécurité

- [ ] Aucune séance ne contient un bloc/ercice contre-indiqué pour le profil blessure.
- [ ] En rehab active, toutes les séances respectent la policy rehab (y compris 3e séance).
- [ ] En fatigue critique, la réduction de charge conserve la sécurité et l'objectif rehab.
- [ ] Les entrées corrompues n'entraînent ni crash ni comportement silencieux trompeur.

### Progression

- [ ] La séance affiche pourquoi elle est proposée aujourd'hui (objectif/intensité/contexte).
- [ ] D'une semaine à l'autre, la progression attendue est visible et traçable.
- [ ] Les recommandations de charge s'appuient sur historique réel, pas seulement templates.
- [ ] Le deload est explicite, cohérent et vérifiable dans le contenu généré.

### Identité rugby

- [ ] Les séances couvrent les besoins rugby: force, puissance, COD/agilité, contact prep, trunk/neck.
- [ ] La différenciation poste est perceptible sur les blocs prioritaires.
- [ ] Le joueur comprend le lien entre séance gym, match, et récupération.
- [ ] Le vocabulaire et l'ordre des blocs reflètent une logique S&C rugby, pas un split fitness générique.

### Qualité perçue

- [ ] Le joueur peut répondre “quoi / pourquoi / comment réussir” pour chaque séance en < 30 secondes.
- [ ] Les warnings safety sont explicites et actionnables.
- [ ] Aucun écran “séance introuvable” n'apparaît dans un parcours nominal.
- [ ] Les données et règles affichées sont cohérentes entre moteur, validation et UI.

---

## Décision Recommandée

Décision produit proposée:
- **Sauvetage incrémental OUI**.
- **Refonte totale NON**.
- **Ajout d'une couche de génération haut niveau OUI** (archetypes + contrats qualité), en conservant le pipeline actuel.

Séquence de gouvernance recommandée:
1. Exécuter P0 (sécurité + contrats + conformité minimale).
2. Exécuter P1 (crédibilité terrain visible pour le joueur).
3. Ouvrir P2 en parallèle contenu/plateforme.

Critère de passage en release publique:
- tous les tickets P0 livrés,
- tests P0 verts,
- checklist métier section 8 validée au minimum à 80%.
