# Prévention des Blessures — Base de Connaissance Rugby

> **Usage** : Injecté dans les appels Claude pour évaluer les risques, adapter les programmes selon les blessures du profil utilisateur, et générer des alertes ACWR.
> ⚠️ Ce fichier est une ressource éducative. Toute blessure réelle doit être évaluée par un professionnel de santé.

---

## 1. Épidémiologie

### 1.1 Taux d'incidence
| Niveau | Match (blessures/1000h) | Entraînement |
|---|---|---|
| Professionnel | 65–90 | 3–5 |
| Semi-pro | 45–65 | 2–4 |
| Amateur (club fédéral) | 30–55 | 1.5–3 |

Risque en match = 10-20× supérieur à l'entraînement.

**Source** : Brooks et al. (2005). BJSM, 39(10), 763-775.

### 1.2 Distribution anatomique
| Localisation | % blessures | Mécanisme principal |
|---|---|---|
| Épaule/clavicule | 18–23% | Contact, plaquage épaule, chute |
| Genou | 12–18% | Contact, torsion |
| Ischio-jambiers | 10–15% | Sprint, fatigue |
| Cheville | 8–12% | Inversion, contact |
| Nuque/cervical | 6–10% | Mêlée, plaquage (avants++) |
| Tête/commotion | 5–8% | Contact, sol |
| Lombaires | 4–7% | Mêlée, mauvaise mécanique |

**Source** : Hendricks et al. (2012). SAJSM, 24(3), 73-81.

---

## 2. Facteurs de Risque

**Facteur N°1 : antécédent de blessure** (×2-4 risque de récidive)

**Source** : Bahr R. & Krosshaug T. (2005). BJSM, 39(6), 324-329.

### Le paradoxe entraînement-blessure (Gabbett, 2016)
- Peu entraîné → risque élevé (déconditionnement)
- Bien entraîné + charge bien gérée → risque le plus faible
- Bien entraîné + pic de charge soudain → risque élevé

→ L'entraînement protège SI la charge est bien gérée.

**Source** : Gabbett T.J. (2016). BJSM, 50(5), 273-280.

---

## 3. Ratio Charge Aiguë/Chronique (ACWR) — SEUILS OFFICIELS

### 3.1 Calcul
```
ACWR = Charge semaine en cours / Moyenne des 4 semaines précédentes
Charge séance = RPE (1-10) × Durée (minutes) = Unités Arbitraires (UA)
Exemple : RPE 7 × 60 min = 420 UA
```

### 3.2 Zones de risque validées
| ACWR | Zone | Risque blessure | Action app |
|---|---|---|---|
| < 0.8 | Sous-charge | Élevé (déconditionnement) | Encourager progression |
| **0.8 – 1.3** | **ZONE OPTIMALE** | **Risque le plus faible** | Maintenir |
| 1.3 – 1.5 | Vigilance | Modérément augmenté | Surveiller |
| **> 1.5** | **DANGER** | **×2.12 risque blessure** | Réduire charge immédiatement |
| > 2.0 | Critique | Très élevé | Repos forcé |

**Étude clé** : Hulin et al. (2016) — 53 joueurs rugby league, 2 saisons : ACWR > 1.5 = risque ×2.12.

**Source** : Hulin B.T. et al. (2016). BJSM, 50(4), 231-236.

### 3.3 Règle des 10%
Ne jamais augmenter la charge hebdomadaire de plus de 10% vs semaine précédente. Simple et cliniquement efficace pour les débutants et la reprise.

### 3.4 Implémentation app recommandée
- RPE (1-10) × durée (min) après chaque séance = charge UA
- Affichage ACWR glissant 4 semaines
- Couleurs : vert (0.8-1.3) / orange (1.3-1.5) / rouge (>1.5)
- Alerte automatique si ACWR > 1.5

---

## 4. Protocoles de Prévention Validés

