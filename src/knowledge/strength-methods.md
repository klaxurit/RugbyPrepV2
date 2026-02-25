# Méthodes de Développement de la Force et de la Puissance — Base de Connaissance Rugby

> **Usage** : source de vérité scientifique sur les méthodes de force et puissance
> pour RugbyPrep. Conçu pour injection comme contexte dans les appels Claude API
> (génération de blocs d'entraînement, sélection d'exercices, prescription de
> charge, explications des méthodes). Contenu dense et sourcé. Vulgarisation
> gérée au niveau du prompt utilisateur.

---

## 1. La Force — Définition et Taxonomie

### 1.1 Définition biomécanique

La force musculaire est la capacité à produire une tension mécanique pour accélérer,
décélérer ou stabiliser une masse. En physique : **F = m × a**.

Pour le rugby, l'enjeu est rarement la force maximale brute isolée, mais la capacité
à **exprimer cette force rapidement** (puissance = force × vitesse) et de manière
répétée dans des contextes de contact et de locomotion.

---

### 1.2 La Courbe Force-Vitesse (Hill, 1938)

La relation force-vitesse est le fondement de toute programmation de force-puissance.
Elle décrit une relation inverse entre la force produite et la vitesse de
contraction musculaire :

```
Force
  ↑
  |█ Force max (isométrique, v=0)
  |██
  |████
  |███████ Zone Force-Vitesse optimale (puissance max)
  |████████████
  |██████████████████ Vitesse max (force → 0)
  +————————————————→ Vitesse
```

**Points clés** :
- **Force maximale** (1RM) : vitesse proche de zéro, effort isométrique ou quasi.
- **Zone de puissance maximale** : ~30-70% 1RM selon la qualité et la masse
  corporelle du sujet (pic de puissance mécanique ≈ force × vitesse).
- **Vitesse maximale** : charge très faible voire nulle (sprint, lancer).

**Implication pour le programme** : développer uniquement la force max (charges
lourdes lentes) OU uniquement la vitesse (sprints sans charge) laisse un "trou"
dans la courbe. Un joueur de rugby doit travailler **l'ensemble du spectre**
sur une saison.

**Source** : Hill A.V. (1938). The heat of shortening and the dynamic constants of
muscle. *Proceedings of the Royal Society B*, 126(843), 136-195. / Cormie P.,
McGuigan M.R. & Newton R.U. (2011). Developing maximal neuromuscular power: Part 1.
*Sports Medicine*, 41(1), 17-38.

---

### 1.3 Taxonomie des Qualités de Force

| Qualité | Définition | Zone % 1RM | Vélocité barre | Pertinence Rugby |
|---|---|---|---|---|
| **Force maximale** | Force la plus grande possible sans contrainte temporelle | 85–100% | < 0.5 m/s | ★★★★★ (mêlée, plaquage, ruck) |
| **Force explosive** (Puissance) | Force produite rapidement ; P = F × V | 30–75% | 0.75–1.3 m/s | ★★★★★ (toutes actions) |
| **Force élastique-réactive** | Utilisation du cycle élongation-raccourcissement (CEA) | BW–50% | > 1.5 m/s | ★★★★☆ (sprint, saut, plaquage dynamique) |
| **Force-endurance** | Maintien de la production de force sous fatigue | 40–70% | Variable | ★★★★☆ (80 min de match) |
| **Hypertrophie** (base structurelle) | Augmentation de la section transversale musculaire | 60–80% | 0.4–0.8 m/s | ★★★☆☆ (masse, protection au contact) |

**Source** : Zatsiorsky V. & Kraemer W. (2006). *Science and Practice of Strength
Training* (2nd ed.). Human Kinetics, chap. 2. / Suchomel T.J., Nimphius S. &
Stone M.H. (2016). The importance of muscular strength in athletic performance.
*Sports Medicine*, 46(10), 1419-1449.

---

### 1.4 Taux de Développement de la Force (RFD — Rate of Force Development)

Le RFD mesure la vitesse à laquelle la force est produite : **RFD = ΔForce / Δtemps** (N/s).

**Pourquoi le RFD est critique en rugby** :
- La durée d'un contact de plaquage est de 150–300 ms.
- La durée d'impulsion d'un départ de sprint est de 80–120 ms.
- Le pic de force musculaire (1RM) est atteint en ~300-500 ms.
- **Conséquence** : lors d'une action explosive, le temps disponible est souvent
  inférieur au temps nécessaire pour atteindre la force maximale. C'est le RFD
  des premières 100-200 ms qui détermine la performance, pas la force max absolue.

**Entraîner le RFD** requiert des exercices réalisés avec intention maximale de
vitesse d'exécution, même sous charge sous-maximale (méthode dynamique).

**Source** : Aagaard P. et al. (2002). Increased rate of force development and
neural drive of human skeletal muscle following resistance training. *Journal of
Applied Physiology*, 93(4), 1318-1326. / Tillin N.A. & Bishop D. (2009). Factors
modulating post-activation potentiation and its effect on performance. *Sports
Medicine*, 39(2), 147-166.

---

## 2. Zones d'Intensité et Paramètres de Charge

### 2.1 Zones d'Intensité Relative (% 1RM)

