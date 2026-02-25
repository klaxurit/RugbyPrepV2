# Périodisation de l'Entraînement — Base de Connaissance Rugby

> **Usage** : ce fichier est la source de vérité scientifique sur la périodisation
> pour l'application RugbyPrep. Il est conçu pour être injecté comme contexte dans
> les appels à l'API Claude lors de la génération de programmes, recommandations et
> explications destinées à l'utilisateur. Le contenu est volontairement dense et
> sourcé. La vulgarisation vers l'utilisateur final est gérée au niveau du prompt.

---

## 1. Fondements Biologiques

### 1.1 Syndrome Général d'Adaptation (Selye, 1936)

Le SGA est le substrat biologique de toute périodisation. Selye a démontré que
l'organisme répond à tout stresseur externe (mécanique, métabolique, thermique)
selon une séquence invariable en trois phases :

1. **Phase d'alarme** : réaction de choc (chute de performance transitoire,
   inflammation locale, perturbation homéostasique). Durée : 12-48h selon
   l'intensité du stimulus.
2. **Phase de résistance** : mobilisation des ressources adaptatives. L'organisme
   reconstruit au-delà du niveau antérieur (surcompensation). Durée : 48-96h.
3. **Phase d'épuisement** : si le stress est trop fréquent, trop intense ou trop
   prolongé sans récupération, les mécanismes adaptatifs sont dépassés
   (surentraînement).

**Implication directe** : la progression en force ou en puissance n'est pas générée
*pendant* l'effort, mais *pendant* la récupération. Le timing de la prochaine
charge est aussi déterminant que la charge elle-même.

**Source** : Selye H. (1936). A syndrome produced by diverse nocuous agents.
*Nature*, 138, 32. / Bompa T. & Haff G. (2009). *Periodization: Theory and
Methodology of Training* (5th ed.). Human Kinetics, p. 14-19.

---

### 1.2 Surcompensation : Fenêtres par Qualité

La surcompensation ne suit pas le même calendrier selon la qualité physique
développée. Ces fenêtres conditionnent l'espacement optimal des stimuli :

| Qualité physique | Fenêtre de surcompensation | Base physiologique |
|---|---|---|
| Puissance / Explosivité | 48–72h | Adaptation neurale rapide (potentiation post-activation) |
| Force maximale | 72–96h | Remodelage myofibrillaire |
| Hypertrophie structurelle | 72–120h | Synthèse protéique (peak à 24-48h, plateau 72h) |
| Capacité aérobie (VO2max) | 24–48h | Biogenèse mitochondriale rapide |
| Endurance musculaire locale | 48–72h | Adaptation enzymatique |

**Implication pour le joueur amateur (2 séances S&C/sem)** : avec 72-96h entre
deux séances de force, on se place systématiquement dans la fenêtre de
surcompensation de la force maximale. C'est physiologiquement optimal.

**Source** : Bompa & Haff (2009), p. 22-27 ; Kraemer W. & Zatsiorsky V. (2006).
*Science and Practice of Strength Training* (2nd ed.). Human Kinetics.

---

### 1.3 Effet Résiduel d'Entraînement (Issurin, 2008)

L'effet résiduel est la durée pendant laquelle les adaptations induites par un bloc
d'entraînement persistent *après l'arrêt de ce bloc*. Ce concept est fondateur de
la périodisation par blocs.

| Qualité | Durée de l'effet résiduel |
|---|---|
| Endurance aérobie | 25–35 jours |
| Force maximale | 25–35 jours |
| Puissance-vitesse explosive | 18–24 jours |
| Qualités anaérobies lactiques | 18–24 jours |
| Vitesse maximale | 5–10 jours |

**Application directe au cycle FORCE → POWER de l'app** :
- Un bloc FORCE de 4 semaines maintient ses effets ~30 jours après son arrêt.
- En démarrant le bloc POWER dans cette fenêtre, on capitalise sur la force
  maximale acquise pour développer la puissance (relation force-vitesse, Hill 1938).
- L'ordre inverse (POWER → FORCE) serait contre-productif : la puissance se dégrade
  plus vite (18-24j) et n'a pas de base de force pour s'exprimer.

