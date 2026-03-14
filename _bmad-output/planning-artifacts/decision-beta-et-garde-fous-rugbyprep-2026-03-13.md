# Décision Finale Beta + Garde-Fous Produit — RugbyPrepV2

**Date** : 2026-03-13
**Auteur** : PO + dev (assisté IA)
**Baseline actuelle** : 392 tests ✅ — Build OK ✅ — Moteur gelé
**Revue adversariale** : 12 findings (2 CRITICAL, 4 HIGH, 4 MEDIUM, 2 LOW) — tous traités ci-dessous

---

## 0. Timeline des baselines

| Étape | Commit | Tests | Changements |
|-------|--------|-------|-------------|
| Validation finale (score 74/100) | `1e18345` | 378 | 18 profils × 6 semaines validés |
| Gel moteur v2.0 | `48e4016` | 378 | Tag officiel freeze |
| Sprint contenu S1 (BC-01/02/03) | `48e4016` + patches data | 392 | +1 exercice, +6 blocs, +14 smoke tests |
| Mini-fix post-BC (F1/F2 mobilité) | idem | 392 | 2 blocs patchés (exercise overlap) |
| Fix post-validation métier (BC-02/BC-03) | idem | 392 | +1 exercice (calf_stretch_wall), +1 tag (plyo) |

Les 14 tests supplémentaires (378→392) proviennent du sprint BC-S1 (smoke tests profils builder/performance). Les deux chiffres sont valides à leur baseline respective. Ce document se base sur l'état actuel : **392 tests**.

---

## 1. Executive Decision

Le moteur algorithmique RugbyPrepV2 est **structurellement terminé**. Les 18 profils de validation produisent des programmes crédibles. Les profils nominaux adultes sans blessure atteignent ~80/100 en moyenne. Le sprint contenu S1 est livré avec corrections.

