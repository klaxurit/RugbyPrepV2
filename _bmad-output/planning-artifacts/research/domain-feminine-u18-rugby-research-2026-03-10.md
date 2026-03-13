---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - _bmad-output/planning-artifacts/research/domain-preparation-physique-rugby-research-2026-03-10.md
  - _bmad-output/planning-artifacts/adversarial-review-engine-2026-03-10.md
  - _bmad-output/planning-artifacts/edge-case-review-engine-2026-03-10.md
  - _bmad-output/planning-artifacts/diagnostic-moteur-synthese-2026-03-10.md
workflowType: 'research'
research_type: 'domain'
research_topic: 'Référentiel S&C rugby pour populations Féminines et U18 (implications moteur RugbyPrepV2)'
research_goals: 'Définir des règles scientifiques moteur-ready pour Femmes senior, Filles U18 et Garçons U18'
user_name: 'Coach'
date: '2026-03-10'
web_research_enabled: true
source_verification: true
---

# Research Report: domain

**Date:** 2026-03-10  
**Author:** Coach  
**Research Type:** domain

---

## Research Overview

Ce document complète le référentiel rugby S&C existant avec un focus opérationnel sur trois segments absents du moteur actuel: **femmes senior**, **filles U18** et **garçons U18**.  
Objectif: transformer la littérature et les guidelines en **règles exploitables par le moteur** (seuils, tags, métadonnées, exclusions, garde-fous data/consentement).

La conclusion est claire: RugbyPrepV2 peut rester sur une architecture incrémentale, mais doit ajouter une couche “population-aware” et “safety contracts” (âge, maturité, sexe biologique pertinent, consentement, charge de contact, fatigue, symptômes).

---

## 1) Contraintes d’entraînement: écarts vs population masculine senior

### A. Femmes senior (vs hommes senior)

- **Concussion et charge de contact restent prioritaires**: en rugby féminin, la concussion est fréquente et le tackle concentre un fort burden blessure (pas un sujet mineur) [S1][S2][S3].
- **Exposition impacts tête**: plus faible que chez les hommes dans les cohortes iMG, mais non négligeable; le risque reste piloté par les situations de contact [S4].
- **Physiologie féminine**: les effets du cycle menstruel sur performance sont globalement petits et hétérogènes; la stratégie robuste est **individualisée**, pas un “plan phase-based” rigide [S5].
- **Santé féminine élargie** (cycle, énergie, pelvien, sein): sujet de performance + santé à monitorer, avec environnement de confiance [S6][S7].

### B. U18 filles et U18 garçons (vs hommes senior)

- **Maturation biologique**: variabilité très forte, surtout autour du pic de croissance (PHV), avec hausse du risque lésionnel -> charge et progression doivent suivre la maturité, pas seulement l’âge civil [S8][S9].
- **Cadre de charge de contact plus strict**: des plafonds explicites existent en age-grade (minutes de contact/match, récupération) et doivent être traités comme des contraintes du moteur [S10].
- **Prévention systématique avant performance**: programmes neuromusculaires type Activate, surtout à haute adhérence, réduisent significativement l’incidence blessure en scolaire rugby [S11][S12].
- **Mineurs = contraintes légales + safeguarding**: consentement, traitement des données de santé, supervision et signalement [S13][S14][S15][S16].

---

## 2) Recommandations charge / volume / intensité / fréquence par segment

> Ces fourchettes sont destinées au moteur comme **bornes de planification**, pas comme prescription médicale individuelle.