**Source** : Issurin V.B. (2008). Block periodization versus traditional training
theory: a review. *Journal of Sports Medicine and Physical Fitness*, 48(1), 65-75.
/ Issurin V.B. (2010). New horizons for the methodology and physiology of training
periodization. *Sports Medicine*, 40(3), 189-206.

---

## 2. Modèles de Périodisation

### 2.1 Périodisation Linéaire Classique (Matveyev / Bompa)

**Principe** : augmentation progressive et monotone de l'intensité avec diminution
corrélative du volume au fil du macrocycle (saison complète).

```
Volume  ████████░░░░░░░░░░░░░░
Intensité ░░░░░░░░████████████
         |—Prép Gén—|—Prép Spéc—|—Compét—|—Transition—|
```

**Avantages** :
- Simple à planifier et à comprendre
- Idéale pour 1 pic de forme par an (sports individuels, saison courte)
- Validée pour athlètes débutants à intermédiaires (progression linéaire efficace)

**Limites pour le rugby amateur** :
- Incompatible avec une longue saison de compétition (sept → mai = 8 mois)
- Un seul pic de forme ne suffit pas pour couvrir les phases finales (mai)
- Ignore la fatigue accumulée du calendrier de matchs

**Source** : Matveyev L. (1977). *Grundlagen des sportlichen Trainings*. Berlin:
Sportverlag. / Bompa & Haff (2009), p. 181-215.

---

### 2.2 Périodisation Ondulante (DUP — Daily Undulating Periodization)

**Principe** : le volume et l'intensité varient à une fréquence élevée (séance à
séance, ou semaine à semaine), permettant le développement simultané de plusieurs
qualités.

**Exemple DUP pour 3 séances/sem** :
```
Séance A : Force max    (4×4-5 @ 85-90% 1RM, RIR 2-3)
Séance B : Puissance    (5×3 @ 70-75% 1RM, vitesse maximale + plyo)
Séance C : Endurance    (3×10-12 @ 60-65% 1RM, récup 60s)
```

**Supériorité démontrée vs linéaire pour intermédiaires** : Rhea et al. (2002) ont
montré que la DUP produit des gains de force significativement supérieurs à la
périodisation linéaire sur 12 semaines chez des athlètes intermédiaires (Cohen's
d = 0.48 en faveur DUP pour le 1RM squat).

**Pour le rugby amateur** : la DUP est particulièrement adaptée à la période de
compétition (novembre → avril) où maintenir force ET puissance simultanément est
nécessaire, avec un volume total réduit pour compenser la charge de matchs.

**Source** : Rhea M.R., Ball S.D., Phillips W.T. & Burkett L.N. (2002). A
comparison of linear and daily undulating periodized programs with equated volume
and intensity for strength. *Journal of Strength and Conditioning Research*,
16(2), 250-255.

---

### 2.3 Périodisation par Blocs (Verkhoshansky → Issurin)

**Principe** : concentration des charges sur 1-2 qualités cibles par bloc
(mésocycle de 3-6 semaines), dans un ordre logique et séquentiel tirant parti des
effets résiduels.

**Séquence canonique (Issurin, 2008)** :
```
BLOC 1 — ACCUMULATION      BLOC 2 — TRANSMUTATION      BLOC 3 — RÉALISATION
Volume élevé                Volume modéré                Volume faible
Intensité modérée           Intensité élevée             Intensité maximale
Force de base               Puissance spécifique         Affûtage / compétition
```

**Pourquoi c'est le modèle le plus adapté au rugby de haut niveau** :
- Respecte et exploite les effets résiduels (capitalisation inter-blocs)
- Permet plusieurs pics de forme par saison (crucial en rugby, avec phases
  qualificatives + finales)
- Adapté aux athlètes qui cumulent entraînement rugby ET S&C (charge distribuée)

**Durée optimale par bloc** :
- 3 semaines : athlètes avancés ou en période compétitive (fatigue élevée)
- 4 semaines : athlètes amateurs à intermédiaires (standard recommandé)
- 5-6 semaines : athlètes débutants ou blocs d'accumulation off-season

