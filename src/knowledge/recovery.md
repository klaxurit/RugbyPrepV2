# Récupération de l'Athlète — Base de Connaissance Rugby

> **Usage** : source de vérité scientifique sur la récupération pour RugbyPrep.
> Conçu pour injection comme contexte dans les appels Claude API (génération de
> recommandations post-séance, post-match, alertes fatigue, conseils sommeil).
> Contenu dense et sourcé. Vulgarisation gérée au niveau du prompt utilisateur.

---

## 1. Physiologie de la Récupération

### 1.1 Ce qui se dégrade pendant l'effort

Un match de rugby ou une séance de force intense génère simultanément plusieurs
types de dommages qui nécessitent des délais de récupération distincts :

| Système affecté | Dommage principal | Délai de récupération |
|---|---|---|
| Glycogène musculaire | Déplétion partielle à totale | 24–48h (alimentation optimale) |
| Glycogène hépatique | Déplétion partielle | 12–24h |
| Protéines contractiles | Microtraumatismes myofibrillaires | 48–96h |
| Tissu conjonctif (tendons) | Stress mécanique, micro-lésions | 72–120h |
| Système nerveux central (SNC) | Fatigue neurale, déplétion en neurotransmetteurs | 24–72h (effort très intense) |
| Système hormonal | Élévation cortisol, baisse testostérone | 24–48h post-effort modéré |
| Fonction immunitaire | Fenêtre immunodépressive post-effort | 3–72h ("open window") |

**Implication critique** : après un match de rugby (contacts répétés, course
à haute intensité, stress cognitif), la récupération complète prend 72h minimum
et souvent 96–120h pour les avants ou en cas de matchs physiquement intenses.

**Source** : Twist C. & Highton J. (2013). Monitoring fatigue and recovery in
rugby league players. *International Journal of Sports Physiology and Performance*,
8(5), 467-474. / Hausswirth C. & Mujika I. (eds) (2013). *Recovery for
Performance in Sport*. Human Kinetics, chap. 2.

---

### 1.2 Le Modèle Fatigue-Forme (Banister, 1991)

```
PERFORMANCE = Forme Acquise − Fatigue Accumulée
```

- La **forme acquise** (fitness) se développe lentement (semaines/mois) et se
  dissipe lentement (décroissance ~45 jours).
- La **fatigue accumulée** se développe rapidement (séance à séance) et se dissipe
  plus vite (décroissance ~15 jours).

**Implication pratique** : juste après une séance intense, la fatigue masque la
forme acquise. La performance nette est donc temporairement inférieure au potentiel
réel. C'est physiologiquement normal — ne pas augmenter la charge pour "compenser".

**Source** : Banister E.W. (1991). In MacDougall et al. (eds), *Physiological
Testing of the High-Performance Athlete*. Human Kinetics, 403-424. / Mujika I.
(2009). *Tapering and Peaking for Optimal Performance*. Human Kinetics.

---

### 1.3 Fatigue Aiguë vs Fatigue Chronique

| Type | Définition | Signaux | Action |
|---|---|---|---|
| **Fatigue aiguë** | Normal après séance intense. Réversible en 24-72h. | Courbatures, baisse de motivation passagère, FC repos légèrement élevée | Récupération standard (sommeil, nutrition, mobilité) |
| **Fatigue fonctionnelle** (surchargeabsorbable) | Accumulation volontaire sur 2-4 sem. Réversible avec déload. | Baisse de performance transitoire, humeur légèrement altérée, RPE élevé pour charge habituelle | Déload planifié |
| **Surentraînement** (OTS) | Fatigue chronique non résorbée. Peut durer mois à années. | Baisse performance persistante (>2 sem), troubles du sommeil, FC repos chroniquement élevée, infections répétées, perte de motivation profonde | Arrêt total ou fortement réduit, prise en charge médicale |

**Critère de diagnostic OTS** (Meeusen et al., 2013) : baisse de performance
inexpliquée de >10% sur ≥2 semaines malgré repos suffisant.

**Source** : Meeusen R. et al. (2013). Prevention, diagnosis, and treatment of the
overtraining syndrome: Joint consensus statement of the European College of Sport
Science and the American College of Sports Medicine. *Medicine & Science in Sports
& Exercise*, 45(1), 186-205.

---

## 2. Le Sommeil — Outil de Récupération N°1

### 2.1 Pourquoi le sommeil prime sur tout