### 4.1 RugbyReady (World Rugby) — Officiel
Échauffement structuré 20 min intégrant : activation dynamique, travail de contact progressif, proprioception.
- Réduit les blessures de 25% en match (Marshall et al., 2014)
- Réduit de 40% les blessures à l'entraînement
- Gratuit, disponible sur worldrugby.org

**Source** : Marshall S.W. et al. (2014). IJSPP, 9(3), 519-523. / World Rugby (2020). RugbyReady.

### 4.2 Nordic Hamstring Exercise (NHE)
Exercice excentrique des ischio-jambiers.

**Protocole UEFA progressif (10 semaines)** :
- S1-S2 : 2 séries × 5 reps
- S3-S4 : 2×6 puis 2×8
- S5-S7 : 3×8 puis 3×10
- S8-S10 : 3×10 puis 3×12
- Entretien : 1×5-8 reps, 2×/semaine

**Résultats validés** :
- −51% blessures ischio-jambiers
- −65% récidives

**Source** : van der Horst N. et al. (2015). AJSM, 43(6), 1316-1323.

---

## 5. Prehab par Zone Anatomique

### 5.1 Épaule (zone la plus blessée — 18-23%)
- Rotation externe isocinétique : 3×12-15 @ RPE 5-6/10
- Ratio RE/RI optimal : 0.65-0.75 (si < 0.60 → risque déchirure coiffe)
- Face pull avec bande : 3×15-20 (rétraction scapulaire)
- Y-T-W en prone : stabilisation scapulaire profonde
- Contre-indications actives : douleur shoulder_pain → modifier/supprimer exercices de poussée overhead

**Source** : Wilk K.E. et al. (2009). JOSPT, 39(1), 22-29.

### 5.2 Ischio-jambiers (10-15% des blessures)
- Nordic Hamstring Curl : voir protocole 4.2
- Romanian Deadlift : 3-4×8-10 @ 60-75% 1RM (charge excentrique)
- Hip Thrust : décharge les ischio en sprint via activation fessière
- Critère retour course après blessure : force excentrique ≥ 90% côté sain

### 5.3 Cheville (8-12%)
- Proprioception progression 4 semaines :
  S1-2 : sol stable, unipodal (3×30s) → S3 : surface instable → S4 : dynamique réactif
- Eversion avec bande : 3×15-20, résistance progressive
- Single leg calf raise excentrique : 3×15 (3 sec descente) — Alfredson protocol adapté
- Retour à la course : test saut unipodal (≥90% côté sain)

**Source** : McKeon P.O. et al. (2008). J Athl Train, 43(6), 616-625.

### 5.4 Cervical (avants prioritairement — 6-10%)
- **Ne jamais travailler en douleur**
- Isométrique multi-directionnel : 5×5-10s, RPE 6-7/10
- Flexion, extension, inclinaison latérale × 2 directions
- Mobilité thoracique : rotations en quadrupédie (limitation thoracique = compensation cervicale)

**Source** : Covassin T. & Elbin R.J. (2011). Athl Train Sports Health Care, 3(1), 33-43.

### 5.5 Lombaires — McGill Big 3 (Evidence A)
1. **Modified Curl-Up** : 3×10 (anti-flexion) — appui lombaire maintenu
2. **Bird Dog** : 3×10 chaque côté, maintien 7-8s (anti-rotation) — verticalité bras/jambe
3. **Side Plank** : 3×10-30s chaque côté (anti-latérofléchissement)

Indication : utilisateur avec low_back_pain → intégrer systématiquement.
Contre-indication : exclure tout exercice de flexion lombaire lourde.

**Source** : McGill S.M. (2010). SCJ, 32(3), 33-46.

### 5.6 Genou (12-18%)
- VMO (vaste médial oblique) : hack squat bulgare, leg extension unipodal
- Terminal knee extension avec bande : activation VMO terminale
- Step-down excentrique : contrôle rotulien en descente
- Contre-indications actives : knee_pain → modifier squats profonds, lunges

---

## 6. Commotion Cérébrale — Protocole World Rugby

