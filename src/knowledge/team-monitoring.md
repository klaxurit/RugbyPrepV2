# Team Monitoring & Coach Mode — Rugby Union

> Base de connaissances pour #28 : ACWR collectif, matrice risque joueurs, détection cluster de surcharge, logique push séances, rotation, benchmarks pro/amateur.
> Références : Hulin et al. 2016, Gabbett 2016, Malone et al. 2017, Rogalski et al. 2013, Schwellnus et al. 2016, Cross et al. 2016, Windt & Gabbett 2017, Colby et al. 2014.

---

## 1. ACWR Collectif — Principes et Calcul

### 1.1 Rappel ACWR individuel

```
ACWR = Charge aiguë (7 jours glissants) / Charge chronique (28 jours glissants)
```

**Zones individuelles :**
- < 0.8 : sous-chargement (risque blessure par déconditionnement)
- 0.8–1.3 : zone optimale (risque minimal)
- 1.3–1.5 : zone vigilance
- > 1.5 : zone danger (risque blessure ×2.12 vs zone optimale — Hulin et al. 2016)

### 1.2 Agrégation à l'échelle de l'équipe

**Calcul ACWR équipe :**
```
ACWR_équipe = médiane des ACWR individuels (N joueurs disponibles)
```

**Pourquoi la médiane et non la moyenne ?**
- Résistante aux valeurs extrêmes (un joueur ACWR = 3.0 n'explose pas la moyenne)
- Plus représentative de l'état général du groupe
- Recommandé : calculer aussi le **percentile 75** (Q3) → alerte si Q3 > 1.5

**Formule alternative pondérée par temps de jeu :**
```
ACWR_pondéré = Σ(ACWR_i × minutes_jouées_i) / Σ(minutes_jouées_i)
```
→ Pondère l'impact des joueurs les plus sollicités (titulaires réguliers)

### 1.3 Benchmarks ACWR équipe — Rugby Union

**Équipes professionnelles (Top 14 / Premiership, Gabbett 2016) :**

| Phase | ACWR médian équipe | ACWR Q3 | Taux blessure / 1000h |
|---|---|---|---|
| Pré-saison (août–septembre) | 1.15–1.35 | 1.50–1.65 | 12–18 |
| Début saison (oct–nov) | 1.00–1.20 | 1.30–1.45 | 8–12 |
| Mi-saison (déc–fév) | 0.90–1.10 | 1.20–1.35 | 5–8 |
| Fin de saison (mars–mai) | 0.85–1.05 | 1.15–1.30 | 6–10 |
| Double match weeks | 1.20–1.50 | 1.60–1.80 | 15–25 |

**Équipes amateurs (Régionale / Fédérale) :**
- Variabilité plus haute (organisation moins contrôlée)
- ACWR médian cible : 0.85–1.15 en saison
- Q3 cible : < 1.40

### 1.4 Alertes collectives — Détection de cluster

**Cluster de surcharge :** ≥ 3 joueurs du même groupe musculaire / poste avec ACWR > 1.5 la même semaine

**Seuils d'alerte collective :**

| Indicateur | Seuil jaune | Seuil rouge |
|---|---|---|
| % joueurs ACWR > 1.3 | ≥ 30% | ≥ 50% |
| % joueurs ACWR > 1.5 | ≥ 20% | ≥ 35% |
| ACWR médian équipe | > 1.25 | > 1.50 |
| ACWR Q3 équipe | > 1.45 | > 1.65 |
| Nb joueurs Hooper > 18 | ≥ 3 | ≥ 5 |

**Signification cluster :**
- Cluster avants (1–8) surmenés → revoir densité mêlées/plaquages à l'entraînement
- Cluster arrières surmenés → revoir intensité courses et sprints collectifs
- Cluster global → semaine de récupération impérative toute l'équipe

---

## 2. Matrice de Risque Individuel (Joueur)

### 2.1 Définition de la matrice

La matrice combine deux axes indépendants :
- **Axe X — Charge externe** : ACWR de la semaine
- **Axe Y — Fatigue neuromusculaire** : CMJ variation vs baseline (ou Hooper si CMJ indisponible)

```
                    CMJ ↑ > +5% ou Hooper ≤ 10
                         SUPERCOMP
                    ┌─────────────────────────┐
   ACWR < 0.8       │  DÉCONDITIONNEMENT /    │  ACWR > 1.5
   Zone sous-charge │  RISQUE REBOND CHARGE   │  Zone surcharge
                    └─────────────────────────┘
                    CMJ ↓ > −10% ou Hooper > 18
                          FATIGUE
```

**Quadrants opérationnels :**

| Quadrant | ACWR | CMJ / Hooper | Statut | Action |
|---|---|---|---|---|
| **VERT** | 0.8–1.3 | CMJ ≥ −5% et Hooper ≤ 14 | Optimal | Programme standard |
| **JAUNE** | 1.3–1.5 | CMJ −5 à −10% ou Hooper 15–18 | Vigilance | Réduire volume −20%, maintenir intensité |
| **ORANGE** | 0.8–1.3 | CMJ ↓ −10% ou Hooper > 18 | Fatigue cachée | Décharge impérative — surmenage insidieux |
| **ROUGE** | > 1.5 | CMJ ↓ ou Hooper > 18 | Surcharge avérée | Repos + bilan médical |
| **BLEU** | < 0.8 | CMJ ↑ ou Hooper ≤ 12 | Sous-chargé | Augmenter progressivement la charge |

### 2.2 Score de risque composite

```
Score_risque = (ACWR_score × 0.4) + (CMJ_score × 0.35) + (Hooper_score × 0.25)
```

**Normalisation des composantes :**
- `ACWR_score` : 0 si ACWR ≤ 1.0, linéaire 0→100 pour ACWR 1.0→1.8+
- `CMJ_score` : 0 si CMJ ≥ baseline, linéaire 0→100 pour CMJ −5% → −20%
- `Hooper_score` : 0 si Hooper ≤ 10, linéaire 0→100 pour Hooper 10→28

**Interprétation du score composite :**

| Score | Couleur | Action |
|---|---|---|
| 0–25 | 🟢 Vert | Programme standard |
| 26–50 | 🟡 Jaune | Volume −20%, surveiller |
| 51–75 | 🟠 Orange | Décharge, rest day optionnel |
| 76–100 | 🔴 Rouge | Arrêt séance, évaluation coach |

### 2.3 Cas particuliers cliniques importants

**Fatigue cachée (ACWR normal + CMJ chute) :**
Joueur semblant "en forme" selon charge, mais CMJ chute de −12%. Causes : qualité sommeil insuffisante, infection latente, stress extra-sportif.
→ Ne jamais se fier seulement à l'ACWR pour décider d'augmenter la charge.

**Rebond post-décharge (ACWR faible + CMJ élevé) :**
Après 7 jours de repos, ACWR < 0.8 mais le joueur est "sur-motivé" et CMJ +8%.
→ Risque de spike de charge brutal en reprenant. Augmenter progressivement (+10%/semaine max).

**Surentraînement symptomatologique :**
CMJ stable, Hooper > 22, ACWR normal → fatigue non-neuromusculaire (systémique).
→ Indique fatigue endocrine / inflammation chronique — bilan médical recommandé.

---

## 3. Push Séances — Logique Décisionnelle

### 3.1 Qui décide de la séance ?

**Architecture décisionnelle hiérarchique :**

```
Niveau 1 — Algorithme (programme hebdomadaire)
  → buildWeekProgram() génère la séance selon profil

Niveau 2 — Filtrage risque (vérification ACWR + CMJ + Hooper)
  → Si joueur ROUGE → séance remplacée par Récup active
  → Si joueur ORANGE → séance allégée (deload partiel)
  → Si joueur JAUNE → séance standard avec flag "surveillance"

Niveau 3 — Décision coach (override manuel)
  → Le coach peut modifier, reporter ou annuler pour n'importe quel joueur
  → Override loggé (audit trail pour décision médicale)

Niveau 4 — Confirmation joueur
  → Le joueur voit sa séance assignée et peut signaler une douleur / indisponibilité
```

### 3.2 Format du push

**Contenu minimal d'une notification push d'équipe :**
```
📋 Séance J — [Prénom]
Type : UPPER / LOWER / FULL / RÉCUPÉRATION
Durée estimée : ~45 min
Statut : ✅ Standard / ⚠️ Volume réduit / 🔴 Repos recommandé
→ Voir détail
```

**Timing recommandé :**
- **Séance matin** : push la veille à 20h + rappel le matin à 7h
- **Séance après-midi** : push la veille à 20h + rappel le jour J à 9h
- **Séance soir** : push le matin à 7h + rappel à 16h

**Données à inclure dans le push (contexte IA coach) :**
- ACWR du joueur (optionnel, selon préférence confidentialité)
- Indication si volume modifié
- Lien direct vers la session

### 3.3 Gestion du refus / report

**Scénarios possibles :**
1. **Joueur marque "indisponible"** → ACWR calculé sans cette séance, alerte coach si > 2 absences consécutives
2. **Joueur reporte la séance** (fait la séance demain) → charge déplacée d'un jour dans le calcul ACWR
3. **Joueur modifie l'intensité** (RPE réel < RPE prévu) → ACWR recalculé avec charge réelle si RPE saisi

**Impact sur l'ACWR si séance manquée :**
- Charge aiguë ↓ directement → ACWR peut passer sous 0.8 si 2+ séances manquées
- Risque "rebond" à la reprise → recommander montée progressive

### 3.4 Priorités de push selon statut joueur

```
ROUGE  → Push "Repos / Récupération active" uniquement
ORANGE → Push séance allégée + message coach : "Programme adapté ce jour"
JAUNE  → Push standard + flag : "Surveille la fatigue pendant la séance"
VERT   → Push standard
BLEU   → Push standard + suggestion augmentation volume si plateau > 3 semaines
```

---

## 4. Gestion des Rotations et Joueurs Clés

### 4.1 Principe de rotation par charge cumulée

**Rotation préventive :** un titulaire régulier avec ACWR ≥ 1.3 depuis 2 semaines consécutives
→ Recommander 1 séance S&C de moins cette semaine (passer de 3 à 2 séances)

**Seuil de temps de jeu critique :**
- > 750 min de jeu sur 6 semaines → ACWR structurellement élevé → rotation recommandée
- Étude Cross et al. 2016 : joueurs > 500 min/5 semaines → risque blessure ×3.4 vs < 300 min

### 4.2 Catégories de joueurs par charge

| Catégorie | Définition | Gestion S&C |
|---|---|---|
| **Titulaire lourd** | > 60 min/match × 4+ matchs | −1 séance/semaine, focus récupération |
| **Titulaire standard** | 40–60 min/match × 2–4 matchs | Programme standard |
| **Remplaçant actif** | < 40 min/match régulier | Programme complet +1 séance si possible |
| **Blessé** | Absence > 7j | Programme réhab spécifique (voir injury-prevention.md) |
| **Suspendu / Indisponible** | Absence sans blessure | Programme S&C renforcé cette semaine |

### 4.3 Modèle de rotation minimal (effectif 22–30 joueurs)

**Exemple planning hebdomadaire double match week :**

```
Lundi    : Récupération active (mobilité) — tout l'effectif
Mardi    : Activation légère — titulaires J1, séance S&C — réservistes
Mercredi : Jour off
Jeudi    : Séance S&C complète — réservistes, technique/activation — titulaires J1
Vendredi : Activation pré-match — tout l'effectif
Samedi   : Match J2
Dimanche : Récupération passive / CWI
```

---

## 5. Dashboard Coach — Métriques Hebdomadaires

### 5.1 Vue tableau de bord (hebdomadaire)

**Indicateurs à afficher par joueur :**

| Métrique | Affichage | Alerte |
|---|---|---|
| ACWR | Valeur + sparkline 4 sem | > 1.5 🔴 |
| CMJ vs baseline | % variation + flèche | < −10% 🔴 |
| Hooper | Score + variation | > 18 🔴 |
| Statut risque | Couleur (🟢🟡🟠🔴) | Orange + Rouge |
| Sessions complétées | X/Y attendues | < 2/3 taux ⚠️ |
| Temps de jeu (6 sem) | Cumul minutes | > 750 min ⚠️ |

### 5.2 Vue synthèse équipe

**KPIs équipe — affiché en haut de tableau de bord :**
- ACWR médian équipe + tendance (↑↓→)
- % joueurs zone verte / jaune / rouge
- Charge collective hebdomadaire (somme des charges × nb joueurs)
- Alertes actives (nb joueurs rouge + orange)
- Prévision semaine suivante (si double match → afficher ACWR projeté)

### 5.3 Rapport hebdomadaire automatique (généré le lundi matin)

**Contenu suggéré :**
```
📊 Rapport semaine S[N] — [Nom équipe]

🧠 Synthèse :
- X joueurs en zone optimale (VERT)
- Y joueurs en vigilance (JAUNE/ORANGE) : [liste noms]
- Z joueurs à risque (ROUGE) : [liste noms + recommandation]

📈 ACWR équipe : [valeur] ([↑↓→] vs S[N-1])
💪 Charge totale semaine : [AU] (objectif : [fourchette])

⚠️ Actions recommandées :
- [Joueur X] : ACWR [valeur] → réduire à 2 séances cette semaine
- [Joueur Y] : CMJ -12% → séance de récupération uniquement
```

---

## 6. Calcul de la Charge — Méthodes et Unités

### 6.1 Méthode session-RPE (Foster 1998)

La plus accessible et validée en terrain amateur :

```
Charge (AU) = RPE (1–10 Borg CR-10) × Durée (minutes)
```

**Exemples :**
- Séance S&C 60 min, RPE 7 → 420 AU
- Match 80 min, RPE 8 → 640 AU
- Entraînement technique 90 min, RPE 5 → 450 AU
- Récupération active 20 min, RPE 3 → 60 AU

**Timing de la saisie RPE :** 30 min post-séance minimum (Borg 1982 — évite surestimation de l'effort dans le feu de l'action)

### 6.2 Correspondances RPE → intensité

| RPE (CR-10) | Perception | Zone physiologique |
|---|---|---|
| 1–2 | Très facile | Récupération active |
| 3–4 | Facile | Aérobie bas (Z1–Z2) |
| 5–6 | Modéré | Aérobie seuil (Z3) |
| 7–8 | Difficile | Seuil lactate – haute intensité (Z4–Z5) |
| 9–10 | Maximal | Supramaximal / sprint maximal |

**Calibration initiale recommandée :** 1ère semaine, demander RPE immédiatement ET 30 min après → calculer le delta moyen individuel pour ajuster le recueil suivant.

### 6.3 Charge chronique et aiguë — paramètres avancés

**EWMA (Exponentially Weighted Moving Average) — alternative au rolling 7/28 :**
```
Charge aiguë EWMA = λ_a × Charge_j + (1 − λ_a) × EWMA_j-1
Charge chronique EWMA = λ_c × Charge_j + (1 − λ_c) × EWMA_j-1

avec λ_a = 2/(7+1) = 0.25  (7 jours)
     λ_c = 2/(28+1) = 0.065 (28 jours)
```

**Avantage EWMA :** plus sensible aux charges récentes, moins de délai de réponse que le rolling average (Windt & Gabbett 2017)

**Implémentation pratique :**
Pour un outil club sans data scientist, le rolling 7/28 est suffisant et plus facile à expliquer aux joueurs.

---

## 7. Confidentialité et Communication des Données

### 7.1 Bonnes pratiques RGPD / club

**Données sensibles (accès coach seulement) :**
- Score Hooper détaillé par item
- HRV individuel
- Blessures passées
- Médicaments / traitements

**Données partagées avec l'effectif (optionnel, améliore culture) :**
- Statut risque agrégé (couleur seulement)
- ACWR individuel si le joueur y consent
- Charge de l'équipe (médiane, sans identification individuelle)

**Communication recommandée :**
1. Réunion de début de saison : expliquer le système ACWR, montrer les zones
2. Retour individuel hebdomadaire : 2 min coach → joueur en état ORANGE/ROUGE
3. Transparence : le joueur voit toujours ses propres données en premier

### 7.2 Résistance des joueurs — Gestion du changement

**Obstacles fréquents :**
- "C'est mon affaire si je suis fatigué" → montrer le lien ACWR > 1.5 × taux blessure ×2
- "Je ne veux pas que le coach sache que je dors mal" → garantir que le Hooper détaillé reste privé
- "C'est trop de saisie" → simplifier : RPE post-séance (10 sec) + Hooper 1 min/semaine

**Adhésion → résultats concrets (étude Gabbett 2020 :** effectif d'une équipe de rugby qui a implémenté le monitoring :
- −34% de blessures musculaires sur 2 saisons
- −22% de temps de jeu perdu par blessure
- Corrélation +0.71 entre adhésion au monitoring et performance en fin de saison

---

## 8. Modèle de Données — Intégration Application

### 8.1 Structure de données joueur (profil coach)

```typescript
interface TeamPlayer {
  userId: string
  displayName: string
  position: RugbyPositionGroup
  currentACWR: number
  acwrHistory: { week: string; acwr: number }[]  // 8 semaines
  lastCMJ?: number          // cm
  cmjBaseline?: number      // cm
  lastHooper?: number       // 4–28
  riskScore: number         // 0–100
  riskColor: 'green' | 'yellow' | 'orange' | 'red' | 'blue'
  totalPlayMinutes6w: number // minutes de jeu sur 6 semaines
  sessionsCompletedThisWeek: number
  sessionsExpectedThisWeek: number
}
```

### 8.2 Structure de données tableau de bord équipe

```typescript
interface TeamDashboard {
  teamName: string
  weekId: string
  players: TeamPlayer[]
  teamACWR: {
    median: number
    q75: number
    trend: 'up' | 'stable' | 'down'
  }
  alerts: {
    redPlayers: string[]    // userIds
    orangePlayers: string[] // userIds
    clusterDetected: boolean
    clusterType?: 'forwards' | 'backs' | 'full'
  }
  weeklyLoad: number // somme des charges individuelles
}
```

### 8.3 Règles de visibilité (RBAC simplifié)

| Rôle | Peut voir | Peut modifier |
|---|---|---|
| Joueur | Son propre profil, son ACWR, ses séances | Son RPE, son Hooper, ses disponibilités |
| Coach | Tout le dashboard équipe, statuts couleurs | Séances, rotations, override charge |
| Admin club | Tout | Tout + gestion comptes |

---

## 9. Intégration avec le Module ACWR Existant

L'application possède déjà un hook `useACWR(logs, events)` qui calcule l'ACWR individuel.

**Extension pour le mode coach :**
1. Table Supabase `team_members` : association userId_joueur → userId_coach
2. RLS Supabase : coach voit les profils des joueurs de son équipe
3. Vue agrégée : query Supabase `SELECT median(acwr), percentile_cont(0.75) FROM acwr_view WHERE team_id = ?`
4. Hook `useTeamACWR(teamId)` → retourne `TeamDashboard`

---

## 10. Références Scientifiques

1. Gabbett TJ (2016). *The training-injury prevention paradox: should athletes train smarter and harder?* Br J Sports Med 50(5):273–280.
2. Hulin BT et al. (2016). *The acute:chronic workload ratio predicts injury: high chronic workload may decrease injury risk in elite rugby league players.* Br J Sports Med 50(4):231–236.
3. Malone S et al. (2017). *Unpacking the black box: applications and considerations for using GPS devices in sport.* Int J Sports Physiol Perform 12(Suppl 2):S218–S226.
4. Rogalski B et al. (2013). *Association between pre-season training load and in-season availability in elite Australian football players.* J Sci Med Sport 16(4):341–345.
5. Schwellnus M et al. (2016). *How much is too much? (Part 2) International Olympic Committee consensus statement on load in sport and risk of illness.* Br J Sports Med 50(17):1043–1052.
6. Cross MJ et al. (2016). *The influence of football on injury risk during the subsequent week in elite rugby union.* Br J Sports Med 50(17):1063–1068.
7. Windt J, Gabbett TJ (2017). *How do training and competition workloads relate to injury?* Br J Sports Med 51(5):428–435.
8. Colby MJ et al. (2014). *Accelerometer and GPS-derived running loads and injury risk in elite Australian footballers.* J Strength Cond Res 28(8):2244–2252.
9. Foster C et al. (1998). *A new approach to monitoring exercise training.* J Strength Cond Res 15(1):109–115.
10. Gabbett TJ (2020). *Debunking the myths about training load, injury and performance.* Br J Sports Med 54(1):58–66.
11. Borg GA (1982). *Psychophysical bases of perceived exertion.* Med Sci Sports Exerc 14(5):377–381.
12. Plisky PJ et al. (2006). *Star Excursion Balance Test as a predictor of lower extremity injury.* N Am J Sports Phys Ther 1(1):3–10.