| Segment | Fréquence S&C | Intensité / Répétitions (guidage moteur) | Volume hebdo (guidage moteur) | Confiance |
|---|---|---|---|---|
| Femmes senior | 2-3 séances/semaine | Force: `3-5 x 3-6 reps @ ~75-90%` ; Puissance: `3-5 x 2-4 reps` charge légère-moyenne + intention vitesse | 2 blocs “main lift”/semaine + 1 bloc prévention systématique | Modérée |
| Filles U18 pre/circa PHV | 2-3 séances/semaine non consécutives | Technique-force: `2-4 x 5-8 reps @ ~50-75%` ; vitesse/coordination priorisées | Progression lente, éviter pics simultanés (contact + excentrique + volume) | Modérée |
| Filles U18 post-PHV | 2-3 séances/semaine | Force: `3-4 x 4-6 reps @ ~65-85%` selon compétence | Prévention neuromusculaire >=3 expositions/semaine | Modérée |
| Garçons U18 pre/circa PHV | 2-3 séances/semaine non consécutives | Technique-force: `2-4 x 5-8 reps @ ~50-75%` | Mêmes garde-fous de ramp-up et de récupération | Modérée |
| Garçons U18 post-PHV | 2-3 séances/semaine | Force: `3-5 x 3-6 reps @ ~70-88%` selon compétence | Conserver budget prévention + contrôle charge externe | Modérée |

**Note:** Les chiffres d’intensité sont des **bornes pratiques d’ingénierie** basées sur consensus S&C jeunesse/adulte + littérature rugby; ils doivent rester adaptatifs via readiness/fatigue et sécurité [S8][S9][S10][S11][S21][S22].

### 2.1 Femmes senior (rugby XV)

- **S&C hebdo**: 2 séances minimum, 3 en période non saturée.
- **Force**: 2 blocs/semaine (dominantes force-puissance), volume modulé selon match proximity et fatigue.
- **Prévention neuromusculaire**: 2 à 3 expositions/semaine (intégrées warm-up ou bloc dédié).
- **Règle cycle menstruel**:
  - ne pas présumer une baisse de performance “par phase”;
  - autoréguler via symptômes individuels (douleur, sommeil, fatigue, RPE anormal).
- **Quand symptômes élevés (opt-in athlète)**: réduire volume total du jour (~10-20%), conserver qualité technique et vitesse, éviter cumul “haute excentricité + haute collision”.

**Confiance:** Modérée (évidence solide sur individualisation; faible sur protocoles universels par phase) [S5][S6][S7].

### 2.2 Filles U18

- **S&C hebdo**: 2 à 3 séances non consécutives.
- **Préhab/neuromusculaire**: objectif 3 expositions/semaine (format Activate ou équivalent).
- **Contact load hebdo (hard caps moteur)**:
  - high intensity contact <= 15 min/semaine
  - medium intensity contact <= 30 min/semaine
  - temps de match <= 120 min/semaine
  - récupération inter-match >= 72 h
- **PHV window (si détectée)**: réduire progression agressive de charge externe; priorité technique, coordination, contrôle frontal/genou, atterrissages/COD.

**Confiance:** Élevée pour caps contact et Activate; modérée pour réglages PHV fins [S10][S11][S12][S8][S9].

### 2.3 Garçons U18

- **Même socle que filles U18** pour caps de contact/récupération age-grade.
- **S&C hebdo**: 2 à 3 séances; progression graduelle, supervision stricte, technique d’abord.
- **PHV window**: même logique de réduction du risque de surcharge mécanique pendant croissance rapide.

**Confiance:** Élevée pour caps age-grade; modérée pour dosages individuels autour PHV [S10][S8][S9][S17][S18].

---

## 3) Cycle menstruel: intégration produit (sans surpromesse)

### Ce que le produit doit faire

- Proposer un **tracking optionnel** (opt-in explicite) centré symptômes/ressenti.
- Utiliser les données pour ajuster la charge **à la marge** (autorégulation), pas pour “interdire” des blocs.
- Expliquer clairement: “les réponses sont individuelles; pas de règle universelle par phase”.

### Ce que le produit ne doit pas faire

- Ne pas imposer des prédictions fortes “phase X = mauvaise performance”.
- Ne pas collecter de données de cycle sans base légale claire + consentement valide.
- Ne pas exposer ces données dans l’UI équipe sans minimisation/contrôle d’accès.

**Confiance:** Modérée [S5][S6][S7][S14][S15].

---

## 4) Risques blessure prioritaires + prévention ciblée

### Priorité 1: Concussion / tête-cou / contact

- **Risque:** tackle/carry = nœud principal de burden en rugby féminin [S1][S2][S3][S4].
- **Prévention moteur-ready:** bloc cou/tronc régulier + dose neuromusculaire + contrôle charge contact.

