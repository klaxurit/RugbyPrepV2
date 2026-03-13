---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - _bmad-output/planning-artifacts/research/domain-preparation-physique-rugby-research-2026-03-10.md
  - _bmad-output/planning-artifacts/adversarial-review-engine-2026-03-10.md
  - _bmad-output/planning-artifacts/edge-case-review-engine-2026-03-10.md
  - _bmad-output/planning-artifacts/diagnostic-moteur-synthese-2026-03-10.md
  - _bmad-output/planning-artifacts/research/domain-feminine-u18-rugby-research-2026-03-10.md
workflowType: 'research'
lastStep: 6
research_type: 'domain'
research_topic: 'Gold Standard des microcycles rugby S&C (réel coach terrain)'
research_goals: 'Créer un référentiel opérationnel pour comparer et piloter le moteur RugbyPrepV2'
user_name: 'Coach'
date: '2026-03-10'
web_research_enabled: true
source_verification: true
---

# Gold Standard Rugby Microcycles (S&C) — Référentiel Opérationnel

**Date:** 2026-03-10  
**Auteur:** BMAD Domain Research  
**Périmètre:** RugbyPrepV2 (hommes senior, femmes senior, U18 F/M)

---

## Research Overview

Ce document consolide les audits moteur précédents avec un corpus de microcycles rugby S&C vérifiés (fédérations, littérature, programmes coach publiés), afin de produire des règles directement traduisibles dans le moteur de génération.

Le point critique confirmé: la qualité perçue ne se joue pas sur un exercice isolé, mais sur la cohérence microcycle (ordre des séances, proximité match, alternance charge/récupération, contraintes population).  

Le livrable ci-dessous fournit:
- un corpus structuré (>=12 microcycles exploitables),
- des patterns hebdo validés,
- les écarts par segment (H senior / F senior / U18),
- une table `Règle terrain -> Traduction moteur -> Données`,
- les data manquantes et risques produit.

---

## 1) Corpus structuré des programmes (microcycles exploitables)

### 1.1 Corpus A — Niveau de preuve élevé (fédérations + études)

| ID | Segment | Durée / fréquence | Structure microcycle exploitable | Niveau de preuve | Confiance |
|---|---|---|---|---|---|
| GS-MC-01 | Senior (général rugby) | 4 semaines, 3 séances/sem | `VITESSE + LOWER + UPPER`; règles explicites `repos J+1/J-1`, écart >=1 jour entre SPEED et LOWER | Programme coach (PDF utilisateur) | Élevée |
| GS-MC-02 | U15/U16/U18/Adult | Saison complète; 3x/sem recommandé | Activate: warm-up structuré 15-20 min (youth) / 20-25 min (adult), progression par phases (4 youth, 7 adult), neck/core/COD intégrés | Manuel fédéral World Rugby | Élevée |
| GS-MC-03 | U18 garçons | 8 semaines, 3x/sem | Neck protocol: contractions isométriques auto-résistées 15s (4 directions), intégré pré-saison | RCT (pilot) | Élevée |
| GS-MC-04 | Femmes senior (Rugby-7) | 8 semaines, 2x/sem | KAT warm-up ciblé genou (DKV/RSI), basé FIFA11+/Activate, prévention neuromusculaire | Étude interventionnelle | Modérée à élevée |
| GS-MC-05 | Elite RL in-season | 8 semaines, 2x/sem | Sprint vs sled intégré à semaine match: mar/jeu + 3 gym + 3 techniques + match; bloc répété 4+4 semaines | RCT (PMC) | Élevée |
| GS-MC-06 | Elite RL in-season | 8 semaines, 2x/sem | SSG: 2 séances/sem; chaque séance = 4 x 10 min, récup 3 min; semaine type inclut skills, hypertrophie, prévention | Étude interventionnelle | Élevée |
| GS-MC-07 | Elite rugby | 8 semaines, 2x/sem | Strength/power ondulé + plyométrie; amélioration sprint 5/10/20m | Revue systématique (table intervention) | Modérée |
| GS-MC-08 | Academy rugby | 12 semaines, 2x/sem | Linear periodization RT + rugby; amélioration sprint modérée | Revue systématique (table intervention) | Modérée |
| GS-MC-09 | Academy rugby | 12 semaines, 2x/sem | Undulating RT + rugby; amélioration sprint significative (10/20m) | Revue systématique (table intervention) | Modérée |
| GS-MC-10 | Elite rugby | 8 semaines, 3x/sem | GPP + HIIT + RHIE + RT + skills + speed (avec phase tapering) | Revue systématique (table intervention) | Modérée |
| GS-MC-11 | Pro rugby | 7 semaines, 2x/sem | Individualisation via déséquilibres Force-Velocity (vs non-individualisé) | Revue systématique (table intervention) | Modérée |
| GS-MC-12 | Elite/sub-elite rugby | 9 semaines, 2x/sem | Skill-based conditioning vs conditioning traditionnel (10-20-40m) | Revue systématique (table intervention) | Modérée |