### 6.1 Signes clairs → sortie immédiate
- Perte de conscience, convulsions, trouble équilibre, confusion, amnésie post-traumatique

### 6.2 Règle absolue
**"If in doubt, sit them out"** — retour au jeu le même jour INTERDIT dans tous les cas.

### 6.3 Protocole retour 6 étapes (World Rugby / Berlin Consensus 2017)
0. Repos complet jusqu'à disparition de TOUS les symptômes au repos
1. Activité légère (marche, vélo stationnaire, <60% FCmax)
2. Exercice aérobie modéré (course, natation)
3. Exercices rugby sans contact (passes, jeux de jambes)
4. Entraînement sans contact avec partenaires
5. Entraînement complet avec contact **(validation médicale obligatoire)**
6. Retour au match

**Durée minimum par étape** : 24h sans symptômes. Si symptômes réapparaissent : revenir à l'étape précédente.

**Source** : McCrory P. et al. (2017). BJSM, 51(11), 838-847.

---

## 7. Signaux d'Alerte — Règles de Sécurité App

### STOP IMMÉDIAT — consultation médicale urgente
- Douleur thoracique ou essoufflement anormal à l'effort
- Douleur cervicale + fourmillements/faiblesse dans les membres
- Symptômes de commotion (confusion, amnésie, vertiges)
- Déformation visible d'une articulation

### STOP SÉANCE — consultation dans 48h
- Douleur tendineuse localisée progressive à l'effort
- Douleur articulaire avec gonflement
- Douleur lombaire irradiant dans la jambe (sciatalgie)
- Claquage musculaire ressenti à l'effort (sensation "coup de couteau")

### Règles app
- ≥1 signal "STOP IMMÉDIAT" → alerte prioritaire + recommandation médecin
- ≥2 signaux "STOP SÉANCE" même semaine → plan récupération allégé, pas de S&C lourd
- ACWR >1.5 → alerte surcharge (voir section 3.2)
- Blessure connue (profil `injuries: Contra[]`) → adaptation automatique des exercices

---

## 8. Mapping Contra → Exercices à Exclure (pour l'algorithme)
| Contra (app) | Exercices à exclure/modifier |
|---|---|
| shoulder_pain | Overhead press, dips, front squat, muscle-up |
| knee_pain | Squat profond, lunge, step-up, leg press à amplitude complète |
| low_back_pain | Jefferson curl, good morning, hyperextensions, squats lourds |
| neck_pain | Overhead press, planche frontale lourde, tout mouvement en flexion cervicale forcée |
| ankle_pain | Bulgarian split squat, box jump, plyométrie unipodale |
| elbow_pain | Curls, triceps dips, push-up avec douleur, curl barre |
| wrist_pain | Front rack, overhead, push-up classique |
| groin_pain | Adducteur machine, fentes latérales, Copenhagen plank |

---

## 9. Références
1. Bahr R. & Krosshaug T. (2005). BJSM, 39(6), 324-329.
2. Brooks J.H.M. et al. (2005). BJSM, 39(10), 763-775.
3. Covassin T. & Elbin R.J. (2011). Athl Train Sports Health Care, 3(1), 33-43.
4. Gabbett T.J. (2016). BJSM, 50(5), 273-280.
5. Hendricks S. et al. (2012). SAJSM, 24(3), 73-81.
6. Hulin B.T. et al. (2016). BJSM, 50(4), 231-236.
7. Marshall S.W. et al. (2014). IJSPP, 9(3), 519-523.
8. McCrory P. et al. (2017). BJSM, 51(11), 838-847.
9. McGill S.M. (2010). SCJ, 32(3), 33-46.
10. McKeon P.O. et al. (2008). J Athl Train, 43(6), 616-625.
11. van der Horst N. et al. (2015). AJSM, 43(6), 1316-1323.
12. Wilk K.E. et al. (2009). JOSPT, 39(1), 22-29.
13. World Rugby (2020). RugbyReady Player Welfare Programme.

*Version : 1.0.0 | Dernière mise à jour : 2026-02-25*
