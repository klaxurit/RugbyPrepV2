# Prévention des Blessures — Base de Connaissance Rugby

> **Usage** : source de vérité scientifique sur la prévention des blessures pour
> RugbyPrep. Conçu pour injection comme contexte dans les appels Claude API
> (alertes de surcharge, recommandations pré-séance, protocoles prehab, conseils
> post-blessure, gestion de la commotion). Contenu dense et sourcé. Vulgarisation
> gérée au niveau du prompt utilisateur.
>
> ⚠️ **Avertissement sécurité** : ce fichier est une ressource éducative. Toute
> blessure réelle doit être évaluée par un professionnel de santé (médecin du
> sport, kinésithérapeute). L'app ne se substitue en aucun cas à un diagnostic
> médical.

---

## 1. Épidémiologie des Blessures en Rugby à XV

### 1.1 Taux d'Incidence — Données Générales

Le rugby à XV est l'un des sports collectifs avec le taux de blessures le plus
élevé. La compréhension de ce risque est le premier outil de prévention.

**Taux d'incidence (nombre de blessures pour 1 000h d'exposition)** :

| Niveau | Match | Entraînement | Source |
|---|---|---|---|
| Professionnel (Top 14, Premiership) | 65–90 / 1 000h | 3–5 / 1 000h | Mountjoy et al. (2014) |
| Semi-professionnel | 45–65 / 1 000h | 2–4 / 1 000h | Brooks et al. (2005) |
| Amateur (club fédéral) | 30–55 / 1 000h | 1.5–3 / 1 000h | Garraway et al. (2000) |

**Interprétation** : le risque de blessure en match est **10-20× supérieur** à
l'entraînement. La grande majorité des blessures graves survient en match,
justifiant une préparation physique ciblée sur la résistance au contact et
à la fatigue de fin de match.

**Source** : Brooks J.H.M. et al. (2005). Epidemiology of injuries in English
professional rugby union. *British Journal of Sports Medicine*, 39(10), 763-775.
/ Fuller C.W. et al. (2007). Consensus statement on injury definitions and data
collection procedures for studies of injuries in rugby union. *British Journal
of Sports Medicine*, 41(5), 328-331.

---

### 1.2 Distribution Anatomique des Blessures

**Rugby à XV — blessures par localisation (joueurs amateurs et semi-pros)** :

| Localisation | % des blessures | Mécanisme principal |
|---|---|---|
| Épaule / clavicule | 18–23% | Contact, plaquage épaule première, chute |
| Genou | 12–18% | Contact direct, torsion, hyperextension |
| Ischio-jambiers | 10–15% | Sprint, changement de direction, fatigue |
| Cheville | 8–12% | Inversion, contact, terrain irrégulier |
| Nuque / rachis cervical | 6–10% | Mêlée, plaquage, ruck (avants++) |
| Cuisse / quadriceps | 5–8% | Contact direct (hématome), sprint |
| Tête / face (dont commotion) | 5–8% | Contact, sol, botte |
| Rachis lombaire | 4–7% | Mêlée, mauvaise mécanique de levée |
| Poignet / main | 4–6% | Chute, contact |
| Autres | 10–15% | Variable |

**Source** : Hendricks S. et al. (2012). Review of the literature on the
epidemiology of rugby union injuries. *South African Journal of Sports Medicine*,
24(3), 73-81. / Fuller C.W. et al. (2007) op. cit.

---

### 1.3 Blessures par Poste

| Groupe de postes | Blessures les plus fréquentes | Facteur de risque spécifique |
|---|---|---|
| Piliers (1, 3) | Nuque, épaule, genou, lombaires | Mêlée (compression axiale, rotation cervicale) |
| Talonneur (2) | Nuque, épaule, genou | Mêlée (position centrale, talonnage en rotation) |
| 2ème ligne (4, 5) | Épaule, genou, commotion | Touches, plaquages, rucks |
| Flankers / N°8 (6, 7, 8) | Ischio-jambiers, épaule, genou | Volume de course, contacts répétés |
| Demis (9, 10) | Cheville, genou, épaule | Contacts inattendus, fréquence de jeu |
| TQ / ailiers (11-14) | Ischio-jambiers, genou, épaule | Vitesse, sprints, contacts à pleine vitesse |
| Arrière (15) | Cheville, épaule, commotion | Plongeons, jeu aérien, contacts ouverts |

---

### 1.4 Blessures Liées à l'Entraînement vs au Match

