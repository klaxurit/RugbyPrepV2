# Plan Final de Stabilisation Produit — RugbyPrepV2

**Date** : 2026-03-13
**Auteur** : Processus BMAD (Quick Dev)
**Commit baseline** : `1e18345` + changements locaux non committés (FP1 patch + hardening)
**Corpus de validation** : 18 profils x 6 semaines = 108 cas (sorties moteur reelles)
**Tests** : 392 passed (16 fichiers)
**Documents sources** :
- `validation-finale-stabilisation-produit-2026-03-13.md`
- `implementation-release-gate-sprint-2026-03-12.md`
- `implementation-final-hardening-pass-2026-03-13.md`
- `validation-metier-vague-c-rerun-post-c2-2026-03-12.md`
- `gold-standard-rugby-microcycles-2026-03-10.md`
- `domain-feminine-u18-rugby-research-2026-03-10.md`

---

## 1. Executive Decision

### Le moteur algorithmique de RugbyPrepV2 est GELE.

Apres 4 vagues de corrections (C1 algo, C2 contenu, Release Gate Sprint, Final P1 Patch + Hardening), le moteur de generation de programmes produit des seances **credibles metier** pour ses 18 profils de validation (note moyenne 74/100). Tous les mecanismes structurels fonctionnent : DUP, deload 3:1, safety contracts, cross-session exclusion, version cap U18/starter, injection ACL feminine, guard UX S5, volume gates.

**Les ecarts restants sont a 90% du contenu** (manque de blocs, variete exercice, blocs builder pull-only). Ce ne sont pas des defauts algorithmiques. Lancer une Vague D serait de l'over-engineering : le risque produit est desormais la retention utilisateur et l'UX, pas la generation de programmes.

**Toute modification du moteur apres cette date doit passer par une demande formelle avec justification metier et impact sur les 108 cas du corpus.**

---

## 2. Etat Final du Moteur

### Notes par segment

| Segment | Profils | Note /100 | Verdict |
|---------|---------|-----------|---------|
| Starter nominal (S1/S2) | 2 | 72-74 | Acceptable |
| Starter blesse (S3-S5) | 3 | 35-70 | Passable (S5=mobilite, honnete) |
| U18 fille/garcon | 2 | 70-72 | Acceptable (ACL differenciee) |
| Builder nominal (B1/B2) | 2 | 78-82 | Bon |
| Builder blesse (B3) | 1 | 55 | Passable (limitation connue) |
| Performance nominal (P1/P2) | 2 | 85-90 | Excellent |
| Performance blesse (P3-P7) | 5 | 32-65 | Passable a insuffisant (P7 = edge case extreme) |
| Femme senior (F_senior) | 1 | 85-88 | Bon (ACL prehab systematique) |

### Metriques de qualite

| Metrique | Valeur |
|----------|--------|
| Tests | 392 passed (0 skip, 0 fail) |
| Couverture KB observable | ~65% (11/17 regles) |
| Profils < 50/100 | 2 (S5=35, P7=32) — edge cases documentes |
| Profils > 80/100 | 5 (B2, P1, P2, F_senior_in, F_senior_pre) |
| Bugs structurels ouverts | 0 |
| Erreurs TypeScript | 0 |
| Erreurs lint nouvelles | 0 (77 pre-existantes, voir §8) |

---

## 3. Regles Moteur Gelees (NE PAS TOUCHER)

Les couches suivantes sont **stables et verifiees sur sorties reelles**. Aucune modification sans demande formelle + regression test sur les 108 cas.

### 3.1 Periodisation DUP in-season
- `getSessionPhase()` dans `programPhases.v1.ts`
- Session 0 (LOWER) = force/heavy, Session 1 (UPPER) = power/medium, Session 2 (FULL) = hypertrophy/light
- Ref : `periodization.md` §2.2, §4.2

### 3.2 Deload automatique 3:1
- `IN_SEASON_DELOAD_WEEKS` = W3/W7/H3
- 2 sessions au lieu de 3, volume reduit
- Ref : Pritchard 2015, `periodization.md` §5.2

### 3.3 Safety contracts
- Cross-session exclusion (desactivee pour starter)
- Filtrage contraindications au niveau exercice ET bloc
- Guard UX S5 : UPPER_STARTER_V1 100% safety → remplacee par RECOVERY_MOBILITY_V1
- `KNOWN_VALIDATION_ISSUES` : S4, B3, P3, P6, P7, F_SENIOR

### 3.4 Version caps
- **Starter** : plafonné a W2 max (`STARTER_MAX_VERSION`)
- **U18** : plafonné a W2 max (`U18_MAX_VERSION`)
- Les 2 caps se cumulent pour U18_FILLE/GARCON

