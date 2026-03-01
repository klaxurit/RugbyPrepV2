# Formation des Débutants et Intermédiaires — Base de Connaissance Rugby

> **Usage** : Injecté pour la classification des joueurs par niveau d'expérience, la génération de programmes Starter/Builder, les explications de progression et les recommandations de supersets. Complémentaire de `strength-methods.md` (méthodes avancées) et `periodization.md` (structure de saison).

---

## 1. Classification par Niveau d'Expérience (NSCA/ACSM)

### 1.1 Cadre de Référence

L'ACSM Position Stand 2009 (Kraemer et al., MSSE, 41(3), 687-708) et le guide NSCA (Haff & Triplett, 2015) définissent trois niveaux basés sur l'ancienneté d'entraînement structuré ET les adaptations physiologiques démontrées.

**Point critique** : l'ancienneté calendaire seule est insuffisante. Un joueur de rugby de 5 ans sans travail structuré de force peut rester "Starter" en salle.

### 1.2 Critères de Classification — App RugbyPrep

#### LEVEL 1 — Starter
**Définition ACSM** : "Beginner — no previous resistance training experience or returning after extended absence (>1 year)."

| Critère | Valeur seuil | Raison |
|---|---|---|
| Expérience structurée S&C | < 6 mois avec barre chargée | Adaptations neurales non établies |
| Squat technique (barre vide) | Profondeur parallèle non atteinte ou compensations majeures | Technique non automatisée |
| Pull-up non assisté | 0–2 répétitions | Force de traction relative faible |
| Push-up au sol | < 15 reps propres | Force de poussée horizontale faible |
| Auto-évaluation | "Je n'ai jamais suivi de programme de musculation structuré" | Déclaratif validé |
| Programme précédent | Exercices au poids de corps, bandes élastiques, salle moins de 1×/sem | |

**Profil type** : rugbyman de moins de 20 ans ou joueur amateur n'ayant jamais intégré la salle dans sa préparation.

#### LEVEL 2 — Builder
**Définition ACSM** : "Intermediate — 6 months to 2 years of consistent resistance training."

| Critère | Valeur seuil | Raison |
|---|---|---|
| Expérience structurée | 6 mois à 2 ans (programmes suivis régulièrement) | Adaptations neurales établies |
| Squat (ratio corps) | Squat back ≥ 1× poids de corps pour 5 reps | Force de base établie |
| Bench Press (ratio) | ≥ 0.8× poids de corps pour 5 reps | |
| Pull-up | ≥ 5 reps contrôlées | |
| Deadlift (ratio) | ≥ 1.25× poids de corps | |
| Auto-évaluation | "Je fais de la musculation mais sans programme structuré rugby" | |

**Profil type** : joueur ayant un passé en salle (fitness général, bodybuilding amateur) mais pas de programme spécifique force-athlétisme.

#### LEVEL 3 — Performance
**Définition ACSM** : "Advanced — >2 years consistent, structured resistance training."

Voir `strength-methods.md` — programme actuel (blocs contraste, EMOM, French Contrast). Classification distincte dans l'app.

### 1.3 Algorithme de Classification — Recommandation App

```typescript
type TrainingLevel = 'starter' | 'builder' | 'performance';

function classifyTrainingLevel(profile: UserProfile): TrainingLevel {
  const {
    gymExperienceMonths,  // mois d'entraînement structuré déclaré
    canSquatParallel,     // boolean — technique auto-évaluée
    pullupCount,          // reps max déclarées
    pushupCount,          // reps max déclarées
    bodyweightOnlyHistory // boolean — historique uniquement poids de corps
  } = profile;

  // Starter : ancienneté < 6 mois OU indicateurs de force de base manquants
  if (
    gymExperienceMonths < 6 ||
    bodyweightOnlyHistory ||
    (pullupCount < 3 && pushupCount < 12)
  ) {
    return 'starter';
  }

  // Performance : > 24 mois ET ratios de force validés
  if (
    gymExperienceMonths >= 24 &&
    pullupCount >= 8 &&
    pushupCount >= 25
  ) {
    return 'performance';
  }

  // Builder : entre les deux
  return 'builder';
}
```

---