**Cependant** : les garde-fous UX (exclusion shoulder_pain à l'onboarding, consentement U18) **ne sont pas implémentés**. Les métriques de monitoring (feedback form, analytics qualité séance) **n'existent pas encore**. Le périmètre de gel moteur initialement défini couvrait 5 fichiers sur ~15 qui constituent l'engine.

**La beta peut être lancée sous forme fermée et recrutée manuellement**, où le PO vérifie les critères d'inclusion de chaque participant. Une beta self-serve (inscription libre) nécessite des prérequis supplémentaires non encore remplis.

---

## 2. Verdict

### GO — BETA FERMÉE / RECRUTÉE MANUELLEMENT

| Critère | Statut | Notes |
|---------|--------|-------|
| Moteur gelé et stable | ✅ | 392 tests, 0 régression structurelle |
| Profils nominaux adultes crédibles | ✅ | 6 profils à ~80/100 moyen |
| Profils surveillés viables | ✅ | 3 profils in_season à ~77/100 moyen (femmes, U18 sains) |
| Profils dégradés identifiés | ✅ | shoulder_pain, rehab, multi-blessures documentés |
| Sprint contenu S1 livré | ✅ | BC-02 + BC-03 fix appliqués |
| Limitations documentées | ✅ | V-H1 accepté, F-FINAL-M01/M04 documentés |
| **Garde-fous UX implémentés** | ❌ | **Pas de blocage onboarding shoulder_pain** |
| **Consentement U18 implémenté** | ❌ | **Pas de formulaire parental** |
| **Feedback form beta** | ❌ | **Aucun instrument de collecte feedback** |
| **Modes saison validés** | ⚠️ | **Seul in_season validé (15/18 profils)** |

**Conséquence** : Le GO s'applique à une **beta fermée** où le PO recrute et vérifie manuellement chaque participant. Le PO est le garde-fou humain qui remplace les garde-fous UX manquants.

### Trajectoire vers beta self-serve

| Jalon | Prérequis | Statut |
|-------|-----------|--------|
| **Beta fermée** (maintenant) | Recrutement manuel, vérification profils par PO | ✅ Prêt |
| **Beta self-serve** (après) | Onboarding warning shoulder_pain + consentement U18 + feedback form + restriction in_season | ❌ À implémenter |
| **Ouverture grand public** (futur) | Shoulder_pain traité + off/pre-season validés + monitoring instrumenté + backlog contenu BC-04+ | ❌ Lointain |

---

## 3. Known Limitations Acceptées

### Acceptées — non bloquantes pour la beta fermée

| ID | Sévérité | Description | Décision | Justification |
|----|----------|-------------|----------|---------------|
| **V-H1** | HIGH → ACCEPTÉ | Builder nominal reçoit pull-only en FULL_BUILDER après cross-session exclusion | Inclus sous monitoring | Session `isValid=true`. Suboptimal mais pas dangereux. Affecte uniquement la 3e session/semaine des builders 3x. Non corrigeable data-only sans casser `validateSession`. Ne justifie pas une réouverture moteur. |
| **F-FINAL-M01** | MEDIUM | Monotonie hypertrophy upper BW starter (même bloc 8 semaines) | Accepté | Impact rétention long terme, pas sécurité. Corrigible par ajout de blocs contenu (backlog BC-04+). |
| **F-FINAL-M04** | MEDIUM | Deload starter = sessions mobilité peu variées | Accepté | Pool passé de 3 à 6 blocs (BC-03). Variété complète nécessite plus de contenu. |

### Exclues — populations retirées

| Critère | Score validation | Raison | Alternative |
|---------|----------------|--------|-------------|
| **shoulder_pain actif** | 55-60/100 | Sessions upper/full dégradées. Pull-only ou safety core. | Accompagnement coach hors self-serve. |
| **Rehab actif** | Non validé | Programmes rehab P1/P2/P3 non testés self-serve. | Suivi kiné + coach obligatoire. |
| **Multi-blessures (≥2)** | Non validé | Combinaisons non testées. | Cas par cas avec coach. |
| **LIMITED_GYM + shoulder_pain** | Non validé | Combinaison la plus dégradée. | Exclusion stricte. |
| **off_season / pre_season** | 0 profils off-season validés, 2 pre-season (femmes uniquement) | Recettes non testées pour la majorité des profils. | Restreint à in_season pour la beta fermée. Si un user recruté est en off/pre-season, le dev vérifie manuellement la sortie moteur avant activation. |

### Résolution des findings de la validation finale

| Finding original | Nommage decision | Statut | Traçabilité |
|-----------------|------------------|--------|-------------|
| F-FINAL-H01 (volume prehab U18/femmes 12/10) | FP1-01 | Fermé | Confirmé PO conversation 2026-03-13. Non vérifiable par commit dédié. |
| F-FINAL-H03 (P_shoulder upper = 4 blocs) | FP1-02 | Fermé | Confirmé PO conversation 2026-03-13. Non vérifiable par commit dédié. |
| F-FINAL-H02 (volume femme senior W4 = 25/20) | Lié à FP1-01 | Fermé | Même correction que FP1-01 (prehab exclu du comptage). |

---

## 4. Profils / Cas — Inclus, Surveillés, Exclus

### Inclus — cohorte principale beta fermée (cible : 35-40 users sur 50)

| Profil type | Niveau | Équipement | Score | Notes |
|-------------|--------|------------|-------|-------|
| Senior H sain | starter | bands / dumbbells | 72-74 | Cible principale. 2 séances/semaine. |
| Senior H sain | builder | dumbbells / barbell / bench | 78-82 | Cible principale. 2-3 séances/semaine. |
| Senior H sain | performance | full gym (rack, barbell, bench, bands) | 85-90 | Minorité. 2-3 séances/semaine. DUP in-season. |

**Équipement cible** : bands / dumbbells / barbell / rack / bench (standard gym)
**Mode saison** : **in_season uniquement** pour la beta fermée.

**Moyenne cohorte principale : ~80/100** (6 profils adultes H sans blessure)

### Inclus — cohorte surveillée (cible : 5-10 users sur 50)

| Profil type | Niveau | Score | Conditions d'inclusion |
|-------------|--------|-------|----------------------|
| Senior F saine | performance | 85-88 | Incluse. ACL prehab automatique. In_season uniquement. |
| U18 garçon sain | starter | 72 | **Consentement parental vérifié manuellement par PO.** Sans rehab, sans multi-blessures, hors shoulder_pain. In_season uniquement. |
| U18 fille saine | starter | 70 | **Consentement parental vérifié manuellement par PO.** Sans rehab, sans multi-blessures, hors shoulder_pain. ACL prehab actif. In_season uniquement. |

**Moyenne cohorte surveillée : ~77/100** (3 profils in_season : F_in=88, U18_f=70, U18_g=72. F_pre exclue car beta restreinte à in_season.)

### Surveillés — blessure simple (admission au cas par cas, vérification manuelle)

| Profil type | Blessure | Score | Condition |
|-------------|----------|-------|-----------|
| Starter / builder | knee_pain simple | 65-68 | **Le dev exécute `buildWeekProgram` pour ce profil exact et vérifie visuellement la sortie W1 avant activation.** Feedback séance par séance. |
| Starter / builder | low_back_pain simple | 60-70 | **Même vérification manuelle.** Feedback séance par séance. |
| Performance | knee_pain ou low_back_pain simple | 65-75 | **Même vérification manuelle.** Accepté car le moteur gère les CI au niveau exercice. |

**Règle** : Un seul type de blessure à la fois. Si le joueur signale une 2e blessure → exclusion, accompagnement coach.

---

## 5. Périmètre Gel Moteur (redéfini)

### Définition réaliste

Le moteur n'est pas 5 fichiers — c'est **tout ce qui influence la sélection, la génération et la validation des séances**. Le périmètre gel couvre :
- l'intégralité de `src/services/program/` (11 fichiers)
- `src/data/sessionRecipes.v1.ts` (recettes session — hors `src/services/program/` mais fait partie intégrante du moteur)

### Fichiers gelés (exhaustif)

| Fichier | Rôle |
|---------|------|
| `buildWeekProgram.ts` | Orchestration semaine, routing recettes, cross-session |
| `buildSessionFromRecipe.ts` | Construction session, scoring, focus filter, safety fallback |
| `selectEligibleBlocks.ts` | Filtrage blocs (equipment, CI, level) |
| `programPhases.v1.ts` | Phases DUP, périodisation |
| `validateSession.ts` | Validation post-build (balance, volume, finishers) |
| `src/data/sessionRecipes.v1.ts` | **Recettes session** : sequence, slotFocusTags, preferredTags, focusTagsAny ⚠️ *Situé dans `src/data/`, pas dans `src/services/program/`* |
| `qualityGates.ts` | Quality gates (full-body balance, volume budget, rehab, starter count) |
| `safetyContracts.ts` | Contrats sécurité (prehab injection, UX guards) |
| `ruleConstants.v1.ts` | Constantes moteur (seuils, max finishers, etc.) |
| `resolveMicrocycleArchetype.ts` | Résolution archétype microcycle |
| `positionPreferences.v1.ts` | Préférences par poste rugby (scoring) |

### Fichiers modifiables (data uniquement)

| Fichier | Contenu modifiable |
|---------|--------------------|
| `src/data/blocks.v1.json` | Ajout/modification blocs (exercices, tags, CI, versions) |
| `src/data/exercices.v1.json` | Ajout/modification exercices |

### Procédure de réouverture moteur

1. Demande formelle documentée (issue GitHub ou rapport)
2. Root cause analysis traçable à un fichier du périmètre gelé
3. Patch minimal + régression test sur corpus complet (18 profils × 6 semaines = 108 cas)
4. Revue adversariale post-patch
5. Re-freeze après validation

---

## 6. Critères de Réouverture Moteur

### Signaux qui NE justifient PAS une réouverture

| Signal | Action correcte |
|--------|----------------|
| Monotonie exercice / manque de variété | Ajouter des blocs dans `blocks.v1.json` |
| Bloc manquant pour un profil spécifique | Ajouter des blocs/exercices dans les fichiers data |
| Feedback "séance trop facile / trop dure" | Ajuster les versions (W1-W4) dans les blocs existants |
| Tags manquants sur un bloc | Corriger les tags dans `blocks.v1.json` |

### Signaux qui JUSTIFIENT une réouverture (seuils formels)

| Signal | Seuil | Procédure |
|--------|-------|-----------|
| **Bug structurel** : session retourne 0 blocs ou crash pour un profil inclus | 1 occurrence confirmée | Hotfix moteur + régression 108 cas |
| **Faux négatif sécurité** : exercice contre-indiqué livré à un joueur blessé | 1 occurrence confirmée | Hotfix immédiat + audit CI |
| **Faux positif sécurité** : `validateSession` rejette une session valide métier | 3 occurrences distinctes | Analyse root cause + patch ciblé |
| **Régression cross-session** : même bloc 2x dans la même session (hors starter) | 1 occurrence confirmée | Debug `canUseBlock` + fix |
| **≥5 users abandonnent explicitement à cause de la qualité des séances** | Feedback qualitatif direct (Slack/Discord/formulaire) | Diagnostic complet : contenu vs moteur. Si moteur → réouverture ciblée. |

---

## 7. Backlog Autorisé Pendant la Beta

### ✅ Autorisé — Contenu (data-only)

| Type | Fichiers modifiables | Exemples |
|------|---------------------|----------|
| Nouveaux exercices | `exercices.v1.json` | Variantes upper BW, exercices mobilité |
| Nouveaux blocs | `blocks.v1.json` | Blocs hypertrophy upper starter, activation lower perf |
| Tags / métadonnées | `blocks.v1.json` | Ajout tags focus, correction CI |

### ✅ Autorisé — UX / Frontend

| Type | Exemples |
|------|----------|
| Affichage séances | Labels, descriptions, coaching notes |
| **Onboarding guardrails** (prérequis self-serve) | Warning shoulder_pain, consentement U18, restriction saison |
| **Feedback form** (prérequis self-serve) | Question post-séance : "Séance adaptée ? oui/non + commentaire" |
| Pages existantes | ProfilePage, WeekPage, SessionDetailPage, MobilityPage |

### ✅ Autorisé — Tests / Monitoring

| Type | Exemples |
|------|----------|
| Smoke tests supplémentaires | Nouveaux profils dans le corpus |
| Tests data integrity | TID-DAT-007+ pour nouveaux blocs/exercices |
| Vérification manuelle profils beta | `buildWeekProgram` sur chaque profil recruté avant activation |

### ❌ Interdit — Moteur (tout `src/services/program/` + `src/data/sessionRecipes.v1.ts`)

Exception unique : critère de réouverture formel (section 6).

---

## 8. Monitoring Beta Fermée

### Pré-lancement (avant activation des 50 users)

| Action | Responsable | Critère de succès |
|--------|-------------|-------------------|
| Exécuter `buildWeekProgram` pour chaque profil beta recruté (W1) | Dev | 0 safety fallback sur slots majeurs pour profils inclus |
| Vérifier que chaque profil recruté respecte les critères d'inclusion | PO | 100% des profils vérifiés manuellement |
| Vérifier absence de shoulder_pain / rehab / multi-blessures | PO | 0 profil exclu dans la cohorte |
| Vérifier consentement parental U18 | PO | Consentement obtenu et archivé |
| Vérifier in_season pour tous les participants | PO | 0 profil off/pre-season non vérifié |
| **Créer un canal feedback beta** (Slack, Discord ou formulaire) | PO | Canal actif avant activation du 1er user |

### Pendant la beta (semaines 1-4)

| Métrique | Source | Comment la mesurer | Seuil d'alerte | Action |
|----------|--------|-------------------|-----------------|--------|
| Feedback qualitatif | Canal Slack/Discord beta | Messages directs des users | ≥3 feedbacks négatifs même profil type | Analyse profil + enrichissement contenu ou exclusion |
| Taux de complétion séance | User self-report (canal beta) | "As-tu fait ta séance ?" question hebdo | <50% sur 1 semaine (≥5 users ne font pas leurs séances) | Diagnostic UX vs contenu vs motivation |
| Abandon explicite qualité | Feedback qualitatif direct | User dit "j'arrête parce que les séances sont mauvaises" | ≥5 users | Diagnostic obligatoire (section 6) |
| Bug / crash / session vide | GitHub issues + canal beta | Report direct | 1 occurrence | Hotfix immédiat |
| Revue manuelle sessions W1-W4 | Dev exécute `buildWeekProgram` | Spot check 5 profils/semaine | Safety fallback sur slots majeurs | Enrichissement contenu ou investigation moteur |

### Monitoring spécifique V-H1 (builder 3x)

| Signal | Comment le détecter | Action |
|--------|-------------------|--------|
| User builder 3x signale "ma 3e séance ressemble à la 1re" | Feedback Slack/Discord | Comparer manuellement les sessions. Si pull-only en FULL → documenter fréquence. Enrichir pool blocs si contenu insuffisant. |

### Monitoring spécifique blessure simple (knee/lowback)

| Signal | Comment le détecter | Action |
|--------|-------------------|--------|
| User signale exercice inadapté / douloureux | Feedback direct | Audit CI du bloc immédiat. Hotfix data si tag CI manquant. |
| User signale 2e blessure | Feedback direct | Exclusion self-serve, accompagnement coach. |

---

## 9. Recommandation Finale

### Pour le PO

1. **Lancer la beta fermée maintenant.** Le moteur est prêt. Tu es le garde-fou humain pour les 50 premiers users. Tu recrutes, tu vérifies les profils, tu collectes le feedback.
2. **Ne pas présenter comme "self-serve" ce qui ne l'est pas.** Tant que l'onboarding ne bloque pas shoulder_pain et que le consentement U18 n'est pas implémenté, la beta est fermée et encadrée.
3. **Recruter d'abord les profils les plus solides** : seniors H sans blessure, builder avec gym standard, in_season. Ce sont tes ~80/100.
4. **Les U18 et femmes sont un atout différenciant** (ACL prehab), mais les inclure uniquement avec consentement vérifié.
5. **Shoulder_pain = pas maintenant.** L'exclure n'est pas un échec, c'est de l'honnêteté produit.
6. **Préparer en parallèle les prérequis self-serve** : onboarding guardrails + feedback form + restriction saison. C'est le jalon suivant.

### Pour le dev

1. **Ne touche pas au moteur.** Le périmètre gel couvre tout `src/services/program/`. Si tu veux améliorer un programme, ajoute un bloc ou un exercice dans les JSON.
2. **Avant chaque sprint contenu** : vérifier les `slotFocusTags` de la recette cible + le pool de blocs avec `canUseBlock`. Leçon BC-01/02/03 : 2 blocs sur 3 ne s'activaient pas à cause d'un mismatch focus filter.
3. **Après chaque sprint contenu** : smoke test 18+ profils × 6 semaines.
4. **Avant activation de chaque user beta** : exécuter `buildWeekProgram` sur le profil exact et vérifier visuellement W1.
5. **Implémenter les prérequis self-serve** dès que possible : onboarding warning shoulder_pain, consentement U18, feedback form, restriction in_season.
6. **Si bug moteur** : suivre la procédure de réouverture (section 6). Pas de hotfix sauvage sur les fichiers gelés.

---

## Annexe : Traçabilité des décisions

| Décision | Source | Vérifiable par |
|----------|--------|----------------|
| Score moyen adultes nominaux ~80/100 | `validation-finale` §3 (S1=72, S2=74, B1=78, B2=82, P1=90, P2=85) | Calcul direct |
| Score moyen surveillés ~77/100 | `validation-finale` §3 (F_in=88, U18_f=70, U18_g=72) → 230/3=76.7 — F_pre exclue (beta in_season) | Calcul direct |
| Majorité des écarts = contenu | `plan-final-stabilisation` §9, `validation-finale` §7 | Évaluation qualitative (nombre de findings DATA vs ALGO) |
| BC-02 fix plyo tag | `validation-metier-ciblee` §2.3 | Code dans `blocks.v1.json` |
| BC-03 fix calf_stretch_wall | `validation-metier-ciblee` §3.3 | Code dans `blocks.v1.json` + `exercices.v1.json` |
| V-H1 non corrigeable data-only | `validation-metier-ciblee` §1.4 | Analyse technique documentée |
| FP1-01 = F-FINAL-H01 (volume prehab) | Confirmation PO 2026-03-13 | Non vérifiable par commit dédié |
| FP1-02 = F-FINAL-H03 (P_shoulder upper) | Confirmation PO 2026-03-13 | Non vérifiable par commit dédié |
| Exclusion shoulder_pain | Décision PO 2026-03-13 | Conversation documentée |
| Restriction in_season | Finding F9 revue adversariale | 0/18 profils off-season validés |
| Périmètre gel élargi | Findings F5/F6 revue adversariale | `sessionRecipes.v1.ts` + `qualityGates.ts` contrôlent le moteur |
| Beta fermée (pas self-serve) | Finding F1 revue adversariale | Garde-fous UX non implémentés |
| 392 tests (pas 378) | Sprint BC-S1 post validation finale | +14 smoke tests entre les deux baselines |

---

## Annexe : Résolution des 12 findings adversariaux

| ID | Sévérité | Résolution dans ce document |
|----|----------|-----------------------------|
| F1 | CRITICAL | Verdict changé : GO beta **fermée** (recrutement manuel). Self-serve = jalon séparé. §2 |
| F2 | CRITICAL | Timeline baselines ajoutée. 378→392 expliqué. §0 |
| F3 | HIGH | Seuil "score <65" supprimé. Remplacé par feedback qualitatif observable. §8 |
| F4 | HIGH | Métrique [SAFETY] supprimée. Remplacée par vérification manuelle pré-lancement. §8 |
| F5 | HIGH | `sessionRecipes.v1.ts` ajouté au périmètre gelé. §5 |
| F6 | HIGH | Périmètre gel redéfini : tout `src/services/program/`. Liste exhaustive. §5 |
| F7 | MEDIUM | Moyennes séparées : adultes ~80/100, surveillés 79/100. §4 |
| F8 | MEDIUM | Mapping FP1-01→F-FINAL-H01, FP1-02→F-FINAL-H03 explicité. "Non vérifiable par commit" noté. §3 |
| F9 | MEDIUM | Beta restreinte à in_season. Off/pre-season exclus ou vérifiés manuellement. §4 |
| F10 | MEDIUM | Critère remplacé : "≥5 users abandonnent explicitement qualité séance". §6 |
| F11 | LOW | "90%" reformulé en "majorité" (évaluation qualitative). §9 Annexe traçabilité |
| F12 | LOW | Timeline commits ajoutée avec explication des 14 tests supplémentaires. §0 |