**Source** : Issurin (2008, 2010) ; Verkhoshansky Y. & Siff M. (2009).
*Supertraining* (6th ed.). Verkhoshansky SSTM, chap. 6.

---

### 2.4 Méthode Conjuguée (Westside / Simmons)

**Principe** : développement simultané de toutes les qualités (force max, force
vitesse, force endurance) au sein de chaque semaine, par rotation des exercices
maximaux et des exercices dynamiques.

**Pertinence pour le rugby amateur** : limitée. La méthode conjuguée requiert un
volume d'entraînement élevé (4-5 séances S&C/sem) et une bonne maîtrise technique.
Non recommandée pour un joueur à 2-3 séances S&C/sem.

**Mention ici** pour exhaustivité scientifique. Non implémentée dans l'app.

**Source** : Simmons L. (2007). *Westside Barbell Book of Methods*. Westside
Barbell.

---

## 3. Exigences Physiques du Rugby à XV

### 3.1 Données de Match (GPS / Analyse de Performance)

Les données suivantes sont issues d'études sur joueurs professionnels et
semi-professionnels. Elles servent de référentiel pour calibrer les objectifs
physiques de l'app (à pondérer à la baisse pour le niveau amateur).

| Indicateur | Avants (1-8) | Arrières (9-15) | Source |
|---|---|---|---|
| Distance totale / match | 4 500–6 500 m | 6 000–8 000 m | Duthie et al. (2003) |
| Distance haute intensité (>15 km/h) | 600–900 m | 900–1 400 m | Roberts et al. (2008) |
| Sprints max | 15–30 | 25–50 | Quarrie et al. (2013) |
| Contacts / plaquages | 20–45 | 8–20 | Duthie et al. (2003) |
| Fréquence cardiaque moy. match | 80–85% FCmax | 82–88% FCmax | Nicholas et al. (1992) |
| Durée efforts intenses | 3–5s | 3–7s | Duthie et al. (2005) |
| Récupération inter-efforts | 20–40s passif | 15–30s | Duthie et al. (2005) |

**Implication** : le rugby à XV est un sport **intermittent de puissance** avec une
base aérobie significative. Le système énergétique dominant par effort est
alactique (ATP-PC, 0-6s), mais la capacité aérobie conditionne la **récupération
inter-efforts** et la **performance en fin de match**.

**Sources** : Duthie G., Pyne D. & Hooper S. (2003). The reliability of game
statistics for evaluating team performance in professional rugby union. *Journal of
Sports Sciences*, 21(9), 749-759. / Roberts S.P. et al. (2008). The physical
demands of elite English rugby union. *Journal of Sports Sciences*, 26(8), 825-833.
/ Quarrie K.L. et al. (2013). Developing a rugby union injury surveillance and
prevention strategy. *British Journal of Sports Medicine*, 47(8), 516-520.

---

### 3.2 Qualités Physiques Prioritaires par Poste

```
PILIERS / TALONNEURS (1-3)
  Force maximale ★★★★★  Puissance ★★★★☆  Vitesse ★★☆☆☆  VO2max ★★★☆☆
  Priorité : force de poussée, maintien du gainage sous charge, force isométrique
  Exercices clés : squat, deadlift, hinge, push/pull horizontal, farmer carries

DEUXIÈME LIGNE (4-5)
  Force maximale ★★★★★  Puissance ★★★★☆  Vitesse ★★★☆☆  VO2max ★★★★☆
  Priorité : force push (mêlée), puissance de saut, capacité de travail sur 80 min
  Exercices clés : squat, press, jump squats, carries lourds, hip thrust

FLANKERS / N°8 (6-7-8)
  Force maximale ★★★★☆  Puissance ★★★★★  Vitesse ★★★★☆  VO2max ★★★★★
  Priorité : explosivité au contact, vitesse de travail au sol, répétition d'efforts
  Exercices clés : deadlift, box jumps, med ball, sled push/pull, HIIT aérobie

DEMIS (9-10)
  Force maximale ★★★☆☆  Puissance ★★★★☆  Vitesse ★★★★★  VO2max ★★★★★
  Priorité : accélération, prise de décision sous pression, résilience au contact
  Exercices clés : unilateral, sprint mechanics, rotational power, plyometrie

TROIS-QUARTS (11-12-13-14)
  Force maximale ★★★☆☆  Puissance ★★★★★  Vitesse ★★★★★  VO2max ★★★★★
  Priorité : vitesse maximale, accélération, contact dynamique, endurance lactique
  Exercices clés : squat unilateral, Nordic curl, sled, sprint training, plyo

ARRIÈRE (15)
  Force maximale ★★★☆☆  Puissance ★★★★☆  Vitesse ★★★★★  VO2max ★★★★★
  Priorité : détente, lecture de jeu, sprint sur distance, gestion d'impact
  Exercices clés : jump, sprint, hip thrust, core rotatif, endurance aérobie
```