| Zone | % 1RM | Répétitions possibles | Effet principal | Méthode associée |
|---|---|---|---|---|
| Maximale | 93–100% | 1–2 | Force max neurale | Effort maximal |
| Supra-maximale | > 100% | Excentrique uniquement | Force excentrique max | Excentrique surcharge |
| Force lourde | 85–92% | 3–5 | Force max + recrutement UM | Effort sous-maximal lourd |
| Force-puissance | 75–85% | 5–8 | Force + initiation puissance | Répétitions sub-max à vitesse |
| Puissance | 50–75% | — | Pic de puissance | Effort dynamique (vitesse max) |
| Vitesse-force | 30–55% | — | Puissance haute vitesse | Balistique, jump squats |
| Endurance-force | 40–65% | 12–20+ | Hypertrophie + endurance | Effort répété |

**Source** : Haff G.G. & Triplett N.T. (eds) (2016). *NSCA's Essentials of
Strength Training and Conditioning* (4th ed.). Human Kinetics, chap. 17.

---

### 2.2 RPE et RIR — Autorégulation

Les échelles RPE (Rate of Perceived Exertion) et RIR (Reps in Reserve) permettent
d'ajuster la charge en temps réel selon l'état de forme du jour. C'est le standard
actuel en S&C appliqué.

**Échelle RIR (Répétitions en Réserve)** — Zourdos et al. (2016) :

| RIR | Signification | RPE équivalent | Usage recommandé |
|---|---|---|---|
| 5+ RIR | Très facile | 5/10 | Échauffement, technique, déload |
| 3–4 RIR | Confortable | 6–7/10 | Blocs de volume, W1 du cycle |
| 2–3 RIR | Difficile mais contrôlé | 7–8/10 | Blocs d'intensification, W2-W3 |
| 1–2 RIR | Très difficile, 1-2 reps avant l'échec | 8–9/10 | Pic d'intensité, W4 |
| 0 RIR (échec) | Dernière répétition possible | 10/10 | Non recommandé pour rugby (risque blessure, SNC) |

**Recommandation pour rugby amateur** : ne jamais aller à l'échec musculaire
sur les exercices polyarticulaires (squat, deadlift, press). L'échec musculaire
sous charge lourde génère une fatigue du SNC disproportionnée et augmente le
risque de blessure sans bénéfice supplémentaire démontré pour les athlètes de
sports collectifs.

**Source** : Zourdos M.C. et al. (2016). Novel resistance training–specific RPE
scale measuring repetitions in reserve. *Journal of Strength and Conditioning
Research*, 30(1), 267-275. / Schoenfeld B.J. (2021). Resistance Training to
Volitional Failure: Effects on the Stimulus for Muscle Growth. *Strength and
Conditioning Journal*, 43(4), 6-10.

---

### 2.3 Velocity-Based Training (VBT)

Le VBT utilise la **vitesse de déplacement de la barre** (m/s) pour prescrire
et monitorer l'intensité, indépendamment du % 1RM calculé.

**Avantages** :
- Objectif et auto-régulé : si le joueur est fatigué, la barre est plus lente
  → signal de réduire la charge sans référence à un 1RM potentiellement périmé
- Détecte la fatigue intra-séance (une chute de vitesse > 20% signale l'arrêt
  optimal de la série)
- Permet d'entraîner la puissance avec précision

**Vitesses de référence (squat, pour un athlète intermédiaire)** :

| Zone | Vitesse barre (m/s) | % 1RM approx. |
|---|---|---|
| Force max | < 0.35 | > 90% |
| Force lourde | 0.35–0.55 | 80–90% |
| Force-puissance | 0.55–0.75 | 70–80% |
| Puissance max | 0.75–1.00 | 55–70% |
| Vitesse-force | 1.00–1.30 | 40–55% |
| Vitesse pure | > 1.30 | < 40% |

**Note** : les valeurs varient selon l'exercice, le niveau et la morphologie.
Le VBT nécessite un capteur (PUSH Band, GymAware, Vmaxpro). Non implémenté
actuellement dans l'app — à considérer pour une version future.

**Source** : González-Badillo J.J. & Sánchez-Medina L. (2010). Movement velocity
as a measure of loading intensity in resistance training. *International Journal
of Sports Medicine*, 31(5), 347-352.

---

### 2.4 Volume : MEV, MAV, MRV (Israetel et al., RP Strength)

Framework basé sur la recherche pour quantifier le volume d'entraînement optimal
par groupe musculaire par semaine :

| Seuil | Définition | Valeur approx. (sets/sem, groupe musculaire) |
|---|---|---|
| **MEV** (Minimum Effective Volume) | Volume minimum pour générer une adaptation | 6–10 sets |
| **MAV** (Maximum Adaptive Volume) | Volume où l'adaptation est optimale | 10–20 sets |
| **MRV** (Maximum Recoverable Volume) | Volume max avant que la récupération soit compromise | 20–25+ sets |

**Application pour joueur amateur (2 séances S&C/sem)** :
- Cibler le MEV à MAV pendant la compétition (6-12 sets/semaine/groupe)
- Cibler le MAV en pré-saison/off-season (12-20 sets)
- Ne jamais dépasser le MRV en saison (accumulation de fatigue incontrôlée)

**Source** : Israetel M., Hoffmann J. & Case C. (2019). *Scientific Principles of
Strength Training*. Renaissance Periodization, chap. 4.

---

## 3. Les Grandes Méthodes d'Entraînement