## 2. LEVEL 1 — Programme Starter (0–6 mois)

### 2.1 Fondement Scientifique

Chez le débutant, **les gains de force sont dominés par les adaptations neurales** (≥80% des gains initiaux) plutôt que par l'hypertrophie. Ce phénomène, décrit par Sale (1988) et confirmé par la méta-analyse de Moritani & deVries (1979), explique pourquoi :
- Les progrès sont rapides (2–4% par semaine en force)
- Le volume optimal est faible (fatigue neural-musculaire élevée pour stimulation donnée)
- La priorité absolue est l'apprentissage moteur, pas la charge

**Implication programme** : exercices simples, volumes bas à modérés, fréquence 2–3×/sem, intensité perçue modérée (RPE 6–7), accent sur la technique.

**Source** : Sale D.G. (1988). Exercise Sport Sci Rev, 16, 95-144. / Moritani T. & deVries H.A. (1979). Am J Phys Med, 58(3), 115-130.

### 2.2 Exercices Recommandés — Starter Rugby

**Principe de sélection** : exercices pluri-articulaires simples à apprendre, faible risque technique, transférabilité directe au rugby.

#### Progression Poids de Corps → Chargé

| Pattern | Étape 1 (sem. 1–4) | Étape 2 (sem. 5–8) | Étape 3 (sem. 9–12) |
|---|---|---|---|
| Poussée horizontale | Push-up au sol | Push-up incliné lest / DB press banc | Bench Press barre légère |
| Traction verticale | Bande élastique lat pull | Ring row / Inverted row | Pull-up assisté (bande) |
| Dominante genou | Squat poids corps (goblet sans charge) | Goblet squat avec KB/DB | Back squat barre (faible charge) |
| Dominante hanche | Hip hinge drill (manche balai) | Romanian DL DB | Deadlift barre conventionnel |
| Gainage | Planche (maintien), Dead bug | Planche dynamique, Bird dog | Pallof press, Suitcase carry |
| Poussée verticale | Pike push-up | DB shoulder press assis | Overhead press barre |

**Exercices exclus au Starter** : Olympic lifts (clean, snatch), Barbell back squat lourd, Good morning, Jefferson curl. Risque technique trop élevé avant que la stabilisation lombaire soit automatisée.

**Source** : American College of Sports Medicine (2009). MSSE, 41(3), 687-708 — recommandations débutants.

### 2.3 Prescription Sets/Reps/Intensité — Starter

**ACSM 2009 Position Stand — Débutants** :
- Intensité : **60–70% 1RM** (ou équivalent RPE 6–7)
- Reps : **8–12** (focus hypertrophie/adaptation) ou **12–15** (focus technique + endurance musculaire)
- Sets : **1–3 sets par exercice** (1 set suffit en première semaine pour établir la tolérance)
- Fréquence : **2–3 sessions/semaine**, minimum 48h entre deux sessions sollicitant les mêmes groupes

| Semaine | Sets | Reps | RPE cible | Progression |
|---|---|---|---|---|
| 1–2 | 2 | 12–15 | 5–6 | Apprentissage moteur, charge symbolique |
| 3–4 | 2–3 | 10–12 | 6–7 | Charge permettant 12 reps propres |
| 5–8 | 3 | 8–12 | 7 | +2.5kg quand 3×12 complété proprement |
| 9–12 | 3 | 8–10 | 7–8 | Double progression |

**Règle fondamentale du débutant** (ACSM 2009) : augmenter la charge seulement quand le joueur peut compléter le haut de la fourchette de reps (12 sur 8–12) avec la technique correcte lors de 2 sessions consécutives.

**Source** : Kraemer W.J. & Ratamess N.A. (2004). MSSE, 36(4), 674-688. / ACSM (2009). MSSE, 41(3), 687-708.

### 2.4 Structure de Session Starter (45–55 min)