**Blessures en match** : généralement traumatiques (contact, chute, torsion
soudaine). Plus graves, plus longues (temps d'absence élevé).

**Blessures à l'entraînement** : plus souvent liées à la surcharge
(tendinopathies, douleurs lombaires chroniques, blessures musculaires par
fatigue). Évitables par un meilleur monitoring de la charge.

**Implication pour l'app** : le rôle principal de l'app dans la prévention
est de gérer la **charge d'entraînement** pour réduire les blessures de
surcharge — le seul type directement contrôlable.

---

## 2. Facteurs de Risque

### 2.1 Modèle Dynamique des Facteurs de Risque (Meeuwisse et al., 2007)

La blessure n'est pas un événement aléatoire. Elle résulte de l'interaction
entre des facteurs prédisposants (internes) et des facteurs déclenchants (externes).

```
FACTEURS INTERNES          FACTEURS EXTERNES
(athlète vulnérable)       (environnement)
        ↓                           ↓
              SUSCEPTIBILITÉ À LA BLESSURE
                           ↓
               ÉVÉNEMENT DÉCLENCHANT
                           ↓
                        BLESSURE
```

**Source** : Meeuwisse W.H. et al. (2007). A dynamic model of etiology in sport
injury: the recursive nature of risk and causation. *Clinical Journal of Sport
Medicine*, 17(3), 215-219.

---

### 2.2 Facteurs de Risque Internes (Modifiables et Non-Modifiables)

| Facteur | Modifiable ? | Impact | Action possible |
|---|---|---|---|
| Antécédent de blessure | Non | ★★★★★ (facteur N°1) | Rééducation complète, prehab ciblé |
| Déséquilibre de force gauche/droite | Oui | ★★★★☆ | Travail unilatéral, screening |
| Faiblesse des muscles stabilisateurs | Oui | ★★★★☆ | Prehab (glutes, rotateurs épaule, core) |
| Amplitude articulaire réduite | Oui | ★★★☆☆ | Mobilité, étirements dynamiques |
| Fatigue aiguë | Oui | ★★★★★ | Monitoring charge, sommeil, nutrition |
| Fatigue chronique | Oui | ★★★★★ | Périodisation, déload |
| Âge | Non | ★★★☆☆ | Prehab plus long, récupération accrue |
| Niveau de condition physique | Oui | ★★★★☆ | Préparation physique structurée |

**Le facteur N°1 de risque de blessure est une blessure antérieure.**
Un joueur ayant eu une entorse de cheville a 2-4× plus de risque d'en subir
une autre. La rééducation complète (pas seulement la disparition de la douleur)
est impérative.

**Source** : Bahr R. & Krosshaug T. (2005). Understanding injury mechanisms: a key
component of preventing injuries in sport. *British Journal of Sports Medicine*,
39(6), 324-329.

---

### 2.3 Le Paradoxe de l'Entraînement-Blessure (Gabbett, 2016)

Gabbett a démontré un paradoxe fondamental : **les athlètes qui s'entraînent le
plus sont à la fois ceux qui se blessent le moins ET ceux qui se blessent le
plus**, selon la manière dont la charge est gérée.

```
Faible condition physique (peu entraîné) → risque élevé
Haute condition physique + charge bien gérée → risque le plus faible
Haute condition physique + charge mal gérée (pic soudain) → risque élevé
```

**Implication** : l'objectif n'est pas de réduire la charge d'entraînement au
minimum, mais de **la construire progressivement** pour que le corps devienne
résistant aux contraintes du match.

**Source** : Gabbett T.J. (2016). The training-injury prevention paradox: should
athletes be training smarter and harder? *British Journal of Sports Medicine*,
50(5), 273-280.

---

## 3. Ratio Charge Aiguë / Charge Chronique (ACWR)

### 3.1 Définition et Calcul

L'ACWR est l'outil de monitoring de charge le plus validé pour la prédiction
du risque de blessure en sport collectif.

```
ACWR = Charge aiguë (semaine en cours) / Charge chronique (moyenne 4 semaines)
```

**Charge d'une séance** = RPE (1-10) × Durée (minutes) = **UA (Unités Arbitraires)**

**Exemple** :
- Séance lundi : RPE 7 × 60 min = 420 UA
- Séance mercredi : RPE 6 × 90 min = 540 UA
- Match samedi : RPE 8 × 90 min = 720 UA
- **Charge aiguë semaine** = 420 + 540 + 720 = 1 680 UA

- Moyenne des 4 semaines précédentes = 1 200 UA
- **ACWR** = 1 680 / 1 200 = **1.40**

---

### 3.2 Zones de Risque et Interprétation

| ACWR | Zone | Risque de blessure | Recommandation |
|---|---|---|---|
| < 0.8 | Sous-charge | Déconditionnement progressif, risque élevé si charge soudaine | Augmenter progressivement |
| 0.8 – 1.3 | **Zone optimale** | Risque le plus faible | Maintenir |
| 1.3 – 1.5 | Zone de vigilance | Risque modérément augmenté | Surveiller, ne pas ajouter |
| > 1.5 | **Zone danger** | Risque significativement augmenté (+2-4×) | Réduire la charge immédiatement |
| > 2.0 | Zone critique | Risque très élevé | Repos forcé |

**Hulin et al. (2016)** — étude sur 53 joueurs de rugby league sur 2 saisons :
les joueurs avec un ACWR > 1.5 présentaient un risque de blessure **2.12× supérieur**
à ceux dans la zone 0.8-1.3.

**Source** : Hulin B.T. et al. (2016). The acute:chronic workload ratio predicts
injury: high chronic workload may decrease injury risk in elite rugby league
players. *British Journal of Sports Medicine*, 50(4), 231-236. / Gabbett T.J.
(2016) op. cit.

---

### 3.3 Implémentation Simplifiée dans l'App

Pour un joueur amateur sans staff médical, une version simplifiée est plus
applicable :

**Règle des 10%** : ne jamais augmenter la charge hebdomadaire totale de plus
de 10% par rapport à la semaine précédente. Simple, mémorisable, et cliniquement
efficace comme règle de base.

**Session RPE** : après chaque séance, l'utilisateur renseigne son RPE (1-10)
et la durée. L'app calcule la charge et affiche :
- La charge de la semaine vs semaine précédente (delta %)
- L'ACWR sur 4 semaines glissantes
- Une alerte colorée (vert / orange / rouge) selon la zone

---

## 4. Outils de Screening

### 4.1 Tests Fonctionnels de Terrain

**Ces tests permettent d'identifier les déséquilibres et asymétries avant
qu'ils deviennent des blessures.**

**Overhead Squat (OHS)** :
- Squat pieds à largeur d'épaules, bras tendus au-dessus de la tête
- Observe : effondrement du genou (valgus), perte de lordose lombaire,
  talon décollé, inclinaison du tronc
- Déséquilibres révélés : mobilité cheville, stabilité genou, mobilité thoracique

**Single Leg Squat (SLS)** :
- Squat sur une jambe, autre jambe tendue devant
- Observe : valgus dynamique du genou, instabilité du bassin, trunk shift
- Asymétrie gauche/droite > 20% → facteur de risque LCA et ischio

**Y-Balance Test** :
- En appui unilatéral, atteindre 3 directions (antérieure, postéro-médiale,
  postéro-latérale) avec le pied libre
- Score composé calculé : (somme 3 directions / 3 × longueur membre) × 100
- Score < 89% = risque de blessure membres inférieurs significativement augmenté
- Asymétrie entre côtés > 4 cm en direction antérieure → risque genou/cheville

**Test de force ischio-jambiers / quadriceps (ratio I/Q)** :
- Ratio hamstring/quadriceps conventionnel : > 0.60 (si < 0.60 → risque accru)
- Ratio fonctionnel (excentrique hamstring / concentrique quad) : > 0.80
- Mesurable en salle avec machine à jambes ou dynamomètre portable

**Source** : Cook G. et al. (2006). Screening the movement screen — a systematic
approach to movement screening. *North American Journal of Sports Physical Therapy*,
1(2), 62-65. / Plisky P.J. et al. (2006). Star excursion balance test as a predictor
of lower extremity injury. *Journal of Orthopedic and Sports Physical Therapy*,
36(12), 871-882.

---

## 5. Protocoles de Prévention Validés

### 5.1 RugbyReady (World Rugby) — Programme Officiel

World Rugby a développé le programme **RugbyReady**, basé sur des données
épidémiologiques internationales. Il est recommandé comme échauffement
structuré avant chaque entraînement et match.

**Structure (20 minutes)** :
```
Phase 1 — Jogging et activation (5 min)
  Course progressive, mobilité hanches, activation fessiers

Phase 2 — Exercices de force et stabilité (10 min)
  Nordic curl (2×5), squat single-leg (2×10), hip thrust dynamique
  Gainage latéral, rotation épaule avec bande

Phase 3 — Agilité et contact (5 min)
  Changements de direction, contacts techniques contrôlés,
  plaquages sur sac
```

**Efficacité démontrée** : Marshall et al. (2014) — réduction de 25% des
blessures globales et de 40% des blessures à l'entraînement après implémentation
systématique du RugbyReady sur une saison complète.

**Source** : World Rugby (2020). *RugbyReady: Player Welfare Programme*. World Rugby.
/ Marshall S.W. et al. (2014). Implementation of RugbyReady in rugby union.
*International Journal of Sports Physiology and Performance*, 9(3), 519-523.

---

### 5.2 Nordic Hamstring Exercise Protocol (NHE)

Le NHE est l'intervention de prévention la mieux documentée pour les ruptures
musculaires des ischio-jambiers — blessure fréquente en rugby (10-15% de
toutes les blessures).

**Protocole progressif UEFA (van der Horst et al., 2015)** :

| Semaine | Sets × Reps | Note |
|---|---|---|
| 1 | 2 × 5 | Introduction, excentrique pur |
| 2 | 2 × 6 | — |
| 3 | 3 × 6 | — |
| 4 | 3 × 8 | — |
| 5-10 | 3 × 10-12 | Volume entretien |
| Entretien | 1-2 × 8-10 (1×/sem) | Minimum pour maintenir l'effet |

**Résultats** :
- −51% des blessures aux ischio-jambiers sur une saison (p < 0.001)
- −65% des récidives

**Exécution technique** :
- Agenouillé, partenaire ou barre tient les chevilles
- Descendre le buste vers le sol le plus lentement possible (phase excentrique)
- Se rattraper avec les mains, se repousser vers le haut (concentrique assisté)
- Signal d'arrêt de la série : ne plus pouvoir contrôler la descente sur 2-3s

**Source** : van der Horst N. et al. (2015). The preventive effect of the nordic
hamstring exercise on hamstring injuries in amateur soccer players. *American
Journal of Sports Medicine*, 43(6), 1316-1323. / Petersen J. et al. (2011).
Preventive effect of eccentric training on acute hamstring injuries in men's
soccer: a cluster-randomized controlled trial. *American Journal of Sports
Medicine*, 39(11), 2296-2303.

---

### 5.3 Programme de Prévention des Blessures au Genou — LCA

Le LCA (ligament croisé antérieur) est l'une des blessures les plus graves
en rugby (6-12 mois d'absence). Le risque est accru chez les joueurs avec
valgus dynamique du genou, déficit de force des abducteurs de hanche et faible
activation du gainage.

**Intervention préventive evidence-based (Hewett et al., 2006)** :

```
1. Renforcement abducteurs de hanche
   → Clamshell, hip abduction avec bande, lateral band walk
   → 3 × 15-20 reps, 3×/sem

2. Gainage et stabilité du tronc (anti-rotation)
   → Pallof Press, Dead Bug, Single Arm Farmer Carry
   → Activation des obliques et transverse

3. Correction du valgus dynamique
   → Squat avec bande autour des genoux (feedback proprioceptif)
   → Step-up unilateral avec contrôle
   → Bulgarian Split Squat avec attention au genou

4. Pliométrie de contrôle
   → Box jumps avec atterrissage en absorption (genoux dans l'axe)
   → Lateral hops avec atterrissage stable
   → Drop landing → correction si valgus détecté
```

**Source** : Hewett T.E. et al. (2006). Biomechanical measures of neuromuscular
control and valgus loading of the knee predict anterior cruciate ligament injury
risk in female athletes. *American Journal of Sports Medicine*, 34(6), 898-905.
/ Zazulak B.T. et al. (2007). The effects of core proprioception on knee injury.
*American Journal of Sports Medicine*, 35(3), 368-373.

---

## 6. Prehab par Zone Anatomique

### 6.1 Épaule — Zone la Plus Blessée en Rugby

**Mécanismes principaux** :
- Choc direct (plaquage épaule première, chute sur épaule) → luxation/AC
- Contrainte excentrique du grand pectoral / subscapulaire → déchirures
- Instabilité chronique par répétition des contacts

**Programme de prehab épaule** (à intégrer 2-3×/sem toute l'année) :

```
ROTATION EXTERNE (renforcement coiffe des rotateurs)
  → Cable external rotation, DB external rotation, bande élastique
  → 3 × 12-15 reps, RPE 5-6/10
  → Ratio RE/RI optimal : 0.65-0.75 (si < 0.60 → risque de déchirure)

STABILISATION SCAPULAIRE
  → Face pull, Y-T-W avec haltères ou câble, prone Y-T-W
  → 3 × 12-15 reps
  → Objectif : synchronisation trapèze inférieur + dentelé antérieur

RENFORCEMENT EN CHAÎNE FERMÉE
  → Push-up avec contrôle, wall slides, planche avec tap
  → Proprioception de l'épaule et activation automatique

EXCENTRIQUE COIFFE
  → Slow lowering lateral raise (3s excentrique), slow front raise
  → Prévention des tendinopathies de la coiffe
```

**Source** : Edouard P. et al. (2013). Shoulder muscle strength imbalances as
injury risk factors in handball. *International Journal of Sports Medicine*,
34(7), 654-660.

---

### 6.2 Ischio-Jambiers — Blessure N°1 de Course

Voir section 5.2 (NHE Protocol). En complément :

**Exercices de renforcement complémentaires** :
- **Romanian Deadlift (RDL)** : charge de 60-75% 1RM, 3-4 × 8-10 reps.
  Développe la force excentrique en position allongée (zone de risque en sprint)
- **Hip Thrust** : renforce le grand fessier en fin d'extension → décharge
  les ischio-jambiers lors de la propulsion en sprint
- **Single Leg RDL** : force excentrique + proprioception + symétrie
- **Glute Ham Raise** : excentrique pur (similaire au NHE mais sur machine)

**Critère de retour à la course après blessure ischio** :
- Force excentrique ≥ 90% du côté sain (pas de retour au sprint si < 90%)
- No pain test : Nordic curl sans douleur sur 3 × 5 reps

---

### 6.3 Cheville — Prévention des Entorses en Inversion

**Prévalence** : 8-12% de toutes les blessures rugby. Le facteur N°1 de risque
est une entorse antérieure.

**Programme proprioceptif (Hrysomallis, 2011)** :

```
PROGRESSION SUR 4 SEMAINES :

Sem 1 : Équilibre statique monopodal (sol stable, 30s × 3, yeux ouverts)
Sem 2 : Équilibre monopodal yeux fermés (30s × 3)
Sem 3 : Équilibre sur surface instable (coussin d'équilibre, bosu face plate)
Sem 4 : Équilibre dynamique (attraper/lancer ballon en appui monopodal)

RENFORCEMENT PÉRONIERS (ligament résistance à l'inversion) :
  → Eversion avec bande élastique : 3 × 15-20
  → Heel walks (marche sur les talons) : 2 × 20m
  → Single leg calf raise : 3 × 15 (excentrique lent 3s)

TAPING PRÉVENTIF :
  → Bandage adhésif strapping ou cheville de stabilisation
  → Recommandé post-entorse pour les 3-6 premiers mois de retour
```

**Source** : Hrysomallis C. (2011). Balance ability and athletic performance.
*Sports Medicine*, 41(3), 221-232. / Verhagen E. et al. (2004). The effect of a
proprioceptive balance board training program for the prevention of ankle sprains.
*American Journal of Sports Medicine*, 32(6), 1385-1393.

---

### 6.4 Rachis Cervical — Blessure Grave Spécifique Rugby

**Contexte** : la mêlée et les plaquages exposent le rachis cervical à des
contraintes de compression et de cisaillement importantes. Les blessures
cervicales graves (fractures, lésions médullaires) sont les plus graves du rugby.

**Programme prehab cervical (avants prioritairement)** :

```
FLEXION / EXTENSION ISOMÉTRIQUE
  → Résistance manuelle légère contre le front, la nuque, les tempes
  → 5 × 5-10s de contraction isométrique dans chaque direction
  → RPE 6-7/10 — jamais douloureux

MOBILITÉ THORACIQUE
  → Rotations thoraciques en quadrupédie, extension sur foam roller
  → La raideur thoracique est compensée par une hypermobilité cervicale
    → facteur de risque (Sahrmann, 2002)

GAINAGE PROFOND DU COU
  → "Chin tuck" actif (rétraction cervicale) : activation des fléchisseurs
    profonds (longus capitis, longus colli)
  → 3 × 10 reps, maintien 5s
  → Protège contre les compressions axiales en mêlée
```

**Règle absolue de sécurité** : tout joueur signalant des fourmillements, une
faiblesse dans les bras/jambes, une douleur cervicale radiante après un choc
doit être retiré immédiatement du jeu et vu par un médecin. Ne jamais minimiser
un symptôme neurologique.

---

### 6.5 Lombaires — Douleur Chronique du Joueur de Rugby

**Prévalence** : 4-7% des blessures en match, mais prévalence de la **lombalgie
chronique** bien supérieure chez les rugbymen (mêlée, ruck répété).

**"McGill Big 3" — Protocole de renforcement du tronc (McGill, 2010)** :

```
1. MODIFIED CURL-UP (anti-flexion)
   → Position : décubitus, une jambe pliée, mains sous les lombaires
   → Élever légèrement la tête et les épaules (pas de flexion lombaire)
   → 10 reps × 3 sets, progression sur la durée de maintien

2. BIRD DOG (anti-rotation + extension)
   → Quadrupédie → extension bras/jambe opposés simultanément
   → Maintien 7-8s → 10 reps chaque côté × 3 sets
   → Critère technique : pas de rotation du bassin, regard au sol

3. SIDE PLANK (anti-latérofléchissement)
   → Planche latérale sur coude
   → Progression : genoux → pieds → pieds + élévation hanches dynamique
   → 10s → 20s → 30s × 3 sets chaque côté
```

**Principe de McGill** : les lombalgies chroniques sont rarement un problème de
force insuffisante mais de **contrôle moteur et de stabilité**. Éviter la flexion
lombaire sous charge (sit-ups lestés, good morning) chez un joueur lombalgique.

**Source** : McGill S.M. (2010). Core training: Evidence translating to better
performance and injury prevention. *Strength and Conditioning Journal*, 32(3), 33-46.

---

## 7. Gestion des Commotions Cérébrales

### 7.1 Définition et Épidémiologie

**Définition** (McCrory et al., 2017) : la commotion cérébrale est une blessure
cérébrale traumatique induite par des forces biomécaniques (impact direct ou
impulsion). Elle entraîne une perturbation de la fonction neurologique qui se
résout spontanément, mais peut avoir des conséquences à long terme si mal gérée.

**Épidémiologie rugby** :
- 4-8% de toutes les blessures en match
- 1.0-1.7 commotions pour 1 000h d'exposition en rugby professionnel
- 50-60% surviennent lors d'un plaquage (plaqueur ET plaqué)
- Risque de re-commotion × 3-4 si retour prématuré

---

### 7.2 Signes et Symptômes — Reconnaissance Immédiate

**Signes à reconnaître sur le terrain (pour tout joueur, entraîneur)** :

```
SIGNES CLAIRS → Sortir immédiatement, sans discussion :
  ✗ Perte de conscience (même brève)
  ✗ Convulsions / mouvements anormaux
  ✗ Trouble de l'équilibre évident (ne peut pas marcher droit)
  ✗ Confusion manifeste (ne sait pas où il est, quel match)
  ✗ Amnésie (ne sait pas ce qui s'est passé)

SYMPTÔMES À SURVEILLER (sortir si ≥ 1 présent) :
  → Maux de tête ("j'ai la tête qui sonne")
  → Vision trouble, flashes, photosensibilité
  → Acouphènes ou hypersensibilité aux sons
  → Nausées ou vomissements
  → Sensation de "brouillard mental", ralentissement
  → Changement de comportement ou d'humeur soudain
```

**Règle absolue (World Rugby)** : **"If in doubt, sit them out"**
Un joueur suspecté de commotion NE RETOURNE PAS en jeu ce jour-là, quelle
que soit la pression de l'entourage ou l'enjeu du match.

---

### 7.3 Protocole de Retour au Jeu (World Rugby, 6 Étapes)

**Durée minimale** : 6 jours (professionnel avec suivi médical) à
plusieurs semaines (amateur, lycéen).

```
ÉTAPE 0 — REPOS COMPLET (jusqu'à disparition des symptômes au repos)
  Pas d'écrans, pas de sport, repos cognitif aussi bien que physique
  Durée : 24-48h minimum

ÉTAPE 1 — ACTIVITÉ LÉGÈRE (marche, vélo très léger)
  Pas de montée du rythme cardiaque > 60% FCmax
  Condition : asymptomatique au repos depuis 24h

ÉTAPE 2 — EXERCICE AÉROBIE MODÉRÉ
  Course légère, vélo stationnaire. Pas de contact, pas de résistance
  Condition : aucun symptôme à l'étape 1

ÉTAPE 3 — EXERCICES SPÉCIFIQUES AU RUGBY (sans contact)
  Passes, frappes, mouvements rugby sans opposition
  Condition : aucun symptôme à l'étape 2

ÉTAPE 4 — ENTRAÎNEMENT SANS CONTACT AVEC PARTENAIRES
  Entraînement complet sauf contact et opposition directe
  Condition : aucun symptôme à l'étape 3

ÉTAPE 5 — ENTRAÎNEMENT COMPLET AVEC CONTACT
  Retour entraînement plein. Validation médicale obligatoire.
  Condition : aucun symptôme à l'étape 4

ÉTAPE 6 — RETOUR AU MATCH
  Uniquement après validation étape 5 et clearance médicale
```

**Règle** : si des symptômes réapparaissent à une étape, revenir à l'étape
précédente. Chaque étape dure au minimum 24h sans symptômes.

**Risque à long terme** : l'exposition répétée aux commotions est associée
au syndrome des "coups répétés" (CTE — Chronic Traumatic Encephalopathy),
une encéphalopathie dégénérative. Données encore en cours d'étude mais
justifiant une gestion rigoureuse de chaque épisode.

**Source** : McCrory P. et al. (2017). Consensus statement on concussion in sport
— the 5th International Conference on Concussion in Sport (Berlin). *British
Journal of Sports Medicine*, 51(11), 838-847.

---

## 8. Retour au Jeu Après Blessure Musculaire

### 8.1 Approche Basée sur des Critères (Criteria-Based) vs Temps (Time-Based)

**Approche basée sur le temps** (traditionnelle) :
- "Tu reviens dans 3 semaines."
- Simple à communiquer mais ne garantit pas la guérison fonctionnelle.
- Risque de récidive élevé si le joueur n'a pas récupéré ses qualités.

**Approche basée sur des critères** (recommandée) :
- Retour quand des critères fonctionnels mesurables sont atteints.
- Nécessite des tests objectifs, mais protège contre les récidives.

**Critères de retour au jeu pour une blessure musculaire (Buckthorpe, 2019)** :

```
CRITÈRES OBLIGATOIRES :
  ✓ Absence de douleur à la palpation et aux tests fonctionnels
  ✓ Amplitude articulaire complète sans douleur
  ✓ Force du côté blessé ≥ 90% du côté sain (même exercice, même vitesse)
  ✓ Tests fonctionnels sans douleur : sprint progressif, changement de direction
  ✓ Normalisation de la biomécanique (pas de compensation observable)

CRITÈRES SOUHAITABLES :
  ✓ Imagerie (échographie / IRM) confirmant la cicatrisation (si disponible)
  ✓ Questionnaire psychologique de confiance : joueur se sent prêt (> 7/10)
  ✓ Charge similaire à l'avant-blessure maintenue 1-2 semaines sans symptômes
```

**Source** : Buckthorpe M. et al. (2019). Recommendations for hamstring injury
prevention in elite football: practical applications of muscle specific concepts.
*Sports Medicine*, 49(6), 863-883.

---

## 9. Échauffement — Prévention et Performance

### 9.1 Pourquoi l'Échauffement Prévient les Blessures

Un échauffement bien conduit réduit le risque de blessure en :
1. Augmentant la température musculaire → augmentation de l'élasticité et de
   la vitesse de conduction nerveuse
2. Augmentant la viscosité du liquide synovial (articulations plus "lubrifiées")
3. Activant les patterns moteurs avant les efforts intenses (potentiation)
4. Préparant le SNC (recrutement, coordination)

**Réduction de blessures démontrée** : les programmes d'échauffement structurés
(FIFA 11+, RugbyReady) réduisent les blessures globales de 20-50% selon les
études (Emery et al., 2015).

---

### 9.2 Structure d'Échauffement Evidence-Based (20-25 min)

```
PARTIE 1 — ÉLÉVATION DE TEMPÉRATURE (5 min)
  Jogging progressif, vélo léger. Objectif : transpiration légère
  Ne jamais étirer un muscle "froid" (étirements statiques au repos → réduisent
  la force et la puissance de -5-8% si faits avant effort, McCann & Flanagan, 2010)

PARTIE 2 — MOBILITÉ DYNAMIQUE (5-7 min)
  Mobilité active (not passive stretching) :
  → Leg swings (avant/arrière, médio-latéral) × 15 chaque
  → Hip circles, inchworm, world's greatest stretch
  → Rotation thoracique en fente, squat profond pause
  → Mobilité épaule (cercles bras, bras croisés, internal rotation)

PARTIE 3 — ACTIVATION NEURO-MUSCULAIRE (5 min)
  → Glute bridges × 15 (activation fessiers)
  → Clamshells × 12 (activation abducteurs)
  → Dead bugs × 10 (activation core profond)
  → Mini-band lateral walks × 20 pas chaque côté

PARTIE 4 — RAMPE D'INTENSITÉ (5-8 min)
  → Accélérations progressives (50%, 70%, 85%, 95% de vitesse max)
  → Changements de direction progressifs
  → Sprints courts (10-15m) à intensité montante
  → Contacts légers si applicable (travail de chute, réception de plaquage)
```

**Source** : Emery C. et al. (2015). Neuromuscular training injury prevention
strategies in youth sport: a systematic review and meta-analysis. *British Journal
of Sports Medicine*, 49(13), 865-870. / McCann M.R. & Flanagan S.P. (2010).
The effects of exercise selection and rest interval on post-activation potentiation
of vertical jump performance. *Journal of Strength and Conditioning Research*,
24(5), 1285-1291.

---

## 10. Signaux d'Alerte — Quand Stopper et Consulter

### 10.1 Douleurs Nécessitant un Arrêt Immédiat

```
STOP IMMÉDIAT — CONSULTATION MÉDICALE URGENTE :
  ✗ Douleur thoracique ou essoufflement anormal à l'effort
  ✗ Douleur cervicale avec fourmillements / faiblesse dans les membres
  ✗ Symptômes de commotion (section 7.2)
  ✗ Déformation visible d'une articulation (luxation, fracture suspectée)
  ✗ Douleur qui ne diminue pas en moins de 5 min après l'arrêt de l'effort

STOP SÉANCE — CONSULTATION DANS 48H :
  ✗ Douleur tendineuse localisée qui augmente à l'échauffement et pendant l'effort
  ✗ Douleur articulaire (genou, cheville) avec gonflement
  ✗ Douleur lombaire irradiant dans la fesse ou la jambe
  ✗ Douleur musculaire aiguë lors d'un effort (signe de claquage)
```

### 10.2 Signaux de Surcharge à Surveiller Régulièrement

```
AJUSTER LA CHARGE (pas d'arrêt, mais réduire) :
  → Raideur matinale persistante > 30 min dans une articulation
  → Douleur tendineuse apparaissant à l'échauffement (disparaissant ensuite)
  → Courbatures persistantes > 5 jours sans nouveau stimulus
  → ACWR > 1.5 (section 3.2)
  → Score Hooper > 20 (section recovery.md)
  → HRV < −15% baseline 3 jours consécutifs (section recovery.md)
```

### 10.3 Règle de Sécurité dans l'App

Si l'utilisateur signale ≥ 1 signal de la catégorie "STOP IMMÉDIAT" :
→ Afficher message d'alerte prioritaire, recommander consultation médicale,
  désactiver la génération de programme jusqu'à confirmation de l'état.

Si l'utilisateur signale ≥ 2 signaux "STOP SÉANCE" sur la même semaine :
→ Recommander consultation kinésithérapeute, proposer plan de récupération
  allégé sans les zones douloureuses.

---

## 11. Références Bibliographiques Complètes

1. **Bahr R. & Krosshaug T.** (2005). Understanding injury mechanisms: a key component of preventing injuries in sport. *British Journal of Sports Medicine*, 39(6), 324-329.

2. **Brooks J.H.M. et al.** (2005). Epidemiology of injuries in English professional rugby union. *British Journal of Sports Medicine*, 39(10), 763-775.

3. **Buckthorpe M. et al.** (2019). Recommendations for hamstring injury prevention in elite football: practical applications of muscle specific concepts. *Sports Medicine*, 49(6), 863-879.

4. **Cook G. et al.** (2006). Screening the movement screen. *North American Journal of Sports Physical Therapy*, 1(2), 62-65.

5. **Edouard P. et al.** (2013). Shoulder muscle strength imbalances as injury risk factors in handball. *International Journal of Sports Medicine*, 34(7), 654-660.

6. **Emery C. et al.** (2015). Neuromuscular training injury prevention strategies in youth sport. *British Journal of Sports Medicine*, 49(13), 865-870.

7. **Fuller C.W. et al.** (2007). Consensus statement on injury definitions and data collection procedures for studies of injuries in rugby union. *British Journal of Sports Medicine*, 41(5), 328-331.

8. **Gabbett T.J.** (2016). The training-injury prevention paradox: should athletes be training smarter and harder? *British Journal of Sports Medicine*, 50(5), 273-280.

9. **Garraway W.M. et al.** (2000). Impact of professionalism on injuries in rugby union. *British Journal of Sports Medicine*, 34(5), 348-351.

10. **Hendricks S. et al.** (2012). Review of the literature on the epidemiology of rugby union injuries. *South African Journal of Sports Medicine*, 24(3), 73-81.

11. **Hewett T.E. et al.** (2006). Biomechanical measures of neuromuscular control and valgus loading of the knee predict ACL injury risk. *American Journal of Sports Medicine*, 34(6), 898-905.

12. **Hrysomallis C.** (2011). Balance ability and athletic performance. *Sports Medicine*, 41(3), 221-232.

13. **Hulin B.T. et al.** (2016). The acute:chronic workload ratio predicts injury in elite rugby league players. *British Journal of Sports Medicine*, 50(4), 231-236.

14. **Marshall S.W. et al.** (2014). Implementation of RugbyReady in rugby union. *International Journal of Sports Physiology and Performance*, 9(3), 519-523.

15. **McCann M.R. & Flanagan S.P.** (2010). The effects of exercise selection and rest interval on post-activation potentiation. *Journal of Strength and Conditioning Research*, 24(5), 1285-1291.

16. **McCrory P. et al.** (2017). Consensus statement on concussion in sport — the 5th International Conference on Concussion in Sport. *British Journal of Sports Medicine*, 51(11), 838-847.

17. **McGill S.M.** (2010). Core training: Evidence translating to better performance and injury prevention. *Strength and Conditioning Journal*, 32(3), 33-46.

18. **Meeuwisse W.H. et al.** (2007). A dynamic model of etiology in sport injury. *Clinical Journal of Sport Medicine*, 17(3), 215-219.

19. **Mountjoy M. et al.** (2014). The IOC consensus statement: beyond the female athlete triad — RED-S. *British Journal of Sports Medicine*, 48(7), 491-497.

20. **Petersen J. et al.** (2011). Preventive effect of eccentric training on acute hamstring injuries in men's soccer. *American Journal of Sports Medicine*, 39(11), 2296-2303.

21. **Plisky P.J. et al.** (2006). Star excursion balance test as a predictor of lower extremity injury. *Journal of Orthopedic and Sports Physical Therapy*, 36(12), 871-882.

22. **van der Horst N. et al.** (2015). The preventive effect of the nordic hamstring exercise on hamstring injuries. *American Journal of Sports Medicine*, 43(6), 1316-1323.

23. **Verhagen E. et al.** (2004). The effect of a proprioceptive balance board training program for the prevention of ankle sprains. *American Journal of Sports Medicine*, 32(6), 1385-1393.

24. **World Rugby** (2020). *RugbyReady: Player Welfare Programme*. World Rugby.

25. **Zazulak B.T. et al.** (2007). The effects of core proprioception on knee injury. *American Journal of Sports Medicine*, 35(3), 368-373.

---

*Dernière mise à jour : 2026-02-24 | Version : 1.0.0*
*Domaines couverts : épidémiologie des blessures rugby (taux, anatomie, postes), facteurs de risque, paradoxe entraînement-blessure, ACWR, screening fonctionnel, protocoles préventifs (RugbyReady, NHE, LCA, épaule, cheville, lombaires, cervical), commotions cérébrales (protocole World Rugby 6 étapes), retour au jeu, échauffement structuré, signaux d'alerte.*
*Fichiers complémentaires : `periodization.md`, `recovery.md`, `strength-methods.md`, `nutrition.md`, `energy-systems.md` (à venir).*