### 3.1 Méthode de l'Effort Maximal (Max Effort — ME)

**Principe** (Zatsiorsky, 1995) : réaliser une répétition ou un très faible nombre
de répétitions avec la charge la plus lourde possible (90–100% 1RM).

**Mécanismes** :
- Recrutement maximal des unités motrices à haute seuil (type IIx)
- Maximisation de la fréquence de décharge des neurones moteurs
- Synchronisation inter-musculaire et inhibition autogène (Golgi) réduite

**Adaptations** : essentiellement **neurales** (recrutement, synchronisation,
coordination). Peu d'hypertrophie. Gains de force rapides chez intermédiaires.

**Protocole standard** :
- 3–5 séries × 1–3 reps à 90–100% 1RM
- Récupération : 3–5 min inter-séries
- Fréquence : 1×/sem par mouvement (charge SNC importante)
- Exercices : squat, deadlift, bench press, overhead press

**Adaptation rugby** : utiliser 85-92% (3-5 reps) plutôt que des singles
(1RM) pour un joueur amateur, afin de limiter le risque de blessure et la
fatigue SNC.

**Source** : Zatsiorsky V. & Kraemer W. (2006) op. cit., p. 148-162. / Simmons L.
(2007). *Westside Barbell Book of Methods*. Westside Barbell.

---

### 3.2 Méthode de l'Effort Dynamique (Dynamic Effort — DE)

**Principe** : réaliser des répétitions avec une charge sous-maximale (50–75%
1RM) à la **vitesse maximale intentionnelle** pour développer le RFD et la
puissance.

**Mécanismes** :
- Stimule les adaptations neurales de vitesse (firing rate élevé)
- Développe le RFD dans les premières 100-200 ms de l'effort
- Entraîne la synchronisation neuromusculaire à haute vitesse
- Préserve la fraîcheur du SNC (charge modérée)

**Protocole standard** :
- 6–10 séries × 2–3 reps à 55–75% 1RM
- Intetion maximale de vitesse sur chaque répétition (même si la barre monte "lentement")
- Récupération : 60-90s inter-séries (pour maintenir la qualité explosive)
- Exercices : jump squat, box squat dynamique, deadlift balistique, bench throw

**Signal d'arrêt d'une série** : dès que la vitesse d'exécution diminue de façon
perceptible, la série est terminée. La fatigue intra-série annule le bénéfice
de la méthode dynamique.

**Source** : Baker D. & Newton R.U. (2005). Methods to assess and develop explosive
power in rugby league players. *Strength and Conditioning Coach*, 13(1), 5-17. /
Cormie P. et al. (2011) op. cit.

---

### 3.3 Méthode de l'Effort Répété (Repeated Effort — RE)

**Principe** : réaliser un nombre élevé de répétitions avec une charge
sous-maximale (60–80% 1RM) jusqu'à ou proche de la fatigue, pour stimuler
l'hypertrophie et la force-endurance.

**Mécanismes** :
- Recrutement progressif des unités motrices à mesure de la fatigue (principe
  de taille de Henneman)
- Stress métabolique élevé (accumulation de métabolites, gonflement cellulaire)
- Tension mécanique prolongée (temps sous tension)

**Pour le rugby** : principal mécanisme d'hypertrophie. Pertinent en phase de
construction (off-season) et pour les exercices accessoires.

**Protocole** :
- 3–4 séries × 8–15 reps à 65–80% 1RM, RIR 2-3
- Récupération : 60-120s
- Exercices : tirages, split squat, RDL, hip thrust, accessoires

**Source** : Schoenfeld B.J. (2010). The mechanisms of muscle hypertrophy and
their application to resistance training. *Journal of Strength and Conditioning
Research*, 24(10), 2857-2872.

---

## 4. Potentiation Post-Activation (PAP) et Méthodes Complexes

### 4.1 Mécanisme de la PAP

La PAP est l'augmentation temporaire des capacités contractiles d'un muscle
consécutive à une contraction à haute intensité préalable. Elle résulte de :

1. **Phosphorylation des chaînes légères de myosine** → augmentation de la
   sensibilité de l'actine-myosine au calcium → plus grande force pour même
   signal nerveux.
2. **Augmentation du recrutement des unités motrices** → les neurones moteurs
   sont temporairement plus "excitables".
3. **Réduction de l'inhibition autogène** (inhibition de l'organe de Golgi).

**Résultat mesurable** : amélioration de la puissance explosive (CMJ, sprint,
lancer) de **3–10%** dans la fenêtre optimale post-effort lourd.

**Fenêtre temporelle optimale** :
- 4–12 minutes après la contraction lourde
- Trop tôt (< 3 min) : fatigue aiguë domine, bénéfice annulé
- Trop tard (> 20 min) : PAP dissipée

**Source** : Tillin N.A. & Bishop D. (2009). Factors modulating post-activation
potentiation. *Sports Medicine*, 39(2), 147-166. / Robbins D.W. (2005).
Postactivation potentiation and its practical applicability: a brief review.
*Journal of Strength and Conditioning Research*, 19(2), 453-458.

---

### 4.2 Entraînement en Complexe (Complex Training)

**Principe** : enchaîner un exercice lourd (force max, PAP) et un exercice
balistique/explosif (transfert PAP) dans la même série ou le même bloc.

