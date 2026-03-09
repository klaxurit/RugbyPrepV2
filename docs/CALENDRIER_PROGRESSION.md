# Calendrier et suivi de progression

## Objectif

Avoir une vue calendrier pour :
- **Savoir où en est l’utilisateur** (semaine du cycle, séances faites / à faire)
- **Suivre la progression** (quels jours des séances ont été réalisées)
- **Rendre la position dans le cycle lisible** (optionnel : lier `H1–H4`, `W1–W8` et `DELOAD` à des dates réelles)

---

## Données existantes

- **`useHistory()`** : `SessionLog[]` avec `dateISO`, `week`, `sessionType`, `fatigue`  
  → On sait **quand** une séance a été faite (date réelle) et **quelle semaine de cycle** (`H1–H4`, `W1–W8`, `DELOAD`).
- **`useWeek()`** : semaine de cycle actuelle (`week`, `lastNonDeloadWeek`)  
  → Pas de lien avec une date calendrier pour l’instant (choix manuel de la `CycleWeek`).
- **`useBlockLogs()`** : détail des blocs/exercices enregistrés par séance.

On peut déjà construire un **calendrier des séances réalisées** (vue “passé”) sans rien changer au modèle de données.

---

## Bonnes pratiques

1. **Une source de vérité**  
   Les séances réalisées = `useHistory()` (déjà persisté en localStorage). Le calendrier ne fait qu’afficher / filtrer ces données.

2. **Ne pas surcharger l’UI**  
   - Vue mois : indicateurs discrets (points, couleurs, badge “2” pour 2 séances).  
   - Clic sur un jour : détail (liste des séances du jour) ou lien vers Historique filtré.

3. **Mobile-first**  
   Grille mois lisible au doigt (jours cliquables), pas besoin d’une lib lourde pour commencer.

4. **Accessibilité**  
   Labels pour les indicateurs (ex. “3 séances réalisées”), contraste suffisant pour les couleurs (vert rugby / orange).

5. **Performance**  
   Si on ajoute plus tard une “date de début de cycle”, la dériver une fois (ex. dans un hook ou contexte) plutôt que de recalculer partout.

---

## Options techniques

### 1. Calendrier “réalisé” uniquement (recommandé en premier)

- **Contenu** : grille du mois en cours (ou mois sélectionné) avec des marqueurs sur les jours où il y a au moins une séance dans `logs` (en filtrant par `dateISO`).
- **Interaction** : clic sur un jour → modal ou page détail avec les séances de ce jour (type, semaine de cycle, fatigue) ou lien vers Historique avec filtre date.
- **Implémentation** :  
  - Soit **composant maison** (grille 7×5/6, `date-fns` ou `Intl` pour jours du mois et locale FR).  
  - Soit **lib légère** (ex. `react-day-picker` en mode “month only” + marqueurs personnalisés).
- **Avantage** : pas de nouveau modèle, pas de “date de début de cycle”, tout repose sur `useHistory()`.

### 2. Calendrier avec “semaine réelle” (où il en est vraiment)

- **Idée** : lier la **semaine de cycle** (`H1–H4`, `W1–W8`, `DELOAD`) à des **dates réelles**.
- **Données à ajouter** : une **date de début de cycle** (ex. stockée en profil ou dans `useWeek`). À partir de là, on dérive :  
  - “Aujourd’hui” → semaine de cycle courante.  
  - Chaque jour du calendrier → semaine de cycle + “séances prévues” si on définit des jours types (ex. “3 séances/sem : lun, mer, ven”).
- **Affichage** :  
  - Jours passés : séances réalisées (comme en 1).  
  - Jour courant : indication “Semaine W2”, “2/3 séances faites cette semaine”.  
  - Optionnel : petits indicateurs “prévu” sur les jours à venir (selon jours d’entraînement préférés).
- **Bonnes pratiques** :  
  - Un seul champ “cycleStartDate” (ou “currentWeekStartDate”) ; tout le reste en dérivé.  
  - Si l’utilisateur change de semaine manuellement, on peut soit mettre à jour cette date, soit garder la date et seulement ajuster l’affichage “semaine courante” (à trancher selon le produit).

### 3. Outils / librairies

- **Sans lib** : grille mois en CSS (grid 7 colonnes), `date-fns` pour `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `isSameDay`, `format` (FR). Léger et maîtrisé.
- **react-day-picker** (v8) : composant calendrier accessible, on peut n’afficher que le mois et décorer les jours (modifiers pour “jours avec séances”). Bon compromis.
- **@fullcalendar/react** : très complet (agenda, semaine, mois) mais plus lourd ; à réserver si tu veux une vue type “agenda” avec créneaux.
- **Reco** : commencer en **composant maison + date-fns** pour la vue “mois + marqueurs par jour”, puis éventuellement passer à `react-day-picker` si tu veux plus d’interactions (sélection, navigation mois, etc.).

---

## Proposition de mise en œuvre

### Phase 1 – Calendrier des séances réalisées

1. **Données** : uniquement `useHistory()`. Pour chaque jour du mois, filtrer `logs` où `dateISO` tombe ce jour-là (comparer en date, pas en heure).
2. **Écran** :  
   - Soit une **section “Calendrier”** sur la page **Progression** ou **Historique**,  
   - Soit un **onglet / page dédiée** “Calendrier” (avec la bottom nav ou depuis Accueil / Semaine).
3. **UI** :  
   - Grille du mois (titre “Janvier 2026”, flèches mois précédent/suivant).  
   - Jours avec au moins une séance : style distinct (point vert, ou fond léger #1a5f3f/10) + optionnel badge “2” si plusieurs séances.  
   - Clic jour : afficher sous le calendrier la liste des séances de ce jour (type, semaine cycle, fatigue) ou ouvrir Historique avec filtre sur cette date.
4. **Outils** : `date-fns` pour les calculs de dates (si pas déjà en dépendance, l’ajouter).

### Phase 2 (optionnel) – “Où j’en suis” avec dates réelles

1. **Profil ou réglage** : champ “Date de début du cycle” (date picker ou “Démarrer ce cycle aujourd’hui”). Stockage : même clé que `useWeek` ou nouveau champ dans le profil.
2. **Dérivation** :  
   - À partir de cette date, calculer pour chaque jour : `CycleWeek` et “numéro de semaine dans le cycle”.  
   - Afficher sur la page Semaine ou Accueil : “Semaine 2 (10–16 fév)” au lieu de seulement “W2”.
3. **Calendrier** :  
   - Garder les marqueurs “séances réalisées” comme en phase 1.  
   - Optionnel : afficher sur les jours à venir des pastilles “prévu” si tu introduis des “jours d’entraînement” (ex. lun/mer/ven).

---

## Résumé

- **Flow** : Accueil → Programme → Semaine → Séance est en place ; le calendrier ne le remplace pas, il le complète en donnant une vue “où j’en suis dans le temps”.
- **Bonnes pratiques** : une source de vérité (history), UI simple (mois + marqueurs), mobile-first, optionnellement une date de début de cycle pour lier la `CycleWeek` au calendrier.
- **Outils recommandés** : `date-fns` + composant maison (grille mois) ou `react-day-picker` pour un calendrier accessible avec peu de dépendances.
- **Procédure** : Phase 1 = calendrier des séances réalisées (lecture seule sur `useHistory`) ; Phase 2 = date de début de cycle + affichage “semaine réelle” et, si besoin, indicateurs “prévu” sur le calendrier.
