---
title: 'Décision finale beta + garde-fous produit RugbyPrepV2'
slug: 'decision-beta-garde-fous-rugbyprep'
created: '2026-03-13'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 19', 'Vite', 'TypeScript', 'Supabase']
files_to_modify: ['_bmad-output/planning-artifacts/decision-beta-et-garde-fous-rugbyprep-2026-03-13.md']
code_patterns: ['engine-freeze-5-files', 'data-only-blocks-exercises', '392-tests-green']
test_patterns: ['vitest', 'smoke-test-18-profiles-6-weeks']
---

# Tech-Spec: Décision finale beta + garde-fous produit RugbyPrepV2

**Created:** 2026-03-13

## Overview

### Problem Statement

Le moteur algorithmique RugbyPrepV2 est gelé à v2.0 (392 tests, 74/100 score moyen). Le sprint contenu S1 (BC-01/02/03) est livré avec 2 fix CRITICAL appliqués et 1 régression HIGH documentée (BC-01 sur builder nominal). Il faut une décision formelle GO/NO-GO beta avec des garde-fous explicites pour éviter de livrer des séances dégradées aux premiers utilisateurs.

### Solution

Document de décision structuré couvrant : verdict beta GO conditionnel, matrice de population (inclus/surveillé/exclu), limitations connues acceptées, critères stricts de réouverture moteur, backlog autorisé pendant la beta (contenu/UX/tests uniquement), et quality gates de monitoring.

### Scope

**In Scope:**
- Décision GO / GO conditionnel / NO-GO beta
- Matrice profils : inclus, surveillés, exclus du self-serve
- Known limitations acceptées avec justification
- Critères de réouverture moteur (signaux déclencheurs)
- Backlog autorisé pendant beta (contenu, UX, tests/monitoring — pas moteur)
- Quality gates et monitoring beta

**Out of Scope:**
- Implémentation technique des garde-fous (onboarding warning, analytics, paywall)
- Backlog contenu BC-04+ (détail par item)
- Roadmap monétisation / pricing
- Déploiement infra (Cloudflare, Supabase prod)

## Context for Development

### Hypothèses produit confirmées

- **Cohorte principale beta (50 users)** : seniors H/F, starter + builder principalement, un peu performance
- **Équipement cible** : standard gym — bands / dumbbells / barbell / rack / bench
- **Volume** : 2-3 séances/semaine
- **Population dominante** : sans blessure active ni rehab
- **Inclus** : seniors H/F sans blessure active, U18 H/F avec consentement valide (sans rehab, sans multi-blessures, hors shoulder_pain)
- **Surveillés** : knee_pain simple, low_back_pain simple
- **Exclus self-serve au lancement** : shoulder_pain actif (surtout builder/performance upper/full), rehab, multi-blessures, LIMITED_GYM + shoulder_pain
- **P1 validation finale** : FP1-01 (prehab volume) et FP1-02 (P_shoulder upper) → FERMÉS, ne plus considérer comme ouverts

### Rapports de référence

| Fichier | Contenu |
| ------- | ------- |
| `_bmad-output/planning-artifacts/plan-final-stabilisation-produit-rugbyprep-2026-03-13.md` | Plan master stabilisation + gel moteur |
| `_bmad-output/planning-artifacts/validation-finale-stabilisation-produit-2026-03-13.md` | Validation finale post-RG sprint (score 74/100) |
| `_bmad-output/implementation-artifacts/validation-metier-ciblee-post-bc-s1-2026-03-13.md` | Audit BC-01/02/03 avec sorties moteur réelles |
| `_bmad-output/implementation-artifacts/implementation-sprint-contenu-s1-bc01-bc03-2026-03-13.md` | Rapport implémentation sprint contenu S1 |
| `_bmad-output/implementation-artifacts/implementation-mini-fix-post-bc-mobility-2026-03-13.md` | Mini-fix doublons mobilité post-BC |

### Matrice profils validation → beta (investigation Step 2)

| Cohorte | Profils validés | Score moyen | Statut beta |
|---------|----------------|-------------|-------------|
| **Inclus principale** | S1_BW(72), S2_LTD(74), B1_LTD(78), B2_FULL(82), P1_FULL(90), P2_FULL(85) | **80/100** | GO |
| **Inclus surveillée** | F_senior_in(88), F_senior_pre(85), U18_fille(70), U18_garcon(72) | **79/100** | GO + consentement U18 |
| **Surveillés blessure** | S_knee(68), S_lowback(70), P_knee(65), P_lowback(60) | **66/100** | Monitoring feedback |
| **Exclus self-serve** | S5_BW_shoulder(60), B3_shoulder(55), P_shoulder(55) | **57/100** | EXCLU (shoulder_pain) |