**Source** : Nash C. et al. (2017). Strength and conditioning for rugby union
players: A review. *Strength and Conditioning Journal*, 39(1), 31-45. / Baker D. &
Nance S. (1999). The relation between running speed and measures of strength and
power in professional rugby league players. *Journal of Strength and Conditioning
Research*, 13(3), 230-235.

---

## 4. Structure de Saison — Modèle Annuel Recommandé (Saison Française)

### 4.1 Calendrier FFR / Fédérale Standard

```
JUIN — JUILLET        : Coupure + récupération active (4-8 semaines)
AOÛT                  : Reprise pré-saison (4-6 semaines)
SEPTEMBRE — OCTOBRE   : Début compétition, phase de poule
NOVEMBRE — FÉVRIER    : Compétition continue (hiver, matchs toutes les semaines)
MARS — AVRIL          : Sprint final de saison, phases qualificatives
MAI                   : Phases finales / championnat
```

### 4.2 Planification S&C Annuelle Recommandée

| Période | Phase S&C | Volume | Intensité | Fréquence S&C |
|---|---|---|---|---|
| Off-season (juin-juil.) | Hypertrophie + base aérobie | Élevé | Modéré | 3x/sem |
| Pré-saison (août) | FORCE → début POWER | Élevé→modéré | Progressif | 3x/sem |
| Début saison (sept-oct.) | POWER + maintien Force | Modéré | Élevé | 2-3x/sem |
| Milieu saison (nov-fév.) | Maintien DUP | Réduit (−30-50%) | Élevé | 2x/sem |
| Fin saison (mars-avril) | Puissance + affûtage partiel | Faible | Très élevé | 2x/sem |
| Phases finales (mai) | Tapering + activation | Très faible | Maximal | 1-2x/sem |

**Point critique** : en période de compétition, le volume S&C doit impérativement
être réduit pour intégrer la charge de match dans la charge totale hebdomadaire.
Ne pas le faire est le principal facteur de surentraînement chez le joueur amateur.

**Source** : Cross M.J. et al. (2016). The influence of in-season training loads on
injury risk in professional rugby union. *International Journal of Sports Physiology
and Performance*, 11(3), 350-355. / Gabbett T.J. (2016). The training-injury
prevention paradox. *British Journal of Sports Medicine*, 50(5), 273-280.

---

### 4.3 La Semaine Type en Compétition (Amateur, 2 S&C/sem)

```
LUNDI     Récupération active (mobilité, marche, natation légère)
MARDI     S&C — Séance principale (force / puissance selon phase)
MERCREDI  Entraînement rugby (collectif)
JEUDI     S&C — Séance secondaire (volume réduit ~60% du mardi)
VENDREDI  Activation pré-match (15-20 min : mobilité, vitesse courte, CNS wake-up)
SAMEDI    MATCH
DIMANCHE  Récupération complète
```

**Règle d'or** : ne jamais faire de séance S&C lourde dans les 48h précédant un
match. L'activation pré-match (vendredi) doit rester sub-maximale (≤ 6/10
intensité perçue).

**Source** : Turner A. & Stewart P. (2014). Strength and conditioning for soccer
players (applicable rugby). *Strength and Conditioning Journal*, 36(4), 1-13. /
Nashner L. et al. (2017) op. cit.

---