### 1.2 Corpus B — Programmes coach publiés (utiles pour benchmark terrain, preuve plus faible)

| ID | Segment | Durée / fréquence | Structure exploitable | Niveau de preuve | Confiance |
|---|---|---|---|---|---|
| GS-COACH-01 | Rugby union/league (individuel) | 12 semaines, 2x/sem (24 sessions) | Speed program complet: sprint mechanics, accel, top speed, plyo, force, warm-up/cooldown, test toutes les 4 semaines | Offre coach publiée | Modérée |
| GS-COACH-02 | Rugby league senior | 12 semaines, 4 gym + 2 conditioning/sem | Pré-saison hybride force + conditioning, planning 4/5/6 jours | Offre coach publiée | Modérée |
| GS-COACH-03 | Rugby league junior à senior | 6 semaines, 5 jours/sem terrain | Speed/agility/COD/conditioning progressif + warm-ups complets | Offre coach publiée | Modérée |
| GS-COACH-04 | Rugby in-season (union) | Saison (9 mois), 3 jours/sem | Split Lower/Upper/Full + banques conditioning/speed + “game replacement sessions” | Offre coach publiée | Modérée |

### 1.3 Statut des sources utilisateurs locales

- Dossier prioritaire `_bmad-input/raw-programs/`: **non trouvé** au moment de cette recherche (2026-03-10).  
- Source utilisateur effectivement intégrée: `/Users/junca/Downloads/PROGRAMME+VITESSE.pdf` (analyse pages 3-4 + semaines 1-4).

---

## 2) Patterns hebdo validés (ordre séances, match proximity, repos, progression)

| Pattern | Contexte | Ordre recommandé | Contraintes clés | Sources |
|---|---|---|---|---|
| P-01 In-season standard (match samedi) | Senior | `LOWER (J+2/J+3)` -> `SPEED/POWER (J-3/J-2)` -> `UPPER/primer (J-2)` | Pas de séance lourde J-1; espacer LOWER et SPEED; conserver fraîcheur neurale pré-match | GS-MC-01, GS-MC-05, référentiel MD± |
| P-02 In-season match dimanche | Senior | `LOWER mardi` -> `SPEED jeudi` -> `UPPER vendredi` (ou variante selon club) | Repos J+1 et J-1 si possible; adapter aux entraînements club | GS-MC-01 |
| P-03 In-season avec forte charge terrain | Senior | 2 séances S&C + 1 préhab/activation | Réduction volume force, maintien qualité vitesse/power | GS-MC-02, GS-MC-06 |
| P-04 Pre-season développement | Senior | 3-6 séances/sem selon niveau (force + conditioning + speed) | Progression hebdo explicite; surcharge progressive contrôlée | GS-COACH-02, GS-COACH-03 |
| P-05 U18 prévention prioritaire | U18 F/M | 2-3 séances non consécutives + prévention 3 expositions/sem | Caps contact/match, progression prudente, priorité technique/maturation | GS-MC-02, GS-MC-03, FEM-U18 |
| P-06 Femmes senior prévention genou + contact | F senior | Intégrer bloc neuromusculaire 2x/sem + neck/contact prep | Gestion symptom-driven (cycle), pas de phase-based rigide | GS-MC-04, FEM-U18 |

---

## 3) Différences clés par segment (vs masculin senior)

| Segment | Contraintes dominantes | Implication programmation |
|---|---|---|
| Hommes senior | Densité match + charge contact + maintien force/power en saison | Ondulation intra-semaine obligatoire (heavy/medium/light), pilotée par MD± |
| Femmes senior | Profil blessure différent (concussion/ACL burden), variabilité symptomatique inter-individuelle | Maintenir mêmes principes de performance, ajouter couche symptom-driven et prévention neuromusculaire ciblée |
| Filles U18 | Croissance/maturation + contraintes réglementaires mineurs + charge de contact | Hard caps (minutes, contact, récupération), progression prudente, consentement et gouvernance data |
| Garçons U18 | Variabilité maturation + charge cumulée club/école/sélection | Même logique hard caps + suivi maturité (PHV) + monitoring fatigue |

