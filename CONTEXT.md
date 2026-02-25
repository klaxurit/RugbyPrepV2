# RugbyPrep V2 — Context

## Profil utilisateur cible
- Joueur amateur, club fédéral FFR, 2-3 séances S&C/semaine + entraînements rugby
- Saison française standard : reprise août, compétition septembre → mai
- Niveau : intermédiaire (1-5 ans de pratique S&C structurée)

## Architecture générale
- Couche algo (existante) : buildWeekProgram → sessions déterministes, gratuites, rapides
- Couche IA (à construire) : Supabase Edge Functions → Claude API, KB injectée en contexte
- Pattern clé : l'algorithme génère la structure, l'IA explique et conseille par-dessus
- KB scientifique : `src/knowledge/` (~2840 lignes, 157 refs) — non encore connectée

## Cycle de programmation
- 8 semaines : FORCE (W1-W4) → POWER (W5-W8) → DELOAD après chaque phase
- Gaps identifiés : pas de phase hypertrophie off-season, pas de mode in-season maintenance
- Ratio déload : 4:1 validé hors compétition / 3:1 recommandé en saison compétitive

## Deload & Fatigue Management (Research-backed)
- Rugby load varie fortement (matchs, collisions, sommeil), donc le deload doit rester adaptatif.
- Cycle simple recommandé: 3-4 semaines de progression puis 1 semaine DELOAD (ex: après W4).
- En DELOAD on garde la même structure de séance, mais on baisse surtout le stress: volume réduit et marge augmentée.
- Déload contextuel déjà implémenté : shouldRecommendDeload() déclenche si 2 séances FATIGUE consécutives.

## Base de connaissance (KB)
- `src/knowledge/README.md` : index complet + instructions d'utilisation pour l'IA
- Fiabilité : principes et directions des effets solides. Vérifier valeurs précises sur PubMed avant usage médical.

## Sécurité utilisateur (non-négociable)
- Toute douleur cervicale + signes neurologiques → message d'arrêt immédiat + médecin
- Protocole commotion World Rugby 6 étapes dans injury-prevention.md
- ACWR > 1.5 → alerte de surcharge (à implémenter)
- ≥ 3 signaux de fatigue simultanés → déload recommandé forcé (à implémenter)
