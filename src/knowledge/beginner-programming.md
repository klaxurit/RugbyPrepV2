# Programmation Débutant & Niveaux d'Entraînement — Base de Connaissance

> **Usage** : Synthèse scientifique pour guider la conception des programmes Starter (Niveau 1), Builder (Niveau 2) et Performance (Niveau 3). Injecté dans le system prompt IA pour personnalisation et explications.

---

## 1. Fondements de la Programmation Débutant

### 1.1 Principe de progression linéaire
Chez le débutant (<12 mois d'entraînement structuré), la progression est **session à session** (linéaire simple) grâce à une sensibilité élevée au stimulus d'entraînement.

**Mécanisme** : Le débutant adapte en 24-48h (récupération plus rapide qu'un intermédiaire). Chaque séance peut donc apporter un gain mesurable.

**Règle 1** : Ajouter 2-5% de charge ou 1-2 répétitions par session, pas besoin de programmation complexe.
**Règle 2** : La technique avant la charge. Un débutant ne doit jamais sacrifier la forme pour progresser plus vite.

**Source** : Rippetoe M. & Kilgore L. (2006). *Starting Strength*, 3rd ed. Aasgaard, pp. 45-58.

### 1.2 Volume minimal efficace pour le débutant
| Paramètre | Valeur | Source |
|---|---|---|
| Sets par groupe musculaire/semaine | 6-10 sets | Israetel et al. (2019) |
| Fréquence optimale | 2-3×/semaine par groupe | Schoenfeld et al. (2016) |
| Intensité | RPE 5-7 (ne jamais aller à l'échec en début) | Helms et al. (2016) |
| Progression cible | +2-5% charge par semaine | Rippetoe (2006) |

**Pourquoi ne pas aller à l'échec ?** Le débutant ne connaît pas encore ses limites. L'échec précoce crée du découragement et augmente le risque de mauvaise technique sous fatigue. La sensation "difficile mais contrôlé" suffit.

### 1.3 Supersets pour débutants — niveau d'évidence
Les supersets (paires d'exercices agoniste-antagoniste réalisées sans repos entre elles) présentent des avantages bien documentés :

- **Temps** : Réduction de 30-40% du temps de séance (Robbins et al., 2009)
- **Volume total** : Pas de réduction significative de la charge soulevée (même volume en moins de temps)
- **Récupération** : L'activation de l'antagoniste accélère la récupération de l'agoniste (Weakley et al., 2017)
- **Hypertrophie** : Effets similaires aux sets traditionnels sur l'hypertrophie (Weakley et al., 2020)

**Recommandation** : Les supersets sont appropriés dès le Niveau 2 (Builder), mais PAS au Niveau 1 (Starter) où l'apprentissage du mouvement doit être isolé.

**Sources** :
- Robbins D.W. et al. (2009). *JSCR*, 23(9), 2730-2737.
- Weakley J. et al. (2017). *EJAP*, 117(9), 1981-1987.
- Weakley J. et al. (2020). *JSCR*, 34(5), 1213-1222.

---

## 2. Les Trois Niveaux d'Entraînement (Architecture RugbyPrep)

### 2.1 Niveau 1 — Starter
**Profil** : Jamais fait de muscu, ou < 6 mois, ou retour après longue absence (>6 mois).
**Objectif** : Apprendre les patterns moteurs, construire une base de force, prévenir les blessures.

**Caractéristiques du programme** :
- 2×/semaine (Full body ou Upper/Lower simplifié)
- Exercices : Bodyweight → Bandes élastiques → Haltères légers
- Pas de barre (sauf si demandé explicitement)
- Progression linéaire session à session
- RER 4-5 (toujours confortable, focus technique)
- Temps de séance : 35-45 min

**Exercices clés Starter** (voir exercices.v1.json, tag "starter") :
- Push : Pompe sur genoux → Pompe standard → Pike push-up
- Pull : Rowing élastique → Traction inversée → Tirage vertical élastique
- Squat : Box squat BW → Goblet squat → Fente arrière
- Hinge : Bon matin BW → Glute bridge → RDL haltères
- Core : Planche sur genoux → Planche → Dead bug
- Carry : Farmer walk léger

**Structure de session type (Starter)** :
```
Activation (5 min) : Mobilité + gainage léger
A1. Squat ou Fente arrière — 3×10-12, RER 4
B1. Push pattern — 3×10-15, RER 4
C1. Pull pattern — 3×12-15, RER 4
D1. Hinge pattern — 3×12-15, RER 4
E1. Core — 2×30s planche
```

### 2.2 Niveau 2 — Builder
**Profil** : 6-24 mois d'entraînement, maîtrise des patterns de base, accès à une salle.
**Objectif** : Construire de la masse musculaire, apprendre les exercices barbell/machine, optimiser le temps.

**Caractéristiques du programme** :
- 2-3×/semaine (Upper/Lower classique ou PPL simplifié)
- Supersets agoniste-antagoniste (-30% temps séance)
- Introduction des exercices barre (squat goblet → front squat → back squat)
- Progression sur 4 semaines (H1-H4 light = H1-H2 + maintien)
- RER 2-3 (effort réel, approche de la vraie limite)
- Temps de séance : 50-65 min

**Supersets Builder recommandés** :
```
A. Développé barre + Rowing barre (push/pull horizontal)
B. Squat haltères + Hip thrust lestés (lower agoniste/antagoniste)
C. Développé incliné + Tirage vertical (push/pull vertical)
```

**Source format** : Robbins et al. (2009) — paires antagoniste permettent 30% de réduction du temps sans perte de volume.

### 2.3 Niveau 3 — Performance
**Profil** : >24 mois d'entraînement, maîtrise du barbell, joueur cherchant la performance maximale.
**Objectif** : Force maximale, puissance explosive, transfert direct sur le terrain.

**Caractéristiques du programme** :
- 2-3×/semaine (programme actuel de RugbyPrep)
- Blocs de contraste (Force + Puissance dans la même séance)
- Méthodes avancées : cluster sets, tempo excentrique, chains/bands si disponibles
- Périodisation par blocs (Hypertrophie H1-H4 → Force W1-W8 → Power → Deload)
- RER 0-2 (effort maximum, proche de l'échec)
- Temps de séance : 60-75 min

---

## 3. Progressions Bodyweight → Charge Externe

### 3.1 Courbes de progression par pattern

**PUSH HORIZONTAL** :
```
Pompe sur genoux (10-12 reps)
  → Pompe standard (10 reps)
  → Pompe lestée (sac dos 5-10kg)
  → Développé haltères
  → Développé barre
```

**PULL HORIZONTAL** :
```
Rowing élastique debout
  → Traction inversée genoux fléchis
  → Traction inversée pieds tendus
  → Rowing haltère unilatéral
  → Rowing barre
```

**PULL VERTICAL** :
```
Tirage vertical élastique
  → Traction négative (descente lente x5s)
  → Traction assistée élastique
  → Traction libre (chin-up prise supination)
  → Traction large (pull-up prise pronation)
```

**SQUAT** :
```
Box squat BW
  → Squat BW
  → Goblet squat haltère (6-20kg)
  → Front squat barre
  → Back squat barre
```

**HINGE** :
```
Bon matin BW
  → Glute bridge
  → Hip thrust BW (sur banc)
  → RDL haltères
  → RDL barre
  → Soulevé de terre barre
```

### 3.2 Tests de passage entre niveaux
| Critère | Starter → Builder | Builder → Performance |
|---|---|---|
| Pompe | 15 reps parfaites | 20+ reps ou lestées |
| Traction | 3 tractions libres | 8+ tractions libres |
| Squat | Goblet 20kg × 10 reps | Squat barre 1.0× poids corps |
| Hinge | RDL haltères 2×15kg × 12 reps | Soulevé de terre 1.5× poids corps |
| Core | Planche 45s | Planche 60s + variations |

---

## 4. Prévention des Blessures — Débutant Rugby

### 4.1 Blessures les plus fréquentes chez le débutant en salle (rugby)
1. **Épaule** (impingement, coiffe des rotateurs) — trop de push, pas assez de pull
2. **Bas du dos** (hernie, élongation) — technique de soulevé de terre insuffisante
3. **Genou** (syndrome patello-fémoral) — squat en valgus (genoux qui rentrent)
4. **Poignet** — manque de mobilité pour les exercices overhead

**Source** : Gabbett T.J. (2019). *Sports Medicine*, 49(Suppl 2), 89-98.

### 4.2 Rapport push/pull optimal
Le rapport push:pull doit tendre vers **1:1** (pas 2:1 habituel chez les débutants).
Pour chaque set de pompes/développé → 1 set de rowing/tirage.

**Implication programme Starter** : Chaque session doit inclure autant de sets de pull que de push.

### 4.3 Les 3 exercices de prévention indispensables pour le débutant rugby
1. **Band pull-apart** (écartement de bande) : renforce les rotateurs post de l'épaule, prévient l'impingement
2. **Dead bug** : apprend la stabilité lombaire sans charge, protège le bas du dos
3. **Single-leg glute bridge** : révèle et corrige les déséquilibres gauche/droite

Ces 3 exercices doivent être intégrés en activation dans CHAQUE séance Starter.

---

## 5. Sélection du Niveau en Onboarding

### 5.1 Questions de diagnostic
Pour placer le joueur dans le bon niveau, 2-3 questions suffisent :

**Q1** : "As-tu déjà fait de la musculation régulièrement ?"
- Jamais / rarement → Niveau 1 Starter
- Oui, moins de 2 ans → Niveau 2 Builder
- Oui, plus de 2 ans → Niveau 3 Performance

**Q2** (si réponse "oui" à Q1) : "Maîtrises-tu le squat barre et le soulevé de terre ?"
- Non → Niveau 2 Builder
- Oui → Niveau 3 Performance

**Q3** (optionnel) : "Quel équipement as-tu ?"
- Aucun ou seulement des élastiques → Starter (peu importe l'expérience)
- Haltères et banc → Builder possible
- Barre + rack → Performance possible

### 5.2 Transition entre niveaux
- Un joueur peut monter de niveau manuellement (dans ProfilePage)
- L'app peut suggérer une montée basée sur les logs : "Tu progresses vite ! Prêt pour le Niveau 2 ?"
- La descente de niveau est automatique en cas de blessure ou longue absence

### 5.3 Labels utilisateur (pas de jargon technique)
| Code interne | Label UI |
|---|---|
| `starter` | Débutant — Je découvre la muscu |
| `builder` | Intermédiaire — Je veux progresser efficacement |
| `performance` | Avancé — Je cherche la performance max |

---

## 6. Références Clés

- Bompa T. & Haff G. (2009). *Periodization (5th ed.)*. Human Kinetics.
- Helms E.R. et al. (2016). RPE/RIR system. *JSCR*, 30(3), 841-856.
- Israetel M. et al. (2019). *Scientific Principles of Strength Training*. Renaissance Periodization.
- Rhea M. et al. (2002). DUP superiority. *JSCR*, 16(2), 250-255.
- Rippetoe M. & Kilgore L. (2006). *Starting Strength*. Aasgaard.
- Robbins D.W. et al. (2009). Superset time efficiency. *JSCR*, 23(9), 2730-2737.
- Schoenfeld B.J. et al. (2016). Frequency training. *JSCR*, 30(7), 1937-1944.
- Weakley J. et al. (2020). Superset hypertrophy. *JSCR*, 34(5), 1213-1222.
- Zourdos M.C. et al. (2016). Novel RIR-based scale. *JSCR*, 30(1), 267-275.
