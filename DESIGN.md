# DESIGN.md - RugbyPrepV2

Design System pour l'application RugbyPrepV2 - Préparation physique rugby avec UX/UI orienté rugby/sport/coaching.

## Vue d'ensemble

RugbyPrepV2 est une application mobile-first de préparation physique pour le rugby avec un design dynamique, énergique et orienté coaching sportif. L'interface maximise l'information visible tout en restant claire et facile à utiliser.

## Design System

### Plateforme
- **Platform**: Web, Mobile-first
- **Device Type**: MOBILE (780px width, hauteur variable)
- **Theme**: Light, sportif, énergique, coaching-oriented

### Palette de couleurs

#### Couleurs principales
- **Background**: Blanc cassé (#faf9f7) - Fond principal de l'application
- **Surface**: Blanc (#ffffff) - Cartes et conteneurs avec ombres subtiles
- **Surface Elevated**: Blanc (#ffffff) avec ombre portée légère pour élévation

#### Couleurs d'accentuation
- **Primary Accent**: Vert Rugby (#1a5f3f / #1a6040 / #1a603b) - Boutons principaux, CTA, navigation active
- **Secondary Accent**: Orange Dynamique (#ff6b35) - Highlights, badges de progression, actions urgentes

#### Couleurs sémantiques
- **Success**: Vert Émeraude (#10b981) - Indicateurs positifs, validations, progression
- **Warning**: Orange Ambré (#f59e0b) - Alertes, fatigue élevée, attention requise
- **Error**: (Non défini explicitement, utiliser orange/rouge selon contexte)

#### Typographie
- **Text Primary**: Gris Foncé (#1f2937) - Titres et texte principal
- **Text Secondary**: Gris Moyen (#6b7280) - Sous-titres et texte secondaire
- **Text Muted**: Gris Clair - Placeholders et texte désactivé

### Typographie

- **Font Family**: Lexend (sans-serif moderne)
- **Font Weight**: 
  - Bold (800) pour titres et éléments importants
  - Regular (400) pour corps de texte
- **Tracking**: Tight pour titres, normal pour texte

### Composants

#### Boutons
- **Border Radius**: 16px (arrondis généreux)
- **Padding**: Généreux pour facilité d'interaction
- **Shadows**: Ombres subtiles pour profondeur
- **Primary**: Fond vert rugby (#1a5f3f) avec texte blanc
- **Secondary**: Fond blanc avec bordure et texte vert rugby
- **Ghost**: Texte uniquement, pas de fond

#### Cartes (Cards)
- **Border Radius**: 24px (très arrondis)
- **Background**: Blanc (#ffffff)
- **Border**: Subtile (gris clair) ou ombre douce
- **Padding**: 16-24px selon contenu
- **Elevation**: Ombres légères pour hiérarchie

#### Badges
- **Style**: "Jersey number" - Chiffres bold dans des cercles
- **Sizes**: Petit (indicateurs), moyen (badges), grand (hero badges)
- **Colors**: Vert rugby (actif), orange (attention), vert émeraude (succès)

#### Navigation
- **Bottom Nav**: Barre fixe en bas, 4 onglets
- **Active State**: Vert rugby (#1a5f3f)
- **Inactive State**: Gris (#slate-300)
- **Icons**: Style linéaire moderne avec remplissage pour actif

### Espacement

- **Base**: 16px (espacement standard)
- **Sections**: 24px (entre sections principales)
- **Groups**: 32px (entre groupes majeurs)
- **Compact**: 8px (éléments proches)
- **Generous**: 48px (séparations importantes)

### Éléments de Design Rugby/Sport

#### Formes géométriques
- Lignes diagonales subtiles en arrière-plan
- Formes inspirées du terrain de rugby
- Dégradés vert-orange pour dynamisme

#### Indicateurs visuels
- Badges style "numéro de maillot" (chiffres bold dans cercles)
- Barres de progression avec couleurs cohérentes
- Indicateurs de performance visuels

#### Micro-interactions
- Feedback tactile sur interactions
- Transitions subtiles pour changements d'état
- Animations légères pour engagement

## Structure des pages

### HomePage (Accueil)
- Header avec logo et avatar
- Hero Section avec carte dégradé vert-orange
- Stats Dashboard (3 colonnes)
- Quick Access (3 colonnes)
- Recent History (liste)
- Bottom Navigation

### ProgramPage (Programme)
- Header avec navigation
- Week Selector (chips horizontaux)
- Phase Info Banner
- View Mode Toggle
- Fatigue Selector
- Session Details avec exercices

### WeekPage (Plan Semaine)
- Header avec navigation
- Week Selector
- Phase Info
- Weekly Banner (message contextuel)
- Sessions List (cartes expansibles)
- Session Cards avec détails

### HistoryPage (Historique)
- Header avec bouton effacer
- Stats Rapides (2 colonnes)
- Séances List (chronologique)
- Cartes expansibles avec détails exercices

### ProgressPage (Progression)
- Header
- Résumé Rapide (3 colonnes: hausse/baisse/stable)
- Top Progressions (liste avec indicateurs)
- Exercices Manquants
- Graphiques de progression

### ProfilePage (Profil)
- Header
- Avatar Section (grande carte)
- Informations (grille 3 colonnes)
- Statistiques (métriques horizontales)
- Paramètres (liste avec icônes)

## Principes UX

### Hiérarchie visuelle
- Typographie bold (800) pour éléments importants
- Couleurs cohérentes pour feedback (vert=positif, orange=attention)
- Espacement généreux pour respiration visuelle

### Maximisation d'information
- Grilles compactes mais lisibles
- Cartes expansibles pour détails
- Indicateurs visuels pour métriques clés

### Accessibilité
- Contrastes suffisants (WCAG AA minimum)
- Tailles de texte lisibles (minimum 14px)
- Zones de touch généreuses (minimum 44x44px)

### Responsive
- Mobile-first approach
- Breakpoints adaptatifs si nécessaire
- Navigation optimisée pour mobile

## Références Stitch

- **Project ID**: 15181571559761384825
- **Project Name**: projects/15181571559761384825
- **Theme**: LIGHT, Lexend, ROUND_FULL, customColor #1a6040, saturation 3

## Écrans générés

1. **HomePage**: `5fe97c9ed53a4bfc86ac42795afd69e4` - RugbyPrep Dynamic Home Screen
2. **ProgramPage**: `653506a47b11448b94b7155dc067e02a` - RugbyPrep Program Screen
3. **WeekPage**: `2747b7c91c67492694509b59da84546d` - RugbyPrep Weekly Plan Dynamic View
4. **HistoryPage**: `d69ba701765048e7950f33c5e96c08ad` - RugbyPrep History Dynamic View
5. **ProgressPage**: `3484ed98d43441629a68b690b81a87f3` - RugbyPrep Progression Tracking
6. **ProfilePage**: `4a1caa1ed8a84d5abc6e4ba69b75f0fc` - RugbyPrep Dynamic Profile Screen

## Utilisation pour génération future

Lors de la génération de nouveaux écrans avec Stitch, inclure cette section dans le prompt:

```
DESIGN SYSTEM:
- Platform: Mobile-first
- Theme: Light, sportif, énergique
- Background: #faf9f7
- Primary: #1a5f3f (vert rugby)
- Secondary: #ff6b35 (orange dynamique)
- Success: #10b981
- Warning: #f59e0b
- Text: #1f2937
- Surface: #ffffff
- Typography: Sans-serif bold (800) pour titres
- Buttons: Arrondis 16px
- Cards: Arrondis 24px
```