### 3.5 Injection ACL prehab feminine
- Profils `female_senior`, `u18_female` : bloc `BLK_PREHAB_ACL_PREVENT_01` injecte dans session LOWER non-deload
- Prehab exclu du comptage volume (FP1-01, `VOLUME_COUNTED_INTENTS`)
- Version prehab respecte les caps U18/starter
- Ref : `population-specific.md` §1.3, Hewett 2005

### 3.6 Volume budget
- `VOLUME_COUNTED_INTENTS` = force, contrast, neural, hypertrophy, core, activation
- Prehab **exclu** (prevention medicale, pas charge d'entrainement)
- Caps : starter=10, builder=14, performance=20 (tolerance +1)
- Limite connue : garder les blocs prehab <=3 sets pour ne pas masquer une surcharge

### 3.7 Routing recettes par niveau
- Starter → UPPER_STARTER_V1 / LOWER_STARTER_V1 (toujours 2 sessions)
- Builder → UPPER_BUILDER_V1 / LOWER_BUILDER_V1 (+FULL_BUILDER_V1 si 3x)
- Performance → UPPER_V1 / LOWER_V1 / FULL_V1 (DUP) ou UPPER_HYPER_V1 / LOWER_HYPER_V1 (H1-H4)

---

## 4. Ce Qui Passe Desormais par la Data/KB

Les ameliorations suivantes se font **exclusivement** par ajout/modification dans `blocks.v1.json`, `exercices.v1.json`, ou les fichiers KB dans `src/knowledge/`. Aucune modification du moteur necessaire.

| Ecart | Type | Solution data |
|-------|------|---------------|
| Monotonie upper BW starter | DATA | Ajouter 1-2 blocs hypertrophy upper BW (ex: variante push-up + tirage inversee) |
| B3 FULL_BUILDER 100% safety | DATA | Ajouter 1-2 blocs builder upper pull-only superset |
| P_knee contrast lower absent | DATA | Ajouter 1 bloc contrast lower safe-knee (hip thrust + box squat iso) |
| Rotation activation starter | DATA | Ajouter 1-2 blocs activation specifiques lower/upper BW |
| Deload starter = 2 sessions identiques | DATA | Ajouter 2-3 blocs mobilite (ankle, shoulder, full body) |
| Warmup S3 (knee → upper warmup) | DATA | Ajouter 1 warmup lower safe-knee (marche + hip circles) |
| Activation identique cross-session perf | DATA | Ajouter 1-2 blocs activation lower performance |
| F3 — LIMITED_GYM + shoulder perf | DATA | Creer BLK_NEURAL_UPPER_BAND_SAFE_01 (band row EMOM) |

---

## 5. Backlog Contenu Priorise

### Priorite 1 — Impact immediat credibilite (S+1 a S+2)

| # | Item | Blocs a creer | Impact |
|---|------|---------------|--------|
| BC-01 | Blocs builder upper pull-only (B3 shoulder) | 1-2 | HIGH — 1 session/sem degradee pour B3 |
| BC-02 | Bloc contrast lower safe-knee (P4 contrast) | 1 | HIGH — P4 n'a aucune alternative contrast lower |
| BC-03 | Blocs mobilite supplementaires (deload starter) | 2-3 | MEDIUM — les 2 sessions deload identiques |

### Priorite 2 — Variete et retention (S+3 a S+4)

| # | Item | Blocs a creer | Impact |
|---|------|---------------|--------|
| BC-04 | Blocs hypertrophy upper BW (S1/S2 monotonie) | 1-2 | MEDIUM — monotonie 8 semaines |
| BC-05 | Blocs activation specifiques (starter rotation) | 2 | MEDIUM — FB_01 domine 6/7 semaines |
| BC-06 | Warmup lower safe-knee | 1 | LOW — S3 recoit warmup upper en lower |
| BC-07 | Blocs activation lower performance | 1-2 | LOW — meme activation lower partout |

### Priorite 3 — Edge cases et completude (S+5 a S+6)

| # | Item | Blocs a creer | Impact |
|---|------|---------------|--------|
| BC-08 | BLK_NEURAL_UPPER_BAND_SAFE_01 (F3) | 1 | LOW — profil LIMITED_GYM + shoulder non existant dans corpus |
| BC-09 | Enrichissement KB (cycle menstruel opt-in, PHV U18) | 0 (KB seul) | LOW — preparation future fonctionnalite |

**Effort total estime : 15-25 blocs + exercices associes, ~3-5 jours de travail data.**

---

## 6. Quality Gates Release

Les gates suivants doivent etre passes **avant chaque release** qui modifie les fichiers `src/data/`, `src/services/program/`, ou `src/knowledge/`.

### Obligatoires (bloquants)

| Gate | Commande | Seuil |
|------|----------|-------|
| Tests unitaires | `npm run test` | 0 fail |
| TypeScript | `npm run build` (tsc inclus) | 0 erreur |
| Smoke test 18 profils x 6 semaines | `TID-SMK` dans buildWeekProgramEdgeCases.test.ts | 0 crash, toutes sessions ≥1 |
| Volume budget | `TA-17` / `TA-18` dans waveA.test.ts | 0 depassement hors KNOWN_VALIDATION_ISSUES |
| Validation session | `validateSession` | isValid=true hors KNOWN_VALIDATION_ISSUES |

### Recommandes (non bloquants)

| Gate | Verification | Seuil |
|------|-------------|-------|
| Note metier moyenne | Relance corpus 18 profils + scoring | ≥ 74/100 (pas de regression) |
| Couverture KB | Comptage regles visibles dans sorties | ≥ 65% |
| Bloc count | Comptage total blocs dans blocks.v1.json | Progression nette vs 90 (actuel) |

---

## 7. Plan de Stabilisation Produit — 6 Semaines

### Semaine 1-2 : Enrichissement contenu prioritaire

- [ ] BC-01 : Blocs builder upper pull-only (B3)
- [ ] BC-02 : Bloc contrast lower safe-knee (P4)
- [ ] BC-03 : Blocs mobilite supplementaires (deload)
- [ ] Relance corpus 18 profils → verifier note ≥ 74/100
- [ ] Commit + tag `v2.1-content-wave-1`

### Semaine 3-4 : Variete et UX

- [ ] BC-04 a BC-07 : Blocs variete (upper BW, activation, warmup)
- [ ] Review UX : noms de sessions, badges, messages warning lisibles
- [ ] Nettoyage des 77 erreurs lint pre-existantes (si budget)
- [ ] Relance corpus → verifier note ≥ 76/100
- [ ] Commit + tag `v2.2-content-wave-2`

### Semaine 5-6 : Edge cases + preparation beta

- [ ] BC-08 : BLK_NEURAL_UPPER_BAND_SAFE_01 (F3)
- [ ] BC-09 : Enrichissement KB (cycle, PHV)
- [ ] Ajout 3-5 profils supplementaires au corpus (ex: femme pre-season, builder U18, perf off-season)
- [ ] Documentation utilisateur : descriptions sessions, glossaire exercices
- [ ] Relance corpus etendu → verifier note ≥ 76/100 sur profils existants
- [ ] **Freeze content + tag `v2.3-beta-ready`**

### Critere de sortie de stabilisation

Le produit quitte la phase de stabilisation quand :
1. Note moyenne corpus ≥ 76/100 (18+ profils)
2. 0 finding CRITICAL ouvert
3. 0 finding HIGH lie au moteur (seul contenu accepte en HIGH)
4. Quality gates release tous verts
5. Au moins 25 profils dans le corpus (vs 18 actuel)

---

## 8. Risques Residuels

| # | Risque | Probabilite | Impact | Mitigation |
|---|--------|------------|--------|------------|
| R1 | Monotonie exercice sur 8+ semaines degrade la retention utilisateur | Elevee | Moyen | BC-04/BC-05 priorite 2 (variete blocs) |
| R2 | Profil edge case non couvert genere une session vide/absurde en production | Faible | Eleve | Smoke test 18 profils, KNOWN_VALIDATION_ISSUES documente |
| R3 | Ajout de blocs data introduit des regressions (mauvais tags, CI manquantes) | Moyenne | Moyen | programDataIntegrity.test.ts verifie coherence blocs/exercices a chaque run |
| R4 | Pression pour "une derniere correction moteur" qui rouvre la refacto | Elevee | Eleve | Decision executive ci-dessus : moteur gele, demande formelle obligatoire |
| R5 | 77 erreurs lint pre-existantes masquent de vraies erreurs futures | Faible | Faible | Nettoyage en S3-S4 si budget (pas bloquant, toutes dans node_modules ou regles non trouvees) |

### Sur les 77 erreurs lint

Ce sont **60 erreurs `@typescript-eslint/no-unnecessary-type-assertion` et `@typescript-eslint/no-base-to-string` "Definition for rule not found"** + **17 warnings "unused eslint-disable directive"**. Elles proviennent d'une incompatibilite entre la version du plugin TypeScript-ESLint et les regles configurees. Elles existaient avant la refacto et n'ont aucun lien avec le moteur. Le fix est un bump de `@typescript-eslint/eslint-plugin` ou la suppression des regles non trouvees dans `.eslintrc`. A planifier en S3-S4.

### Sur F3 (LIMITED_GYM + shoulder_pain performance)

Ce profil (performance + equipement limite + douleur epaule) n'existe pas dans le corpus de validation actuel (P3 = FULL_GYM, P6 = LIMITED sans shoulder). Le fix (creer `BLK_NEURAL_UPPER_BAND_SAFE_01`, un bloc neural band-only pull EMOM) est prevu en BC-08, priorite 3. Si un utilisateur reel avec ce profil est detecte avant, remonter en priorite 1.

---

## 9. Garde-fous Anti-usine a Gaz

### Regle 1 : Separer moteur et contenu

Le moteur (`buildWeekProgram.ts`, `buildSessionFromRecipe.ts`, `selectEligibleBlocks.ts`, `programPhases.v1.ts`, `validateSession.ts`) est **en lecture seule** sauf incident critique. L'enrichissement du produit passe par les fichiers data : `blocks.v1.json`, `exercices.v1.json`, `sessionRecipes.v1.ts`, et les fichiers KB.

### Regle 2 : Pas de regle locale sans test

Chaque regle metier ajoutee au moteur doit etre couverte par :
- Un test unitaire dans `buildWeekProgram.test.ts` ou `buildWeekProgramEdgeCases.test.ts`
- Un ou plusieurs profils dans `SIMULATION_PROFILES`
- Une verification dans le corpus (smoke test TID-SMK)

### Regle 3 : Le corpus est l'arbitre

Tout debat sur "est-ce que la seance est bonne" se tranche en executant `buildWeekProgram` sur le profil concerne et en evaluant la sortie. Pas de raisonnement abstrait sur le code — on regarde la session generee.

### Regle 4 : La KB guide, le code execute

Les decisions metier (seuils ACWR, caps volume, contraindications) sont documentees dans `src/knowledge/` avec leurs references scientifiques. Le code ne fait qu'appliquer ces decisions. Si une regle n'est pas dans la KB, elle n'a pas sa place dans le moteur.

### Regle 5 : Un bloc = un commit, un test

Chaque ajout de bloc dans `blocks.v1.json` doit etre accompagne d'un run complet des tests. Le test `programDataIntegrity.test.ts` verifie automatiquement :
- Coherence blockId / exerciceId
- Presence des versions W1-W4
- Equipment valide
- Tags coherents avec l'intent

### Regle 6 : Plafond de complexite

Si un correctif necessite de toucher **plus de 2 fichiers dans `src/services/program/`**, c'est probablement une refacto deguisee. Stopper et rediger une spec avant d'implementer.

---

## 10. Recommandation Finale PO / Dev

### Pour le PO

Le moteur de programmes est **termine**. Il genere des seances coherentes pour 16 des 18 profils testes (les 2 restants sont des edge cases extremes documentes et honnetes). La priorite produit se deplace vers :

1. **Contenu** : enrichir les blocs d'exercices pour ameliorer la variete et couvrir plus de cas blessure (+15-25 blocs en 6 semaines)
2. **UX** : noms de sessions lisibles, descriptions comprehensibles, badges clairs
3. **Fonctionnalites produit** : progressive overload (#21), planning club (#20), input charge post-match (#22) — ces features apportent plus de valeur que toute amelioration algorithmique

Ne pas ceder a la tentation de "juste une derniere correction moteur". Le vrai risque produit est desormais la retention, pas la generation.

### Pour le dev

1. **Committer les changements locaux** (FP1 patch + hardening) et tagger `v2.0-engine-freeze`
2. **Demarrer le backlog contenu** (BC-01 a BC-03 en priorite)
3. **Ne pas toucher aux fichiers moteur** sauf si un test du corpus echoue
4. **Ajouter des profils au corpus** au fur et a mesure des retours utilisateurs
5. **Nettoyer le lint** en semaine 3-4 (bump typescript-eslint)
6. **Documenter chaque nouveau bloc** avec sa justification scientifique (coaching notes)

### Signature de gel

> **Le moteur algorithmique de RugbyPrepV2 est gele au 2026-03-13.**
> **392 tests verts. 18 profils valides. 74/100 note moyenne corpus.**
> **Prochaine modification moteur : sur demande formelle uniquement.**
> **Le chantier est desormais l'enrichissement contenu et la mise en marche produit.**

---

## Annexe : Chronologie de la Refacto

| Date | Etape | Note moyenne | Tests |
|------|-------|-------------|-------|
| 2026-03-10 | Diagnostic moteur initial | ~50/100 | ~300 |
| 2026-03-11 | Vague A (P0 corrections critiques) | ~55/100 | ~320 |
| 2026-03-12 AM | Vague B (P1 corrections hautes) | ~60/100 | ~340 |
| 2026-03-12 PM | Vague C1 (algo) + C2 (contenu) | 63→72/100 | 354 |
| 2026-03-12 soir | Release Gate Sprint (RG-01/02/03) | 72→74/100 | 378 |
| 2026-03-13 AM | Final P1 Patch (FP1-01/02) | 74/100 | 382 |
| 2026-03-13 PM | Hardening Pass (F1-F10) | 74/100 | 392 |
| **2026-03-13** | **ENGINE FREEZE** | **74/100** | **392** |