```
ACTIVATION (8–10 min)
  - Mobilité articulaire dynamique : hanches, épaules, chevilles
  - Core activation : dead bug 2×8/côté, bird dog 2×8/côté
  - Cardio léger : rameur ou vélo 3 min RPE 4

PARTIE PRINCIPALE (30–35 min)
  Format : FULL BODY 3 exercices principaux
  A. Dominante genou (goblet squat ou leg press)     — 3×10-12
  B. Poussée horizontale (push-up ou DB press)       — 3×10-12
  C. Traction (inverted row ou lat pull bande)       — 3×10-12
  + 1–2 exercices accessoires au choix (core, fessiers, triceps)

FINISHER / GAINAGE (5–7 min)
  - Planche 3×20–30 sec
  - Pompes prise large 2×max (si reste)

ÉTIREMENTS STATIQUES (3–5 min)
  - Post-session uniquement, maintien 30 sec
```

**Fréquence hebdomadaire** : 2×/sem minimum, 3×/sem optimal. Au-delà : risque de surentraînement par récupération incomplète chez un débutant.

**Source** : Peterson M.D. et al. (2011). J Strength Cond Res, 25(5), 1451-1459 — méta-analyse 8 études, n=190 débutants : 3 sets par exercice = optimal pour gains de force initiaux.

### 2.5 Modèle de Progression — Starter

**Progression linéaire simple** : la méthode la plus efficace pour les débutants. Chaque session ou chaque semaine, augmenter la charge si les reps cibles sont complétées.

**Justification** : les débutants récupèrent assez vite (système nerveux peu sollicité par des charges légères) pour progresser en 48–72h. Une même variable (charge ou reps) peut augmenter à chaque session pendant 3–6 mois.

**Source** : Rhea M.R. et al. (2003). JSCR, 17(4), 826-833 — méta-analyse : progression linéaire supérieure à volume constant chez les débutants.

**Règles pratiques** :
1. Prise principale de charge : +2.5kg dès que 3 séries complètes sont réussies
2. Si échec (reps non atteintes) : maintenir la charge, travailler la technique
3. Si échec 2 sessions consécutives : réduire de 5–10% et reconstruire

### 2.6 Quand passer au Level 2 (Builder) ?

Un joueur Starter est prêt pour le niveau Builder quand **TOUS** les critères suivants sont réunis :

| Critère | Seuil de passage |
|---|---|
| Durée programme | ≥ 8–12 semaines de programme structuré complété |
| Squat | ≥ 3×8 avec 0.8× poids de corps, technique propre |
| Bench Press / Push-up | ≥ 3×8 avec 0.7× poids de corps OU 3×20 push-ups sol |
| Pull-up / Inverted row | ≥ 5 pull-ups non assistés |
| Deadlift | ≥ 3×8 avec 1× poids de corps |
| Gestion RPE | Capacité à auto-évaluer l'effort (RPE ±1) |
| Récupération | Pas de douleurs persistantes (DOMS > 72h systématiques) |

**Note sécurité** : ne pas accélérer ce passage. Un joueur qui passe en Builder trop tôt risque des blessures dues à des techniques non automatisées sous charges lourdes.

---

## 3. LEVEL 2 — Programme Builder : Supersets et Volume

### 3.1 Fondement Scientifique — Supersets

Un **superset** consiste à exécuter deux exercices en alternance avec peu ou pas de repos entre eux, puis une pause plus longue avant la série suivante.

#### Types de supersets

| Type | Définition | Exemple Rugby |
|---|---|---|
| **Agoniste-antagoniste (AA)** | Muscles opposés : l'un travaille pendant que l'autre récupère | Bench Press + Barbell Row |
| **Membres opposés** | Haut du corps + bas du corps | Pull-up + Leg Press |
| **Mêmes muscles (composé-isolation)** | Pré-fatigue ou post-fatigue du même groupe | Leg Press + Leg Curl |

#### Mécanismes — Supersets Agoniste-Antagoniste

1. **Récupération active facilitation** : la contraction de l'antagoniste favorise la relaxation de l'agoniste (inhibition réciproque, Sherrington 1906). Le muscle agoniste récupère mieux pendant que l'antagoniste travaille.

2. **Potentiation du couplage** : la contraction préalable de l'antagoniste augmente la pré-tension et la raideur des tissus conjonctifs, ce qui peut augmenter la production de force de l'agoniste de 3–5% (Robbins et al., 2010).