### Priorité 2: Genou (incl. ACL) / contrôle neuromusculaire

- **Risque:** femmes et adolescentes exposées à un risque ACL plus élevé dans plusieurs sports; la prévention neuromusculaire réduit le risque [S19][S20].
- **Prévention moteur-ready:** tags ACL-prep (décélération, atterrissage, genou-hanche-tronc, feedback coaching).

### Priorité 3: Blessures croissance/maturation (U18)

- **Risque:** période de croissance rapide associée à une hausse du risque (suruse, structures en maturation) [S8][S9].
- **Prévention moteur-ready:** détection PHV et modulation automatique de volume/intensité + surveillance charge cumulée multi-environnements.

---

## 5) Garde-fous mineurs (consentement, données, sécurité)

- **Mineurs et consentement en France:** 15 ans = seuil clé pour certains traitements fondés sur consentement en ligne; en-dessous, accord parental requis (et information adaptée au mineur) [S13][S14].
- **Données de santé:** catégorie sensible, base légale renforcée + minimisation + information claire + contrôle accès [S14][S15][S16].
- **Safeguarding rugby:** protocoles de signalement, supervision, limites relation coach-athlète, procédures en <24h en cas de suspicion [S17][S18].
- **U18 jouant avec adultes:** cadre World Rugby avec consentements écrits + évaluations médicales/compétences [S18].

---

## 6) Tableau central: Règle terrain -> Traduction moteur -> Données nécessaires

| Règle terrain | Traduction moteur | Données nécessaires |
|---|---|---|
| U18: max 120 min match/semaine | `hard_constraint.match_minutes_week <= 120` | `played_minutes_week`, `scheduled_match_minutes` |
| U18: >=72h entre matchs | Refuser planning si `delta_match_hours < 72` | `last_match_at`, `next_match_at` |
| U18: high contact <=15 min/sem | Budget contact hebdo bloquant | `contact_high_minutes_week` |
| U18: medium contact <=30 min/sem | Budget contact hebdo bloquant | `contact_medium_minutes_week` |
| U18: <=30 matchs/saison | Contrôle saisonnier | `matches_played_season` |
| Activate efficace si adherence >=3/sem | KPI d’adhérence + bonus de sélection blocs préventifs | `injury_prevention_sessions_week` |
| Femmes: tackle = burden majeur | Pondérer vers blocs technique contact + neck/trunk | tags `contact_technique`, `neck_strength`, `trunk_control` |
| Cycle menstruel: variabilité individuelle | Autorégulation symptom-driven (pas phase-driven) | `cycle_opt_in`, `symptom_score_today`, `self_readiness` |
| Symptômes élevés -> alléger | `if symptom_score>=2 then volume_factor=0.8..0.9` | score journalier, RPE, sommeil |
| REDs/LEA vigilance | Déclencher drapeau médical + baisse charge cumulative | `energy_availability_flag`, `menstrual_irregularity_flag`, `weight_change` |
| PHV = fenêtre de risque U18 | Mode `phv_caution` réduisant ramp-up | `maturity_status`, `growth_rate_cm_month` |
| Multi-environnements (club + école + sélection) | Agréger charge globale avant génération | `external_sessions`, `external_matches` |
| Mineur <15 et consentement incomplet | Désactiver features santé sensibles | `age`, `parental_consent_health_data` |
| Santé = donnée sensible RGPD | Chiffrage + minimisation + TTL + audit trail | `data_classification`, `retention_policy`, `consent_log` |
| U18 vers adulte (cas exception) | Règles d’éligibilité + documents obligatoires | `adult_play_approval`, `medical_clearance`, `guardian_consent` |
| Risque concussion élevé | Exclure blocs contact élevés si drapeau post-HIA | `concussion_status`, `return_to_play_stage` |
| Profil population absent/incomplet | Fallback sûr + avertissement explicite | `sex_profile`, `age_band`, `maturity_status`, `missing_fields` |

---

## 7) Métadonnées/tags/constantes à ajouter (moteur-ready)