**Structure type** :
```
Exercice A (lourd)      : 3–5 reps @ 85-90% 1RM
  ↓ Repos : 3–5 min
Exercice B (explosif)   : 3–5 reps @ intention maximale
```

**Exemples validés pour rugby** :
| Exercice lourd (A) | Exercice explosif (B) | Transfert ciblé |
|---|---|---|
| Back squat @ 85% | Jump squat ou CMJ | Puissance membre inf. |
| Trap bar deadlift @ 80% | Broad jump / box jump | Puissance de démarrage |
| Bench press @ 85% | Medicine ball chest throw | Puissance push |
| Power clean @ 80% | Drop jump | Force réactive |

**Evidence en rugby** : Dello Iacono A. et al. (2017) — étude sur joueurs de
rugby union : le complex training sur 6 semaines améliore le CMJ de +6.2%,
le 10m sprint de −2.4%, et le 30m de −1.8% vs entraînement force seul.

**Source** : Dello Iacono A., Martone D., Milic M. & Padulo J. (2017).
Vertical- vs. horizontal-oriented drop jump training: chronic effects.
*Journal of Strength and Conditioning Research*, 31(8), 2245-2254.

---

### 4.3 La Méthode des Contrastes Français (French Contrast Method — FCM)

**Origine** : développée par Gilles Cometti (Université de Dijon) et popularisée
internationalement par Cal Dietz (*Triphasic Training*, 2012).

**Principe** : enchaîner 4 exercices dans un cluster ciblant successivement les
quatre quadrants de la courbe force-vitesse, maximisant la PAP cumulative et
l'entraînement complet du spectre force-puissance.

**Structure canonique (4 exercices, enchaînés)** :
```
Exercice 1 : Force max lourde       (80-90% 1RM, 3-5 reps)  → déclenche PAP
  ↓ Repos : 10-20s (transition rapide)
Exercice 2 : Mouvement balistique   (30-45% 1RM, explosif)   → exploite PAP (haute force-vitesse)
  ↓ Repos : 10-20s
Exercice 3 : Pliométrique            (poids du corps, réactif) → vitesse-force
  ↓ Repos : 10-20s
Exercice 4 : Balistique léger assisté ou sprint court         → vitesse pure
  ↓ Repos : 3-5 min entre clusters
```

**Exemple concret pour un avant (pilier, numéro 8)** :
```
1. Back Squat 80% × 3 reps
2. Jump Squat (barre légère 30%) × 5 reps, intention maximale
3. Box Jump ou Depth Jump × 5 reps
4. Sprint 10m ou Broad Jump × 3 reps
→ Repos 4 min → Recommencer (3 clusters total)
```

**Exemple pour un arrière ou flanker** :
```
1. Trap Bar Deadlift 80% × 3 reps
2. Kettlebell Swing lourd × 6 reps
3. Drop Jump × 5 reps
4. Sprint 10-15m × 2 reps
→ Repos 4 min (3 clusters)
```

**Evidence** : la FCM est l'une des méthodes les plus efficaces pour développer
simultanément la puissance et la vitesse en sport collectif. Gains typiques après
6-8 semaines : CMJ +8-15%, sprint 10m −3-5%, sprint 30m −2-3%.

**Mise en garde pour amateurs** : la FCM est une méthode avancée. Elle requiert :
- Maîtrise technique solide de tous les exercices impliqués
- SNC reposé (ne jamais en fin de séance ou lendemain de match)
- Introduction progressive (commencer par 2 clusters, 2 exercices)

**Source** : Cometti G. (2002). *La préparation physique en football*. Editions
Chiron. / Dietz C. & Peterson B. (2012). *Triphasic Training*. Cal Dietz. /
Turner A. (2011). The science and practice of periodization: a brief review.
*Strength and Conditioning Journal*, 33(1), 34-46.

---

### 4.4 Séries en Contraste (Contrast Sets)

**Principe simplifié** de la PAP : au sein d'une même série, enchaîner une
répétition lourde (85-90%) et immédiatement une répétition explosive (charge
légère ou BW).

**Structure** :
```
Série "contraste" : 1 rep @ 85-90% + 1 rep explosive (saut, sprint court)
→ Repos 2-3 min → Répéter 4-6 fois
```

**Intérêt vs complex training** : plus simple à organiser, moins de matériel,
fonctionne bien pour les exercices de poussée (squat + jump squat, bench + MB throw).

**Source** : Baker D. (2003). Acute effect of alternating heavy and light
resistances on power output during upper-body complex power training.
*Journal of Strength and Conditioning Research*, 17(3), 493-497.

---

## 5. Méthodes Spécifiques

### 5.1 Entraînement Excentrique

**Définition** : phase de freinage/allongement musculaire sous charge. La force
excentrique maximale est **20-40% supérieure** à la force concentrique maximale.

**Mécanismes d'adaptation** :
- Épaississement des sarcomères (ajout en série → muscle plus long, plus fort
  en position allongée)
- Renforcement des tendons et tissu conjonctif
- Réduction du risque de blessures musculaires (ischio-jambiers ++)

**Nordic Curl (ou Nordic Hamstring Exercise — NHE)** :
Le NHE est l'exercice le mieux étudié pour la prévention des blessures aux
ischio-jambiers en sport collectif.