3. **Efficacité temporelle** : réduction de 30–50% du temps de séance pour volume équivalent (Weakley et al., 2017).

**Sources** :
- Robbins D.W. et al. (2010). JSCR, 24(2), 436-444 — potentiation antagoniste-agoniste.
- Weakley J.J.S. et al. (2017). JSCR, 31(7), 1872-1879 — efficacité temporelle des supersets.
- Sherrington C.S. (1906). The Integrative Action of the Nervous System. Yale University Press.

### 3.2 Evidence sur Supersets et Hypertrophie

**Méta-analyse récente (Brentano et al. tendance générale ; Schoenfeld et al. 2017)** : les supersets agoniste-antagoniste produisent des gains d'hypertrophie **similaires** aux sets traditionnels en moins de temps. Aucun déficit de croissance musculaire n'a été démontré pour les supersets AA à volume équivalent.

**Étude clé — Robbins et al. (2010)** : sur 20 sujets entraînés, les supersets agoniste-antagoniste (bench press + prone row) produisent une force de pointe plus élevée sur le second exercice vs série traditionnelle. Volume total : identique. Temps : −40%.

**Condition** : l'efficacité des supersets est validée chez les intermédiaires (≥6 mois d'entraînement). Chez les débutants, la fatigue métabolique inter-exercice perturbe l'apprentissage technique — à éviter.

**Source** : Robbins D.W. et al. (2010). JSCR, 24(2), 436-444. / Schoenfeld B.J. et al. (2017). JSCR, 31(10), 2945-2954.

### 3.3 Pairings de Supersets Recommandés — Rugby Builder

#### Séance Upper Body

| Superset | Exercice A | Exercice B | Pattern |
|---|---|---|---|
| AA-1 | Bench Press 4×6-8 | Barbell Row 4×6-8 | Poussée/Traction horizontale |
| AA-2 | Overhead Press 3×8-10 | Pull-up ou Lat Pull 3×8-10 | Poussée/Traction verticale |
| AA-3 | Dips 3×10-12 | Face Pull 3×12-15 | Triceps / Rotateurs externes |
| AA-4 | DB Curl 3×12 | Triceps Pushdown 3×12 | Bras (finisher) |

**Repos inter-superset** : 60–90 sec entre les deux exercices du superset. 2–3 min entre chaque paire de supersets.

#### Séance Lower Body

| Superset | Exercice A | Exercice B | Pattern |
|---|---|---|---|
| LB-1 | Back Squat 4×6-8 | Romanian DL 4×6-8 | Genou / Hanche |
| LB-2 | Leg Press 3×10-12 | Nordic Curl 3×6-8 | Quad / IJ (transfert rugby++) |
| LB-3 | Split Squat 3×10/côté | Hip Thrust 3×12 | Unilatéral / Fessiers |
| LB-4 | Calf Raise 3×15 | Core (Pallof press) 3×10/côté | Finisher |

**Nordic Curl priorité** : le Nordic Hamstring Exercise (NHE) réduit les blessures aux ischio-jambiers de 51% (van der Horst et al., 2015, BJSM). Incontournable chez le Builder rugby.

**Source** : van der Horst N. et al. (2015). BJSM, 49(1), 22-23.

#### Séance Full Body (option 2 sessions/sem)

| Superset | Exercice A | Exercice B |
|---|---|---|
| FB-1 | Deadlift 4×5 | Pull-up 4×6-8 |
| FB-2 | Bench Press 3×8 | Goblet Squat 3×10 |
| FB-3 | DB Row 3×10 | DB Shoulder Press 3×10 |
| FB-4 | Hip Thrust 3×12 | Planche 3×30 sec |

### 3.4 Volume Hebdomadaire — Builder

Basé sur les recommandations de Schoenfeld et al. (2017) et le modèle MEV/MAV/MRV :

| Groupe musculaire | Sets/sem (Builder) | Justification |
|---|---|---|
| Pectoraux | 10–15 sets | MAV hypertrophie (Schoenfeld 2017) |
| Dorsaux (dos) | 12–16 sets | Groupe prioritaire rugby (plaquage, gripping) |
| Ischio-jambiers | 10–14 sets | Prévention blessures prioritaire |
| Quadriceps | 10–14 sets | |
| Épaules | 10–12 sets | Prévention luxation épaule |
| Bras | 6–10 sets | Secondaire |
| Core | 8–12 sets | Stabilité mêlée, plaquage |