---

## 4) Tableau central — `Règle terrain -> Traduction moteur -> Données nécessaires -> Confiance`

| Règle terrain | Traduction moteur | Données nécessaires | Confiance |
|---|---|---|---|
| Structure séance lisible | `session.archetype` + séquence minimale (`warmup`, `main`, `accessory`, `cooldown`) | recipe metadata + block intents | Élevée |
| In-season = pilotage MD± | `day_proximity_to_match` influence `intensity_profile` et `session_type` | `match_day`, calendrier club, jours dispo | Élevée |
| Ne pas placer heavy J-1 | hard constraint planning (`forbid heavy on MD-1`) | `match_day`, `assigned_day` | Élevée |
| Écarter LOWER et SPEED | hard/soft scheduler rule (`min_gap_days=1`) | type séance + jours | Élevée |
| Ondulation intra-semaine | `heavy -> medium -> light` selon semaine et match | semaine, phase, calendrier | Élevée |
| Progression visible 4 semaines | progression explicite sets/reps/intensité par `week_index` | historique charge + week index | Élevée |
| Déload réel | `deload_profile` réduit volume/intensité + contenu récup | week state + fatigue + ACWR | Élevée |
| U18: max 120 min match/sem | hard cap bloquant | `played_match_minutes_week`, `scheduled_match_minutes` | Élevée |
| U18: >=72h entre matchs | hard cap bloquant | `last_match_at`, `next_match_at` | Élevée |
| U18: cap contact high/medium | hard caps bloquants | `contact_high_minutes_week`, `contact_medium_minutes_week` | Élevée |
| U18: parental consent santé | gate d’accès aux features santé | `age`, `parental_consent_health_data` | Élevée |
| U18: budget prévention min | contrainte de présence de blocs préhab/neck/landing/COD | `prevention_sessions_week` | Modérée à élevée |
| Femmes: cycle = symptom-driven | adaptation soft (volume/intensity factor), jamais prescription phase-based | `cycle_opt_in`, `symptom_score_today`, readiness | Modérée |
| Femmes/U18: prévention genou | priorité tags `neuromuscular`, `landing`, `deceleration`, `knee_control` | tags blocs/exercices | Modérée à élevée |
| Contact prep cou/tronc | quotas minimaux hebdo de `neck` + `trunk/contact` | intents/tags + compteur hebdo | Élevée |
| Séance vitesse terrain explicite | ajouter archetype `SPEED_FIELD` distinct de conditionning générique | recipes + session type | Élevée |
| Cohérence contenu vs planning | scheduler et générateur partagent un contrat de type séance | schema commun (schedule slot -> recipe archetype) | Élevée |
| Qualité mesurable | scorecard hebdo (structure/cohérence/safety/progression/spécificité) | logs génération + règles de validation | Élevée |

---

## 5) Data manquante + plan de comblement

### 5.1 Data manquante critique

1. **Corpus coach privé exploitable machine**  
   - PDF/programmes détaillés (sets/reps/intensité/repos/progression) majoritairement paywalled.
2. **Contexte calendrier complet**  
   - Match day, entraînements club, disponibilité réelle semaine.
3. **Profil population complet**  
   - `populationSegment`, `ageBand`, maturité (PHV), consentements santé.
4. **Historique charge terrain + salle consolidé**  
   - minutes match, contact, RPE/sRPE, compliance séances.
5. **Tags rugby spécifiques insuffisants dans la data actuelle**  
   - COD/agility/contact prep/anti-rotation/neck progressions.

### 5.2 Plan de comblement (3 vagues)

**Vague A (P0, 1-2 semaines)**
- Créer `_bmad-input/raw-programs/` + template de collecte normalisé.
- Ingestion de 10-15 programmes coach (avec droits d’usage internes).
- Activer champs profil/safety déjà définis (U18 + consentement).

**Vague B (P1, 2-4 semaines)**
- Mapper corpus -> `session_archetype` et `microcycle_patterns`.
- Ajouter tags manquants et audits d’intégrité automatiques.
- Construire tests de conformité pattern (MD±, order, caps U18).

**Vague C (P2, continu)**
- Enrichir corpus à 25+ microcycles couvrant féminin/U18.
- Calibrer score qualité sur retours terrain coach/joueur.
- Revue trimestrielle des seuils et constantes.

---

## 6) Risques produit si non implémenté