- Protocole préventif UEFA : 3 sets progressifs (semaine 1 : 2×5, progression
  sur 10 semaines jusqu'à 3×12)
- Résultats (van der Horst et al., 2015) : réduction de 51% des blessures aux
  ischio-jambiers, réduction de 65% des récidives en football.
- Applicable au rugby : les sprints répétés et les changements de direction
  créent des contraintes identiques sur les ischio-jambiers.

**Tempo excentrique** :
Ralentir la phase excentrique de tout exercice de force (ex : 3-4s de descente
au squat) augmente le temps sous tension et le stress mécanique sur le tissu
conjonctif → bénéfice pour la prévention et l'hypertrophie.

**Protocole** : x-0-1-0 (x sec excentrique, 0 pause bas, 1 sec concentrique,
0 pause haut). En phase de construction : 3-4-0-1.

**Source** : van der Horst N. et al. (2015). The preventive effect of the nordic
hamstring exercise on hamstring injuries in amateur soccer players. *American
Journal of Sports Medicine*, 43(6), 1316-1323. / Schoenfeld B.J. (2010) op. cit.

---

### 5.2 Entraînement Isométrique

**Définition** : contraction musculaire sans mouvement articulaire (longueur
musculaire constante). Force produite = 0 déplacement.

**Types** :
- **Isométrique maximal** (effort maximal contre résistance fixe) : recrutement
  neural maximal, peu de fatigue musculaire
- **Isométrique fonctionnel** : maintien d'une position sous charge (planche,
  wall sit, pause au bas du squat)

**Pertinence rugby** : le plaquage, la mêlée, et le maul imposent des contractions
isométriques prolongées sous haute force. L'entraînement isométrique améliore
spécifiquement ces qualités.

**Protocole de pause** (Isometric Pause Training) :
- Squat pause 3s au bas (angle cible : 90° genou) × 3-5 reps @ 70-80%
- Bench press pause 2s sur la poitrine × 3-5 reps @ 75-85%
- Bénéfice : élimine le rebond au bas, force le recrutement neural pur

**Source** : Lum D. & Barbosa T.M. (2019). Brief review: Effects of isometric
strength training on strength and dynamic performance. *International Journal
of Sports Medicine*, 40(6), 363-375.

---

### 5.3 Plyométrie