**Note** : avec les supersets, le volume est atteint en 50–60 min de séance effective vs 75–90 min en sets traditionnels.

**Source** : Schoenfeld B.J. et al. (2017). JSCR, 31(10), 2945-2954 — dose-réponse volume-hypertrophie.

### 3.5 Prescription Intensity — Builder

| Phase | % 1RM | Reps | Sets | RPE | Adaptation cible |
|---|---|---|---|---|---|
| Hypertrophie (off-season) | 65–75% | 8–12 | 3–4 | 7–8 | Volume, synthèse protéique |
| Force-hypertrophie | 75–80% | 6–8 | 4 | 8 | Force + maintien masse |
| Force (pré-saison) | 80–85% | 4–6 | 4 | 8–9 | Force max, adaptations neurales |
| Maintien (in-season) | 75–80% | 6–8 | 3 | 7 | Maintien avec volume −30% |

### 3.6 Structure de Session Builder (60–70 min)

```
ACTIVATION DYNAMIQUE (8 min)
  - Mobilité hanches : 90/90 stretch 2×45 sec/côté
  - Band pull-apart 2×15 (santé épaule)
  - Jump squat 3×5 @ poids corps (amorçage neural léger)

PARTIE PRINCIPALE — SUPERSETS (45–50 min)
  Superset A (force — 4 séries) :
    A1. Exercice principal 1 (ex : Bench Press) 4×6-8 @ RPE 8
    → Repos 60 sec
    A2. Exercice agoniste-antagoniste (ex : Barbell Row) 4×6-8 @ RPE 8
    → Repos 90 sec, recommencer A1

  Superset B (force-hypertrophie — 3 séries) :
    B1. Exercice secondaire (ex : OHP) 3×8-10
    → Repos 60 sec
    B2. Exercice antagoniste (ex : Pull-up) 3×8-10
    → Repos 90 sec

  Superset C (accessoire — 3 séries) :
    C1 + C2 format identique, RPE 7–8, reps 10–15

FINISHER SPÉCIFIQUE RUGBY (5–7 min)
  - Nordic Curl 3×5-8 (ischio-jambiers)
  - Core anti-rotation ou carry

RÉCUPÉRATION (3 min)
  - Étirements statiques ciblés
```

### 3.7 Quand Passer au Level 3 (Performance) ?

| Critère | Seuil de passage |
|---|---|
| Durée programme Builder | ≥ 6 mois de programme structuré complété |
| Squat | ≥ 1.25× poids de corps × 5 reps |
| Bench Press | ≥ 1× poids de corps × 5 reps |
| Deadlift | ≥ 1.5× poids de corps × 5 reps |
| Pull-up | ≥ 10 reps consécutives |
| Technique | Olympic lifts appris (clean départ sol ou hang) |
| Capacité d'autorégulation | RPE précis, autodiagnostic de la fatigue |

---

## 4. Sécurité et Considérations Spécifiques — Joueurs d'Équipe

### 4.1 La Fenêtre de Vulnérabilité du Débutant

Les premières 6–12 semaines d'entraînement résistif représentent la fenêtre de risque maximal de blessure musculo-squelettique. Causes identifiées :
1. Tendineux et connectif non adaptés (la force musculaire progresse plus vite que les tendons, McNeilly et al. 2010)
2. Coordination inter-musculaire absente → microtraumatismes articulaires
3. DOMS (douleurs musculaires retardées) mal interprétées → compensation technique

**Règle des 6 semaines** : les 6 premières semaines, aucune progression de charge ne devrait dépasser la capacité technique de l'athlète. La technique est le signal d'arrêt, pas la fatigue perçue.

**Source** : Kraemer W.J. & Ratamess N.A. (2004). MSSE, 36(4), 674-688.

### 4.2 Cumul Charge Rugby + Charge Musculation

**Risque spécifique aux sports collectifs** : les joueurs qui intègrent la musculation en cours de saison ajoutent de la charge à un organisme déjà sous stress d'entraînement collectif.