## 5. Le Déload — Protocoles et Evidence

### 5.1 Définition et justification physiologique

Un déload est une semaine de réduction intentionnelle de la charge d'entraînement,
visant à permettre la dissipation de la fatigue accumulée tout en maintenant les
adaptations acquises. Il exploite le modèle fatigue-forme de Banister (1991) :

```
FORME NETTE = Forme Acquise − Fatigue
```

En réduisant la fatigue (déload) sans supprimer les stimuli entièrement, la forme
nette augmente et la performance est accessible.

**Source** : Banister E.W. (1991). Modeling elite athletic performance. In:
MacDougall J.D., Wenger H.A. & Green H.J. (eds). *Physiological Testing of the
High-Performance Athlete*. Human Kinetics, p. 403-424.

### 5.2 Protocoles de Déload Validés

**Réduction de volume (recommandé)** :
- Volume réduit de 30-50% (sets × reps)
- Intensité maintenue (~80-90% des charges de la semaine précédente)
- Même structure de séance, même fréquence
- Justification : l'intensité maintient les adaptations neurales, la réduction de
  volume dissipe la fatigue musculaire et conjonctive

**Réduction d'intensité** :
- Volume maintenu
- Intensité réduite de 20-30%
- Moins efficace pour maintenir les qualités neurales, mais utile en cas de douleur
  articulaire ou blessure légère

**Réduction combinée (fréquence + volume)** :
- Fréquence réduite (1 séance vs 2-3)
- Volume et intensité modérément réduits
- Recommandé pour athlètes très fatigués ou en pré-compétition importante

**Fréquence des déloads — Evidence** :
- Ratio 3:1 (3 semaines de charge, 1 de déload) : recommandé pour athlètes en
  compétition fréquente, volume S&C élevé, ou joueurs présentant des signes de
  fatigue chronique
- Ratio 4:1 (4 semaines de charge, 1 de déload) : standard pour athlètes amateurs
  hors compétition ou en off-season avec volume contrôlé
- Le ratio 4:1 utilisé dans l'app est scientifiquement valide pour le contexte
  off-season/pré-saison

**Source** : Pritchard H. et al. (2015). Effects and mechanisms of tapering in
maximizing muscular strength. *Strength and Conditioning Journal*, 37(2), 72-83. /
Bosquet L. et al. (2007). Effects of tapering on performance: a meta-analysis.
*Medicine & Science in Sports & Exercise*, 39(8), 1358-1365.

---

## 6. Tapering — Optimisation du Pic de Forme

### 6.1 Définition

Le tapering est une réduction progressive et planifiée de la charge d'entraînement
avant une compétition majeure, visant à maximiser la performance le jour J. Il
se distingue du déload par son objectif : non pas récupérer, mais **actualiser la
performance**.

### 6.2 Protocoles Validés (Mujika & Padilla, 2000)

**Type** : Exponentiel progressif (progressive taper) > linéaire > palier

**Durée optimale** : 8–14 jours (minimum 1 semaine, maximum 3 semaines)

**Réductions recommandées** :
| Variable | Réduction | Maintien |
|---|---|---|
| Volume (sets × reps × distance) | 40–60% | — |
| Intensité (% 1RM, vitesse) | — | Maintenu voire augmenté |
| Fréquence | −20% maximum | Proche de l'habituel |

**Mécanismes** :
- Augmentation de la force et puissance musculaire (+2-8% en 2 semaines)
- Amélioration du profil hormonal (rapport testostérone/cortisol)
- Récupération des dommages musculaires et glycogéniques
- Optimisation de la conduction nerveuse et du recrutement moteur

**Pour l'app** : implémenter un mode "Préparation Phases Finales" (2 semaines)
avant les playoffs importants. C'est une fonctionnalité à fort impact sur la
confiance des utilisateurs.

**Source** : Mujika I. & Padilla S. (2000). Detraining: loss of training-induced
physiological and performance adaptations. Part II: long term insufficient training
stimulus. *Sports Medicine*, 30(3), 145-154. / Mujika I. & Padilla S. (2003).
Scientific bases for precompetition tapering strategies. *Medicine & Science in
Sports & Exercise*, 35(7), 1182-1187.