Le sommeil est le seul moment où l'organisme produit massivement l'hormone de
croissance (GH). 95% de la sécrétion quotidienne de GH survient pendant le
**sommeil lent profond (stade N3 / slow-wave sleep)**, dans les premières heures
de la nuit.

La GH orchestre :
- La synthèse protéique musculaire (réparation des microtraumatismes)
- La lipolyse (oxydation des graisses)
- La régénération des tendons et cartilages
- La restauration du système immunitaire

**Réduire le sommeil, c'est amputer la récupération musculaire à sa source.**

**Source** : Van Cauter E. & Plat L. (1996). Physiology of growth hormone secretion
during sleep. *Journal of Pediatrics*, 128(5), S32-S37. / Walker M.P. (2017).
*Why We Sleep*. Scribner, chap. 7.

---

### 2.2 Architecture du Sommeil et Rôle par Phase

```
CYCLE TYPE (~90 min, se répète 4-6 fois par nuit) :

N1 (5%)    → Endormissement léger, transition éveil-sommeil
N2 (45%)   → Consolidation mémoire procédurale (technique, schémas moteurs)
N3 (25%)   → Sommeil lent profond : GH, réparation, immunité
REM (25%)  → Sommeil paradoxal : consolidation cognitive, décision, créativité
```

**Pour un athlète** :
- Les cycles de début de nuit (22h-02h) sont dominés par le **N3** → récupération
  physique. Se coucher tard les réduit directement.
- Les cycles de fin de nuit (04h-08h) sont dominés par le **REM** → récupération
  cognitive (lecture de jeu, gestion du stress, réflexes décisionnels).
- Un réveil à 06h00 après un coucher à 02h00 = 4h de sommeil quasi exclusivement
  N3 + peu de REM. Perte massive de récupération cognitive.

**Source** : Fullagar H.H.K. et al. (2015). Sleep and athletic performance: the
effects of sleep loss and travel on exercise performance and recovery. *Sports
Medicine*, 45(2), 161-186.

---

### 2.3 Recommandations Quantitatives pour Athlètes

| Population | Durée recommandée | Évidence |
|---|---|---|
| Adulte sédentaire | 7–9h/nuit | National Sleep Foundation (2015) |
| Athlète amateur (2-5h entraînement/sem) | 8–9h/nuit | Fullagar et al. (2015) |
| Athlète de haut niveau (sport de contact) | 9–10h/nuit | Mah et al. (2011) |
| Joueur de rugby pro (phase intensive) | 9–10h + sieste 20-30 min | McLean et al. (2010) |

**Étude clé** (Mah et al., 2011) : des joueurs de basket universitaires ont
dormi 10h/nuit pendant 5-7 semaines. Résultats : +9% vitesse sprint, +9.2%
précision (tirs), -13.7% temps de réaction. Performance cognitive et physique
simultanément améliorées par le seul allongement du sommeil.

**Source** : Mah C.D. et al. (2011). The effects of sleep extension on the athletic
performance of collegiate basketball players. *Sleep*, 34(7), 943-950.

---

### 2.4 Effets de la Privation de Sommeil sur la Performance Rugby

| Indicateur de performance | Impact privation (<6h) | Source |
|---|---|---|
| Force maximale (1RM) | −10 à −20% | Reilly & Piercy (1994) |
| Puissance explosive (CMJ) | −5 à −10% | Fullagar et al. (2015) |
| Vitesse de sprint (10m) | −2 à −5% | Skein et al. (2011) |
| Endurance (temps avant épuisement) | −30% (!) | Oliver et al. (2009) |
| Temps de réaction | −300ms en moyenne | Lim et al. (2010) |
| Prise de décision / lecture de jeu | Fortement dégradée | Harrison & Horne (2000) |
| Risque de blessure | ×1.7 sous 6h vs ≥8h | Milewski et al. (2014) |

**Le risque de blessure x1.7 est critique pour une application rugby.** Un
programme S&C optimal est inutile si le joueur dort insuffisamment : il s'expose
davantage aux blessures qu'un joueur moins entraîné qui dort bien.

**Source** : Milewski M.D. et al. (2014). Chronic lack of sleep is associated with
increased sports injuries in adolescent athletes. *Journal of Pediatric
Orthopedics*, 34(2), 129-133.

---

### 2.5 Protocoles d'Hygiène du Sommeil (Evidence-Based)