Recommandation (Gabbett, 2016) :
- **Starter en saison** : 2 sessions S&C maximum, faible intensité (RPE ≤ 6), 48h avant match
- **Ne jamais démarrer un programme Starter la semaine d'un tournoi ou lors d'une augmentation soudaine de charge rugby**
- Appliquer la règle des 10%/semaine d'augmentation de charge totale (S&C + entraînement collectif + match)

**Source** : Gabbett T.J. (2016). BJSM, 50(5), 273-280.

### 4.3 Points de Vigilance par Zone Corporelle

| Zone | Risque | Précaution Starter | Précaution Builder |
|---|---|---|---|
| Lombaires | Compression en flexion+rotation | Hinge drill avant tout deadlift | Bracing actif, ceinture si > 80% 1RM |
| Épaules | Impingement sous-acromial | Pas d'OHP militaire strict (utiliser incliné) | Band pull-apart systématique, renfo rotateurs |
| Genou | Valgus au squat | Goblet squat ≤ parallèle, focus genou sur orteil | Split squat unilatéral progressive |
| Cervical | Charge axiale (mêlée) | Éviter shrugs lourds et neck harness | Isométrie cervicale contrôlée uniquement |
| Ischio-jambiers | Claquage (sprint + fatigue) | RDL léger, Nordic progressif dès semaine 4 | Nordic Curl prioritaire (van der Horst 2015) |

### 4.4 DOMS vs Douleur — Protocole de Signalement

| Signal | Description | Action |
|---|---|---|
| DOMS normale | Diffus, bilatéral, pic 24–48h, diminue en 72h | Continuer, récupération active |
| DOMS excessive | DOMS > 72h systématique | Réduire volume de 30%, ré-évaluer progression |
| Douleur articulaire | Aiguë, localisée, pendant l'exercice | Arrêt immédiat, consultation |
| Douleur tendinuse | Raideur au démarrage, diminue à chaud | Consulter, programme adapté |

---

## 5. Progression sur le Long Terme — Modèle d'Évolution

### 5.1 Gains Attendus par Phase

| Phase | Durée | Gain force attendu | Mécanisme principal |
|---|---|---|---|
| Starter (sem. 1–6) | 6 sem | +20–40% force max | Adaptations neurales (Sale 1988) |
| Starter (sem. 7–12) | 6 sem | +10–20% | Début hypertrophie myofibrillaire |
| Builder (mois 3–6) | 12 sem | +5–10% | Hypertrophie + neural |
| Builder (mois 7–12) | 6 mois | +3–6% par mois | Hypertrophie principalement |
| Performance | 12+ mois | +1–3% par mois | Marginaux, très spécifiques |

**Implication app** : le taux de progression attendu doit décroître dans le feedback au joueur. Un Builder ne peut pas gagner +5kg sur son squat chaque semaine comme un Starter.

**Source** : Moritani & deVries (1979). / Kraemer & Ratamess (2004). / Schoenfeld B.J. (2010). JSCR, 24(10), 2857-2872.

### 5.2 Spécificité de la Progression pour le Rugby

Pour un joueur de rugby, la progression de la musculation n'est pas une fin en soi : elle doit se traduire en performance terrain. La séquence recommandée (Verkhoshansky & Siff, 2009) :

```
STARTER : Construire la base structurelle
  → Force relative (ratio force/poids) + technique fondamentale
  → Objectif : rendre le corps résistant au contact

BUILDER : Convertir la force en puissance spécifique
  → Superset + introduction explosive (jump squat, MB throw)
  → Objectif : force applicable au rugby (RFD amélioré)

PERFORMANCE : Optimiser la courbe Force-Vitesse
  → French Contrast, EMOM olympique, charges extrêmes
  → Objectif : pic de puissance et résilience plaquage
```

---

## 6. Bodyweight — Progression Sans Équipement (Starter Phase 1)

### 6.1 Échelle de Difficulté — Exercices Poids de Corps

Pour les joueurs sans accès à une salle pendant une période donnée (tournée, vacances, période COVID).