---

## 7. Analyse et Critique du Cycle Actuel de l'App

### 7.1 Structure Actuelle

```
CYCLE 8 SEMAINES :
  FORCE  : W1 (Installation) → W2 (Montée prog.) → W3 (Semaine clé) → W4 (Pic) → DELOAD
  POWER  : W5 → W6 → W7 → W8 → DELOAD
```

### 7.2 Ce que la Science Valide ✅

| Élément | Justification |
|---|---|
| Ordre FORCE → POWER | Fondé sur la courbe Force-Vitesse (Hill, 1938) et l'effet résiduel d'Issurin (2008). La force est le substrat de la puissance. |
| Blocs de 4 semaines | Conforme à la durée optimale d'Issurin pour athlètes intermédiaires. Assure l'adaptation structurelle ET neurale complète. |
| Déload systématique (4:1) | Validé par Pritchard et al. (2015). Ratio 4:1 adapté au profil amateur hors compétition. |
| Progression intra-bloc W1→W4 | Conforme au principe de surcharge progressive (progressive overload). |
| Cues RER / reps en réserve | Aligné avec la littérature sur l'autorégulation (RPE/RIR) : Zourdos et al. (2016). |

### 7.3 Ce que la Science Suggère d'Améliorer (V2) ⚠️

**A. Phase manquante : Hypertrophie (off-season)**
- Pour un joueur amateur revenant de coupure (juin-juillet), démarrer directement
  en FORCE est sub-optimal. Les tissus conjonctifs (tendons, ligaments) ont besoin
  de 4-6 semaines de volume modéré pour tolérer les charges lourdes.
- Recommandation : ajouter un bloc HYPERTROPHY (4 sem, 6-12 reps, 65-75% 1RM)
  avant FORCE en début d'off-season.
- Source : Kraemer & Zatsiorsky (2006), p. 89-112.

**B. Mode In-Season manquant**
- Le cycle 8 semaines couvre ~10 semaines (avec déloads). La saison compétitive
  dure 32-36 semaines (sept → mai). Il n'existe pas actuellement de mode adapté
  à la période de compétition prolongée.
- Recommandation : implémenter un mode "Maintien Compétition" (DUP, 2 séances,
  volume −35-40%, intensité maintenue) activé pendant la saison régulière.
- Source : Cross et al. (2016) ; Gabbett (2016).

**C. Ratio déload en compétition (3:1 au lieu de 4:1)**
- En période de matchs hebdomadaires, la fatigue s'accumule plus vite (charge
  rugby + charge S&C + charge psychologique). Un ratio 3:1 est plus adapté.
- Recommandation : proposer à l'utilisateur de choisir 3:1 ou 4:1 selon s'il est
  en saison ou hors saison.
- Source : Pritchard et al. (2015).

**D. Tapering avant phases finales**
- Fonctionnalité absente. Pourtant, c'est souvent la période où les joueurs
  amateurs s'entraînent le plus fort par excès de motivation.
- Recommandation : mode "Affûtage Playoffs" (2 semaines, volume −50%, intensité
  maintenue) déclenchable depuis l'app.
- Source : Mujika & Padilla (2003).