**Définition** : exercices exploitant le Cycle d'Élongation-Raccourcissement (CER)
— étirement préalable rapide du muscle (stockage d'énergie élastique) suivi d'une
contraction concentrique explosive.

**Deux types de CER** :

| Type | Durée contact sol | Exemple | Qualité cible |
|---|---|---|---|
| CER long | > 250 ms | Squat jump, CMJ, broad jump | Puissance (force × vitesse) |
| CER court | < 250 ms | Drop jump, rebonds rapides, skip | Force réactive, raideur tendineuse |

**Progressions plyométriques** (à respecter pour un amateur) :

```
NIVEAU 1 — Atterrissage et absorption (2-3 semaines)
  Box step-off landing, squat jump avec atterrissage contrôlé

NIVEAU 2 — Sauts bilatéraux simples (3-4 semaines)
  Squat jump, CMJ, broad jump, box jump montée (pas de chute)

NIVEAU 3 — Sauts avec charge légère ou direction
  Jump squat (barre légère), lateral jump, hurdle hop

NIVEAU 4 — Drop jumps et réactivité
  Box drop jump, pogo jump, sprint bound

NIVEAU 5 — Plyométrie avancée + French Contrast
  Depth jump, bounding, sprint avec résistance + plyométrie
```

**Volume recommandé** (contacts/séance) :
- Débutant : 80-100 contacts
- Intermédiaire : 100-150 contacts
- Avancé : 150-200 contacts

**Source** : Markovic G. & Mikulic P. (2010). Neuro-musculoskeletal and performance
adaptations to lower-extremity plyometric training. *Sports Medicine*, 40(10),
859-895. / NSCA (Haff & Triplett, 2016) op. cit., chap. 19.

---

### 5.4 Dérivés d'Haltérophilie

Les mouvements d'haltérophilie (épaulé-jeté, arraché et leurs dérivés) sont
parmi les outils les plus efficaces pour développer la puissance totale du corps,
car ils imposent une triple extension explosive (cheville-genou-hanche) à très
haute vitesse sous charge.

**Dérivés recommandés pour rugby** (sans nécessiter une technique olympique
complète) :

| Exercice | Complexité | Qualité cible | Note |
|---|---|---|---|
| Hang Power Clean | ★★★☆☆ | Puissance totale, explosivité | Transfert direct au plaquage |
| Hang High Pull | ★★☆☆☆ | Puissance, accélération barre | Plus simple que le clean |
| Trap Bar Jump | ★☆☆☆☆ | Puissance membre inf. | Très accessible |
| Kettlebell Swing (lourd) | ★★☆☆☆ | Puissance hinge, gainage dynamique | Excellent pour rugby |
| Push Press | ★★☆☆☆ | Puissance push + transfert membres inf. | Bon pour avants |

**Pourquoi intégrer les dérivés olympiques** : Suchomel et al. (2018) démontrent
que les dérivés d'haltérophilie produisent des gains de puissance supérieurs aux
exercices de force traditionnels seuls, notamment grâce à la vitesse d'exécution
et au recrutement du vecteur vertical (triple extension).

**Source** : Suchomel T.J. et al. (2018). The benefits of muscular strength in
athletes. *Sports Medicine*, 48(3), 765-788. / Stone M.H. et al. (2007).
Weightlifting: a brief overview. *Strength and Conditioning Journal*, 29(5), 50-66.

---

## 6. Patterns Moteurs Fondamentaux pour le Rugby

### 6.1 Les 6 Patterns Prioritaires

Tout programme rugby efficace couvre les 6 patterns suivants. Leur ratio et
leur priorité varient selon le poste et la phase de saison.

```
1. HINGE (charnière hanche)
   Muscles : ischio-jambiers, fessiers, érecteurs
   Exercices : Romanian Deadlift, Deadlift, Hip Thrust, Kettlebell Swing
   Transfert : sprint (phase d'appui), plaquage bas, puissance de ruck

2. SQUAT (genou dominant)
   Muscles : quadriceps, fessiers, gainage
   Exercices : Back Squat, Front Squat, Goblet Squat, Split Squat, Bulgarian
   Transfert : mêlée, plaquage, démarrage

3. PUSH HORIZONTAL
   Muscles : pectoraux, deltoïde antérieur, triceps
   Exercices : Bench Press, Dumbbell Press, Push-up lest
   Transfert : mêlée (pilier), plaquage épaule, repoussage

4. PULL HORIZONTAL
   Muscles : grand dorsal, rhomboïdes, biceps
   Exercices : Barbell Row, Dumbbell Row, Seated Cable Row, Inverted Row
   Transfert : tirage (ruck, maul), équilibre scapulaire (prévention épaule)

5. CARRIES (portés)
   Muscles : gainage 360°, trapèzes, épaules, stabilisateurs de hanche
   Exercices : Farmer Carry, Rack Carry, Offset Carry, Suitcase Carry
   Transfert : rugby porté, résistance au contact, proprioception de tronc

6. ROTATION / ANTI-ROTATION
   Muscles : obliques, transverse, grand fessier
   Exercices : Pallof Press, Landmine Rotation, Med Ball Rotational Throw
   Transfert : plaquage rotatoire, changement de direction, protection lombaire
```

**Source** : McGill S.M. (2010). Core training: Evidence translating to better
performance and injury prevention. *Strength and Conditioning Journal*, 32(3), 33-46.
/ Boyle M. (2016). *New Functional Training for Sports* (2nd ed.). Human Kinetics.

---

### 6.2 Unilatéral vs Bilatéral

**Exercices bilatéraux** (les deux jambes simultanément) :
- Développent une base de force plus élevée (charges plus lourdes absolues)
- Plus efficaces pour l'hypertrophie et la force maximale (back squat, deadlift)
- À prioriser en off-season et pré-saison

**Exercices unilatéraux** (une jambe ou une main) :
- Éliminent l'asymétrie de force entre côtés (déficit unilatéral)
- Plus spécifiques aux gestes rugby (sprint, changement de direction = un pied
  en contact)
- Chargent moins la colonne vertébrale → intérêt en saison de compétition
- Exemples : Bulgarian Split Squat, Step Up, Single Leg RDL, Single Arm Row

**Recommandation** : ratio 60/40 bilatéral/unilatéral en off-season, 40/60
en saison de compétition.

**Source** : McCurdy K. et al. (2010). Comparison of lower extremity EMG between
the 2-leg squat and modified single-leg squat in female athletes. *Journal of
Sport Rehabilitation*, 19(1), 57-70.

---

## 7. Adaptations Neurales vs Structurelles

### 7.1 Timeline des Adaptations

```
SEMAINES 1-4 : Adaptations NEURALES dominantes
  - Recrutement d'unités motrices supplémentaires
  - Augmentation de la fréquence de décharge (rate coding)
  - Amélioration de la coordination inter-musculaire
  - Gains de force rapides (10-30%) sans changement de masse musculaire visible

SEMAINES 4-12 : Transition Neural → Structural
  - Début de l'hypertrophie (synthesis protéique > dégradation)
  - Les gains neuraux se tassent, l'hypertrophie prend le relais

SEMAINES 8-16+ : Adaptations STRUCTURELLES dominantes
  - Hypertrophie myofibrillaire (augmentation diamètre des myofibrilles)
  - Renforcement du tissu conjonctif (tendons : 8-12 semaines minimum)
  - Gains de force plus lents mais plus durables
```

**Implication pour le cycle de l'app** :
- Les gains rapides en W1-W2 sont essentiellement neuraux → ne pas sur-interpréter
  une "facilité" initiale comme une raison d'augmenter la charge drastiquement.
- Le tissu conjonctif s'adapte plus lentement que le muscle → un joueur peut
  sembler récupéré alors que ses tendons sont encore sous stress.

**Source** : Moritani T. & deVries H.A. (1979). Neural factors versus hypertrophy
in the time course of muscle strength gain. *American Journal of Physical
Medicine*, 58(3), 115-130. / Kraemer & Zatsiorsky (2006), chap. 3.

---

### 7.2 Décharge (Detraining) — Ce Qui Se Perd en Premier

En cas d'arrêt de l'entraînement de force :

| Adaptation | Délai de dégradation | Magnitude |
|---|---|---|
| Puissance / vitesse | 7–14 jours | Rapide (adaptations neurales fragiles) |
| Coordination technique | 14–28 jours | Modérée |
| Force maximale (muscle entraîné) | 21–35 jours | Modérée |
| Hypertrophie (masse musculaire) | 4–12 semaines | Lente |
| Adaptations tendineuses | > 12 semaines | Très lente |

**Implication** : la puissance est la première qualité à se dégrader à l'arrêt
(18-24 jours d'effet résiduel selon Issurin). En compétition, maintenir des
séances d'effort dynamique (même courtes) est prioritaire sur tout.

**Source** : Mujika I. & Padilla S. (2000). Muscular characteristics of detraining
in humans. *Medicine & Science in Sports & Exercise*, 33(8), 1297-1303.

---

## 8. Stratégies de Progression

### 8.1 Progression Linéaire (Novices)

Pour un joueur n'ayant jamais fait de S&C structuré ou pratiquant depuis < 1 an :

- Augmenter la charge de **2.5-5 kg** à chaque séance sur les mouvements
  principaux (tant que 3 RIR sont maintenus)
- C'est la stratégie la plus efficace à ce stade
- Durer 3-6 mois avant plateau

**Source** : Rippetoe M. & Baker A. (2013). *Practical Programming for Strength
Training* (3rd ed.). The Aasgaard Company, chap. 2.

---

### 8.2 Double Progression (Intermédiaires)

Pour un joueur avec 1-3 ans de pratique structurée :

```
1. Travailler dans une fourchette de répétitions (ex : 3×5–8)
2. Quand le haut de la fourchette est atteint avec RIR ≥ 2 → augmenter la charge
3. Revenir au bas de la fourchette avec la nouvelle charge
```

**Exemple** :
- Séance 1 : Back Squat 100kg × 3×5 (RIR 3) → trop facile
- Séance 2 : Back Squat 100kg × 3×7 (RIR 2) → proche du haut de fourchette
- Séance 3 : Back Squat 100kg × 3×8 (RIR 2) → fourchette atteinte → augmenter
- Séance 4 : Back Squat 102.5kg × 3×5 (RIR 3) → nouveau cycle

---

### 8.3 Chargement en Vague (Wave Loading)

Méthode de progression intra-séance exploitant la PAP et la potentiation
neurale. Chaque vague augmente la charge légèrement.

**Structure (3 vagues de 3 reps)** :
```
Vague 1 : 3 reps @ 85% → repos 3 min
Vague 2 : 3 reps @ 87.5% → repos 3 min
Vague 3 : 3 reps @ 90% → repos 3 min
```

La PAP de la vague précédente facilite le recrutement pour la vague suivante.
Méthode avancée, adaptée aux phases de pic (W3-W4).

**Source** : Haff G. et al. (2008). The effects of 8 weeks of creatine
monohydrate and glutamine supplementation on body composition and performance
measures. *Journal of Strength and Conditioning Research*, 19(3), 520-525. /
Turner A. (2011) op. cit.

---

## 9. Application au Joueur Amateur (2-3 Séances S&C/sem)

### 9.1 Structure de Séance Recommandée

```
ÉCHAUFFEMENT GÉNÉRAL         (5-10 min)
  Mobilité dynamique, activation glutes/core, marche athlétique

ÉCHAUFFEMENT SPÉCIFIQUE      (5-10 min)
  Montée progressive sur l'exercice principal (40%, 60%, 75%, 85%)

BLOC PRINCIPAL               (20-30 min)
  1-2 exercices, méthode selon phase (ME, DE, Complexe, FCM)
  Ex: Back Squat + Jump Squat (complex) — 4 séries

BLOC SECONDAIRE              (15-20 min)
  2-3 exercices complémentaires (pull, hinge, unilateral)
  Ex: Deadlift roumain, split squat, tirage horizontal

ACCESSOIRES / PRÉHAB         (10-15 min)
  Nordic Curl, Pallof Press, External Rotation, Carries

GAINAGE / CORE               (5-10 min)
  Anti-rotation, anti-extension, stabilisation dynamique
```

**Durée totale** : 60-80 min maximum pour un amateur. Au-delà, le cortisol
dépasse la testostérone et le rapport hormonal devient catabolique.

---

### 9.2 Distribution Idéale des Méthodes par Phase

| Phase app | Semaine | Méthodes à utiliser | Focus |
|---|---|---|---|
| FORCE W1 | Installation | RE + ME intro (85%) | Technique + adaptation |
| FORCE W2 | Montée | ME (85-88%) + DE | Force + RFD |
| FORCE W3 | Clé | ME (88-92%) + Contraste | Force max + intro PAP |
| FORCE W4 | Pic | ME (90-95%) + Contraste | Pic force neurale |
| DELOAD | — | RE léger + mobilité | Récupération active |
| POWER W5 | Installation | DE + Complex Training | Puissance intro |
| POWER W6 | Montée | DE + Complex + FCM intro | Puissance + vitesse |
| POWER W7 | Clé | FCM + DE | Spectre complet force-vitesse |
| POWER W8 | Pic | FCM + sprints + balistique | Puissance maximale |
| DELOAD | — | Activation + mobilité | Récupération, maintien neural |

---

## 10. Références Bibliographiques Complètes

1. **Aagaard P. et al.** (2002). Increased rate of force development and neural drive following resistance training. *Journal of Applied Physiology*, 93(4), 1318-1326.

2. **Baker D.** (2003). Acute effect of alternating heavy and light resistances on power output. *Journal of Strength and Conditioning Research*, 17(3), 493-497.

3. **Baker D. & Newton R.U.** (2005). Methods to assess and develop explosive power in rugby league players. *Strength and Conditioning Coach*, 13(1), 5-17.

4. **Boyle M.** (2016). *New Functional Training for Sports* (2nd ed.). Human Kinetics.

5. **Cometti G.** (2002). *La préparation physique en football*. Editions Chiron.

6. **Cormie P., McGuigan M.R. & Newton R.U.** (2011). Developing maximal neuromuscular power: Part 1 — Biological basis. *Sports Medicine*, 41(1), 17-38.

7. **Dello Iacono A., Martone D., Milic M. & Padulo J.** (2017). Vertical- vs. horizontal-oriented drop jump training. *Journal of Strength and Conditioning Research*, 31(8), 2245-2254.

8. **Dietz C. & Peterson B.** (2012). *Triphasic Training*. Cal Dietz.

9. **González-Badillo J.J. & Sánchez-Medina L.** (2010). Movement velocity as a measure of loading intensity. *International Journal of Sports Medicine*, 31(5), 347-352.

10. **Haff G.G. & Triplett N.T. (eds)** (2016). *NSCA's Essentials of Strength Training and Conditioning* (4th ed.). Human Kinetics.

11. **Hill A.V.** (1938). The heat of shortening and the dynamic constants of muscle. *Proceedings of the Royal Society B*, 126(843), 136-195.

12. **Israetel M., Hoffmann J. & Case C.** (2019). *Scientific Principles of Strength Training*. Renaissance Periodization.

13. **Kraemer W. & Zatsiorsky V.** (2006). *Science and Practice of Strength Training* (2nd ed.). Human Kinetics.

14. **Lum D. & Barbosa T.M.** (2019). Brief review: Effects of isometric strength training. *International Journal of Sports Medicine*, 40(6), 363-375.

15. **Markovic G. & Mikulic P.** (2010). Neuro-musculoskeletal adaptations to lower-extremity plyometric training. *Sports Medicine*, 40(10), 859-895.

16. **McCurdy K. et al.** (2010). Comparison of lower extremity EMG between 2-leg and single-leg squat. *Journal of Sport Rehabilitation*, 19(1), 57-70.

17. **McGill S.M.** (2010). Core training: Evidence translating to better performance and injury prevention. *Strength and Conditioning Journal*, 32(3), 33-46.

18. **Moritani T. & deVries H.A.** (1979). Neural factors versus hypertrophy in muscle strength gain. *American Journal of Physical Medicine*, 58(3), 115-130.

19. **Mujika I. & Padilla S.** (2000). Muscular characteristics of detraining in humans. *Medicine & Science in Sports & Exercise*, 33(8), 1297-1303.

20. **Rippetoe M. & Baker A.** (2013). *Practical Programming for Strength Training* (3rd ed.). The Aasgaard Company.

21. **Robbins D.W.** (2005). Postactivation potentiation and its practical applicability. *Journal of Strength and Conditioning Research*, 19(2), 453-458.

22. **Schoenfeld B.J.** (2010). The mechanisms of muscle hypertrophy. *Journal of Strength and Conditioning Research*, 24(10), 2857-2872.

23. **Schoenfeld B.J.** (2021). Resistance training to volitional failure. *Strength and Conditioning Journal*, 43(4), 6-10.

24. **Simmons L.** (2007). *Westside Barbell Book of Methods*. Westside Barbell.

25. **Stone M.H. et al.** (2007). Weightlifting: a brief overview. *Strength and Conditioning Journal*, 29(5), 50-66.

26. **Suchomel T.J., Nimphius S. & Stone M.H.** (2016). The importance of muscular strength in athletic performance. *Sports Medicine*, 46(10), 1419-1449.

27. **Suchomel T.J. et al.** (2018). The benefits of muscular strength in athletes. *Sports Medicine*, 48(3), 765-788.

28. **Tillin N.A. & Bishop D.** (2009). Factors modulating post-activation potentiation. *Sports Medicine*, 39(2), 147-166.

29. **Turner A.** (2011). The science and practice of periodization. *Strength and Conditioning Journal*, 33(1), 34-46.

30. **van der Horst N. et al.** (2015). The preventive effect of the nordic hamstring exercise. *American Journal of Sports Medicine*, 43(6), 1316-1323.

31. **Zatsiorsky V. & Kraemer W.** (2006). *Science and Practice of Strength Training* (2nd ed.). Human Kinetics.

32. **Zourdos M.C. et al.** (2016). Novel resistance training–specific RPE scale. *Journal of Strength and Conditioning Research*, 30(1), 267-275.

---

*Dernière mise à jour : 2026-02-24 | Version : 1.0.0*
*Domaines couverts : courbe force-vitesse, RFD, zones d'intensité, RPE/RIR/VBT, méthodes ME/DE/RE, PAP, complex training, French Contrast Method, plyométrie, excentrique, dérivés olympiques, patterns moteurs rugby, progressions, adaptations neurales/structurelles.*
*Fichiers complémentaires : `periodization.md`, `recovery.md`, `nutrition.md` (à venir), `injury-prevention.md` (à venir).*