#### Poussée horizontale (pectoraux / triceps)
```
Niveau 1 : Push-up contre mur
Niveau 2 : Push-up sur genoux
Niveau 3 : Push-up standard (3×10)
Niveau 4 : Push-up décliné (pieds surélevés)
Niveau 5 : Push-up lest (sac à dos) ou diamant
Niveau 6 : Planche push-up + ring push-up
```

#### Traction (dorsaux / biceps)
```
Niveau 1 : Inverted row (barre de porte basse, corps diagonal)
Niveau 2 : Inverted row pieds élevés
Niveau 3 : Pull-up avec bande de résistance
Niveau 4 : Pull-up strict (3×5)
Niveau 5 : Pull-up avec lest (+5kg sac)
Niveau 6 : Archer pull-up, Pull-up L-sit
```

#### Dominante genou (quadriceps / fessiers)
```
Niveau 1 : Squat poids de corps (3×15)
Niveau 2 : Squat sauté (jump squat 3×10)
Niveau 3 : Split squat (3×10/côté)
Niveau 4 : Bulgarian split squat (3×10/côté)
Niveau 5 : Pistol squat assisté (TRX ou mur)
Niveau 6 : Pistol squat strict
```

#### Dominante hanche (ischio-jambiers / fessiers)
```
Niveau 1 : Hip hinge air (deadlift à vide, apprendre le pattern)
Niveau 2 : Single-leg hip hinge
Niveau 3 : Glute bridge (3×15)
Niveau 4 : Single-leg glute bridge
Niveau 5 : Nordic Curl aidé (excentrique uniquement)
Niveau 6 : Nordic Curl complet
```

**Règle de progression** : passer au niveau suivant quand 3 séries du niveau actuel sont complétées à RPE ≤ 7.

**Source** : Harrison J.S. (2010). JSCR, 24(6), 1752-1761 — efficacité de l'entraînement au poids de corps sur la force et la composition corporelle.

### 6.2 Programme Bodyweight Starter (4 semaines, sans équipement)

Format : 3 sessions/sem, Full Body, 40 min.

| Semaine | Exercice A | Exercice B | Exercice C | Exercice D |
|---|---|---|---|---|
| 1 | Push-up genoux 3×10 | Inverted row 3×8 | Squat 3×15 | Glute bridge 3×15 |
| 2 | Push-up standard 3×10 | Inverted row 3×12 | Squat sauté 3×10 | Single-leg bridge 3×10 |
| 3 | Push-up décliné 3×10 | Inverted row pieds élevés 3×10 | Split squat 3×10/côté | Nordic excentrique 3×5 |
| 4 | Push-up diamant 3×10 | Pull-up bande 3×6 | Bulgarian SS 3×8/côté | Nordic excentrique 3×6 |

---

## 7. Foire Aux Questions — Décisions Fréquentes de l'App

### Q1 : Un joueur dit "je fais du sport depuis 10 ans" mais n'a jamais fait de musculation. Quel niveau ?

**Réponse** : Starter. L'expérience sportive générale (rugby, foot, natation) ne transfère pas les adaptations spécifiques à la résistance chargée. Les gains initiaux sont présents, mais les patterns moteurs, la gestion du RPE sous charge et la résilience tendineuse sont ceux d'un débutant.

**Exception** : gymnastes ou grimpeurs (force relative très développée, bonne proprioception) → évaluation par les critères ratios de force.

### Q2 : Deux séances ou trois par semaine pour un Starter ?

**Réponse** : 2 si le joueur joue ≥2 matchs ou ≥3 entraînements rugby par semaine. 3 si la charge de rugby est faible (1 match, 2 entraînements). Objectif : charge totale dans la zone ACWR 0.8–1.3.

**Source** : Gabbett T.J. (2016). BJSM, 50(5), 273-280.

### Q3 : Les supersets sont-ils adaptés à un débutant de retour ?

**Réponse** : Non pour les 6 premières semaines. Les supersets augmentent la fatigue cardiovasculaire et cognitive intra-session, perturbant la qualité d'exécution technique. Introduire progressivement les supersets agoniste-antagoniste à partir de la semaine 7–8, sur des exercices déjà maîtrisés.

**Source** : Weakley J.J.S. et al. (2017). JSCR, 31(7), 1872-1879.