**E. Individualisation du déload**
- Le déload systématique (toutes les 4 semaines) est une bonne valeur par défaut
  mais ignore le feedback de l'utilisateur. Un déload déclenché par 2 séances de
  fatigue consécutives (déjà partiellement implémenté dans l'app) est plus fin.
- Recommandation : maintenir le déload contextuel + ajouter des signaux HRV ou
  charge subjective pour affiner.
- Source : Buchheit M. (2014). Monitoring training status with HR measures. *Frontiers in Physiology*, 5, 1-28.

---

## 8. Références Bibliographiques Complètes

1. **Banister E.W.** (1991). Modeling elite athletic performance. In MacDougall et al. (eds), *Physiological Testing of the High-Performance Athlete*. Human Kinetics, 403-424.

2. **Baker D. & Nance S.** (1999). The relation between running speed and measures of strength and power in professional rugby league players. *Journal of Strength and Conditioning Research*, 13(3), 230-235.

3. **Baker D.** (2001). Comparison of upper-body strength and power between professional and college-aged rugby league players. *Journal of Strength and Conditioning Research*, 15(1), 30-35.

4. **Bompa T. & Haff G.** (2009). *Periodization: Theory and Methodology of Training* (5th ed.). Human Kinetics.

5. **Bosquet L., Montpetit J., Arvisais D. & Mujika I.** (2007). Effects of tapering on performance: a meta-analysis. *Medicine & Science in Sports & Exercise*, 39(8), 1358-1365.

6. **Buchheit M.** (2014). Monitoring training status with HR measures: do all roads lead to Rome? *Frontiers in Physiology*, 5, 73.

7. **Cross M.J. et al.** (2016). The influence of in-season training loads on injury risk in professional rugby union. *International Journal of Sports Physiology and Performance*, 11(3), 350-355.

8. **Duthie G., Pyne D. & Hooper S.** (2003). The reliability of game statistics for evaluating team performance in professional rugby union. *Journal of Sports Sciences*, 21(9), 749-759.

9. **Duthie G., Pyne D. & Hooper S.** (2005). Time motion analysis of 2001 and 2002 Super 12 rugby. *Journal of Sports Sciences*, 23(5), 523-530.

10. **Gabbett T.J.** (2016). The training-injury prevention paradox: should athletes be training smarter and harder? *British Journal of Sports Medicine*, 50(5), 273-280.

11. **Issurin V.B.** (2008). Block periodization versus traditional training theory: a review. *Journal of Sports Medicine and Physical Fitness*, 48(1), 65-75.

12. **Issurin V.B.** (2010). New horizons for the methodology and physiology of training periodization. *Sports Medicine*, 40(3), 189-206.

13. **Kraemer W. & Zatsiorsky V.** (2006). *Science and Practice of Strength Training* (2nd ed.). Human Kinetics.

14. **Matveyev L.** (1977). *Grundlagen des sportlichen Trainings*. Berlin: Sportverlag.

15. **Mujika I. & Padilla S.** (2000). Detraining: loss of training-induced physiological and performance adaptations. Part I & II. *Sports Medicine*, 30(2 & 3), 79-87 / 145-154.

16. **Mujika I. & Padilla S.** (2003). Scientific bases for precompetition tapering strategies. *Medicine & Science in Sports & Exercise*, 35(7), 1182-1187.

17. **Nash C. et al.** (2017). Strength and conditioning for rugby union players: A review. *Strength and Conditioning Journal*, 39(1), 31-45.

18. **Pritchard H. et al.** (2015). Effects and mechanisms of tapering in maximizing muscular strength. *Strength and Conditioning Journal*, 37(2), 72-83.

19. **Quarrie K.L. et al.** (2013). Developing a rugby union injury surveillance and prevention strategy. *British Journal of Sports Medicine*, 47(8), 516-520.

20. **Rhea M.R., Ball S.D., Phillips W.T. & Burkett L.N.** (2002). A comparison of linear and daily undulating periodized programs with equated volume and intensity for strength. *Journal of Strength and Conditioning Research*, 16(2), 250-255.

21. **Roberts S.P. et al.** (2008). The physical demands of elite English rugby union. *Journal of Sports Sciences*, 26(8), 825-833.

22. **Selye H.** (1936). A syndrome produced by diverse nocuous agents. *Nature*, 138, 32.

23. **Verkhoshansky Y. & Siff M.** (2009). *Supertraining* (6th ed.). Verkhoshansky SSTM.

24. **Zourdos M.C. et al.** (2016). Novel resistance training-specific RPE scale measuring repetitions in reserve. *Journal of Strength and Conditioning Research*, 30(1), 267-275.

---

*Dernière mise à jour : 2026-02-24 | Version : 1.0.0*
*Domaines couverts : périodisation théorique, modèles d'entraînement, exigences rugby à XV, saison française, analyse cycle app.*
*Fichiers complémentaires : voir `recovery.md`, `strength-methods.md`, `nutrition.md`, `injury-prevention.md` (à venir).*