### Limitations connues post-sprint S1

| ID | Sévérité | Description | Impact beta |
|----|----------|-------------|-------------|
| V-H1 | HIGH → ACCEPTÉ | BC-01 régression : builder nominal reçoit pull-only en FULL après cross-session | Non bloquant beta. Profils builder inclus sous monitoring qualité explicite. Ne justifie PAS une réouverture moteur. |
| F-FINAL-M01 | MEDIUM | Monotonie hypertrophy upper BW starter (même bloc 8 semaines) | Affecte S1_BW. Rétention long terme. |
| F-FINAL-M03 | MEDIUM | B3 FULL_BUILDER 100% safety upper (shoulder_pain) | Population EXCLUE de la beta. |
| F-FINAL-M04 | MEDIUM | Deload starter = sessions mobilité identiques | BC-03 fix partiellement appliqué. Pool 3→6 blocs. |

### Décisions techniques déjà prises

- Moteur gelé : aucune modification des 5 fichiers moteur sans demande formelle + régression test 108 cas
- Sprint contenu S1 livré : BC-02 fix (plyo tag), BC-03 fix (calf_stretch_wall), BC-01 régression acceptée
- V-H1 (BC-01 régression builder) : accepté comme limitation connue non bloquante, profils builder restent inclus sous monitoring, ne justifie pas de réouverture moteur
- FP1-01 (prehab volume U18/femmes) et FP1-02 (P_shoulder upper) : FERMÉS
- 392 tests verts, build OK

## Implementation Plan

### Tasks

- [ ] Task 1 : Rédiger le document de décision beta
  - File : `_bmad-output/planning-artifacts/decision-beta-et-garde-fous-rugbyprep-2026-03-13.md`
  - Action : Créer le document complet avec les 8 sections demandées (executive decision, verdict, known limitations, matrice profils, critères réouverture moteur, backlog autorisé, monitoring/quality gates, recommandation finale)
  - Notes : S'appuyer sur les 5 rapports de référence + hypothèses produit confirmées + matrice profils Step 2

### Acceptance Criteria

- [ ] AC 1 : Given le document rédigé, when on vérifie la section "Executive Decision", then elle contient un verdict GO/GO conditionnel/NO-GO clair avec justification basée sur les scores de validation (80/100 cohorte principale)
- [ ] AC 2 : Given le document rédigé, when on vérifie la matrice profils, then chaque profil des 18 profils de validation est classé dans exactement une catégorie (inclus/surveillé/exclu) avec score et justification
- [ ] AC 3 : Given le document rédigé, when on vérifie les known limitations, then V-H1, F-FINAL-M01, F-FINAL-M03, F-FINAL-M04 sont listées avec leur impact beta et la décision prise (accepté/exclu/monitored)
- [ ] AC 4 : Given le document rédigé, when on vérifie les critères de réouverture moteur, then il y a une liste exhaustive de signaux (avec seuils) distinguant "fixable contenu" vs "nécessite réouverture moteur"
- [ ] AC 5 : Given le document rédigé, when on vérifie le backlog autorisé, then il est explicitement segmenté en catégories (contenu/UX/tests) avec la mention "moteur interdit sauf critère de réouverture"
- [ ] AC 6 : Given le document rédigé, when on vérifie le monitoring, then il existe des quality gates mesurables (feedback utilisateur, taux de complétion séance, signaux de régression)
- [ ] AC 7 : Given les exclusions shoulder_pain, when on vérifie la cohérence, then les profils S5_BW_shoulder, B3_shoulder, P_shoulder sont tous marqués exclus avec justification (score <60/100, séances dégradées)
- [ ] AC 8 : Given les U18 inclus, when on vérifie les conditions, then le consentement valide est requis, et les conditions d'exclusion (rehab, multi-blessures, shoulder_pain) sont explicites

## Additional Context

### Dependencies

- Aucune dépendance technique — document de décision stratégique uniquement
- Les 5 rapports de référence doivent être lus pour rédiger le document
- Les hypothèses produit ont été confirmées par le PO dans la conversation

### Testing Strategy

- Validation manuelle : relecture du document par le PO contre les 8 AC ci-dessus
- Cohérence croisée : vérifier que chaque affirmation du document est traçable à un rapport source

### Notes

- **Risque principal** : le document pourrait devenir un "plan de plus" sans impact opérationnel. Pour l'éviter, chaque section doit contenir une action concrète ou un seuil mesurable.
- **Limitation connue** : BC-01 régression (V-H1) non corrigeable data-only sans casser validateSession. Documentée comme limitation beta acceptée.
- **Future considération** : après la beta, les données de feedback réel remplaceront les scores de validation internes comme critère de qualité.