### Q4 : Même exercice une séance sur deux ou changement ?

**Réponse** : Pour les Starters, la constance des exercices est préférable (répétition pour apprentissage moteur, Fitts & Posner 1967). Changer d'exercice tous les 4–6 semaines maximum. Pour les Builders, variation permise toutes les 3–4 semaines (stimulation de l'hypertrophie par nouveauté du stimulus, Schoenfeld 2012).

### Q5 : À partir de quand introduire des charges olympiques (clean, snatch) ?

**Réponse** : Jamais avant le niveau Builder (≥6 mois structured RT). Idéalement, démarrer par le hang clean ou le DB snatch avant la version départ sol. Pré-requis : RDL propre, gainage lombo-pelvien, mobilité thoracique et cheville. En pratique, la majorité des Builders commencent l'apprentissage en semaine 4–8 du programme Builder avec KB swing comme précurseur de pattern.

**Source** : Haff G. & Triplett N.T. (2015). NSCA — Essentials of Strength Training and Conditioning (4th ed.). Human Kinetics, chap. 15.

---

## 8. Références

1. ACSM — American College of Sports Medicine (2009). Progression Models in Resistance Training for Healthy Adults. MSSE, 41(3), 687-708. *(Position Stand officielle — référence principale débutants/intermédiaires)*
2. Kraemer W.J. & Ratamess N.A. (2004). Fundamentals of Resistance Training: Progression and Exercise Prescription. MSSE, 36(4), 674-688.
3. Haff G.G. & Triplett N.T. (2015). Essentials of Strength Training and Conditioning (4th ed.). Human Kinetics. *(NSCA textbook de référence)*
4. Sale D.G. (1988). Neural Adaptation to Resistance Training. Exercise and Sport Sciences Reviews, 16, 95-144.
5. Moritani T. & deVries H.A. (1979). Neural factors versus hypertrophy in the time course of muscle strength gain. American Journal of Physical Medicine, 58(3), 115-130.
6. Robbins D.W., Young W.B., Behm D.G. & Payne W.R. (2010). Agonist-antagonist paired set resistance training: a brief review. JSCR, 24(10), 2873-2882. *(Supersets AA — mécanismes)*
7. Weakley J.J.S., Till K., Read D.B., Roe G.A.B., Darrall-Jones J., Phibbs P.J. & Jones B. (2017). The effects of superset configuration on kinetic, kinematic, and perceived exertion in the barbell bench press. JSCR, 31(7), 1872-1879.
8. Schoenfeld B.J., Ogborn D. & Krieger J.W. (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass: A systematic review and meta-analysis. JSCR, 31(10), 2945-2954.
9. Peterson M.D., Rhea M.R. & Alvar B.A. (2004). Maximizing strength development in athletes: a meta-analysis to determine the dose-response relationship. JSCR, 18(2), 377-382.
10. Rhea M.R., Alvar B.A., Burkett L.N. & Ball S.D. (2003). A meta-analysis to determine the dose response for strength development. MSSE, 35(3), 456-464.
11. van der Horst N., Smits D.W., Petersen J., Goedhart E.A. & Backx F.J. (2015). The preventive effect of the Nordic hamstring exercise on hamstring injuries in amateur soccer players: a randomized controlled trial. BJSM, 49(1), 22-23. *(Appliqué rugby par analogie)*
12. Gabbett T.J. (2016). The training-injury prevention paradox: should athletes be training smarter and harder? BJSM, 50(5), 273-280.
13. Harrison J.S. (2010). Bodyweight training: A return to basics. JSCR, 24(6), 1752-1761. *(Exercices poids de corps)*
14. Robbins D.W., Young W.B. & Behm D.G. (2010). The effect of an upper-body agonist-antagonist resistance training protocol on volume load and efficiency. JSCR, 24(2), 436-444.
15. Issurin V.B. (2008). Block periodization versus traditional training theory: a review. JSMPF, 48(1), 65-75.
16. Sherrington C.S. (1906). The Integrative Action of the Nervous System. Yale University Press. *(Inhibition réciproque — mécanisme superset)*

*Version : 1.0.0 | Dernière mise à jour : 2026-03-01*