**Environnement** :
- Température chambre : **18–19°C** optimal (la baisse de température corporelle
  déclenche l'endormissement — Walker, 2017)
- Obscurité complète : la lumière bleue (505-555 nm) supprime la mélatonine de
  50% même à faible intensité (Gooley et al., 2011)
- Silence ou bruit blanc (masque les bruits parasites)

**Comportements pré-sommeil** :
- Arrêter les écrans **60-90 min** avant coucher (lumière bleue → suppression
  mélatonine → retard d'endormissement de 30-90 min)
- Éviter la caféine **6h** avant coucher (demi-vie = 5-6h)
- Éviter l'alcool : perturbe le N3 et le REM même à doses modérées. Un verre de
  vin post-match réduit la qualité du sommeil de 24% (Ebrahim et al., 2013)
- Routine stable (même heure de coucher/réveil 7j/7) : stabilise le rythme
  circadien

**La sieste** :
- 10–20 min : restaure la vigilance, améliore la réactivité, sans inertie du
  sommeil (grogginess)
- 26 min : "NASA nap" — validée sur pilotes, améliore performance de 34% et
  vigilance de 100% (Rosekind et al., 1995)
- > 30 min : risque d'entrer en N3, inertie du sommeil à l'éveil, perturbation
  du sommeil nocturne
- Créneau optimal : 13h-15h (correspond au creux circadien naturel)

**Source** : Gooley J.J. et al. (2011). Exposure to room light before bedtime
suppresses melatonin onset. *Journal of Clinical Endocrinology & Metabolism*,
96(3), E463-472. / Rosekind M.R. et al. (1995). Alertness management: strategic
naps in operational settings. *Journal of Sleep Research*, 4(S2), 62-66.

---

## 3. Protocoles de Récupération Post-Match

### 3.1 Fenêtre de Récupération Immédiate (0–2h post-match)

Cette fenêtre est la plus critique. La perméabilité des membranes cellulaires est
maximale, la sensibilité à l'insuline est élevée, et la réponse inflammatoire aiguë
est en cours.

**Priorités dans les 30 premières minutes** :
1. **Réhydratation** : objectif = boire 1.5× le poids perdu en eau (peser avant/
   après match). Un joueur de 90kg perdant 1.5kg de sueur doit absorber ~2.25L.
   Ajouter électrolytes (sodium 500-700 mg/L) pour faciliter la rétention hydrique.
2. **Glucides** : 1.0–1.2 g/kg de poids corporel dans les 30-60 min pour maximiser
   la resynthèse du glycogène (fenêtre enzymatique : GLUT4 translocation).
3. **Protéines** : 20–40g de protéines complètes dans les 60-120 min (leucine ≥ 3g
   pour déclencher la synthèse protéique musculaire — Phillips & Van Loon, 2011).
4. **Réduction de température corporelle** : retour à température normale (eau
   fraîche, environnement tempéré).

**Source** : Thomas D.T., Erdman K.A. & Burke L.M. (2016). Position of the Academy
of Nutrition and Dietetics, Dietitians of Canada, and the ACSM: Nutrition and
Athletic Performance. *Journal of the Academy of Nutrition and Dietetics*, 116(3),
501-528.

---

### 3.2 Froid : Immersion en Eau Froide (CWI)

La CWI est le protocole de récupération post-match le plus étudié et le plus
utilisé en rugby professionnel.

**Mécanismes physiologiques** :
- Vasoconstriction périphérique → réduction de l'œdème et de l'inflammation locale
- Réduction de la vitesse de conduction nerveuse → effet analgésique
- Retour veineux augmenté à la sortie → effet de "pompe" circulatoire
- Réduction du métabolisme local → ralentissement de la cascade inflammatoire

**Protocole validé** :
- Température : **10–15°C** (< 10°C = risques, > 15°C = efficacité réduite)
- Durée : **10–15 minutes**
- Immersion jusqu'aux hanches/poitrine (jambes obligatoirement immergées pour un
  joueur de rugby)

**Evidence** : méta-analyse Versey et al. (2013) sur 27 études : la CWI réduit
significativement la douleur musculaire différée (DOMS) à 24h et 48h post-exercice
(ES = 0.40, p < 0.05), et améliore la performance de sprint répété à 24h vs
récupération passive.

**Mise en garde** : la CWI post-séance de force peut atténuer les adaptations
hypertrophiques si utilisée systématiquement (Roberts et al., 2015 : −28% de
croissance musculaire sur 12 semaines CWI systématique post-force). **Recommandation :
réserver la CWI aux lendemains de match, pas aux séances de S&C en off-season.**

**Source** : Versey N.G., Halson S.L. & Dawson B.T. (2013). Water immersion
recovery for athletes. *Sports Medicine*, 43(11), 1101-1130. / Roberts L.A. et al.
(2015). Post-exercise cold water immersion attenuates acute anabolic signalling and
long-term adaptations in muscle to strength training. *Journal of Physiology*,
593(18), 4285-4301.

---

### 3.3 Thérapie par Contraste (Chaud/Froid alternés)

**Protocole** :
- Alterner 1–2 min eau chaude (38–42°C) / 1 min eau froide (10–15°C)
- 3–5 cycles, terminer par le froid
- Durée totale : 10–15 min

**Mécanisme** : la vasodilatation (chaud) et la vasoconstriction (froid) alternées
créent un effet de "pompe vasculaire" accélérant l'élimination des déchets
métaboliques (lactate, ions H+, déchets inflammatoires).

**Evidence vs CWI** : légèrement inférieure à la CWI pour la réduction du DOMS
selon Higgins et al. (2017), mais plus acceptable pratiquement (accessible en
vestiaire avec douche). Préférable à la récupération passive.

**Source** : Higgins T.R., Greene D.A. & Baker M.K. (2017). Effects of cold water
immersion and contrast water therapy: a systematic review and meta-analysis.
*Journal of Strength and Conditioning Research*, 31(5), 1443-1460.

---

### 3.4 Récupération Active

**Définition** : exercice d'intensité très faible (< 60% FCmax) dans les 24-48h
post-effort intense.

**Mécanismes validés** :
- Accélération de la clairance lactique (vs repos passif, même si marginale à 30
  min post-effort)
- Maintien du flux sanguin → apport en nutriments, élimination des déchets
- Maintien de la mobilité articulaire → prévention de la raideur post-match
- Bénéfice psychologique (sentiment d'action, réduction de la sensation de lourdeur)

**Activités recommandées** (lendemain de match, lundi) :
- Marche 20-30 min
- Vélo à résistance minimale 15-20 min
- Natation lente 20-30 min
- Yoga / mobilité guidée 20 min

**Ce qui ne fonctionne PAS** : récupération active à haute intensité (> 70% FCmax).
Cela ajoute du stress sans bénéfice récupérateur.

**Source** : Barnett A. (2006). Using recovery modalities between training sessions
in elite athletes: does it help? *Sports Medicine*, 36(9), 781-796.

---

### 3.5 Compression et Massage

**Vêtements de compression** :
- Evidence modérée : réduction subjective du DOMS (ES = 0.37)
- Mécanisme : pression externe → réduction de l'œdème, amélioration du retour
  veineux
- Efficacité maximale si portés **dans les 24h suivant l'effort** (pas uniquement
  pendant)
- Pratique, non-invasif, sans contre-indication

**Massage** :
- Réduit le DOMS perçu (ES = 0.43 selon Dupuy et al., 2018 — méta-analyse)
- Effet principalement psychologique et sur la perception de la douleur
- Impact mineur sur les marqueurs biologiques de l'inflammation
- Timing optimal : 2-6h post-effort

**Foam rolling (automassage)** :
- Réduit la raideur tissulaire et améliore l'amplitude articulaire à court terme
- Evidence insuffisante pour réduction du DOMS mesurable
- Bénéfice principal : mobilité et sensation de récupération

**Source** : Dupuy O. et al. (2018). An evidence-based approach for choosing
post-exercise recovery techniques to reduce markers of muscle damage, soreness,
fatigue, and inflammation. *Frontiers in Physiology*, 9, 403.

---

## 4. Monitoring de la Récupération

### 4.1 Variabilité de Fréquence Cardiaque (HRV)

La HRV mesure les variations de durée entre deux battements cardiaques successifs.
Elle reflète l'équilibre du système nerveux autonome (SNA) :
- **HRV élevée** = dominance parasympathique = système nerveux récupéré, prêt à
  l'effort
- **HRV basse** = dominance sympathique = fatigue, stress, sous-récupération

**La HRV est le marqueur non-invasif le plus sensible de l'état de récupération
disponible pour un athlète amateur** (Buchheit, 2014).

**Protocole de mesure standardisé** :
- Matin, au réveil, position allongée, avant café ou activité
- 5 minutes de mesure (ceinture cardiaque ou application smartphone)
- Analyser la **tendance hebdomadaire** plutôt que la valeur brute quotidienne
- Applications accessibles : HRV4Training, EliteHRV, Kubios

**Interprétation** :
| HRV vs baseline personnelle | Signification | Action recommandée |
|---|---|---|
| +10% ou plus | Excellent état de récupération | Séance principale OK, intensifier si approprié |
| ±5-10% de la baseline | Normal, état stable | Séance prévue maintenue |
| −10 à −15% | Fatigue accumulée | Réduire volume −20%, pas d'intensification |
| < −15% pendant 3 jours | Potentielle surcharge | Déload ou repos, évaluation médicale si persistant |

**Source** : Buchheit M. (2014). Monitoring training status with HR measures: do
all roads lead to Rome? *Frontiers in Physiology*, 5, 73. / Plews D.J. et al.
(2013). Heart rate variability in elite triathletes, is variation in variability
the key to effective training? *European Journal of Applied Physiology*, 113(11),
2765-2773.

---

### 4.2 Questionnaires de Bien-Être Subjectif (Wellness Scores)

En l'absence de HRV, les questionnaires subjectifs sont les outils les plus
simples et les plus rapidement corrélés à la performance et au risque de blessure.

**Questionnaire Hooper (4 items, echelle 1-7)** — validé en sport collectif :
1. Qualité du sommeil (1 = excellent, 7 = très mauvais)
2. Niveau de fatigue (1 = très reposé, 7 = très fatigué)
3. Niveau de stress (1 = très relaxé, 7 = très stressé)
4. Douleurs musculaires (1 = aucune, 7 = très douloureuses)

Score total > 20 → surveiller, envisager adaptation de charge.
Score total > 24 → réduire la charge impérativement.

**Validité** : McLean B.D. et al. (2010) ont montré que le score Hooper prédit
la charge d'entraînement perçue (r = 0.74) et détecte la surcharge 3-5 jours avant
une baisse de performance mesurable.

**Source** : Hooper S.L. & Mackinnon L.T. (1995). Monitoring overtraining in
athletes. *Sports Medicine*, 20(5), 321-327. / McLean B.D. et al. (2010). Absence
of an effect of high carbohydrate mixed nutritional supplementation on the
incidence of overreaching in athletes. *International Journal of Sport Nutrition
and Exercise Metabolism*, 20(5), 398-407.

---

### 4.3 Saut Vertical Contre-Mouvement (CMJ — Countermovement Jump)

Le CMJ est le test de terrain le plus simple pour objectiver la fatigue neuro-
musculaire.

**Protocole** : 3 sauts verticaux maximum (sans course d'élan), mesurer la hauteur
ou le temps de vol. Moyenne des 3 = valeur de référence.

**Interprétation** :
- Baisse > 5% vs baseline individuelle = fatigue neuromusculaire significative
- Baisse > 10% = ne pas ajouter de charge haute intensité ce jour

**Utilisation pratique dans l'app** : proposer 3 CMJ en début de séance comme
"check fatigue rapide" → adapter automatiquement la séance.

**Source** : Twist C. & Highton J. (2013) op. cit. / Claudino J.G. et al. (2017).
CMJ as a method for monitoring neuromuscular status: A meta-analysis. *Journal of
Science and Medicine in Sport*, 20(5), 483-489.

---

## 5. La Récupération en Période de Compétition Rugby

### 5.1 Le Problème du Joueur Amateur

Le joueur amateur est soumis à un stress total que peu de systèmes de suivi
prennent en compte :

```
CHARGE TOTALE = Charge entraînement rugby (2-3h/sem)
              + Charge S&C (2-3 séances)
              + Charge de match (80 min + déplacements + stress)
              + Charge professionnelle / vie quotidienne (travail, famille)
              + Charge psychologique (compétition, enjeux personnels)
```

**La charge de vie quotidienne est invisible mais réelle.** Une semaine de travail
stressante + match difficile + mauvais sommeil = surcharge totale même avec un
volume S&C modéré.

**Implication pour l'app** : les recommandations ne doivent jamais ignorer le
contexte global. Un joueur qui signale fatigue professionnelle élevée doit voir
sa charge S&C réduite, même si la programmation prévoit une semaine intensive.

---

### 5.2 Timeline de Récupération Post-Match (Match le Samedi)

```
SAMEDI (match)    → CWI 10-15 min après match, réhydratation + glucides rapides
                    dans les 30 min, repas complet dans les 2h.

DIMANCHE          → Repos complet ou récupération active légère (marche, natation).
                    Pas de S&C. Alimentation riche en glucides (replétion glycogène).
                    Sommeil prolongé prioritaire (10h si possible).

LUNDI             → Récupération active (mobilité, vélo léger). État de forme
                    mesuré (HRV ou Hooper). Décision sur la charge de la semaine.

MARDI             → S&C séance principale (si récupération validée).
                    Si non récupéré : séance réduite ou déplacée.

MERCREDI          → Entraînement rugby collectif.

JEUDI             → S&C séance secondaire (volume −40-50% vs mardi).

VENDREDI          → Activation pré-match (15-20 min, ≤ 6/10 intensité).
                    CNS wake-up : quelques accélérations courtes, mobilité.

SAMEDI            → Match.
```

**Source** : Stokes K.A. et al. (2013). Temporal patterns of match-play and
recovery in rugby union players. *European Journal of Sport Science*, 13(6),
659-665.

---

### 5.3 Accumulation de Fatigue sur Saison Longue

En saison française (sept → mai), le joueur amateur joue environ 25-35 matchs.
La fatigue chronique suit une courbe d'accumulation dont les pics se situent
typiquement :

- **Décembre-Janvier** : premier creux de saison (matchs rapprochés, conditions
  hivernales, réduction de la luminosité → perturbation circadienne)
- **Mars-Avril** : second creux avant phases finales (cumul de charge annuelle)

**Stratégie préventive recommandée** :
1. Déload systématique fin novembre (réduire S&C de 40%, pas de nouveaux
   exercices)
2. Contrôle rigoureux du volume S&C en janvier-février (2 séances max,
   volume ≤ 60% du pré-saison)
3. Tapering de 2 semaines avant phases finales (mai)

**Source** : Gabbett T.J. (2016) op. cit. / Cross et al. (2016) op. cit.

---

## 6. Nutrition de Récupération (Principes Fondamentaux)

*(Détails approfondis dans `nutrition.md` — ici, les points strictement liés
à la récupération post-effort.)*

### 6.1 Fenêtre Anabolique : Réalité vs Mythe

La "fenêtre anabolique" de 30 minutes post-effort est une simplification. La
littérature récente (Aragon & Schoenfeld, 2013) montre que :

- Si le joueur a mangé **dans les 2-3h précédant** l'entraînement, la fenêtre post-
  effort est moins critique (substrats encore disponibles).
- Si le joueur s'est entraîné à jeun ou > 4h après le dernier repas, consommer
  protéines + glucides **dans les 30-60 min** est clairement bénéfique.
- **Pour le match de rugby (80 min + échauffement)** : la fenêtre est réelle et
  critique, car l'effort dure longtemps et la déplétion glucidique est significative.

**Recommandation pragmatique** :
- Post-match : ne pas attendre > 2h pour manger un repas complet.
- Post-séance S&C courte (< 60 min) : moins urgent, manger dans les 2-3h suffit
  si le joueur est nourri pré-séance.

**Source** : Aragon A.A. & Schoenfeld B.J. (2013). Nutrient timing revisited: is
there a post-exercise anabolic window? *Journal of the International Society of
Sports Nutrition*, 10(1), 5.

---

### 6.2 Protéines Post-Effort

- **Dose optimale** : 20–40g de protéines complètes (leucine ≥ 3g)
- **20g** : suffisant pour athlètes < 80kg (stimule maximalement la synthèse
  protéique)
- **40g** : optimal pour athlètes > 90kg ou efforts très long/intense
- **Source préférentielle** : whey protéine (absorption rapide), poulet, poisson,
  œufs, fromage blanc 0%
- **Fréquence** : toutes les 3-4h pour maintenir la stimulation de la synthèse
  protéique tout au long de la journée de récupération

**Source** : Phillips S.M. & Van Loon L.J.C. (2011). Dietary protein for athletes:
From requirements to optimum adaptation. *Journal of Sports Sciences*, 29(S1),
S29-S38.

---

### 6.3 Glucides Post-Effort

- **Dose optimale pour resynthèse glycogène** : 1.0–1.2 g/kg/h pendant 4h
  post-effort (si prochain entraînement dans 8-12h)
- **Situation standard amateur** (48h avant prochain match) : 6-8g/kg/jour de
  glucides dans les 24h post-match suffit pour une replétion complète
- **Type de glucides** : index glycémique élevé immédiatement post-effort (riz
  blanc, pain, fruits, pomme de terre) puis index modéré les heures suivantes
- **L'association glucides + protéines** dans les 2h post-effort n'augmente pas
  la resynthèse glycogène vs glucides seuls (si dose glucidique optimale), mais
  optimise la synthèse protéique simultanément.

**Source** : Burke L.M. et al. (2011). Carbohydrates for training and competition.
*Journal of Sports Sciences*, 29(S1), S17-S27.

---

### 6.4 Hydratation et Électrolytes

**Évaluation rapide de l'état hydrique** :
- Couleur des urines : jaune pâle = bien hydraté / jaune foncé = déshydraté
- Pesée avant/après : chaque kg perdu = 1L de déficit hydrique à combler

**Protocole de réhydratation** :
- Boire 1.5× le poids perdu en sueur (ex : −1.5kg → boire 2.25L)
- Ajouter du sodium (bouillon, sel, boissons isotoniques) pour faciliter la
  rétention hydrique — l'eau pure seule est insuffisante après effort intense
- Durée de réhydratation complète : 4-6h post-match

**Seuil d'impact** : une déshydratation de **2% du poids corporel** (1.8kg pour
un joueur de 90kg) réduit la performance aérobie de ~5% et altère la fonction
cognitive.

**Source** : Sawka M.N. et al. (2007). American College of Sports Medicine position
stand: Exercise and fluid replacement. *Medicine & Science in Sports & Exercise*,
39(2), 377-390.

---

## 7. Signaux d'Alerte — Indicateurs de Surcharge

### 7.1 Signaux Objectifs (mesurables)

| Signal | Seuil d'alerte | Action |
|---|---|---|
| HRV matinale | < −15% baseline sur 3 jours consécutifs | Déload immédiat |
| FC repos matinale | > +8-10 bpm vs baseline sur 3 jours | Réduire charge |
| CMJ | Baisse > 10% vs baseline | Pas de haute intensité ce jour |
| Poids corporel | Baisse > 2kg vs baseline (non planifiée) | Vérifier hydratation + alimentation |

### 7.2 Signaux Subjectifs (ressentis)

| Signal | Signification |
|---|---|
| Fatigue persistante malgré repos (> 2 semaines) | Potentiel surmenage fonctionnel |
| Troubles du sommeil (insomnie, réveils nocturnes) | Suractivation sympathique chronique |
| Perte de motivation profonde | Signal neuropsychologique de surcharge |
| Infections ORL répétées | Immunodépression liée à l'OTS |
| Douleurs tendineuses sans traumatisme | Surcharge structurelle (risque blessure) |
| RPE anormalement élevé pour charges habituelles | Fatigue neurale ou métabolique accumulée |

**Règle de sécurité dans l'app** : si un utilisateur signale ≥ 3 signaux subjectifs
simultanément, afficher systématiquement un message de prudence et proposer un
déload, indépendamment de la semaine de cycle.

---

## 8. Références Bibliographiques Complètes

1. **Aragon A.A. & Schoenfeld B.J.** (2013). Nutrient timing revisited: is there a post-exercise anabolic window? *Journal of the International Society of Sports Nutrition*, 10(1), 5.

2. **Banister E.W.** (1991). Modeling elite athletic performance. In MacDougall et al. (eds), *Physiological Testing of the High-Performance Athlete*. Human Kinetics, 403-424.

3. **Barnett A.** (2006). Using recovery modalities between training sessions in elite athletes: does it help? *Sports Medicine*, 36(9), 781-796.

4. **Buchheit M.** (2014). Monitoring training status with HR measures: do all roads lead to Rome? *Frontiers in Physiology*, 5, 73.

5. **Burke L.M. et al.** (2011). Carbohydrates for training and competition. *Journal of Sports Sciences*, 29(S1), S17-S27.

6. **Claudino J.G. et al.** (2017). CMJ as a method for monitoring neuromuscular status: A meta-analysis. *Journal of Science and Medicine in Sport*, 20(5), 483-489.

7. **Cross M.J. et al.** (2016). The influence of in-season training loads on injury risk in professional rugby union. *International Journal of Sports Physiology and Performance*, 11(3), 350-355.

8. **Dupuy O. et al.** (2018). An evidence-based approach for choosing post-exercise recovery techniques. *Frontiers in Physiology*, 9, 403.

9. **Ebrahim I.O. et al.** (2013). Alcohol and sleep I: Effects on normal sleep. *Alcoholism: Clinical and Experimental Research*, 37(4), 539-549.

10. **Fullagar H.H.K. et al.** (2015). Sleep and athletic performance: the effects of sleep loss and travel on exercise performance and recovery. *Sports Medicine*, 45(2), 161-186.

11. **Gabbett T.J.** (2016). The training-injury prevention paradox. *British Journal of Sports Medicine*, 50(5), 273-280.

12. **Gooley J.J. et al.** (2011). Exposure to room light before bedtime suppresses melatonin onset. *Journal of Clinical Endocrinology & Metabolism*, 96(3), E463-472.

13. **Harrison Y. & Horne J.A.** (2000). The impact of sleep deprivation on decision making. *Journal of Sleep Research*, 9(1), 45-54.

14. **Hausswirth C. & Mujika I.** (eds) (2013). *Recovery for Performance in Sport*. Human Kinetics.

15. **Higgins T.R., Greene D.A. & Baker M.K.** (2017). Effects of cold water immersion and contrast water therapy: a systematic review and meta-analysis. *Journal of Strength and Conditioning Research*, 31(5), 1443-1460.

16. **Hooper S.L. & Mackinnon L.T.** (1995). Monitoring overtraining in athletes. *Sports Medicine*, 20(5), 321-327.

17. **Kellmann M. et al.** (2018). Recovery and Performance in Sport: Consensus Statement. *International Journal of Sports Physiology and Performance*, 13(2), 240-245.

18. **Mah C.D. et al.** (2011). The effects of sleep extension on the athletic performance of collegiate basketball players. *Sleep*, 34(7), 943-950.

19. **Meeusen R. et al.** (2013). Prevention, diagnosis, and treatment of the overtraining syndrome. *Medicine & Science in Sports & Exercise*, 45(1), 186-205.

20. **Milewski M.D. et al.** (2014). Chronic lack of sleep is associated with increased sports injuries in adolescent athletes. *Journal of Pediatric Orthopedics*, 34(2), 129-133.

21. **Mujika I.** (2009). *Tapering and Peaking for Optimal Performance*. Human Kinetics.

22. **Phillips S.M. & Van Loon L.J.C.** (2011). Dietary protein for athletes: From requirements to optimum adaptation. *Journal of Sports Sciences*, 29(S1), S29-S38.

23. **Plews D.J. et al.** (2013). Heart rate variability in elite triathletes. *European Journal of Applied Physiology*, 113(11), 2765-2773.

24. **Roberts L.A. et al.** (2015). Post-exercise cold water immersion attenuates acute anabolic signalling. *Journal of Physiology*, 593(18), 4285-4301.

25. **Rosekind M.R. et al.** (1995). Alertness management: strategic naps in operational settings. *Journal of Sleep Research*, 4(S2), 62-66.

26. **Sawka M.N. et al.** (2007). ACSM position stand: Exercise and fluid replacement. *Medicine & Science in Sports & Exercise*, 39(2), 377-390.

27. **Stokes K.A. et al.** (2013). Temporal patterns of match-play and recovery in rugby union players. *European Journal of Sport Science*, 13(6), 659-665.

28. **Thomas D.T., Erdman K.A. & Burke L.M.** (2016). Position of the Academy of Nutrition and Dietetics, Dietitians of Canada, and the ACSM: Nutrition and Athletic Performance. *Journal of the Academy of Nutrition and Dietetics*, 116(3), 501-528.

29. **Twist C. & Highton J.** (2013). Monitoring fatigue and recovery in rugby league players. *International Journal of Sports Physiology and Performance*, 8(5), 467-474.

30. **Van Cauter E. & Plat L.** (1996). Physiology of growth hormone secretion during sleep. *Journal of Pediatrics*, 128(5), S32-S37.

31. **Versey N.G., Halson S.L. & Dawson B.T.** (2013). Water immersion recovery for athletes. *Sports Medicine*, 43(11), 1101-1130.

32. **Walker M.P.** (2017). *Why We Sleep*. Scribner.

---

*Dernière mise à jour : 2026-02-24 | Version : 1.0.0*
*Domaines couverts : physiologie de la récupération, sommeil, protocoles post-match (CWI, contraste, actif), HRV, wellness monitoring, nutrition de récupération, signaux d'alerte.*
*Fichiers complémentaires : `periodization.md`, `nutrition.md` (à venir), `strength-methods.md` (à venir).*