| Risque | Impact produit | Gravité |
|---|---|---|
| Programmes “techniquement valides” mais non crédibles terrain | Rejet utilisateur coach/joueur, churn | Critique |
| Mauvais ordre/intensité autour du match | Fatigue mal gérée, performance dégradée | Critique |
| Absence de hard caps U18 | Risque safety, exposition réglementaire | Critique |
| Faible spécificité féminine/U18 | Produit perçu “masculin senior par défaut” | Élevée |
| KB non exécutable | Aucune amélioration mesurable malgré enrichissement docs | Élevée |
| Données incomplètes | Personnalisation superficielle | Élevée |

---

## 7) Sources (liens + date + niveau de preuve)

### 7.1 Sources intégrées depuis les audits existants

- `_bmad-output/planning-artifacts/research/domain-preparation-physique-rugby-research-2026-03-10.md` (40+ sources vérifiées)
- `_bmad-output/planning-artifacts/research/domain-feminine-u18-rugby-research-2026-03-10.md` (S1-S22)
- `_bmad-output/planning-artifacts/adversarial-review-engine-2026-03-10.md`
- `_bmad-output/planning-artifacts/edge-case-review-engine-2026-03-10.md`
- `_bmad-output/planning-artifacts/diagnostic-moteur-synthese-2026-03-10.md`

### 7.2 Sources programmes / microcycles (public web + utilisateur)

1. **Programme utilisateur Boost Rugby** (`PROGRAMME+VITESSE.pdf`, local) — pages 3-4, 7-17 (ordre, répartition, progression) — **Niveau: coach terrain**
2. World Rugby Activate Manual (PDF): https://passport.world.rugby/media/2jzjojon/activate_manual-smallest-file-size.pdf — **Niveau: fédération + evidence-based**
3. World Rugby Passport Activate research: https://passport.world.rugby/injury-prevention-and-risk-management/activate-programme/research/ — **Niveau: fédération / implémentation**
4. Sinclair et al. 2021 (8-week in-season sled vs sprint, PMC): https://pmc.ncbi.nlm.nih.gov/articles/PMC8431106/ — **Niveau: RCT**
5. Seitz et al. 2014 (8-week SSG intervention): https://journals.lww.com/nsca-jscr/fulltext/2014/04000/the_athletic_performance_of_elite_rugby_league.14.aspx — **Niveau: intervention**
6. Sanz-Matesanz et al. 2025 systematic review (26 interventions): https://pmc.ncbi.nlm.nih.gov/articles/PMC11843853/ — **Niveau: revue systématique**
7. Attwood et al. 2022 (U18 neck, 8 weeks): https://pubmed.ncbi.nlm.nih.gov/34558993/ — **Niveau: RCT pilot**
8. Knee Armor Training (women Rugby-7, 8 weeks): https://www.mdpi.com/2077-0383/14/11/3779 — **Niveau: intervention**
9. Musashi Off-season Rugby program: https://musashi.com/pages/off-season-rugby-training-program — **Niveau: programme coach publié**
10. Musashi During-season Rugby program: https://musashi.com/pages/during-season-rugby-training-program — **Niveau: programme coach publié**
11. Rugby Speed Coach 12-week speed program: https://www.rugbyspeedcoach.com/copy-of-build-explosive-speed-12w-p — **Niveau: programme coach publié**
12. Rugby Strength & Conditioning “Strength & Speed” (12 weeks): https://www.rugbystrengthandconditioning.com/programmes/p/preseason-program-go — **Niveau: programme coach publié**
13. jfreeperformance Ultimate Preseason (12 weeks): https://www.jarrodfree.com/ultimatepreseason — **Niveau: programme coach publié**
14. The Red Zone Preseason Accelerator (6 weeks): https://redzonerugbyleague.com/product/preseason-accelerator-program/ — **Niveau: programme coach publié**
15. SW7 In-season program (9 months, 3-day split): https://sw7academy.com/in-season-rugby-training-program/ — **Niveau: programme coach publié**

---

## 8) Conclusion opérationnelle

Le corpus est suffisant pour piloter une refacto incrémentale “pro” du moteur, à condition d’imposer ce principe:

1. **Le microcycle est le contrat principal** (et non le bloc isolé).  
2. **Les règles safety/population sont bloquantes** (hard constraints).  
3. **La KB doit devenir exécutable** via constantes, tags, métadonnées et tests de qualité hebdo.  

Sans ce passage “documentation -> règles moteur”, la pertinence perçue restera faible, même avec plus de contenu.

