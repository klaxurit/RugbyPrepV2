# Prompt Stitch - Design Rugby/Sport/Coaching pour RugbyPrepV2

Une application mobile-first de préparation physique pour le rugby avec un design dynamique, énergique et orienté coaching sportif. L'interface doit maximiser l'information visible tout en restant claire et facile à utiliser.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Mobile-first
- Theme: Light, sportif, énergique, coaching-oriented
- Background: Blanc cassé (#faf9f7) pour fond principal, avec des accents verts rugby (#1a5f3f) et orange dynamique (#ff6b35)
- Primary Accent: Vert Rugby (#1a5f3f) pour boutons principaux, CTA, et éléments de navigation actifs
- Secondary Accent: Orange Dynamique (#ff6b35) pour highlights, badges de progression, et éléments d'action urgents
- Success: Vert Émeraude (#10b981) pour indicateurs positifs et validations
- Warning: Orange Ambré (#f59e0b) pour alertes et fatigue élevée
- Text Primary: Gris Foncé (#1f2937) pour titres et texte principal
- Text Secondary: Gris Moyen (#6b7280) pour sous-titres et texte secondaire
- Surface: Blanc (#ffffff) pour cartes et conteneurs avec ombres subtiles
- Surface Elevated: Blanc (#ffffff) avec ombre portée légère pour élévation
- Typography: Police sans-serif moderne, bold pour titres (font-weight: 800), regular pour corps (font-weight: 400)
- Buttons: Arrondis généreux (16px border-radius), padding généreux, ombres subtiles pour profondeur
- Cards: Arrondis (24px border-radius), bordures subtiles, ombres douces
- Icons: Style linéaire moderne avec remplissage pour éléments actifs
- Spacing: Espacement généreux (16px base, 24px pour sections, 32px pour groupes majeurs)

**Éléments de Design Rugby/Sport:**
- Utiliser des formes géométriques dynamiques (lignes diagonales subtiles, formes de terrain de rugby)
- Badges et indicateurs avec style "jersey number" (chiffres bold dans des cercles)
- Progression visuelle avec barres et indicateurs de performance
- Couleurs inspirées du terrain de rugby (vert, blanc, orange pour la dynamique)
- Typographie bold et confiante pour transmettre force et détermination
- Micro-interactions subtiles pour feedback tactile

**Page Structure - HomePage:**

1. **Header:** 
   - Logo "RugbyPrep" en haut gauche avec badge de semaine actuelle
   - Avatar utilisateur avec badge de club en haut droite
   - Fond blanc avec bordure inférieure subtile

2. **Hero Section - Séance du Jour:**
   - Grande carte avec fond dégradé vert rugby vers orange
   - Badge de semaine (W1-W8 ou DELOAD) en badge circulaire style numéro de maillot
   - Titre principal bold "Prêt à t'entraîner ?" ou message motivationnel
   - Métriques clés: durée estimée (~55 min), nombre de séances/semaine
   - Bouton CTA principal "Commencer" avec icône play, style bold et énergique
   - Effets visuels: formes géométriques subtiles en arrière-plan

3. **Stats Dashboard - Récapitulatif:**
   - Grille 3 colonnes avec cartes compactes
   - Carte 1: Semaine actuelle (W1-W8) avec icône calendrier
   - Carte 2: Niveau de fatigue (OK/Élevée) avec indicateur coloré (vert/orange)
   - Carte 3: Progression séances (X/Y) avec icône trending
   - Style: Cartes blanches avec bordures subtiles, icônes colorées dans cercles

4. **Quick Access - Accès Rapide:**
   - Grille 3 colonnes avec grandes cartes cliquables
   - Programme (icône haltères), Semaine (icône calendrier), Progression (icône graphique)
   - Chaque carte avec icône colorée, label, et effet hover subtil
   - Style: Cartes blanches avec ombres légères, icônes dans cercles colorés

5. **Recent History - Dernières Séances:**
   - Liste verticale des 2 dernières séances
   - Chaque item avec: icône type séance, nom séance, date, badge fatigue
   - Lien "Tout voir" vers historique complet
   - Style: Carte blanche avec liste, badges colorés pour fatigue

6. **Bottom Navigation:**
   - Barre fixe en bas avec 4 onglets: Accueil, Semaine, Historique, Profil
   - Icônes avec état actif (vert rugby) et inactif (gris)
   - Fond blanc avec bordure supérieure, backdrop blur

**Page Structure - ProgramPage:**

1. **Header:**
   - Bouton retour, titre "Programme" avec sous-titre "Upper · W1"
   - Boutons profil et objectifs en haut droite

2. **Week Selector:**
   - Chips horizontaux scrollables pour sélectionner semaine (W1-W8, DELOAD)
   - Chip actif: fond vert rugby avec texte blanc
   - Chips inactifs: fond blanc avec bordure grise

3. **Phase Info Banner:**
   - Bannière sombre avec info bloc (FORCE/HYPERTROPHIE), semaine du cycle, position rugby
   - Style: Fond gris foncé avec texte clair, icône info

4. **View Mode Toggle:**
   - Toggle entre "Compact" et "Détail"
   - Style: Boutons avec fond sombre pour mode actif

5. **Fatigue Selector:**
   - Carte avec sélection fatigue (OK/Élevée)
   - Boutons avec indicateurs visuels colorés

6. **Session Details:**
   - Vue détaillée de la séance avec exercices, séries, répétitions
   - Indicateurs de progression et recommandations
   - Warnings et validations visuelles

**Page Structure - WeekPage:**

1. **Header:** Similaire à ProgramPage avec titre "Plan Semaine"

2. **Week Selector:** Chips horizontaux pour navigation entre semaines

3. **Phase Info:** Bannière avec contexte du bloc et semaine

4. **Weekly Banner:**
   - Message contextuel selon la semaine (fin de bloc, décharge, objectif)
   - Style: Bannière colorée avec texte bold

5. **Sessions List:**
   - Liste des séances de la semaine (Upper, Lower, Full)
   - Chaque session avec: type, durée, statut, bouton d'action
   - Indicateurs visuels de progression et fatigue

6. **Session Cards:**
   - Cartes expansibles avec détails des exercices
   - Métriques de performance et recommandations

**Contraintes UX:**
- Maximiser l'information visible sans surcharger
- Hiérarchie visuelle claire avec typographie bold pour éléments importants
- Espacement généreux pour respiration visuelle
- Couleurs cohérentes pour feedback (vert=positif, orange=attention, rouge=alerte)
- Micro-interactions pour feedback utilisateur
- Design responsive mobile-first
- Accessibilité: contrastes suffisants, tailles de texte lisibles