### Nouvelles constantes (v1 proposée)

- `U18_MAX_MATCH_MINUTES_PER_WEEK = 120`
- `U18_MIN_HOURS_BETWEEN_MATCHES = 72`
- `U18_MAX_HIGH_CONTACT_MINUTES_PER_WEEK = 15`
- `U18_MAX_MEDIUM_CONTACT_MINUTES_PER_WEEK = 30`
- `U18_MAX_MATCHES_PER_SEASON = 30`
- `INJURY_PREVENTION_TARGET_SESSIONS_PER_WEEK = 3`
- `MENSTRUAL_SYMPTOM_LOAD_REDUCTION_FACTOR = 0.8..0.9` (opt-in only)

### Nouveaux tags blocs/exercices

- `population:female_senior`, `population:u18_female`, `population:u18_male`
- `injury_prevention:concussion`, `injury_prevention:acl`, `injury_prevention:phv`
- `female_health:cycle_flexible`, `female_health:pelvic_support`
- `contact_dose:low|medium|high`
- `maturity:phv_safe`

### Nouvelles métadonnées profil

- `ageBand`, `biologicalSexForTraining` (optionnel, usage strictement limité)
- `maturityStatus` (`pre_phv|circa_phv|post_phv|unknown`)
- `cycleTrackingOptIn`, `cycleSymptomScoreToday`
- `parentalConsentHealthData`, `guardianContactPresent`
- `adultPlayEligibilityApproved`

---

## 8) Data manquante + plan de comblement

### Data manquante critique (produit)

1. **Charge réelle externe** (école, sélection, autre club): aujourd’hui non consolidée.
2. **Maturité (PHV) opérationnelle**: aucun champ standardisé.
3. **Données cycle/symptômes**: pas de schéma, pas d’opt-in, pas de politique de rétention dédiée.
4. **Historique blessure structuré**: trop faible pour calibrer prévention segmentée.
5. **Adhérence prévention** (Activate-like): non mesurée de manière exploitable.

### Plan de comblement (3 vagues)

**Vague 1 (2-3 semaines, P0/P1)**
- Ajouter champs profil minimaux: `ageBand`, `maturityStatus`, `parentalConsentHealthData`.
- Implémenter hard constraints U18 (caps contact/minutes/recovery).
- Ajouter journal d’exposition hebdomadaire consolidé (match + entraînement + externe).

**Vague 2 (4-6 semaines, P1)**
- Ajouter module cycle opt-in (symptômes uniquement, pas de collecte excessive).
- Ajouter score readiness (RPE sommeil fatigue douleur) et adaptation volume automatique.
- Ajouter KPI d’adhérence prévention (objectif >=3/semaine).

**Vague 3 (ongoing, P2)**
- Construire registre blessure par segment (femmes/U18) pour recalibrage trimestriel.
- Ajouter A/B tests qualitatifs de crédibilité séance par population.
- Revue juridique RGPD/CNIL + DPIA ciblée données santé mineurs.

---

## 9) Risques produit si non implémenté

### Risques safety/éthique

- Exposition excessive U18 (contact/minutes/récupération) -> hausse risque blessure.
- Mauvaise gestion cas mineurs (consentement/données santé) -> non-conformité réglementaire.
- Réponses cycle non individualisées (ou forcées) -> mauvaise expérience + risque de sur/sous-charge.

### Risques qualité moteur

- Séances “génériques adulte masculin” peu crédibles pour femmes/U18.
- Incohérences rehab/fatigue déjà vues par les audits, aggravées en populations sensibles.
- Incapacité à démontrer une progression sûre et traçable par segment.

### Risques business

- Perte de confiance coach/joueur/parents.
- Frein go-to-market clubs/academies (exigences safeguarding + conformité).
- Dette technique accrue si les règles population sont repoussées après refacto majeure.

---

## 10) Niveau de confiance (par domaine)

- **Élevé**: contraintes U18 contact/récupération, efficacité programme prévention type Activate, principaux risques blessure rugby féminin (concussion/tackle burden), cadre mineurs & données sensibles.
- **Modéré**: tuning précis charge/intensité hebdo par sous-segment et par phase de cycle.
- **Faible à modéré**: prescriptions universelles cycle-menstruel -> à éviter; privilégier personnalisation.

---

## Sources

- **[S1]** Longitudinal study of six seasons of match injuries in elite female rugby union (PubMed): https://pubmed.ncbi.nlm.nih.gov/36428090/  
- **[S2]** Systematic review concussion in women’s rugby (Sports Med / PubMed): https://pubmed.ncbi.nlm.nih.gov/35113388/  
- **[S3]** Women’s Rugby World Cup injury review (World Rugby resource): https://resources.world.rugby/worldrugby/document/2023/02/17/73ffed3a-7424-4387-8920-f287b92c76d4/Women-s-Rugby-World-Cup-2021-in-2022-Review-16-February-2023-.pdf  
- **[S4]** Instrumented mouthguards in elite men’s and women’s rugby union (PubMed): https://pubmed.ncbi.nlm.nih.gov/37906425/  
- **[S5]** Menstrual cycle phase and exercise performance meta-analysis (PubMed): https://pubmed.ncbi.nlm.nih.gov/32661839/  
- **[S6]** World Rugby Passport – Female athlete health/supportive environment: https://passport.world.rugby/conditioning-for-rugby/conditioning-for-female-rugby-players/female-athlete-health-and-creating-a-supportive-training-environment/creating-a-supportive-environment/  
- **[S7]** World Rugby Women’s Health resources: https://www.world.rugby/the-game/player-welfare/womens-health/essential-information/  
- **[S8]** Associations between growth/maturation and injury in elite youth athletes (PubMed): https://pubmed.ncbi.nlm.nih.gov/39209526/  
- **[S9]** Youth consensus (growth spurt vulnerability context, BJSM): https://bjsm.bmj.com/content/55/6/305  
- **[S10]** RFU Age Grade contact training, match load and recovery guidance: https://www.englandrugby.com/run/coaching/coach-resources/age-grade-contact-training  
- **[S11]** Schoolboy rugby injury prevention trial (cluster RCT, PubMed): https://pubmed.ncbi.nlm.nih.gov/28515056/  
- **[S12]** Activate implementation context (BMJ Open Sport & Exercise Medicine): https://bmjopensem.bmj.com/content/7/2/e001018  
- **[S13]** CNIL consentement et mineurs (15 ans en France): https://www.cnil.fr/fr/les-bases-legales/consentement  
- **[S14]** CNIL droits numériques des mineurs: https://www.cnil.fr/fr/droits-numeriques-des-mineurs-la-cnil-publie-les-resultats-du-sondage-et-de-la-consultation-publique  
- **[S15]** CNIL données de santé (sensibles / information): https://www.cnil.fr/fr/thematiques/sante  
- **[S16]** GDPR (Article 9, données de santé – EUR-Lex consolidated text): https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A02016R0679-20160504  
- **[S17]** World Rugby safeguarding policy/resources: https://www.world.rugby/safeguarding/  
- **[S18]** World Rugby U18s playing adult rugby guideline: https://www.world.rugby/the-game/player-welfare/guidelines/u18s-playing-adult  
- **[S19]** Critical components neuromuscular training to reduce ACL risk in female athletes (PubMed): https://pubmed.ncbi.nlm.nih.gov/27251898/  
- **[S20]** Neuromuscular training to prevent ACL injuries in female athletes (PubMed): https://pubmed.ncbi.nlm.nih.gov/41121632/  
- **[S21]** NSCA Youth resistance training position statement (PubMed): https://pubmed.ncbi.nlm.nih.gov/19620931/  
- **[S22]** WHO physical activity recommendations (children/adolescents/adults): https://www.who.int/initiatives/behealthy/physical-activity

---

## Note d’intégration avec les audits précédents

- Ce référentiel cible explicitement les gaps moteurs déjà identifiés (safety contracts, fallbacks, UX explicabilité, données contraignantes).  
- Il doit être branché au backlog de synthèse (`diagnostic-moteur-synthese-2026-03-10.md`) via tickets P0/P1 “population-aware safety”.
